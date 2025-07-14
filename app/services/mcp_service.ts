import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import Service from '#models/service'
import User from '#models/user'
import { BaseModel } from '@adonisjs/lucid/orm'

/**
 * 🤖 Service MCP pour intégration Claude
 * Implémente le protocole Model Context Protocol (MCP) d'Anthropic
 */
export default class McpService {
  private context: HttpContext
  private user: User | null = null

  constructor(context: HttpContext) {
    this.context = context
  }

  /**
   * 🔐 Authentification via API key
   */
  async authenticate(apiKey: string): Promise<boolean> {
    try {
      // Utiliser le middleware d'auth API existant
      const { auth } = this.context
      
      // Simuler l'authentification avec la clé API
      this.context.request.headers().authorization = `Bearer ${apiKey}`
      
      // TODO: Intégrer avec le middleware api_auth existant
      // Pour l'instant, on simule une auth réussie
      this.user = await User.first()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 📋 Obtenir la liste des serveurs
   */
  async listServers(): Promise<any> {
    if (!this.user) throw new Error('Non authentifié')

    const servers = await Server.query()
      .preload('services')
      .select(['id', 'name', 'hostname', 'status', 'created_at', 'updated_at'])

    return {
      servers: servers.map(server => ({
        id: server.id,
        name: server.name,
        hostname: server.hostname,
        status: server.status,
        servicesCount: server.services?.length || 0,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt
      }))
    }
  }

  /**
   * 🔍 Obtenir le statut d'un serveur spécifique
   */
  async getServerStatus(serverId: number): Promise<any> {
    if (!this.user) throw new Error('Non authentifié')

    const server = await Server.query()
      .where('id', serverId)
      .preload('services', (query) => {
        query.select(['id', 'name', 'status', 'port'])
      })
      .firstOrFail()

    return {
      server: {
        id: server.id,
        name: server.name,
        hostname: server.hostname,
        status: server.status,
        services: server.services.map(service => ({
          id: service.id,
          name: service.name,
          status: service.status,
          port: service.port
        }))
      }
    }
  }

  /**
   * 📄 Lister tous les services
   */
  async listServices(): Promise<any> {
    if (!this.user) throw new Error('Non authentifié')

    const services = await Service.query()
      .preload('server', (query) => {
        query.select(['id', 'name', 'hostname'])
      })
      .preload('dependencies')
      .select(['id', 'name', 'status', 'port', 'server_id'])

    return {
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
        port: service.port,
        server: service.server ? {
          id: service.server.id,
          name: service.server.name,
          hostname: service.server.hostname
        } : null,
        dependencies: service.dependencies?.length || 0
      }))
    }
  }

  /**
   * ⚙️ Gérer un service (start/stop/restart)
   */
  async manageService(serviceId: number, action: 'start' | 'stop' | 'restart'): Promise<any> {
    if (!this.user) throw new Error('Non authentifié')

    const service = await Service.findOrFail(serviceId)
    
    // Simuler l'action sur le service
    let newStatus: string
    switch (action) {
      case 'start':
        newStatus = 'running'
        break
      case 'stop':
        newStatus = 'stopped'
        break
      case 'restart':
        newStatus = 'restarting'
        // Après un délai, repasser à running
        setTimeout(async () => {
          service.status = 'running'
          await service.save()
        }, 2000)
        break
      default:
        throw new Error(`Action non supportée: ${action}`)
    }

    service.status = newStatus
    await service.save()

    return {
      success: true,
      service: {
        id: service.id,
        name: service.name,
        status: service.status,
        action: action
      },
      message: `Service ${service.name} ${action} avec succès`
    }
  }

  /**
   * 🔗 Obtenir les dépendances d'un service
   */
  async getServiceDependencies(serviceId: number): Promise<any> {
    if (!this.user) throw new Error('Non authentifié')

    const service = await Service.query()
      .where('id', serviceId)
      .preload('dependencies', (query) => {
        query.select(['id', 'name', 'status'])
      })
      .preload('dependents', (query) => {
        query.select(['id', 'name', 'status'])
      })
      .firstOrFail()

    return {
      service: {
        id: service.id,
        name: service.name,
        dependencies: service.dependencies.map(dep => ({
          id: dep.id,
          name: dep.name,
          status: dep.status
        })),
        dependents: service.dependents?.map(dep => ({
          id: dep.id,
          name: dep.name,
          status: dep.status
        })) || []
      }
    }
  }

  /**
   * 🔍 Rechercher dans la base de données
   */
  async searchDatabase(query: string, table?: string): Promise<any> {
    if (!this.user) throw new Error('Non authentifié')

    const results: any = {}

    // Recherche dans les serveurs
    if (!table || table === 'servers') {
      const servers = await Server.query()
        .where('name', 'LIKE', `%${query}%`)
        .orWhere('hostname', 'LIKE', `%${query}%`)
        .limit(10)

      results.servers = servers.map(s => ({
        id: s.id,
        name: s.name,
        hostname: s.hostname,
        status: s.status
      }))
    }

    // Recherche dans les services
    if (!table || table === 'services') {
      const services = await Service.query()
        .where('name', 'LIKE', `%${query}%`)
        .preload('server', (q) => q.select(['id', 'name']))
        .limit(10)

      results.services = services.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        server: s.server?.name
      }))
    }

    return {
      query,
      results,
      total: Object.values(results).flat().length
    }
  }

  /**
   * 📊 Obtenir les statistiques du système
   */
  async getSystemStats(): Promise<any> {
    if (!this.user) throw new Error('Non authentifié')

    const totalServers = await Server.query().count('* as total')
    const totalServices = await Service.query().count('* as total')
    const runningServices = await Service.query().where('status', 'running').count('* as total')
    const stoppedServices = await Service.query().where('status', 'stopped').count('* as total')

    return {
      stats: {
        servers: {
          total: totalServers[0].total
        },
        services: {
          total: totalServices[0].total,
          running: runningServices[0].total,
          stopped: stoppedServices[0].total,
          uptime_percentage: totalServices[0].total > 0 
            ? Math.round((runningServices[0].total / totalServices[0].total) * 100) 
            : 0
        }
      }
    }
  }

  /**
   * 🛠️ Obtenir la liste des outils MCP disponibles
   */
  getAvailableTools(): any[] {
    return [
      {
        name: 'list_servers',
        description: 'Liste tous les serveurs avec leurs informations de base',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_server_status',
        description: 'Obtient le statut détaillé d\'un serveur spécifique',
        inputSchema: {
          type: 'object',
          properties: {
            serverId: {
              type: 'number',
              description: 'ID du serveur'
            }
          },
          required: ['serverId']
        }
      },
      {
        name: 'list_services',
        description: 'Liste tous les services avec leurs informations',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'manage_service',
        description: 'Démarre, arrête ou redémarre un service',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: {
              type: 'number',
              description: 'ID du service'
            },
            action: {
              type: 'string',
              enum: ['start', 'stop', 'restart'],
              description: 'Action à effectuer'
            }
          },
          required: ['serviceId', 'action']
        }
      },
      {
        name: 'get_service_dependencies',
        description: 'Obtient les dépendances d\'un service',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: {
              type: 'number',
              description: 'ID du service'
            }
          },
          required: ['serviceId']
        }
      },
      {
        name: 'search_database',
        description: 'Recherche dans la base de données',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Terme de recherche'
            },
            table: {
              type: 'string',
              enum: ['servers', 'services'],
              description: 'Table spécifique à rechercher (optionnel)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_system_stats',
        description: 'Obtient les statistiques générales du système',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ]
  }

  /**
   * 🔧 Exécuter un outil MCP
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'list_servers':
        return await this.listServers()
      
      case 'get_server_status':
        return await this.getServerStatus(args.serverId)
      
      case 'list_services':
        return await this.listServices()
      
      case 'manage_service':
        return await this.manageService(args.serviceId, args.action)
      
      case 'get_service_dependencies':
        return await this.getServiceDependencies(args.serviceId)
      
      case 'search_database':
        return await this.searchDatabase(args.query, args.table)
      
      case 'get_system_stats':
        return await this.getSystemStats()
      
      default:
        throw new Error(`Outil non supporté: ${toolName}`)
    }
  }
}
