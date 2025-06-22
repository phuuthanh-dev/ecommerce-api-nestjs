import { UnprocessableEntityException } from '@nestjs/common'

export const PermissionAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Quyền đã tồn tại',
    path: 'path',
  },
  {
    message: 'Quyền đã tồn tại',
    path: 'method',
  },
])
