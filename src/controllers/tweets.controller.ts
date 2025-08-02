import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enum'
import { TWEET_MESSAGES } from '~/constants/messages'
import { TweetParams, TweetQuery, TweetRequest } from '~/models/requests/Tweet.request'
import Tweet from '~/models/schemas/Tweet.schema'
import tweetService from '~/services/tweet.services'
import { TokenPayload } from '~/type'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequest>, res: Response) => {
  const userId = req.decode_access_token?.userId
  const result = await tweetService.createTweet(userId as string, req.body as TweetRequest)
  return res.json({
    message: TWEET_MESSAGES.CREATE_NEW_TWEET_SUCCESS,
    data: result
  })
}
export const getTweetController = async (req: Request<TweetParams, any, TweetRequest>, res: Response) => {
  const tweet = req.tweet as Tweet
  const { user_id } = (req.decode_access_token as TokenPayload) || {}
  const resultView = await tweetService.increaseView(tweet._id as ObjectId, user_id)

  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESS,
    data: {
      ...tweet,
      guest_views: resultView?.guest_views,
      user_views: resultView?.user_views,
      update_at: resultView?.updated_at
    }
  })
}
export const likeTweetController = async (req: Request<TweetParams>, res: Response) => {
  const tweetId = req.params.tweet_id
  const userId = req.decode_access_token?.userId
  const result = await tweetService.likeTweet(tweetId, userId as string)
  return res.json({
    message: TWEET_MESSAGES.LIKE_TWEET_SUCCESS,
    data: result
  })
}
export const unlikeTweetController = async (req: Request<TweetParams>, res: Response) => {
  const tweetId = req.params.tweet_id
  const userId = req.decode_access_token?.userId
  await tweetService.unLike(tweetId, userId as string)
  return res.json({
    message: TWEET_MESSAGES.UNLIKE_TWEET_SUCCESS
  })
}
export const getTweetChildrenController = async (req: Request<TweetParams, any, any, TweetQuery>, res: Response) => {
  const type = (Number(req.query.type) as TweetType) || undefined
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const tweetId = req.params.tweet_id
  const { userId } = (req.decode_access_token as TokenPayload) || {}

  const data = await tweetService.getTweetChildren({
    tweetId,
    userId,
    type,
    limit,
    page
  })
  return res.json({
    message: TWEET_MESSAGES.UNLIKE_TWEET_SUCCESS,
    data
  })
}
