import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import ENV from '~/constants/config'
import fs from 'fs'
import path from 'path'
// Set the region

// Create S3 service object
const s3 = new S3({
  region: ENV.AWS_REGION,
  credentials: {
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
    accessKeyId: ENV.AWS_ACCESS_KEY_ID
  }
})

// Create the parameters for calling createBucket
const bucketParams = {
  Bucket: ENV.AWS_BUCKET_NAME
}

// Call S3 to create the bucket
s3.createBucket(bucketParams, (err: any, data: any) => {
  if (err) {
    console.error('Error', err)
  } else {
    console.log('Success', data.Location)
  }
})
const file = fs.readFileSync(path.resolve('uploads/images/bzqshz74d0ucprvg5pwj864zz.jpg'))
const parallelUploads3 = new Upload({
  client: s3,
  params: { Bucket: ENV.AWS_BUCKET_NAME, Key: 'tests.png', Body: file, ContentType: 'image/png' },
  queueSize: 4,
  leavePartsOnError: false
})

parallelUploads3.on('httpUploadProgress', (progress) => {
  console.log(progress)
})

parallelUploads3.done().then((data) => console.log(data))
