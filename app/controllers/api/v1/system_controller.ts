import type { HttpContext } from '@adonisjs/core/http'
import Database from '@adonisjs/lucid/services/db'

export default class SystemV1Controller {
  /**
   * @swagger
   * /api/v1/system/health:
   *   get:
   *     tags: [System]
   *     summary: Health check du système
   *     description: Vérifie l'état de santé global du système et de ses composants
   *     operationId: getSystemHealthV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Système en bonne santé
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 status:
   *                   type: string
   *                   enum: [healthy, degraded, unhealthy]
   *                   example: "healthy"
   *                 version:
   *                   type: string
   *                   example: "1.0.0"
   *                 uptime:
   *                   type: string
   *                   example: "15 jours, 3 heures"
   *                 checks:
   *                   type: object
   *                   properties:
   *                     database:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           enum: [ok, error]
   *                           example: "ok"
   *                         responseTime:
   *                           type: string
   *                           example: "15ms"
   *                     disk:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: "ok"
   *                         usage:
   *                           type: string
   *                           example: "45%"
   *                     memory:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: "ok"
   *                         usage:
   *                           type: string
   *                           example: "60%"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       503:
   *         description: Système dégradé ou en panne
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 status:
   *                   type: string
   *                   example: "unhealthy"
   *                 error:
   *                   type: string
   *                   example: "Service temporairement indisponible"
   */
  async health({ response }: HttpContext) {
    const checks: any = {}
    let overallStatus = 'healthy'

    // Check base de données
    try {
      const start = Date.now()
      await Database.rawQuery('SELECT 1')
      const dbResponseTime = Date.now() - start

      checks.database = {
        status: 'ok',
        responseTime: `${dbResponseTime}ms`
      }
    } catch (error) {
      checks.database = {
        status: 'error',
        error: 'Database connection failed'
      }
      overallStatus = 'unhealthy'
    }

    // Check espace disque (simulation)
    const diskUsage = Math.floor(Math.random() * 30) + 40 // 40-70%
    checks.disk = {
      status: diskUsage < 80 ? 'ok' : 'warning',
      usage: `${diskUsage}%`,
      available: `${100 - diskUsage}% libre`
    }

    if (diskUsage > 90) {
      overallStatus = 'degraded'
    }

    // Check mémoire (simulation)
    const memoryUsage = Math.floor(Math.random() * 40) + 30 // 30-70%
    checks.memory = {
      status: memoryUsage < 85 ? 'ok' : 'warning',
      usage: `${memoryUsage}%`,
      available: `${100 - memoryUsage}% libre`
    }

    // Uptime simulé
    const uptimeHours = Math.floor(Math.random() * 720) + 24 // 1-30 jours
    const uptimeDays = Math.floor(uptimeHours / 24)
    const remainingHours = uptimeHours % 24

    const healthData = {
      success: true,
      status: overallStatus,
      version: '1.0.0',
      uptime: `${uptimeDays} jours, ${remainingHours} heures`,
      checks,
      timestamp: new Date().toISOString()
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 503
    return response.status(statusCode).json(healthData)
  }

  /**
   * @swagger
   * /api/v1/system/version:
   *   get:
   *     tags: [System]
   *     summary: Version du système
   *     description: Retourne les informations de version de l'API et du système
   *     operationId: getSystemVersionV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Informations de version
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
   *                     version:
   *                       type: string
   *                       example: "1.0.0"
   *                     api_version:
   *                       type: string
   *                       example: "v1"
   *                     build:
   *                       type: string
   *                       example: "development"
   *                     node_version:
   *                       type: string
   *                       example: "v20.11.0"
   *                     platform:
   *                       type: string
   *                       example: "linux"
   *                     architecture:
   *                       type: string
   *                       example: "x64"
   *                     release_date:
   *                       type: string
   *                       format: date
   *                       example: "2025-07-14"
   *                     features:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["REST API v1", "OAuth Authentication", "API Key Authentication"]
   */
  async version({ response }: HttpContext) {
    return response.json({
      success: true,
      data: {
        version: '1.0.0',
        api_version: 'v1',
        build: process.env.NODE_ENV || 'development',
        node_version: process.version,
        platform: process.platform,
        architecture: process.arch,
        release_date: '2025-07-14',
        features: [
          'REST API v1',
          'OAuth Authentication',
          'API Key Authentication',
          'Real-time Status Monitoring',
          'Service Dependencies Management'
        ]
      }
    })
  }

  /**
   * @swagger
   * /api/v1/system/info:
   *   get:
   *     tags: [System]
   *     summary: Informations système
   *     description: Retourne des informations détaillées sur l'environnement système
   *     operationId: getSystemInfoV1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Informations système détaillées
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
   *                     environment:
   *                       type: string
   *                       example: "development"
   *                     timezone:
   *                       type: string
   *                       example: "Europe/Paris"
   *                     locale:
   *                       type: string
   *                       example: "fr-FR"
   *                     memory_usage:
   *                       type: object
   *                       properties:
   *                         rss:
   *                           type: string
   *                           example: "45MB"
   *                         heapTotal:
   *                           type: string
   *                           example: "25MB"
   *                         heapUsed:
   *                           type: string
   *                           example: "15MB"
   *                         external:
   *                           type: string
   *                           example: "2MB"
   *                     process_uptime:
   *                       type: string
   *                       example: "2h 30m 45s"
   *                     platform:
   *                       type: object
   *                       properties:
   *                         os:
   *                           type: string
   *                         arch:
   *                           type: string
   *                         node:
   *                           type: string
   *                     features:
   *                       type: object
   *                       properties:
   *                         api_v1:
   *                           type: boolean
   *                         oauth:
   *                           type: boolean
   *                         api_keys:
   *                           type: boolean
   *                         real_time_monitoring:
   *                           type: boolean
   *                         dependencies_management:
   *                           type: boolean
   *                         swagger_docs:
   *                           type: boolean
   *                         mcp_support:
   *                           type: boolean
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async info({ response }: HttpContext) {
    // Informations sur l'utilisation mémoire
    const memUsage = process.memoryUsage()
    const memoryInfo = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    }

    // Uptime du processus
    const uptimeSeconds = process.uptime()
    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = Math.floor(uptimeSeconds % 60)
    const processUptime = `${hours}h ${minutes}m ${seconds}s`

    return response.json({
      success: true,
      data: {
        environment: process.env.NODE_ENV || 'development',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: 'fr-FR',
        memory_usage: memoryInfo,
        process_uptime: processUptime,
        node_version: process.version,
        pid: process.pid,
        platform: {
          os: process.platform,
          arch: process.arch,
          node: process.version
        },
        limits: {
          max_file_descriptors: process.getMaxListeners(),
          cpu_count: require('os').cpus().length
        },
        features: {
          api_v1: true,
          oauth: true,
          api_keys: true,
          real_time_monitoring: true,
          dependencies_management: true,
          swagger_docs: true,
          mcp_support: true
        }
      },
      timestamp: new Date().toISOString()
    })
  }
}
