import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'add_note_fields_to_servers_and_services'

  async up() {
    // Ajouter le champ note à la table servers
    this.schema.alterTable('servers', (table) => {
      table.text('note').nullable()
    })

    // Ajouter le champ note à la table services
    this.schema.alterTable('services', (table) => {
      table.text('note').nullable()
    })
  }

  async down() {
    // Supprimer le champ note de la table servers
    this.schema.alterTable('servers', (table) => {
      table.dropColumn('note')
    })

    // Supprimer le champ note de la table services
    this.schema.alterTable('services', (table) => {
      table.dropColumn('note')
    })
  }
}
