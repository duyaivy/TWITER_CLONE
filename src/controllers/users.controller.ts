import { Request, Response } from 'express'
import userService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  EmailVerifyRequest,
  LoginRequest,
  LogoutOrRefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateMeRequest
} from '~/models/requests/User.request'
import { POST_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import User from '~/models/schemas/User.schema'
import { TokenPayload } from '~/type'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequest>, res: Response) => {
  // check email
  const user = req.user
  const result = await userService.login(user as User)
  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    data: result
  })
}
export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  const result = await userService.register(req.body)
  return res.status(201).json({
    message: USER_MESSAGES.REGISTER_SUCCESS,
    data: result
  })
}
export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutOrRefreshTokenRequest>,
  res: Response
) => {
  const { refresh_token } = req.body
  // Handle logout logic here
  await userService.logout(refresh_token)
  return res.json({
    message: USER_MESSAGES.LOGOUT_SUCCESS
  })
}
export const refreshTokenController = async (
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
export const emailVerifyController = async (req: Request<ParamsDictionary, any, EmailVerifyRequest>, res: Response) => {
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
export const emailResendController = async (
  req: Request<ParamsDictionary, any, Pick<LoginRequest, 'email'>>,
  res: Response
) => {
  await userService.resendEmailVerify(req.body.email, req.user as User)
  return res.json({
    message: POST_MESSAGES.EMAIL_RESEND_VERIFY_SUCCESS
  })
}
export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, Pick<LoginRequest, 'email'>>,
  res: Response
) => {
  await userService.forgotPassword(req.body.email, req.user as User)
  return res.json({
    message: POST_MESSAGES.SEND_FORGOT_PASSWORD_SUCCESS
  })
}
export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequest>,
  res: Response
) => {
  const { password } = req.body
  await userService.resetPassword(password, req.user as User)
  return res.json({
    message: POST_MESSAGES.SEND_FORGOT_PASSWORD_SUCCESS
  })
}

export const getMeController = async (req: Request<ParamsDictionary, any, {}>, res: Response) => {
  const userId = req.decode_access_token?.userId
  const userData = await userService.getMe(userId as string)
  return res.json({
    message: POST_MESSAGES.GET_ME_SUCCESS,
    data: userData
  })
}
export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeRequest>, res: Response) => {
  const userId = req.decode_access_token?.userId
  const userUpdate: UpdateMeRequest = req.body
  const result = await userService.updateMe(userId as string, userUpdate)
  return res.json({
    message: POST_MESSAGES.UPDATE_ME_SUCCESS,
    data: result
  })
}
export const getProfileController = async (req: Request<ParamsDictionary, any, {}>, res: Response) => {
  const user = req.user as User
  return res.json({
    message: POST_MESSAGES.GET_ME_SUCCESS,
    data: user
  })
}
