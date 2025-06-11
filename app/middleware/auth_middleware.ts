import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    // Vérification de la disponibilité de l'auth service
    if (!ctx.auth) {
      ctx.logger.error('Auth service is not available in the HTTP context')
      ctx.logger.error('Available ctx properties:', Object.keys(ctx))

      // Retourner une erreur HTTP 500 avec un message explicite
      return ctx.response.status(500).json({
        error: 'Authentication service unavailable',
        message: 'The authentication service is not properly initialized',
        request_id: ctx.request.id()
      })
    }

    try {
      await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
      return next()
    } catch (error) {
      ctx.logger.error('Authentication failed:', error)

      // Si c'est une erreur d'authentification, rediriger vers la page de login
      if (ctx.request.accepts(['html'])) {
        return ctx.response.redirect(this.redirectTo)
      }

      // Pour les requêtes API, retourner un JSON
      return ctx.response.status(401).json({
        error: 'Unauthenticated',
        message: 'You must be authenticated to access this resource'
      })
    }
  }
}
