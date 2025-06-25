import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateRoleBodyType,
  GetRolesQueryType,
  GetRolesResponseType,
  RoleWithPermissionsType,
  UpdateRoleBodyType,
} from './role.model'
import { RoleType } from 'src/shared/models/shared-role.model'

@Injectable()
export class RoleRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(pagination: GetRolesQueryType): Promise<GetRolesResponseType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit
    const [totalItems, data] = await Promise.all([
      this.prismaService.role.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.role.findMany({
        where: {
          deletedAt: null,
        },
        skip,
        take,
      }),
    ])
    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  findById(id: number): Promise<RoleWithPermissionsType | null> {
    return this.prismaService.role.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: {
            deletedAt: null,
          },
        },
      },
    })
  }

  create({ createdById, data }: { createdById: number | null; data: CreateRoleBodyType }): Promise<RoleType> {
    return this.prismaService.role.create({
      data: {
        ...data,
        createdById,
      },
    })
  }

  async update({
    id,
    updatedById,
    data,
  }: {
    id: number
    updatedById: number
    data: UpdateRoleBodyType
  }): Promise<RoleType> {
    // Kiểm tra nếu có bất cứ permissionId nào mà đã soft delete thì không cho phép cập nhật
    if (data.permissionIds.length > 0) {
      const permissions = await this.prismaService.permission.findMany({
        where: {
          id: { in: data.permissionIds },
        },
      })
      const deletedPermissions = permissions.filter((permission) => permission.deletedAt)
      if (deletedPermissions.length > 0) {
        const deletedIds = deletedPermissions.map((permission) => permission.id).join(', ')
        throw new BadRequestException(`Không thể cập nhật vai trò với permission đã bị xóa: ${deletedIds}`)
      }
    }
    return this.prismaService.role.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: {
          set: data.permissionIds.map((id) => ({ id })),
        },
        updatedById,
      },
      include: {
        permissions: {
          where: {
            deletedAt: null,
          },
        },
      },
    })
  }

  delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean): Promise<RoleType> {
    return isHard
      ? this.prismaService.role.delete({
          where: {
            id,
          },
        })
      : this.prismaService.role.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            deletedById,
          },
        })
  }
}
