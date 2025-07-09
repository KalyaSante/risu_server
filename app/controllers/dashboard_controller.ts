import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'
import type { ServiceDependency } from '#types/oauth'
import { getDependencyColor } from '#types/pagination'

export default class DashboardController {
  /**
   * 🎯 Page principale avec la cartographie interactive
   * MIGRATION INERTIA: view.render() → inertia.render()
   */
  async index({ inertia, session }: HttpContext) {
    // ✅ FIX: Vérifier l'authentification avant tout
    const sessionUserId = session.get('user_id')
    const sessionUserEmail = session.get('user_email')
    const sessionUserName = session.get('user_name')

    // ✅ Si les données sont manquantes, forcer la déconnexion
    if (!sessionUserId || !sessionUserEmail) {
      session.clear()
      session.flash('error', 'Session expirée, veuillez vous reconnecter')
      return inertia.location('/auth/login')
    }

    // Récupérer toutes les données nécessaires
    const servers = await Server.query()
      .preload('services', (servicesQuery) => {
        servicesQuery
          .preload('serviceImage') // ✅ NOUVEAU: Preload de l'image pour les services des serveurs
          .preload('dependencies', (depQuery) => {
            depQuery.pivotColumns(['label', 'type'])
          })
      })
      .preload('parent')

    const services = await Service.query()
      .preload('server')
      .preload('serviceImage') // ✅ NOUVEAU: Preload de l'image pour le dashboard
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
      totalDependencies: graphData.elements.filter((el: any) => el.data?.type === 'dependency')
        .length,
      uptime: 98, // Tu peux calculer ça dynamiquement plus tard
    }

    // ✅ FIX: Utilisateur connecté sans valeurs par défaut problématiques
    const user = {
      id: sessionUserId,
      email: sessionUserEmail,
      fullName: sessionUserName,
    }

    // ✅ INERTIA: Rendu avec Svelte
    return inertia.render('Dashboard/Index', {
      servers: servers.map((server: any) => ({
        id: server.id,
        name: server.nom,
        ip: server.ip,
        status: 'online', // Tu peux calculer ça dynamiquement
        servicesCount: server.services?.length || 0,
        hebergeur: server.hebergeur,
        localisation: server.localisation,
        color: server.color || 'neutral', // ✅ AJOUT: Couleur
        services: server.services || [],
      })),
      services,
      stats,
      user,
      graphData, // Pour la cartographie interactive si tu veux la garder
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
      dependencies: service.dependencies.map((dep: ServiceDependency) => ({
        id: dep.id,
        name: dep.nom,
        type: dep.$pivot?.type,
        label: dep.$pivot?.label,
        server: (dep as any).server?.nom,
      })),
      dependents: service.dependents.map((dep: ServiceDependency) => ({
        id: dep.id,
        name: dep.nom,
        type: dep.$pivot?.type,
        label: dep.$pivot?.label,
        server: (dep as any).server?.nom,
      })),
    })
  }

  /**
   * API endpoint pour récupérer les données du réseau
   * (Garde ça pour AJAX si besoin)
   */
  async networkData({ response }: HttpContext) {
    const servers = await Server.query().preload('services', (servicesQuery) => {
      servicesQuery
        .preload('serviceImage') // ✅ NOUVEAU: Preload de l'image pour l'API
        .preload('dependencies', (depQuery) => {
          depQuery.pivotColumns(['label', 'type'])
        })
    })

    const services = await Service.query()
      .preload('server')
      .preload('serviceImage') // ✅ NOUVEAU: Preload de l'image pour l'API
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
        dependenciesCount: graphData.elements.filter((el: any) => el.data?.type === 'dependency')
          .length,
      },
    })
  }

  /**
   * Construire les données du graphique pour Cytoscape.js avec nœuds composés
   */
  private buildGraphData(servers: any[], services: any[]) {
    const elements = [
      // Serveurs comme nœuds parents
      ...servers.map((server: any) => ({
        data: {
          id: `server_${server.id}`,
          label: server.nom,
          type: 'server',
          parent: server.parentServerId ? `server_${server.parentServerId}` : undefined,
          // ✅ AJOUT: Couleur du serveur
          color: server.color || 'neutral',
          // Données supplémentaires pour les détails
          server_id: server.id,
          ip: server.ip,
          hebergeur: server.hebergeur,
          localisation: server.localisation,
          services_count: server.services?.length || 0,
        },
      })),

      // Services comme nœuds enfants (avec parent = serveur)
      ...services.map((service: any) => ({
        data: {
          id: `service_${service.id}`,
          label: service.nom,
          type: 'service',
          parent: `server_${service.serverId}`, // 🎯 Clé magique pour les nœuds composés !
          // ✅ AJOUT: Couleur du service
          color: service.color || 'neutral',
          // Données supplémentaires pour les détails
          server_id: service.serverId,
          server_name: service.server.nom,
          icon: service.iconUrl || service.icon, // ✅ NOUVEAU: Utilise le getter intelligent
          path: service.path,
          repo_url: service.repoUrl,
          doc_path: service.docPath,
          last_maintenance_at: service.lastMaintenanceAt?.toISO(),
        },
      })),

      // Edges de dépendances entre services
      ...services.flatMap((service: any) =>
        // ✅ FIX: Typage correct du paramètre dep
        service.dependencies.map((dep: ServiceDependency) => ({
          data: {
            id: `dep_${service.id}_${dep.id}`,
            source: `service_${service.id}`,
            target: `service_${dep.id}`,
            type: 'dependency',
            label: dep.$pivot?.label,
            color: this.getEdgeColor(dep.$pivot?.type || 'fallback'),
            dependency_type: dep.$pivot?.type,
            dependency_label: dep.$pivot?.label,
          },
        }))
      ),
    ]

    return { elements }
  }

  /**
   * ✅ FIX: Obtenir la couleur d'un edge selon son type avec typage strict
   */
  private getEdgeColor(type: string): string {
    return getDependencyColor(type)
  }
}
