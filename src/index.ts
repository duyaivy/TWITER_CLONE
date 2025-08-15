import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import cors from 'cors'
import { initialUploadFolder } from './utils/file'
import ENV from './constants/config'
import mediasRouter from './routes/medias.routes'
import tweetsRouter from './routes/tweets.routes'
import bookmarkRouter from './routes/bookmarks.routes'
import searchRouter from './routes/searchs.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { ObjectId } from 'mongodb'
import conversationRouter from './routes/conversations.route'
import Conversations from './models/schemas/Conservations.schema'
const app = express()
const port = ENV.SERVER_PORT

initialUploadFolder()
app.get('/', (req, res) => {
  res.send('cmm')
})
app.use(express.json())
databaseService.connect().then(() => {
  Promise.all([
    databaseService.indexUser(),
    databaseService.indexFollowers(),
    databaseService.indexRefreshTokens(),
    databaseService.indexTweets()
  ])
})

app.use(cors())

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmarks', bookmarkRouter)
app.use('/searchs', searchRouter)
app.use('/conversations', conversationRouter)

// handle errors globally
app.use(defaultErrorHandler)

// web socket
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

const users: {
  [key: string]: {
    socket_id: string
  }
} = {}
httpServer.listen(port, () => {
  console.log(`Server websocket is running on port ${port}`)
  io.on('connection', (socket) => {
    const user_id = socket.handshake.auth._id
    users[user_id] = {
      socket_id: socket.id
    }
    console.log(`User connected: ${user_id}`)

    socket.on('private chat', async (data) => {
      const { receiver_id, message, sender_id } = data
      const receiver = users[receiver_id]
      // 6884558e8b35df094e1c8440 687a0cf65349b52287d3c1e8

      if (receiver) {
        const conversation = new Conversations({
          sender_id: new ObjectId(sender_id),
          receiver_id: new ObjectId(receiver_id),
          message
        })
        await databaseService.conversations.insertOne(conversation)

        socket.to(receiver.socket_id).emit('receive chat', {
          sender_id,
          message,
          receiver_id
        })
      }
    })

    socket.on('disconnect', () => {
      console.log('user disconnected')
      delete users[user_id]
    })
  })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
