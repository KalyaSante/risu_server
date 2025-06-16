// Extension du HttpContext pour ajouter la propriété user
declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: {
      id: string
      email: string
      fullName: string
    }
  }
}
