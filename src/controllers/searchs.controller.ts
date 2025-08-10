import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { DEFAULT_VALUE } from '~/constants/config'
import { SEARCH_MESSAGE } from '~/constants/messages'
import { HashtagQuery, SearchQuery } from '~/models/requests/Search.request'
import searchService from '~/services/search.services'
import { TokenPayload } from '~/type'

export const searchAdvancedController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response
) => {
  const content = decodeURIComponent(req.query.content || '')
  const limit = Number(req.query.limit) || DEFAULT_VALUE.LIMIT
  const page = Number(req.query.page) || DEFAULT_VALUE.PAGE
  const media_type = req.query.media_type
  const people_follow = req.query.people_follow === 'true' ? true : false
  const { userId } = (req.decode_access_token as TokenPayload) || {}

  const result = await searchService.searchTweets({ content, limit, page, media_type, people_follow, userId })
  return res.json({
    message: SEARCH_MESSAGE.SEARCH_SUCCESS,
    data: result
  })
}
export const searchHashtagsController = async (
  req: Request<ParamsDictionary, any, any, HashtagQuery>,
  res: Response
) => {
  const hashtag = decodeURIComponent(req.query.hashtag || '')
  const limit = Number(req.query.limit) || DEFAULT_VALUE.LIMIT
  const page = Number(req.query.page) || DEFAULT_VALUE.PAGE

  const result = await searchService.searchTweetsByHashtag({ hashtag, limit, page })
  return res.json({
    message: SEARCH_MESSAGE.SEARCH_SUCCESS,
    data: result
  })
}
