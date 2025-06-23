import { createZodDto } from 'nestjs-zod'
import { CreateRoleBodySchema, CreateRoleResponseSchema, GetRoleDetailResponseSchema, GetRolesQuerySchema, GetRolesResponseSchema, UpdateRoleBodySchema } from './role.model'
import { GetRoleParamsSchema } from './role.model'

export class GetRolesResponseDTO extends createZodDto(GetRolesResponseSchema) {}

export class GetRolesQueryDTO extends createZodDto(GetRolesQuerySchema) {}

export class GetRoleParamsDTO extends createZodDto(GetRoleParamsSchema) {}

export class GetRoleDetailResponseDTO extends createZodDto(GetRoleDetailResponseSchema) {}

export class CreateRoleBodyDTO extends createZodDto(CreateRoleBodySchema) {}

export class CreateRoleResponseDTO extends createZodDto(CreateRoleResponseSchema) {}

export class UpdateRoleBodyDTO extends createZodDto(UpdateRoleBodySchema) {}
