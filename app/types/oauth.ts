export interface TokenData {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

// ✨ Interface flexible pour les données utilisateur
export interface FlexibleUserData {
  [key: string]: any // Permet n'importe quelle structure de données
}

// Interface stricte et simplifiée pour l'utilisation interne
export interface MappedUserData {
  providerId: string // ID du provider OAuth
  email: string
  fullName?: string | null // Nom complet pour la DB
}

export interface ServiceDependency {
  id: number
  nom: string
  $pivot?: {
    label?: string
    type?: string
  }
}

// ✅ MODIFIÉ: Ports optionnels pour plus de flexibilité
export interface ServicePort {
  port?: number | string // ✅ Optionnel maintenant
  label?: string // ✅ Optionnel maintenant
}
