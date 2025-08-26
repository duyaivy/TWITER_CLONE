import { Server } from 'socket.io'
import { ObjectId } from 'mongodb'
import Conversations from '~/models/schemas/Conservations.schema'
import databaseService from './database.services'
import { verifyAccessTokenMiddleware } from '~/middlewares/common.middleware'
import { UserVerifyStatus } from '~/constants/enum'
import { POST_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { TokenPayload } from '~/type'
import ENV from '~/constants/config'

export const initSocket = (httpServer: any, port: string) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ENV.HOST
    }
  })

  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}
  httpServer.listen(port, () => {
    console.log(`Server websocket is running on port ${port}`)
    io.use(async (socket, next) => {
      try {
        const authorization = socket.handshake.auth.authorization as string
        const decode_access_token = await verifyAccessTokenMiddleware(authorization, next)
        const { verify } = decode_access_token as TokenPayload
        if (verify === UserVerifyStatus.Banned || verify === UserVerifyStatus.Unverified) {
          throw new ErrorWithStatus(POST_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
        }
        socket.handshake.auth.decode_access_token = decode_access_token
        next()
      } catch (error: any) {
        next({
          message: POST_MESSAGES.UNAUTHORIZED,
          name: 'UnauthorizedError',
          data: error
        })
      }
    })

    io.on('connection', (socket) => {
      const user_id = socket.handshake.auth.decode_access_token.userId
      users[user_id] = {
        socket_id: socket.id
      }
      console.log(`User connected: ${user_id}`)
      // middleware tren moi lan goi den socket
      socket.use((packet, next) => {
        console.log('packet', packet)
        next()
      })

      socket.on('private chat', async (data) => {
        const { receiver_id, message, sender_id, updated_at, created_at } = data
        const receiver = users[receiver_id]
        // 6884558e8b35df094e1c8440 687a0cf65349b52287d3c1e8
        if (receiver) {
          const conversation = new Conversations({
            sender_id: new ObjectId(sender_id),
            receiver_id: new ObjectId(receiver_id),
            message,
            updated_at,
            created_at
          })
          await databaseService.conversations.insertOne(conversation)
          socket.to(receiver.socket_id).emit('receive chat', conversation)
        }
      })
      socket.on('error', (err) => {
        if (err && err.message === POST_MESSAGES.UNAUTHORIZED) {
          socket.disconnect()
        }
      })
      socket.on('disconnect', () => {
        console.log('user disconnected')
        delete users[user_id]
      })
    })
  })
}
