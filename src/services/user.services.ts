import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import { RegisterRequest } from '~/models/requests/User.request'
import { StringValue } from 'ms'

class UserService {
  private signAccessToken(userId: string) {
    return signToken({
      payload: {
        userId: userId,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: process.env.EXPIRES_TIME_ACCESS_TOKEN as StringValue,
        algorithm: 'HS256'
      }
    })
  }
  private signRefreshToken(userId: string) {
    return signToken({
      payload: {
        userId: userId,
        token_type: TokenType.RefreshToken
      },
      options: {
        expiresIn: process.env.EXPIRES_TIME_REFRESH_TOKEN as StringValue,
        algorithm: 'HS256'
      }
    })
  }
  async register(payload: RegisterRequest) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        created_at: new Date(),
        updated_at: new Date()
      })
    )

    const userId = result.insertedId.toString()
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(userId),
      this.signRefreshToken(userId)
    ])
    return {
      access_token,
      refresh_token
    }
  }
  async isEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return !!user
  }
}
const userService = new UserService()
export default userService
