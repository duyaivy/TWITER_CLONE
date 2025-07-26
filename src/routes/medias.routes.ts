import { Router } from 'express'
import {
  getImagesController,
  getM3u8Controller,
  getSegmentController,
  getStatusVideoHLSController,
  getVideoController,
  uploadImageController,
  uploadVideoController,
  uploadVideoHLSController
} from '~/controllers/medias.controller'
import { accessTokenValidator, userVerifyValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const mediasRouter = Router()
/* path:medias/upload-image
 * Method: POST
 * Description: Upload image
 */
mediasRouter.post('/upload-image', accessTokenValidator, userVerifyValidator, wrapRequestHandler(uploadImageController))

/* path:medias/upload-video
 * Method: POST
 * Description: Upload video
 */
mediasRouter.post('/upload-video', accessTokenValidator, userVerifyValidator, wrapRequestHandler(uploadVideoController))

/* path:medias/upload-video-hls
 * Method: POST
 * Description: Upload video
 */
mediasRouter.post(
  '/upload-video-hls',
  accessTokenValidator,
  userVerifyValidator,
  wrapRequestHandler(uploadVideoHLSController)
)

/* path:medias/images/:name
 * Method: GET
 * Description: get image
 */
mediasRouter.get('/images/:name', wrapRequestHandler(getImagesController))

/* path:medias/videos-hls/:id/master.m3u8
 * Method: GET
 * Description: get video HLS
 */
mediasRouter.get('/videos-hls/:id/master.m3u8', wrapRequestHandler(getM3u8Controller))

/* path:medias/videos-hls/status/:id
 * Method: GET
 * Description: check video Encode HLS
 */
mediasRouter.get('/videos-hls/status/:id', wrapRequestHandler(getStatusVideoHLSController))

/* path:medias/videos/:id/:v/:segment
 * Method: GET
 * Description: get video HLS
 */
mediasRouter.get('/videos-hls/:id/:v/:segment', wrapRequestHandler(getSegmentController))

/* path:medias/videos/:name
 * Method: GET
 * Description: get video
 */
mediasRouter.get('/videos/:name', wrapRequestHandler(getVideoController))

export default mediasRouter
