import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common'

export const RoleAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Vai trò đã tồn tại',
    path: 'name',
  },
])

export const RoleNotFoundException = new UnprocessableEntityException([
  {
    message: 'Vai trò không tồn tại',
    path: 'id',
  },
])

export const ProhibitedActionOnBaseRoleException = new ForbiddenException(
  'Không thể thực hiện hành động này trên role cơ bản (ADMIN, CLIENT, SELLER)',
)

export const ProhibitedActionOnAdminRoleException = new ForbiddenException(
  'Không thể thực hiện hành động này trên role ADMIN',
)
