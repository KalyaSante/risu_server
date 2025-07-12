import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_keys'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary() // CUID au lieu d'UUID pour plus de lisibilité
      table.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('name').notNullable() // Nom donné à la clé par l'utilisateur
      table.string('token_hash').notNullable().unique() // Hash de la clé
      table.string('prefix', 16).notNullable() // Préfixe visible (sk_kalya_xxx)
      table.json('permissions').nullable() // Permissions spécifiques (pour plus tard)
      table.timestamp('last_used_at').nullable()
      table.string('last_used_ip').nullable()
      table.timestamp('expires_at').nullable() // Expiration optionnelle
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Index pour les recherches fréquentes
      table.index(['user_id', 'is_active'])
      table.index(['token_hash'])
      table.index(['prefix'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
