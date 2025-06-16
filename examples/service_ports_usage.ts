// =====================================
// EXEMPLES D'UTILISATION DES PORTS MULTIPLES
// =====================================

import Service from '#models/service'
// import type { ServicePort } from '#types/oauth'

// =====================================
// 1. CRÉER DES SERVICES AVEC PORTS MULTIPLES
// =====================================

// Exemple 1: Grafana (interface web + métriques)
// const grafanaService = await Service.create({
//   nom: 'Grafana',
//   serverId: 1,
//   icon: 'grafana',
//   path: '/dashboard',
//   description: 'Interface de monitoring et visualisation',
//   ports: [
//     {
//       port: 3000,
//       label: 'web',
//       type: 'web',
//       protocol: 'tcp',
//       isPrimary: true,
//       isPublic: true,
//       description: 'Interface web Grafana'
//     },
//     {
//       port: 9090,
//       label: 'metrics',
//       type: 'metrics',
//       protocol: 'tcp',
//       isPrimary: false,
//       isPublic: false,
//       description: 'Endpoint métriques Prometheus'
//     }
//   ]
// })

// Exemple 2: Application fullstack (frontend + API + admin)
// const appService = await Service.create({
//   nom: 'Mon App',
//   serverId: 2,
//   icon: 'react',
//   description: 'Application web complète',
//   ports: [
//     {
//       port: 3000,
//       label: 'frontend',
//       type: 'web',
//       protocol: 'tcp',
//       isPrimary: true,
//       isPublic: true,
//       description: 'Interface utilisateur React'
//     },
//     {
//       port: 4000,
//       label: 'api',
//       type: 'api',
//       protocol: 'tcp',
//       isPrimary: false,
//       isPublic: true,
//       description: 'API REST backend'
//     },
//     {
//       port: 5000,
//       label: 'admin',
//       type: 'admin',
//       protocol: 'tcp',
//       isPrimary: false,
//       isPublic: false,
//       description: 'Interface d\'administration'
//     }
//   ]
// })

// Exemple 3: Base de données avec monitoring
// const dbService = await Service.create({
//   nom: 'PostgreSQL',
//   serverId: 3,
//   icon: 'postgresql',
//   description: 'Base de données principale',
//   ports: [
//     {
//       port: 5432,
//       label: 'database',
//       type: 'database',
//       protocol: 'tcp',
//       isPrimary: true,
//       isPublic: false,
//       description: 'Port de connexion PostgreSQL'
//     },
//     {
//       port: 9187,
//       label: 'exporter',
//       type: 'metrics',
//       protocol: 'tcp',
//       isPrimary: false,
//       isPublic: false,
//       description: 'PostgreSQL Exporter pour Prometheus'
//     }
//   ]
// })

// =====================================
// 2. UTILISER LA MÉTHODE HELPER POUR PORTS COMMUNS
// =====================================

// Méthode rapide pour créer un service web classique
// const webService = await Service.createWithCommonPorts(
//   {
//     nom: 'Site Web',
//     serverId: 1,
//     icon: 'web',
//     description: 'Site web vitrine'
//   },
//   [
//     { port: 80, label: 'http', type: 'web' },
//     { port: 443, label: 'https', type: 'web' }
//   ]
// )

// API avec monitoring
// const apiService = await Service.createWithCommonPorts(
//   {
//     nom: 'API Microservice',
//     serverId: 2,
//     icon: 'api'
//   },
//   [
//     { port: 8080, label: 'api', type: 'api' },
//     { port: 8081, label: 'health', type: 'internal' },
//     { port: 9090, label: 'metrics', type: 'metrics' }
//   ]
// )

// =====================================
// 3. AJOUTER DES PORTS À UN SERVICE EXISTANT
// =====================================

const service = await Service.find(1)
if (service) {
  // Ajouter un port de monitoring
  // service.addPort({
  //   port: 9100,
  //   label: 'node-exporter',
    // type: 'metrics',
    // protocol: 'tcp',
    // isPublic: false,
    // description: 'Node Exporter pour monitoring système'
  // })
  
  // await service.save()
}

// =====================================
// 4. UTILISER LES GETTERS DANS LES VUES
// =====================================

// Récupérer des services avec leurs ports
const services = await Service.query()
  .preload('server')
  .orderBy('nom', 'asc')

for (const service of services) {
  console.log(`Service: ${service.nom}`)
  console.log(`Port principal: ${service.primaryPort}`)
  // console.log(`URL principale: ${service.primaryUrl}`)
  // console.log(`Tous les ports: ${service.allPortNumbers.join(', ')}`)
  console.log(`Ports publics:`)
  
  // service.publicPorts.forEach(port => {
    // console.log(`  - ${port.label}: ${port.port} (${port.type})`)
  // })
  
  console.log(`Ports web accessibles:`)
  // service.webPorts.forEach(port => {
    // const url = `http://${service.server.ip}:${port.port}${service.path || ''}`
    // console.log(`  - ${port.label}: ${url}`)
  // })
  
  console.log('---')
}

// =====================================
// 5. REQUÊTES AVANCÉES SUR LES PORTS
// =====================================

