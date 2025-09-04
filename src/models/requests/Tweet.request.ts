import { TweetAudience, TweetType } from '~/constants/enum'
import Media from '../schemas/File.schema'
import { ParamsDictionary } from 'express-serve-static-core'
import { PaginationQuery } from './Others.request'

export interface TweetRequest {
  user_id?: string
  content: string
  parent_id: string | null
  mentions: string[]
  type: TweetType
  audience: TweetAudience
  hashtags: string[]
  medias: Media[]
}
export interface TweetQuery extends PaginationQuery {
  type: string
}
export interface TweetParams extends ParamsDictionary {
  tweet_id: string
}
