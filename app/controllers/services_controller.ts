import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import Server from '#models/server'
import { createServiceValidator, updateServiceValidator } from '#validators/service'
import { DateTime } from 'luxon'

// ✅ FIX: Interface pour les erreurs de validation
interface ValidationMessage {
  message: string
  field: string
  rule: string
}

interface ValidationError extends Error {
  messages: ValidationMessage[]
}

export default class ServicesController {
  /**
   * ✅ NOUVEAU: Helper pour nettoyer les ports
   */
  private cleanPorts(ports: any[]): any[] | null {
    if (!ports || !Array.isArray(ports)) return null

    const validPorts = ports.filter(port =>
      port && (port.port || port.label)
    )

    return validPorts.length > 0 ? validPorts : null
  }

  /**
   * Liste tous les services
   * ✅ MIGRÉ VERS INERTIA + PORTS SIMPLES
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

    // ✅ Formater les données pour Svelte avec ports simples
    const formattedServices = services.serialize().data.map((service: any) => ({
      id: service.id,
      name: service.nom,
      status: 'running',
      // ✅ SIMPLE: Juste le port principal et la liste des ports
      primaryPort: service.primaryPort,
      ports: service.allPorts,
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

    const formattedServers = servers.map((server: any) => ({
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
   */
  async create({ inertia, request, session }: HttpContext) {
    const serverId = request.input('server_id')
    const servers = await Server.query().orderBy('nom', 'asc')
    const selectedServer = serverId ? await Server.find(serverId) : null

    const formattedServers = servers.map((server: any) => ({
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
   * ✅ AMÉLIORÉ: Meilleure gestion des erreurs de validation + nettoyage des ports
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const validatedData = await request.validateUsing(createServiceValidator)

      // ✅ NOUVEAU: Nettoyer les ports après validation
      const cleanedPorts = this.cleanPorts(validatedData.ports || [])

      const payload = {
        ...validatedData,
        ports: cleanedPorts,
        lastMaintenanceAt: validatedData.lastMaintenanceAt
          ? DateTime.fromJSDate(new Date(validatedData.lastMaintenanceAt))
          : null
      }

      const service = await Service.create(payload)

      session.flash('success', `Service "${service.nom}" créé avec succès!`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      // ✅ AMÉLIORÉ: Meilleure gestion des erreurs de validation
      if ('messages' in error && Array.isArray((error as ValidationError).messages)) {
        const validationErrors: Record<string, string> = {}

        ;(error as ValidationError).messages.forEach((msg: ValidationMessage) => {
          validationErrors[msg.field] = msg.message
        })

        session.flash({ errors: validationErrors });
        session.flashAll();
        return response.redirect().back();
      } else {
        session.flash('error', 'Erreur lors de la création du service')
        return response.redirect().back()
      }
    }
  }

  /**
   * Affiche les détails d'un service
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

    const formattedService = {
      id: service.id,
      nom: service.nom,
      status: 'running',
      primaryPort: service.primaryPort,
      ports: service.allPorts,
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

    const formattedDependencies = service.dependencies.map((dep: any) => ({
      id: dep.id,
      name: dep.nom,
      type: dep.$extras.pivot_type,
      label: dep.$extras.pivot_label,
      server: dep.server?.nom
    }))

    const formattedDependents = service.dependents.map((dep: any) => ({
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
   * ✅ AMÉLIORÉ: Meilleur formatage des données
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
      primaryPort: service.primaryPort,
      // ✅ AMÉLIORÉ: S'assurer qu'il y a toujours au moins un port par défaut
      ports: service.allPorts && service.allPorts.length > 0
        ? service.allPorts
        : [{ port: '', label: 'web' }],
      path: service.path,
      icon: service.icon,
      description: service.description || '',
      repoUrl: service.repoUrl,
      docPath: service.docPath,
      serverId: service.serverId,
      // ✅ NOUVEAU: Formater la date pour l'input datetime-local
      lastMaintenanceAt: service.lastMaintenanceAt
        ? service.lastMaintenanceAt.toFormat('yyyy-MM-dd\'T\'HH:mm')
        : ''
    }

    const formattedServers = servers.map((server: any) => ({
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
   * ✅ AMÉLIORÉ: Meilleure gestion des erreurs de validation + nettoyage des ports
   */
  async update({ params, request, response, session }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      const validatedData = await request.validateUsing(updateServiceValidator)

      // ✅ NOUVEAU: Nettoyer les ports après validation
      const cleanedPorts = this.cleanPorts(validatedData.ports || [])

      const payload = {
        ...validatedData,
        ports: cleanedPorts,
        lastMaintenanceAt: validatedData.lastMaintenanceAt
          ? DateTime.fromJSDate(new Date(validatedData.lastMaintenanceAt))
          : null
      }

      await service.merge(payload).save()

      session.flash('success', `Service "${service.nom}" mis à jour avec succès!`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      // ✅ AMÉLIORÉ: Meilleure gestion des erreurs de validation
      if ('messages' in error && Array.isArray((error as ValidationError).messages)) {
        const validationErrors: Record<string, string> = {}

        ;(error as ValidationError).messages.forEach((msg: ValidationMessage) => {
          validationErrors[msg.field] = msg.message
        })

        session.flash({ errors: validationErrors });
        session.flashAll();
        return response.redirect().back();
      } else {
        session.flash('error', 'Erreur lors de la mise à jour du service')
        return response.redirect().back()
      }
    }
  }

  /**
   * Supprime un service
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
