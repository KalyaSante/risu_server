import type { HttpContext } from '@adonisjs/core/http'
import McpService from '#services/mcp_service'

/**
 * 🤖 Contrôleur MCP - Endpoint pour intégration Claude
 * 
 * Expose un serveur MCP (Model Context Protocol) compatible avec Claude.ai
 * pour permettre l'interaction directe avec Kalya
 */
export default class McpController {
  
  /**
   * 🔍 Endpoint de découverte MCP
   * GET /mcp - Retourne les informations du serveur MCP
   */
  async index({ response }: HttpContext) {
    return response.json({
      protocol: 'mcp',
      version: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {}
      },
      serverInfo: {
        name: 'kalya-mcp-server',
        version: '1.0.0',
        description: 'Serveur MCP pour Kalya - Gestion de serveurs et services'
      }
    })
  }

  /**
   * 🔧 Endpoint principal MCP
   * POST /mcp - Point d'entrée pour les requêtes MCP
   */
  async handle({ request, response, ...context }: HttpContext) {
    try {
      const mcpService = new McpService(context as HttpContext)
      
      // Authentification via API key dans les headers
      const apiKey = request.header('x-api-key') || 
                     request.header('authorization')?.replace('Bearer ', '')
      
      if (!apiKey) {
        return response.status(401).json({
          error: 'API key manquante',
          message: 'Veuillez fournir une API key via le header X-API-Key ou Authorization'
        })
      }

      const isAuthenticated = await mcpService.authenticate(apiKey)
      if (!isAuthenticated) {
        return response.status(401).json({
          error: 'Authentification échouée',
          message: 'API key invalide'
        })
      }

      const body = request.all()
      const { method, params } = body

      switch (method) {
        case 'initialize':
          return response.json({
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
              logging: {}
            },
            serverInfo: {
              name: 'kalya-mcp-server',
              version: '1.0.0'
            }
          })

        case 'tools/list':
          return response.json({
            tools: mcpService.getAvailableTools()
          })

        case 'tools/call':
          const { name: toolName, arguments: toolArgs } = params
          const result = await mcpService.executeTool(toolName, toolArgs || {})
          
          return response.json({
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ],
            isError: false
          })

        case 'resources/list':
          return response.json({
            resources: [
              {
                uri: 'kalya://servers',
                name: 'Serveurs Kalya',
                description: 'Liste de tous les serveurs gérés',
                mimeType: 'application/json'
              },
              {
                uri: 'kalya://services',
                name: 'Services Kalya',
                description: 'Liste de tous les services',
                mimeType: 'application/json'
              }
            ]
          })

        case 'resources/read':
          const { uri } = params
          if (uri === 'kalya://servers') {
            const servers = await mcpService.listServers()
            return response.json({
              contents: [
                {
                  uri: 'kalya://servers',
                  mimeType: 'application/json',
                  text: JSON.stringify(servers, null, 2)
                }
              ]
            })
          } else if (uri === 'kalya://services') {
            const services = await mcpService.listServices()
            return response.json({
              contents: [
                {
                  uri: 'kalya://services',
                  mimeType: 'application/json',
                  text: JSON.stringify(services, null, 2)
                }
              ]
            })
          } else {
            return response.status(404).json({
              error: 'Ressource non trouvée',
              message: `URI non supportée: ${uri}`
            })
          }

        case 'ping':
          return response.json({ pong: true })

        default:
          return response.status(400).json({
            error: 'Méthode non supportée',
            message: `Méthode MCP non implémentée: ${method}`
          })
      }

    } catch (error) {
      console.error('Erreur MCP:', error)
      
      return response.status(500).json({
        error: 'Erreur serveur',
        message: error.message || 'Une erreur inattendue s\'est produite',
        isError: true
      })
    }
  }

  /**
   * 📡 WebSocket pour communication temps réel (optionnel)
   * WS /mcp/ws - Connexion WebSocket pour MCP
   */
  async websocket({ request, response }: HttpContext) {
    // TODO: Implémenter WebSocket pour MCP si nécessaire
    // Pour l'instant, on retourne une erreur 501
    return response.status(501).json({
      error: 'Non implémenté',
      message: 'WebSocket MCP sera implémenté dans une version future'
    })
  }

  /**
   * ❤️ Endpoint de santé
   * GET /mcp/health - Vérification de l'état du serveur MCP
   */
  async health({ response }: HttpContext) {
    return response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      protocol: 'mcp/2024-11-05'
    })
  }

  /**
   * 📚 Documentation des outils disponibles
   * GET /mcp/tools - Liste détaillée des outils MCP
   */
  async tools({ response, ...context }: HttpContext) {
    try {
      const mcpService = new McpService(context as HttpContext)
      const tools = mcpService.getAvailableTools()

      return response.json({
        tools,
        total: tools.length,
        server: 'kalya-mcp-server',
        documentation: {
          authentication: 'Utilisez votre API key Kalya via le header X-API-Key',
          usage: 'Consultez la documentation MCP d\'Anthropic pour l\'intégration',
          endpoint: '/mcp'
        }
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erreur lors de la récupération des outils',
        message: error.message
      })
    }
  }
}
