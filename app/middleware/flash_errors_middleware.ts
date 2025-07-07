import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour automatiquement flash les erreurs de validation
 * et les anciennes valeurs des formulaires
 */
export default class FlashErrorsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { session, request } = ctx

    try {
      await next()
    } catch (error) {
      // Si c'est une erreur de validation
      if (error.code === 'E_VALIDATION_ERROR') {
        // Flash les erreurs de validation
        const errors = error.messages
        Object.keys(errors).forEach((field) => {
          session.flash(`errors.${field}`, errors[field][0])
        })

        // Flash les anciennes valeurs (sauf les mots de passe)
        const oldValues = request.all()
        Object.keys(oldValues).forEach((key) => {
          if (!key.toLowerCase().includes('password') && !key.includes('_token')) {
            session.flash(`old.${key}`, oldValues[key])
          }
        })

        session.flash('error', 'Veuillez corriger les erreurs dans le formulaire')
      }

      // Re-lancer l'erreur pour qu'elle soit gérée par le handler global
      throw error
    }
  }
}
