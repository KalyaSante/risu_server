import type { HttpContext } from '@adonisjs/core/http'
import type { GuardContract } from '@adonisjs/auth/types'
import { symbols } from '@adonisjs/auth'
import ApiKey from '#models/api_key'
import User from '#models/user'

export type ApiKeyGuardOptions = {
  //
}

export type ApiKeyGuardUser<RealUser> = {
  id: string
  original: RealUser
}

export class ApiKeyGuard<RealUser> implements GuardContract<ApiKeyGuardUser<RealUser>> {
  declare [symbols.GUARD_KNOWN_EVENTS]: {}

  #ctx: HttpContext
  #userProvider: any

  driverName: 'api-key' = 'api-key'
  authenticationAttempted: boolean = false
  isAuthenticated: boolean = false
  user?: ApiKeyGuardUser<RealUser>

  constructor(ctx: HttpContext, _options: ApiKeyGuardOptions, userProvider: any) {
    this.#ctx = ctx
    this.#userProvider = userProvider
  }

  async authenticate() {
    if (this.authenticationAttempted) {
      return this.user!
    }

    this.authenticationAttempted = true
    const authHeader = this.#ctx.request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized')
    }

    const token = authHeader.replace('Bearer ', '')
    const apiKey = await ApiKey.verify(token)

    if (!apiKey) {
      throw new Error('Unauthorized')
    }

    await apiKey.markAsUsed(this.#ctx.request.ip())
    const user = (await this.#userProvider.findById(apiKey.userId)) as User

    if (!user) {
      throw new Error('Unauthorized')
    }

    this.user = {
      id: user.id,
      original: user as RealUser,
    }

    this.isAuthenticated = true
    return this.user
  }

  async check() {
    if (this.isAuthenticated) {
      return true
    }

    try {
      await this.authenticate()
      return this.isAuthenticated
    } catch {
      return false
    }
  }

  getUserOrFail() {
    if (!this.user) {
      throw new Error('Unauthorized')
    }
    return this.user
  }

  async authenticateAsClient(user: ApiKeyGuardUser<RealUser>): Promise<{
    headers: { 'x-session-id': string }
  }> {
    this.user = user
    this.isAuthenticated = true
    return {
      headers: {
        'x-session-id': 'dummy',
      },
    }
  }
}
