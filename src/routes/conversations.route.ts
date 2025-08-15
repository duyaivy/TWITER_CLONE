import { Router } from 'express'
import { getConversationController } from '~/controllers/conversations.controller'
import { getConversationValidator } from '~/middlewares/conversations.middleware'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, userVerifyValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const conversationRouter = Router()

/* path: conversations/receives/:receiver_id?page=1&limit=10
 * Method: GET
 * authorization: Bearer <token>
 * Description: GET conversations by receiver_id, pagination
 */
conversationRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  userVerifyValidator,
  paginationValidator,
  getConversationValidator,
  wrapRequestHandler(getConversationController)
)

export default conversationRouter
