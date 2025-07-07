import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Ajouter la colonne description si elle n'existe pas déjà
      table.text('description').nullable()

      // Remplacer la colonne port par ports (JSON)
      table.text('ports').nullable() // JSON stocké comme TEXT pour SQLite
    })

    // ✅ Migrer les données existantes si la colonne port existe
    const hasPortColumn = await this.schema.hasColumn(this.tableName, 'port')

    if (hasPortColumn) {
      // Migrer les anciens ports vers la nouvelle structure
      await this.db.rawQuery(`
        UPDATE services 
        SET ports = '[{"port": ' || COALESCE(port, 80) || ', "label": "web"}]'
        WHERE port IS NOT NULL
      `)

      // Supprimer l'ancienne colonne port
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('port')
      })
    }
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Restaurer la colonne port simple
      table.integer('port').nullable()

      // Supprimer les nouvelles colonnes
      table.dropColumn('ports')
      table.dropColumn('description')
    })
  }
}
