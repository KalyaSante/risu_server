import env from '#start/env'

export const oauthConfig = {
  // Configuration de base
  baseUrl: env.get('OAUTH_BASE_URL', 'https://auth.example.com'),
  clientId: env.get('OAUTH_CLIENT_ID'),
  clientSecret: env.get('OAUTH_CLIENT_SECRET'),
  redirectUri: env.get('OAUTH_REDIRECT_URI', 'http://localhost:3333/auth/callback'),

  // Scopes configurables
  scopes: env.get('OAUTH_SCOPES', '').split(',').filter(Boolean),

  // Endpoints configurables
  endpoints: {
    authorize: env.get('OAUTH_ENDPOINT_AUTHORIZE', '/oauth/authorize'),
    token: env.get('OAUTH_ENDPOINT_TOKEN', '/oauth/token'),
    userInfo: env.get('OAUTH_ENDPOINT_USER_INFO', '/api/user/me'),
    revoke: env.get('OAUTH_ENDPOINT_REVOKE', '/oauth/revoke'),
  },

  // ✨ NOUVEAU: Mappings configurables des champs utilisateur (simplifiés)
  userMapping: {
    id: env.get('OAUTH_USER_FIELD_ID', 'id'),
    email: env.get('OAUTH_USER_FIELD_EMAIL', 'email'),
    name: env.get('OAUTH_USER_FIELD_NAME', 'name'),
  },

  // ✨ NOUVEAU: Configuration des headers personnalisés
  headers: {
    userAgent: env.get('OAUTH_USER_AGENT', 'YourApp/1.0'),
    accept: env.get('OAUTH_ACCEPT_HEADER', 'application/json'),
  },

  // ✨ NOUVEAU: Options de configuration avancées
  options: {
    // Permet de gérer les réponses OAuth non-standards
    strictMode: env.get('OAUTH_STRICT_MODE', 'true') === 'true',
    // Timeout pour les requêtes OAuth
    requestTimeout: parseInt(env.get('OAUTH_REQUEST_TIMEOUT', '10000')),
    // Support PKCE pour les providers qui l'exigent
    usePKCE: env.get('OAUTH_USE_PKCE', 'false') === 'true',
  }
}
