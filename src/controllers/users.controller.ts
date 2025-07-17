import { Request, Response } from 'express'
import userService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  EmailVerifyRequest,
  LoginRequest,
  LogoutOrRefreshTokenRequest,
  RegisterRequest
} from '~/models/requests/User.request'
import { POST_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import User from '~/models/schemas/User.schema'
import { TokenPayload } from '~/type'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'

const loginController = async (req: Request<ParamsDictionary, any, LoginRequest>, res: Response) => {
  // check email
  const user = req.user
  const result = await userService.login(user as User)
  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    data: result
  })
}
const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  const result = await userService.register(req.body)
  return res.status(201).json({
    message: USER_MESSAGES.REGISTER_SUCCESS,
    data: result
  })
}
const logoutController = async (req: Request<ParamsDictionary, any, LogoutOrRefreshTokenRequest>, res: Response) => {
  const { refresh_token } = req.body
  // Handle logout logic here
  await userService.logout(refresh_token)
  return res.json({
    message: USER_MESSAGES.LOGOUT_SUCCESS
  })
}
const refreshTokenController = async (
  req: Request<ParamsDictionary, any, LogoutOrRefreshTokenRequest>,
  res: Response
) => {
  const { refresh_token } = req.body
  const payload = req.decode_refresh_token
  const result = await userService.refreshToken({
    refresh_token,
    userId: payload?.userId,
    token_type: TokenType.RefreshToken,
    verify: payload?.verify,
    exp: payload?.exp
  } as TokenPayload)
  return res.json({
    message: POST_MESSAGES.REFRESH_TOKEN_SUCCESS,
    data: result
  })
}
const emailVerifyController = async (req: Request<ParamsDictionary, any, EmailVerifyRequest>, res: Response) => {
  const { userId } = req.decode_email_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(userId) })
  // check if user exists
  if (!user || user.email_verify_token == '') {
    return res.status(404).json({
      message: POST_MESSAGES.USER_NOT_FOUND
    })
  }
  // neu da verify thi tra ve thong bao da verify roi
  if (user?.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: POST_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  // update user verify status
  await userService.verifyEmail({
    userId: user?._id.toString() as string
  })
  return res.json({
    message: POST_MESSAGES.EMAIL_VERIFY_SUCCESS
  })
}
const emailResendController = async (
  req: Request<ParamsDictionary, any, Pick<LoginRequest, 'email'>>,
  res: Response
) => {
  // const user = await userService.getUserByEmail(req.body.email)
  // await userService.verifyEmail({
  //   userId: user?._id.toString() as string
  // })
  return res.json({
    message: POST_MESSAGES.EMAIL_RESEND_VERIFY_SUCCESS
  })
}
export {
  loginController,
  registerController,
  logoutController,
  refreshTokenController,
  emailVerifyController,
  emailResendController
}
