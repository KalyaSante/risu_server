import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'hosters'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Informations de base
      table.string('name', 100).notNullable().unique()
      table.enum('type', ['vps', 'dedicated', 'cloud', 'shared']).notNullable().defaultTo('vps')

      // Informations complémentaires
      table.text('description').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.integer('order').notNullable().defaultTo(0) // Ordre d'affichage)

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index pour les recherches fréquentes
      table.index(['type', 'is_active'])
      table.index('name')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
