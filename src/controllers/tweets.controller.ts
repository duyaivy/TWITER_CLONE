import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEET_MESSAGES } from '~/constants/messages'
import { TweetRequest } from '~/models/requests/Tweet.request'
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
  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESS
  })
}
