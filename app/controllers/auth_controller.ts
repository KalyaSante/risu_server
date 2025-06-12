import type { HttpContext } from '@adonisjs/core/http'
import { oauthConfig } from '#config/oauth'
import User from '#models/user'

export default class AuthController {
  /**
   * Redirection vers le serveur OAuth pour authentification
   */
  async login({ response, request }: HttpContext) {
    const state = Math.random().toString(36).substring(2, 15)

    // Stocker le state en session pour vérification
    request.ctx?.session?.put('oauth_state', state)

    // Construire l'URL d'autorisation
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      state: state
    })

    // Ajouter les scopes seulement s'ils existent
    if (oauthConfig.scopes.length > 0) {
      params.append('scope', oauthConfig.scopes.join(' '))
    }

    const authorizeUrl = `${oauthConfig.baseUrl}${oauthConfig.endpoints.authorize}?${params}`

    return response.redirect(authorizeUrl)
  }

  /**
   * Callback après autorisation OAuth
   */
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
      session.flash('error', 'État OAuth invalide')
      return response.redirect('/login')
    }

    try {
      // Échanger le code contre un token
      const tokenResponse = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          redirect_uri: oauthConfig.redirectUri,
          code: code
        })
      })

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`)
      }

      const tokenData = await tokenResponse.json()

      // Récupérer les infos utilisateur
      const userResponse = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.userInfo}`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      })

      if (!userResponse.ok) {
        throw new Error(`User info fetch failed: ${userResponse.status}`)
      }

      const userData = await userResponse.json()

      // Créer ou mettre à jour l'utilisateur local
      const user = await User.updateOrCreate(
        { id: userData.id }, // UUID du serveur OAuth
        {
          id: userData.id,
          fullName: userData.name,
          email: userData.email,
          password: null // Pas de password local avec OAuth
        }
      )

      // Stocker les tokens en session
      session.put('access_token', tokenData.access_token)
      session.put('refresh_token', tokenData.refresh_token)
      session.put('token_expires_at', Date.now() + (tokenData.expires_in * 1000))
      session.put('user_id', user.id)

      session.flash('success', `Bienvenue ${user.fullName || user.email} !`)
      return response.redirect('/')

    } catch (error) {
      console.error('OAuth callback error:', error)
      session.flash('error', 'Erreur lors de l\'authentification OAuth')
      return response.redirect('/login')
    }
  }

  /**
   * Déconnexion
   */
  async logout({ session, response }: HttpContext) {
    // Optionnel : révoquer le token côté serveur OAuth
    const accessToken = session.get('access_token')
    if (accessToken) {
      try {
        await fetch(`${oauthConfig.baseUrl}/oauth/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      } catch (error) {
        console.error('Token revocation failed:', error)
      }
    }

    // Nettoyer la session
    session.clear()
    session.flash('success', 'Déconnexion réussie')
    return response.redirect('/login')
  }

  async showLogin({ inertia, session }: HttpContext) {
    console.log('🎯 Inertia Login - nouvelle version !')

    return inertia.render('Auth/Login', {
      flashMessages: {
        error: session.flashMessages.get('error'),
        success: session.flashMessages.get('success'),
      }
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
}
