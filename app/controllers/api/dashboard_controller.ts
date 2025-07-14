import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'
import type { ServiceDependency } from '#types/oauth'
import { getDependencyColor } from '#types/pagination'

export default class DashboardApiController {
  /**
   * @networkData
   * @summary Données pour le graphique réseau
   * @description Récupère les données complètes sur les serveurs, services et leurs dépendances pour construire une vue graphique du réseau.
   * @operationId getNetworkData
   * @tag Dashboard
   */
  async networkData({ response }: HttpContext) {
    try {
      const servers = await Server.query().preload('services', (servicesQuery) => {
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
          lastUpdated: new Date().toISOString(),
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données du réseau',
      })
    }
  }

  /**
   * @stats
   * @summary Statistiques générales
   * @description Fournit des statistiques clés sur l'infrastructure, comme le nombre total de serveurs, de services et de dépendances.
   * @operationId getStats
   * @tag Dashboard
   */
  async stats({ response }: HttpContext) {
    try {
      const [serversCount, servicesCount, dependenciesCount] = await Promise.all([
        Server.query().count('* as total'),
        Service.query().count('* as total'),
        Service.query()
          .join('service_dependencies', 'services.id', 'service_dependencies.service_id')
          .count('* as total'),
      ])

      return response.json({
        success: true,
        data: {
          servers: serversCount[0].$extras.total,
          services: servicesCount[0].$extras.total,
          dependencies: dependenciesCount[0].$extras.total,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
      })
    }
  }

  /**
   * Construire les données du graphique pour Vis.js
   */
  private buildGraphData(servers: any[], services: any[]) {
    const nodes = [
      ...servers.map((server: any) => ({
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
        services_count: server.services?.length || 0,
      })),

      ...services.map((service: any) => ({
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
        last_maintenance_at: service.lastMaintenanceAt?.toISO(),
      })),
    ]

    const edges = [
      // dépendances de services
      ...services.flatMap((service: any) =>
        // ✅ FIX: Typage correct du paramètre dep
        service.dependencies.map((dep: ServiceDependency) => ({
          from: `service_${service.id}`,
          to: `service_${dep.id}`,
          label: dep.$pivot?.label,
          title: `${service.nom} → ${dep.nom}\n${dep.$pivot?.label}`,
          color: this.getEdgeColor(dep.$pivot?.type || 'fallback'),
          arrows: 'to',
          smooth: { type: 'continuous' },
          type: dep.$pivot?.type,
          dependency_label: dep.$pivot?.label,
        }))
      ),
    ]

    return { nodes, edges }
  }

  /**
   * ✅ FIX: Obtenir la couleur d'un edge selon son type avec typage strict
   */
  private getEdgeColor(type: string): string {
    return getDependencyColor(type)
  }

  /**
   * @counts
   * @summary Compteurs principaux
   * @description Retourne le nombre total de serveurs et de services.
   * @operationId getCounts
   * @tag Dashboard
   */
  async counts({ response }: HttpContext) {
    try {
      const [serversCount, servicesCount] = await Promise.all([
        Server.query().count('* as total'),
        Service.query().count('* as total'),
      ])

      return response.json({
        success: true,
        data: {
          servers: serversCount[0].$extras.total,
          services: servicesCount[0].$extras.total,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: "Erreur lors de la récupération des compteurs",
      })
    }
  }

  /**
   * @activity
   * @summary Activité récente
   * @description Récupère les derniers services et serveurs modifiés pour un aperçu de l'activité récente.
   * @operationId getActivity
   * @tag Dashboard
   */
  async activity({ response }: HttpContext) {
    try {
      const [latestServices, latestServers] = await Promise.all([
        Service.query().orderBy('updated_at', 'desc').limit(5).preload('server'),
        Server.query().orderBy('updated_at', 'desc').limit(5),
      ])

      return response.json({
        success: true,
        data: {
          latestServices,
          latestServers,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: "Erreur lors de la récupération de l'activité récente",
      })
    }
  }
}
