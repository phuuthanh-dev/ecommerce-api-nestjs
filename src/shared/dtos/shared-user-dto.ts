import { createZodDto } from "nestjs-zod";
import { GetUserProfileResponseSchema, UpdateProfileResponseSchema } from "../models/shared-user.model";

export class GetUserProfileResponseDTO extends createZodDto(GetUserProfileResponseSchema) {}

export class UpdateProfileResponseDTO extends createZodDto(UpdateProfileResponseSchema) {}
