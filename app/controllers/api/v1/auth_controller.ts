import type { HttpContext } from '@adonisjs/core/http'

export default class AuthV1Controller {
  /**
   * @swagger
   * /api/v1/auth/me:
   *   get:
   *     tags: [Authentication]
   *     summary: Informations utilisateur
   *     description: Retourne les informations de l'utilisateur authentifié et de sa clé API
   *     operationId: getUserInfoV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Informations utilisateur et clé API
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                           example: 1
   *                         email:
   *                           type: string
   *                           example: "admin@kalya.fr"
   *                         fullName:
   *                           type: string
   *                           example: "Administrateur Kalya"
   *                     apiKey:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                           example: 42
   *                         name:
   *                           type: string
   *                           example: "API Key Production"
   *                         lastUsedAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2025-07-14T15:30:00Z"
   *                         createdAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2025-01-01T10:00:00Z"
   *       401:
   *         description: Token invalide ou manquant
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "Utilisateur non authentifié"
   */
  async me({ response, auth }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié',
        })
      }

      const apiKey = auth.apiKey!

      return response.json({
        success: true,
        data: {
          user: auth.user.serialize(),
          apiKey: {
            id: apiKey.id,
            name: apiKey.name,
            lastUsedAt: apiKey.lastUsedAt,
            createdAt: apiKey.createdAt,
          },
        },
      })
    } catch (error) {
      return response.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      })
    }
  }

  /**
   * @swagger
   * /api/v1/auth/refresh:
   *   post:
   *     tags: [Authentication]
   *     summary: Actualiser le token (futur)
   *     description: Endpoint réservé pour l'actualisation des tokens (non implémenté)
   *     operationId: refreshTokenV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       501:
   *         description: Fonctionnalité non implémentée
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "Fonctionnalité de refresh non implémentée"
   *                 message:
   *                   type: string
   *                   example: "Les clés API Kalya ne nécessitent pas de refresh"
   */
  async refresh({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      error: 'Fonctionnalité de refresh non implémentée',
      message: 'Les clés API Kalya ne nécessitent pas de refresh'
    })
  }
}
