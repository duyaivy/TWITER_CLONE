import { Request, Response, NextFunction } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

const validate =
  (schema: RunnableValidationChains<ValidationChain>) => async (req: Request, res: Response, next: NextFunction) => {
    // run schema -> bat dong bo
    await schema.run(req)
    const errors = validationResult(req)
    // KHONG PHAI LOI THI NEXT
    if (errors.isEmpty()) {
      return next()
    }
    // neu loi -> tra ve loi
    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    for (const key in errorObject) {
      const { msg } = errorObject[key]
      // khong phai loi validate
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      // loi validate
      entityError.errors[key] = errorObject[key]
    }
    return next(entityError)
  }

export { validate }
