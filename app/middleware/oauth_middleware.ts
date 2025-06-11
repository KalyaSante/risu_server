import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { oauthConfig } from '#config/oauth'

/**
 * Middleware pour vérifier l'authentification OAuth
 */
export default class OAuthMiddleware {
  /**
   * Handle incoming request
   */
  async handle(ctx: HttpContext, next: NextFn) {
    const { session, response, request } = ctx

    // Vérifier si l'utilisateur a un token valide en session
    const accessToken = session.get('access_token')
    const tokenExpiresAt = session.get('token_expires_at')
    const userId = session.get('user_id')

    // Si pas de token ou d'utilisateur, rediriger vers login
    if (!accessToken || !userId) {
      return this.redirectToLogin(response, request)
    }

    // Vérifier si le token n'est pas expiré
    if (tokenExpiresAt && Date.now() > tokenExpiresAt) {
      // Essayer de rafraîchir le token
      const refreshed = await this.tryRefreshToken(session)
      
      if (!refreshed) {
        session.clear()
        return this.redirectToLogin(response, request)
      }
    }

    // Vérifier la validité du token avec le serveur OAuth (optionnel)
    if (process.env.NODE_ENV === 'production') {
      const isValid = await this.validateTokenWithServer(accessToken)
      if (!isValid) {
        session.clear()
        return this.redirectToLogin(response, request)
      }
    }

    // Token valide, continuer
    await next()
  }

  /**
   * Rediriger vers la page de login
   */
  private redirectToLogin(response: any, request: any) {
    // Sauvegarder l'URL de destination pour redirection après login
    const intendedUrl = request.url()
    if (intendedUrl !== '/login' && intendedUrl !== '/auth/login') {
      response.session?.put('intended_url', intendedUrl)
    }
    
    return response.redirect('/login')
  }

  /**
   * Essayer de rafraîchir le token avec le refresh token
   */
  private async tryRefreshToken(session: any): Promise<boolean> {
    const refreshToken = session.get('refresh_token')
    if (!refreshToken) return false

    try {
      const response = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret
        })
      })

      if (!response.ok) return false

      const tokenData = await response.json()

      // Mettre à jour les tokens en session
      session.put('access_token', tokenData.access_token)
      if (tokenData.refresh_token) {
        session.put('refresh_token', tokenData.refresh_token)
      }
      session.put('token_expires_at', Date.now() + (tokenData.expires_in * 1000))

      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  /**
   * Valider le token avec le serveur OAuth
   */
  private async validateTokenWithServer(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.userInfo}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }
}
