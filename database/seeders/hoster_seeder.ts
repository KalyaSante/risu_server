import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Hoster from '#models/hoster'

export default class extends BaseSeeder {
  async run() {
    // Nettoyer la table avant de seeder
    await Hoster.truncate()

    // Données d'exemple
    await Hoster.createMany([
      {
        name: 'OVH Cloud',
        type: 'cloud',
        description: 'Hébergeur français leader en Europe',
        isActive: true,
        order: 0
      },
      {
        name: 'DigitalOcean',
        type: 'vps',
        description: 'VPS simple et efficace',
        isActive: true,
        order: 1
      },
      {
        name: 'Kimsufi',
        type: 'dedicated',
        description: 'Serveurs dédiés abordables d\'OVH',
        isActive: true,
        order: 2
      },
      {
        name: 'AWS EC2',
        type: 'cloud',
        description: 'Infrastructure cloud Amazon',
        isActive: true,
        order: 3
      },
      {
        name: 'Hetzner',
        type: 'vps',
        description: 'VPS et serveurs dédiés allemands',
        isActive: true,
        order: 4
      }
    ])

    console.log('✅ Hébergeurs d\'exemple créés avec succès')
  }
}
