import { ObjectId } from 'mongodb'

type ConversationType = {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  message: string
  created_at?: Date
  updated_at?: Date
}
export default class Conversations {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  message: string
  created_at?: Date
  updated_at?: Date

  constructor({
    _id,
    sender_id,
    receiver_id,
    message,
    created_at = new Date(),
    updated_at = new Date()
  }: ConversationType) {
    this._id = _id
    this.sender_id = sender_id
    this.receiver_id = receiver_id
    this.message = message
    this.created_at = created_at
    this.updated_at = updated_at
  }
}
