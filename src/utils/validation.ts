import { Request, Response, NextFunction } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'

const validate =
  (schema: RunnableValidationChains<ValidationChain>) => async (req: Request, res: Response, next: NextFunction) => {
    // run schema -> bat dong bo
    await schema.run(req)
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    return res.status(400).json({ errors: errors.mapped() })
  }

export { validate }
