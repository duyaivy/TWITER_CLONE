import { Request } from 'express'
import formidable from 'formidable'
import fs from 'fs'
import { ObjectId } from 'mongodb'
import { nanoid } from 'nanoid'
import path from 'path'
import { ALLOWED_VIDEO_TYPES, CONFIG } from '~/constants/config'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { MEDIA_MESSAGES } from '~/constants/messages'
import { PATH_UPLOAD_IMAGE_TEMP, PATH_UPLOAD_VIDEO } from '~/constants/URL'
import { ErrorWithStatus } from '~/models/Errors'

export const initialUploadFolder = () => {
  const uploadPaths = [PATH_UPLOAD_IMAGE_TEMP, PATH_UPLOAD_VIDEO]
  uploadPaths.forEach((path) => {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
  })
}
export const uploadImage = (req: Request) => {
  const form = formidable({
    keepExtensions: true,
    uploadDir: PATH_UPLOAD_IMAGE_TEMP,
    maxFileSize: CONFIG.MAX_IMAGE_SIZE,
    maxTotalFileSize: CONFIG.MAX_TOTAL_IMAGE_SIZE,
    maxFiles: CONFIG.MAX_IMAGE_FILES,
    allowEmptyFiles: false,
    filter: function ({ name, mimetype }) {
      // keep only images
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new ErrorWithStatus(MEDIA_MESSAGES.INVALID_FILE_TYPE, HTTP_STATUS.BAD_REQUEST) as any)
      }
      return valid
    }
  })
  return new Promise<formidable.File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new ErrorWithStatus(err.message, HTTP_STATUS.BAD_REQUEST))
        return
      }
      if (!files.image) {
        reject(new ErrorWithStatus(MEDIA_MESSAGES.FILE_IS_EMPTY, HTTP_STATUS.BAD_REQUEST))
        return
      }

      resolve(files.image)
    })
  })
}

export const uploadVideo = (req: Request) => {
  const idName = new ObjectId().toString()
  const folderPath = path.resolve(PATH_UPLOAD_VIDEO, idName)
  fs.mkdirSync(folderPath, { recursive: true })
  const form = formidable({
    keepExtensions: true,
    uploadDir: folderPath,
    maxFileSize: CONFIG.MAX_VIDEO_SIZE,
    maxFiles: CONFIG.MAX_VIDEO_FILES,
    allowEmptyFiles: false,
    filter: function ({ name, mimetype }) {
      // keep only videos
      const valid =
        name === 'video' &&
        Boolean(mimetype?.includes('video/')) &&
        typeof mimetype === 'string' &&
        ALLOWED_VIDEO_TYPES.includes(mimetype)
      if (!valid) {
        form.emit('error' as any, new ErrorWithStatus(MEDIA_MESSAGES.INVALID_FILE_TYPE, HTTP_STATUS.BAD_REQUEST) as any)
      }
      return valid
    },
    filename: (name, ext) => {
      return `${idName}${ext}`
    }
  })
  return new Promise<formidable.File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new ErrorWithStatus(MEDIA_MESSAGES.INVALID_FILE_TYPE, HTTP_STATUS.BAD_REQUEST))
        return
      }
      if (!files.video) {
        reject(new ErrorWithStatus(MEDIA_MESSAGES.FILE_IS_EMPTY, HTTP_STATUS.BAD_REQUEST))
        return
      }
      resolve(files.video)
    })
  })
}
export const getNameFromFullname = (name: string) => {
  const parts = name.split('.')
  if (parts.length > 1) {
    parts.pop()
  }
  return parts.join('')
}
