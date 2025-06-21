import { createZodDto } from 'nestjs-zod'
import {
  LoginBodySchema,
  LoginResponseSchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RefreshTokenResponseSchema,
  RegisterBodySchema,
  RegisterResponseSchema,
  SendOTPBodySchema,
  GetAuthorizationUrlResponseSchema,
  ForgotPasswordBodySchema,
  TwoFactorSetupResponseSchema,
  DisableTwoFactorBodySchema,
} from './auth.model'

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}

export class RegisterResponseDTO extends createZodDto(RegisterResponseSchema) {}

export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

export class LoginResponseDTO extends createZodDto(LoginResponseSchema) {}

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}

export class RefreshTokenResponseDTO extends createZodDto(RefreshTokenResponseSchema) {}

export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) {}

export class GetAuthorizationUrlResponseDTO extends createZodDto(GetAuthorizationUrlResponseSchema) {}

export class ForgotPasswordBodyDTO extends createZodDto(ForgotPasswordBodySchema) {}

export class TwoFactorSetupResponseDTO extends createZodDto(TwoFactorSetupResponseSchema) {}

export class DisableTwoFactorBodyDTO extends createZodDto(DisableTwoFactorBodySchema) {}