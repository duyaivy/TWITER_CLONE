import { Request, Response } from 'express'
import { DEFAULT_VALUE } from '~/constants/config'
import { CONVERSATION_MESSAGE } from '~/constants/messages'
import { ConversationParams } from '~/models/requests/Conversation.request'
import conversationService from '~/services/conversation.services'

export const getConversationController = async (req: Request<any, any, any, ConversationParams>, res: Response) => {
  const userId = req.decode_access_token?.userId
  const receiver_id = req.params.receiver_id
  const limit = Number(req.query.limit) || DEFAULT_VALUE.LIMIT
  const last_updated_at = req.query.last_updated_at as string
  const last_message_id = req.query.last_message_id as string
  const result = await conversationService.getConversation({
    userId,
    receiver_id,
    limit,
    last_updated_at,
    last_message_id
  })
  return res.json({
    message: CONVERSATION_MESSAGE.GET_CONVERSATION_SUCCESS,
    data: result
  })
}
