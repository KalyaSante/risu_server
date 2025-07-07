export interface TokenData {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export interface UserData {
  id: string
  email: string
  name?: string
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
