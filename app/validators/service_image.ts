import vine from '@vinejs/vine'

export const createServiceImageValidator = vine.compile(
  vine.object({
    label: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().optional(),
    image: vine.file({
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    })
  })
)

export const updateServiceImageValidator = vine.compile(
  vine.object({
    label: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().optional(),
    image: vine.file({
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }).optional()
  })
)

export const reorderServiceImagesValidator = vine.compile(
  vine.object({
    orderedIds: vine.array(vine.number())
  })
)
