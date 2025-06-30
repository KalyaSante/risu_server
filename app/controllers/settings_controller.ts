import type { HttpContext } from '@adonisjs/core/http'
import Hoster from '#models/hoster'
import { createHosterValidator, updateHosterValidator, importHostersValidator } from '#validators/hoster'

export default class SettingsController {
  /**
   * Page principale des paramètres avec menu vertical
   */
  async index({ inertia, session }: HttpContext) {
    // Récupérer les données utilisateur depuis la session
    const sessionUserId = session.get('user_id')
    const sessionUserEmail = session.get('user_email')
    const sessionUserName = session.get('user_name')

    const user = {
      id: sessionUserId,
      email: sessionUserEmail,
      fullName: sessionUserName
    }

    // Récupérer les hébergeurs pour la section par défaut
    const hosters = await Hoster.query()
      .select('id', 'name', 'type', 'description', 'is_active', 'order', 'created_at', 'updated_at')
      .orderBy('order', 'asc')
      .orderBy('name', 'asc')

    // Ajouter un flag pour indiquer si l'hébergeur a une API configurée (toujours false maintenant)
    const hostersWithApiFlag = hosters.map(hoster => ({
      ...hoster.serialize(),
      hasApi: false // Plus d'API dans ta structure
    }))

    return inertia.render('Settings/Index', {
      currentSection: 'hosters',
      user,
      hosters: hostersWithApiFlag
    })
  }

  /**
   * Page de gestion des hébergeurs
   */
  async hosters({ inertia, session }: HttpContext) {
    // Récupérer les données utilisateur depuis la session
    const sessionUserId = session.get('user_id')
    const sessionUserEmail = session.get('user_email')
    const sessionUserName = session.get('user_name')

    const user = {
      id: sessionUserId,
      email: sessionUserEmail,
      fullName: sessionUserName
    }

    const hosters = await Hoster.query()
      .select('id', 'name', 'type', 'description', 'is_active', 'order', 'created_at', 'updated_at')
      .orderBy('order', 'asc')
      .orderBy('name', 'asc')

    // Ajouter un flag pour indiquer si l'hébergeur a une API configurée (toujours false maintenant)
    const hostersWithApiFlag = hosters.map(hoster => ({
      ...hoster.serialize(),
      hasApi: false // Plus d'API dans ta structure
    }))

    return inertia.render('Settings/Hosters', {
      hosters: hostersWithApiFlag,
      currentSection: 'hosters',
      user
    })
  }

  /**
   * Créer un nouvel hébergeur
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const data = await request.validateUsing(createHosterValidator)
      
      // Trouver le prochain ordre disponible
      const maxOrder = await Hoster.query().max('order as max_order').first()
      const nextOrder = (maxOrder?.$extras.max_order || 0) + 1
      
      await Hoster.create({
        name: data.name,
        type: data.type,
        description: data.description || null,
        isActive: true,
        order: nextOrder
      })

      session.flash('success', 'Hébergeur ajouté avec succès')
      return response.redirect().toRoute('settings.hosters')
    } catch (error) {
      session.flash('error', 'Erreur lors de l\'ajout de l\'hébergeur')
      return response.redirect().back().withInput().flashErrors()
    }
  }

  /**
   * Mettre à jour un hébergeur
   */
  async update({ params, request, response, session }: HttpContext) {
    const hoster = await Hoster.findOrFail(params.id)

    try {
      const data = await request.validateUsing(updateHosterValidator, {
        meta: { hosterId: hoster.id }
      })

      hoster.merge({
        name: data.name,
        type: data.type,
        description: data.description || null
      })
      
      await hoster.save()

      session.flash('success', 'Hébergeur modifié avec succès')
      return response.redirect().toRoute('settings.hosters')
    } catch (error) {
      session.flash('error', 'Erreur lors de la modification de l\'hébergeur')
      return response.redirect().back().withInput().flashErrors()
    }
  }

  /**
   * Supprimer un hébergeur
   */
  async destroy({ params, response, session }: HttpContext) {
    const hoster = await Hoster.findOrFail(params.id)

    try {
      await hoster.delete()
      session.flash('success', 'Hébergeur supprimé avec succès')
      return response.redirect().toRoute('settings.hosters')
    } catch (error) {
      session.flash('error', 'Erreur lors de la suppression de l\'hébergeur')
      return response.redirect().back()
    }
  }

  /**
   * Importer des hébergeurs depuis un fichier JSON
   */
  async import({ request, response, session }: HttpContext) {
    try {
      const data = await request.validateUsing(importHostersValidator)
      let importedCount = 0

      for (const hosterData of data.hosters) {
        // Vérifier si un hébergeur avec ce nom existe déjà
        const existingHoster = await Hoster.query()
          .where('name', hosterData.name)
          .first()

        if (existingHoster) {
          continue // Skip les doublons
        }

        // Trouver le prochain ordre disponible
        const maxOrder = await Hoster.query().max('order as max_order').first()
        const nextOrder = (maxOrder?.$extras.max_order || 0) + importedCount + 1

        await Hoster.create({
          name: hosterData.name,
          type: hosterData.type,
          description: hosterData.description || null,
          isActive: true,
          order: nextOrder
        })

        importedCount++
      }

      session.flash('success', `${importedCount} hébergeur(s) importé(s) avec succès`)
      return response.redirect().toRoute('settings.hosters')
    } catch (error) {
      session.flash('error', 'Erreur lors de l\'import : ' + (error.message || 'Données invalides'))
      return response.redirect().back().withInput().flashErrors()
    }
  }

  /**
   * Réorganiser l'ordre des hébergeurs
   */
  async reorder({ request, response }: HttpContext) {
    const { orderedIds } = request.only(['orderedIds'])

    try {
      // Mettre à jour l'ordre de chaque hébergeur
      for (let i = 0; i < orderedIds.length; i++) {
        await Hoster.query()
          .where('id', orderedIds[i])
          .update({ order: i })
      }

      // Retourner une réponse vide avec statut 200 pour Inertia
      return response.status(200).send('')
    } catch (error) {
      return response.status(500).json({ 
        success: false, 
        message: `Erreur lors de la mise à jour: ${error.message}` 
      })
    }
  }
}
