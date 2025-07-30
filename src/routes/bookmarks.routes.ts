import { Router } from 'express'
import { createBookmarkController, unBookmarkController } from '~/controllers/bookmarks.controller'
import { bookmarkValidator } from '~/middlewares/bookmarks.middlewares'
import { accessTokenValidator, userVerifyValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const bookmarkRouter = Router()

/* path: bookmark
 * Method: POST
 * authorization: Bearer <token>
 * Description: Create a new bookmark
 * payload: BookmarkRequest
 */
bookmarkRouter.post(
  '/',
  accessTokenValidator,
  userVerifyValidator,
  bookmarkValidator,
  wrapRequestHandler(createBookmarkController)
)
/* path: bookmarks/un-bookmark
 * Method: DELETE
 * authorization: Bearer <token>
 * Description: un-bookmark a tweet
 * payload: BookmarkRequest
 */
bookmarkRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  userVerifyValidator,
  bookmarkValidator,
  wrapRequestHandler(unBookmarkController)
)
export default bookmarkRouter
