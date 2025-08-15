import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { ConversationParams } from '~/models/requests/Conversation.request'

interface GetConversationParams extends ConversationParams {
  userId?: string
}
class ConversationService {
  async getConversation({ receiver_id, userId, limit, last_updated_at, last_message_id }: GetConversationParams) {
    const receiverId = new ObjectId(receiver_id)
    const userIdObj = new ObjectId(userId)
    const last_updated_atDate = new Date(last_updated_at as string)
    const cursorFilter =
      last_updated_at && last_message_id
        ? [
            {
              sender_id: userIdObj,
              receiver_id: receiverId,
              $or: [
                { updated_at: { $lt: last_updated_atDate } },
                { updated_at: last_updated_atDate, _id: { $lt: new ObjectId(last_message_id) } }
              ]
            },
            {
              sender_id: receiverId,
              receiver_id: userIdObj,
              $or: [
                { updated_at: { $lt: last_updated_atDate } },
                { updated_at: last_updated_atDate, _id: { $lt: new ObjectId(last_message_id) } }
              ]
            }
          ]
        : [
            {
              sender_id: userIdObj,
              receiver_id: receiverId
            },
            {
              sender_id: receiverId,
              receiver_id: userIdObj
            }
          ]

    const conversations = await databaseService.conversations
      .find({ $or: cursorFilter })
      .sort({ updated_at: -1, _id: -1 })
      .limit(limit)
      .toArray()

    const returnConversations = conversations.reverse()
    const cursor =
      conversations.length > 0
        ? {
            last_updated_at: conversations[0].updated_at,
            last_message_id: conversations[0]._id.toString()
          }
        : null
    return {
      cursor,
      data: returnConversations
    }
  }
}

const conversationService = new ConversationService()
export default conversationService
