import { SignOptions, sign } from 'jsonwebtoken'
interface SignTokenPayload {
  payload: string | Buffer | object
  privateKey?: string
  options: SignOptions
}

export const signToken = ({
  payload,
  privateKey = process.env.JWT_PRIVATE_KEY as string,
  options
}: SignTokenPayload) => {
  return new Promise((resolve, reject) => {
    sign(payload, privateKey, options, (error, token) => {
      if (error) reject(error)
      resolve(token)
    })
  })
}
