/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

/*
|--------------------------------------------------------------------------
| Route d'accueil publique
|--------------------------------------------------------------------------
*/
router.get('/home', ({ inertia }) => {
  return inertia.render('home', {
    title: 'Kalya - Gestion de serveurs et services',
    description: 'Plateforme de gestion centralisée pour vos serveurs et services'
  })
}).as('home')

/*
|--------------------------------------------------------------------------
| Routes d'authentification (libres d'accès)
|--------------------------------------------------------------------------
*/
router.group(() => {
  router.get('/login', '#controllers/auth_controller.showLogin').as('auth.login.show')
  router.get('/auth/login', '#controllers/auth_controller.login').as('auth.login')
  router.get('/auth/callback', '#controllers/auth_controller.callback').as('auth.callback')
  // ✅ FIX: Ajouter route POST pour logout (garde GET pour compatibilité)
  router.post('/logout', '#controllers/auth_controller.logout').as('auth.logout.post')
  router.get('/logout', '#controllers/auth_controller.logout').as('auth.logout')
})

/*
|--------------------------------------------------------------------------
| Routes protégées par OAuth
|--------------------------------------------------------------------------
*/
router.group(() => {

  // Dashboard principal
  router.get('/', '#controllers/dashboard_controller.index').as('dashboard.index')
  router.get('/dashboard/service/:id', '#controllers/dashboard_controller.serviceDetail').as('dashboard.service')

  // CRUD Serveurs - ✅ MIGRÉ VERS INERTIA
  router.resource('servers', '#controllers/servers_controller').params({
    servers: 'id'
  })

  // CRUD Services - ✅ MIGRÉ VERS INERTIA
  router.resource('services', '#controllers/services_controller').params({
    services: 'id'
  })

  // ✅ NOUVEAU: Routes pour la gestion des dépendances
  router.group(() => {
    // Ajouter une dépendance à un service
    router.post('/services/:id/dependencies', '#controllers/services_controller.addDependency').as('services.dependencies.add')

    // Supprimer une dépendance d'un service
    router.delete('/services/:id/dependencies/:dependencyId', '#controllers/services_controller.removeDependency').as('services.dependencies.remove')
  })

  // ✅ NOUVEAU: Routes pour les paramètres
  router.group(() => {
    // Redirection par défaut vers hosters
    router.get('/settings', ({ response }) => {
      return response.redirect('/settings/hosters')
    })

    // Routes propres pour chaque section
    router.get('/settings/hosters', '#controllers/settings_controller.hosters').as('settings.hosters')
    router.get('/settings/service-images', '#controllers/settings_controller.images').as('settings.images')
    router.get('/settings/general', '#controllers/settings_controller.general').as('settings.general')
    router.get('/settings/notifications', '#controllers/settings_controller.notifications').as('settings.notifications')
    router.get('/settings/security', '#controllers/settings_controller.security').as('settings.security')

    // Actions pour les hébergeurs (API)
    router.post('/settings/hosters', '#controllers/settings_controller.store').as('settings.hosters.store')
    router.post('/settings/hosters/import', '#controllers/settings_controller.import').as('settings.hosters.import')
    router.put('/settings/hosters/:id', '#controllers/settings_controller.update').as('settings.hosters.update')
    router.delete('/settings/hosters/:id', '#controllers/settings_controller.destroy').as('settings.hosters.destroy')
    router.post('/settings/hosters/reorder', '#controllers/settings_controller.reorder').as('settings.hosters.reorder')

    // Actions pour les images de services (API)
    router.post('/settings/images', '#controllers/settings_controller.storeImage').as('settings.images.store')
    router.put('/settings/images/:id', '#controllers/settings_controller.updateImage').as('settings.images.update')
    router.delete('/settings/images/:id', '#controllers/settings_controller.destroyImage').as('settings.images.destroy')
    router.post('/settings/images/reorder', '#controllers/settings_controller.reorderImages').as('settings.images.reorder')
  })

  // Routes API pour les données (conservées pour AJAX/fetch)
  router.group(() => {
    router.get('/servers', '#controllers/api/servers_controller.index').as('api.servers.index')
    router.get('/services', '#controllers/api/services_controller.index').as('api.services.index')
    router.get('/network-data', '#controllers/api/dashboard_controller.networkData').as('api.network.data')

    // Nouveaux endpoints API pour les statuts temps réel
    router.get('/servers/status', '#controllers/api/servers_controller.status').as('api.servers.status')
    router.get('/services/status', '#controllers/api/services_controller.status').as('api.services.status')
    router.patch('/services/:id/toggle', '#controllers/api/services_controller.toggle').as('api.services.toggle')

    // ✅ NOUVEAU: API pour la gestion des dépendances
    router.get('/services/available', '#controllers/services_controller.getAvailableServicesApi').as('api.services.available')
    router.post('/services/check-circular', '#controllers/services_controller.checkCircularDependencies').as('api.services.check-circular')
  }).prefix('/api')

}).middleware([
  // ✅ Middleware OAuth personnalisé
  middleware.oauth()
])

/*
|--------------------------------------------------------------------------
| Routes d'erreur (avec Inertia)
|--------------------------------------------------------------------------
*/
router.get('/404', ({ inertia }) => {
  return inertia.render('errors/not_found', {
    title: 'Page non trouvée - Kalya',
    message: 'La page que vous cherchez n\'existe pas.'
  })
}).as('errors.not_found')

router.get('/500', ({ inertia }) => {
  return inertia.render('errors/server_error', {
    title: 'Erreur serveur - Kalya',
    message: 'Une erreur serveur s\'est produite.'
  })
}).as('errors.server_error')

/*
|--------------------------------------------------------------------------
| 🎯 INERTIA + SVELTE : Migration terminée !
|--------------------------------------------------------------------------
| ✅ Toutes les pages utilisent maintenant Inertia.render() au lieu de view.render()
| ✅ Templates Svelte dans inertia/pages/
| ✅ Composants réutilisables dans inertia/components/
| ✅ Layouts dynamiques dans inertia/app/
| ✅ Navigation SPA sans rechargement de page
| ✅ Hot reload ultra-rapide avec Vite
| ✅ Props typées et réactivité Svelte
|--------------------------------------------------------------------------
| Architecture des composants:
| 📁 inertia/pages/       → Pages principales (Auth/, Dashboard/, Servers/, Services/, errors/)
| 📁 inertia/components/  → Composants réutilisables (ActionButton, Alert, Navbar, Cards...)
| 📁 inertia/app/         → Layouts (BaseLayout, DashboardLayout)
| 📁 inertia/partials/    → Utilitaires (NetworkScript pour monitoring temps réel)
|--------------------------------------------------------------------------
| 🆕 NOUVEAU: Gestion des dépendances entre services
| ✅ API /api/services/available → Liste des services disponibles pour dépendances
| ✅ API /api/services/check-circular → Vérification des dépendances circulaires
| ✅ POST /services/:id/dependencies → Ajouter une dépendance
| ✅ DELETE /services/:id/dependencies/:dependencyId → Supprimer une dépendance
|--------------------------------------------------------------------------
| 🆕 NOUVEAU: Gestion des images de services
| ✅ GET /settings/service-images → Interface de gestion des images
| ✅ POST /settings/images → Upload d'une nouvelle image
| ✅ PUT /settings/images/:id → Modification d'une image
| ✅ DELETE /settings/images/:id → Suppression d'une image
| ✅ POST /settings/images/reorder → Réorganisation de l'ordre
|--------------------------------------------------------------------------
*/
