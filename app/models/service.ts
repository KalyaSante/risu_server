import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Server from './server.js'
import ServiceImage from './service_image.js'
import type { ServicePort } from '#types/oauth'

export default class Service extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare serverId: number

  @column()
  declare nom: string

  @column()
  declare icon: string | null

  // ✅ NOUVEAU: Relation vers ServiceImage
  @column()
  declare serviceImageId: number | null

  @column()
  declare path: string | null

  @column()
  declare repoUrl: string | null

  @column()
  declare docPath: string | null

  @column()
  declare description: string | null

  // ✅ AJOUT: Champ note markdown
  @column()
  declare note: string | null

  // ✅ SIMPLE: Ports multiples en JSON avec juste port + label
  @column({
    serialize: (value: ServicePort[] | null) => value,
    prepare: (value: ServicePort[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare ports: ServicePort[] | null

  @column.dateTime()
  declare lastMaintenanceAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Server)
  declare server: BelongsTo<typeof Server>

  // ✅ NOUVEAU: Relation vers ServiceImage
  @belongsTo(() => ServiceImage)
  declare serviceImage: BelongsTo<typeof ServiceImage>

  @manyToMany(() => Service, {
    pivotTable: 'service_dependencies',
    localKey: 'id',
    pivotForeignKey: 'service_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'depends_on_service_id',
    pivotColumns: ['label', 'type'],
  })
  declare dependencies: ManyToMany<typeof Service>

  @manyToMany(() => Service, {
    pivotTable: 'service_dependencies',
    localKey: 'id',
    pivotForeignKey: 'depends_on_service_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'service_id',
    pivotColumns: ['label', 'type'],
  })
  declare dependents: ManyToMany<typeof Service>

  // ✅ NOUVEAU: Getter intelligent pour l'icône
  get iconUrl(): string | null {
    // Priorité 1: Image gérée via ServiceImage
    if (this.serviceImage) {
      return this.serviceImage.url
    }
    // Priorité 2: URL custom dans le champ icon
    return this.icon
  }

  // ✅ NOUVEAU: Getter pour les métadonnées de l'image
  get imageMetadata(): any {
    if (this.serviceImage) {
      return {
        id: this.serviceImage.id,
        label: this.serviceImage.label,
        description: this.serviceImage.description,
        filename: this.serviceImage.filename,
        url: this.serviceImage.url,
      }
    }
    return null
  }

  // ✅ Getters simples
  get primaryPort(): number | null {
    const portValue = this.ports?.[0]?.port
    if (typeof portValue === 'string') {
      const parsedPort = Number.parseInt(portValue, 10)
      return Number.isNaN(parsedPort) ? null : parsedPort
    }
    return portValue || null
  }

  get allPorts(): ServicePort[] {
    return this.ports || []
  }
}
