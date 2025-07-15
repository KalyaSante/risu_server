import type User from '#models/user'
import type ApiKey from '#models/api_key'
import type { Authenticators } from '@adonisjs/auth/types'

declare module '@adonisjs/auth/types' {
  interface Authenticators extends Record<string, any> {
    api: {
      implementation: ApiKeyAuthGuard
      config: ApiKeyAuthGuardOptions
    }
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    auth: Omit<HttpContext['auth'], 'user'> & {
      user: User | undefined
      apiKey?: ApiKey
      isApiAuthenticated: boolean
    }
  }
}
