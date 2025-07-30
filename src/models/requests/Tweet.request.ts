import { TweetAudience, TweetType } from '~/constants/enum'
import Media from '../schemas/File.schema'

export interface TweetRequest {
  user_id: string
  content: string
  parent_id?: string
  mentions: string[]
  type: TweetType
  audience: TweetAudience
  hashtags: string[]
  medias: Media[]
}
