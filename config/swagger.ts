import path from 'node:path'
import url from 'node:url'

// 🔧 FIX: __dirname pour modules ES
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  // Configuration de base
  path: __dirname,
  title: 'Kalya API v1 Documentation',
  version: '1.0.0',
  description: 'Documentation de l\'API REST v1 Kalya - Gestion de serveurs et services',
  tagIndex: 3, // 🔥 FIX: Ignore les tags automatiques, utilise les tags manuels
  info: {
    title: 'Kalya API v1',
    version: '1.0.0',
    description: 'API REST pour la gestion centralisée de serveurs et services. Authentification par clé API requise.',
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

  // 🔥 NOUVEAU: Filtrage des routes - Ne prendre que l'API v1
  ignore: [
    '/swagger',
    '/docs',
    '/home',
    '/login',
    '/logout',
    '/auth/*',
    '/dashboard*',
    '/servers*',     // Routes web Inertia
    '/services*',    // Routes web Inertia
    '/settings*',    // Routes web Inertia
    '/api/servers*', // Routes de compatibilité
    '/api/services*', // Routes de compatibilité
    '/api/network-data',
    '/mcp*',
    '/404',
    '/500'
  ],

  // 🔥 NOUVEAU: Inclure seulement les routes API v1
  include: [
    '/api/v1/*'
  ],

  // Préférences d'affichage
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {}
  },

  // Configuration de sécurité
  securitySchemes: {
    // Bearer token pour l'API v1
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'API_KEY',
      description: 'Clé API pour l\'accès aux endpoints /api/v1/*. Format: Authorization: Bearer YOUR_API_KEY'
    }
  },

  // 🔧 FIX: authMiddlewares seulement pour API v1
  authMiddlewares: ['api_auth'],

  // 🔥 NOUVEAU: Sécurité par défaut sur toutes les routes
  defaultSecurity: [
    {
      bearerAuth: []
    }
  ],

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
              data: { type: 'object' },
              timestamp: { type: 'string', format: 'date-time' }
            },
            required: ['success']
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
              error: { type: 'string', example: 'Données invalides' },
              details: { type: 'object' }
            },
            required: ['success', 'error']
          }
        }
      }
    },
    '401': {
      description: 'Non autorisé - Clé API invalide ou manquante',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: 'Clé API invalide ou manquante' }
            },
            required: ['success', 'error']
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
              error: { type: 'string', example: 'Ressource introuvable' }
            },
            required: ['success', 'error']
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
              error: { type: 'string', example: 'Erreur interne du serveur' }
            },
            required: ['success', 'error']
          }
        }
      }
    },
    '503': {
      description: 'Service temporairement indisponible',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              status: { type: 'string', example: 'unhealthy' },
              error: { type: 'string', example: 'Service temporairement indisponible' }
            },
            required: ['success', 'error']
          }
        }
      }
    }
  },

  // 🔥 NOUVEAU: Tags définis explicitement pour un regroupement logique
  tags: [
    {
      name: 'Authentication',
      description: 'Endpoints d\'authentification et gestion des tokens API'
    },
    {
      name: 'Servers',
      description: 'Gestion CRUD des serveurs et monitoring de leur statut'
    },
    {
      name: 'Services',
      description: 'Gestion CRUD des services, dépendances et contrôle'
    },
    {
      name: 'Dashboard',
      description: 'Métriques, analytics et données de visualisation'
    },
    {
      name: 'System',
      description: 'Health checks, versions et informations système'
    }
  ],

  // Persistance et cache
  persistAuthorization: true,
  showFullPath: false,

  // 🔥 NOUVEAU: Examples et serveurs
  servers: [
    {
      url: 'https://kalya.example.com/api/v1',
      description: 'Serveur de production'
    },
    {
      url: 'http://localhost:3333/api/v1',
      description: 'Serveur de développement'
    }
  ],

  // 🔥 NOUVEAU: Documentation supplémentaire
  externalDocs: {
    description: 'Guide d\'utilisation complet',
    url: 'https://docs.kalya.fr'
  }
}
