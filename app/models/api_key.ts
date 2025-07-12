import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import hash from '@adonisjs/core/services/hash'
import { cuid } from '@adonisjs/core/helpers'
import { randomBytes } from 'node:crypto'

export default class ApiKey extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare name: string

  @column({ serializeAs: null }) // Ne pas exposer dans les réponses JSON
  declare tokenHash: string

  @column()
  declare prefix: string

  @column({
    serialize: (value: any) => {
      return value ? JSON.parse(value) : null
    },
    prepare: (value: any) => {
      return value ? JSON.stringify(value) : null
    },
  })
  declare permissions: any

  @column.dateTime()
  declare lastUsedAt: DateTime | null

  @column()
  declare lastUsedIp: string | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  // Méthodes statiques pour la génération de clés
  static async generate(userId: string, name: string, permissions?: any) {
    const id = cuid()

    // Générer un token sécurisé
    const rawToken = randomBytes(32).toString('hex')
    const prefix = `sk_kalya_${randomBytes(4).toString('hex')}`
    const fullToken = `${prefix}_${rawToken}`

    // Hasher le token complet pour le stockage
    const tokenHash = await hash.make(fullToken)

    const apiKey = await this.create({
      id,
      userId,
      name,
      tokenHash,
      prefix,
      permissions,
      isActive: true,
    })

    // Retourner l'objet avec le token en clair (une seule fois)
    return {
      apiKey,
      token: fullToken, // ⚠️ Sera affiché une seule fois à l'utilisateur
    }
  }

  // Vérifier un token
  static async verify(token: string) {
    if (!token.startsWith('sk_kalya_')) {
      return null
    }

    const prefix = token.split('_').slice(0, 3).join('_') // sk_kalya_xxxx

    const apiKey = await this.query()
      .where('prefix', prefix)
      .where('is_active', true)
      .where((query) => {
        query.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL())
      })
      .preload('user')
      .first()

    if (!apiKey) {
      return null
    }

    // Vérifier le hash
    const isValid = await hash.verify(apiKey.tokenHash, token)
    if (!isValid) {
      return null
    }

    return apiKey
  }

  // Mettre à jour l'utilisation
  async markAsUsed(ip?: string) {
    this.lastUsedAt = DateTime.now()
    if (ip) {
      this.lastUsedIp = ip
    }
    await this.save()
  }

  // ✨ CORRECTION: Formatage pour l'affichage (masquer le token)
  serialize() {
    const data = super.serialize()

    // Créer un token masqué plus lisible
    const visiblePart = this.prefix // sk_kalya_xxxx
    const hiddenLength = 40 // Longueur du token après le prefix
    const maskedToken = `${visiblePart}_${'*'.repeat(hiddenLength)}`

    return {
      ...data,
      maskedToken,
      // Formater les dates pour l'affichage
      createdAt: this.createdAt.toISO(),
      updatedAt: this.updatedAt.toISO(),
      lastUsedAt: this.lastUsedAt?.toISO() || null,
      // Informations additionnelles utiles
      hasExpiration: !!this.expiresAt,
      isExpired: this.expiresAt ? this.expiresAt < DateTime.now() : false,
      daysUntilExpiration: this.expiresAt ?
        Math.ceil(this.expiresAt.diff(DateTime.now(), 'days').days) : null,
    }
  }

  // ✨ NOUVEAU: Méthode pour obtenir les stats d'utilisation
  getUsageStats() {
    const now = DateTime.now()
    const created = this.createdAt
    const lastUsed = this.lastUsedAt

    return {
      ageInDays: Math.floor(now.diff(created, 'days').days),
      daysSinceLastUse: lastUsed ? Math.floor(now.diff(lastUsed, 'days').days) : null,
      hasBeenUsed: !!lastUsed,
      isRecentlyUsed: lastUsed ? now.diff(lastUsed, 'days').days < 7 : false,
    }
  }
}
