import { Request } from 'express'
import sharp from 'sharp'
import ENV, { isDevelopment } from '~/constants/config'
import { MediaStatus, MediaType } from '~/constants/enum'
import { PATH_UPLOAD_IMAGE } from '~/constants/URL'
import Media from '~/models/schemas/File.schema'
import { getNameFromFullname, uploadImage, uploadVideo } from '~/utils/file'
import { queueEncodeHLS } from '~/models/schemas/Queue.schema'
import videoStatusService from './videoStatus.services'
import { ObjectId } from 'mongodb'

class MediaService {
  async uploadImage(req: Request) {
    const files = await uploadImage(req)
    const imageFiles = Promise.all(
      files.map(async (file) => {
        const newName = `${PATH_UPLOAD_IMAGE}/${getNameFromFullname(file.newFilename)}.jpg`
        await sharp(file.filepath).jpeg().toFile(newName)
        return new Media({
          url: isDevelopment
            ? `http://localhost:${ENV.SERVER_PORT}/medias/images/${getNameFromFullname(file.newFilename)}.jpg`
            : `${ENV.HOST}/medias/images/${getNameFromFullname(file.newFilename)}.jpg`,
          type: MediaType.Image
        })
      })
    )
    return imageFiles
  }
  async uploadVideo(req: Request) {
    const files = await uploadVideo(req)
    const data = files.map((file) => {
      return new Media({
        url: isDevelopment
          ? `http://localhost:${ENV.SERVER_PORT}/medias/videos/${file.newFilename}`
          : `${ENV.HOST}/medias/videos/${file.newFilename}`,
        type: MediaType.Video
      })
    })
    return data
  }
  async uploadVideoHLS(req: Request) {
    const files = await uploadVideo(req)
    const data = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        queueEncodeHLS.addToQueue(file.filepath, newName, file.originalFilename as string)
        return new Media({
          url: isDevelopment
            ? `http://localhost:${ENV.SERVER_PORT}/medias/videos-hls/${newName}/master.m3u8`
            : `${ENV.HOST}/medias/videos-hls/${newName}/master.m3u8`,
          type: MediaType.VideoHLS
        })
      })
    )
    return data
  }
}
const mediaService = new MediaService()
export default mediaService
