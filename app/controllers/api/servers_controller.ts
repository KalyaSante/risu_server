import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import { extendPaginator } from '#types/pagination'

export default class ServersApiController {
  /**
   * Liste des serveurs en JSON
   */
  async index({ response, request }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = Math.min(request.input('limit', 20), 100)
      const search = request.input('search', '')

      let query = Server.query().preload('services')

      if (search) {
        query = query.where('nom', 'LIKE', `%${search}%`)
      }

      const servers = await query.orderBy('nom', 'asc').paginate(page, limit)

      // ✅ FIX: Utiliser extendPaginator pour calculer hasNextPage/hasPreviousPage
      const extendedServers = extendPaginator(servers)

      return response.json({
        success: true,
        data: servers.serialize(),
        meta: {
          total: extendedServers.total,
          perPage: extendedServers.perPage,
          currentPage: extendedServers.currentPage,
          lastPage: extendedServers.lastPage,
          hasNextPage: extendedServers.hasNextPage,
          hasPreviousPage: extendedServers.hasPreviousPage,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des serveurs',
      })
    }
  }

  /**
   * Détails d'un serveur en JSON
   */
  async show({ params, response }: HttpContext) {
    try {
      const server = await Server.query()
        .where('id', params.id)
        .preload('services', (query) => {
          query.preload('dependencies', (depQuery) => {
            depQuery.pivotColumns(['label', 'type'])
          })
        })
        .firstOrFail()

      return response.json({
        success: true,
        data: server.serialize(),
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Serveur non trouvé',
      })
    }
  }

  /**
   * Statut temps réel des serveurs (pour NetworkScript)
   * ✅ NOUVEAU POUR INERTIA
   */
  async status({ response }: HttpContext) {
    try {
      const servers = await Server.query()
        .preload('services')
        .select(['id', 'nom', 'ip', 'hebergeur'])
        .orderBy('nom', 'asc')

      // Simuler le statut pour l'instant (tu peux implémenter ping/health check plus tard)
      const serversWithStatus = servers.map((server: any) => ({
        id: server.id,
        name: server.nom,
        ip: server.ip,
        status: Math.random() > 0.05 ? 'online' : 'offline', // 95% online
        hebergeur: server.hebergeur,
        servicesCount: server.services?.length || 0,
      }))

      return response.json({
        success: true,
        data: serversWithStatus,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du statut des serveurs',
      })
    }
  }
}
