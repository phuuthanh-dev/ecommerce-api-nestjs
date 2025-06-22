import { z } from 'zod'

export const LanguageSchema = z.object({
  id: z.string().max(10),
  name: z.string().max(500),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const GetLanguagesResponseSchema = z.object({
  data: z.array(LanguageSchema),
  totalItems: z.number(),
})

export const GetLanguageParamsSchema = z
  .object({
    languageId: z.string().max(10),
  })
  .strict()

export const GetLanguageDetailResponseSchema = LanguageSchema

export const CreateLanguageBodySchema = LanguageSchema.pick({
  id: true,
  name: true,
}).strict()

export const UpdateLanguageBodySchema = LanguageSchema.pick({
  name: true,
}).strict()

export type LanguageType = z.infer<typeof LanguageSchema>
export type GetLanguagesResponseType = z.infer<typeof GetLanguagesResponseSchema>
export type GetLanguageParamsType = z.infer<typeof GetLanguageParamsSchema>
export type GetLanguageDetailResponseType = z.infer<typeof GetLanguageDetailResponseSchema>
export type CreateLanguageBodyType = z.infer<typeof CreateLanguageBodySchema>
export type UpdateLanguageBodyType = z.infer<typeof UpdateLanguageBodySchema>