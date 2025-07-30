import Tweet from '~/models/schemas/Tweet.schema'
import { TweetRequest } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { ObjectId } from 'mongodb'

class TweetService {
  async checkAndCreatehasgtag(hashtags: string[]) {
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
    const newHashtagsIds = await this.checkAndCreatehasgtag(tweetData.hashtags)

    const tweet = new Tweet({
      user_id: userId,
      content: tweetData.content,
      parent_id: tweetData.parent_id,
      mentions: tweetData.mentions,
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
}
const tweetService = new TweetService()
export default tweetService
