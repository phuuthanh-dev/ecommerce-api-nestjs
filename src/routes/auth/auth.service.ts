import { HttpException, Injectable } from '@nestjs/common'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { RolesService } from './roles.service'
import {
  DisableTwoFactorBodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from './auth.model'
import { AuthRepository } from './auth.repo'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import envConfig from 'src/shared/config'
import ms from 'ms'
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'
import {
  EmailAlreadyExistsException,
  EmailNotExistsException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidTOTPAndCodeException,
  InvalidTOTPException,
  PasswordIncorrectException,
  RefreshTokenInvalidException,
  TOTPAlreadySetupException,
  TOTPNotSetupException,
} from './error.model'
import { ExpiredOTPException } from './error.model'
import { TwoFactorService } from 'src/shared/services/2fa.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.REGISTER,
      })
      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          name: body.name,
          phoneNumber: body.phoneNumber,
          password: hashedPassword,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_code_type: {
            email: body.email,
            code: body.code,
            type: TypeOfVerificationCode.REGISTER,
          },
        }),
      ])
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistsException
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (body.type === TypeOfVerificationCode.REGISTER && user) {
      throw EmailAlreadyExistsException
    }
    if (body.type === TypeOfVerificationCode.FORGOT_PASSWORD && !user) {
      throw EmailNotExistsException
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
      throw FailedToSendOTPException
    }
    // 4. Trả về mã OTP
    return { message: 'Mã OTP đã được gửi đến email' }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    // 1. Lấy thông tin user, kiểm tra email có tồn tại trong database không
    const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })

    if (!user) {
      throw EmailNotExistsException
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw PasswordIncorrectException
    }

    // 2. Nếu user đã setup 2FA, kiểm tra mã OTP có hợp lệ không
    if (user.totpSecret) {
      // Nếu không có mã OTP Code và Code thì trả về lỗi
      if (!body.totpCode && !body.code) {
        throw InvalidTOTPAndCodeException
      }

      // Kiểm tra mã OTP có hợp lệ không
      if (body.totpCode) {
        const isTOTPValid = this.twoFactorService.verifyTOTP({
          email: body.email,
          token: body.totpCode,
          secret: user.totpSecret,
        })
        if (!isTOTPValid) {
          throw InvalidTOTPException
        }
      } else if (body.code) {
        // Kiểm tra mã OTP có hợp lệ không
        await this.validateVerificationCode({
          email: body.email,
          code: body.code,
          type: TypeOfVerificationCode.LOGIN,
        })
      }
    }

    // 3. Tạo device
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })

    // 4. Tạo token
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
        throw RefreshTokenInvalidException
      }
      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
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
      throw RefreshTokenInvalidException
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
        throw RefreshTokenInvalidException
      }
      throw RefreshTokenInvalidException
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, code, newPassword } = body
    // 1. Kiểm tra email có tồn tại trong database không
    const user = await this.sharedUserRepository.findUnique({ email })
    if (!user) {
      throw EmailNotExistsException
    }
    // 2. Kiểm tra mã OTP có hợp lệ không
    await this.validateVerificationCode({
      email,
      code,
      type: TypeOfVerificationCode.FORGOT_PASSWORD,
    })
    // 3. Cập nhật mật khẩu mới và xóa đi OTP
    const hashedPassword = await this.hashingService.hash(newPassword)
    await Promise.all([
      this.authRepository.updateUser(
        {
          id: user.id,
        },
        {
          password: hashedPassword,
        },
      ),
      this.authRepository.deleteVerificationCode({
        email_code_type: {
          email,
          code,
          type: TypeOfVerificationCode.FORGOT_PASSWORD,
        },
      }),
    ])
    // 4. Trả về message thành công
    return { message: 'Mật khẩu đã được cập nhật' }
  }

  async setupTwoFactorAuth(userId: number) {
    // 1. Kiểm tra user có tồn tại trong database không
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw EmailNotExistsException
    }
    if (user.totpSecret) {
      throw TOTPAlreadySetupException
    }

    // 2. Tạo secret cho user
    const { secret, uri } = this.twoFactorService.generateOTPSecret(user.email)

    // 3. Cập nhật secret cho user
    await this.authRepository.updateUser(
      {
        id: userId,
      },
      {
        totpSecret: secret,
      },
    )

    // 4. Trả về secret và url
    return { secret, uri }
  }

  async disableTwoFactorAuth({ userId, totpCode, code }: DisableTwoFactorBodyType & { userId: number }) {
    // 1. Kiểm tra user có tồn tại trong database không
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw EmailNotExistsException
    }

    if (!user.totpSecret) {
      throw TOTPNotSetupException
    }

    // 2. Kiểm tra mã OTP có hợp lệ không
    if (totpCode) {
      const isTOTPValid = this.twoFactorService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      })
      if (!isTOTPValid) {
        throw InvalidTOTPException
      }
    } else if (code) {
      await this.validateVerificationCode({
        email: user.email,
        code,
        type: TypeOfVerificationCode.DISABLE_2FA,
      })
    }

    // 3. Cập nhật secret cho user thành null
    await this.authRepository.updateUser(
      {
        id: userId,
      },
      {
        totpSecret: null,
      },
    )

    // 4. Trả về message thành công
    return { message: '2FA đã được vô hiệu hóa' }
  }

  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeOfVerificationCodeType
  }) {
    const verificationCode = await this.authRepository.findUniqueVerificationCode({
      email_code_type: {
        email,
        code,
        type,
      },
    })

    if (!verificationCode) {
      throw InvalidOTPException
    }
    if (verificationCode.expiresAt < new Date()) {
      throw ExpiredOTPException
    }
    return verificationCode
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
