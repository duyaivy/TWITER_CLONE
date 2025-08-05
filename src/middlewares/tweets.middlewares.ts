import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { POST_MESSAGES, TWEET_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Media from '~/models/schemas/File.schema'
import databaseService from '~/services/database.services'
import tweetService from '~/services/tweet.services'
import userService from '~/services/user.services'
import { TokenPayload } from '~/type'
import { numberEnumToArray } from '~/utils/commons'
import { wrapRequestHandler } from '~/utils/handler'
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
        optional: true,
        // isMongoId: {
        //   errorMessage: TWEET_MESSAGES.TYPE_INVALID
        // },
        custom: {
          options: async (value, { req }) => {
            const type = req.body.type
            // neu la tweet thi khong co parent_id
            if (type === TweetType.Tweet) {
              if (value) {
                throw new ErrorWithStatus(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL, HTTP_STATUS.BAD_REQUEST)
              }
              return true
            } else {
              // neu la con lai thi phai co parent_id
              if (!ObjectId.isValid(value)) {
                throw new ErrorWithStatus(TWEET_MESSAGES.TYPE_INVALID, HTTP_STATUS.BAD_REQUEST)
              }
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
                throw new ErrorWithStatus(TWEET_MESSAGES.CONTENT_MUST_BE_EMPTY, HTTP_STATUS.BAD_REQUEST)
              }
              return true
            } else {
              // neu type la con lai ma khong co hagtag hay mention thi conent phai !rong
              if (isEmpty(mentions) && isEmpty(hashtags) && isEmpty(value)) {
                throw new ErrorWithStatus(TWEET_MESSAGES.CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST)
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
              throw new ErrorWithStatus(TWEET_MESSAGES.HASHTAGS_MUST_BE_ARRAY_OF_STRINGS, HTTP_STATUS.BAD_REQUEST)
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
              throw new ErrorWithStatus(TWEET_MESSAGES.MENTIONS_MUST_BE_ARRAY_OF_USER_IDS, HTTP_STATUS.BAD_REQUEST)
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
              throw new ErrorWithStatus(TWEET_MESSAGES.MEDIAS_MUST_BE_ARRAY_OF_MEDIAS, HTTP_STATUS.BAD_REQUEST)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
// check privacy
// neu là circle thi kiem tra
// kiem tra tai khoan cua nguoi tao co bi khoa hay kh
export const checkPrivacyValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet
  if (!tweet) {
    throw new ErrorWithStatus(TWEET_MESSAGES.TWEET_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }
  if (tweet.audience === TweetAudience.TwitterCircle) {
    //author validate
    const author = await userService.getUserById(tweet.user_id.toString())
    if (!author || author?.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus(TWEET_MESSAGES.AUTHOR_HAS_BEEN_BANNED, HTTP_STATUS.BAD_REQUEST)
    }
    // kiem tra nguoi truy cap co nam trong vong hoac la tac gia hay kh
    const { userId } = (req.decode_access_token as TokenPayload) || {}

    if (!userId) {
      throw new ErrorWithStatus(TWEET_MESSAGES.TWEET_IS_NOT_PUBLIC, HTTP_STATUS.FORBIDDEN)
    }
    const isInTwitterCircle = author.twitter_circle.some((id: ObjectId) => id.equals(new ObjectId(userId)))
    if (!isInTwitterCircle && !new ObjectId(author._id).equals(new ObjectId(userId))) {
      throw new ErrorWithStatus(TWEET_MESSAGES.TWEET_IS_NOT_PUBLIC, HTTP_STATUS.FORBIDDEN)
    }
    next()
  }
  next()
})
export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      type: {
        optional: true,
        isIn: {
          options: [tweetType],
          errorMessage: TWEET_MESSAGES.TYPE_INVALID
        }
      }
    },
    ['query']
  )
)
export const paginationValidator = validate(
  checkSchema({
    page: {
      isNumeric: {
        errorMessage: POST_MESSAGES.VALUES_MUST_BE_NUMBER
      },
      custom: {
        options: async (value) => {
          if (value < 1) {
            throw new ErrorWithStatus(POST_MESSAGES.PAGE_MUST_BE_GREATER_THAN_ZERO, HTTP_STATUS.BAD_REQUEST)
          }
          return true
        }
      }
    },
    limit: {
      isNumeric: {
        errorMessage: POST_MESSAGES.VALUES_MUST_BE_NUMBER
      },
      custom: {
        options: async (value) => {
          if (value < 1 || value > 100) {
            throw new ErrorWithStatus(POST_MESSAGES.LIMIT_MUST_BE_BETWEEN_1_AND_100, HTTP_STATUS.BAD_REQUEST)
          }
          return true
        }
      }
    }
  })
)
