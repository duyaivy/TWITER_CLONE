import { NextFunction, Request, Response } from 'express'

export const wrapRequestHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // tra ve Promise, neu co loi se duoc bat
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
