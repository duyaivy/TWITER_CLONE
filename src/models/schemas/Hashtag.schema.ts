import { ObjectId } from 'mongodb'

interface HashtagType {
  _id?: string
  name: string
  created_at?: Date
}
export default class Hashtag {
  _id: ObjectId
  name: string
  created_at: Date

  constructor({ _id, name, created_at = new Date() }: HashtagType) {
    this._id = _id ? new ObjectId(_id) : new ObjectId()
    this.name = name
    this.created_at = created_at
  }
}
