import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('cmm')
})

app.use(express.json())
databaseService.connect()
app.use('/users', usersRouter)
// handle errors globally
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
