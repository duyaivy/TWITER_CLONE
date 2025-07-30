import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEET_MESSAGES } from '~/constants/messages'
import { BookmarkRequest } from '~/models/requests/Bookmark.request'
import bookmarkService from '~/services/bookmark.services'

export const createBookmarkController = async (req: Request<ParamsDictionary, any, BookmarkRequest>, res: Response) => {
  const userId = req.decode_access_token?.userId
  const result = await bookmarkService.createBookmark(userId as string, req.body.tweet_id)
  return res.json({
    message: TWEET_MESSAGES.CREATE_NEW_BOOKMARK_SUCCESS,
    data: result
  })
}
export const unBookmarkController = async (req: Request<ParamsDictionary, any, BookmarkRequest>, res: Response) => {
  const userId = req.decode_access_token?.userId
  await bookmarkService.unBookmark(userId as string, req.body.tweet_id)
  return res.json({
    message: TWEET_MESSAGES.UN_BOOKMARK_SUCCESS
  })
}
