import edge from 'edge.js'
import { DateTime } from 'luxon'

/**
 * Helpers personnalisés pour Edge.js
 */
export function registerEdgeHelpers() {
  
  /**
   * Helper pour formater les dates en français
   */
  edge.global('formatDate', (date: DateTime | string | Date, format: string = 'short') => {
    let d: DateTime
    
    if (date instanceof DateTime) {
      d = date
    } else if (typeof date === 'string') {
      d = DateTime.fromISO(date)
    } else {
      d = DateTime.fromJSDate(date)
    }
    
    if (format === 'short') {
      return d.toFormat('dd/MM/yyyy')
    } else if (format === 'long') {
      return d.toFormat('dd MMMM yyyy à HH:mm', { locale: 'fr' })
    } else {
      return d.toFormat(format, { locale: 'fr' })
    }
  })

  /**
   * Helper pour calculer le temps écoulé
   */
  edge.global('timeAgo', (date: DateTime | string | Date) => {
    let d: DateTime
    
    if (date instanceof DateTime) {
      d = date
    } else if (typeof date === 'string') {
      d = DateTime.fromISO(date)
    } else {
      d = DateTime.fromJSDate(date)
    }
    
    const now = DateTime.now()
    const diff = now.diff(d, ['days', 'hours', 'minutes'])
    
    if (diff.days > 0) {
      return `il y a ${Math.floor(diff.days)} jour${Math.floor(diff.days) > 1 ? 's' : ''}`
    } else if (diff.hours > 0) {
      return `il y a ${Math.floor(diff.hours)} heure${Math.floor(diff.hours) > 1 ? 's' : ''}`
    } else if (diff.minutes > 0) {
      return `il y a ${Math.floor(diff.minutes)} minute${Math.floor(diff.minutes) > 1 ? 's' : ''}`
    } else {
      return 'à l\'instant'
    }
  })

  /**
   * Helper pour vérifier si une route est active
   */
  edge.global('isActiveRoute', (request: any, routePattern: string) => {
    const currentRoute = request.ctx?.route?.name || ''
    return currentRoute.startsWith(routePattern)
  })

  /**
   * Helper pour obtenir l'initiale d'un nom
   */
  edge.global('getInitial', (name: string) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  })

  /**
   * Helper pour formater un nombre avec espaces
   */
  edge.global('formatNumber', (number: number) => {
    return new Intl.NumberFormat('fr-FR').format(number)
  })

  /**
   * Helper pour tronquer un texte
   */
  edge.global('truncate', (text: string, length: number = 50, suffix: string = '...') => {
    if (!text || text.length <= length) return text
    return text.substring(0, length) + suffix
  })

  /**
   * Helper pour extraire le nom d'un repository GitHub
   */
  edge.global('githubRepoName', (url: string) => {
    if (!url) return ''
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/)
    return match ? match[1] : url
  })

  /**
   * Helper pour obtenir la couleur selon le statut
   */
  edge.global('getStatusColor', (status: string) => {
    const colors = {
      'healthy': 'success',
      'warning': 'warning', 
      'error': 'error',
      'unknown': 'neutral'
    }
    return colors[status] || 'neutral'
  })

  /**
   * Helper pour générer un avatar placeholder
   */
  edge.global('avatarPlaceholder', (name: string, size: number = 40) => {
    const initial = name ? name.charAt(0).toUpperCase() : 'U'
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF']
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0
    const color = colors[colorIndex]
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>
        <text x="${size/2}" y="${size/2 + 6}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size/2}" font-weight="bold">${initial}</text>
      </svg>
    `)}`
  })
}
