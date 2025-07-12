import type User from '#models/user'
import type ApiKey from '#models/api_key'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    auth: {
      user: User
      apiKey: ApiKey
      isApiAuthenticated: boolean
    }
  }
}
