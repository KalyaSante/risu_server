import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import Server from '#models/server'
import ServiceImage from '#models/service_image'
import {
  createServiceValidator,
  updateServiceValidator,
  createServiceDependencyValidator,
} from '#validators/service'
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
   * ✅ NOUVEAU: Helper pour traiter la sélection d'image
   */
  private async processImageSelection(
    imageData: any
  ): Promise<{ serviceImageId: number | null; icon: string | null }> {
    if (!imageData) {
      return { serviceImageId: null, icon: null }
    }

    // Si c'est un ID d'image ServiceImage
    if (
      typeof imageData === 'number' ||
      (typeof imageData === 'string' && /^\d+$/.test(imageData))
    ) {
      const imageId = Number.parseInt(imageData.toString(), 10)
      const serviceImage = await ServiceImage.find(imageId)

      if (serviceImage) {
        return { serviceImageId: imageId, icon: null }
      }
    }

    // Si c'est une URL custom (fallback)
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      return { serviceImageId: null, icon: imageData }
    }

    return { serviceImageId: null, icon: null }
  }

  /**
   * ✅ NOUVEAU: Helper pour nettoyer les ports
   */
  private cleanPorts(ports: any[]): any[] | null {
    if (!ports || !Array.isArray(ports)) return null

    const validPorts = ports.filter((port) => port && (port.port || port.label))

    return validPorts.length > 0 ? validPorts : null
  }

  /**
   * ✅ NOUVEAU: Helper pour récupérer les services disponibles pour les dépendances
   */
  private async getAvailableServices(excludeId?: number) {
    const query = Service.query().preload('server').orderBy('nom', 'asc')

    if (excludeId) {
      query.where('id', '!=', excludeId)
    }

    const services = await query

    return services.map((service) => ({
      id: service.id,
      name: service.nom,
      serverName: service.server?.nom || 'Unknown',
      serverId: service.serverId,
    }))
  }

  /**
   * ✅ NOUVEAU: Helper pour récupérer les images de services disponibles
   */
  private async getAvailableImages() {
    console.log('🔍 DEBUG ServicesController: Récupération des images...')

    try {
      const images = await ServiceImage.query()
        .where('is_active', true)
        .orderBy('order', 'asc')
        .orderBy('label', 'asc')

      console.log('🔍 DEBUG ServicesController: Images trouvées:', images.length)

      const formattedImages = images.map((image) => ({
        id: image.id,
        label: image.label,
        description: image.description,
        url: image.url,
        filename: image.filename,
        file_extension: image.fileExtension,
      }))

      console.log(
        '🔍 DEBUG ServicesController: Images formatées:',
        JSON.stringify(formattedImages, null, 2)
      )

      return formattedImages
    } catch (error) {
      console.error(
        '❌ DEBUG ServicesController: Erreur lors de la récupération des images:',
        error
      )
      return []
    }
  }

  /**
   * ✅ NOUVEAU: Helper pour synchroniser les dépendances
   */
  private async syncDependencies(service: Service, dependencies: any[]) {
    if (!dependencies || !Array.isArray(dependencies)) {
      return
    }

    // Supprimer toutes les dépendances existantes
    await service.related('dependencies').detach()

    // Ajouter les nouvelles dépendances
    for (const dep of dependencies) {
      if (dep.serviceId && dep.serviceId !== service.id) {
        await service.related('dependencies').attach({
          [dep.serviceId]: {
            label: dep.label || '',
            type: dep.type || 'required',
          },
        })
      }
    }
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
      .preload('serviceImage') // ✅ NOUVEAU: Preload de l'image
      .preload('dependencies', (q) => q.pivotColumns(['label', 'type']))

    if (search) {
      query = query.where('nom', 'LIKE', `%${search}%`)
    }

    if (serverId) {
      query = query.where('server_id', serverId)
    }

    const services = await query.orderBy('nom', 'asc').paginate(page, 20)

    const servers = await Server.query().orderBy('nom', 'asc')

    const formattedServices = services.all().map((service) => ({
      id: service.id,
      name: service.nom,
      primaryPort: service.primaryPort,
      ports: service.allPorts,
      path: service.path,
      icon: service.iconUrl,
      imageMetadata: service.imageMetadata,
      description: service.description || '',
      note: service.note || '',
      server: service.server
        ? {
            id: service.server.id,
            name: service.server.nom,
            ip: service.server.ip,
          }
        : null,
      dependenciesCount: service.dependencies?.length || 0,
      repoUrl: service.repoUrl,
      docPath: service.docPath,
      lastMaintenanceAt: service.lastMaintenanceAt,
    }))

    const formattedServers = servers.map((server: any) => ({
      id: server.id,
      name: server.nom,
      ip: server.ip,
    }))

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya',
    }

    return inertia.render('Services/Index', {
      services: formattedServices,
      servers: formattedServers,
      pagination: {
        currentPage: services.currentPage,
        lastPage: services.lastPage,
        total: services.total,
        perPage: services.perPage,
      },
      filters: {
        search: search,
        selectedServerId: serverId,
      },
      user,
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
    })
  }

  /**
   * ✅ AMÉLIORÉ: Affiche le formulaire de création avec services et images disponibles
   */
  async create({ inertia, request, session }: HttpContext) {
    const serverId = request.input('server_id')
    const servers = await Server.query().orderBy('nom', 'asc')
    const selectedServer = serverId ? await Server.find(serverId) : null

    // ✅ NOUVEAU: Récupérer tous les services pour les dépendances
    const availableServices = await this.getAvailableServices()

    // ✅ NOUVEAU: Récupérer toutes les images disponibles
    const availableImages = await this.getAvailableImages()

    console.log('🔍 DEBUG create(): Envoie de', availableImages.length, 'images au frontend')

    const formattedServers = servers.map((server: any) => ({
      id: server.id,
      name: server.nom,
      ip: server.ip,
    }))

    const formattedSelectedServer = selectedServer
      ? {
          id: selectedServer.id,
          name: selectedServer.nom,
          ip: selectedServer.ip,
        }
      : null

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya',
    }

    return inertia.render('Services/Create', {
      servers: formattedServers,
      selectedServer: formattedSelectedServer,
      availableServices, // ✅ NOUVEAU
      availableImages, // ✅ NOUVEAU
      user,
      errors: {},
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
    })
  }

  /**
   * ✅ AMÉLIORÉ: Stocke un nouveau service avec dépendances
   */
  async store({ request, response, session }: HttpContext) {
    try {
      // 🔍 DEBUG: Log des données reçues
      const allData = request.all()
      console.log('🔍 DEBUG: Données reçues dans store:', JSON.stringify(allData, null, 2))

      const validatedData = await request.validateUsing(createServiceValidator)
      console.log('🔍 DEBUG: Données validées:', JSON.stringify(validatedData, null, 2))

      // ✅ NOUVEAU: Traiter la sélection d'image
      const imageSelection = await this.processImageSelection(
        validatedData.selectedImageId || validatedData.icon
      )

      // ✅ NOUVEAU: Nettoyer les ports après validation
      const cleanedPorts = this.cleanPorts(validatedData.ports || [])

      const payload = {
        ...validatedData,
        ports: cleanedPorts,
        serviceImageId: imageSelection.serviceImageId, // ✅ NOUVEAU
        icon: imageSelection.icon, // ✅ NOUVEAU: URL custom ou null
        lastMaintenanceAt: validatedData.lastMaintenanceAt
          ? DateTime.fromJSDate(new Date(validatedData.lastMaintenanceAt))
          : null,
      }

      console.log('🔍 DEBUG: Payload final:', JSON.stringify(payload, null, 2))

      // Enlever les dépendances du payload principal
      const { dependencies, selectedImageId, ...serviceData } = payload

      const service = await Service.create(serviceData)
      console.log('🔍 DEBUG: Service créé:', JSON.stringify(service.toJSON(), null, 2))

      // ✅ NOUVEAU: Gérer les dépendances
      if (dependencies && dependencies.length > 0) {
        await this.syncDependencies(service, dependencies)
      }

      session.flash('success', `Service "${service.nom}" créé avec succès!`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      console.error('💥 DEBUG: Erreur dans store:', error)
      // ✅ AMÉLIORÉ: Meilleure gestion des erreurs de validation
      if ('messages' in error && Array.isArray((error as ValidationError).messages)) {
        const validationErrors: Record<string, string> = {}

        ;(error as ValidationError).messages.forEach((msg: ValidationMessage) => {
          validationErrors[msg.field] = msg.message
        })

        session.flash({ errors: validationErrors })
        session.flashAll()
        return response.redirect().back()
      } else {
        session.flash('error', 'Erreur lors de la création du service')
        return response.redirect().back()
      }
    }
  }

  /**
   * Affiche les détails d'un service
   * ✅ AJOUT: Champ note
   */
  async show({ params, inertia, session }: HttpContext) {
    const service = await Service.query()
      .where('id', params.id)
      .preload('server')
      .preload('serviceImage') // ✅ NOUVEAU: Preload de l'image
      .preload('dependencies', (query) => {
        query.pivotColumns(['label', 'type']).preload('server').preload('serviceImage') // ✅ NOUVEAU: Preload de l'image pour les dépendances
      })
      .preload('dependents', (query) => {
        query.pivotColumns(['label', 'type']).preload('server').preload('serviceImage') // ✅ NOUVEAU: Preload de l'image pour les dépendants
      })
      .firstOrFail()

    // 🔍 DEBUG: Log du service récupéré
    console.log('🔍 DEBUG: Service récupéré:', JSON.stringify(service.toJSON(), null, 2))

    const formattedService = {
      id: service.id,
      nom: service.nom,
      primaryPort: service.primaryPort,
      ports: service.allPorts,
      path: service.path,
      icon: service.iconUrl, // ✅ NOUVEAU: Utilise le getter intelligent
      imageMetadata: service.imageMetadata, // ✅ NOUVEAU: Métadonnées
      description: service.description || '',
      note: service.note || '', // ✅ AJOUT: Note
      repoUrl: service.repoUrl,
      docPath: service.docPath,
      createdAt: service.createdAt?.toISO(),
      lastMaintenanceAt: service.lastMaintenanceAt?.toISO(),
      server: service.server
        ? {
            id: service.server.id,
            nom: service.server.nom,
            ip: service.server.ip,
          }
        : null,
    }

    // 🔍 DEBUG: Log du service formaté
    console.log(
      '🔍 DEBUG: Service formaté pour frontend:',
      JSON.stringify(formattedService, null, 2)
    )

    const formattedDependencies = service.dependencies.map((dep: any) => ({
      id: dep.id,
      name: dep.nom,
      type: dep.$extras.pivot_type,
      label: dep.$extras.pivot_label,
      server: dep.server?.nom,
      icon: dep.iconUrl || dep.icon, // ✅ NOUVEAU: Ajouter l'icône pour les dépendances
    }))

    const formattedDependents = service.dependents.map((dep: any) => ({
      id: dep.id,
      name: dep.nom,
      type: dep.$extras.pivot_type,
      label: dep.$extras.pivot_label,
      server: dep.server?.nom,
      icon: dep.iconUrl || dep.icon, // ✅ NOUVEAU: Ajouter l'icône pour les dépendants
    }))

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya',
    }

    return inertia.render('Services/Show', {
      service: formattedService,
      dependencies: formattedDependencies,
      dependents: formattedDependents,
      user,
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
    })
  }

  /**
   * ✅ AMÉLIORÉ: Affiche le formulaire d'édition avec dépendances et images
   */
  async edit({ params, inertia, session }: HttpContext) {
    const service = await Service.query()
      .where('id', params.id)
      .preload('server')
      .preload('serviceImage') // ✅ NOUVEAU: Preload de l'image
      .preload('dependencies', (query) => {
        query.pivotColumns(['label', 'type']).preload('serviceImage') // ✅ NOUVEAU: Preload de l'image pour les dépendances
      })
      .firstOrFail()

    // 🔍 DEBUG: Log du service pour l'édition
    console.log('🔍 DEBUG: Service pour édition:', JSON.stringify(service.toJSON(), null, 2))

    const servers = await Server.query().orderBy('nom', 'asc')

    // ✅ NOUVEAU: Récupérer tous les services sauf celui en cours d'édition
    const availableServices = await this.getAvailableServices(service.id)

    // ✅ NOUVEAU: Récupérer toutes les images disponibles
    const availableImages = await this.getAvailableImages()

    console.log('🔍 DEBUG edit(): Envoie de', availableImages.length, 'images au frontend')

    const formattedService = {
      id: service.id,
      nom: service.nom,
      primaryPort: service.primaryPort,
      // ✅ AMÉLIORÉ: S'assurer qu'il y a toujours au moins un port par défaut
      ports:
        service.allPorts && service.allPorts.length > 0
          ? service.allPorts
          : [{ port: '', label: 'web' }],
      path: service.path,
      icon: service.icon, // ✅ NOUVEAU: Garde l'URL custom pour le frontend
      imageMetadata: service.imageMetadata, // ✅ NOUVEAU: Métadonnées image
      description: service.description || '',
      note: service.note || '', // ✅ AJOUT: Note
      repoUrl: service.repoUrl,
      docPath: service.docPath,
      serverId: service.serverId,
      // ✅ NOUVEAU: Formater la date pour l'input datetime-local
      lastMaintenanceAt: service.lastMaintenanceAt
        ? service.lastMaintenanceAt.toFormat("yyyy-MM-dd'T'HH:mm")
        : '',
      // ✅ NOUVEAU: Dépendances actuelles
      dependencies: service.dependencies.map((dep: any) => ({
        serviceId: dep.id,
        label: dep.$extras.pivot_label,
        type: dep.$extras.pivot_type,
      })),
    }

    // 🔍 DEBUG: Log du service formaté pour édition
    console.log(
      '🔍 DEBUG: Service formaté pour édition:',
      JSON.stringify(formattedService, null, 2)
    )

    const formattedServers = servers.map((server: any) => ({
      id: server.id,
      name: server.nom,
      ip: server.ip,
    }))

    const user = {
      email: session.get('user_email') || 'admin@kalya.com',
      fullName: session.get('user_name') || 'Admin Kalya',
    }

    return inertia.render('Services/Edit', {
      service: formattedService,
      servers: formattedServers,
      availableServices, // ✅ NOUVEAU
      availableImages, // ✅ NOUVEAU
      user,
      errors: {},
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
    })
  }

  /**
   * ✅ AMÉLIORÉ: Met à jour un service avec dépendances
   */
  async update({ params, request, response, session }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)

      // 🔍 DEBUG: Log des données reçues
      const allData = request.all()
      console.log('🔍 DEBUG: Données reçues dans update:', JSON.stringify(allData, null, 2))

      const validatedData = await request.validateUsing(updateServiceValidator)
      console.log('🔍 DEBUG: Données validées pour update:', JSON.stringify(validatedData, null, 2))

      // ✅ NOUVEAU: Traiter la sélection d'image
      const imageSelection = await this.processImageSelection(
        validatedData.selectedImageId || validatedData.icon
      )

      // ✅ NOUVEAU: Nettoyer les ports après validation
      const cleanedPorts = this.cleanPorts(validatedData.ports || [])

      const payload = {
        ...validatedData,
        ports: cleanedPorts,
        serviceImageId: imageSelection.serviceImageId, // ✅ NOUVEAU
        icon: imageSelection.icon, // ✅ NOUVEAU
        lastMaintenanceAt: validatedData.lastMaintenanceAt
          ? DateTime.fromJSDate(new Date(validatedData.lastMaintenanceAt))
          : null,
      }

      console.log('🔍 DEBUG: Payload final pour update:', JSON.stringify(payload, null, 2))

      // Enlever les dépendances du payload principal
      const { dependencies, selectedImageId, ...serviceData } = payload

      await service.merge(serviceData).save()
      console.log('🔍 DEBUG: Service mis à jour:', JSON.stringify(service.toJSON(), null, 2))

      // ✅ NOUVEAU: Gérer les dépendances
      await this.syncDependencies(service, dependencies || [])

      session.flash('success', `Service "${service.nom}" mis à jour avec succès!`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      console.error('💥 DEBUG: Erreur dans update:', error)
      // ✅ AMÉLIORÉ: Meilleure gestion des erreurs de validation
      if ('messages' in error && Array.isArray((error as ValidationError).messages)) {
        const validationErrors: Record<string, string> = {}

        ;(error as ValidationError).messages.forEach((msg: ValidationMessage) => {
          validationErrors[msg.field] = msg.message
        })

        session.flash({ errors: validationErrors })
        session.flashAll()
        return response.redirect().back()
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

      session.flash(
        'success',
        `Service "${serviceName}" supprimé avec succès` +
          (dependenciesCount > 0 ? ` (${dependenciesCount} relations supprimées)` : '')
      )
      return response.redirect().toRoute('services.index')
    } catch (error) {
      session.flash('error', 'Erreur lors de la suppression du service')
      return response.redirect().back()
    }
  }

  /**
   * ✅ NOUVEAU: Ajouter une dépendance à un service
   */
  async addDependency({ params, request, response, session }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      const validatedData = await request.validateUsing(createServiceDependencyValidator)

      // Vérifier que le service de dépendance existe
      const dependencyService = await Service.findOrFail(validatedData.dependsOnServiceId)

      // Vérifier qu'on n'ajoute pas une dépendance circulaire
      if (service.id === dependencyService.id) {
        session.flash('error', 'Un service ne peut pas dépendre de lui-même')
        return response.redirect().back()
      }

      // Vérifier si la dépendance existe déjà
      const existingDependency = await service
        .related('dependencies')
        .query()
        .where('service_id', dependencyService.id)
        .first()

      if (existingDependency) {
        session.flash('error', 'Cette dépendance existe déjà')
        return response.redirect().back()
      }

      // Ajouter la dépendance
      await service.related('dependencies').attach({
        [dependencyService.id]: {
          label: validatedData.label,
          type: validatedData.type,
        },
      })

      session.flash('success', `Dépendance vers "${dependencyService.nom}" ajoutée avec succès`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      session.flash('error', "Erreur lors de l'ajout de la dépendance")
      return response.redirect().back()
    }
  }

  /**
   * ✅ NOUVEAU: Supprimer une dépendance d'un service
   */
  async removeDependency({ params, response, session }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      const dependencyId = params.dependencyId

      const dependencyService = await Service.findOrFail(dependencyId)

      await service.related('dependencies').detach([dependencyId])

      session.flash('success', `Dépendance vers "${dependencyService.nom}" supprimée avec succès`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la suppression de la dépendance')
      return response.redirect().back()
    }
  }

  /**
   * ✅ NOUVEAU: API pour récupérer la liste des services disponibles pour les dépendances
   */
  async getAvailableServicesApi({ request, response }: HttpContext) {
    try {
      const excludeId = request.input('exclude_id')
      const availableServices = await this.getAvailableServices(excludeId)

      return response.json({
        success: true,
        data: availableServices,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des services',
      })
    }
  }

  /**
   * ✅ NOUVEAU: API pour vérifier les dépendances circulaires
   */
  async checkCircularDependencies({ request, response }: HttpContext) {
    try {
      const serviceId = request.input('service_id')
      const dependencyId = request.input('dependency_id')

      if (serviceId === dependencyId) {
        return response.json({
          success: false,
          message: 'Un service ne peut pas dépendre de lui-même',
        })
      }

      // Vérifier les dépendances circulaires récursives
      const hasCircularDependency = await this.hasCircularDependency(
        dependencyId,
        serviceId,
        new Set()
      )

      if (hasCircularDependency) {
        return response.json({
          success: false,
          message: 'Cette dépendance créerait une dépendance circulaire',
        })
      }

      return response.json({
        success: true,
        message: 'Dépendance valide',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification',
      })
    }
  }

  /**
   * ✅ NOUVEAU: Helper récursif pour détecter les dépendances circulaires
   */
  private async hasCircularDependency(
    serviceId: number,
    targetId: number,
    visited: Set<number>
  ): Promise<boolean> {
    if (visited.has(serviceId)) {
      return false // Éviter les boucles infinies
    }

    if (serviceId === targetId) {
      return true
    }

    visited.add(serviceId)

    const service = await Service.query().where('id', serviceId).preload('dependencies').first()

    if (!service) {
      return false
    }

    for (const dependency of service.dependencies) {
      if (await this.hasCircularDependency(dependency.id, targetId, new Set(visited))) {
        return true
      }
    }

    return false
  }
}
