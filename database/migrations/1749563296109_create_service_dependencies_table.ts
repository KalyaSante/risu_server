import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'service_dependencies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('service_id')
        .unsigned()
        .references('id')
        .inTable('services')
        .onDelete('CASCADE')
      table
        .integer('depends_on_service_id')
        .unsigned()
        .references('id')
        .inTable('services')
        .onDelete('CASCADE')
      table.string('label').nullable()
      table.enum('type', ['required', 'optional', 'fallback']).defaultTo('required')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Éviter les doublons
      table.unique(['service_id', 'depends_on_service_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
