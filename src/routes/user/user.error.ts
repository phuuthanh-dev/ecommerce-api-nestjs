import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common'

export const UserAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Người dùng đã tồn tại',
    path: 'email',
  },
])

export const CannotUpdateAdminUserException = new ForbiddenException('Không thể cập nhật người dùng admin')

export const CannotDeleteAdminUserException = new ForbiddenException('Không thể xóa người dùng admin')

export const CannotSetAdminRoleToUserException = new ForbiddenException('Không thể cập nhật quyền admin cho người dùng')

export const RoleNotFoundException = new UnprocessableEntityException([
  {
    message: 'Quyền không tồn tại',
    path: 'roleId',
  },
])

// Không thể xóa hoặc cập nhật chính bản thân mình
export const CannotUpdateOrDeleteYourselfException = new ForbiddenException(
  'Không thể cập nhật hoặc xóa chính bản thân mình',
)
