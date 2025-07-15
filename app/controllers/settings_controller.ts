import type { HttpContext } from '@adonisjs/core/http'
import Hoster from '#models/hoster'
import ServiceImage from '#models/service_image'
import ApiKey from '#models/api_key'
import {
  createHosterValidator,
  updateHosterValidator,
  importHostersValidator,
} from '#validators/hoster'
import {
  createServiceImageValidator,
  updateServiceImageValidator,
  reorderServiceImagesValidator,
} from '#validators/service_image'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import { unlink } from 'node:fs/promises'
import { DateTime } from 'luxon'

export default class SettingsController {
  /**
   * Méthode privée pour récupérer les données utilisateur
   */
  private getUserFromSession(session: any) {
    return {
      id: session.get('user_id'),
      email: session.get('user_email'),
      fullName: session.get('user_name'),
    }
  }

  /**
   * Méthode privée pour récupérer les hébergeurs
   */
  private async getHosters() {
    const hosters = await Hoster.query()
      .select('id', 'name', 'type', 'description', 'is_active', 'order', 'created_at', 'updated_at')
      .orderBy('order', 'asc')
      .orderBy('name', 'asc')

    return hosters.map((hoster) => ({
      ...hoster.serialize(),
      hasApi: false,
    }))
  }

  /**
   * Méthode privée pour récupérer les images de services
   */
  private async getServiceImages() {
    try {
      const images = await ServiceImage.query()
        .where('is_active', true)
        .orderBy('order', 'asc')
        .orderBy('label', 'asc')

      const formattedImages = images.map((image) => ({
        ...image.serialize(),
        file_extension: image.fileExtension,
      }))

      return formattedImages
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des images de service:', error)
      return []
    }
  }

  /**
   * ✨ NOUVELLE: Méthode privée pour récupérer les données de sécurité
   */
  private async getSecurityData(
    userId: any,
    newTokenData: any = null
  ): Promise<{
    apiKeys: any[]
    totalKeys: number
    activeKeys: number
    recentlyUsedKeys: number
    newToken?: any
  }> {
    const apiKeys = await ApiKey.query().where('user_id', userId).orderBy('created_at', 'desc')

    const enrichedApiKeys = apiKeys.map((key) => ({
      ...key.serialize(),
      usage: key.getUsageStats(),
    }))

    const securityData: any = {
      apiKeys: enrichedApiKeys,
      totalKeys: apiKeys.length,
      activeKeys: apiKeys.filter((k) => k.isActive).length,
      recentlyUsedKeys: apiKeys.filter(
        (k) => k.lastUsedAt && DateTime.now().diff(k.lastUsedAt, 'days').days < 7
      ).length,
    }

    if (newTokenData) {
      securityData.newToken = newTokenData
    }

    return securityData
  }

  /**
   * Section Hébergeurs
   */
  async hosters({ inertia, session }: HttpContext) {
    const user = this.getUserFromSession(session)
    const hosters = await this.getHosters()

    return inertia.render('Settings/Index', {
      currentSection: 'hosters',
      user,
      hosters,
      currentRoute: 'settings/hosters',
    })
  }

  /**
   * Section Images des Services
   */
  async images({ inertia, session }: HttpContext) {
    const user = this.getUserFromSession(session)
    const hosters = await this.getHosters()
    const images = await this.getServiceImages()

    return inertia.render('Settings/Index', {
      currentSection: 'service-images',
      user,
      hosters,
      images,
      currentRoute: 'settings/service-images',
    })
  }

  /**
   * Section Général
   */
  async general({ inertia, session }: HttpContext) {
    const user = this.getUserFromSession(session)
    const hosters = await this.getHosters() // Toujours charger pour la navigation

    return inertia.render('Settings/Index', {
      currentSection: 'general',
      user,
      hosters,
      settings: {}, // Ici tu peux ajouter les vrais paramètres généraux
      currentRoute: 'settings/general',
    })
  }

  /**
   * Section Notifications
   */
  async notifications({ inertia, session }: HttpContext) {
    const user = this.getUserFromSession(session)
    const hosters = await this.getHosters()

    return inertia.render('Settings/Index', {
      currentSection: 'notifications',
      user,
      hosters,
      notifications: {}, // Ici tu peux ajouter les vraies notifications
      currentRoute: 'settings/notifications',
    })
  }

