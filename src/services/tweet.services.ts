import Tweet from '~/models/schemas/Tweet.schema'
import { TweetRequest } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { ObjectId } from 'mongodb'
import BookmarkOrLike from '~/models/schemas/Bookmark.schema'
import { TweetType } from '~/constants/enum'
import {
  addSimulatedViews,
  joinBookmarksAndLikes,
  joinChildTweets,
  joinHashtags,
  joinMentions,
  joinUsers,
  pagination,
  sortByCreatedAtDesc,
  sortTwitterCircle
} from '~/utils/aggregate'

class TweetService {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      // tim trong db, neu co thi lay neu khong co thi tao moi
      hashtags.map((ht) => {
        return databaseService.hashtags.findOneAndUpdate(
          {
            name: ht
          },
          {
            $setOnInsert: new Hashtag({ name: ht })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )

    return hashtagDocuments.map((ht) => ht?._id).filter((id): id is ObjectId => Boolean(id))
  }
  async createTweet(userId: string, tweetData: TweetRequest) {
    const newHashtagsIds = await this.checkAndCreateHashtag(tweetData.hashtags)
    const mentionsIds = tweetData.mentions.map((mention) => new ObjectId(mention))
    const tweet = new Tweet({
      user_id: userId,
      content: tweetData.content,
      parent_id: tweetData.parent_id,
      mentions: mentionsIds,
      type: tweetData.type,
      audience: tweetData.audience,
      hashtags: newHashtagsIds,
      medias: tweetData.medias
    })
    const { insertedId } = await databaseService.tweets.insertOne(tweet)
    const tweetDb = await databaseService.tweets.findOne({ _id: insertedId })
    return tweetDb
  }
  getTweetById(tweetId: string) {
    return databaseService.tweets.findOne({ _id: new ObjectId(tweetId) })
  }
  async getTweetDetailById(id: string) {
    const [tweet] = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            _id: new ObjectId(id)
          }
        },
        joinHashtags,
        ...joinMentions,
        ...joinUsers,
        ...joinBookmarksAndLikes,
        ...joinChildTweets,
        {
          $project: {
            user_id: 0
          }
        }
      ])
      .toArray()
    return tweet
  }
  async likeTweet(tweetId: string, userId: string) {
    const newLike = new BookmarkOrLike({
      user_id: userId,
      tweet_id: tweetId
    })
    const { insertedId } = await databaseService.likes.insertOne(newLike)
    return await databaseService.likes.findOne({ _id: insertedId })
  }
  async unLike(tweetId: string, userId: string) {
    await databaseService.likes.findOneAndDelete({
      user_id: new ObjectId(userId),
      tweet_id: new ObjectId(tweetId)
    })
  }
  async increaseView(tweetId: ObjectId, userId?: string) {
    const updateView = userId ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweetId)
      },
      { $inc: updateView, $set: { updated_at: new Date() } },
      {
        returnDocument: 'after',
        projection: { updated_at: 1, guest_views: 1, user_views: 1 }
      }
    )
    return result
  }
  async getTweetChildren({
    tweetId,
    userId,
    type,
    limit,
    page
  }: {
    tweetId: string
    userId?: string
    type?: TweetType
    limit: number
    page: number
  }) {
    //  lay so luong va tang views
    const updateView = userId ? { user_views: 1 } : { guest_views: 1 }
    const matchCondition: Record<string, any> = {
      parent_id: new ObjectId(tweetId),
      ...(type !== undefined && { type }) // chỉ thêm khi có type
    }
    const [totalDocument] = await Promise.all([
      // lay so luong
      databaseService.tweets.countDocuments(matchCondition),
      // tang views
      databaseService.tweets.updateMany(matchCondition, {
        $inc: updateView,
        $set: { updated_at: new Date() }
      })
    ])
    const total = Math.ceil(totalDocument / limit)
    // get Tweets
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: matchCondition
        },
        ...pagination(page, limit),
        joinHashtags,
        ...joinMentions,
        ...joinUsers,
        ...joinBookmarksAndLikes,
        ...joinChildTweets,
        {
          $project: {
            user_id: 0
          }
        }
      ])
      .toArray()
    return {
      control: {
        total,
        page,
        limit
      },
      data: tweets
    }
  }

  // new feeds
  async getNewFeeds({ userId, limit, page }: { userId?: string; limit: number; page: number }) {
    const userObjectId = new ObjectId(userId)
    // lay followers cua nguoi goi API
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
    const matchCondition = {
      user_id: { $in: [userObjectId, ...followersUserIds] }
    }

    // lay so luong total documents
    type TweetsWithTotal = {
      tweets: Tweet[]
      totalDocument: { total: number }[]
    }
    // get Tweets
    const [{ tweets, totalDocument }] = await databaseService.tweets
      .aggregate<TweetsWithTotal>([
        {
          $match: matchCondition
        },
        {
          $facet: {
            tweets: [
              sortByCreatedAtDesc,
              ...pagination(page, limit),
              ...joinUsers,
              sortTwitterCircle(userId ? new ObjectId(userId) : new ObjectId()),
              joinHashtags,
              ...joinMentions,
              ...joinBookmarksAndLikes,
              ...joinChildTweets,
              addSimulatedViews(userObjectId), // tang view gia
              {
                $project: {
                  user_id: 0,
                  simulated_views: 0
                }
              }
            ],
            totalDocument: [{ $count: 'total' }]
          }
        }
      ])
      .toArray()

    //  await databaseService.tweets.countDocuments(matchCondition)
    const total = Math.ceil(totalDocument[0]?.total / limit)
    const tweetIds = tweets.map((tweet: Tweet) => tweet._id as ObjectId)

    // cap nhat views cho cac tweet da lay ve
    await this.updateTweetViews(tweetIds, userId)
    // chi tang views cho nhung tweet thuc su duoc tra ve

    return {
      control: {
        total,
        page,
        limit
      },
      data: tweets
    }
  }
  async updateTweetViews(tweetIds: ObjectId[], userId?: string) {
    const updateView = userId ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweets.updateMany(
      { _id: { $in: tweetIds } },
      {
        $inc: updateView,
        $set: { updated_at: new Date() }
      }
    )
    return result
  }
}
const tweetService = new TweetService()
export default tweetService
