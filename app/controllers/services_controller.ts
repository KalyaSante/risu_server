import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import Server from '#models/server'
import { createServiceValidator, updateServiceValidator } from '#validators/service'

export default class ServicesController {
  /**
   * Liste tous les services
   */
  async index({ view, request }: HttpContext) {
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

    return view.render('services/index', {
      services,
      servers,
      search,
      selectedServerId: serverId
    })
  }

  /**
   * Affiche le formulaire de création
   */
  async create({ view, request }: HttpContext) {
    const serverId = request.input('server_id')
    const servers = await Server.query().orderBy('nom', 'asc')
    const selectedServer = serverId ? await Server.find(serverId) : null

    return view.render('services/create', {
      servers,
      selectedServer
    })
  }

  /**
   * Stocke un nouveau service
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
   */
  async show({ params, view }: HttpContext) {
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

    return view.render('services/show', { service })
  }

  /**
   * Affiche le formulaire d'édition
   */
  async edit({ params, view }: HttpContext) {
    const service = await Service.query()
      .where('id', params.id)
      .preload('server')
      .firstOrFail()

    const servers = await Server.query().orderBy('nom', 'asc')

    return view.render('services/edit', { service, servers })
  }

  /**
   * Met à jour un service
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
