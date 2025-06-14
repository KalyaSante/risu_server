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
   * ✅ FIX: Callback OAuth amélioré avec debug
   */
  async callback({ request, response, session }: HttpContext) {
    const { code, state, error } = request.qs()

    console.log('🔄 OAuth callback reçu:', {
      hasCode: !!code,
      hasState: !!state,
      error
    })

    // Vérifier les erreurs
    if (error) {
      console.error('❌ Erreur OAuth:', error)
      session.flash('error', `Erreur OAuth: ${error}`)
      return response.redirect('/login')
    }

    // Vérifier le state pour éviter les attaques CSRF
    const sessionState = session.get('oauth_state')
    if (!state || state !== sessionState) {
      console.error('❌ État OAuth invalide:', { state, sessionState })
      session.flash('error', 'État OAuth invalide - possible attaque CSRF')
      return response.redirect('/login')
    }

    try {
      // Échanger le code contre un token
      console.log('🔑 Échange du code OAuth...')
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
        const errorText = await tokenResponse.text()
        console.error('❌ Échec échange token:', tokenResponse.status, errorText)
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('✅ Token OAuth obtenu')

      // Récupérer les infos utilisateur
      console.log('👤 Récupération des infos utilisateur...')
      const userResponse = await fetch(`${oauthConfig.baseUrl}${oauthConfig.endpoints.userInfo}`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error('❌ Échec récupération utilisateur:', userResponse.status, errorText)
        throw new Error(`User info fetch failed: ${userResponse.status} - ${errorText}`)
      }

      const userData = await userResponse.json()
      console.log('✅ Données utilisateur récupérées:', {
        id: userData.id,
        email: userData.email,
        name: userData.name
      })

      // ✅ Créer ou mettre à jour l'utilisateur local
      const user = await User.updateOrCreate(
        { id: userData.id }, // UUID du serveur OAuth
        {
          id: userData.id,
          fullName: userData.name || userData.email,
          email: userData.email,
          password: null // Pas de password local avec OAuth
        }
      )

      console.log('✅ Utilisateur sauvegardé en BDD:', {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      })

      // ✅ FIX: Stocker les données utilisateur COMPLÈTES en session
      session.put('access_token', tokenData.access_token)
      session.put('refresh_token', tokenData.refresh_token)
      session.put('token_expires_at', Date.now() + (tokenData.expires_in * 1000))
      session.put('user_id', user.id)
      session.put('user_email', user.email)
      session.put('user_name', user.fullName || user.email)

      // ✅ Vérification que les données sont bien en session
      console.log('✅ Données mises en session:', {
        user_id: session.get('user_id'),
        user_email: session.get('user_email'),
        user_name: session.get('user_name'),
        has_token: !!session.get('access_token')
      })

      session.flash('success', `Bienvenue ${user.fullName || user.email} !`)

      // Récupérer l'URL de redirection prévue
      const intendedUrl = request.cookie('intended_url', '/')
      response.clearCookie('intended_url')

      console.log('🎯 Redirection vers:', intendedUrl)
      return response.redirect(intendedUrl)

    } catch (error) {
      console.error('💥 Erreur callback OAuth:', error)
      session.flash('error', 'Erreur lors de l\'authentification OAuth: ' + error.message)
      return response.redirect('/login')
    }
  }

  /**
   * ✅ FIX: Déconnexion améliorée - Support POST et GET
   */
  async logout({ session, response, request }: HttpContext) {
    console.log('🚪 Logout demandé:', request.method(), request.url())

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
        console.log('✅ Token OAuth révoqué')
      } catch (error) {
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
      'oauth_state'
    ]

    sessionKeys.forEach(key => session.forget(key))

    console.log('🗑️ Session nettoyée')
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
