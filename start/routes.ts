import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

/*
|--------------------------------------------------------------------------
| Routes d'authentification
|--------------------------------------------------------------------------
*/
router.group(() => {
  router.get('/login', '#controllers/auth_controller.showLogin').as('auth.login.show')
  router.get('/auth/login', '#controllers/auth_controller.login').as('auth.login')
  router.get('/auth/callback', '#controllers/auth_controller.callback').as('auth.callback')
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

  // CRUD Serveurs
  router.resource('servers', '#controllers/servers_controller').params({
    servers: 'id'
  })

  // CRUD Services
  router.resource('services', '#controllers/services_controller').params({
    services: 'id'
  })

  // Routes API pour les données (si besoin pour AJAX)
  router.group(() => {
    router.get('/servers', '#controllers/api/servers_controller.index').as('api.servers.index')
    router.get('/services', '#controllers/api/services_controller.index').as('api.services.index')
    router.get('/network-data', '#controllers/api/dashboard_controller.networkData').as('api.network.data')
  }).prefix('/api')

}).middleware([
  // ✅ CORRIGÉ : Utilise le middleware OAuth personnalisé
  middleware.oauth()
])

/*
|--------------------------------------------------------------------------
| Route de fallback
|--------------------------------------------------------------------------
*/
router.any('*', ({ response }) => {
  return response.redirect().toRoute('dashboard.index')
})
