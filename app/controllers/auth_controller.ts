import type { HttpContext } from '@adonisjs/core/http'
import { oauthConfig } from '#config/oauth'
import User from '#models/user'
import type { TokenData, FlexibleUserData } from '#types/oauth'
import { OAuthMapper } from '#services/oauth_mapper'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkg = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8')
)

export default class AuthController {
  /**
   * Redirection vers le serveur OAuth pour authentification
   */
  async login({ response, request }: HttpContext) {
    const state = Math.random().toString(36).substring(2, 15)

    // ✨ Support PKCE si activé
    let codeChallenge = ''
    let codeVerifier = ''

    if (oauthConfig.options.usePKCE) {
      codeVerifier = this.generateCodeVerifier()
      codeChallenge = await this.generateCodeChallenge(codeVerifier)
      request.ctx?.session?.put('oauth_code_verifier', codeVerifier)
    }

    request.ctx?.session?.put('oauth_state', state)

    if (!oauthConfig.clientId) {
      throw new Error('OAuth client ID is not configured. Set OAUTH_CLIENT_ID in your .env file.')
    }

    // Construire l'URL d'autorisation avec support PKCE
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      state: state,
    })

    if (oauthConfig.scopes.length > 0) {
      params.append('scope', oauthConfig.scopes.join(' '))
    }

    if (oauthConfig.options.usePKCE) {
      params.append('code_challenge', codeChallenge)
      params.append('code_challenge_method', 'S256')
    }

    const authorizeUrl = `${oauthConfig.baseUrl}${oauthConfig.endpoints.authorize}?${params}`

    return response.redirect(authorizeUrl)
  }

  async callback({ request, response, session }: HttpContext) {
    const { code, state, error } = request.qs()

    if (error) {
      session.flash('error', `Erreur OAuth: ${error}`)
      return response.redirect('/login')
    }

    const sessionState = session.get('oauth_state')
    if (!state || state !== sessionState) {
      session.flash('error', 'État OAuth invalide - possible attaque CSRF')
      return response.redirect('/login')
    }

    try {
      // ✨ Support PKCE
      const tokenRequestBody: any = {
        grant_type: 'authorization_code',
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        redirect_uri: oauthConfig.redirectUri,
        code: code,
      }

      if (oauthConfig.options.usePKCE) {
        const codeVerifier = session.get('oauth_code_verifier')
        if (codeVerifier) {
          tokenRequestBody.code_verifier = codeVerifier
        }
      }

      // ✨ Headers configurables + timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), oauthConfig.options.requestTimeout)

      const tokenResponse = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': oauthConfig.headers.accept,
          'User-Agent': oauthConfig.headers.userAgent,
        },
        body: JSON.stringify(tokenRequestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`)
      }

      const tokenData = (await tokenResponse.json()) as TokenData

      // ✨ Récupération flexible des infos utilisateur
      const userController = new AbortController()
      const userTimeoutId = setTimeout(() => userController.abort(), oauthConfig.options.requestTimeout)

      const userResponse = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.userInfo}`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: oauthConfig.headers.accept,
          'User-Agent': oauthConfig.headers.userAgent,
        },
        signal: userController.signal,
      })

      clearTimeout(userTimeoutId)

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        throw new Error(`User info fetch failed: ${userResponse.status} - ${errorText}`)
      }

      // ✨ Récupération et mapping flexible des données utilisateur
      const rawUserData = (await userResponse.json()) as FlexibleUserData

      // Debug en mode développement
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Raw OAuth user data:', rawUserData)
        console.log('🔧 Available fields:', OAuthMapper.debugAvailableFields(rawUserData))
      }

      // Mapping des données via le service
      const mappedUserData = OAuthMapper.mapUserData(rawUserData)

      // ✨ Créer ou mettre à jour l'utilisateur local avec provider_id
      const user = await User.updateOrCreate(
        { providerId: mappedUserData.providerId }, // Recherche par provider_id
        {
          providerId: mappedUserData.providerId,
          fullName: mappedUserData.fullName,
          email: mappedUserData.email,
          password: null, // Pas de password local avec OAuth
        }
      )

      // Stockage simplifié en session
      session.put('access_token', tokenData.access_token)
      if (tokenData.refresh_token) {
        session.put('refresh_token', tokenData.refresh_token)
      }
      session.put('token_expires_at', Date.now() + tokenData.expires_in * 1000)
      session.put('user_id', user.id)
      session.put('user_email', user.email)
      session.put('user_name', user.fullName || user.email)

      session.flash('success', `Bienvenue ${user.fullName || user.email} ! ✨`)

      const intendedUrl = request.cookie('intended_url', '/')
      response.clearCookie('intended_url')

      return response.redirect(intendedUrl)
    } catch (e) {
      const error = e as Error
      console.error('❌ OAuth Error:', error)

      // Messages d'erreur plus explicites en développement
      let errorMessage = "Erreur lors de l'authentification OAuth"
      if (process.env.NODE_ENV === 'development') {
        errorMessage += `: ${error.message}`
      }

      session.flash('error', errorMessage)
      return response.redirect('/login')
    } finally {
      // Nettoyage des données temporaires
      session.forget('oauth_state')
      session.forget('oauth_code_verifier')
    }
  }

  async logout({ session, response }: HttpContext) {
    const accessToken = session.get('access_token')
    if (accessToken && oauthConfig.endpoints.revoke) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.revoke}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': oauthConfig.headers.userAgent,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
      } catch (error) {
        console.error('❌ Échec révocation token:', error)
      }
    }

    // Nettoyage simplifié de la session
    const sessionKeys = [
      'access_token', 'refresh_token', 'token_expires_at',
      'user_id', 'user_email', 'user_name',
      'oauth_state', 'oauth_code_verifier'
    ]

    sessionKeys.forEach((key) => session.forget(key))
    session.flash('success', 'Déconnexion réussie ✨')

    return response.redirect('/login')
  }

  async showLogin({ inertia, session }: HttpContext) {
    return inertia.render('Auth/Login', {
      version: pkg.version,
      flashMessages: {
        error: session.flashMessages.get('error'),
        success: session.flashMessages.get('success'),
      },
    })
  }

  async refreshToken(session: any): Promise<boolean> {
    const refreshToken = session.get('refresh_token')
    if (!refreshToken) return false

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), oauthConfig.options.requestTimeout)

      const response = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': oauthConfig.headers.accept,
          'User-Agent': oauthConfig.headers.userAgent,
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) return false

      const tokenData = (await response.json()) as TokenData

      session.put('access_token', tokenData.access_token)
      if (tokenData.refresh_token) {
        session.put('refresh_token', tokenData.refresh_token)
      }
      session.put('token_expires_at', Date.now() + tokenData.expires_in * 1000)

      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  // ✨ Helpers pour PKCE
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
}
