import vine from '@vinejs/vine'

export const createServerValidator = vine.compile(
  vine.object({
    nom: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .regex(/^[a-zA-Z0-9\s\-_]+$/)
      .transform((value) => value.trim()),
    
    ip: vine
      .string()
      .trim()
      .minLength(7)
      .maxLength(45)
      .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)
      .transform((value) => value.trim()),
    
    hebergeur: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .in(['OVH', 'Scaleway', 'AWS', 'Azure', 'Google Cloud', 'DigitalOcean', 'Hetzner', 'Local', 'Autre']),
    
    localisation: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .transform((value) => value.trim())
  })
)

export const updateServerValidator = vine.compile(
  vine.object({
    nom: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .regex(/^[a-zA-Z0-9\s\-_]+$/)
      .transform((value) => value.trim()),
    
    ip: vine
      .string()
      .trim()
      .minLength(7)
      .maxLength(45)
      .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)
      .transform((value) => value.trim()),
    
    hebergeur: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .in(['OVH', 'Scaleway', 'AWS', 'Azure', 'Google Cloud', 'DigitalOcean', 'Hetzner', 'Local', 'Autre']),
    
    localisation: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .transform((value) => value.trim())
  })
)
