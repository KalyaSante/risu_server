import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'

export default class DashboardController {
  /**
   * 🎯 Page principale avec la cartographie interactive
   * MIGRATION INERTIA: view.render() → inertia.render()
   */
  async index({ inertia, session }: HttpContext) {
    // Récupérer toutes les données nécessaires
    const servers = await Server.query()
      .preload('services', (servicesQuery) => {
        servicesQuery.preload('dependencies', (depQuery) => {
          depQuery.pivotColumns(['label', 'type'])
        })
      })
      .preload('parent')
      .preload('parent')

    const services = await Service.query()
      .preload('server')
      .preload('dependencies', (query) => {
        query.pivotColumns(['label', 'type'])
      })
      .preload('dependents', (query) => {
        query.pivotColumns(['label', 'type'])
      })

    // Construire les données pour le graphique Cytoscape.js
    const graphData = this.buildGraphData(servers, services)

    // Stats pour les cards
    const stats = {
      totalServers: servers.length,
      totalServices: services.length,
      totalDependencies: graphData.elements.filter(el => el.data?.type === 'dependency').length,
      uptime: 98 // Tu peux calculer ça dynamiquement plus tard
    }

    // Utilisateur connecté
    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    // ✅ INERTIA: Rendu avec Svelte
    return inertia.render('Dashboard/Index', {
      servers: servers.map(server => ({
        id: server.id,
        name: server.nom,
        ip: server.ip,
        status: 'online', // Tu peux calculer ça dynamiquement
        servicesCount: server.services?.length || 0,
        hebergeur: server.hebergeur,
        localisation: server.localisation
      })),
      services,
      stats,
      user,
      graphData // Pour la cartographie interactive si tu veux la garder
    })
  }

  /**
   * 🎯 Vue détaillée d'un service
   * MIGRATION INERTIA: view.render() → inertia.render()
   */
  async serviceDetail({ params, inertia }: HttpContext) {
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

    // ✅ INERTIA: Rendu avec Svelte
    return inertia.render('Dashboard/ServiceDetail', {
      service,
      // Données formatées pour Svelte
      dependencies: service.dependencies.map(dep => ({
        id: dep.id,
        name: dep.nom,
        type: dep.$extras.pivot_type,
        label: dep.$extras.pivot_label,
        server: dep.server?.nom
      })),
      dependents: service.dependents.map(dep => ({
        id: dep.id,
        name: dep.nom,
        type: dep.$extras.pivot_type,
        label: dep.$extras.pivot_label,
        server: dep.server?.nom
      }))
    })
  }

  /**
   * API endpoint pour récupérer les données du réseau
   * (Garde ça pour AJAX si besoin)
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
        dependenciesCount: graphData.elements.filter(el => el.data?.type === 'dependency').length
      }
    })
  }

  /**
   * Construire les données du graphique pour Cytoscape.js avec nœuds composés
   */
  private buildGraphData(servers: any[], services: any[]) {
    const elements = [
      // Serveurs comme nœuds parents
      ...servers.map(server => ({
        data: {
          id: `server_${server.id}`,
          label: server.nom,
          type: 'server',
          parent: server.parentServerId ? `server_${server.parentServerId}` : undefined,
          // Données supplémentaires pour les détails
          server_id: server.id,
          ip: server.ip,
          hebergeur: server.hebergeur,
          localisation: server.localisation,
          services_count: server.services?.length || 0
        }
      })),

      // Services comme nœuds enfants (avec parent = serveur)
      ...services.map(service => ({
        data: {
          id: `service_${service.id}`,
          label: service.nom,
          type: 'service',
          parent: `server_${service.serverId}`, // 🎯 Clé magique pour les nœuds composés !
          // Données supplémentaires pour les détails
          server_id: service.serverId,
          server_name: service.server.nom,
          icon: service.icon,
          path: service.path,
          repo_url: service.repoUrl,
          doc_path: service.docPath,
          last_maintenance_at: service.lastMaintenanceAt?.toISO()
        }
      })),
      
      // Edges d'hébergement entre serveurs
      ...servers
        .filter((s) => s.parentServerId)
        .map((s) => ({
          data: {
            id: `server_${s.parentServerId}_child_${s.id}`,
            source: `server_${s.parentServerId}`,
            target: `server_${s.id}`,
            type: 'server',
            color: '#6366f1'
          }
        })),

      // Edges de dépendances entre services
      ...services.flatMap(service =>
        service.dependencies.map(dep => ({
          data: {
            id: `dep_${service.id}_${dep.id}`,
            source: `service_${service.id}`,
            target: `service_${dep.id}`,
            type: 'dependency',
            label: dep.$extras.pivot_label,
            color: this.getEdgeColor(dep.$extras.pivot_type),
            dependency_type: dep.$extras.pivot_type,
            dependency_label: dep.$extras.pivot_label
          }
        }))
      )
    ]

    return { elements }
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
