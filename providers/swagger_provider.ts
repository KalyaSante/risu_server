import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Provider personnalisé pour Swagger
 * Alternative au provider officiel pour une intégration simplifiée
 */
class SwaggerService {}

export default class SwaggerProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    // Configuration minimale pour Swagger
    this.app.container.singleton(SwaggerService, () => {
      return {
        enabled: true,
        autoGenerate: true,
        path: '/swagger',
        ui: '/docs'
      }
    })
  }

  /**
   * Boot the provider
   */
  async boot() {
    // Le provider est prêt, Swagger sera accessible via les routes
  }

  /**
   * Shutdown the provider
   */
  async shutdown() {
    // Nettoyage si nécessaire
  }
}
