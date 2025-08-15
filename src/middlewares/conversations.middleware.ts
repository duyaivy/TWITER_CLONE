import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const getConversationValidator = validate(
  checkSchema(
    {
      last_updated_at: {
        optional: true,
        trim: true,
        custom: {
          options: (value) => {
            const date = new Date(value)
            if (isNaN(date.getTime())) {
              throw new ErrorWithStatus(USER_MESSAGES.INVALID_DATE, HTTP_STATUS.BAD_REQUEST)
            }
            return true
          }
        }
      },
      last_message_id: {
        optional: true,
        trim: true,
        custom: {
          options: (value) => {
            const isMongoId =
              ObjectId.isValid(value) && databaseService.conversations.findOne({ _id: new ObjectId(value) })
            if (!isMongoId) {
              throw new ErrorWithStatus(USER_MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)
