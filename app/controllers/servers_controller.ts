import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import { createServerValidator, updateServerValidator } from '#validators/server'

export default class ServersController {
  /**
   * Liste tous les serveurs
   */
  async index({ view }: HttpContext) {
    const servers = await Server.query()
      .preload('services')
      .orderBy('nom', 'asc')

    return view.render('servers/index', { servers })
  }

  /**
   * Affiche le formulaire de création
   */
  async create({ view }: HttpContext) {
    return view.render('servers/create')
  }

  /**
   * Stocke un nouveau serveur
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
   */
  async show({ params, view }: HttpContext) {
    const server = await Server.query()
      .where('id', params.id)
      .preload('services', (query) => {
        query.preload('dependencies', (depQuery) => {
          depQuery.pivotColumns(['label', 'type'])
        })
        query.orderBy('nom', 'asc')
      })
      .firstOrFail()

    return view.render('servers/show', { server })
  }

  /**
   * Affiche le formulaire d'édition
   */
  async edit({ params, view }: HttpContext) {
    const server = await Server.findOrFail(params.id)
    return view.render('servers/edit', { server })
  }

  /**
   * Met à jour un serveur
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
