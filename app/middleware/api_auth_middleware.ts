import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

export default class ApiAuthMiddleware {
  async handle(
    { auth }: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    }
  ) {
    await auth.authenticateUsing(options.guards)
    return next()
  }
}
