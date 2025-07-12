import path from 'node:path'
import url from 'node:url'

// 🔧 FIX: __dirname pour modules ES
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  // Configuration de base
  path: __dirname,
  title: 'Kalya API Documentation',
  version: '1.0.0',
  description: 'Documentation de l\'API Kalya - Gestion de serveurs et services',
  tagIndex: 2,
  info: {
    title: 'Kalya API',
    version: '1.0.0',
    description: 'API REST pour la gestion centralisée de serveurs et services',
    contact: {
      name: 'Kalya Team',
      email: 'contact@kalya.fr',
    },
    license: {
      name: 'Private',
    },
  },
  snakeCase: true,

  // Configuration debug
  debug: false,
  ignore: ['/swagger', '/docs'],

  // Préférences d'affichage
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {}
  },

  // Configuration de sécurité
  securitySchemes: {
    // Bearer token pour l'API
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Clé API pour l\'accès aux endpoints /api/v1/*'
    }
  },

  // 🔧 FIX: authMiddlewares doit être un tableau
  authMiddlewares: ['oauth', 'api_auth'],

  // Configuration par défaut pour les réponses
  defaultResponses: {
    '200': {
      description: 'Succès',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    '400': {
      description: 'Erreur de validation',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Données invalides' },
              errors: { type: 'object' }
            }
          }
        }
      }
    },
    '401': {
      description: 'Non autorisé',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Token invalide ou manquant' }
            }
          }
        }
      }
    },
    '404': {
      description: 'Ressource introuvable',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Ressource introuvable' }
            }
          }
        }
      }
    },
    '500': {
      description: 'Erreur serveur',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Erreur interne du serveur' }
            }
          }
        }
      }
    }
  },

  // Persistance et cache
  persistAuthorization: true,
  showFullPath: false,
}
