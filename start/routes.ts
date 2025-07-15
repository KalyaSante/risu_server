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
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'

/*
|--------------------------------------------------------------------------
| Route d'accueil publique
|--------------------------------------------------------------------------
*/
router
  .get('/home', ({ inertia }) => {
    return inertia.render('home', {
      title: 'Kalya - Gestion de serveurs et services',
      description: 'Plateforme de gestion centralisée pour vos serveurs et services',
    })
  })
  .as('home')

/*
|--------------------------------------------------------------------------
| Routes d'authentification (libres d'accès)
|--------------------------------------------------------------------------
*/
router.group(() => {
  router.get('/login', '#controllers/auth_controller.showLogin').as('auth.login.show')
  router.get('/auth/login', '#controllers/auth_controller.login').as('auth.login')
  router.get('/auth/callback', '#controllers/auth_controller.callback').as('auth.callback')
  router.post('/logout', '#controllers/auth_controller.logout').as('auth.logout.post')
  router.get('/logout', '#controllers/auth_controller.logout').as('auth.logout')
})

/*
|--------------------------------------------------------------------------
| Routes Web protégées par OAuth (Interface Inertia)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // Dashboard principal
    router.get('/', '#controllers/dashboard_controller.index').as('dashboard.index')
    router
      .get('/dashboard/service/:id', '#controllers/dashboard_controller.serviceDetail')
      .as('dashboard.service')

    // Interface Web pour Serveurs
    router.resource('servers', '#controllers/servers_controller').params({
      servers: 'id',
    })

    // Interface Web pour Services
    router.resource('services', '#controllers/services_controller').params({
      services: 'id',
    })

    // Gestion des dépendances de services (Actions spécifiques)
    router.group(() => {
      router
        .post('/services/:id/dependencies', '#controllers/services_controller.addDependency')
        .as('services.dependencies.add')
      router
        .delete(
          '/services/:id/dependencies/:dependencyId',
          '#controllers/services_controller.removeDependency'
        )
        .as('services.dependencies.remove')
    })

    // Interface Web pour les paramètres
    router.group(() => {
      router.get('/settings', ({ response }) => {
        return response.redirect('/settings/hosters')
      })

      // Pages de paramètres
      router.get('/settings/hosters', '#controllers/settings_controller.hosters').as('settings.hosters')
      router.get('/settings/service-images', '#controllers/settings_controller.images').as('settings.images')
      router.get('/settings/general', '#controllers/settings_controller.general').as('settings.general')
      router.get('/settings/notifications', '#controllers/settings_controller.notifications').as('settings.notifications')
      router.get('/settings/security', '#controllers/settings_controller.security').as('settings.security')

      // Actions Web pour les hébergeurs
      router.post('/settings/hosters', '#controllers/settings_controller.store').as('settings.hosters.store')
      router.post('/settings/hosters/import', '#controllers/settings_controller.import').as('settings.hosters.import')
      router.put('/settings/hosters/:id', '#controllers/settings_controller.update').as('settings.hosters.update')
      router.delete('/settings/hosters/:id', '#controllers/settings_controller.destroy').as('settings.hosters.destroy')
      router.post('/settings/hosters/reorder', '#controllers/settings_controller.reorder').as('settings.hosters.reorder')

      // Actions Web pour les images
      router.post('/settings/images', '#controllers/settings_controller.storeImage').as('settings.images.store')
      router.put('/settings/images/:id', '#controllers/settings_controller.updateImage').as('settings.images.update')
      router.delete('/settings/images/:id', '#controllers/settings_controller.destroyImage').as('settings.images.destroy')
      router.post('/settings/images/reorder', '#controllers/settings_controller.reorderImages').as('settings.images.reorder')

      // Actions Web pour les clés API
      router.post('/settings/security/api-keys', '#controllers/settings_controller.createApiKey').as('settings.api-keys.create')
      router.delete('/settings/security/api-keys/:id', '#controllers/settings_controller.deleteApiKey').as('settings.api-keys.delete')
      router.patch('/settings/security/api-keys/:id/toggle', '#controllers/settings_controller.toggleApiKey').as('settings.api-keys.toggle')
      router.patch('/settings/security/api-keys/:id/regenerate', '#controllers/settings_controller.regenerateApiKey').as('settings.api-keys.regenerate')
    })
  })
  .middleware([middleware.oauth()])

/*
|--------------------------------------------------------------------------
| API Routes - Compatibilité Front-end (OAuth protégé)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // Routes existantes utilisées par le front (compatibilité)
    router.get('/servers', '#controllers/api/servers_controller.index').as('api.servers.index')
    router.get('/services', '#controllers/api/services_controller.index').as('api.services.index')
    router.get('/network-data', '#controllers/api/dashboard_controller.networkData').as('api.network.data')

    // Routes de statut temps réel (utilisées par NetworkScript.svelte)
    router.get('/servers/status', '#controllers/api/servers_controller.status').as('api.servers.status')
    router.get('/services/status', '#controllers/api/services_controller.status').as('api.services.status')
    router.patch('/services/:id/toggle', '#controllers/api/services_controller.toggle').as('api.services.toggle')

    // Routes pour la gestion des dépendances (compatibilité)
    router.get('/services/available', '#controllers/services_controller.getAvailableServicesApi').as('api.services.available')
    router.post('/services/check-circular', '#controllers/services_controller.checkCircularDependencies').as('api.services.check-circular')
  })
  .prefix('/api')
  .middleware([middleware.oauth()])

/*
|--------------------------------------------------------------------------
| API REST v1 - Authentification par token (API publique)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    /*
    |--------------------------------------------------------------------------
    | API Authentication
    |--------------------------------------------------------------------------
    */
    router.group(() => {
      router.get('/me', '#controllers/api/v1/auth_controller.me').as('api.v1.auth.me')
      router.post('/refresh', '#controllers/api/v1/auth_controller.refresh').as('api.v1.auth.refresh')
    }).prefix('/auth')

    /*
    |--------------------------------------------------------------------------
    | API Servers Resource
    |--------------------------------------------------------------------------
    */
    router.group(() => {
      router.get('/', '#controllers/api/v1/servers_controller.index').as('api.v1.servers.index')
      router.post('/', '#controllers/api/v1/servers_controller.store').as('api.v1.servers.store')
      router.get('/:id', '#controllers/api/v1/servers_controller.show').as('api.v1.servers.show')
      router.put('/:id', '#controllers/api/v1/servers_controller.update').as('api.v1.servers.update')
      router.patch('/:id', '#controllers/api/v1/servers_controller.update').as('api.v1.servers.patch')
      router.delete('/:id', '#controllers/api/v1/servers_controller.destroy').as('api.v1.servers.destroy')

      // Actions spécifiques aux serveurs
      router.get('/:id/status', '#controllers/api/v1/servers_controller.status').as('api.v1.servers.status')

      // Relations
      router.get('/:id/services', '#controllers/api/v1/servers_controller.services').as('api.v1.servers.services')
    }).prefix('/servers')

    /*
    |--------------------------------------------------------------------------
    | API Services Resource
    |--------------------------------------------------------------------------
    */
    router.group(() => {
      router.get('/', '#controllers/api/v1/services_controller.index').as('api.v1.services.index')
      router.post('/', '#controllers/api/v1/services_controller.store').as('api.v1.services.store')
      router.get('/:id', '#controllers/api/v1/services_controller.show').as('api.v1.services.show')
      router.put('/:id', '#controllers/api/v1/services_controller.update').as('api.v1.services.update')
      router.patch('/:id', '#controllers/api/v1/services_controller.update').as('api.v1.services.patch')
      router.delete('/:id', '#controllers/api/v1/services_controller.destroy').as('api.v1.services.destroy')

      // Actions spécifiques aux services
      router.get('/:id/status', '#controllers/api/v1/services_controller.status').as('api.v1.services.status')
      router.patch('/:id/toggle', '#controllers/api/v1/services_controller.toggle').as('api.v1.services.toggle')

      // Gestion des dépendances
      router.get('/:id/dependencies', '#controllers/api/v1/services_controller.dependencies').as('api.v1.services.dependencies')
      router.post('/:id/dependencies', '#controllers/api/v1/services_controller.addDependency').as('api.v1.services.dependencies.add')
      router.delete('/:id/dependencies/:dependencyId', '#controllers/api/v1/services_controller.removeDependency').as('api.v1.services.dependencies.remove')

      // Services disponibles
      router.get('/available', '#controllers/api/v1/services_controller.available').as('api.v1.services.available')
    }).prefix('/services')

    /*
    |--------------------------------------------------------------------------
    | API Dashboard & Analytics
    |--------------------------------------------------------------------------
    */
    router.group(() => {
      router.get('/overview', '#controllers/api/v1/dashboard_controller.overview').as('api.v1.dashboard.overview')
      router.get('/network-data', '#controllers/api/v1/dashboard_controller.networkData').as('api.v1.dashboard.network-data')
      router.get('/status', '#controllers/api/v1/dashboard_controller.status').as('api.v1.dashboard.status')
      router.get('/metrics', '#controllers/api/v1/dashboard_controller.metrics').as('api.v1.dashboard.metrics')
    }).prefix('/dashboard')

    /*
    |--------------------------------------------------------------------------
    | API System & Health
    |--------------------------------------------------------------------------
    */
    router.group(() => {
      router.get('/health', '#controllers/api/v1/system_controller.health').as('api.v1.system.health')
      router.get('/version', '#controllers/api/v1/system_controller.version').as('api.v1.system.version')
      router.get('/info', '#controllers/api/v1/system_controller.info').as('api.v1.system.info')
    }).prefix('/system')
  })
  .prefix('/api/v1')
  .middleware([middleware.api_auth({})])

/*
|--------------------------------------------------------------------------
| Documentation Swagger
|--------------------------------------------------------------------------
*/
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swagger)
}).as('swagger.docs')

/*
|--------------------------------------------------------------------------
| Routes d'erreur (avec Inertia)
|--------------------------------------------------------------------------
*/
router
  .get('/404', ({ inertia }) => {
    return inertia.render('errors/not_found', {
      title: 'Page non trouvée - Kalya',
      message: "La page que vous cherchez n'existe pas.",
    })
  })
  .as('errors.not_found')

router
  .get('/500', ({ inertia }) => {
    return inertia.render('errors/server_error', {
      title: 'Erreur serveur - Kalya',
      message: "Une erreur serveur s'est produite.",
    })
  })
  .as('errors.server_error')
