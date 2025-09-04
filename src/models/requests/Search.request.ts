import { MediaQueryType } from '~/constants/enum'
import { PaginationQuery } from './others.request'

export interface SearchQuery extends PaginationQuery {
  content: string
  media_type?: MediaQueryType
  people_follow?: 'true' | 'false'
}
export interface HashtagQuery extends PaginationQuery {
  hashtag: string
}
