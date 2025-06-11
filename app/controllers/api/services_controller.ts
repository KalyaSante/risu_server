import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'

export default class ServicesApiController {
  /**
   * Liste des services en JSON
   */
  async index({ response, request }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = Math.min(request.input('limit', 20), 100)
      const search = request.input('search', '')
      const serverId = request.input('server_id')

      let query = Service.query()
        .preload('server')
        .preload('dependencies', (q) => q.pivotColumns(['label', 'type']))
        .preload('dependents', (q) => q.pivotColumns(['label', 'type']))

      if (search) {
        query = query.where('nom', 'LIKE', `%${search}%`)
      }

      if (serverId) {
        query = query.where('server_id', serverId)
      }

      const services = await query
        .orderBy('nom', 'asc')
        .paginate(page, limit)

      return response.json({
        success: true,
        data: services.serialize(),
        meta: {
          total: services.total,
          perPage: services.perPage,
          currentPage: services.currentPage,
          lastPage: services.lastPage,
          hasNextPage: services.hasNextPage,
          hasPreviousPage: services.hasPreviousPage
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des services'
      })
    }
  }

  /**
   * Détails d'un service en JSON
   */
  async show({ params, response }: HttpContext) {
    try {
      const service = await Service.query()
        .where('id', params.id)
        .preload('server')
        .preload('dependencies', (query) => {
          query.pivotColumns(['label', 'type']).preload('server')
        })
        .preload('dependents', (query) => {
          query.pivotColumns(['label', 'type']).preload('server')
        })
        .firstOrFail()

      return response.json({
        success: true,
        data: service.serialize()
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Service non trouvé'
      })
    }
  }

  /**
   * Services d'un serveur spécifique
   */
  async byServer({ params, response }: HttpContext) {
    try {
      const services = await Service.query()
        .where('server_id', params.serverId)
        .preload('dependencies', (q) => q.pivotColumns(['label', 'type']))
        .orderBy('nom', 'asc')

      return response.json({
        success: true,
        data: services.map(service => service.serialize()),
        meta: {
          count: services.length,
          serverId: params.serverId
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des services du serveur'
      })
    }
  }
}
