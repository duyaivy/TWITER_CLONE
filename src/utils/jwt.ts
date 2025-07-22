import { JwtPayload, SignOptions, sign, verify } from 'jsonwebtoken'
import ENV from '~/constants/config'
import { HTTP_STATUS } from '~/constants/httpStatus'
import _ from 'lodash'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/type'
interface SignTokenPayload {
  payload: TokenPayload
  privateKey?: string
  options: SignOptions
}

export const signToken = ({ payload, privateKey = ENV.JWT_PRIVATE_KEY, options }: SignTokenPayload) => {
  return new Promise((resolve, reject) => {
    sign(payload, privateKey, options, (error, token) => {
      if (error) reject(error)
      resolve(token)
    })
  })
}

export const verifyToken = ({
  token,
  secretOrPublicKey = ENV.JWT_PRIVATE_KEY
}: {
  token: string
  secretOrPublicKey?: string
}) => {
  return new Promise<JwtPayload>((resolve, reject) => {
    verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) reject(new ErrorWithStatus(_.capitalize(error.message), HTTP_STATUS.UNAUTHORIZED))
      resolve(decoded as JwtPayload)
    })
  })
}
