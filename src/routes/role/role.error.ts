import { UnprocessableEntityException } from '@nestjs/common'

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