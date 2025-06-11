import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'

export default class ServersController {
  /**
   * Liste de tous les serveurs
   */
  async index({ view, request }: HttpContext) {
    const user = request.ctx?.user
    
    const servers = await Server.query()
      .preload('services', (query) => {
        query.select('id', 'nom', 'server_id')
      })
      .orderBy('nom')

    return view.render('servers/index', { user, servers })
  }

  /**
   * Formulaire de création d'un serveur
   */
  async create({ view, request }: HttpContext) {
    const user = request.ctx?.user
    return view.render('servers/create', { user })
  }

  /**
   * Enregistrement d'un nouveau serveur
   */
  async store({ request, response, session }: HttpContext) {
    const data = request.only(['nom', 'ip', 'hebergeur', 'localisation'])
    
    try {
      const server = await Server.create(data)
      
      session.flash('success', `Serveur "${server.nom}" créé avec succès !`)
      return response.redirect().toRoute('servers.show', { id: server.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la création du serveur')
      return response.redirect().back()
    }
  }

  /**
   * Vue détaillée d'un serveur
   */
  async show({ params, view, request }: HttpContext) {
    const user = request.ctx?.user
    
    const server = await Server.query()
      .where('id', params.id)
      .preload('services', (query) => {
        query.preload('dependencies', (depQuery) => {
          depQuery.pivotColumns(['label', 'type'])
        })
        query.preload('dependents', (depQuery) => {
          depQuery.pivotColumns(['label', 'type'])
        })
      })
      .firstOrFail()

    return view.render('servers/show', { user, server })
  }

  /**
   * Formulaire d'édition d'un serveur
   */
  async edit({ params, view, request }: HttpContext) {
    const user = request.ctx?.user
    const server = await Server.findOrFail(params.id)
    
    return view.render('servers/edit', { user, server })
  }

  /**
   * Mise à jour d'un serveur
   */
  async update({ params, request, response, session }: HttpContext) {
    const server = await Server.findOrFail(params.id)
    const data = request.only(['nom', 'ip', 'hebergeur', 'localisation'])
    
    try {
      await server.merge(data).save()
      
      session.flash('success', `Serveur "${server.nom}" mis à jour avec succès !`)
      return response.redirect().toRoute('servers.show', { id: server.id })
    } catch (error) {
      session.flash('error', 'Erreur lors de la mise à jour du serveur')
      return response.redirect().back()
    }
  }

  /**
   * Suppression d'un serveur
   */
  async destroy({ params, response, session }: HttpContext) {
    try {
      const server = await Server.query()
        .where('id', params.id)
        .preload('services')
        .firstOrFail()
      
      // Vérifier qu'il n'y a pas de services rattachés
      if (server.services.length > 0) {
        session.flash('error', `Impossible de supprimer le serveur "${server.nom}" : ${server.services.length} service(s) y sont rattachés`)
        return response.redirect().back()
      }
      
      const serverName = server.nom
      await server.delete()
      
      session.flash('success', `Serveur "${serverName}" supprimé avec succès !`)
      return response.redirect().toRoute('servers.index')
    } catch (error) {
      session.flash('error', 'Erreur lors de la suppression du serveur')
      return response.redirect().back()
    }
  }
}
