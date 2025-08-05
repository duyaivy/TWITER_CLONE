import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enum'

export const joinMentions = [
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
    $addFields: {
      mentions: {
        $map: {
          input: '$mentions', // ten truong o schema
          as: 'mt', // ten gia tri lay ra,
          in: {
            _id: '$$mt._id',
            name: '$$mt.name',
            username: '$$mt.username',
            avatar: '$$mt.avatar',
            email: '$$mt.email',
            location: '$$mt.location'
          }
        }
      }
    }
  }
]
export const joinBookmarksAndLikes = [
  {
    $lookup: {
      from: 'bookmarks',
      localField: '_id',
      foreignField: 'tweet_id',
      as: 'bookmarks'
    }
  },
  {
    $lookup: {
      from: 'likes',
      localField: '_id',
      foreignField: 'tweet_id',
      as: 'likes'
    }
  }
]
export const joinChildTweets = [
  {
    // lay gia tri cua retweet, comment, quoteTweet
    $lookup: {
      from: 'tweets',
      localField: '_id',
      foreignField: 'parent_id',
      as: 'children_tweets'
    }
  },
  {
    $addFields: {
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
            cond: {
              $eq: ['$$tweet.type', TweetType.Retweet]
            }
          }
        }
      },
      comments: {
        $size: {
          $filter: {
            input: '$children_tweets',
            as: 'tweet',
            cond: {
              $eq: ['$$tweet.type', TweetType.Comment]
            }
          }
        }
      },
      quotes: {
        $size: {
          $filter: {
            input: '$children_tweets',
            as: 'tweet',
            cond: {
              $eq: ['$$tweet.type', TweetType.QuoteTweet]
            }
          }
        }
      }
    }
  },
  {
    // loai bo truong khong can thiet
    $project: {
      children_tweets: 0
    }
  }
]
export const joinUsers = [
  {
    // lay user ra author
    $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'user_id'
    }
  },
  {
    $unwind: {
      path: '$user_id',
      preserveNullAndEmptyArrays: true // neu khong co user_id thi van tra ve tweet
    }
  },
  {
    $addFields: {
      author: {
        _id: '$user_id._id',
        name: '$user_id.name',
        email: '$user_id.email',
        avatar: '$user_id.avatar'
      }
    }
  }
]
export const joinHashtags = {
  // join hashtags
  $lookup: {
    from: 'hashtags', // noi se join
    localField: 'hashtags', // field trong schema
    foreignField: '_id', // noi tham chieu ben ngoai
    as: 'hashtags' // ten truong sau khi aggregate
  }
}
export const pagination = (page: number, limit: number) => {
  return [
    {
      $skip: limit * (page - 1) // skip qua cac schema
    },
    {
      $limit: limit
    }
  ]
}
export const addSimulatedViews = (userId?: ObjectId) => {
  return {
    $addFields: {
      simulated_views: {
        $cond: [
          { $ifNull: [userId, false] }, // dieu kien
          { $add: ['$user_views', 1] }, // them vao user_views
          { $add: ['$guest_views', 1] } // → ngược lại, them vao guest_views
        ]
      }
    }
  }
}
export const sortTwitterCircle = (userId: ObjectId) => {
  return {
    $match: {
      $or: [
        {
          audience: 0
        },
        {
          $and: [
            {
              audience: 1
            },
            {
              // neu audience băng 1 thi author twiter_circle phai chua userId
              'user_id.twitter_circle': {
                $in: [userId]
              }
            }
          ]
        }
      ]
    }
  }
}
export const sortByCreatedAtDesc = {
  $sort: {
    create_at: -1
  }
}
