import { ConflictException, HttpException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { RolesService } from './roles.service'
import { LoginBodyType, RefreshTokenBodyType, RegisterBodyType, SendOTPBodyType } from './auth.model'
import { AuthRepository } from './auth.repo'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import envConfig from 'src/shared/config'
import ms from 'ms'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const verificationCode = await this.authRepository.findUniqueVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.REGISTER,
      })
      if (!verificationCode) {
        throw new UnprocessableEntityException([
          {
            path: 'code',
            message: 'Invalid verification code',
          },
        ])
      }
      if (verificationCode.expiresAt < new Date()) {
        throw new UnprocessableEntityException([
          {
            path: 'code',
            message: 'Verification code has expired',
          },
        ])
      }
      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      return await this.authRepository.createUser({
        email: body.email,
        name: body.name,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        roleId: clientRoleId,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Email already exists')
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    // 1. Kiểm tra email có tồn tại trong database không
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (user) {
      throw new UnprocessableEntityException([
        {
          path: 'email',
          message: 'Email is already exists',
        },
      ])
    }
    // 2. Tạo mã OTP
    const code = generateOTP()
    await this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
    })
    // 3. Gửi mã OTP đến email
    const { error } = await this.emailService.sendOTP({ email: body.email, code })
    if (error) {
      throw new UnprocessableEntityException([
        {
          path: 'code',
          message: 'Failed to send OTP',
        },
      ])
    }
    // 4. Trả về mã OTP
    return { message: 'Mã OTP đã được gửi đến email' }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })

    if (!user) {
      throw new UnprocessableEntityException([
        {
          path: 'email',
          message: 'Email is not exists',
        },
      ])
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw new UnprocessableEntityException([
        {
          path: 'password',
          message: 'Password is incorrect',
        },
      ])
    }

    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })
    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })

    return tokens
  }

  async handleRefreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Kiểm tra refreshToken có tồn tại trong database không
      const refreshTokenInDb = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
        token: refreshToken,
      })
      if (!refreshTokenInDb) {
        throw new UnauthorizedException('Refresh token đã được sử dụng')
      }
      const {
        deviceId,
        user: { roleId, name: roleName },
      } = refreshTokenInDb

      // 3. Cập nhật lại thông tin device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        userAgent,
        ip,
      })

      // 4. Xóa refreshToken cũ
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })

      // 5. Tạo mới accessToken và refreshToken
      const $tokens = this.generateTokens({ userId, deviceId, roleId, roleName })
      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $tokens])
      return tokens
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException('Refresh token không hợp lệ')
    }
  }

  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken)

      // 2. Xóa refreshToken trong database
      const deletedRefreshToken = await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })

      // 3. Cập nhật device là đã logout
      await this.authRepository.updateDevice(deletedRefreshToken.deviceId, {
        isActive: false,
      })
      return { message: 'Đăng xuất thành công' }
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token đã được sử dụng')
      }
      throw new UnauthorizedException()
    }
  }

  async generateTokens({ userId, deviceId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({
        userId,
      }),
    ])
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      deviceId,
    })
    return { accessToken, refreshToken }
  }
}
