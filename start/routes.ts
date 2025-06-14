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

  // Routes API pour les données (conservées pour AJAX/fetch)
  router.group(() => {
    router.get('/servers', '#controllers/api/servers_controller.index').as('api.servers.index')
    router.get('/services', '#controllers/api/services_controller.index').as('api.services.index')
    router.get('/network-data', '#controllers/api/dashboard_controller.networkData').as('api.network.data')

    // Nouveaux endpoints API pour les statuts temps réel
    router.get('/servers/status', '#controllers/api/servers_controller.status').as('api.servers.status')
    router.get('/services/status', '#controllers/api/services_controller.status').as('api.services.status')
    router.patch('/services/:id/toggle', '#controllers/api/services_controller.toggle').as('api.services.toggle')
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
*/
