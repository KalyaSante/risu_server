import type { FlexibleUserData, MappedUserData } from '#types/oauth'
import { oauthConfig } from '#config/oauth'

export class OAuthMapper {
  /**
   * Mappe les données utilisateur du provider OAuth vers notre format standardisé simplifié
   */
  static mapUserData(rawUserData: FlexibleUserData): MappedUserData {
    const mapping = oauthConfig.userMapping
    
    // Fonction helper pour récupérer une valeur avec support des chemins imbriqués
    const getValue = (data: any, path: string): any => {
      return path.split('.').reduce((obj, key) => obj?.[key], data)
    }
    
    // Extraction des données avec fallbacks intelligents
    const providerId = getValue(rawUserData, mapping.id) || rawUserData.sub || rawUserData.user_id
    const email = getValue(rawUserData, mapping.email) || rawUserData.email_address
    const fullName = getValue(rawUserData, mapping.name) || 
                    rawUserData.full_name || 
                    rawUserData.display_name ||
                    `${rawUserData.first_name || ''} ${rawUserData.last_name || ''}`.trim() ||
                    rawUserData.login ||
                    null
    
    if (!providerId) {
      throw new Error('ID utilisateur introuvable dans la réponse OAuth. Vérifiez OAUTH_USER_FIELD_ID.')
    }
    
    if (!email) {
      throw new Error('Email utilisateur introuvable dans la réponse OAuth. Vérifiez OAUTH_USER_FIELD_EMAIL.')
    }
    
    return {
      providerId: String(providerId), // ID du provider OAuth
      email,
      fullName: fullName || null // Nom complet ou null
    }
  }
  
  /**
   * Valide que les champs requis sont présents dans la réponse OAuth
   */
  static validateUserData(rawUserData: FlexibleUserData): boolean {
    try {
      this.mapUserData(rawUserData)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Debug helper pour voir les champs disponibles
   */
  static debugAvailableFields(rawUserData: FlexibleUserData): string[] {
    const fields: string[] = []
    
    const extractFields = (obj: any, prefix = ''): void => {
      Object.keys(obj || {}).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key
        fields.push(fullKey)
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          extractFields(obj[key], fullKey)
        }
      })
    }
    
    extractFields(rawUserData)
    return fields.sort()
  }
}
