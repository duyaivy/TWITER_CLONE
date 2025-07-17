import { ObjectId } from 'mongodb'

type RefreshTokenType = {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId
}
export default class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId

  constructor({ _id, token, user_id, created_at = new Date() }: RefreshTokenType) {
    this._id = _id
    this.token = token
    this.user_id = user_id
    this.created_at = created_at
  }
}
