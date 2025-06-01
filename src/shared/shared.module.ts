import { Global, Module } from '@nestjs/common'
import { PrismaService } from './services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { AuthenticationGuard } from './guards/authentication.guard'
import { AccessTokenGuard } from './guards/access-token.guard'
import { ApiKeyGuard } from './guards/api-key.guard'
import { APP_GUARD } from '@nestjs/core'
import { SharedUserRepository } from './repositories/shared-user.repo'

const sharedServices = [PrismaService, HashingService, TokenService, SharedUserRepository]

@Global()
@Module({
  providers: [...sharedServices, AccessTokenGuard, ApiKeyGuard, {
    provide: APP_GUARD,
    useClass: AuthenticationGuard,
  }],
  exports: sharedServices,
  imports: [JwtModule],
})
export class SharedModule {}
