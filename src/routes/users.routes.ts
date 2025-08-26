import { Router } from 'express'
import {
  changePWController,
  emailResendController,
  emailVerifyController,
  followUserController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  OauthController,
  refreshTokenController,
  registerController,
  resetPasswordController,
  unfollowUserController,
  updateMeController
} from '~/controllers/users.controller'
import { filterMiddlewares } from '~/middlewares/common.middleware'
import {
  accessTokenValidator,
  changePWValidator,
  emailResendValidator,
  emailTokenValidator,
  followUserValidator,
  forgotPasswordValidator,
  getProfileValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  userVerifyValidator
} from '~/middlewares/users.middlewares'
import { ChangePWRequest, UpdateMeRequest } from '~/models/requests/User.request'
import { wrapRequestHandler } from '~/utils/handler'

const usersRouter = Router()

/* path:users/login
 * Method: POST
 * Description: Login an existing user
 * payload: { email, password }
 */

usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/* path:users/reset-password
 * Method: POST
 * Description: Reset password
 * payload: { password, confirmPassword }
 */
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/* path:users/me
 * Method: GET
 * Authorization: Bearer <token>
 * Description: Get current user information
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/* path:users/me
 * Method: PATCH
 * Authorization: Bearer <token>
 * Description: Update current user information
 * Payload: { name, email, date_of_birth, bio, location, website, username, avatar, cover_photo }
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  userVerifyValidator,
  filterMiddlewares<UpdateMeRequest>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapRequestHandler(updateMeController)
)
/* path:users/change-password
 * Method: PUT
 * Authorization: Bearer <token>
 * Description: Update current user information
 * Payload: { old_password, password, confirm_password }
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  userVerifyValidator,
  filterMiddlewares<ChangePWRequest>(['old_password', 'confirm_password', 'password']),
  changePWValidator,
  wrapRequestHandler(changePWController)
)
/* path:users/get-profile/:username
 * Method: GET
 * Description: Get user information by username
 */
usersRouter.get('/get-profile/:username', getProfileValidator, wrapRequestHandler(getProfileController))

/* path:users/followers
 * Method: POST
 * Authorization: Bearer <token>
 * Description: Follow a user
 * payload: { followed_user_id }
 */
usersRouter.post(
  '/follower',
  accessTokenValidator,
  userVerifyValidator,
  followUserValidator,
  wrapRequestHandler(followUserController)
)
/* path:users/followers
 * Method: POST
 * Authorization: Bearer <token>
 * Description: Follow a user
 * payload: { followed_user_id }
 */
usersRouter.post(
  '/unFollower',
  accessTokenValidator,
  userVerifyValidator,
  followUserValidator,
  wrapRequestHandler(unfollowUserController)
)
/* path:users/google
 * Method: GET
 * Description: Google OAuth login
 * query: { code }
 */
usersRouter.get('/google', wrapRequestHandler(OauthController))
export default usersRouter
