/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import fs from 'fs'
import path from 'path'
import ENV from '~/constants/config'
import nodemailer from 'nodemailer'
import { ErrorWithStatus } from '~/models/Errors'
import { HTTP_STATUS } from '~/constants/httpStatus'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { POST_MESSAGES } from '~/constants/messages'
// Create SES service object.
const sesClient = new SESClient({
  region: ENV.AWS_REGION,
  credentials: {
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
    accessKeyId: ENV.AWS_ACCESS_KEY_ID
  }
})
const verifyEmailTemplate = fs.readFileSync(path.resolve('src/templates/send-email.html'), 'utf8')

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string
  toAddresses: string | string[]
  ccAddresses?: string | string[]
  body: string
  subject: string
  replyToAddresses?: string | string[]
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  })
}

const sendVerifyEmail = (toAddress: string, subject: string, body: string) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: ENV.AWS_SES_FROM_ADDRESS,
    toAddresses: toAddress,
    body,
    subject
  })
  return sesClient.send(sendEmailCommand)
}

export const sendVerifyRegisterEmail = (
  toAddress: string,
  email_verify_token: string,
  template: string = verifyEmailTemplate
) => {
  return sendVerifyEmail(
    toAddress,
    'Verify your email',
    template
      .replaceAll('{{title}}', 'Please verify your email from Twitter Clone')
      .replace('{{content}}', 'Click the button below to verify your email')
      .replace('{{titleLink}}', 'Verify')
      .replace('{{link}}', `${ENV.CLIENT_URL}/email-verifications?token=${email_verify_token}`)
      .replace('{{year}}', new Date().getFullYear().toString())
  )
}
export const sendForgotPasswordEmail = (
  toAddress: string,
  forgot_password_token: string,
  template: string = verifyEmailTemplate
) => {
  return sendVerifyEmail(
    toAddress,
    'Reset your password',
    template
      .replaceAll('{{title}}', 'Reset your password from Twitter Clone')
      .replace('{{content}}', 'Click the button below to reset your password')
      .replace('{{titleLink}}', 'Reset Password')
      .replace('{{link}}', `${ENV.CLIENT_URL}/reset-password?token=${forgot_password_token}`)
      .replace('{{year}}', new Date().getFullYear().toString())
  )
}
// nodemailer
const transporter = nodemailer.createTransport({
  host: ENV.EMAIL_HOST,
  port: Number(ENV.EMAIL_PORT),
  secure: false,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASSWORD
  }
} as SMTPTransport.Options)

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const mailOptions = {
    from: ENV.EMAIL_USER,
    to,
    subject,
    html
  }
  try {
    return await transporter.sendMail(mailOptions)
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus(POST_MESSAGES.EMAIL_CANT_SEND, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export const sendRegisterEmailNodemailer = (
  to: string,
  email_verify_token: string,
  template: string = verifyEmailTemplate
) => {
  return sendEmail({
    to,
    subject: 'Verify your email',
    html: template
      .replaceAll('{{title}}', 'Please verify your email')
      .replace('{{content}}', 'Click the button below to verify your email')
      .replace('{{titleLink}}', 'Verify')
      .replace('{{link}}', `${ENV.CLIENT_URL}/email-verifications?token=${email_verify_token}`)
      .replace('{{year}}', new Date().getFullYear().toString())
  })
}
export const sendForgotPasswordNodemailer = (
  to: string,
  forgot_password_token: string,
  template: string = verifyEmailTemplate
) => {
  return sendEmail({
    to,
    subject: 'Resset password from Twittwer Clone',
    html: template
      .replaceAll('{{title}}', 'You are receiving this email because you requested to reset your password')
      .replace('{{content}}', 'Click the button below to reset your password')
      .replace('{{titleLink}}', 'Reset Password')
      .replace('{{link}}', `${ENV.CLIENT_URL}/reset-password?token=${forgot_password_token}`)
      .replace('{{year}}', new Date().getFullYear().toString())
  })
}
