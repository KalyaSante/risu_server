import vine from '@vinejs/vine'

/**
 * Validator pour la création d'un hébergeur (sans API)
 */
export const createHosterValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .unique(async (db, value) => {
        const hoster = await db.from('hosters').where('name', value).first()
        return !hoster
      }),

    type: vine.enum(['vps', 'dedicated', 'cloud', 'shared']),

    description: vine.string().trim().maxLength(500).optional().nullable(),
  })
)

/**
 * Validator pour la mise à jour d'un hébergeur (sans API)
 */
export const updateHosterValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .unique(async (db, value, field) => {
        const hoster = await db
          .from('hosters')
          .where('name', value)
          .whereNot('id', field.meta.hosterId)
          .first()
        return !hoster
      }),

    type: vine.enum(['vps', 'dedicated', 'cloud', 'shared']),

    description: vine.string().trim().maxLength(500).optional().nullable(),
  })
)

/**
 * Validator pour l'import d'hébergeurs (sans API)
 */
export const importHostersValidator = vine.compile(
  vine.object({
    hosters: vine.array(
      vine.object({
        name: vine.string().trim().minLength(2).maxLength(100),

        type: vine.enum(['vps', 'dedicated', 'cloud', 'shared']),

        description: vine.string().trim().maxLength(500).optional().nullable(),
      })
    ),
  })
)
