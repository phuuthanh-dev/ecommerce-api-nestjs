import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'

export const InvalidOTPException = new UnprocessableEntityException([
  {
    path: 'code',
    message: 'Mã xác thực không hợp lệ',
  },
])

export const ExpiredOTPException = new UnprocessableEntityException([
  {
    path: 'code',
    message: 'Mã xác thực đã hết hạn',
  },
])

export const FailedToSendOTPException = new UnprocessableEntityException([
  {
    path: 'code',
    message: 'Gửi mã OTP thất bại',
  },
])

export const EmailAlreadyExistsException = new UnprocessableEntityException([
  {
    path: 'email',
    message: 'Email đã tồn tại',
  },
])

export const EmailNotExistsException = new UnprocessableEntityException([
  {
    path: 'email',
    message: 'Email không tồn tại',
  },
])

export const PasswordIncorrectException = new UnprocessableEntityException([
  {
    path: 'password',
    message: 'Mật khẩu không chính xác',
  },
])

export const GoogleLoginFailedException = new UnprocessableEntityException([
  {
    path: 'google',
    message: 'Đăng nhập google thất bại',
  },
])

export const RefreshTokenInvalidException = new UnauthorizedException('Refresh token không hợp lệ')

export const GoogleUserInfoError = new UnprocessableEntityException([
  {
    path: 'google',
    message: 'Lấy thông tin người dùng từ google thất bại',
  },
])