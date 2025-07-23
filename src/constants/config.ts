import { config } from 'dotenv'
config()

const ENV = {
  DB_USERNAME: (process.env.DB_USERNAME as string) || 'admin',
  DB_PASSWORD: (process.env.DB_PASSWORD as string) || 'admin',
  DB_NAME: (process.env.DB_NAME as string) || 'your_database_name',
  DB_USER_COLLECTION: (process.env.DB_USER_COLLECTION as string) || 'users',
  DB_REFRESH_TOKEN_COLLECTION: (process.env.DB_REFRESH_TOKEN_COLLECTION as string) || 'refresh_tokens',
  DB_FOLLOWER_COLLECTION: (process.env.DB_FOLLOWER_COLLECTION as string) || 'followers',
  PRIVATE_PASSWORD: (process.env.PRIVATE_PASSWORD as string) || '!@#1234',
  JWT_PRIVATE_KEY: (process.env.JWT_PRIVATE_KEY as string) || '!@#1234ccc',
  ACCESS_TOKEN_PRIVATE_KEY: (process.env.ACCESS_TOKEN_PRIVATE_KEY as string) || '!@#1234ccc',
  REFRESH_TOKEN_PRIVATE_KEY: (process.env.REFRESH_TOKEN_PRIVATE_KEY as string) || '!@#1234ccc',
  SEND_EMAIL_PRIVATE_KEY: (process.env.SEND_EMAIL_PRIVATE_KEY as string) || '!@#1234ccc',
  FORGOT_PASSWORD_PRIVATE_KEY: (process.env.FORGOT_PASSWORD_PRIVATE_KEY as string) || '!@#1234ccc',
  EXPIRES_TIME_ACCESS_TOKEN: (process.env.EXPIRES_TIME_ACCESS_TOKEN as string) || '15m',
  EXPIRES_TIME_REFRESH_TOKEN: (process.env.EXPIRES_TIME_REFRESH_TOKEN as string) || '30d',
  AWS_SECRET_ACCESS_KEY: (process.env.AWS_SECRET_ACCESS_KEY as string) || '',
  AWS_ACCESS_KEY_ID: (process.env.AWS_ACCESS_KEY_ID as string) || '',
  AWS_REGION: (process.env.AWS_REGION as string) || 'us-east-1',
  AWS_SES_FROM_ADDRESS: (process.env.AWS_SES_FROM_ADDRESS as string) || '',
  CLIENT_URL: (process.env.CLIENT_URL as string) || '',
  EMAIL_PASSWORD: (process.env.EMAIL_PASSWORD as string) || '',
  EMAIL_HOST: (process.env.EMAIL_HOST as string) || '',
  EMAIL_PORT: (process.env.EMAIL_PORT as string) || '',
  EMAIL_USER: (process.env.EMAIL_USER as string) || '',
  GOOGLE_CLIENT_SECRET: (process.env.GOOGLE_CLIENT_SECRET as string) || '',
  GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID as string) || '',
  GOOGLE_REDIRECT_URI: (process.env.GOOGLE_REDIRECT_URI as string) || '',
  TOKEN_URI: (process.env.TOKEN_URI as string) || 'https://oauth2.googleapis.com/token',
  CLIENT_REDIRECT_URI: (process.env.CLIENT_REDIRECT_URI as string) || '',
  SERVER_PORT: (process.env.SERVER_PORT as string) || '3000',
  HOST: process.env.HOST as string
} as const

export default ENV
export const isDevelopment = process.env.NODE_ENV === 'development'
