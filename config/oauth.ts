import env from '#start/env'

export const oauthConfig = {
  // URL de base de ton serveur OAuth
  baseUrl: env.get('OAUTH_BASE_URL', 'https://auth.kalya.com'),

  // Client OAuth de ton app cartographie (à configurer après enregistrement)
  clientId: env.get('OAUTH_CLIENT_ID'),
  clientSecret: env.get('OAUTH_CLIENT_SECRET'),

  // URL de callback de ton app
  redirectUri: env.get('OAUTH_REDIRECT_URI', 'http://localhost:3333/auth/callback'),

  // Scopes demandés - vide pour éviter les erreurs
  scopes: [], // Pas de scopes spécifiques

  // Endpoints
  endpoints: {
    authorize: '/oauth/authorize',
    token: '/oauth/token',
    userInfo: '/api/user/me',
  },
}
