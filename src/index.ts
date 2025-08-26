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
import conversationRouter from './routes/conversations.route'
import { initSocket } from './services/socket.services'
import authRouter from './routes/auths.routes'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import YAML from 'yaml'

const file = fs.readFileSync('./swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)

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
app.use('/auth', authRouter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
// handle errors globally
app.use(defaultErrorHandler)
// web socket
const httpServer = createServer(app)
initSocket(httpServer, port)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
