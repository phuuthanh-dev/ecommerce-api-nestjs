import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { DeviceType, RefreshTokenType, RegisterBodyType, RoleType, VerificationCodeType } from './auth.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { WhereUniqueUserType } from 'src/shared/repositories/shared-user.repo'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Pick<UserType, 'email' | 'name' | 'password' | 'phoneNumber' | 'roleId'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  async createUserIncludeRole(
    user: Pick<UserType, 'email' | 'name' | 'password' | 'phoneNumber' | 'avatar' | 'roleId'>,
  ): Promise<UserType & { role: RoleType }> {
    return this.prismaService.user.create({
      data: user,
      include: {
        role: true,
      },
    })
  }

  async createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'code' | 'type' | 'expiresAt'>,
  ): Promise<VerificationCodeType> {
    // Nếu chưa tồn tại thì tạo mới, nếu tồn tại thì cập nhật code và thời hạn
    return this.prismaService.verificationCode.upsert({
      where: { email_code_type: { email: payload.email, code: payload.code, type: payload.type } },
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
      create: payload,
    })
  }

  async findUniqueVerificationCode(
    uniqueValue:
      | { id: number }
      | {
          email_code_type: {
            email: string
            code: string
            type: TypeOfVerificationCodeType
          }
        },
  ): Promise<VerificationCodeType | null> {
    return this.prismaService.verificationCode.findUnique({
      where: uniqueValue,
    })
  }

  async createRefreshToken(data: { token: string; userId: number; expiresAt: Date; deviceId: number }) {
    return this.prismaService.refreshToken.create({ data })
  }

  async createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> & Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>,
  ) {
    return this.prismaService.device.create({ data })
  }

  async findUniqueUserIncludeRole(
    where: WhereUniqueUserType,
  ): Promise<(UserType & { role: RoleType }) | null> {
    return this.prismaService.user.findUnique({
      where,
      include: {
        role: true,
      },
    })
  }

  async findUniqueRefreshTokenIncludeUserRole(where: {
    token: string
  }): Promise<(RefreshTokenType & { user: UserType & { role: RoleType } }) | null> {
    return this.prismaService.refreshToken.findUnique({
      where,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  updateDevice(deviceId: number, data: Partial<DeviceType>): Promise<DeviceType> {
    return this.prismaService.device.update({
      where: { id: deviceId },
      data,
    })
  }

  deleteRefreshToken(where: { token: string }): Promise<RefreshTokenType> {
    return this.prismaService.refreshToken.delete({
      where,
    })
  }

  deleteVerificationCode(
    where:
      | { id: number }
      | {
          email_code_type: {
            email: string
            code: string
            type: TypeOfVerificationCodeType
          }
        },
  ): Promise<VerificationCodeType> {
    return this.prismaService.verificationCode.delete({
      where,
    })
  }
}
