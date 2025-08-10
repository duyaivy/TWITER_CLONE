import { Router } from 'express'
import { searchAdvancedController, searchHashtagsController } from '~/controllers/searchs.controller'
import { paginationValidator, searchTweetsValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isLoggedInValidator, userVerifyValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const searchRouter = Router()

/* path: searchs
 * Method: Get
 * Description: search advanced
 * params: {limit: number, page: number, content: string}
 */
searchRouter.get(
  '/',
  paginationValidator,
  searchTweetsValidator,
  isLoggedInValidator(accessTokenValidator),
  isLoggedInValidator(userVerifyValidator),
  wrapRequestHandler(searchAdvancedController)
)

/* path: searchs/hashtags
 * Method: Get
 * Description: search by hashtags
 * params: {limit: number, page: number, hashtag: string}
 */
searchRouter.get('/hashtags', paginationValidator, wrapRequestHandler(searchHashtagsController))

export default searchRouter
