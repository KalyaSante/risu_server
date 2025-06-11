import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Server from '#models/server'
import Service from '#models/service'

test.group('Models', () => {
  test('Server model - creation et validation', async ({ assert }) => {
    const server = new Server()
    server.nom = 'Test Server'
    server.ip = '192.168.1.100'
    server.hebergeur = 'Local'
    server.localisation = 'Test Location'

    await server.save()

    assert.isNotNull(server.id)
    assert.equal(server.nom, 'Test Server')
    assert.equal(server.ip, '192.168.1.100')
    assert.instanceOf(server.createdAt, DateTime)
  })

  test('Service model - creation avec relation serveur', async ({ assert }) => {
    // Créer un serveur
    const server = await Server.create({
      nom: 'Test Server',
      ip: '192.168.1.100',
      hebergeur: 'Local',
      localisation: 'Test Location'
    })

    // Créer un service
    const service = await Service.create({
      serverId: server.id,
      nom: 'Test Service',
      icon: 'test.svg',
      path: '/var/www/test',
      repoUrl: 'https://github.com/test/repo',
      docPath: '/docs/test.md',
      lastMaintenanceAt: DateTime.now()
    })

    // Vérifier les relations
    await service.load('server')
    
    assert.isNotNull(service.id)
    assert.equal(service.nom, 'Test Service')
    assert.equal(service.serverId, server.id)
    assert.equal(service.server.nom, 'Test Server')
  })

  test('Service dependencies - relation many-to-many', async ({ assert }) => {
    // Créer un serveur
    const server = await Server.create({
      nom: 'Test Server',
      ip: '192.168.1.100',
      hebergeur: 'Local',
      localisation: 'Test Location'
    })

    // Créer deux services
    const apiService = await Service.create({
      serverId: server.id,
      nom: 'API Service',
      path: '/var/www/api'
    })

    const dbService = await Service.create({
      serverId: server.id,
      nom: 'Database Service',
      path: '/var/lib/mysql'
    })

    // Créer une dépendance
    await apiService.related('dependencies').attach({
      [dbService.id]: {
        label: 'Database Connection',
        type: 'required'
      }
    })

    // Vérifier la relation
    await apiService.load('dependencies')
    await dbService.load('dependents')

    assert.lengthOf(apiService.dependencies, 1)
    assert.lengthOf(dbService.dependents, 1)
    assert.equal(apiService.dependencies[0].nom, 'Database Service')
    assert.equal(dbService.dependents[0].nom, 'API Service')
  })

  test('Server deletion - cascade vers services', async ({ assert }) => {
    // Créer un serveur avec services
    const server = await Server.create({
      nom: 'Test Server',
      ip: '192.168.1.100',
      hebergeur: 'Local',
      localisation: 'Test Location'
    })

    await Service.create({
      serverId: server.id,
      nom: 'Test Service 1',
      path: '/var/www/service1'
    })

    await Service.create({
      serverId: server.id,
      nom: 'Test Service 2',
      path: '/var/www/service2'
    })

    // Vérifier que les services existent
    const servicesBeforeDelete = await Service.query().where('server_id', server.id)
    assert.lengthOf(servicesBeforeDelete, 2)

    // Supprimer le serveur
    await server.delete()

    // Vérifier que les services ont été supprimés (cascade)
    const servicesAfterDelete = await Service.query().where('server_id', server.id)
    assert.lengthOf(servicesAfterDelete, 0)
  })

  test('Service model - validation des dates', async ({ assert }) => {
    const server = await Server.create({
      nom: 'Test Server',
      ip: '192.168.1.100',
      hebergeur: 'Local',
      localisation: 'Test Location'
    })

    const maintenanceDate = DateTime.now().minus({ days: 7 })
    
    const service = await Service.create({
      serverId: server.id,
      nom: 'Test Service',
      lastMaintenanceAt: maintenanceDate
    })

    await service.refresh()
    
    assert.instanceOf(service.lastMaintenanceAt, DateTime)
    assert.equal(
      service.lastMaintenanceAt?.toFormat('yyyy-MM-dd'),
      maintenanceDate.toFormat('yyyy-MM-dd')
    )
  })
})
