import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controller'
import { wrapRequestHandler } from '~/utils/handler'
const uploadRouter = Router()
/* path:users/google
 * Method: GET
 * Description: Google OAuth login
 * query: { code }
 */
uploadRouter.get('/uploads', wrapRequestHandler(uploadImageController))

export default uploadRouter
