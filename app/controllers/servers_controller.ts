import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import { createServerValidator, updateServerValidator } from '#validators/server'

export default class ServersController {
  /**
   * Liste tous les serveurs
   * ✅ MIGRÉ VERS INERTIA
   */
  async index({ inertia, session }: HttpContext) {
    const servers = await Server.query()
      .preload('services')
      .orderBy('nom', 'asc')

    // Formater les données pour Svelte
    const formattedServers = servers.map(server => ({
      id: server.id,
      name: server.nom,
      ip: server.ip,
      status: 'online', // Tu peux calculer ça dynamiquement
      servicesCount: server.services?.length || 0,
      hebergeur: server.hebergeur,
      localisation: server.localisation,
      description: server.description || '',
      services: server.services?.map(service => ({
        id: service.id,
        name: service.nom,
        path: service.path,
        icon: service.icon
      })) || []
    }))

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    return inertia.render('Servers/Index', {
      servers: formattedServers,
      user,
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error')
      }
    })
  }

  /**
   * Affiche le formulaire de création
   * ✅ MIGRÉ VERS INERTIA
   */
  async create({ inertia, session }: HttpContext) {
    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    return inertia.render('Servers/Create', {
      user,
      errors: {},
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error')
      }
    })
  }

  /**
   * Stocke un nouveau serveur
   * ✅ OPTIMISÉ POUR INERTIA
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const payload = await request.validateUsing(createServerValidator)

      const server = await Server.create(payload)

      session.flash('success', `Serveur "${server.nom}" créé avec succès!`)
      return response.redirect().toRoute('servers.show', { id: server.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la création du serveur')
      return response.redirect().back()
    }
  }

  /**
   * Affiche les détails d'un serveur
   * ✅ MIGRÉ VERS INERTIA
   */
  async show({ params, inertia, session }: HttpContext) {
    const server = await Server.query()
      .where('id', params.id)
      .preload('services', (query) => {
        query.preload('dependencies', (depQuery) => {
          depQuery.pivotColumns(['label', 'type'])
        })
        query.orderBy('nom', 'asc')
      })
      .firstOrFail()

    // Formater les données pour Svelte
    const formattedServer = {
      id: server.id,
      name: server.nom,
      ip: server.ip,
      status: 'online', // Tu peux calculer ça dynamiquement
      hebergeur: server.hebergeur,
      localisation: server.localisation,
      description: server.description || '',
      services: server.services?.map(service => ({
        id: service.id,
        name: service.nom,
        path: service.path,
        icon: service.icon,
        dependenciesCount: service.dependencies?.length || 0,
        repoUrl: service.repoUrl,
        lastMaintenanceAt: service.lastMaintenanceAt?.toISO()
      })) || []
    }

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    return inertia.render('Servers/Show', {
      server: formattedServer,
      user,
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error')
      }
    })
  }

  /**
   * Affiche le formulaire d'édition
   * ✅ MIGRÉ VERS INERTIA
   */
  async edit({ params, inertia, session }: HttpContext) {
    const server = await Server.findOrFail(params.id)

    const formattedServer = {
      id: server.id,
      nom: server.nom,
      ip: server.ip,
      hebergeur: server.hebergeur,
      localisation: server.localisation,
      description: server.description || ''
    }

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    return inertia.render('Servers/Edit', {
      server: formattedServer,
      user,
      errors: {},
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error')
      }
    })
  }

  /**
   * Met à jour un serveur
   * ✅ OPTIMISÉ POUR INERTIA
   */
  async update({ params, request, response, session }: HttpContext) {
    try {
      const server = await Server.findOrFail(params.id)
      const payload = await request.validateUsing(updateServerValidator)

      await server.merge(payload).save()

      session.flash('success', `Serveur "${server.nom}" mis à jour avec succès!`)
      return response.redirect().toRoute('servers.show', { id: server.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la mise à jour du serveur')
      return response.redirect().back()
    }
  }

  /**
   * Supprime un serveur
   * ✅ OPTIMISÉ POUR INERTIA
   */
  async destroy({ params, response, session }: HttpContext) {
    try {
      const server = await Server.query()
        .where('id', params.id)
        .preload('services')
        .firstOrFail()

      const serverName = server.nom
      const servicesCount = server.services.length

      await server.delete()

      session.flash('success',
        `Serveur "${serverName}" supprimé avec succès` +
        (servicesCount > 0 ? ` (${servicesCount} services supprimés)` : '')
      )
      return response.redirect().toRoute('servers.index')
    } catch (error) {
      session.flash('error', 'Erreur lors de la suppression du serveur')
      return response.redirect().back()
    }
  }
}
