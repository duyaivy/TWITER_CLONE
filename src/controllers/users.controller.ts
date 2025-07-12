import { Request, Response } from 'express'
import userService from '~/services/user.services'

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
const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const result = await userService.register({ email, password })
    return res.json({
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
