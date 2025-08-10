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
// handle errors globally
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
