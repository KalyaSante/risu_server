import type { ApplicationService } from '@adonisjs/core/types'
import { registerEdgeHelpers } from '#services/edge_helpers'

/**
 * Provider pour enregistrer les helpers Edge personnalisés
 */
export default class EdgeProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {}

  /**
   * The container bindings have booted
   */
  async boot() {
    // Enregistrer les helpers Edge personnalisés
    registerEdgeHelpers()
  }

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Cleanup hook
   */
  async shutdown() {}
}
