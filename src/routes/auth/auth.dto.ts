import { createZodDto } from 'nestjs-zod'
import {
  LoginBodySchema,
  LoginResponseSchema,
  RefreshTokenBodySchema,
  RefreshTokenResponseSchema,
  RegisterBodySchema,
  RegisterResponseSchema,
  SendOTPBodySchema,
} from './auth.model'

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}

export class RegisterResponseDTO extends createZodDto(RegisterResponseSchema) {}

export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

export class LoginResponseDTO extends createZodDto(LoginResponseSchema) {}

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}

export class RefreshTokenResponseDTO extends createZodDto(RefreshTokenResponseSchema) {}
