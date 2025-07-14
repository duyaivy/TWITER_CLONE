import { Request, Response } from 'express'
import userService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequest } from '~/models/requests/User.request'

const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  res.json([
    {
      message: 'login success',
      data: {
        email: email,
        password: password
      }
    }
  ])
}
const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  try {
    const result = await userService.register(req.body)
    return res.status(201).json({
      message: 'register success',
      data: result
    })
  } catch (error) {
    console.log(error)

    return res.status(400).json({
      message: 'register failed',
      error
    })
  }
}
export { loginController, registerController }
