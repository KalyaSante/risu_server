import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import Server from '#models/server'
import { createServiceValidator, updateServiceValidator } from '#validators/service'

export default class ServicesController {
  /**
   * Liste tous les services
   * ✅ MIGRÉ VERS INERTIA
   */
  async index({ inertia, request, session }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const serverId = request.input('server_id')

    let query = Service.query()
      .preload('server')
      .preload('dependencies', (q) => q.pivotColumns(['label', 'type']))

    if (search) {
      query = query.where('nom', 'LIKE', `%${search}%`)
    }

    if (serverId) {
      query = query.where('server_id', serverId)
    }

    const services = await query
      .orderBy('nom', 'asc')
      .paginate(page, 20)

    const servers = await Server.query().orderBy('nom', 'asc')

    // Formater les données pour Svelte
    const formattedServices = services.serialize().data.map(service => ({
      id: service.id,
      name: service.nom,
      status: 'running', // Tu peux calculer ça dynamiquement
      port: service.port,
      path: service.path,
      icon: service.icon,
      description: service.description || '',
      server: service.server ? {
        id: service.server.id,
        name: service.server.nom,
        ip: service.server.ip
      } : null,
      dependenciesCount: service.dependencies?.length || 0,
      repoUrl: service.repoUrl,
      docPath: service.docPath,
      lastMaintenanceAt: service.lastMaintenanceAt
    }))

    const formattedServers = servers.map(server => ({
      id: server.id,
      name: server.nom,
      ip: server.ip
    }))

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    return inertia.render('Services/Index', {
      services: formattedServices,
      servers: formattedServers,
      pagination: {
        currentPage: services.currentPage,
        lastPage: services.lastPage,
        total: services.total,
        perPage: services.perPage
      },
      filters: {
        search: search,
        selectedServerId: serverId
      },
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
  async create({ inertia, request, session }: HttpContext) {
    const serverId = request.input('server_id')
    const servers = await Server.query().orderBy('nom', 'asc')
    const selectedServer = serverId ? await Server.find(serverId) : null

    const formattedServers = servers.map(server => ({
      id: server.id,
      name: server.nom,
      ip: server.ip
    }))

    const formattedSelectedServer = selectedServer ? {
      id: selectedServer.id,
      name: selectedServer.nom,
      ip: selectedServer.ip
    } : null

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    return inertia.render('Services/Create', {
      servers: formattedServers,
      selectedServer: formattedSelectedServer,
      user,
      errors: {},
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error')
      }
    })
  }

  /**
   * Stocke un nouveau service
   * ✅ OPTIMISÉ POUR INERTIA
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const payload = await request.validateUsing(createServiceValidator)

      const service = await Service.create(payload)

      session.flash('success', `Service "${service.nom}" créé avec succès!`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la création du service')
      return response.redirect().back()
    }
  }

  /**
   * Affiche les détails d'un service
   * ✅ MIGRÉ VERS INERTIA
   */
  async show({ params, inertia, session }: HttpContext) {
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

    // Formater les données pour Svelte
    const formattedService = {
      id: service.id,
      nom: service.nom,
      status: 'running', // Tu peux calculer ça dynamiquement
      port: service.port,
      path: service.path,
      icon: service.icon,
      description: service.description || '',
      repoUrl: service.repoUrl,
      docPath: service.docPath,
      lastMaintenanceAt: service.lastMaintenanceAt?.toISO(),
      server: service.server ? {
        id: service.server.id,
        nom: service.server.nom,
        ip: service.server.ip
      } : null
    }

    const formattedDependencies = service.dependencies.map(dep => ({
      id: dep.id,
      name: dep.nom,
      type: dep.$extras.pivot_type,
      label: dep.$extras.pivot_label,
      server: dep.server?.nom
    }))

    const formattedDependents = service.dependents.map(dep => ({
      id: dep.id,
      name: dep.nom,
      type: dep.$extras.pivot_type,
      label: dep.$extras.pivot_label,
      server: dep.server?.nom
    }))

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    return inertia.render('Services/Show', {
      service: formattedService,
      dependencies: formattedDependencies,
      dependents: formattedDependents,
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
    const service = await Service.query()
      .where('id', params.id)
      .preload('server')
      .firstOrFail()

    const servers = await Server.query().orderBy('nom', 'asc')

    const formattedService = {
      id: service.id,
      nom: service.nom,
      port: service.port,
      path: service.path,
      icon: service.icon,
      description: service.description || '',
      repoUrl: service.repoUrl,
      docPath: service.docPath,
      serverId: service.serverId
    }

    const formattedServers = servers.map(server => ({
      id: server.id,
      name: server.nom,
      ip: server.ip
    }))

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya'
    }

    return inertia.render('Services/Edit', {
      service: formattedService,
      servers: formattedServers,
      user,
      errors: {},
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error')
      }
    })
  }

  /**
   * Met à jour un service
   * ✅ OPTIMISÉ POUR INERTIA
   */
  async update({ params, request, response, session }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      const payload = await request.validateUsing(updateServiceValidator)

      await service.merge(payload).save()

      session.flash('success', `Service "${service.nom}" mis à jour avec succès!`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la mise à jour du service')
      return response.redirect().back()
    }
  }

  /**
   * Supprime un service
   * ✅ OPTIMISÉ POUR INERTIA
   */
  async destroy({ params, response, session }: HttpContext) {
    try {
      const service = await Service.query()
        .where('id', params.id)
        .preload('dependencies')
        .preload('dependents')
        .firstOrFail()

      const serviceName = service.nom
      const dependenciesCount = service.dependencies.length + service.dependents.length

      await service.delete()

      session.flash('success',
        `Service "${serviceName}" supprimé avec succès` +
        (dependenciesCount > 0 ? ` (${dependenciesCount} relations supprimées)` : '')
      )
      return response.redirect().toRoute('services.index')
    } catch (error) {
      session.flash('error', 'Erreur lors de la suppression du service')
      return response.redirect().back()
    }
  }
}
