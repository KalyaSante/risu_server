import type { HttpContext } from '@adonisjs/core/http'
import Hoster from '#models/hoster'
import ServiceImage from '#models/service_image'
import { createHosterValidator, updateHosterValidator, importHostersValidator } from '#validators/hoster'
import { createServiceImageValidator, updateServiceImageValidator, reorderServiceImagesValidator } from '#validators/service_image'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import { unlink } from 'node:fs/promises'

export default class SettingsController {

  /**
   * Méthode privée pour récupérer les données utilisateur
   */
  private getUserFromSession(session: any) {
    return {
      id: session.get('user_id'),
      email: session.get('user_email'),
      fullName: session.get('user_name')
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

    return hosters.map(hoster => ({
      ...hoster.serialize(),
      hasApi: false
    }))
  }

  /**
   * Méthode privée pour récupérer les images de services
   */
  private async getServiceImages() {
    console.log('🔍 DEBUG: Récupération des images de services...')

    try {
      const images = await ServiceImage.query()
        .where('is_active', true)
        .orderBy('order', 'asc')
        .orderBy('label', 'asc')

      console.log('🔍 DEBUG: Images trouvées:', images.length)

      const formattedImages = images.map(image => ({
        ...image.serialize(),
        file_extension: image.fileExtension
      }))

      console.log('🔍 DEBUG: Images formatées:', JSON.stringify(formattedImages, null, 2))

      return formattedImages
    } catch (error) {
      console.error('❌ DEBUG: Erreur lors de la récupération des images:', error)
      return []
    }
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
      currentRoute: 'settings/hosters'
    })
  }

  /**
   * Section Images des Services
   */
  async images({ inertia, session }: HttpContext) {
    const user = this.getUserFromSession(session)
    const hosters = await this.getHosters()
    const images = await this.getServiceImages()

    console.log('🔍 DEBUG: Section images - Images à envoyer:', images.length)

    return inertia.render('Settings/Index', {
      currentSection: 'service-images',
      user,
      hosters,
      images,
      currentRoute: 'settings/service-images'
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
      currentRoute: 'settings/general'
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
      currentRoute: 'settings/notifications'
    })
  }

  /**
   * Section Sécurité
   */
  async security({ inertia, session }: HttpContext) {
    const user = this.getUserFromSession(session)
    const hosters = await this.getHosters()

    return inertia.render('Settings/Index', {
      currentSection: 'security',
      user,
      hosters,
      security: {}, // Ici tu peux ajouter les vraies données de sécurité
      currentRoute: 'settings/security'
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

      // Retourner une réponse JSON pour les requêtes AJAX
      return response.json({
        success: true,
        message: 'Ordre mis à jour avec succès'
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: `Erreur lors de la mise à jour: ${error.message}`
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
        isActive: true
      })

      session.flash('success', 'Image ajoutée avec succès')
      return response.redirect().toRoute('settings.images')
    } catch (error) {
      session.flash('error', 'Erreur lors de l\'ajout de l\'image')
      return response.redirect().back().withInput().flashErrors()
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
        description: data.description || null
      }

      // Si une nouvelle image est fournie
      if (data.image) {
        // Supprimer l'ancienne image
        const oldPath = app.makePath(`public${image.url}`)
        try {
          await unlink(oldPath)
        } catch (e) {
          console.warn('Impossible de supprimer l\'ancienne image:', e.message)
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
          url: `/uploads/service-images/${filename}`
        }
      }

      image.merge(updateData)
      await image.save()

      session.flash('success', 'Image modifiée avec succès')
      return response.redirect().toRoute('settings.images')
    } catch (error) {
      session.flash('error', 'Erreur lors de la modification de l\'image')
      return response.redirect().back().withInput().flashErrors()
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
      session.flash('error', 'Erreur lors de la suppression de l\'image')
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
      for (let i = 0; i < orderedIds.length; i++) {
        await ServiceImage.query()
          .where('id', orderedIds[i])
          .update({ order: i })
      }

      return response.json({
        success: true,
        message: 'Ordre mis à jour avec succès'
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: `Erreur lors de la mise à jour: ${error.message}`
      })
    }
  }
}
