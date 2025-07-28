import { ObjectId } from 'mongodb'

type RefreshTokenType = {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId
  iat: Date
  exp: Date
}
export default class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId
  iat: Date
  exp: Date

  constructor({ _id, token, user_id, iat, exp, created_at = new Date() }: RefreshTokenType) {
    this._id = _id
    this.token = token
    this.user_id = user_id
    this.iat = iat
    this.exp = exp
    this.created_at = created_at
  }
}
