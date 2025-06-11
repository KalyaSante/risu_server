import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import Server from '#models/server'

export default class ServicesController {
  /**
   * Liste de tous les services
   */
  async index({ view, request }: HttpContext) {
    const user = request.ctx?.user
    
    const services = await Service.query()
      .preload('server')
      .preload('dependencies', (query) => {
        query.pivotColumns(['label', 'type'])
      })
      .orderBy('nom')

    return view.render('services/index', { user, services })
  }

  /**
   * Formulaire de création d'un service
   */
  async create({ view, request }: HttpContext) {
    const user = request.ctx?.user
    const servers = await Server.all()
    const services = await Service.all() // Pour les dépendances
    
    return view.render('services/create', { user, servers, services })
  }

  /**
   * Enregistrement d'un nouveau service
   */
  async store({ request, response, session }: HttpContext) {
    const data = request.only([
      'server_id', 'nom', 'icon', 'path', 'repo_url', 'doc_path', 'last_maintenance_at'
    ])
    
    try {
      const service = await Service.create({
        serverId: data.server_id,
        nom: data.nom,
        icon: data.icon,
        path: data.path,
        repoUrl: data.repo_url,
        docPath: data.doc_path,
        lastMaintenanceAt: data.last_maintenance_at ? new Date(data.last_maintenance_at) : null
      })
      
      session.flash('success', `Service "${service.nom}" créé avec succès !`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la création du service')
      return response.redirect().back()
    }
  }

  /**
   * Vue détaillée d'un service (remplace dashboard.serviceDetail)
   */
  async show({ params, view, request }: HttpContext) {
    const user = request.ctx?.user
    
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

    return view.render('services/show', { user, service })
  }

  /**
   * Formulaire d'édition d'un service
   */
  async edit({ params, view, request }: HttpContext) {
    const user = request.ctx?.user
    
    const service = await Service.query()
      .where('id', params.id)
      .preload('dependencies', (query) => {
        query.pivotColumns(['label', 'type'])
      })
      .firstOrFail()
      
    const servers = await Server.all()
    const allServices = await Service.query().whereNot('id', service.id) // Exclure le service actuel des dépendances
    
    return view.render('services/edit', { user, service, servers, allServices })
  }

  /**
   * Mise à jour d'un service
   */
  async update({ params, request, response, session }: HttpContext) {
    const service = await Service.findOrFail(params.id)
    
    const data = request.only([
      'server_id', 'nom', 'icon', 'path', 'repo_url', 'doc_path', 'last_maintenance_at'
    ])
    
    try {
      await service.merge({
        serverId: data.server_id,
        nom: data.nom,
        icon: data.icon,
        path: data.path,
        repoUrl: data.repo_url,
        docPath: data.doc_path,
        lastMaintenanceAt: data.last_maintenance_at ? new Date(data.last_maintenance_at) : null
      }).save()
      
      session.flash('success', `Service "${service.nom}" mis à jour avec succès !`)
      return response.redirect().toRoute('services.show', { id: service.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la mise à jour du service')
      return response.redirect().back()
    }
  }

  /**
   * Suppression d'un service
   */
  async destroy({ params, response, session }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      const serviceName = service.nom
      
      await service.delete()
      
      session.flash('success', `Service "${serviceName}" supprimé avec succès !`)
      return response.redirect().toRoute('services.index')
    } catch (error) {
      session.flash('error', 'Erreur lors de la suppression du service')
      return response.redirect().back()
    }
  }

  /**
   * API: Ajouter une dépendance entre services
   */
  async addDependency({ params, request, response, session }: HttpContext) {
    const service = await Service.findOrFail(params.id)
    const { depends_on_service_id, label, type } = request.only(['depends_on_service_id', 'label', 'type'])
    
    try {
      await service.related('dependencies').attach({
        [depends_on_service_id]: { label, type: type || 'required' }
      })
      
      session.flash('success', 'Dépendance ajoutée avec succès !')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erreur lors de l\'ajout de la dépendance')
      return response.redirect().back()
    }
  }

  /**
   * API: Supprimer une dépendance entre services
   */
  async removeDependency({ params, request, response, session }: HttpContext) {
    const service = await Service.findOrFail(params.id)
    const { depends_on_service_id } = request.only(['depends_on_service_id'])
    
    try {
      await service.related('dependencies').detach([depends_on_service_id])
      
      session.flash('success', 'Dépendance supprimée avec succès !')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erreur lors de la suppression de la dépendance')
      return response.redirect().back()
    }
  }
}
