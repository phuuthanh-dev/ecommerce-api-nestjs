import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { RoleService } from './role.service'
import {
  CreateRoleBodyDTO,
  CreateRoleResponseDTO,
  GetRoleDetailResponseDTO,
  GetRoleParamsDTO,
  GetRolesQueryDTO,
  GetRolesResponseDTO,
  UpdateRoleBodyDTO,
} from './role.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResponseDTO } from 'src/shared/dtos/response.dto'

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ZodSerializerDto(GetRolesResponseDTO)
  list(@Query() query: GetRolesQueryDTO) {
    return this.roleService.list({
      page: query.page,
      limit: query.limit,
    })
  }

  @Get(':roleId')
  @ZodSerializerDto(GetRoleDetailResponseDTO)
  findById(@Param() params: GetRoleParamsDTO) {
    return this.roleService.findById(params.roleId)
  }

  @Post()
  @ZodSerializerDto(CreateRoleResponseDTO)
  create(@Body() body: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.roleService.create({
      data: body,
      createdById: userId,
    })
  }

  @Put(':roleId')
  @ZodSerializerDto(GetRoleDetailResponseDTO)
  update(@Body() body: UpdateRoleBodyDTO, @Param() params: GetRoleParamsDTO, @ActiveUser('userId') userId: number) {
    return this.roleService.update({
      data: body,
      id: params.roleId,
      updatedById: userId,
    })
  }

  @Delete(':roleId')
  @ZodSerializerDto(MessageResponseDTO)
  delete(@Param() params: GetRoleParamsDTO, @ActiveUser('userId') userId: number) {
    return this.roleService.delete({
      id: params.roleId,
      deletedById: userId,
    })
  }
}