// Trouver tous les services exposant un port web public
// const webServices = await Service.query()
//   .preload('server')
//   .whereRaw("JSON_EXTRACT(ports, '$[*].type') LIKE '%web%'") // Pour MySQL/SQLite
  // .whereRaw("ports::jsonb @> '[{\"type\": \"web\", \"isPublic\": true}]'") // Pour PostgreSQL

// Trouver les services avec des ports dans une plage spécifique
// const httpServices = await Service.query()
//   .preload('server')
//   .whereRaw("JSON_EXTRACT(ports, '$[*].port') BETWEEN 80 AND 8080")

// =====================================
// 6. MIGRATION DE DONNÉES EXISTANTES
// =====================================

// Script pour migrer les anciens services avec un seul port
// async function migrateExistingServices() {
//   console.log('🔄 Migration des services existants...')
  
  // Simuler des services existants avec un seul port
  // const existingServices = [
  //   { id: 1, nom: 'Grafana', port: 3000, type: 'web' },
  //   { id: 2, nom: 'API', port: 8080, type: 'api' },
  //   { id: 3, nom: 'PostgreSQL', port: 5432, type: 'database' }
  // ]
  
  // for (const oldService of existingServices) {
  //   const service = await Service.find(oldService.id)
  //   if (service && !service.ports) {
  //     // Créer la structure ports à partir de l'ancien port unique
  //     service.ports = [{
  //       port: oldService.port,
  //       label: oldService.type,
        // type: oldService.type as ServicePort['type'],
        // protocol: 'tcp',
        // isPrimary: true,
        // isPublic: oldService.type !== 'database',
        // description: `Port ${oldService.type} du service ${oldService.nom}`
  //     }]
      
      // await service.save()
  //     console.log(`✅ Migré: ${service.nom} (port ${oldService.port})`)
  //   }
  // }
  
  // console.log('🎉 Migration terminée !')
// }

// =====================================
// 7. VALIDATION ET HELPERS UTILES
// =====================================

// Fonction pour valider la structure des ports
// function validateServicePorts(ports: ServicePort[]): string[] {
//   const errors: string[] = []
  
  // if (!ports || ports.length === 0) {
  //   errors.push('Au moins un port est requis')
  //   return errors
  // }
  
  // const primaryPorts = ports.filter(p => p.isPrimary)
  // if (primaryPorts.length === 0) {
  //   errors.push('Au moins un port doit être marqué comme principal')
  // } else if (primaryPorts.length > 1) {
  //   errors.push('Un seul port peut être marqué comme principal')
  // }
  
  // const portNumbers = ports.map(p => p.port)
  // const duplicates = portNumbers.filter((port, index) => portNumbers.indexOf(port) !== index)
  // if (duplicates.length > 0) {
  //   errors.push(`Ports dupliqués: ${duplicates.join(', ')}`)
  // }
  
  // for (const port of ports) {
  //   if (port.port < 1 || port.port > 65535) {
  //     errors.push(`Port ${port.port} invalide (doit être entre 1 et 65535)`)
  //   }
    
  //   if (!port.label?.trim()) {
  //     errors.push(`Label requis pour le port ${port.port}`)
  //   }
  // }
  
  // return errors
// }

// Fonction pour créer des ports Docker standard
// function createDockerPorts(mainPort: number, hasMetrics = false, hasAdmin = false): ServicePort[] {
//   const ports: ServicePort[] = [{
//     port: mainPort,
//     label: 'web',
    // type: 'web',
    // protocol: 'tcp',
    // isPrimary: true,
    // isPublic: true,
    // description: 'Interface web principale'
//   }]
  
//   if (hasMetrics) {
//     ports.push({
//       port: mainPort + 1000, // Convention: metrics sur +1000
//       label: 'metrics',
      // type: 'metrics',
      // protocol: 'tcp',
      // isPrimary: false,
      // isPublic: false,
      // description: 'Endpoint métriques Prometheus'
//     })
//   }
  
//   if (hasAdmin) {
//     ports.push({
//       port: mainPort + 100, // Convention: admin sur +100
//       label: 'admin',
      // type: 'admin',
      // protocol: 'tcp',
      // isPrimary: false,
      // isPublic: false,
      // description: 'Interface d\'administration'
//     })
//   }
  
//   return ports
// }

// Exemple d'utilisation
// const newService = await Service.create({
//   nom: 'Application Docker',
//   serverId: 1,
//   ports: createDockerPorts(3000, true, true) // Port 3000 + metrics 4000 + admin 3100
// })

// =====================================
// 8. EXPORT POUR DOCUMENTATION/API
// =====================================

// Fonction pour exporter les infos de ports pour la documentation
// function exportServicePortsInfo(service: Service) {
//   return {
//     service: service.nom,
//     primaryUrl: service.primaryUrl,
//     allPorts: service.allPortNumbers,
//     accessibleUrls: service.webPorts.map(port => ({
//       label: port.label,
//       url: `http://${service.server.ip}:${port.port}${service.path || ''}`,
//       public: port.isPublic
//     })),
//     technicalPorts: service.ports?.filter(p => !p.isPublic).map(port => ({
//       port: port.port,
//       label: port.label,
//       type: port.type,
//       description: port.description
//     }))
//   }
// }
