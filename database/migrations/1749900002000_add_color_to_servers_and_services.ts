import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers_and_services'

  async up() {
    // Ajouter le champ color à la table servers
    this.schema.alterTable('servers', (table) => {
      table.string('color', 50).defaultTo('neutral').notNullable()
    })

    // Ajouter le champ color à la table services
    this.schema.alterTable('services', (table) => {
      table.string('color', 50).defaultTo('neutral').notNullable()
    })
  }

  async down() {
    // Supprimer le champ color de la table servers
    this.schema.alterTable('servers', (table) => {
      table.dropColumn('color')
    })

    // Supprimer le champ color de la table services
    this.schema.alterTable('services', (table) => {
      table.dropColumn('color')
    })
  }
}