  /**
   * Section Sécurité avec clés API
   */
  async security({ inertia, session }: HttpContext) {
    const user = this.getUserFromSession(session)
    const hosters = await this.getHosters()
    const security = await this.getSecurityData(user.id)

    return inertia.render('Settings/Index', {
      currentSection: 'security',
      user,
      hosters,
      security,
      currentRoute: 'settings/security',
    })
  }

  /**
   * ✨ SOLUTION OPTIMISÉE: Créer une nouvelle clé API avec gestion Inertia correcte
   */
  async createApiKey({ request, inertia, session, response }: HttpContext) {
    const user = this.getUserFromSession(session)

    try {
      const { name } = request.only(['name'])

      // Validation améliorée
      if (!name || name.trim().length === 0) {
        session.flash('error', 'Le nom de la clé API est requis')
        return inertia.redirectBack()
      }

      if (name.trim().length < 3) {
        session.flash('error', 'Le nom de la clé API doit contenir au moins 3 caractères')
        return inertia.redirectBack()
      }

      if (name.trim().length > 50) {
        session.flash('error', 'Le nom de la clé API ne peut pas dépasser 50 caractères')
        return inertia.redirectBack()
      }

      // Vérifier les doublons de nom
      const existingWithSameName = await ApiKey.query()
        .where('user_id', user.id)
        .where('name', name.trim())
        .where('is_active', true)
        .first()

      if (existingWithSameName) {
        session.flash('error', 'Une clé API avec ce nom existe déjà')
        return inertia.redirectBack()
      }

      // Vérifier le nombre de clés existantes (limite à 10 par utilisateur)
      const existingCount = await ApiKey.query()
        .where('user_id', user.id)
        .where('is_active', true)
        .count('* as total')

      if (existingCount[0].$extras.total >= 10) {
        session.flash(
          'error',
          'Limite de 10 clés API atteinte. Supprimez une clé existante pour en créer une nouvelle.'
        )
        return inertia.redirectBack()
      }

      // ✨ Créer la clé avec la méthode améliorée
      const { apiKey, token } = await ApiKey.generate(user.id, name.trim())

      // ✨ NOUVEAU: Passer les données directement dans les props
      const newTokenData = {
        token: token,
        name: name.trim(),
        id: apiKey.id,
        prefix: apiKey.prefix,
        isRegenerated: false
      }

      // 🎯 SOLUTION OPTIMALE: Re-rendre directement la page avec les nouvelles données
      const hosters = await this.getHosters()
      const security = await this.getSecurityData(user.id, newTokenData)

      session.flash('success', 'Clé API créée avec succès ! Copiez-la maintenant, elle ne sera plus jamais affichée.')

      return inertia.render('Settings/Index', {
        currentSection: 'security',
        user,
        hosters,
        security,
        currentRoute: 'settings/security',
        flash: {
          success: 'Clé API créée avec succès ! Copiez-la maintenant, elle ne sera plus jamais affichée.'
        }
      })

    } catch (error) {
      console.error('❌ Erreur lors de la création de la clé API:', error)
      session.flash(
        'error',
        'Erreur interne lors de la création de la clé API. Veuillez réessayer.'
      )
      return inertia.redirectBack()
    }
  }

  /**
   * ✨ AMÉLIORATION: Supprimer une clé API avec vérifications
   */
  async deleteApiKey({ params, inertia, session, response }: HttpContext) {
    const user = this.getUserFromSession(session)

    try {
      const apiKey = await ApiKey.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()

      // Log de l'action pour la sécurité
      console.log(`🗑️ Suppression de la clé API "${apiKey.name}" par l'utilisateur ${user.email}`)

      await apiKey.delete()

      session.flash('success', `Clé API "${apiKey.name}" supprimée avec succès`)

      // Re-rendre la page avec les données mises à jour
      const hosters = await this.getHosters()
      const security = await this.getSecurityData(user.id)

      return inertia.render('Settings/Index', {
        currentSection: 'security',
        user,
        hosters,
        security,
        currentRoute: 'settings/security',
        flash: {
          success: `Clé API "${apiKey.name}" supprimée avec succès`
        }
      })

    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la clé API:', error)
      session.flash('error', 'Clé API non trouvée ou erreur lors de la suppression')
      return inertia.redirectBack()
    }
  }

