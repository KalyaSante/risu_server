import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import type { LucidRow } from '@adonisjs/lucid/types/model'

export interface ExtendedPaginator<T extends LucidRow = LucidRow> extends ModelPaginatorContract<T> {
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Fonction helper pour calculer les propriétés de pagination
export function extendPaginator<T extends LucidRow = LucidRow>(paginator: ModelPaginatorContract<T>): ExtendedPaginator<T> {
  return {
    ...paginator,
    hasNextPage: paginator.hasPages && paginator.currentPage < paginator.lastPage,
    hasPreviousPage: paginator.currentPage > 1
  }
}

// Types pour les dépendances et couleurs
export type DependencyType = 'required' | 'optional' | 'fallback'

export const dependencyColors: Record<DependencyType, string> = {
  required: '#ef4444',
  optional: '#f59e0b',
  fallback: '#6b7280'
}

export function getDependencyColor(type: string): string {
  return dependencyColors[type as DependencyType] || dependencyColors.fallback
}

// Types pour les statuts
export type StatusType = 'healthy' | 'warning' | 'error' | 'unknown'

export const statusColors: Record<StatusType, string> = {
  healthy: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  unknown: '#6b7280'
}

export function getStatusColor(status: string): string {
  return statusColors[status as StatusType] || statusColors.unknown
}
