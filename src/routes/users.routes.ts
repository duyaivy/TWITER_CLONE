import { Router } from 'express'
import {
  emailResendController,
  emailVerifyController,
  followUserController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resetPasswordController,
  unfollowUserController,
  updateMeController
} from '~/controllers/users.controller'
import { filterMiddlewares } from '~/middlewares/common.middleware'
import {
  accessTokenValidator,
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
import { UpdateMeRequest } from '~/models/requests/User.request'
import { wrapRequestHandler } from '~/utils/handler'

const usersRouter = Router()

/* path:users/login
 * Method: POST
 * Description: Login an existing user
 * payload: { email, password }
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/* path:users/register
 * Method: POST
 * Description: Register a new user
 * payload: { name, email, password, confirmPassword }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/* path:users/logout
 * Method: POST
 * Description: Logout an existing user
 * Header: {Authorization: Bearer <token>}
 * payload: { refreshToken }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/* path:users/refresh_token
 * Method: POST
 * Description: Refresh access token
 * Header: {Authorization: Bearer <token>}
 * payload: { refreshToken }
 */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/* path:users/email_verify
 * Method: POST
 * Description: Verify user email
 * payload: { email_verify_token }
 */
usersRouter.post('/email-verify', emailTokenValidator, wrapRequestHandler(emailVerifyController))

/* path:users/resend-verify-email
 * Method: POST
 * Description: Resend email verification
 * payload: { email }
 */
usersRouter.post('/resend-verify-email', emailResendValidator, wrapRequestHandler(emailResendController))

/* path:users/forgot-password
 * Method: POST
 * Description: Forgot password
 * payload: { email }
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
 * Payload: { name, email, date_of_birth, bio, location, website, username, avatar, cover_photo, password }
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
    'cover_photo',
    'password'
  ]),
  updateMeValidator,
  wrapRequestHandler(updateMeController)
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
export default usersRouter
