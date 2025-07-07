import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Ajouter la foreign key vers service_images
      table.integer('service_image_id').unsigned().nullable()
      table
        .foreign('service_image_id')
        .references('id')
        .inTable('service_images')
        .onDelete('SET NULL')

      // Garder icon pour rétrocompatibilité (URL custom)
      // On peut avoir soit service_image_id (image gérée), soit icon (URL custom)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['service_image_id'])
      table.dropColumn('service_image_id')
    })
  }
}
