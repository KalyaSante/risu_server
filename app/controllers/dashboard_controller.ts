import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'

export default class DashboardController {
  /**
   * Page principale avec la cartographie interactive
   */
  async index({ view, request }: HttpContext) {
    // Récupérer l'utilisateur depuis le middleware OAuth
    const user = request.ctx?.user

    // Récupérer toutes les données pour le graphique
    const servers = await Server.query().preload('services')

    const services = await Service.query()
      .preload('server')
      .preload('dependencies', (query) => {
        query.pivotColumns(['label', 'type'])
      })
      .preload('dependents', (query) => {
        query.pivotColumns(['label', 'type'])
      })

    // Préparer les données pour le frontend (format compatible Vis.js)
    const graphData = {
      nodes: [
        // Serveurs comme groupes
        ...servers.map(server => ({
          id: `server_${server.id}`,
          label: server.nom,
          group: 'servers',
          title: `${server.ip} (${server.hebergeur})`,
          physics: false,
          x: 0,
          y: 0
        })),
        // Services comme nœuds
        ...services.map(service => ({
          id: `service_${service.id}`,
          label: service.nom,
          group: 'services',
          title: `Serveur: ${service.server.nom}`,
          server_id: service.serverId,
          icon: service.icon,
          path: service.path,
          repo_url: service.repoUrl,
          doc_path: service.docPath
        }))
      ],
      edges: services.flatMap(service =>
        service.dependencies.map(dep => ({
          from: `service_${service.id}`,
          to: `service_${dep.id}`,
          label: dep.$extras.pivot_label,
          color: dep.$extras.pivot_type === 'required' ? '#ff4444' : '#44ff44',
          arrows: 'to'
        }))
      )
    }

    return view.render('dashboard/index', {
      user,
      servers,
      services,
      graphData: JSON.stringify(graphData)
    })
  }
}
