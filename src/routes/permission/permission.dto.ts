import { createZodDto } from 'nestjs-zod'
import {
  GetPermissionDetailResponseSchema,
  GetPermissionsQuerySchema,
  GetPermissionsResponseSchema,
  GetPermissionParamsSchema,
  CreatePermissionBodySchema,
  UpdatePermissionBodySchema,
} from './permission.model'

export class GetPermissionsResponseDTO extends createZodDto(GetPermissionsResponseSchema) {}

export class GetPermissionsQueryDTO extends createZodDto(GetPermissionsQuerySchema) {}

export class GetPermissionParamsDTO extends createZodDto(GetPermissionParamsSchema) {}

export class GetPermissionDetailResponseDTO extends createZodDto(GetPermissionDetailResponseSchema) {}

export class CreatePermissionBodyDTO extends createZodDto(CreatePermissionBodySchema) {}

export class UpdatePermissionBodyDTO extends createZodDto(UpdatePermissionBodySchema) {}
