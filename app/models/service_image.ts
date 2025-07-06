import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ServiceImage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare label: string

  @column()
  declare description: string | null

  @column()
  declare filename: string

  @column()
  declare originalName: string

  @column()
  declare mimeType: string

  @column()
  declare fileSize: number

  @column()
  declare url: string

  @column()
  declare order: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Getter pour l'extension du fichier
  get fileExtension(): string {
    return this.filename.split('.').pop()?.toLowerCase() || ''
  }
}
