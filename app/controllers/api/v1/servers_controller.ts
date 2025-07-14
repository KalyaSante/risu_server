import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import { extendPaginator } from '#types/pagination'

export default class ServersV1Controller {
  /**
   * @swagger
   * /api/v1/servers:
   *   get:
   *     tags: [Servers]
   *     summary: Liste des serveurs
   *     description: Retourne la liste paginée de tous les serveurs avec leurs services associés
   *     operationId: listServersV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: page
   *         in: query
   *         description: Numéro de page
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - name: limit
   *         in: query
   *         description: Nombre d'éléments par page
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *       - name: search
   *         in: query
   *         description: Recherche par nom de serveur
   *         required: false
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des serveurs avec pagination
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 1
   *                       nom:
   *                         type: string
   *                         example: "Serveur Production"
   *                       ip:
   *                         type: string
   *                         example: "192.168.1.100"
   *                       hebergeur:
   *                         type: string
   *                         example: "OVH"
   *                       services:
   *                         type: array
   *                         items:
   *                           type: object
   *                 meta:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     perPage:
   *                       type: integer
   *                     currentPage:
   *                       type: integer
   *                     lastPage:
   *                       type: integer
   *                     hasNextPage:
   *                       type: boolean
   *                     hasPreviousPage:
   *                       type: boolean
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
   * @swagger
   * /api/v1/servers:
   *   post:
   *     tags: [Servers]
   *     summary: Créer un serveur
   *     description: Créer un nouveau serveur dans le système
   *     operationId: createServerV1
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [nom, ip, hebergeur]
   *             properties:
   *               nom:
   *                 type: string
   *                 example: "Mon Serveur"
   *               ip:
   *                 type: string
   *                 example: "192.168.1.100"
   *               hebergeur:
   *                 type: string
   *                 example: "OVH"
   *               localisation:
   *                 type: string
   *                 example: "France"
   *               description:
   *                 type: string
   *                 example: "Serveur de production"
   *     responses:
   *       201:
   *         description: Serveur créé avec succès
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   *                   example: "Serveur créé avec succès"
   */
  async store({ request, response }: HttpContext) {
    try {
      const data = request.only(['nom', 'ip', 'hebergeur', 'localisation', 'description', 'note', 'color', 'parentServerId'])
      const server = await Server.create(data)

      return response.status(201).json({
        success: true,
        data: server.serialize(),
        message: 'Serveur créé avec succès'
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        error: 'Erreur lors de la création du serveur'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/servers/{id}:
   *   get:
   *     tags: [Servers]
   *     summary: Détails d'un serveur
   *     description: Retourne les détails d'un serveur par son ID, incluant tous ses services et leurs dépendances
   *     operationId: getServerV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du serveur
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Détails du serveur
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *       404:
   *         description: Serveur non trouvé
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
        .preload('parent')
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
   * @swagger
   * /api/v1/servers/{id}:
   *   put:
   *     tags: [Servers]
   *     summary: Mettre à jour un serveur
   *     description: Met à jour les informations d'un serveur existant
   *     operationId: updateServerV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du serveur
   *         schema:
   *           type: integer
   *           example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nom:
   *                 type: string
   *               ip:
   *                 type: string
   *               hebergeur:
   *                 type: string
   *               localisation:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Serveur mis à jour avec succès
   *       404:
   *         description: Serveur non trouvé
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const server = await Server.findOrFail(params.id)
      const data = request.only(['nom', 'ip', 'hebergeur', 'localisation', 'description', 'note', 'color', 'parentServerId'])

      await server.merge(data).save()

      return response.json({
        success: true,
        data: server.serialize(),
        message: 'Serveur mis à jour avec succès'
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Serveur non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/servers/{id}:
   *   delete:
   *     tags: [Servers]
   *     summary: Supprimer un serveur
   *     description: Supprime définitivement un serveur et tous ses services associés
   *     operationId: deleteServerV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du serveur
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Serveur supprimé avec succès
   *       404:
   *         description: Serveur non trouvé
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const server = await Server.findOrFail(params.id)
      await server.delete()

      return response.json({
        success: true,
        message: 'Serveur supprimé avec succès'
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Serveur non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/servers/{id}/status:
   *   get:
   *     tags: [Servers]
   *     summary: Statut d'un serveur
   *     description: Retourne le statut en temps réel d'un serveur spécifique
   *     operationId: getServerStatusV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du serveur
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Statut du serveur
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     status:
   *                       type: string
   *                       enum: [online, offline]
   *                       example: "online"
   *                     uptime:
   *                       type: string
   *                       example: "15 days, 3 hours"
   *                     servicesCount:
   *                       type: integer
   *                       example: 5
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async status({ params, response }: HttpContext) {
    try {
      const server = await Server.query()
        .where('id', params.id)
        .preload('services')
        .firstOrFail()

      // Simulation du statut (à remplacer par un vrai health check)
      const status = {
        id: server.id,
        name: server.nom,
        ip: server.ip,
        status: Math.random() > 0.05 ? 'online' : 'offline',
        uptime: '15 days, 3 hours',
        servicesCount: server.services.length,
        lastCheck: new Date().toISOString()
      }

      return response.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Serveur non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/servers/{id}/services:
   *   get:
   *     tags: [Servers]
   *     summary: Services d'un serveur
   *     description: Retourne la liste de tous les services hébergés sur un serveur
   *     operationId: getServerServicesV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du serveur
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Liste des services du serveur
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *       404:
   *         description: Serveur non trouvé
   */
  async services({ params, response }: HttpContext) {
    try {
      const server = await Server.query()
        .where('id', params.id)
        .preload('services', (query) => {
          query.preload('dependencies')
          query.orderBy('nom', 'asc')
        })
        .firstOrFail()

      return response.json({
        success: true,
        data: server.services.map((service: any) => service.serialize())
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Serveur non trouvé'
      })
    }
  }
}
