import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import fs from 'fs'
import videoStatusService from '~/services/videoStatus.services'
import { MediaStatus } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '../Errors'
import { MEDIA_MESSAGES } from '~/constants/messages'
import { getFiles } from '~/utils/file'
import path from 'path'
import { PATH_UPLOAD_VIDEO } from '~/constants/URL'
import { uploadFileS3 } from '~/utils/s3'
import mime from 'mime'
interface VideoQueueItem {
  filePath: string
  fileId: string
  fileName: string
}
class Queue {
  private items: VideoQueueItem[]
  isEncoding: boolean
  constructor() {
    this.items = []
    this.isEncoding = false
  }
  async addToQueue(filePath: string, fileId: string, fileName: string) {
    this.items.push({ filePath, fileId, fileName })
    await videoStatusService
      .createVideoStatus(new ObjectId(fileId), fileName, MediaStatus.Processing, MEDIA_MESSAGES.VIDEO_UPLOAD_PROCESSING)
      .catch((error) => {
        throw new ErrorWithStatus(`Failed to create video status: ${error.message}`, 500)
      })
    if (!this.isEncoding) {
      this.isEncoding = true
      while (this.items.length > 0) {
        const currentFile = this.items.shift()
        if (currentFile) {
          try {
            await encodeHLSWithMultipleVideoStreams(currentFile.filePath)
            const folderVideo = path.resolve(PATH_UPLOAD_VIDEO, currentFile.fileId)
            // delete
            await fs.promises.unlink(currentFile.filePath)
            // upload to s3
            const files = getFiles(path.resolve(PATH_UPLOAD_VIDEO, currentFile.fileId))
            await Promise.all(
              files.map((filepath) => {
                const relativePath = path.relative(PATH_UPLOAD_VIDEO, filepath)
                const s3Key = 'videos-hls/' + relativePath.split(path.sep).join('/')

                return uploadFileS3({
                  filepath,
                  filename: s3Key,
                  contentType: mime.getType(filepath) as string
                })
              })
            )

            await videoStatusService
              .updateVideoStatus(
                new ObjectId(currentFile.fileId),
                MediaStatus.Done,
                MEDIA_MESSAGES.VIDEO_UPLOAD_SUCCESS
              )
              .catch((error) => {
                console.log(`Failed to update video status: ${error.message}`)
              })

            await fs.promises.rmdir(folderVideo, { recursive: true })
            console.log(`Encoded and removed file: ${currentFile.filePath} successfully`)
          } catch (error) {
            console.error('Error encoding video:', error)
            await videoStatusService
              .updateVideoStatus(
                new ObjectId(currentFile.fileId),
                MediaStatus.Failed,
                MEDIA_MESSAGES.VIDEO_UPLOAD_FAILED
              )
              .catch((error) => {
                console.log(`Failed to update video status: ${error.message}`)
              })
          }
        }
      }
      this.isEncoding = false
    }
  }
}
export const queueEncodeHLS = new Queue()
