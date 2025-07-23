import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'

import { initialUploadFolder } from './utils/file'
import ENV from './constants/config'
import mediasRouter from './routes/medias.routes'
import { PATH_UPLOAD } from './constants/URL'
const app = express()
const port = ENV.SERVER_PORT

initialUploadFolder()
app.get('/', (req, res) => {
  res.send('cmm')
})
app.use(express.json())
databaseService.connect()

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
// get static file
app.use('/static', express.static(PATH_UPLOAD))
// handle errors globally
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
