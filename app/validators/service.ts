import vine from '@vinejs/vine'

export const createServiceValidator = vine.compile(
  vine.object({
    serverId: vine
      .number()
      .positive()
      .withoutDecimals(),
    
    nom: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .transform((value) => value.trim()),
    
    icon: vine
      .string()
      .trim()
      .maxLength(100)
      .regex(/^[a-zA-Z0-9\-_\.]+\.(svg|png|jpg|jpeg|gif|webp)$/)
      .optional()
      .transform((value) => value?.trim()),
    
    path: vine
      .string()
      .trim()
      .maxLength(500)
      .optional()
      .transform((value) => value?.trim()),
    
    repoUrl: vine
      .string()
      .trim()
      .url()
      .maxLength(500)
      .optional()
      .transform((value) => value?.trim()),
    
    docPath: vine
      .string()
      .trim()
      .maxLength(500)
      .optional()
      .transform((value) => value?.trim()),
    
    lastMaintenanceAt: vine
      .date({
        formats: ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss']
      })
      .optional()
  })
)

export const updateServiceValidator = vine.compile(
  vine.object({
    serverId: vine
      .number()
      .positive()
      .withoutDecimals(),
    
    nom: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .transform((value) => value.trim()),
    
    icon: vine
      .string()
      .trim()
      .maxLength(100)
      .regex(/^[a-zA-Z0-9\-_\.]+\.(svg|png|jpg|jpeg|gif|webp)$/)
      .optional()
      .transform((value) => value?.trim()),
    
    path: vine
      .string()
      .trim()
      .maxLength(500)
      .optional()
      .transform((value) => value?.trim()),
    
    repoUrl: vine
      .string()
      .trim()
      .url()
      .maxLength(500)
      .optional()
      .transform((value) => value?.trim()),
    
    docPath: vine
      .string()
      .trim()
      .maxLength(500)
      .optional()
      .transform((value) => value?.trim()),
    
    lastMaintenanceAt: vine
      .date({
        formats: ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss']
      })
      .optional()
  })
)

export const createServiceDependencyValidator = vine.compile(
  vine.object({
    serviceId: vine
      .number()
      .positive()
      .withoutDecimals(),
    
    dependsOnServiceId: vine
      .number()
      .positive()
      .withoutDecimals(),
    
    label: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .transform((value) => value.trim()),
    
    type: vine
      .string()
      .in(['required', 'optional', 'fallback'])
  })
)
