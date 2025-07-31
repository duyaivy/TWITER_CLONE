import { JwtPayload } from 'jsonwebtoken'
import User from './models/schemas/User.schema'
import { TokenType, UserVerifyStatus } from './constants/enum'
import Tweet from './models/schemas/Tweet.schema'

interface TokenPayload extends JwtPayload {
  userId: string
  token_type: TokenType
  verify: UserVerifyStatus
}
declare global {
  namespace Express {
    interface Request {
      user?: User
      decode_access_token?: TokenPayload
      decode_refresh_token?: TokenPayload
      decode_email_token?: TokenPayload
      tweet?: Tweet
    }
  }
}
