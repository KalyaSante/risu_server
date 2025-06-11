import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { oauthConfig } from '#config/oauth'

export default class RegisterOAuthClient extends BaseCommand {
  static commandName = 'oauth:register'
  static description = 'Enregistre automatiquement le client OAuth sur le serveur'

  static options: CommandOptions = {
    startApp: false,
  }

  async run() {
    this.logger.info('🔐 Enregistrement du client OAuth...')
    
    try {
      const response = await fetch(`${oauthConfig.baseUrl}/api/oauth/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Tu devras ajouter ton token d'auth de développeur ici
          'Authorization': 'Bearer YOUR_DEV_TOKEN'
        },
        body: JSON.stringify({
          name: 'Cartographie Services Kalya',
          redirect: oauthConfig.redirectUri,
          // Optionnel: ajouter un logo
          // img: '/path/to/logo.png'
        })
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const clientData = await response.json()
      
      this.logger.success('✅ Client OAuth enregistré avec succès!')
      this.logger.info(`📋 Client ID: ${clientData.id}`)
      this.logger.info(`🔑 Client Secret: ${clientData.plain_secret}`)
      this.logger.info(`🔗 Redirect URI: ${clientData.redirect}`)
      
      this.logger.warning('⚠️  IMPORTANT: Sauvegarde ces informations dans ton .env:')
      this.logger.info(`OAUTH_CLIENT_ID=${clientData.id}`)
      this.logger.info(`OAUTH_CLIENT_SECRET=${clientData.plain_secret}`)
      
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'enregistrement du client OAuth:')
      this.logger.error(error.message)
      this.logger.info('💡 Assure-toi que:')
      this.logger.info('  - Le serveur OAuth est accessible')
      this.logger.info('  - Tu as un token de développeur valide')
      this.logger.info('  - L\'URL de base est correcte dans ta config')
    }
  }
}
