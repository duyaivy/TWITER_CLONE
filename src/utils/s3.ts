import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import ENV from '~/constants/config'
import fs from 'fs'
import { Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { MEDIA_MESSAGES } from '~/constants/messages'
// Set the region

// Create S3 service object
const s3 = new S3({
  region: ENV.AWS_REGION,
  credentials: {
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
    accessKeyId: ENV.AWS_ACCESS_KEY_ID
  }
})

export const uploadFileS3 = ({
  filename,
  filepath,
  contentType
}: {
  filename: string
  filepath: string
  contentType: string
}) => {
  const file = fs.readFileSync(filepath)
  const parallelUploads3 = new Upload({
    client: s3,
    params: { Bucket: ENV.AWS_BUCKET_NAME, Key: filename, Body: file, ContentType: contentType },
    queueSize: 4,
    leavePartsOnError: false
  })

  return parallelUploads3.done()
}
export const sendFileFromS3 = async (res: Response, filepath: string) => {
  try {
    const data = await s3.getObject({ Bucket: ENV.AWS_BUCKET_NAME, Key: filepath })

    ;(data.Body as any).pipe(res)
  } catch (error) {
    if (error) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MEDIA_MESSAGES.FILE_NOT_FOUND
      })
    }
  }
}
