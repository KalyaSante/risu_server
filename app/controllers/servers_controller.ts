import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import { createServerValidator, updateServerValidator } from '#validators/server'

// ✅ FIX: Interface pour les erreurs de validation
interface ValidationMessage {
  message: string
  field: string
  rule: string
}

interface ValidationError extends Error {
  messages: ValidationMessage[]
}

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
      fullName: sessionUserName || 'Utilisateur non défini',
    }

    return user
  }

  /**
   * Liste tous les serveurs
   * ✅ MIGRÉ VERS INERTIA
   */
  async index({ inertia, session }: HttpContext) {
    const servers = await Server.query().preload('services', (query) => {
      query.preload('serviceImage') // ✅ FIX: Preload de l'image gérée
    }).preload('parent').orderBy('nom', 'asc')

    // Formater les données pour Svelte
    const formattedServers = servers.map((server: any) => ({
      id: server.id,
      name: server.nom,
      ip: server.ip,
      status: 'online', // Tu peux calculer ça dynamiquement
      servicesCount: server.services?.length || 0,
      hebergeur: server.hebergeur,
      localisation: server.localisation,
      description: server.description || '',
      note: server.note || '', // ✅ AJOUT: Note
      parentServer: server.parent ? { id: server.parent.id, name: server.parent.nom } : null,
      services:
        server.services?.map((service: any) => ({
          id: service.id,
          name: service.nom,
          path: service.path,
          icon: service.iconUrl, // ✅ FIX: Utilise le getter intelligent
        })) || [],
    }))

    const user = this.getAuthenticatedUser(session)

    return inertia.render('Servers/Index', {
      servers: formattedServers,
      user,
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
    })
  }

  /**
   * Affiche le formulaire de création
   * ✅ MIGRÉ VERS INERTIA
   */
  async create({ inertia, session }: HttpContext) {
    const user = this.getAuthenticatedUser(session)

    const servers = await Server.query().orderBy('nom', 'asc')
    const serverOptions = servers.map((s: any) => ({ id: s.id, name: s.nom }))

    return inertia.render('Servers/Create', {
      user,
      servers: serverOptions,
      errors: {},
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
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

      // ✅ FIX: Validation avec gestion d'erreur typée
      let payload
      try {
        payload = await createServerValidator.validate(formData)
      } catch (validationError) {
        // Gestion des erreurs VineJS typées
        if (
          'messages' in validationError &&
          Array.isArray((validationError as ValidationError).messages)
        ) {
          const errorMessages = (validationError as ValidationError).messages
            .map((msg: ValidationMessage) => msg.message)
            .join(', ')
          session.flash('error', `Erreur de validation: ${errorMessages}`)
        } else {
          session.flash('error', 'Erreur de validation')
        }
        return response.redirect().back()
      }

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
        query.preload('serviceImage') // ✅ FIX: Preload de l'image gérée
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
      note: server.note || '', // ✅ AJOUT: Note
      createdAt: server.createdAt?.toISO(),
      parentServer: server.parent ? { id: server.parent.id, name: server.parent.nom } : null,
      services:
        server.services?.map((service: any) => ({
          id: service.id,
          name: service.nom,
          path: service.path,
          icon: service.iconUrl, // ✅ FIX: Utilise le getter intelligent
          imageMetadata: service.imageMetadata, // ✅ FIX: Ajoute les métadonnées
          dependenciesCount: service.dependencies?.length || 0,
          repoUrl: service.repoUrl,
          lastMaintenanceAt: service.lastMaintenanceAt?.toISO(),
        })) || [],
    }

    const user = this.getAuthenticatedUser(session)

    return inertia.render('Servers/Show', {
      server: formattedServer,
      user,
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
    })
  }

  /**
   * Affiche le formulaire d'édition
   * ✅ MIGRÉ VERS INERTIA
   */
  async edit({ params, inertia, session }: HttpContext) {
    const server = await Server.findOrFail(params.id)

    const servers = await Server.query().whereNot('id', params.id).orderBy('nom', 'asc')
    const serverOptions = servers.map((s: any) => ({ id: s.id, name: s.nom }))

    const formattedServer = {
      id: server.id,
      nom: server.nom,
      ip: server.ip,
      hebergeur: server.hebergeur,
      localisation: server.localisation,
      description: server.description || '',
      note: server.note || '', // ✅ AJOUT: Note
      parentServerId: server.parentServerId,
    }

    const user = this.getAuthenticatedUser(session)

    return inertia.render('Servers/Edit', {
      server: formattedServer,
      servers: serverOptions,
      user,
      errors: {},
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
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

      // ✅ FIX: Validation avec gestion d'erreur typée
      let payload
      try {
        payload = await updateServerValidator.validate(formData)
      } catch (validationError) {
        // Gestion des erreurs VineJS typées
        if (
          'messages' in validationError &&
          Array.isArray((validationError as ValidationError).messages)
        ) {
          const errorMessages = (validationError as ValidationError).messages
            .map((msg: ValidationMessage) => msg.message)
            .join(', ')
          session.flash('error', `Erreur de validation: ${errorMessages}`)
        } else {
          session.flash('error', 'Erreur de validation')
        }
        return response.redirect().back()
      }

      await server.merge(payload).save()
      session.flash('success', `Serveur "${server.nom}" mis à jour avec succès!`)
      return response.redirect().toRoute('servers.show', { id: server.id })
    } catch (error) {
      // Message d'erreur plus détaillée pour le développement
      const isDevelopment = process.env.NODE_ENV === 'development'
      const errorMessage = isDevelopment
        ? `Erreur détaillée: ${(error as Error).message}`
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
      const server = await Server.query().where('id', params.id).preload('services').firstOrFail()

      const serverName = server.nom
      const servicesCount = server.services.length

      await server.delete()

      session.flash(
        'success',
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
