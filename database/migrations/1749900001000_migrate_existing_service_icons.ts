import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    console.log('🔄 Migration automatique des icônes vers ServiceImage...')

    // Migration via SQL pur pour migrer les URLs existantes
    try {
      await this.raw(`
        UPDATE services 
        SET service_image_id = (
          SELECT id 
          FROM service_images 
          WHERE service_images.url = services.icon 
          AND service_images.is_active = true
          LIMIT 1
        ),
        icon = NULL
        WHERE icon IS NOT NULL 
        AND icon != ''
        AND EXISTS (
          SELECT 1 
          FROM service_images 
          WHERE service_images.url = services.icon 
          AND service_images.is_active = true
        )
      `)

      console.log('✅ Migration automatique des icônes terminée')
      console.log(
        '💡 Les services avec URLs custom non présentes dans ServiceImage ont gardé leur URL dans le champ icon'
      )
    } catch (error) {
      console.error('❌ Erreur pendant la migration des icônes:', error)
      console.log('⚠️ Continuez avec la migration - les icônes pourront être migrées manuellement')
    }
  }

  async down() {
    console.log('🔄 Restauration des URLs depuis ServiceImage vers icon...')

    try {
      // Restaurer les URLs depuis ServiceImage vers icon
      await this.raw(`
        UPDATE services 
        SET icon = (
          SELECT url 
          FROM service_images 
          WHERE service_images.id = services.service_image_id
          LIMIT 1
        )
        WHERE service_image_id IS NOT NULL
      `)

      // Clear les foreign keys
      await this.raw(`UPDATE services SET service_image_id = NULL`)

      console.log('✅ Restauration terminée')
    } catch (error) {
      console.error('❌ Erreur pendant la restauration:', error)
    }
  }
}
