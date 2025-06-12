import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Service from './service.js'

export default class Server extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nom: string

  @column()
  declare ip: string

  @column()
  declare hebergeur: string

  @column()
  declare localisation: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Service)
  declare services: HasMany<typeof Service>
}
