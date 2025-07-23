import { Request } from 'express'
import sharp from 'sharp'
import ENV, { isDevelopment } from '~/constants/config'

import { PATH_UPLOAD } from '~/constants/URL'

import { getNameFromFullname, uploadSingleImage } from '~/utils/file'

class MediaService {
  async uploadSingleImage(req: Request) {
    const file = await uploadSingleImage(req)
    const newName = `${PATH_UPLOAD}/${getNameFromFullname(file.newFilename)}.jpg`
    await sharp(file.filepath).jpeg().toFile(newName)
    return isDevelopment
      ? `http://localhost:${ENV.SERVER_PORT}/static/${getNameFromFullname(file.newFilename)}.jpg`
      : `${ENV.HOST}/static/${getNameFromFullname(file.newFilename)}.jpg`
  }
}
const mediaService = new MediaService()
export default mediaService
