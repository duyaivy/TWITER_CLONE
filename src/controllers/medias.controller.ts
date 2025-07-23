import { Request, Response } from 'express'

import { MEDIA_MESSAGES } from '~/constants/messages'
import mediaService from '~/services/media.services'

export const uploadImageController = async (req: Request, res: Response) => {
  const result = await mediaService.uploadSingleImage(req)
  res.json({
    message: MEDIA_MESSAGES.UPLOAD_SUCCESS,
    data: result
  })
}
