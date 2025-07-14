import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'

export default class DashboardV1Controller {
  /**
   * @swagger
   * /api/v1/dashboard/network-data:
   *   get:
   *     tags: [Dashboard]
   *     summary: Données réseau
   *     description: Retourne les données de topologie réseau pour visualisation
   *     operationId: getNetworkDataV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Données réseau avec nœuds et liens
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
   *                     nodes:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             example: "server-1"
   *                           type:
   *                             type: string
   *                             enum: [server, service]
   *                             example: "server"
   *                           name:
   *                             type: string
   *                             example: "Serveur Production"
   *                     links:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           source:
   *                             type: string
   *                             example: "service-1"
   *                           target:
   *                             type: string
   *                             example: "server-1"
   *                           type:
   *                             type: string
   *                             example: "hosted-on"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async networkData({ response }: HttpContext) {
    try {
      const servers = await Server.query()
        .preload('services', (query) => {
          query.preload('dependencies', (depQuery) => {
            depQuery.pivotColumns(['label', 'type'])
          })
        })

      const nodes: any[] = []
      const links: any[] = []

      // Ajouter les serveurs comme nœuds
      servers.forEach((server: any) => {
        nodes.push({
          id: `server-${server.id}`,
          type: 'server',
          name: server.nom,
          ip: server.ip,
          hebergeur: server.hebergeur,
          servicesCount: server.services.length
        })

        // Ajouter les services comme nœuds et créer des liens vers leur serveur
        server.services.forEach((service: any) => {
          nodes.push({
            id: `service-${service.id}`,
            type: 'service',
            name: service.nom,
            image: service.image,
            serverId: server.id
          })

          // Lien service -> serveur
          links.push({
            source: `service-${service.id}`,
            target: `server-${server.id}`,
            type: 'hosted-on',
            label: 'Hébergé sur'
          })

          // Liens entre services (dépendances)
          service.dependencies.forEach((dependency: any) => {
            links.push({
              source: `service-${service.id}`,
              target: `service-${dependency.id}`,
              type: 'depends-on',
              label: dependency.$extras.pivot_label || 'Dépendance'
            })
          })
        })
      })

      return response.json({
        success: true,
        data: {
          nodes,
          links
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données réseau'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/dashboard/status:
   *   get:
   *     tags: [Dashboard]
   *     summary: Statut global du système
   *     description: Retourne un aperçu du statut global des serveurs et services
   *     operationId: getSystemStatusV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statut global avec compteurs
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
   *                     servers:
   *                       type: object
   *                       properties:
   *                         total:
   *                           type: integer
   *                           example: 10
   *                         online:
   *                           type: integer
   *                           example: 9
   *                         offline:
   *                           type: integer
   *                           example: 1
   *                     services:
   *                       type: object
   *                       properties:
   *                         total:
   *                           type: integer
   *                           example: 25
   *                         running:
   *                           type: integer
   *                           example: 22
   *                         stopped:
   *                           type: integer
   *                           example: 3
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async status({ response }: HttpContext) {
    try {
      const servers = await Server.query().select(['id', 'nom', 'ip'])
      const services = await Service.query().select(['id', 'nom', 'server_id'])

      // Simulation des statuts (à remplacer par de vrais health checks)
      const serversOnline = Math.floor(servers.length * 0.95)
      const servicesRunning = Math.floor(services.length * 0.88)

      return response.json({
        success: true,
        data: {
          servers: {
            total: servers.length,
            online: serversOnline,
            offline: servers.length - serversOnline
          },
          services: {
            total: services.length,
            running: servicesRunning,
            stopped: services.length - servicesRunning
          }
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du statut'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/dashboard/overview:
   *   get:
   *     tags: [Dashboard]
   *     summary: Vue d'ensemble du système
   *     description: Retourne une vue d'ensemble complète avec métriques et statistiques
   *     operationId: getSystemOverviewV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Vue d'ensemble complète
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
   *                     summary:
   *                       type: object
   *                       properties:
   *                         totalServers:
   *                           type: integer
   *                           example: 10
   *                         totalServices:
   *                           type: integer
   *                           example: 25
   *                         avgServicesPerServer:
   *                           type: number
   *                           example: 2.5
   *                         hebergeurs:
   *                           type: integer
   *                           example: 3
   *                     topServers:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                           servicesCount:
   *                             type: integer
   *                     recentActivity:
   *                       type: array
   *                       items:
   *                         type: object
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async overview({ response }: HttpContext) {
    try {
      const servers = await Server.query()
        .preload('services')
        .orderBy('nom', 'asc')

      const services = await Service.query()
        .preload('server')
        .orderBy('createdAt', 'desc')
        .limit(10)

      // Calculs statistiques
      const totalServices = servers.reduce((sum, server: any) => sum + server.services.length, 0)
      const avgServicesPerServer = servers.length > 0 ? (totalServices / servers.length).toFixed(1) : 0

      // Top serveurs par nombre de services
      const topServers = servers
        .map((server: any) => ({
          id: server.id,
          name: server.nom,
          ip: server.ip,
          servicesCount: server.services.length,
          hebergeur: server.hebergeur
        }))
        .sort((a, b) => b.servicesCount - a.servicesCount)
        .slice(0, 5)

      // Activité récente (simulation)
      const recentActivity = services.slice(0, 10).map((service: any) => ({
        id: service.id,
        type: 'service_created',
        title: `Service "${service.nom}" créé`,
        server: service.server?.nom,
        timestamp: service.createdAt
      }))

      return response.json({
        success: true,
        data: {
          summary: {
            totalServers: servers.length,
            totalServices,
            avgServicesPerServer: parseFloat(avgServicesPerServer),
            hebergeurs: [...new Set(servers.map((s: any) => s.hebergeur))].length
          },
          topServers,
          recentActivity
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la vue d\'ensemble'
      })
    }
  }

  /**
   * @swagger
   * /api/v1/dashboard/metrics:
   *   get:
   *     tags: [Dashboard]
   *     summary: Métriques détaillées
   *     description: Retourne des métriques détaillées pour analytics et monitoring
   *     operationId: getSystemMetricsV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Métriques détaillées
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
   *                     performance:
   *                       type: object
   *                       properties:
   *                         avgResponseTime:
   *                           type: integer
   *                           example: 125
   *                         uptime:
   *                           type: number
   *                           example: 99.8
   *                         totalRequests:
   *                           type: integer
   *                           example: 55000
   *                         errorRate:
   *                           type: string
   *                           example: "1.2"
   *                     distribution:
   *                       type: object
   *                       properties:
   *                         hebergeurs:
   *                           type: object
   *                         services:
   *                           type: array
   *                     trends:
   *                       type: object
   *                       properties:
   *                         serversGrowth:
   *                           type: string
   *                           example: "+12% ce mois"
   *                         servicesGrowth:
   *                           type: string
   *                           example: "+8% ce mois"
   *                         efficiency:
   *                           type: string
   *                           example: "Stable"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async metrics({ response }: HttpContext) {
    try {
      const servers = await Server.query().preload('services')

      // Distribution par hébergeur
      const hebergeurDistribution = servers.reduce((acc: any, server: any) => {
        acc[server.hebergeur] = (acc[server.hebergeur] || 0) + 1
        return acc
      }, {})

      // Distribution des services par serveur
      const serviceDistribution = servers.map((server: any) => ({
        serverName: server.nom,
        servicesCount: server.services.length
      }))

      // Métriques de performance simulées
      const performanceMetrics = {
        avgResponseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        uptime: 99.8,
        totalRequests: Math.floor(Math.random() * 10000) + 50000,
        errorRate: (Math.random() * 2).toFixed(2) // 0-2%
      }

      return response.json({
        success: true,
        data: {
          performance: performanceMetrics,
          distribution: {
            hebergeurs: hebergeurDistribution,
            services: serviceDistribution
          },
          trends: {
            serversGrowth: '+12% ce mois',
            servicesGrowth: '+8% ce mois',
            efficiency: 'Stable'
          }
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des métriques'
      })
    }
  }
}
