/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| The HTTP kernel file is used to register the middleware with the server
| or the router.
|
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * The error handler is used to convert an exception
 * to an HTTP response.
 */
server.errorHandler(() => import('#exceptions/handler'))

/*
|--------------------------------------------------------------------------
| Middleware global
|--------------------------------------------------------------------------
|
| ⚠️ ORDRE CRITIQUE : session AVANT container_bindings !
|
*/
server.use([
  // ✅ SESSION EN PREMIER (pour injecter ctx.session)
  () => import('@adonisjs/session/session_middleware'),

  // ✅ PUIS container bindings (pour debug et bindings généraux)
  () => import('#middleware/container_bindings_middleware'),
])

/*
|--------------------------------------------------------------------------
| Middleware nommés
|--------------------------------------------------------------------------
*/
export const middleware = router.named({
  guest: () => import('#middleware/guest_middleware'),
  auth: () => import('#middleware/auth_middleware'),
  oauth: () => import('#middleware/oauth_middleware'),
})
