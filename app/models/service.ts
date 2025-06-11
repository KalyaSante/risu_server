import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Server from './server.js'

export default class Service extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare serverId: number

  @column()
  declare nom: string

  @column()
  declare icon: string | null

  @column()
  declare path: string | null

  @column()
  declare repoUrl: string | null

  @column()
  declare docPath: string | null

  @column.dateTime()
  declare lastMaintenanceAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Server)
  declare server: BelongsTo<typeof Server>

  // Services dont ce service dépend
  @manyToMany(() => Service, {
    pivotTable: 'service_dependencies',
    localKey: 'id',
    pivotForeignKey: 'service_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'depends_on_service_id',
    pivotColumns: ['label', 'type'],
  })
  declare dependencies: ManyToMany<typeof Service>

  // Services qui dépendent de ce service
  @manyToMany(() => Service, {
    pivotTable: 'service_dependencies',
    localKey: 'id',
    pivotForeignKey: 'depends_on_service_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'service_id',
    pivotColumns: ['label', 'type'],
  })
  declare dependents: ManyToMany<typeof Service>
}
