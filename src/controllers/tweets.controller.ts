import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEET_MESSAGES } from '~/constants/messages'
import { TweetRequest } from '~/models/requests/Tweet.request'
import Tweet from '~/models/schemas/Tweet.schema'
import tweetService from '~/services/tweet.services'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequest>, res: Response) => {
  const userId = req.decode_access_token?.userId
  const result = await tweetService.createTweet(userId as string, req.body as TweetRequest)
  return res.json({
    message: TWEET_MESSAGES.CREATE_NEW_TWEET_SUCCESS,
    data: result
  })
}
export const getTweetController = (req: Request<ParamsDictionary, any, TweetRequest>, res: Response) => {
  const tweet = req.tweet as Tweet
  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESS,
    data: tweet
  })
}
export const likeTweetController = async (req: Request<ParamsDictionary>, res: Response) => {
  const tweetId = req.params.tweet_id
  const userId = req.decode_access_token?.userId
  const result = await tweetService.likeTweet(tweetId, userId as string)
  return res.json({
    message: TWEET_MESSAGES.LIKE_TWEET_SUCCESS,
    data: result
  })
}
export const unlikeTweetController = async (req: Request<ParamsDictionary>, res: Response) => {
  const tweetId = req.params.tweet_id
  const userId = req.decode_access_token?.userId
  await tweetService.unLike(tweetId, userId as string)
  return res.json({
    message: TWEET_MESSAGES.UNLIKE_TWEET_SUCCESS
  })
}
