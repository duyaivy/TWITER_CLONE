import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { RegisterRequest } from '~/models/requests/User.request'
import { StringValue } from 'ms'
import { ObjectId } from 'mongodb'
import { omit } from 'lodash'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { POST_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/type'
import { sendRegisterEmailNodemailer } from '~/utils/email'

class UserService {
  private signAccessToken({
    userId,
    verify = UserVerifyStatus.Unverified
  }: {
    userId: string
    verify: UserVerifyStatus
  }) {
    return signToken({
      payload: {
        userId: userId,
        token_type: TokenType.AccessToken,
        verify: verify
      },
      options: {
        expiresIn: process.env.EXPIRES_TIME_ACCESS_TOKEN as StringValue,
        algorithm: 'HS256'
      }
    })
  }
  /**
   * Sign a refresh token with optional expiration time
   * @param userId - User ID to include in the token payload
   * @param exp - Optional expiration time for the token
   * @param verify - User verification status
   */
  private signRefreshToken({
    userId,
    exp,
    verify = UserVerifyStatus.Unverified
  }: {
    userId: string
    exp?: number
    verify: UserVerifyStatus
  }) {
    if (exp) {
      return signToken({
        payload: {
          userId: userId,
          token_type: TokenType.RefreshToken,
          verify: verify,
          exp: exp
        },
        options: {
          algorithm: 'HS256'
        }
      })
    }
    return signToken({
      payload: {
        userId: userId,
        token_type: TokenType.RefreshToken,
        verify: verify || UserVerifyStatus.Unverified
      },
      options: {
        expiresIn: process.env.EXPIRES_TIME_REFRESH_TOKEN as StringValue,
        algorithm: 'HS256'
      }
    })
  }
  private signEmailToken({
    userId,
    verify = UserVerifyStatus.Unverified
  }: {
    userId: string
    verify: UserVerifyStatus
  }) {
    return signToken({
      payload: {
        userId: userId,
        token_type: TokenType.EmailVerifyToken,
        verify: verify || UserVerifyStatus.Unverified
      },
      options: {
        expiresIn: process.env.EXPIRES_TIME_EMAIL_VERIFY_TOKEN as StringValue,
        algorithm: 'HS256'
      }
    })
  }

  getUserByEmail(email: string) {
    return databaseService.users.findOne({ email })
  }
  async login(user: User) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      userId: user._id?.toString() as string,
      verify: user.verify || UserVerifyStatus.Unverified
    })
    // Save refresh token to database
    const refreshToken = new RefreshToken({
      token: refresh_token as string,
      user_id: new ObjectId(user._id?.toString() as string),
      created_at: new Date()
    })
    await this.addRefreshTokenToDatabase(refreshToken)
    return {
      access_token,
      refresh_token,
      user: omit(user, 'password')
    }
  }
  async register(payload: RegisterRequest) {
    const user_id = new ObjectId()
    const emailToken = await this.signEmailToken({
      userId: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const user = new User({
      ...payload,
      _id: user_id,
      date_of_birth: new Date(payload.date_of_birth),
      password: hashPassword(payload.password),
      created_at: new Date(),
      updated_at: new Date(),
      email_verify_token: emailToken as string
    })
    // send email
    await sendRegisterEmailNodemailer(user.email, emailToken as string)
    // save user to database
    const result = await databaseService.users.insertOne(user)
    const userId = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      userId,
      verify: UserVerifyStatus.Unverified
    })
    // Save refresh token to database
    const refreshToken = new RefreshToken({
      token: refresh_token as string,
      user_id: new ObjectId(userId),
      created_at: new Date()
    })
    await this.addRefreshTokenToDatabase(refreshToken)

    return {
      access_token,
      refresh_token,
      user: omit(user, 'password')
    }
  }
  private signAccessAndRefreshToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ userId, verify }), this.signRefreshToken({ userId, verify })])
  }
  async logout(refreshToken: string) {
    const result = await this.removeRefreshTokenFromDatabase(refreshToken)
    if (!result.deletedCount) {
      throw new Error(POST_MESSAGES.INTERNAL_SERVER_ERROR)
    }
    return true
  }
  private addRefreshTokenToDatabase(refresh_token: RefreshToken) {
    return databaseService.refreshTokens.insertOne(refresh_token)
  }
  private removeRefreshTokenFromDatabase(refresh_token: string) {
    return databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }
  async refreshToken({ refresh_token, userId, verify, exp }: TokenPayload) {
    // xoa refresh token cũ, tao accesstoken moi tao rafesh token moi -> tra ve

    const [access_token, new_refresh_token, result] = await Promise.all([
      this.signAccessToken({ userId, verify }),
      this.signRefreshToken({ userId, verify, exp }),
      this.removeRefreshTokenFromDatabase(refresh_token)
    ])
    if (!result.deletedCount) {
      throw new Error(POST_MESSAGES.INTERNAL_SERVER_ERROR)
    }
    await this.addRefreshTokenToDatabase(
      new RefreshToken({
        token: new_refresh_token as string,
        user_id: new ObjectId(userId),
        created_at: new Date()
      })
    )
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }
  async verifyEmail({ userId }: { userId: string }) {
    const result = await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          verify: UserVerifyStatus.Verified,
          email_verify_token: '',
          updated_at: new Date()
        }
      }
    )
    if (!result.modifiedCount) {
      throw new Error(POST_MESSAGES.INTERNAL_SERVER_ERROR)
    }
    return true
  }
}
const userService = new UserService()
export default userService
