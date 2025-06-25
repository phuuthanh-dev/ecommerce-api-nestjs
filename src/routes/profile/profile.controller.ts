import { Body, Controller, Get, Put } from '@nestjs/common'
import { ProfileService } from './profile.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { GetUserProfileResponseDTO, UpdateProfileResponseDTO } from 'src/shared/dtos/shared-user-dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ChangePasswordBodyDTO, UpdateMeBodyDTO } from './profile.dto'
import { MessageResponseDTO } from 'src/shared/dtos/response.dto'

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ZodSerializerDto(GetUserProfileResponseDTO)
  getProfile(@ActiveUser('userId') userId: number) {
    return this.profileService.getProfile(userId)
  }

  @Put()
  @ZodSerializerDto(UpdateProfileResponseDTO)
  updateProfile(@Body() body: UpdateMeBodyDTO, @ActiveUser('userId') userId: number) {
    return this.profileService.updateProfile({ userId, body })
  }

  @Put('change-password')
  @ZodSerializerDto(MessageResponseDTO)
  changePassword(@Body() body: ChangePasswordBodyDTO, @ActiveUser('userId') userId: number) {
    return this.profileService.changePassword({ userId, body })
  }
}
