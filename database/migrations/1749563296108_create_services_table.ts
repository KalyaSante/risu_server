import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('server_id').unsigned().references('id').inTable('servers').onDelete('CASCADE')
      table.string('nom').notNullable()
      table.string('icon').nullable()
      table.string('path').nullable()
      table.string('repo_url').nullable()
      table.string('doc_path').nullable()
      table.timestamp('last_maintenance_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
