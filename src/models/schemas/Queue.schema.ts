import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import fs from 'fs'
import videoStatusService from '~/services/videoStatus.services'
import { MediaStatus } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '../Errors'

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
      .createVideoStatus(new ObjectId(fileId), fileName, MediaStatus.Processing)
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
            await fs.promises.unlink(currentFile.filePath) // Xóa file sau khi đã mã hóa
            await videoStatusService
              .updateVideoStatus(new ObjectId(currentFile.fileId), MediaStatus.Done)
              .catch((error) => {
                console.log(`Failed to update video status: ${error.message}`)
              })
            console.log(`Encoded and removed file: ${currentFile.filePath} successfully`)
          } catch (error) {
            console.error('Error encoding video:', error)
            await videoStatusService
              .updateVideoStatus(new ObjectId(currentFile.fileId), MediaStatus.Failed)
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
