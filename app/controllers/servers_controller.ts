import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'
import { createServerValidator, updateServerValidator } from '#validators/server'

export default class ServersController {
  /**
   * ✅ FIX: Méthode helper pour récupérer l'utilisateur authentifié
   */
  private getAuthenticatedUser(session: any): any {
    const sessionUserId = session.get('user_id')
    const sessionUserEmail = session.get('user_email')
    const sessionUserName = session.get('user_name')

    const user = {
      id: sessionUserId,
      email: sessionUserEmail || 'email-non-defini@kalya.com',
      fullName: sessionUserName || 'Utilisateur non défini'
    }

    // Debug
    console.log('👤 Utilisateur récupéré servers_controller:', user)

    return user
  }

  /**
   * Liste tous les serveurs
   * ✅ MIGRÉ VERS INERTIA
   */
  async index({ inertia, session }: HttpContext) {
    const servers = await Server.query()
      .preload('services')
      .preload('parent')
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
      parentServer: server.parent
        ? { id: server.parent.id, name: server.parent.nom }
        : null,
      services: server.services?.map(service => ({
        id: service.id,
        name: service.nom,
        path: service.path,
        icon: service.icon
      })) || []
    }))

    const user = this.getAuthenticatedUser(session)

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
    const user = this.getAuthenticatedUser(session)

    const servers = await Server.query().orderBy('nom', 'asc')
    const serverOptions = servers.map((s) => ({ id: s.id, name: s.nom }))

    return inertia.render('Servers/Create', {
      user,
      servers: serverOptions,
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
      // 🔧 FIX: Extraire les données du wrapper Inertia et créer un mock request
      const rawData = request.all()
      const formData = rawData.data || rawData

      // Créer un objet request mock pour VineJS
      const mockRequest = {
        all: () => formData,
        only: (keys) => {
          const result = {}
          keys.forEach(key => {
            if (formData[key] !== undefined) result[key] = formData[key]
          })
          return result
        },
        validateUsing: (validator) => validator.validate(formData)
      }

      const payload = await createServerValidator.validate(formData)

      const server = await Server.create(payload)

      session.flash('success', `Serveur "${server.nom}" créé avec succès!`)
      return response.redirect().toRoute('servers.show', { id: server.id })
    } catch (error) {
      console.error('💥 Erreur création serveur:', error)

      // Gestion des erreurs de validation VineJS
      if (error.messages) {
        const errorMessages = error.messages.map(msg => msg.message).join(', ')
        session.flash('error', `Erreur de validation: ${errorMessages}`)
      } else {
        session.flash('error', 'Erreur lors de la création du serveur')
      }
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
      .preload('parent')
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
      parentServer: server.parent
        ? { id: server.parent.id, name: server.parent.nom }
        : null,
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

    const user = this.getAuthenticatedUser(session)

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

    const servers = await Server.query().whereNot('id', params.id).orderBy('nom', 'asc')
    const serverOptions = servers.map((s) => ({ id: s.id, name: s.nom }))

    const formattedServer = {
      id: server.id,
      nom: server.nom,
      ip: server.ip,
      hebergeur: server.hebergeur,
      localisation: server.localisation,
      description: server.description || '',
      parentServerId: server.parentServerId
    }

    const user = this.getAuthenticatedUser(session)

    return inertia.render('Servers/Edit', {
      server: formattedServer,
      servers: serverOptions,
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
   * ✅ OPTIMISÉ POUR INERTIA avec FIX VineJS
   */
  async update({ params, request, response, session }: HttpContext) {
    try {
      const server = await Server.findOrFail(params.id)

      const rawData = request.all()
      const formData = rawData.data || rawData
      let payload
      try {
        payload = await updateServerValidator.validate(formData) // ✅ Méthode .validate()
      } catch (validationError) {
        // Gestion des erreurs VineJS
        let errorMessage = 'Erreur de validation'
        if (validationError?.messages && Array.isArray(validationError.messages)) {
          errorMessage = validationError.messages.map(err => err.message || err).join(', ')
        } else if (validationError?.message) {
          errorMessage = validationError.message
        }

        session.flash('error', `Erreur de validation: ${errorMessage}`)
        return response.redirect().back()
      }

      await server.merge(payload).save()
      session.flash('success', `Serveur "${server.nom}" mis à jour avec succès!`)
      return response.redirect().toRoute('servers.show', { id: server.id })

    } catch (error) {
      // 🔍 DEBUG: Log de l'erreur complète
      console.error('💥 Erreur complète lors de la mise à jour:', error)
      console.error('📍 Stack trace:', error.stack)

      // Message d'erreur plus détaillée pour le développement
      const isDevelopment = process.env.NODE_ENV === 'development'
      const errorMessage = isDevelopment
        ? `Erreur détaillée: ${error.message}`
        : 'Erreur lors de la mise à jour du serveur'

      session.flash('error', errorMessage)
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
