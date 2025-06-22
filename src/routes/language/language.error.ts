import { UnprocessableEntityException } from '@nestjs/common'

export const LanguageAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Ngôn ngữ đã tồn tại',
    path: 'id',
  },
])
