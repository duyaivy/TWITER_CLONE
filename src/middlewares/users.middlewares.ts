import { checkSchema, ParamSchema } from 'express-validator'
import { POST_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import userService from '~/services/user.services'
import { validate } from '~/utils/validation'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { ErrorWithStatus } from '~/models/Errors'
import { HTTP_STATUS } from '~/constants/httpStatus'

const dateOfBirthSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.DATE_OF_BIRTH_REQUIRED
  },
  isISO8601: {
    errorMessage: USER_MESSAGES.INVALID_DATE_OF_BIRTH
  },
  custom: {
    options: (value) => {
      const date = new Date(value)
      const today = new Date()
      if (date >= today) {
        throw new Error(USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_IN_THE_PAST)
      }
      if (date.getFullYear() < 1910) {
        throw new Error(USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_AFTER_1910)
      }
      return true
    }
  }
}
const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.NAME_REQUIRED
  },
  trim: true,
  isString: true,
  isLength: {
    options: {
      min: 3,
      max: 50
    },
    errorMessage: USER_MESSAGES.NAME_MUST_BE_BETWEEN_3_AND_50_CHARACTERS
  }
}
const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.PASSWORD_REQUIRED
  },
  isString: true,
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_BETWEEN_8_AND_50_CHARACTERS
  },
  isStrongPassword: {
    errorMessage: USER_MESSAGES.PASSWORD_MUST_CONTAIN_UPPERCASE_NUMBER_AND_SPECIAL_CHARACTER,
    options: {
      minLength: 8,
      minUppercase: 0,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  }
}
const confirmPasswordSchema: ParamSchema = {
  isString: true,
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw USER_MESSAGES.PASSWORD_CONFIRMATION_DOES_NOT_MATCH
      }
      return true
    }
  }
}
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USER_MESSAGES.INVALID_EMAIL
        },
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_REQUIRED
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const { email, password } = req.body
            const user = await databaseService.users.findOne({ email, password: hashPassword(password) })
            // Check if user exists and is not banned or unverified
            if (user) {
              if (user.verify === UserVerifyStatus.Unverified || user.verify === UserVerifyStatus.Banned)
                throw USER_MESSAGES.USER_NOT_VERIFIED_OR_BANNED
              req.user = user
              return true
            } else {
              throw USER_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT
            }
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)
export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        isEmail: {
          errorMessage: USER_MESSAGES.INVALID_EMAIL
        },
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_REQUIRED
        },
        custom: {
          options: async (value) => {
            const user = await userService.getUserByEmail(value)
            if (user) {
              throw USER_MESSAGES.EMAIL_ALREADY_EXISTS
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: POST_MESSAGES.ACCESS_TOKEN_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            if (!value || !value.startsWith('Bearer ')) {
              throw new Error(POST_MESSAGES.ACCESS_TOKEN_REQUIRED)
            }
            const access_token = value.replace('Bearer ', '')
            const accessTokenPayload = await verifyToken({
              token: access_token
            })
            if (
              accessTokenPayload.verify === UserVerifyStatus.Banned ||
              accessTokenPayload.verify === UserVerifyStatus.Unverified
            ) {
              throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_VERIFIED_OR_BANNED, HTTP_STATUS.UNAUTHORIZED)
            }
            req.decode_access_token = accessTokenPayload
            return true
          }
        }
      }
    },
    ['headers']
  )
)
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: POST_MESSAGES.REFRESH_TOKEN_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            const [refreshTokenPayload, refreshToken] = await Promise.all([
              await verifyToken({
                token: value
              }),
              databaseService.refreshTokens.findOne({ token: value })
            ])
            // check if refresh token exists in the database
            if (!refreshToken) {
              throw new ErrorWithStatus(POST_MESSAGES.INVALID_REFRESH_TOKEN, HTTP_STATUS.UNAUTHORIZED)
            }
            // check if user is banned or unverified
            if (
              refreshTokenPayload.verify === UserVerifyStatus.Banned ||
              refreshTokenPayload.verify === UserVerifyStatus.Unverified
            ) {
              throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_VERIFIED_OR_BANNED, HTTP_STATUS.UNAUTHORIZED)
            }
            req.decode_refresh_token = refreshTokenPayload

            return true
          }
        }
      }
    },
    ['body']
  )
)
export const emailTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        notEmpty: {
          errorMessage: POST_MESSAGES.EMAIL_VERIFY_TOKEN_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            const payload = await verifyToken({ token: value })
            if (!payload || payload.token_type !== TokenType.EmailVerifyToken) {
              throw new ErrorWithStatus(POST_MESSAGES.INVALID_EMAIL_VERIFY_TOKEN, HTTP_STATUS.UNAUTHORIZED)
            }
            req.decode_email_token = payload
            return true
          }
        }
      }
    },
    ['body']
  )
)
export const emailResendValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGES.INVALID_EMAIL
        },
        custom: {
          options: async (value) => {
            const user = await userService.getUserByEmail(value)
            if (!user || user.verify === UserVerifyStatus.Verified) {
              throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
