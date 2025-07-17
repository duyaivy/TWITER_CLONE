import { Router, Request } from 'express'
import {
  emailVerifyController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController
} from '~/controllers/users.controller'
import {
  accessTokenValidator,
  emailResendValidator,
  emailTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
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
 * payload: { email_verify_token }
 */
usersRouter.post('/resend-verify-email', emailResendValidator, wrapRequestHandler(emailVerifyController))

export default usersRouter
