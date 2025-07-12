import express from 'express'
import usersRouter from './routes/users.routers'
import databaseService from './services/database.services'
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('cmm')
})

app.use(express.json())
databaseService.connect()

app.use('/users', usersRouter)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
