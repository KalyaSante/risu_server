import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import ApiKey from '#models/api_key'
// Import du type pour étendre HttpContext
import '#types/auth'

export default class ApiAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Récupérer le token depuis l'header Authorization
    const authHeader = request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({
        success: false,
        error: 'Token d\'authentification requis',
        code: 'MISSING_TOKEN'
      })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      // Vérifier le token
      const apiKey = await ApiKey.verify(token)

      if (!apiKey) {
        return response.status(401).json({
          success: false,
          error: 'Token d\'authentification invalide',
          code: 'INVALID_TOKEN'
        })
      }

      // Mettre à jour l'utilisation
      await apiKey.markAsUsed(request.ip())

      // Ajouter l'utilisateur et la clé API au contexte
      ctx.auth = {
        user: apiKey.user,
        apiKey: apiKey,
        isApiAuthenticated: true
      }

      await next()
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: 'Erreur d\'authentification',
        code: 'AUTH_ERROR'
      })
    }
  }
}
