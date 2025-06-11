import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'

export default class DashboardController {
  /**
   * Page principale avec la cartographie interactive
   */
  async index({ view }: HttpContext) {
    // Récupérer toutes les données nécessaires
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
      .preload('dependents', (query) => {
        query.pivotColumns(['label', 'type'])
      })

    // Construire les données pour le graphique Vis.js
    const graphData = this.buildGraphData(servers, services)

    return view.render('dashboard/index', {
      servers,
      services,
      graphData: JSON.stringify(graphData)
    })
  }

  /**
   * Vue détaillée d'un service
   */
  async serviceDetail({ params, view }: HttpContext) {
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

    return view.render('dashboard/service_detail', { service })
  }

  /**
   * API endpoint pour récupérer les données du réseau
   */
  async networkData({ response }: HttpContext) {
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
        dependenciesCount: graphData.edges.length
      }
    })
  }

  /**
   * Construire les données du graphique pour Vis.js
   */
  private buildGraphData(servers: any[], services: any[]) {
    const nodes = [
      // Serveurs comme nœuds de groupe
      ...servers.map(server => ({
        id: `server_${server.id}`,
        label: server.nom,
        group: 'servers',
        title: `${server.ip} (${server.hebergeur})`,
        level: 0,
        physics: false,
        // Données supplémentaires pour les détails
        server_id: server.id,
        ip: server.ip,
        hebergeur: server.hebergeur,
        localisation: server.localisation,
        services_count: server.services?.length || 0
      })),

      // Services comme nœuds
      ...services.map(service => ({
        id: `service_${service.id}`,
        label: service.nom,
        group: 'services',
        title: `${service.nom}\nServeur: ${service.server.nom}`,
        level: 1,
        // Données supplémentaires pour les détails
        server_id: service.serverId,
        server_name: service.server.nom,
        icon: service.icon,
        path: service.path,
        repo_url: service.repoUrl,
        doc_path: service.docPath,
        last_maintenance_at: service.lastMaintenanceAt?.toISO()
      }))
    ]

    const edges = services.flatMap(service =>
      service.dependencies.map(dep => ({
        from: `service_${service.id}`,
        to: `service_${dep.id}`,
        label: dep.$extras.pivot_label,
        title: `${service.nom} → ${dep.nom}\n${dep.$extras.pivot_label}`,
        color: this.getEdgeColor(dep.$extras.pivot_type),
        arrows: 'to',
        smooth: { type: 'continuous' },
        // Données supplémentaires
        type: dep.$extras.pivot_type,
        dependency_label: dep.$extras.pivot_label
      }))
    )

    return { nodes, edges }
  }

  /**
   * Obtenir la couleur d'un edge selon son type
   */
  private getEdgeColor(type: string) {
    const colors = {
      required: '#ef4444',    // Rouge pour les dépendances critiques
      optional: '#f59e0b',    // Orange pour les dépendances optionnelles
      fallback: '#10b981'     // Vert pour les fallbacks
    }
    return colors[type] || '#6b7280'
  }
}
