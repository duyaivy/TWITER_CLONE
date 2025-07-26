import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { HTTP_STATUS } from '~/constants/httpStatus'
import fs from 'fs'
import { MEDIA_MESSAGES } from '~/constants/messages'
import { PATH_UPLOAD_IMAGE, PATH_UPLOAD_VIDEO } from '~/constants/URL'
import { ErrorWithStatus } from '~/models/Errors'
import mediaService from '~/services/media.services'
import { CONFIG } from '~/constants/config'
import mime from 'mime'
import { getNameFromFullname } from '~/utils/file'
import videoStatusService from '~/services/videoStatus.services'

export const uploadImageController = async (req: Request, res: Response) => {
  const result = await mediaService.uploadImage(req)
  res.json({
    message: MEDIA_MESSAGES.UPLOAD_SUCCESS,
    data: result
  })
}
export const uploadVideoController = async (req: Request, res: Response) => {
  const result = await mediaService.uploadVideo(req)
  res.json({
    message: MEDIA_MESSAGES.UPLOAD_SUCCESS,
    data: result
  })
}
export const uploadVideoHLSController = async (req: Request, res: Response) => {
  const result = await mediaService.uploadVideoHLS(req)
  res.json({
    message: MEDIA_MESSAGES.UPLOAD_SUCCESS,
    data: result
  })
}

export const getImagesController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  const imagePath = `${PATH_UPLOAD_IMAGE}/${name}`
  res.sendFile(
    imagePath,
    {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `inline; filename="${name}"`
      }
    },
    (err) => {
      if (err) {
        next(new ErrorWithStatus(MEDIA_MESSAGES.FILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND))
      }
    }
  )
}
export const getVideoController = (req: Request, res: Response) => {
  const range = req.headers.range
  const { name } = req.params
  const folderName = getNameFromFullname(name)
  const videoPath = path.resolve(PATH_UPLOAD_VIDEO, folderName, name)
  const videoSize = fs.statSync(videoPath).size
  if (!range) {
    const contentType = mime.getType(videoPath) || 'video/mp4'
    res.writeHead(200, {
      'Content-Length': videoSize,
      'Content-Type': contentType
    })
    return fs.createReadStream(videoPath).pipe(res)
  }

  const start = Number(range?.replace(/\D/g, ''))
  const end = Math.min(start + CONFIG.CHUNK_SIZE, videoSize - 1)
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
export const getM3u8Controller = (req: Request, res: Response) => {
  const { id } = req.params
  const videoPath = path.resolve(PATH_UPLOAD_VIDEO, id, 'master.m3u8')
  res.sendFile(videoPath, (err) => {
    if (err) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MEDIA_MESSAGES.FILE_NOT_FOUND
      })
    }
  })
}
export const getStatusVideoHLSController = async (req: Request, res: Response) => {
  const { id } = req.params
  const videoStatus = await videoStatusService.getVideoStatusById(id)
  if (!videoStatus) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: MEDIA_MESSAGES.FILE_NOT_FOUND
    })
  }
  res.json({
    message: MEDIA_MESSAGES.CHECK_STATUS_SUCCESS,
    data: videoStatus
  })
}
export const getSegmentController = (req: Request, res: Response) => {
  const { id, v, segment } = req.params
  const videoPath = path.resolve(PATH_UPLOAD_VIDEO, id, v, segment)
  res.sendFile(videoPath, (err) => {
    if (err) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MEDIA_MESSAGES.FILE_NOT_FOUND
      })
    }
  })
}
