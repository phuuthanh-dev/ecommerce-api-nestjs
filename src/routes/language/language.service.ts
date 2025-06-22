import { Injectable } from '@nestjs/common'
import { LanguageRepository } from './language.repo'
import { NotFoundRecordException } from 'src/shared/error'
import { CreateLanguageBodyType, UpdateLanguageBodyType } from './language.model'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { LanguageAlreadyExistsException } from './language.error'

@Injectable()
export class LanguageService {
  constructor(private readonly languageRepository: LanguageRepository) {}

  async findAll() {
    const data = await this.languageRepository.findAll()
    return {
      data,
      totalItems: data.length,
    }
  }

  async findById(id: string) {
    const language = await this.languageRepository.findById(id)
    if (!language) {
      throw NotFoundRecordException
    }
    return language
  }

  async create({ data, createdById }: { data: CreateLanguageBodyType; createdById: number }) {
    try {
      return await this.languageRepository.create({ data, createdById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw LanguageAlreadyExistsException
      }
      throw error
    }
  }

  async update({ id, updatedById, data }: { id: string; updatedById: number; data: UpdateLanguageBodyType }) {
    try {
      const language = await this.languageRepository.update({
        id,
        updatedById,
        data,
      })
      return language
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async delete(id: string) {
    try {
      // Hard delete
      await this.languageRepository.delete(id, true)
      return {
        message: 'Xóa bản ghi thành công',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}
