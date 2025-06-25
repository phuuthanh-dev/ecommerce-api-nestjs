import { UserSchema } from 'src/shared/models/shared-user.model'
import z from 'zod'

export const UpdateMeBodySchema = UserSchema.pick({
  name: true,
  phoneNumber: true,
  avatar: true,
}).strict()

export const ChangePasswordBodySchema = UserSchema.pick({
  password: true,
})
  .extend({
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100),
  })
  .strict()
  .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mật khẩu mới không khớp',
        path: ['confirmNewPassword'],
      })
    }
  })

export type UpdateMeBodyType = z.infer<typeof UpdateMeBodySchema>
export type ChangePasswordBodyType = z.infer<typeof ChangePasswordBodySchema>
