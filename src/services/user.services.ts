import User, { UserProfileResponse } from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { RegisterRequest, UpdateMeRequest } from '~/models/requests/User.request'
import { StringValue } from 'ms'
import { ObjectId } from 'mongodb'
import { omit } from 'lodash'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { POST_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/type'
import { sendForgotPasswordNodemailer, sendRegisterEmailNodemailer } from '~/utils/email'
import ENV from '~/constants/config'
import Follower from '~/models/schemas/Follower.schema'
import { ErrorWithStatus } from '~/models/Errors'
import { HTTP_STATUS } from '~/constants/httpStatus'
import axios from 'axios'
import { randomPassword, randomUsername } from '~/utils/random'

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
      },
      privateKey: ENV.ACCESS_TOKEN_PRIVATE_KEY
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
        },
        privateKey: ENV.REFRESH_TOKEN_PRIVATE_KEY
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
      },
      privateKey: ENV.REFRESH_TOKEN_PRIVATE_KEY
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
      },
      privateKey: ENV.SEND_EMAIL_PRIVATE_KEY
    })
  }
  private signForgotPasswordToken({
    userId,
    verify = UserVerifyStatus.Unverified
  }: {
    userId: string
    verify: UserVerifyStatus
  }) {
    return signToken({
      payload: {
        userId: userId,
        token_type: TokenType.ForgotPasswordToken,
        verify: verify || UserVerifyStatus.Unverified
      },
      options: {
        expiresIn: process.env.EXPIRES_TIME_EMAIL_VERIFY_TOKEN as StringValue,
        algorithm: 'HS256'
      },
      privateKey: ENV.FORGOT_PASSWORD_PRIVATE_KEY
    })
  }
  getUserByEmail(email: string) {
    return databaseService.users.findOne({ email })
  }
  getUserById(userId: string) {
    return databaseService.users.findOne({ _id: new ObjectId(userId) })
  }
  async login(user: User) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      userId: user._id?.toString() as string,
      verify: user.verify || UserVerifyStatus.Unverified
    })
    // Save refresh token to database
    const { iat, exp } = await verifyToken({
      token: refresh_token as string,
      secretOrPublicKey: ENV.REFRESH_TOKEN_PRIVATE_KEY
    })
    const refreshToken = new RefreshToken({
      token: refresh_token as string,
      user_id: new ObjectId(user._id?.toString() as string),
      created_at: new Date(),
      iat: new Date((iat as number) * 1000),
      exp: new Date((exp as number) * 1000)
    })
    await this.addRefreshTokenToDatabase(refreshToken)
    return {
      access_token,
      refresh_token,
      user: omit(user, 'password', 'email_verify_token', 'forgot_password_token')
    }
  }
  // register
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
      username: randomUsername(payload.name),
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
    const { iat, exp } = await verifyToken({
      token: refresh_token as string,
      secretOrPublicKey: ENV.REFRESH_TOKEN_PRIVATE_KEY
    })
    const refreshToken = new RefreshToken({
      token: refresh_token as string,
      user_id: new ObjectId(user._id?.toString() as string),
      created_at: new Date(),
      iat: new Date((iat as number) * 1000),
      exp: new Date((exp as number) * 1000)
    })
    await this.addRefreshTokenToDatabase(refreshToken)

    return {
      access_token,
      refresh_token,
      user: omit(user, 'password', 'email_verify_token', 'forgot_password_token')
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

  async refreshToken({ refresh_token, userId, verify, exp, iat }: TokenPayload) {
    // xoa refresh token cũ, tao accesstoken moi tao rafesh token moi -> tra ve
    const [access_token, new_refresh_token, result] = await Promise.all([
      this.signAccessToken({ userId, verify }),
      this.signRefreshToken({ userId, verify, exp }),
      this.removeRefreshTokenFromDatabase(refresh_token)
    ])
    if (!result.deletedCount) {
      throw new Error(POST_MESSAGES.INTERNAL_SERVER_ERROR)
    }

    const refreshToken = new RefreshToken({
      token: new_refresh_token as string,
      user_id: new ObjectId(userId),
      created_at: new Date(),
      iat: new Date((iat as number) * 1000),
      exp: new Date((exp as number) * 1000)
    })
    await this.addRefreshTokenToDatabase(refreshToken)
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }
  async verifyEmail(userId: string) {
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
  async resendEmailVerify(email: string, user: User) {
    const emailToken = await this.signEmailToken({
      userId: user?._id?.toString() as string,
      verify: UserVerifyStatus.Unverified
    })

    // send email
    await sendRegisterEmailNodemailer(email, emailToken as string)
    // cap nhat token
    await databaseService.users.updateOne(
      { _id: user?._id },
      {
        $set: {
          email_verify_token: emailToken as string,
          updated_at: new Date()
        }
      }
    )
  }
  async forgotPassword(email: string, user: User) {
    const forgotPasswordToken = await this.signForgotPasswordToken({
      userId: user?._id?.toString() as string,
      verify: user?.verify as UserVerifyStatus
    })

    // send email
    await sendForgotPasswordNodemailer(email, forgotPasswordToken as string)
    // cap nhat token
    await databaseService.users.updateOne(
      { _id: user?._id },
      {
        $set: {
          forgot_password_token: forgotPasswordToken as string,
          updated_at: new Date()
        }
      }
    )
  }
  async resetPassword(password: string, user: User) {
    const hashedPassword = hashPassword(password)
    const result = await databaseService.users.updateOne(
      { _id: user?._id },
      {
        $set: {
          password: hashedPassword,
          forgot_password_token: '',
          updated_at: new Date()
        }
      }
    )
    if (!result.modifiedCount) {
      throw new Error(POST_MESSAGES.INTERNAL_SERVER_ERROR)
    }
    return true
  }
  getMe = (userId: string) => {
    return databaseService.users.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
  }
  async updateMe(userId: string, userUpdate: UpdateMeRequest) {
    const _payload = userUpdate.date_of_birth
      ? {
          ...userUpdate,
          date_of_birth: new Date(userUpdate.date_of_birth)
        }
      : userUpdate
    const result = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...(_payload as UpdateMeRequest & { date_of_birth?: Date }),
          updated_at: new Date()
        }
      },
      { returnDocument: 'after', projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )
    return result
  }
  async changePassword(userId: string, password: string) {
    const hashedPassword = hashPassword(password)
    const result = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updated_at: new Date()
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!result) {
      throw new ErrorWithStatus(POST_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
    return result
  }
  async followUser(followed_user_id: string, user_id: string) {
    const followerData = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (followerData == null) {
      const follower = new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id),
        created_at: new Date()
      })
      const result = await databaseService.followers.insertOne(follower)
      if (!result.acknowledged) {
        throw new ErrorWithStatus(POST_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR)
      }
      return {
        message: POST_MESSAGES.FOLLOW_USER_SUCCESS
      }
    } else {
      return {
        message: POST_MESSAGES.FOLLOW_USER_ALREADY_EXISTS
      }
    }
  }
  async unfollowUser(followed_user_id: string, user_id: string) {
    const result = await databaseService.followers.findOneAndDelete({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (!result) {
      throw new ErrorWithStatus(POST_MESSAGES.NOT_FOLLOWING, HTTP_STATUS.BAD_REQUEST)
    }
  }
  async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: ENV.GOOGLE_CLIENT_ID,
      client_secret: ENV.GOOGLE_CLIENT_SECRET,
      redirect_uri: ENV.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data
  }
  async getOauthGoogleProfile(access_token: string, id_token: string): Promise<UserProfileResponse> {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data
  }
  async googleOauth(code: string) {
    // Handle Google OAuth login logic here
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    if (!id_token || !access_token) {
      throw new ErrorWithStatus(POST_MESSAGES.GOOGLE_OAUTH_ERROR, HTTP_STATUS.BAD_REQUEST)
    }
    const profile = await this.getOauthGoogleProfile(access_token, id_token)
    if (!profile.verified_email) {
      throw new ErrorWithStatus(POST_MESSAGES.EMAIL_NOT_VERIFIED, HTTP_STATUS.BAD_REQUEST)
    }

    const user = await this.getUserByEmail(profile.email)
    if (user) {
      const data = await this.login(user)
      return data
    } else {
      const password = randomPassword()
      const data = await this.register({
        email: profile.email,
        password,
        name: profile.name,
        confirm_password: password,
        date_of_birth: new Date().toISOString()
      })
      return data
    }
  }
}
const userService = new UserService()
export default userService
