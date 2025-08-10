import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enum'
import Media from './File.schema'

interface TweetInterface {
  _id?: ObjectId
  user_id: string
  content: string
  parent_id: string | null
  created_at?: Date
  updated_at?: Date
  mentions: ObjectId[]
  type: TweetType
  audience: TweetAudience
  hashtags: ObjectId[]
  medias: Media[]
  guest_views?: number
  user_views?: number
}
export default class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  content: string
  parent_id: ObjectId | null
  created_at?: Date
  updated_at?: Date
  mentions: ObjectId[]
  type: TweetType
  audience: TweetAudience
  hashtags: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number

  constructor(tweet: TweetInterface) {
    const date = new Date()
    this._id = tweet._id
    this.user_id = new ObjectId(tweet.user_id)
    this.content = tweet.content
    this.parent_id = tweet.parent_id ? new ObjectId(tweet.parent_id) : null
    this.created_at = tweet.created_at || date
    this.updated_at = tweet.updated_at || date
    this.mentions = tweet.mentions
    this.type = tweet.type
    this.audience = tweet.audience
    this.hashtags = tweet.hashtags
    this.medias = tweet.medias
    this.guest_views = tweet?.guest_views || 0
    this.user_views = tweet?.user_views || 0
  }
}

// lay so luong total documents
export type TweetsWithTotal = {
  tweets: Tweet[]
  totalDocument: { total: number }[]
}
