import { NotFoundException } from '@nestjs/common'

export const NotFoundRecordException = new NotFoundException('Không tìm thấy bản ghi')
