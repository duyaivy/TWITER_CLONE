import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enum'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { TWEET_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Media from '~/models/schemas/File.schema'
import databaseService from '~/services/database.services'
import tweetService from '~/services/tweet.services'
import { numberEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'

const tweetType = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)

export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetType],
          errorMessage: TWEET_MESSAGES.TYPE_INVALID
        }
      },
      audience: {
        isIn: {
          options: [tweetAudience],
          errorMessage: TWEET_MESSAGES.AUDIENCE_INVALID
        }
      },
      parent_id: {
        isMongoId: {
          errorMessage: TWEET_MESSAGES.TYPE_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const type = req.body.type
            // neu la tweet thi khong co parent_id
            if (type === TweetType.Tweet) {
              if (value != null) {
                throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL)
              }
              return true
            } else {
              // neu la reply thi phai co parent_id
              const tweetExist = await tweetService.getTweetById(value)
              if (!tweetExist) {
                throw new ErrorWithStatus(TWEET_MESSAGES.PARENT_ID_REQUIRED_OR_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
              }
              return true
            }
          }
        }
      },
      content: {
        isString: {
          errorMessage: TWEET_MESSAGES.CONTENT_REQUIRED
        },
        isLength: {
          options: { max: 280 },
          errorMessage: TWEET_MESSAGES.CONTENT_TOO_LONG
        },
        custom: {
          options: (value, { req }) => {
            const type = req.body.type
            const mentions = req.body.mentions || []
            const hashtags = req.body.hashtags || []
            // neu la retweet thi content phai rong,

            if (type === TweetType.Retweet) {
              if (!isEmpty(value)) {
                throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_EMPTY)
              }
              return true
            } else {
              // neu type la con lai ma khong co hagtag hay mention thi conent phai !rong
              if (isEmpty(mentions) && isEmpty(hashtags) && isEmpty(value)) {
                throw new Error(TWEET_MESSAGES.CONTENT_REQUIRED)
              }
              return true
            }
          }
        }
      },
      hashtags: {
        isArray: {
          errorMessage: TWEET_MESSAGES.HASHTAGS_MUST_BE_ARRAY_OF_STRINGS
        },
        custom: {
          options: (value) => {
            // neu co 1 phan tu khong phai la string thi bao loi
            if (value.some((item: any) => typeof item !== 'string')) {
              throw new Error(TWEET_MESSAGES.HASHTAGS_MUST_BE_ARRAY_OF_STRINGS)
            }
            return true
          }
        }
      },
      mentions: {
        isArray: {
          errorMessage: TWEET_MESSAGES.MENTIONS_MUST_BE_ARRAY_OF_USER_IDS
        },
        custom: {
          options: (value) => {
            // neu co 1 phan tu khong phai la string va neu khong phai la userId thi bao loi

            if (
              value.some((item: any) => !ObjectId.isValid(item) || databaseService.users.indexExists(item) === null)
            ) {
              throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_ARRAY_OF_USER_IDS)
            }
            return true
          }
        }
      },
      medias: {
        isArray: {
          errorMessage: TWEET_MESSAGES.MEDIAS_MUST_BE_ARRAY_OF_MEDIAS
        },
        custom: {
          options: (value) => {
            // neu co 1 phan tu khong phai la Media thi bao loi
            if (value.some((item: any) => !(item instanceof Media))) {
              throw new Error(TWEET_MESSAGES.MEDIAS_MUST_BE_ARRAY_OF_MEDIAS)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
