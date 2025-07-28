import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import cors from 'cors'
import { initialUploadFolder } from './utils/file'
import ENV from './constants/config'
import mediasRouter from './routes/medias.routes'

const app = express()
const port = ENV.SERVER_PORT

initialUploadFolder()
app.get('/', (req, res) => {
  res.send('cmm')
})
app.use(express.json())
databaseService.connect().then(() => {
  Promise.all([databaseService.indexUser(), databaseService.indexFollowers(), databaseService.indexRefreshTokens()])
})

app.use(cors())

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)

// handle errors globally
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
