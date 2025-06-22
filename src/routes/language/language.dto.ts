import { createZodDto } from 'nestjs-zod'
import {
  CreateLanguageBodySchema,
  GetLanguageDetailResponseSchema,
  GetLanguageParamsSchema,
  GetLanguagesResponseSchema,
  UpdateLanguageBodySchema,
} from './language.model'

export class GetLanguagesResponseDTO extends createZodDto(GetLanguagesResponseSchema) {}

export class GetLanguageParamsDTO extends createZodDto(GetLanguageParamsSchema) {}

export class GetLanguageDetailResponseDTO extends createZodDto(GetLanguageDetailResponseSchema) {}

export class CreateLanguageBodyDTO extends createZodDto(CreateLanguageBodySchema) {}

export class UpdateLanguageBodyDTO extends createZodDto(UpdateLanguageBodySchema) {}
