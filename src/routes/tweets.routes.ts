import { Router } from 'express'
import {
  createTweetController,
  getNewFeedController,
  getTweetChildrenController,
  getTweetController,
  likeTweetController,
  unlikeTweetController
} from '~/controllers/tweets.controller'
import { tweetIdValidator } from '~/middlewares/bookmarks.middlewares'
import {
  checkPrivacyValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator
} from '~/middlewares/tweets.middlewares'
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

/* path: tweets/:tweet_id/childrens
 * Method: GET
 * authorization:? Bearer <token>
 * query: { page, limit, type}
 * Description: get tweet childrens
 */

tweetsRouter.get(
  '/:tweet_id/childrens',
  tweetIdValidator,
  getTweetChildrenValidator,
  paginationValidator,
  isLoggedInValidator(accessTokenValidator),
  isLoggedInValidator(userVerifyValidator),
  wrapRequestHandler(getTweetChildrenController)
)

/* path: tweets/likes
 * Method: POST
 * authorization: Bearer <token>
 * Description: like a tweet
 */

tweetsRouter.post(
  '/:tweet_id/likes',
  tweetIdValidator,
  accessTokenValidator,
  userVerifyValidator,
  wrapRequestHandler(likeTweetController)
)
/* path: tweets/:tweet_id/likes
 * Method: DELETE
 * authorization: Bearer <token>
 * Description: unlike a tweet
 */

tweetsRouter.delete(
  '/:tweet_id/likes',
  tweetIdValidator,
  accessTokenValidator,
  userVerifyValidator,
  wrapRequestHandler(unlikeTweetController)
)
/* path: tweets
 * Method: GET
 * authorization: Bearer <token>
 * Description: Get new feeds
 * query: { page, limit }
 */
tweetsRouter.get(
  '/',
  paginationValidator,
  isLoggedInValidator(accessTokenValidator),
  isLoggedInValidator(userVerifyValidator),
  wrapRequestHandler(getNewFeedController)
)

export default tweetsRouter
