import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweets.controller'
import { tweetIdValidator } from '~/middlewares/bookmarks.middlewares'
import { checkPrivacyValidator, createTweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isLoggedInValidator, userVerifyValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const tweetsRouter = Router()

/* path: tweets/create
 * Method: POST
 * authorization: Bearer <token>
 * Description: Create a new tweet
 * payload: TweetRequest
 */
tweetsRouter.post(
  '/',
  accessTokenValidator,
  userVerifyValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

/* path: tweets/:tweet_id
 * Method: GET
 * authorization:? Bearer <token>
 * Description: get tweet detail
 */

tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isLoggedInValidator(accessTokenValidator),
  isLoggedInValidator(userVerifyValidator),
  checkPrivacyValidator,
  wrapRequestHandler(getTweetController)
)
export default tweetsRouter
