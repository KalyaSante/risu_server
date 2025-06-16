import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'
import AuthController from '#controllers/auth_controller'

export default class OAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response, session, view } = ctx
    const accessToken = session.get('access_token')
    const tokenExpiresAt = session.get('token_expires_at')
    const userId = session.get('user_id')

    // Vérifier si un token existe
    if (!accessToken || !userId) {
      return this.redirectToLogin(response, request)
    }

    // Vérifier si le token a expiré
    if (tokenExpiresAt && Date.now() > tokenExpiresAt) {
      const authController = new AuthController()
      const refreshed = await authController.refreshToken(session)

      if (!refreshed) {
        session.clear()
        return this.redirectToLogin(response, request)
      }
    }

    try {
      // Charger l'utilisateur
      const user = await User.find(userId)
      if (!user) {
        session.clear()
        return this.redirectToLogin(response, request)
      }

      // ✅ FIX: Utiliser ctx.user au lieu de request.ctx.user
      ctx.user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName || ''
      }

      // Rendre l'utilisateur disponible dans les vues
      view.share({ auth: { user } })

    } catch (error) {
      console.error('OAuth middleware error:', error)
      session.clear()
      return this.redirectToLogin(response, request)
    }

    await next()
  }

  private redirectToLogin(response: any, request: any) {
    // Stocker l'URL demandée pour redirection après login
    const intendedUrl = request.url()
    if (intendedUrl !== '/login' && intendedUrl !== '/auth/login') {
      response.cookie('intended_url', intendedUrl)
    }

    return response.redirect('/login')
  }
}
