import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'

export default class DashboardApiController {
  /**
   * Endpoint pour récupérer les données du réseau en JSON
   */
  async networkData({ response }: HttpContext) {
    try {
      const servers = await Server.query()
        .preload('services', (servicesQuery) => {
          servicesQuery.preload('dependencies', (depQuery) => {
            depQuery.pivotColumns(['label', 'type'])
          })
        })

      const services = await Service.query()
        .preload('server')
        .preload('dependencies', (query) => {
          query.pivotColumns(['label', 'type'])
        })

      const graphData = this.buildGraphData(servers, services)

      return response.json({
        success: true,
        data: graphData,
        meta: {
          serversCount: servers.length,
          servicesCount: services.length,
          dependenciesCount: graphData.edges.length,
          lastUpdated: new Date().toISOString()
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données du réseau'
      })
    }
  }

  /**
   * Endpoint pour les statistiques du dashboard
   */
  async stats({ response }: HttpContext) {
    try {
      const [serversCount, servicesCount, dependenciesCount] = await Promise.all([
        Server.query().count('* as total'),
        Service.query().count('* as total'),
        Service.query()
          .join('service_dependencies', 'services.id', 'service_dependencies.service_id')
          .count('* as total')
      ])

      return response.json({
        success: true,
        data: {
          servers: serversCount[0].$extras.total,
          services: servicesCount[0].$extras.total,
          dependencies: dependenciesCount[0].$extras.total
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      })
    }
  }

  /**
   * Construire les données du graphique pour Vis.js
   */
  private buildGraphData(servers: any[], services: any[]) {
    const nodes = [
      ...servers.map(server => ({
        id: `server_${server.id}`,
        label: server.nom,
        group: 'servers',
        title: `${server.ip} (${server.hebergeur})`,
        level: 0,
        physics: false,
        server_id: server.id,
        ip: server.ip,
        hebergeur: server.hebergeur,
        localisation: server.localisation,
        services_count: server.services?.length || 0
      })),
      
      ...services.map(service => ({
        id: `service_${service.id}`,
        label: service.nom,
        group: 'services',
        title: `${service.nom}\nServeur: ${service.server.nom}`,
        level: 1,
        server_id: service.serverId,
        server_name: service.server.nom,
        icon: service.icon,
        path: service.path,
        repo_url: service.repoUrl,
        doc_path: service.docPath,
        last_maintenance_at: service.lastMaintenanceAt?.toISO()
      }))
    ]

    const edges = [
      // liaison serveur -> serveur
      ...servers
        .filter((s) => s.parentServerId)
        .map((s) => ({
          from: `server_${s.parentServerId}`,
          to: `server_${s.id}`,
          color: '#6366f1',
          arrows: 'to',
          type: 'server'
        })),

      // dépendances de services
      ...services.flatMap((service) =>
        service.dependencies.map(dep => ({
          from: `service_${service.id}`,
          to: `service_${dep.id}`,
          label: dep.$extras.pivot_label,
          title: `${service.nom} → ${dep.nom}\n${dep.$extras.pivot_label}`,
          color: this.getEdgeColor(dep.$extras.pivot_type),
          arrows: 'to',
          smooth: { type: 'continuous' },
          type: dep.$extras.pivot_type,
          dependency_label: dep.$extras.pivot_label
        }))
      )
    ]

    return { nodes, edges }
  }

  /**
   * Obtenir la couleur d'un edge selon son type
   */
  private getEdgeColor(type: string) {
    const colors = {
      required: '#ef4444',
      optional: '#f59e0b',
      fallback: '#10b981'
    }
    return colors[type] || '#6b7280'
  }
}
