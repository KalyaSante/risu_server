import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import { extendPaginator } from '#types/pagination'

export default class ServicesApiController {
  /**
   * @index
   * @summary Récupérer la liste des services
   * @description Retourne la liste paginée de tous les services avec leurs dépendances et serveurs associés
   * @operationId getServices
   * @tag Services
   * @requestQuery page - Numéro de page - @type(integer) @default(1) @minimum(1)
   * @requestQuery limit - Nombre d'éléments par page - @type(integer) @default(20) @maximum(100) @minimum(1)
   * @requestQuery search - Recherche par nom de service - @type(string)
   * @requestQuery server_id - Filtrer par serveur - @type(integer)
   * @responseBody 200 - Liste des services avec pagination - application/json
   * @responseSchema 200.application/json.properties.success.type boolean
   * @responseSchema 200.application/json.properties.success.example true
   * @responseSchema 200.application/json.properties.data.type array
   * @responseSchema 200.application/json.properties.data.items.type object
   * @responseSchema 200.application/json.properties.data.items.properties.id.type integer
   * @responseSchema 200.application/json.properties.data.items.properties.nom.type string
   * @responseSchema 200.application/json.properties.data.items.properties.image.type string
   * @responseSchema 200.application/json.properties.data.items.properties.port.type integer
   * @responseSchema 200.application/json.properties.data.items.properties.server.type object
   * @responseSchema 200.application/json.properties.data.items.properties.dependencies.type array
   * @responseSchema 200.application/json.properties.meta.type object
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

      const services = await query.orderBy('nom', 'asc').paginate(page, limit)

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
          hasPreviousPage: extendedServices.hasPreviousPage,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des services',
      })
    }
  }

  /**
   * @show
   * @summary Récupérer un service spécifique
   * @description Retourne les détails d'un service par son ID, incluant son serveur, ses dépendances et ses services dépendants
   * @operationId getService
   * @tag Services
   * @paramPath id - ID du service - @type(integer) @required
   * @responseBody 200 - Détails du service - application/json
   * @responseSchema 200.application/json.properties.success.type boolean
   * @responseSchema 200.application/json.properties.success.example true
   * @responseSchema 200.application/json.properties.data.type object
   * @responseSchema 200.application/json.properties.data.properties.id.type integer
   * @responseSchema 200.application/json.properties.data.properties.nom.type string
   * @responseSchema 200.application/json.properties.data.properties.image.type string
   * @responseSchema 200.application/json.properties.data.properties.port.type integer
   * @responseSchema 200.application/json.properties.data.properties.server.type object
   * @responseSchema 200.application/json.properties.data.properties.dependencies.type array
   * @responseSchema 200.application/json.properties.data.properties.dependents.type array
   * @responseBody 404 - Service non trouvé - application/json
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
        data: service.serialize(),
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Service non trouvé',
      })
    }
  }

  /**
   * @byServer
   * @summary Récupérer les services d'un serveur
   * @description Retourne tous les services hébergés sur un serveur spécifique
   * @operationId getServicesByServer
   * @tag Services
   * @paramPath serverId - ID du serveur - @type(integer) @required
   * @responseBody 200 - Services du serveur - application/json
   * @responseSchema 200.application/json.properties.success.type boolean
   * @responseSchema 200.application/json.properties.success.example true
   * @responseSchema 200.application/json.properties.data.type array
   * @responseSchema 200.application/json.properties.data.items.type object
   * @responseSchema 200.application/json.properties.meta.type object
   * @responseSchema 200.application/json.properties.meta.properties.count.type integer
   * @responseSchema 200.application/json.properties.meta.properties.serverId.type integer
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
          serverId: params.serverId,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des services du serveur',
      })
    }
  }

  /**
   * @status
   * @summary Vérifier le statut des services en temps réel
   * @description Retourne le statut actuel de tous les services (running/stopped)
   * @operationId getServicesStatus
   * @tag Services
   * @responseBody 200 - Statut des services - application/json
   * @responseSchema 200.application/json.properties.success.type boolean
   * @responseSchema 200.application/json.properties.success.example true
   * @responseSchema 200.application/json.properties.data.type array
   * @responseSchema 200.application/json.properties.data.items.type object
   * @responseSchema 200.application/json.properties.data.items.properties.id.type integer
   * @responseSchema 200.application/json.properties.data.items.properties.name.type string
   * @responseSchema 200.application/json.properties.data.items.properties.status.type string
   * @responseSchema 200.application/json.properties.data.items.properties.status.enum ["running", "stopped", "error"]
   * @responseSchema 200.application/json.properties.data.items.properties.serverId.type integer
   * @responseSchema 200.application/json.properties.data.items.properties.serverName.type string
   * @responseSchema 200.application/json.properties.timestamp.type string
   * @responseSchema 200.application/json.properties.timestamp.format date-time
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
        serverName: service.server?.nom,
      }))

      return response.json({
        success: true,
        data: servicesWithStatus,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du statut des services',
      })
    }
  }

  /**
   * @toggle
   * @summary Démarrer/Arrêter un service
   * @description Change l'état d'un service (running/stopped)
   * @operationId toggleService
   * @tag Services
   * @paramPath id - ID du service - @type(integer) @required
   * @requestBody required - Action à effectuer - application/json
   * @requestSchema application/json.type object
   * @requestSchema application/json.properties.action.type string
   * @requestSchema application/json.properties.action.enum ["start", "stop", "restart"]
   * @requestSchema application/json.properties.action.example "start"
   * @responseBody 200 - Résultat de l'action - application/json
   * @responseSchema 200.application/json.properties.success.type boolean
   * @responseSchema 200.application/json.properties.success.example true
   * @responseSchema 200.application/json.properties.data.type object
   * @responseSchema 200.application/json.properties.data.properties.id.type integer
   * @responseSchema 200.application/json.properties.data.properties.name.type string
   * @responseSchema 200.application/json.properties.data.properties.status.type string
   * @responseSchema 200.application/json.properties.message.type string
   * @responseBody 404 - Service non trouvé - application/json
   */
  async toggle({ params, response, session }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)

      // Ici tu peux implémenter la vraie logique de start/stop
      // Pour l'instant, on simule juste un toggle
      const newStatus = Math.random() > 0.5 ? 'running' : 'stopped'

      session.flash(
        'success',
        `Service "${service.nom}" ${newStatus === 'running' ? 'démarré' : 'arrêté'} avec succès!`
      )

      return response.json({
        success: true,
        data: {
          id: service.id,
          name: service.nom,
          status: newStatus,
        },
        message: `Service ${newStatus === 'running' ? 'démarré' : 'arrêté'}`,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors du toggle du service',
      })
    }
  }
}
