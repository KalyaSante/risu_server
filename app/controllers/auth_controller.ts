import type { HttpContext } from '@adonisjs/core/http'
import { oauthConfig } from '#config/oauth'
import User from '#models/user'
import type { TokenData, UserData } from '#types/oauth'
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

    // Stocker le state en session pour vérification
    request.ctx?.session?.put('oauth_state', state)

    // ✅ FIX: Vérifier que clientId existe
    if (!oauthConfig.clientId) {
      throw new Error('OAuth client ID is not configured')
    }

    // Construire l'URL d'autorisation
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      state: state,
    })

    // Ajouter les scopes seulement s'ils existent
    if (oauthConfig.scopes.length > 0) {
      params.append('scope', oauthConfig.scopes.join(' '))
    }

    const authorizeUrl = `${oauthConfig.baseUrl}${oauthConfig.endpoints.authorize}?${params}`

    return response.redirect(authorizeUrl)
  }

  async callback({ request, response, session }: HttpContext) {
    const { code, state, error } = request.qs()

    // Vérifier les erreurs
    if (error) {
      session.flash('error', `Erreur OAuth: ${error}`)
      return response.redirect('/login')
    }

    // Vérifier le state pour éviter les attaques CSRF
    const sessionState = session.get('oauth_state')
    if (!state || state !== sessionState) {
      session.flash('error', 'État OAuth invalide - possible attaque CSRF')
      return response.redirect('/login')
    }

    try {
      // Échanger le code contre un token
      const tokenResponse = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          redirect_uri: oauthConfig.redirectUri,
          code: code,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`)
      }

      // ✅ FIX: Typage explicite pour tokenData
      const tokenData = (await tokenResponse.json()) as TokenData

      // Récupérer les infos utilisateur
      const userResponse = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.userInfo}`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        throw new Error(`User info fetch failed: ${userResponse.status} - ${errorText}`)
      }

      // ✅ FIX: Typage explicite pour userData
      const userData = (await userResponse.json()) as UserData

      // ✅ Créer ou mettre à jour l'utilisateur local
      const user = await User.updateOrCreate(
        { id: userData.id }, // UUID du serveur OAuth
        {
          id: userData.id,
          fullName: userData.name || userData.email,
          email: userData.email,
          password: null, // Pas de password local avec OAuth
        }
      )

      // ✅ FIX: Stocker les données utilisateur COMPLÈTES en session
      session.put('access_token', tokenData.access_token)
      if (tokenData.refresh_token) {
        session.put('refresh_token', tokenData.refresh_token)
      }
      session.put('token_expires_at', Date.now() + tokenData.expires_in * 1000)
      session.put('user_id', user.id)
      session.put('user_email', user.email)
      session.put('user_name', user.fullName || user.email)

      session.flash('success', `Bienvenue ${user.fullName || user.email} !`)

      // Récupérer l'URL de redirection prévue
      const intendedUrl = request.cookie('intended_url', '/')
      response.clearCookie('intended_url')

      return response.redirect(intendedUrl)
    } catch (e) {
      session.flash('error', "Erreur lors de l'authentification OAuth: " + (e as Error).message)
      return response.redirect('/login')
    }
  }

  async logout({ session, response }: HttpContext) {
    // Optionnel : révoquer le token côté serveur OAuth
    const accessToken = session.get('access_token')
    if (accessToken) {
      try {
        await fetch(`${oauthConfig.baseUrl}/oauth/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        })
      } catch (error) {
        // Log and continue
        console.error('❌ Échec révocation token:', error)
      }
    }

    // ✅ Nettoyer COMPLÈTEMENT la session
    const sessionKeys = [
      'access_token',
      'refresh_token',
      'token_expires_at',
      'user_id',
      'user_email',
      'user_name',
      'oauth_state',
    ]

    sessionKeys.forEach((key) => session.forget(key))

    session.flash('success', 'Déconnexion réussie')

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

  /**
   * Rafraîchir le token automatiquement
   */
  async refreshToken(session: any): Promise<boolean> {
    const refreshToken = session.get('refresh_token')
    if (!refreshToken) return false

    try {
      const response = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
        }),
      })

      if (!response.ok) return false

      // ✅ FIX: Typage du token refresh
      const tokenData = (await response.json()) as TokenData

      // Mettre à jour les tokens en session
      session.put('access_token', tokenData.access_token)
      if (tokenData.refresh_token) {
        session.put('refresh_token', tokenData.refresh_token)
      }
      session.put('token_expires_at', Date.now() + tokenData.expires_in * 1000)

      return true
    } catch (error) {
      // Log and continue
      console.error('Token refresh failed:', error)
      return false
    }
  }
}
