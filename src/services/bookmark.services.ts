import BookmarkOrLike from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'

class BookmarkService {
  async createBookmark(userId: string, tweetId: string) {
    const newBookmark = new BookmarkOrLike({
      user_id: userId,
      tweet_id: tweetId
    })
    const { insertedId } = await databaseService.bookmarks.insertOne(newBookmark)
    return await databaseService.bookmarks.findOne({ _id: insertedId })
  }
  async unBookmark(userId: string, tweetId: string) {
    await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(userId),
      tweet_id: new ObjectId(tweetId)
    })
  }

  async getBookmarksByUserId(userId: string) {
    return databaseService.bookmarks.find({ user_id: new ObjectId(userId) }).toArray()
  }
}
const bookmarkService = new BookmarkService()
export default bookmarkService
