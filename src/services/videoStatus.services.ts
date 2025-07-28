import { MediaStatus } from '~/constants/enum'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'

class VideoStatusService {
  async createVideoStatus(_id: ObjectId, name: string, status = MediaStatus.Processing, message?: string) {
    const videoStatus = new VideoStatus({
      _id,
      name,
      status,
      message: message || '',
      created_at: new Date(),
      updated_at: new Date()
    })
    await databaseService.videoStatuses.insertOne(videoStatus)
  }
  async updateVideoStatus(id: ObjectId, status = MediaStatus.Processing, message?: string) {
    await databaseService.videoStatuses.updateOne(
      {
        _id: id
      },
      {
        $set: {
          status,
          updated_at: new Date(),
          message: message || ''
        }
      }
    )
  }
  getVideoStatusById(id: string) {
    return databaseService.videoStatuses.findOne({
      _id: new ObjectId(id)
    })
  }
}
const videoStatusService = new VideoStatusService()
export default videoStatusService
