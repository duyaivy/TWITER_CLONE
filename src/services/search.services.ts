import { MediaQueryType, MediaType } from '~/constants/enum'
import databaseService from './database.services'
import { aggregateTweetsWithPagination } from '~/utils/aggregation'
import { ObjectId } from 'mongodb'

class SearchService {
  async searchTweets({
    content,
    limit,
    page,
    userId,
    media_type,
    people_follow
  }: {
    content: string
    limit: number
    page: number
    userId?: string
    media_type?: MediaQueryType
    people_follow: boolean
  }) {
    const searchQuery: any = {
      $text: { $search: content, $caseSensitive: true }
    }
    // check media type
    if (media_type) {
      if (media_type === MediaQueryType.Image) {
        searchQuery['medias.type'] = {
          $in: [MediaType.Image]
        }
      } else if (media_type === MediaQueryType.Video) {
        searchQuery['medias.type'] = {
          $in: [MediaType.Video, MediaType.VideoHLS]
        }
      }
    }
    // check people follow
    if (people_follow && userId) {
      const userObjectId = new ObjectId(userId)
      const followers = await databaseService.followers
        .find(
          {
            user_id: userObjectId
          },
          {
            projection: {
              _id: 0,
              followed_user_id: 1
            }
          }
        )
        .toArray()

      // lay ra nhung nguoi toi da follow
      const followersUserIds = followers.map((f) => f.followed_user_id)
      // dieu kien match la tweet cua nguoi do hoac tweet cua nguoi da follow
      searchQuery['user_id'] = { $in: [userObjectId, ...followersUserIds] }
    }

    // Implement search logic here
    const result = await aggregateTweetsWithPagination(searchQuery, page, limit, userId, false)
    return result
  }
  async searchTweetsByHashtag({ hashtag, limit, page }: { hashtag: string; limit: number; page: number }) {
    // Implement search by hashtag logic here
    const hashtags = hashtag.split(',').map((tag) => tag.trim())
    // cac mang ten hashtag, gio lay ve cac id
    const hashtagIds = await databaseService.hashtags
      .find({
        $text: { $search: hashtags.join(' ') }
      })
      .toArray()

    const matchCondition: Record<string, any> = {
      hashtags: { $in: hashtagIds.map((tag) => tag._id) }
    }
    const result = await aggregateTweetsWithPagination(matchCondition, page, limit)

    return result
  }
}
const searchService = new SearchService()
export default searchService
