import { SetMetadata } from '@nestjs/common'
import { AuthType, ConditionGuard } from '../constants/auth.constant'

export const AUTH_TYPE_KEY = 'authType'

export type AuthTypeDecoratorPayload = {
  authTypes: AuthType[]
  options: { condition: ConditionGuard }
}

export const Auth = (authTypes: AuthType[], options?: { condition: ConditionGuard }) =>
  SetMetadata(AUTH_TYPE_KEY, { authTypes, options: options ?? { condition: ConditionGuard.And } })

export const IsPublic = () => Auth([AuthType.None])
