import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controller'
import { createTweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, userVerifyValidator } from '~/middlewares/users.middlewares'
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
export default tweetsRouter
