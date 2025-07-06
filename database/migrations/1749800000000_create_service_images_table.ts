import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'service_images'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('label').notNullable()
      table.text('description').nullable()
      table.string('filename').notNullable()
      table.string('original_name').notNullable()
      table.string('mime_type').notNullable()
      table.integer('file_size').notNullable()
      table.string('url').notNullable()
      table.integer('order').defaultTo(0)
      table.boolean('is_active').defaultTo(true)
      
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      // Index pour l'ordre et la recherche
      table.index(['order', 'is_active'])
      table.index(['label'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
