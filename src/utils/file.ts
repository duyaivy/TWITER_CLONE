import { Request } from 'express'
import formidable from 'formidable'
import fs from 'fs'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { MEDIA_MESSAGES } from '~/constants/messages'
import { PATH_UPLOAD_TEMP } from '~/constants/URL'
import { ErrorWithStatus } from '~/models/Errors'

export const initialUploadFolder = () => {
  if (!fs.existsSync('uploads/temp')) {
    fs.mkdirSync('uploads/temp', { recursive: true })
  }
}
export const uploadSingleImage = (req: Request) => {
  const form = formidable({
    keepExtensions: true,
    uploadDir: PATH_UPLOAD_TEMP,
    maxFileSize: 2 * 1024 * 1024,
    maxFiles: 1,
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
  return new Promise<formidable.File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new ErrorWithStatus(err.message, HTTP_STATUS.BAD_REQUEST))
        return
      }
      if (!files.image) {
        reject(new ErrorWithStatus(MEDIA_MESSAGES.FILE_IS_EMPTY, HTTP_STATUS.BAD_REQUEST))
        return
      }

      const imageFile = Array.isArray(files.image) ? files.image[0] : files.image
      resolve(imageFile)
    })
  })
}
export const getNameFromFullname = (name: string) => {
  const parts = name.split('.')
  if (parts.length > 1) {
    parts.pop() // Remove the file extension
  }
  return parts.join('')
}
