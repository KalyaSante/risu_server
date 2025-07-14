import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import { extendPaginator } from '#types/pagination'

export default class ServicesV1Controller {
  /**
   * @swagger
   * /api/v1/services:
   *   get:
   *     tags: [Services]
   *     summary: Liste des services
   *     description: Retourne la liste paginée de tous les services avec leurs serveurs et dépendances
   *     operationId: listServicesV1
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
   *         description: Recherche par nom de service
   *         required: false
   *         schema:
   *           type: string
   *       - name: server_id
   *         in: query
   *         description: Filtrer par serveur
   *         required: false
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Liste des services avec pagination
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
   *                 meta:
   *                   type: object
   */
  async index({ response, request }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = Math.min(request.input('limit', 20), 100)
      const search = request.input('search', '')
      const serverId = request.input('server_id')

      let query = Service.query()
        .preload('server')
        .preload('dependencies', (depQuery) => {
          depQuery.pivotColumns(['label', 'type'])
        })

      if (search) {
        query = query.where('nom', 'LIKE', `%${search}%`)
      }

      if (serverId) {
        query = query.where('server_id', serverId)
      }

      const services = await query.orderBy('nom', 'asc').paginate(page, limit)
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
   * @swagger
   * /api/v1/services:
   *   post:
   *     tags: [Services]
   *     summary: Créer un service
   *     description: Créer un nouveau service sur un serveur
   *     operationId: createServiceV1
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [nom, server_id, image]
   *             properties:
   *               nom:
   *                 type: string
   *                 example: "Mon Service"
   *               server_id:
   *                 type: integer
   *                 example: 1
   *               image:
   *                 type: string
   *                 example: "nginx:latest"
   *               port:
   *                 type: integer
   *                 example: 80
   *               path:
   *                 type: string
   *                 example: "/app"
   *               description:
   *                 type: string
   *                 example: "Service web nginx"
   *     responses:
   *       201:
   *         description: Service créé avec succès
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
   *                   example: "Service créé avec succès"
   */
  async store({ request, response }: HttpContext) {
    try {
      const data = request.only([
        'nom', 'server_id', 'image', 'port', 'path', 'description',
        'repoUrl', 'color', 'note', 'environment', 'healthCheckUrl'
      ])

      const service = await Service.create(data)
      await service.load('server')

      return response.status(201).json({
        success: true,
        data: service.serialize(),
        message: 'Service créé avec succès'
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        error: 'Erreur lors de la création du service'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/services/{id}:
   *   get:
   *     tags: [Services]
   *     summary: Détails d'un service
   *     description: Retourne les détails d'un service par son ID, incluant serveur et dépendances
   *     operationId: getServiceV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du service
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Détails du service
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
   *         description: Service non trouvé
   */
  async show({ params, response }: HttpContext) {
    try {
      const service = await Service.query()
        .where('id', params.id)
        .preload('server')
        .preload('dependencies', (query) => {
          query.pivotColumns(['label', 'type'])
        })
        .preload('dependents', (query) => {
          query.pivotColumns(['label', 'type'])
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
   * @swagger
   * /api/v1/services/{id}:
   *   put:
   *     tags: [Services]
   *     summary: Mettre à jour un service
   *     description: Met à jour les informations d'un service existant
   *     operationId: updateServiceV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du service
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
   *               server_id:
   *                 type: integer
   *               image:
   *                 type: string
   *               port:
   *                 type: integer
   *               path:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Service mis à jour avec succès
   *       404:
   *         description: Service non trouvé
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      const data = request.only([
        'nom', 'server_id', 'image', 'port', 'path', 'description',
        'repoUrl', 'color', 'note', 'environment', 'healthCheckUrl'
      ])

      await service.merge(data).save()
      await service.load('server')

      return response.json({
        success: true,
        data: service.serialize(),
        message: 'Service mis à jour avec succès'
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Service non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/services/{id}:
   *   delete:
   *     tags: [Services]
   *     summary: Supprimer un service
   *     description: Supprime définitivement un service et toutes ses dépendances
   *     operationId: deleteServiceV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du service
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Service supprimé avec succès
   *       404:
   *         description: Service non trouvé
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      await service.delete()

      return response.json({
        success: true,
        message: 'Service supprimé avec succès'
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Service non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/services/{id}/status:
   *   get:
   *     tags: [Services]
   *     summary: Statut d'un service
   *     description: Retourne le statut en temps réel d'un service spécifique
   *     operationId: getServiceStatusV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du service
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Statut du service
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
   *                       enum: [running, stopped, error]
   *                       example: "running"
   *                     uptime:
   *                       type: string
   *                       example: "5 days, 12 hours"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async status({ params, response }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)

      // Simulation du statut (à remplacer par un vrai health check)
      const status = {
        id: service.id,
        name: service.nom,
        status: Math.random() > 0.1 ? 'running' : 'stopped',
        uptime: '5 days, 12 hours',
        lastCheck: new Date().toISOString(),
        healthUrl: service.healthCheckUrl
      }

      return response.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Service non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/services/{id}/toggle:
   *   patch:
   *     tags: [Services]
   *     summary: Démarrer/Arrêter un service
   *     description: Change l'état d'un service (démarrage ou arrêt)
   *     operationId: toggleServiceV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du service
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: État du service modifié
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
   *                     status:
   *                       type: string
   *                     message:
   *                       type: string
   *       404:
   *         description: Service non trouvé
   */
  async toggle({ params, response }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)

      // Simulation du toggle (à remplacer par une vraie gestion Docker)
      const newStatus = Math.random() > 0.5 ? 'running' : 'stopped'

      return response.json({
        success: true,
        data: {
          id: service.id,
          name: service.nom,
          status: newStatus,
          message: `Service ${newStatus === 'running' ? 'démarré' : 'arrêté'} avec succès`
        }
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Service non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/services/{id}/dependencies:
   *   get:
   *     tags: [Services]
   *     summary: Dépendances d'un service
   *     description: Retourne la liste de toutes les dépendances d'un service
   *     operationId: getServiceDependenciesV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du service
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Liste des dépendances
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
   *         description: Service non trouvé
   */
  async dependencies({ params, response }: HttpContext) {
    try {
      const service = await Service.query()
        .where('id', params.id)
        .preload('dependencies', (query) => {
          query.pivotColumns(['label', 'type'])
          query.preload('server')
        })
        .firstOrFail()

      return response.json({
        success: true,
        data: service.dependencies.map((dep: any) => dep.serialize())
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Service non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/services/{id}/dependencies:
   *   post:
   *     tags: [Services]
   *     summary: Ajouter une dépendance
   *     description: Ajoute une dépendance à un service avec un type et label optionnels
   *     operationId: addServiceDependencyV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du service
   *         schema:
   *           type: integer
   *           example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [dependency_id]
   *             properties:
   *               dependency_id:
   *                 type: integer
   *                 example: 2
   *               label:
   *                 type: string
   *                 example: "Base de données"
   *               type:
   *                 type: string
   *                 example: "database"
   *     responses:
   *       201:
   *         description: Dépendance ajoutée avec succès
   *       400:
   *         description: Erreur de validation ou dépendance circulaire
   */
  async addDependency({ params, request, response }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      const { dependency_id, label, type } = request.only(['dependency_id', 'label', 'type'])

      // Vérification de la dépendance circulaire basique
      if (dependency_id === service.id) {
        return response.status(400).json({
          success: false,
          error: 'Un service ne peut pas dépendre de lui-même'
        })
      }

      await service.related('dependencies').attach({
        [dependency_id]: {
          label: label || 'Dépendance',
          type: type || 'service'
        }
      })

      return response.status(201).json({
        success: true,
        message: 'Dépendance ajoutée avec succès'
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        error: 'Erreur lors de l\'ajout de la dépendance'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/services/{id}/dependencies/{dependencyId}:
   *   delete:
   *     tags: [Services]
   *     summary: Supprimer une dépendance
   *     description: Retire une dépendance d'un service
   *     operationId: removeServiceDependencyV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID du service
   *         schema:
   *           type: integer
   *           example: 1
   *       - name: dependencyId
   *         in: path
   *         required: true
   *         description: ID de la dépendance à supprimer
   *         schema:
   *           type: integer
   *           example: 2
   *     responses:
   *       200:
   *         description: Dépendance supprimée avec succès
   *       404:
   *         description: Service ou dépendance non trouvé
   */
  async removeDependency({ params, response }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      await service.related('dependencies').detach([params.dependencyId])

      return response.json({
        success: true,
        message: 'Dépendance supprimée avec succès'
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        error: 'Service ou dépendance non trouvé'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/services/available:
   *   get:
   *     tags: [Services]
   *     summary: Services disponibles
   *     description: Retourne la liste des services disponibles pour créer des dépendances
   *     operationId: getAvailableServicesV1
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: exclude_id
   *         in: query
   *         description: ID du service à exclure de la liste
   *         required: false
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Liste des services disponibles
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
   *                       name:
   *                         type: string
   *                       image:
   *                         type: string
   *                       server:
   *                         type: object
   */
  async available({ request, response }: HttpContext) {
    try {
      const excludeId = request.input('exclude_id')

      let query = Service.query()
        .preload('server')
        .select(['id', 'nom', 'server_id', 'image'])
        .orderBy('nom', 'asc')

      if (excludeId) {
        query = query.whereNot('id', excludeId)
      }

      const services = await query

      return response.json({
        success: true,
        data: services.map((service: any) => ({
          id: service.id,
          name: service.nom,
          image: service.image,
          server: service.server ? {
            id: service.server.id,
            name: service.server.nom
          } : null
        }))
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des services disponibles'
      })
    }
  }
}
