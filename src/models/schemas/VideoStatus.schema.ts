import { ObjectId } from 'mongodb'
import { MediaStatus } from '~/constants/enum'

type VideoStatusType = {
  _id?: ObjectId
  name: string
  status: MediaStatus
  message?: string
  created_at?: Date
  updated_at?: Date
}
export default class VideoStatus {
  _id?: ObjectId
  name: string
  status: MediaStatus
  message?: string
  created_at: Date
  updated_at: Date
  constructor({
    _id,
    name,
    status = MediaStatus.Processing,
    message = '',
    created_at = new Date(),
    updated_at = new Date()
  }: VideoStatusType) {
    this._id = _id
    this.name = name
    this.status = status
    this.message = message
    this.created_at = created_at
    this.updated_at = updated_at
  }
}
