import { createZodDto } from 'nestjs-zod'
import {
  CreateUserBodySchema,
  GetUserParamsSchema,
  GetUsersQuerySchema,
  GetUsersResponseSchema,
  UpdateUserBodySchema,
} from './user.model'
import { UpdateProfileResponseDTO } from 'src/shared/dtos/shared-user-dto'

export class GetUsersResponseDTO extends createZodDto(GetUsersResponseSchema) {}

export class GetUsersQueryDTO extends createZodDto(GetUsersQuerySchema) {}

export class GetUserParamsDTO extends createZodDto(GetUserParamsSchema) {}

export class CreateUserBodyDTO extends createZodDto(CreateUserBodySchema) {}

export class UpdateUserBodyDTO extends createZodDto(UpdateUserBodySchema) {}

export class CreateUserResponseDTO extends UpdateProfileResponseDTO {}
