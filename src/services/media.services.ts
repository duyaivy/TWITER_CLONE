import { Request } from 'express'
import sharp from 'sharp'
import ENV, { isDevelopment } from '~/constants/config'
import { MediaType } from '~/constants/enum'
import { PATH_UPLOAD_IMAGE } from '~/constants/URL'
import Media from '~/models/schemas/File.schema'
import { getNameFromFullname, uploadImage, uploadVideo } from '~/utils/file'
import { queueEncodeHLS } from '~/models/schemas/Queue.schema'
import fs from 'fs'
import { uploadFileS3 } from '~/utils/s3'

class MediaService {
  async uploadImage(req: Request) {
    const files = await uploadImage(req)
    const imageFiles = Promise.all(
      files.map(async (file) => {
        const fileName = getNameFromFullname(file.newFilename) + '.jpg'
        const newName = `${PATH_UPLOAD_IMAGE}/${fileName}`
        await sharp(file.filepath).jpeg().toFile(newName)

        // upload file to S3
        const s3Result = await uploadFileS3({
          filename: 'images/' + fileName,
          filepath: newName,
          contentType: 'image/jpeg'
        })

        await Promise.all([fs.promises.unlink(file.filepath), fs.promises.unlink(newName)])

        return new Media({
          url: s3Result.Location as string,
          type: MediaType.Image
        })
      })
    )
    return imageFiles
  }

  async uploadVideo(req: Request) {
    const files = await uploadVideo(req)
    const data = await Promise.all(
      files.map(async (file) => {
        const s3Result = await uploadFileS3({
          filename: 'videos/' + file.newFilename,
          filepath: file.filepath,
          contentType: 'video/mp4'
        })
        const fileFolder = file.filepath.split('\\').slice(0, -1).join('\\')
        await fs.promises.rm(fileFolder, { recursive: true, force: true })
        return new Media({
          url: s3Result.Location as string,
          type: MediaType.Video
        })
      })
    )
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
