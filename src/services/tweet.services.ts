import Tweet from '~/models/schemas/Tweet.schema'
import { TweetRequest } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { ObjectId } from 'mongodb'
import BookmarkOrLike from '~/models/schemas/Bookmark.schema'
import ENV from '~/constants/config'
import { TweetType } from '~/constants/enum'

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
        {
          // join hashtags
          $lookup: {
            from: 'hashtags', // noi se join
            localField: 'hashtags', // field trong schema
            foreignField: '_id', // noi tham chieu ben ngoai
            as: 'hashtags' // ten truong sau khi aggregate
          }
        },
        {
          // join mentions -> lay ra toan bo user duoc mention
          $lookup: {
            from: 'users', // noi se join
            localField: 'mentions', // field trong schema
            foreignField: '_id', // noi tham chieu ben ngoai
            as: 'mentions' // ten truong sau khi aggregate
          }
        },
        {
          // them truong, ghi de len gia tri mentions
          $addfield: {
            mentions: {
              $map: {
                input: 'mentions', // ten truong o schema
                as: 'mt', // ten gia tri lay ra,
                in: {
                  _id: 'mt._id',
                  name: 'mt.name',
                  username: 'mt.username',
                  avatar: 'mt.avatar',
                  email: 'mt.email',
                  location: 'mt.location'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $addfield: {
            author: {
              $map: {
                input: 'author',
                as: 'aut',
                in: {
                  _id: 'aut._id',
                  name: 'aut.name',
                  username: 'aut.username',
                  avatar: 'aut.avatar',
                  email: 'aut.email',
                  location: 'aut.location'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreidField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreidField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          // lay gia tri cua retweet, comment, quoteTweet
          $lookup: {
            from: 'tweets',
            localField: '_id',
            foreidField: 'parent_id',
            as: 'children_tweets'
          }
        },
        {
          $addField: {
            bookmarks: {
              $size: '$bookmarks' // ten truong trong schema
            },
            likes: {
              $size: '$likes' // ten truong trong schema
            },
            retweets: {
              $size: {
                $filter: {
                  input: '$children_tweets',
                  as: 'tweet',
                  cond: `tweet.type === ${TweetType.Retweet}`
                }
              }
            },
            comments: {
              $size: {
                $filter: {
                  input: '$children_tweets',
                  as: 'tweet',
                  cond: `tweet.type === ${TweetType.Comment}`
                }
              }
            },
            quotes: {
              $size: {
                $filter: {
                  input: '$children_tweets',
                  as: 'tweet',
                  cond: `tweet.type === ${TweetType.QuoteTweet}`
                }
              }
            }
          }, // loai bo truong khong can thiet
          $project: {
            user_id: 0,
            children_tweets: 0
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
      { $inc: updateView, update_at: new Date() },
      {
        returnDocument: 'after',
        projection: { update_at: 1, guest_views: 1, user_views: 1 }
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
    type: TweetType
    limit: number
    page: number
  }) {
    //  lay so luong va tang views
    const updateView = userId ? { user_views: 1 } : { guest_views: 1 }
    const [totalDocument] = await Promise.all([
      // lay so luong
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweetId),
        type: type
      }),
      // tang views
      databaseService.tweets.updateMany(
        {
          parent_id: new ObjectId(tweetId),
          type: type
        },
        {
          $inc: updateView,
          update_at: new Date()
        }
      )
    ])
    const total = Math.floor(totalDocument / limit)
    // get Tweets
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweetId),
            type: type
          }
        },
        {
          // join hashtags
          $lookup: {
            from: 'hashtags', // noi se join
            localField: 'hashtags', // field trong schema
            foreignField: '_id', // noi tham chieu ben ngoai
            as: 'hashtags' // ten truong sau khi aggregate
          }
        },
        {
          // join mentions -> lay ra toan bo user duoc mention
          $lookup: {
            from: 'users', // noi se join
            localField: 'mentions', // field trong schema
            foreignField: '_id', // noi tham chieu ben ngoai
            as: 'mentions' // ten truong sau khi aggregate
          }
        },
        {
          // them truong, ghi de len gia tri mentions
          $addfield: {
            mentions: {
              $map: {
                input: 'mentions', // ten truong o schema
                as: 'mt', // ten gia tri lay ra,
                in: {
                  _id: 'mt._id',
                  name: 'mt.name',
                  username: 'mt.username',
                  avatar: 'mt.avatar',
                  email: 'mt.email',
                  location: 'mt.location'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $addfield: {
            author: {
              $map: {
                input: 'author',
                as: 'aut',
                in: {
                  _id: 'aut._id',
                  name: 'aut.name',
                  username: 'aut.username',
                  avatar: 'aut.avatar',
                  email: 'aut.email',
                  location: 'aut.location'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreidField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreidField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          // lay gia tri cua retweet, comment, quoteTweet
          $lookup: {
            from: 'tweets',
            localField: '_id',
            foreidField: 'parent_id',
            as: 'children_tweets'
          }
        },
        {
          $addField: {
            bookmarks: {
              $size: '$bookmarks' // ten truong trong schema
            },
            likes: {
              $size: '$likes' // ten truong trong schema
            },
            retweets: {
              $size: {
                $filter: {
                  input: '$children_tweets',
                  as: 'tweet',
                  cond: `tweet.type === ${TweetType.Retweet}`
                }
              }
            },
            comments: {
              $size: {
                $filter: {
                  input: '$children_tweets',
                  as: 'tweet',
                  cond: `tweet.type === ${TweetType.Comment}`
                }
              }
            },
            quotes: {
              $size: {
                $filter: {
                  input: '$children_tweets',
                  as: 'tweet',
                  cond: `tweet.type === ${TweetType.QuoteTweet}`
                }
              }
            }
          } // loai bo truong khong can thiet
        },
        {
          $project: {
            user_id: 0,
            children_tweets: 0
          }
        },
        {
          $limit: limit
        },
        {
          $skip: limit * (page - 1) // skip qua cac schema
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
}
const tweetService = new TweetService()
export default tweetService
