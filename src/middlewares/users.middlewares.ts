import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import userService from '~/services/user.services'
import { validate } from '~/utils/validation'
const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(422).json({ message: 'Email and password are required' })
  }
  next()
}
const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: 'Name is required'
      },
      isString: true,
      isLength: {
        options: {
          min: 1,
          max: 50
        },
        errorMessage: 'Name must be between 1 and 50 characters'
      }
    },
    email: {
      isEmail: {
        errorMessage: 'Invalid email'
      },
      notEmpty: {
        errorMessage: 'Email is required'
      },
      custom: {
        options: async (value) => {
          const isEmailExist = await userService.isEmailExist(value)
          if (isEmailExist) {
            throw new Error('Email already exists')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: 'Password is required'
      },
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: 'Password must be between 8 and 50 characters'
      },
      isStrongPassword: {
        errorMessage:
          'Password must contain at least 8 characters, 1 uppercase letter, 1 number and 1 special character',
        options: {
          minLength: 8,
          minUppercase: 0,
          minLowercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      }
    },
    confirm_password: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password')
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        errorMessage: 'Invalid date of birth'
      },
      notEmpty: {
        errorMessage: 'Date of birth is required'
      },
      custom: {
        options: (value) => {
          const date = new Date(value)
          const dateNow = new Date()
          const dateInvalid = new Date('1910-01-01')
          if (date > dateNow) {
            throw new Error('Date of birth must be in the past')
          }
          if (date < dateInvalid) {
            throw new Error('Date of birth must be after 1910')
          }
          return true
        }
      }
    }
  })
)

export { loginValidator, registerValidator }
