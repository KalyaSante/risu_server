import type User from '#models/user'
import type ApiKey from '#models/api_key'
import type { Authenticators } from '@adonisjs/auth/types'
import { ApiKeyGuard } from '../auth/guards/api_key.js'

declare module '@adonisjs/auth/types' {
  interface Authenticators extends Record<string, any> {
    api: {
      implementation: ApiKeyGuard<User>
      config: {
        driver: 'api-key'
      }
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
