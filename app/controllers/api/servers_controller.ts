import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import { extendPaginator } from '#types/pagination'

export default class ServersApiController {
  /**
   * @index
   * @summary Récupérer la liste des serveurs
   * @description Retourne la liste paginée de tous les serveurs avec leurs services associés
   * @operationId getServers
   * @tag Serveurs
   * @requestQuery page - Numéro de page - @type(integer) @default(1) @minimum(1)
   * @requestQuery limit - Nombre d'éléments par page - @type(integer) @default(20) @maximum(100) @minimum(1)
   * @requestQuery search - Recherche par nom de serveur - @type(string)
   * @responseBody 200 - Liste des serveurs avec pagination - application/json
   * @responseSchema 200.application/json.properties.success.type boolean
   * @responseSchema 200.application/json.properties.success.example true
   * @responseSchema 200.application/json.properties.data.type array
   * @responseSchema 200.application/json.properties.data.items.type object
   * @responseSchema 200.application/json.properties.data.items.properties.id.type integer
   * @responseSchema 200.application/json.properties.data.items.properties.nom.type string
   * @responseSchema 200.application/json.properties.data.items.properties.ip.type string
   * @responseSchema 200.application/json.properties.data.items.properties.hebergeur.type string
   * @responseSchema 200.application/json.properties.data.items.properties.services.type array
   * @responseSchema 200.application/json.properties.meta.type object
   * @responseSchema 200.application/json.properties.meta.properties.total.type integer
   * @responseSchema 200.application/json.properties.meta.properties.perPage.type integer
   * @responseSchema 200.application/json.properties.meta.properties.currentPage.type integer
   * @responseSchema 200.application/json.properties.meta.properties.lastPage.type integer
   * @responseSchema 200.application/json.properties.meta.properties.hasNextPage.type boolean
   * @responseSchema 200.application/json.properties.meta.properties.hasPreviousPage.type boolean
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
   * @show
   * @summary Récupérer un serveur spécifique
   * @description Retourne les détails d'un serveur par son ID, incluant tous ses services et leurs dépendances
   * @operationId getServer
   * @tag Serveurs
   * @paramPath id - ID du serveur - @type(integer) @required
   * @responseBody 200 - Détails du serveur - application/json
   * @responseSchema 200.application/json.properties.success.type boolean
   * @responseSchema 200.application/json.properties.success.example true
   * @responseSchema 200.application/json.properties.data.type object
   * @responseSchema 200.application/json.properties.data.properties.id.type integer
   * @responseSchema 200.application/json.properties.data.properties.nom.type string
   * @responseSchema 200.application/json.properties.data.properties.ip.type string
   * @responseSchema 200.application/json.properties.data.properties.hebergeur.type string
   * @responseSchema 200.application/json.properties.data.properties.services.type array
   * @responseSchema 200.application/json.properties.data.properties.services.items.type object
   * @responseSchema 200.application/json.properties.data.properties.services.items.properties.id.type integer
   * @responseSchema 200.application/json.properties.data.properties.services.items.properties.nom.type string
   * @responseSchema 200.application/json.properties.data.properties.services.items.properties.image.type string
   * @responseSchema 200.application/json.properties.data.properties.services.items.properties.port.type integer
   * @responseBody 404 - Serveur non trouvé - application/json
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
   * @status
   * @summary Vérifier le statut des serveurs en temps réel
   * @description Retourne le statut actuel de tous les serveurs (online/offline) avec le nombre de services par serveur
   * @operationId getServersStatus
   * @tag Serveurs
   * @responseBody 200 - Statut des serveurs - application/json
   * @responseSchema 200.application/json.properties.success.type boolean
   * @responseSchema 200.application/json.properties.success.example true
   * @responseSchema 200.application/json.properties.data.type array
   * @responseSchema 200.application/json.properties.data.items.type object
   * @responseSchema 200.application/json.properties.data.items.properties.id.type integer
   * @responseSchema 200.application/json.properties.data.items.properties.name.type string
   * @responseSchema 200.application/json.properties.data.items.properties.ip.type string
   * @responseSchema 200.application/json.properties.data.items.properties.status.type string
   * @responseSchema 200.application/json.properties.data.items.properties.status.enum ["online", "offline"]
   * @responseSchema 200.application/json.properties.data.items.properties.hebergeur.type string
   * @responseSchema 200.application/json.properties.data.items.properties.servicesCount.type integer
   * @responseSchema 200.application/json.properties.timestamp.type string
   * @responseSchema 200.application/json.properties.timestamp.format date-time
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
