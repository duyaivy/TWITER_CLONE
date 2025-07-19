import { Collection, Db, MongoClient } from 'mongodb'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import ENV from '~/constants/config'
import Follower from '~/models/schemas/Follower.schema'

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@duyedu.23c9stb.mongodb.net/?retryWrites=true&w=majority&appName=duyEdu`

class DBService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(ENV.DB_NAME)
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('error', error)
      throw error
    }
  }
  get users(): Collection<User> {
    return this.db.collection(ENV.DB_USER_COLLECTION)
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(ENV.DB_REFRESH_TOKEN_COLLECTION)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(ENV.DB_FOLLOWER_COLLECTION)
  }
}

const databaseService = new DBService()
export default databaseService
