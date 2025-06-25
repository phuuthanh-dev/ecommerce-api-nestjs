import { NotFoundException, UnprocessableEntityException } from '@nestjs/common'

export const NotFoundRecordException = new NotFoundException('Không tìm thấy bản ghi')

export const InvalidPasswordException = new UnprocessableEntityException([
  {
    message: 'Mật khẩu không chính xác',
    path: 'password',
  },
])
