import { checkSchema, Meta, ParamSchema } from 'express-validator'
import { POST_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import userService from '~/services/user.services'
import { validate } from '~/utils/validation'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { ErrorWithStatus } from '~/models/Errors'
import { HTTP_STATUS } from '~/constants/httpStatus'
import ENV from '~/constants/config'
import { ObjectId } from 'mongodb'
import { TokenPayload } from '~/type'
import { NextFunction, Request, Response } from 'express'

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
const linkSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.INVALID_VALUE
  },
  isURL: {
    errorMessage: USER_MESSAGES.INVALID_VALUE
  },
  trim: true,
  isLength: {
    options: {
      min: 3,
      max: 50
    },
    errorMessage: USER_MESSAGES.VALUE_MUST_BE_BETWEEN_3_AND_50_CHARACTERS
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
  trim: true,

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

const emailSchema = (customValidator: (value: string, meta: Meta) => Promise<boolean>) =>
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
          options: customValidator
        }
      }
    },
    ['body']
  )
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
export const userVerifyValidator = (req: Request, res: Response, next: NextFunction) => {
  // Get the token payload from any available source
  const tokenPayload =
    (req?.decode_access_token as TokenPayload) ||
    (req?.decode_email_token as TokenPayload) ||
    (req?.decode_refresh_token as TokenPayload)
  // Extract verify status from the token payload
  const verify = tokenPayload?.verify

  // Check if user is verified and not banned
  if (verify === undefined || verify === UserVerifyStatus.Banned || verify === UserVerifyStatus.Unverified) {
    return next(new ErrorWithStatus(POST_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN))
  }
  next()
}
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
              token: access_token,
              secretOrPublicKey: ENV.ACCESS_TOKEN_PRIVATE_KEY
            })
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
                token: value,
                secretOrPublicKey: ENV.REFRESH_TOKEN_PRIVATE_KEY
              }),
              databaseService.refreshTokens.findOne({ token: value })
            ])
            // check if refresh token exists in the database
            if (!refreshToken) {
              throw new ErrorWithStatus(POST_MESSAGES.INVALID_REFRESH_TOKEN, HTTP_STATUS.UNAUTHORIZED)
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
            const payload = await verifyToken({ token: value, secretOrPublicKey: ENV.SEND_EMAIL_PRIVATE_KEY })
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
  emailSchema(async (value, { req }) => {
    const user = await userService.getUserByEmail(value)
    if (!user || user.verify === UserVerifyStatus.Verified) {
      throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    req.user = user
    return true
  })
)
export const forgotPasswordValidator = validate(
  emailSchema(async (value, { req }) => {
    const user = await userService.getUserByEmail(value)
    if (!user) {
      throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    req.user = user
    return true
  })
)
export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: {
        notEmpty: {
          errorMessage: POST_MESSAGES.RESET_PASSWORD_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            // verify xem con thoi gian hay khong
            const forgotPasswordPayload = await verifyToken({
              token: value,
              secretOrPublicKey: ENV.FORGOT_PASSWORD_PRIVATE_KEY
            })
            const user = await databaseService.users.findOne({ _id: new ObjectId(forgotPasswordPayload.userId) })

            if (!user || user.forgot_password_token !== value) {
              throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
            }
            // check if user is banned or unverified
            else if (user?.verify === UserVerifyStatus.Banned || user?.verify === UserVerifyStatus.Unverified) {
              throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_VERIFIED_OR_BANNED, HTTP_STATUS.UNAUTHORIZED)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      date_of_birth: { ...dateOfBirthSchema, notEmpty: undefined, optional: true },
      bio: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.INVALID_VALUE
        },
        trim: true,
        isLength: {
          options: {
            max: 160
          },
          errorMessage: USER_MESSAGES.VALUE_MUST_BE_LESS_THAN_160
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.INVALID_VALUE
        },
        trim: true,
        isLength: {
          options: {
            min: 3,
            max: 50
          },
          errorMessage: USER_MESSAGES.VALUE_MUST_BE_BETWEEN_3_AND_50_CHARACTERS
        }
      },
      website: linkSchema,
      username: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.INVALID_VALUE
        },
        trim: true,
        isLength: {
          options: {
            min: 3,
            max: 50
          },
          errorMessage: USER_MESSAGES.VALUE_MUST_BE_BETWEEN_3_AND_50_CHARACTERS
        }
      },
      avatar: linkSchema,
      cover_photo: linkSchema,
      password: {
        ...passwordSchema,
        optional: true,
        notEmpty: undefined
      }
    },
    ['body']
  )
)
export const getProfileValidator = validate(
  checkSchema(
    {
      username: {
        notEmpty: {
          errorMessage: new ErrorWithStatus(USER_MESSAGES.USERNAME_REQUIRED, HTTP_STATUS.BAD_REQUEST)
        },
        isString: {
          errorMessage: new ErrorWithStatus(USER_MESSAGES.INVALID_VALUE, HTTP_STATUS.BAD_REQUEST)
        },
        trim: true,
        isLength: {
          options: {
            min: 3,
            max: 50
          },
          errorMessage: new ErrorWithStatus(
            USER_MESSAGES.VALUE_MUST_BE_BETWEEN_3_AND_50_CHARACTERS,
            HTTP_STATUS.BAD_REQUEST
          )
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne(
              {
                username: value
              },
              {
                projection: {
                  password: 0,
                  forgot_password_token: 0,
                  email_verify_token: 0
                }
              }
            )
            if (!user) {
              throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['params']
  )
)
export const followUserValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        notEmpty: {
          errorMessage: new ErrorWithStatus(POST_MESSAGES.FOLLOWED_USER_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST)
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus(USER_MESSAGES.INVALID_VALUE, HTTP_STATUS.BAD_REQUEST)
            }
            const followerUser = await databaseService.users.findOne({
              _id: new ObjectId(value)
            })
            if (!followerUser) {
              throw new ErrorWithStatus(POST_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
            }
          }
        }
      }
    },
    ['body']
  )
)