  /**
   * ✨ AMÉLIORATION: Activer/Désactiver une clé API avec logs
   */
  async toggleApiKey({ params, inertia, session, response }: HttpContext) {
    const user = this.getUserFromSession(session)

    try {
      const apiKey = await ApiKey.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()

      apiKey.isActive = !apiKey.isActive
      await apiKey.save()

      // Log de l'action pour la sécurité
      const action = apiKey.isActive ? 'activée' : 'désactivée'
      console.log(`🔄 Clé API "${apiKey.name}" ${action} par l'utilisateur ${user.email}`)

      session.flash('success', `Clé API "${apiKey.name}" ${action} avec succès`)

      // Re-rendre la page avec les données mises à jour
      const hosters = await this.getHosters()
      const security = await this.getSecurityData(user.id)

      return inertia.render('Settings/Index', {
        currentSection: 'security',
        user,
        hosters,
        security,
        currentRoute: 'settings/security',
        flash: {
          success: `Clé API "${apiKey.name}" ${action} avec succès`
        }
      })

    } catch (error) {
      console.error('❌ Erreur lors de la modification de la clé API:', error)
      session.flash('error', 'Clé API non trouvée ou erreur lors de la modification')
      return inertia.redirectBack()
    }
  }

  /**
   * ✨ NOUVEAU: Endpoint pour régénérer une clé API (optionnel)
   */
  async regenerateApiKey({ params, inertia, session, response }: HttpContext) {
    const user = this.getUserFromSession(session)

    try {
      const oldApiKey = await ApiKey.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()

      // Sauvegarder les infos de l'ancienne clé
      const name = oldApiKey.name
      const permissions = oldApiKey.permissions

      // Supprimer l'ancienne clé
      await oldApiKey.delete()

      // Créer une nouvelle clé avec le même nom
      const { apiKey, token } = await ApiKey.generate(user.id, name, permissions)

      // ✨ NOUVEAU: Passer les données directement dans les props
      const newTokenData = {
        token: token,
        name: name,
        id: apiKey.id,
        prefix: apiKey.prefix,
        isRegenerated: true
      }

      console.log(`🔄 Clé API "${name}" régénérée par l'utilisateur ${user.email}`)

      // Re-rendre la page avec les données mises à jour
      const hosters = await this.getHosters()
      const security = await this.getSecurityData(user.id, newTokenData)

      return inertia.render('Settings/Index', {
        currentSection: 'security',
        user,
        hosters,
        security,
        currentRoute: 'settings/security',
        flash: {
          success: 'Clé API régénérée avec succès ! Copiez la nouvelle clé maintenant.'
        }
      })

    } catch (error) {
      console.error('❌ Erreur lors de la régénération de la clé API:', error)
      session.flash('error', 'Clé API non trouvée ou erreur lors de la régénération')
      return inertia.redirectBack()
    }
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
        order: nextOrder,
      })

      session.flash('success', 'Hébergeur ajouté avec succès')
      return response.redirect().toRoute('settings.hosters')
    } catch (error) {
      session.flash('error', "Erreur lors de l'ajout de l'hébergeur")
      return response.redirect().back()
    }
  }

  /**
   * Mettre à jour un hébergeur
   */
  async update({ params, request, response, session }: HttpContext) {
    const hoster = await Hoster.findOrFail(params.id)

    try {
      const data = await request.validateUsing(updateHosterValidator, {
        meta: { hosterId: hoster.id },
      })

      hoster.merge({
        name: data.name,
        type: data.type,
        description: data.description || null,
      })

      await hoster.save()

      session.flash('success', 'Hébergeur modifié avec succès')
      return response.redirect().toRoute('settings.hosters')
    } catch (error) {
      session.flash('error', "Erreur lors de la modification de l'hébergeur")
      return response.redirect().back()
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
      session.flash('error', "Erreur lors de la suppression de l'hébergeur")
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
        const existingHoster = await Hoster.query().where('name', hosterData.name).first()

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
          order: nextOrder,
        })

        importedCount++
      }

      session.flash('success', `${importedCount} hébergeur(s) importé(s) avec succès`)
      return response.redirect().toRoute('settings.hosters')
    } catch (error) {
      session.flash('error', "Erreur lors de l'import : " + (error.message || 'Données invalides'))
      return response.redirect().back()
    }
  }

  /**
   * Réorganiser l'ordre des hébergeurs
   */
  async reorder({ request, response }: HttpContext) {
    const { orderedIds } = request.only(['orderedIds'])

    try {
      // Mettre à jour l'ordre de chaque hébergeur
      for (const [i, orderedId] of orderedIds.entries()) {
        await Hoster.query().where('id', orderedId).update({ order: i })
      }

      // Retourner une réponse JSON pour les requêtes AJAX
      return response.json({
        success: true,
        message: 'Ordre mis à jour avec succès',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: `Erreur lors de la mise à jour: ${error.message}`,
      })
    }
  }

  /**
   * Créer une nouvelle image de service
   */
  async storeImage({ request, response, session }: HttpContext) {
    try {
      const data = await request.validateUsing(createServiceImageValidator)

      // Générer un nom de fichier unique
      const uniqueId = cuid()
      const extension = data.image.extname
      const filename = `service_${uniqueId}.${extension}`

      // Déplacer le fichier
      const uploadsPath = app.makePath('public/uploads/service-images')
      await data.image.move(uploadsPath, { name: filename })

      // Trouver le prochain ordre disponible
      const maxOrder = await ServiceImage.query().max('order as max_order').first()
      const nextOrder = (maxOrder?.$extras.max_order || 0) + 1

      // Créer l'enregistrement
      await ServiceImage.create({
        label: data.label,
        description: data.description || null,
        filename: filename,
        originalName: data.image.clientName,
        mimeType: data.image.type || 'image/jpeg',
        fileSize: data.image.size,
        url: `/uploads/service-images/${filename}`,
        order: nextOrder,
        isActive: true,
      })

      session.flash('success', 'Image ajoutée avec succès')
      return response.redirect().toRoute('settings.images')
    } catch (error) {
      session.flash('error', "Erreur lors de l'ajout de l'image")
      return response.redirect().back()
    }
  }

  /**
   * Mettre à jour une image de service
   */
  async updateImage({ params, request, response, session }: HttpContext) {
    const image = await ServiceImage.findOrFail(params.id)

    try {
      const data = await request.validateUsing(updateServiceImageValidator)

      let updateData: any = {
        label: data.label,
        description: data.description || null,
      }

      // Si une nouvelle image est fournie
      if (data.image) {
        // Supprimer l'ancienne image
        const oldPath = app.makePath(`public${image.url}`)
        try {
          await unlink(oldPath)
        } catch (e) {
          console.warn("Impossible de supprimer l'ancienne image:", e.message)
        }

        // Générer un nouveau nom de fichier
        const uniqueId = cuid()
        const extension = data.image.extname
        const filename = `service_${uniqueId}.${extension}`

        // Déplacer le nouveau fichier
        const uploadsPath = app.makePath('public/uploads/service-images')
        await data.image.move(uploadsPath, { name: filename })

        updateData = {
          ...updateData,
          filename: filename,
          originalName: data.image.clientName,
          mimeType: data.image.type || 'image/jpeg',
          fileSize: data.image.size,
          url: `/uploads/service-images/${filename}`,
        }
      }

      image.merge(updateData)
      await image.save()

      session.flash('success', 'Image modifiée avec succès')
      return response.redirect().toRoute('settings.images')
    } catch (error) {
      session.flash('error', "Erreur lors de la modification de l'image")
      return response.redirect().back()
    }
  }

  /**
   * Supprimer une image de service
   */
  async destroyImage({ params, response, session }: HttpContext) {
    const image = await ServiceImage.findOrFail(params.id)

    try {
      // Supprimer le fichier physique
      const filePath = app.makePath(`public${image.url}`)
      try {
        await unlink(filePath)
      } catch (e) {
        console.warn('Impossible de supprimer le fichier:', e.message)
      }

      // Supprimer l'enregistrement
      await image.delete()

      session.flash('success', 'Image supprimée avec succès')
      return response.redirect().toRoute('settings.images')
    } catch (error) {
      session.flash('error', "Erreur lors de la suppression de l'image")
      return response.redirect().back()
    }
  }

  /**
   * Réorganiser l'ordre des images
   */
  async reorderImages({ request, response }: HttpContext) {
    const { orderedIds } = await request.validateUsing(reorderServiceImagesValidator)

    try {
      // Mettre à jour l'ordre de chaque image
      for (const [i, orderedId] of orderedIds.entries()) {
        await ServiceImage.query().where('id', orderedId).update({ order: i })
      }

      return response.json({
        success: true,
        message: 'Ordre mis à jour avec succès',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: `Erreur lors de la mise à jour: ${error.message}`,
      })
    }
  }
}
