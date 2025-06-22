import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { LanguageService } from './language.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateLanguageBodyDTO,
  GetLanguageDetailResponseDTO,
  GetLanguageParamsDTO,
  GetLanguagesResponseDTO,
  UpdateLanguageBodyDTO,
} from './language.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResponseDTO } from 'src/shared/dtos/response.dto'

@Controller('language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @ZodSerializerDto(GetLanguagesResponseDTO)
  findAll() {
    return this.languageService.findAll()
  }

  @Get(':languageId')
  @ZodSerializerDto(GetLanguageDetailResponseDTO)
  findById(@Param() params: GetLanguageParamsDTO) {
    return this.languageService.findById(params.languageId)
  }

  @Post()
  @ZodSerializerDto(GetLanguageDetailResponseDTO)
  create(@Body() body: CreateLanguageBodyDTO, @ActiveUser('userId') userId: number) {
    return this.languageService.create({
      data: body,
      createdById: userId,
    })
  }

  @Put(':languageId')
  @ZodSerializerDto(GetLanguageDetailResponseDTO)
  update(
    @Body() body: UpdateLanguageBodyDTO,
    @Param() params: GetLanguageParamsDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.languageService.update({
      id: params.languageId,
      updatedById: userId,
      data: body,
    })
  }

  @Delete(':languageId')
  @ZodSerializerDto(MessageResponseDTO)
  delete(@Param() params: GetLanguageParamsDTO) {
    return this.languageService.delete(params.languageId)
  }
}
