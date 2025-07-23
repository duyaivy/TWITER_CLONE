import { Request } from 'express'
import sharp from 'sharp'
import ENV from '~/constants/config'

import { PATH_UPLOAD } from '~/constants/URL'

import { getNameFromFullname, uploadSingleImage } from '~/utils/file'

class MediaService {
  async uploadSingleImage(req: Request) {
    const file = await uploadSingleImage(req)
    const newName = `${PATH_UPLOAD}/${getNameFromFullname(file.newFilename)}.jpg`
    await sharp(file.filepath).jpeg().toFile(newName)
    return `${ENV.SERVER_URL}/uploads/${getNameFromFullname(file.newFilename)}.jpg`
  }
}
const mediaService = new MediaService()
export default mediaService
