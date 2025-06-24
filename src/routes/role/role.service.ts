import { Injectable } from '@nestjs/common'
import { RoleRepository } from './role.repo'
import { CreateRoleBodyType, GetRolesQueryType, UpdateRoleBodyType } from './role.model'
import { ProhibitedActionOnBaseRoleException, RoleAlreadyExistsException, RoleNotFoundException } from './role.error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { NotFoundRecordException } from 'src/shared/error'
import { RoleName } from 'src/shared/constants/role.constant'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async list(pagination: GetRolesQueryType) {
    const data = await this.roleRepository.list(pagination)
    return data
  }

  async findById(id: number) {
    const role = await this.roleRepository.findById(id)
    if (!role) {
      throw RoleNotFoundException
    }
    return role
  }

  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: number }) {
    try {
      const role = await this.roleRepository.create({ data, createdById })
      return role
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException
      }
      throw error
    }
  }

  async update({ id, data, updatedById }: { id: number; data: UpdateRoleBodyType; updatedById: number }) {
    try {
      await this.verifyRole(id)

      const updatedRole = await this.roleRepository.update({ id, updatedById, data })
      return updatedRole
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.verifyRole(id)

      await this.roleRepository.delete({ id, deletedById })
      return {
        message: 'Xóa vai trò thành công',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  private async verifyRole(roleId: number) {
    const role = await this.roleRepository.findById(roleId)
    if (!role) {
      throw NotFoundRecordException
    }
    const baseRoles: string[] = [RoleName.Admin, RoleName.Client, RoleName.Seller]

    if (baseRoles.includes(role.name)) {
      throw ProhibitedActionOnBaseRoleException
    }
  }
}
