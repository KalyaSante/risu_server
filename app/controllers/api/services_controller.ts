import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import { extendPaginator } from '#types/pagination'

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

      // ✅ FIX: Utiliser extendPaginator pour calculer hasNextPage/hasPreviousPage
      const extendedServices = extendPaginator(services)

      return response.json({
        success: true,
        data: services.serialize(),
        meta: {
          total: extendedServices.total,
          perPage: extendedServices.perPage,
          currentPage: extendedServices.currentPage,
          lastPage: extendedServices.lastPage,
          hasNextPage: extendedServices.hasNextPage,
          hasPreviousPage: extendedServices.hasPreviousPage
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
        data: services.map((service: any) => service.serialize()),
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

  /**
   * Statut temps réel des services (pour NetworkScript)
   * ✅ NOUVEAU POUR INERTIA
   */
  async status({ response }: HttpContext) {
    try {
      const services = await Service.query()
        .preload('server')
        .select(['id', 'nom', 'server_id'])
        .orderBy('nom', 'asc')

      // Simuler le statut pour l'instant (tu peux implémenter la vraie logique plus tard)
      const servicesWithStatus = services.map((service: any) => ({
        id: service.id,
        name: service.nom,
        status: Math.random() > 0.1 ? 'running' : 'stopped', // 90% running
        serverId: service.serverId,
        serverName: service.server?.nom
      }))

      return response.json({
        success: true,
        data: servicesWithStatus,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du statut des services'
      })
    }
  }

  /**
   * Toggle start/stop d'un service (pour les actions des cartes)
   * ✅ NOUVEAU POUR INERTIA
   */
  async toggle({ params, response, session }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)

      // Ici tu peux implémenter la vraie logique de start/stop
      // Pour l'instant, on simule juste un toggle
      const newStatus = Math.random() > 0.5 ? 'running' : 'stopped'

      session.flash('success',
        `Service "${service.nom}" ${newStatus === 'running' ? 'démarré' : 'arrêté'} avec succès!`
      )

      return response.json({
        success: true,
        data: {
          id: service.id,
          name: service.nom,
          status: newStatus
        },
        message: `Service ${newStatus === 'running' ? 'démarré' : 'arrêté'}`
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors du toggle du service'
      })
    }
  }
}
