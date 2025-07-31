import { checkSchema } from 'express-validator'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { TWEET_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import tweetService from '~/services/tweet.services'
import { validate } from '~/utils/validation'

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        isMongoId: {
          errorMessage: TWEET_MESSAGES.INVALID_TWEET_ID
        },
        isString: {
          errorMessage: TWEET_MESSAGES.TWEET_ID_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            const valueDb = await tweetService.getTweetById(value)
            if (!valueDb) {
              throw new ErrorWithStatus(TWEET_MESSAGES.TWEET_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
            }
            req.tweet = valueDb
            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)
