import { Collection, Db, MongoClient } from 'mongodb'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import ENV from '~/constants/config'
import Follower from '~/models/schemas/Follower.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import BookmarkOrLike from '~/models/schemas/Bookmark.schema'
import Conservation from '~/models/schemas/Conservations.schema'
import Conversations from '~/models/schemas/Conservations.schema'

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
  async indexUser() {
    try {
      const existIndex = await this.users.indexExists(['email_1', 'email_1_password_1', 'username_1'])
      if (existIndex) {
        console.log('User indexes already exist')
      } else {
        await Promise.all([
          this.users.createIndex({ email: 1, password: 1 }, { unique: true }),
          this.users.createIndex({ email: 1 }, { unique: true }),
          this.users.createIndex({ username: 1 }, { unique: true })
        ])
        console.log('User indexes created successfully')
      }
    } catch (error) {
      console.log('Error creating user indexes:', error)
    }
  }
  async indexTweets() {
    try {
      const existIndex = await this.tweets.indexExists(['content_text'])
      if (existIndex) {
        console.log('Tweet indexes already exist')
      } else {
        await Promise.all([this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })])
        console.log('Tweet indexes created successfully')
      }
    } catch (error) {
      console.log('Error creating tweet indexes:', error)
    }
  }
  async indexRefreshTokens() {
    try {
      const existIndex = await this.refreshTokens.indexExists(['token_1', 'exp_1'])
      if (existIndex) {
        console.log('Refresh token indexes already exist')
      } else {
        await Promise.all([
          this.refreshTokens.createIndex({ token: 1 }, { unique: true }),
          this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
        ])
        console.log('Refresh token indexes created successfully')
      }
    } catch (error) {
      console.log('Error creating refresh token indexes:', error)
    }
  }
  async indexFollowers() {
    try {
      const existIndex = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
      if (existIndex) {
        console.log('Follower indexes already exist')
      } else {
        await this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
        console.log('Follower indexes created successfully')
      }
    } catch (error) {
      console.log('Error creating follower indexes:', error)
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
  get videoStatuses(): Collection<VideoStatus> {
    return this.db.collection(ENV.DB_VIDEO_STATUS_COLLECTION)
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection(ENV.DB_TWEET_COLLECTION)
  }
  get hashtags(): Collection<Hashtag> {
    return this.db.collection(ENV.DB_HASHTAG_COLLECTION)
  }
  get bookmarks(): Collection<BookmarkOrLike> {
    return this.db.collection(ENV.DB_BOOKMARK_COLLECTION)
  }
  get likes(): Collection<BookmarkOrLike> {
    return this.db.collection(ENV.DB_LIKE_COLLECTION)
  }
  get conversations(): Collection<Conversations> {
    return this.db.collection(ENV.DB_CONVERSATION_COLLECTION)
  }
}

const databaseService = new DBService()
export default databaseService
