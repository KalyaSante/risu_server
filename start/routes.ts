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

// Routes publiques d'authentification
router.group(() => {
  router.get('/login', '#controllers/auth_controller.showLogin').as('auth.login')
  router.get('/auth/login', '#controllers/auth_controller.login').as('auth.oauth.login')
  router.get('/auth/callback', '#controllers/auth_controller.callback').as('auth.oauth.callback')
  router.get('/logout', '#controllers/auth_controller.logout').as('auth.logout')
})

// Routes protégées par OAuth
router.group(() => {
  // Dashboard principal (vue d'ensemble de tous les services)
  router.get('/', '#controllers/dashboard_controller.index').as('dashboard.index')

  // CRUD Serveurs
  router.resource('servers', '#controllers/servers_controller')

  // CRUD Services
  router.resource('services', '#controllers/services_controller')

  // Routes spéciales pour gestion des dépendances
  router.post('/services/:id/dependencies', '#controllers/services_controller.addDependency').as('services.dependencies.add')
  router.delete('/services/:id/dependencies', '#controllers/services_controller.removeDependency').as('services.dependencies.remove')

}).middleware([middleware.oauth()])
