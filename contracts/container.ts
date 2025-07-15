declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    swagger: {
      enabled: boolean
      autoGenerate: boolean
      path: string
      ui: string
    }
  }
}
