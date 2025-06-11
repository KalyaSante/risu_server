import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Supprimer l'ancien ID auto-increment
      table.dropColumn('id')
    })

    this.schema.alterTable(this.tableName, (table) => {
      // Ajouter le nouvel ID UUID
      table.uuid('id').primary().notNullable()
      // Le password devient nullable pour OAuth
      table.string('password').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('id')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('password').notNullable().alter()
    })
  }
}
