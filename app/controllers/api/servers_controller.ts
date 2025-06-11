import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'

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

      const servers = await query
        .orderBy('nom', 'asc')
        .paginate(page, limit)

      return response.json({
        success: true,
        data: servers.serialize(),
        meta: {
          total: servers.total,
          perPage: servers.perPage,
          currentPage: servers.currentPage,
          lastPage: servers.lastPage,
          hasNextPage: servers.hasNextPage,
          hasPreviousPage: servers.hasPreviousPage
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des serveurs'
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
        data: server.serialize()
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Serveur non trouvé'
      })
    }
  }
}
