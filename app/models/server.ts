import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
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

  @column({ columnName: 'parent_server_id' })
  declare parentServerId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Service)
  declare services: HasMany<typeof Service>

  @belongsTo(() => Server, { foreignKey: 'parentServerId' })
  declare parent?: BelongsTo<typeof Server>

  @hasMany(() => Server, { foreignKey: 'parentServerId' })
  declare children: HasMany<typeof Server>
}
