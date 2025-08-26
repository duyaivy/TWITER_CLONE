import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash'
import { ExtendedError } from 'socket.io'
import ENV from '~/constants/config'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { POST_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import { verifyToken } from '~/utils/jwt'
type FilterKey<T> = Array<keyof T>
export const filterMiddlewares =
  <T>(filterKey: FilterKey<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKey)
    next()
  }
export const verifyAccessTokenMiddleware = async (accessToken: string, next: (error: ExtendedError) => void) => {
  if (accessToken) {
    const access_token = accessToken.split(' ')[1]

    try {
      const accessTokenPayload = await verifyToken({
        token: access_token,
        secretOrPublicKey: ENV.ACCESS_TOKEN_PRIVATE_KEY
      })
      return accessTokenPayload
    } catch (error) {
      next({
        message: POST_MESSAGES.UNAUTHORIZED,
        name: 'UnauthorizedError',
        data: {
          message: 'Unauthorized',
          status: HTTP_STATUS.UNAUTHORIZED
        }
      })
    }
  } else {
    next({
      message: POST_MESSAGES.UNAUTHORIZED,
      name: 'UnauthorizedError',
      data: {
        message: 'Unauthorized',
        status: HTTP_STATUS.UNAUTHORIZED
      }
    })
  }
}
