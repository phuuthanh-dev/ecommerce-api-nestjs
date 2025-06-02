import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { DeviceType, RegisterBodyType, RoleType, VerificationCodeType } from './auth.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & Pick<UserType, 'roleId'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  async createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'code' | 'type' | 'expiresAt'>,
  ): Promise<VerificationCodeType> {
    // Nếu chưa tồn tại thì tạo mới, nếu tồn tại thì cập nhật code và thời hạn
    return this.prismaService.verificationCode.upsert({
      where: { email: payload.email },
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
      create: payload,
    })
  }

  async findUniqueVerificationCode(
    uniqueValue:
      | { email: string }
      | { id: number }
      | {
          email: string
          code: string
          type: TypeOfVerificationCodeType
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
    uniqueObject: { email: string } | { id: number },
  ): Promise<(UserType & { role: RoleType }) | null> {
    return this.prismaService.user.findUnique({
      where: uniqueObject,
      include: {
        role: true,
      },
    })
  }
}
