import { Request, Response, NextFunction } from 'express'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { ResponseHelper } from '../utils/responseHelper'
import { ValidationError } from '../utils/errors'

interface CustomError extends Error {
  statusCode?: number
  code?: string
}

const errorHandler = (err: CustomError, req: Request, res: Response, _next: NextFunction): void => {
  // Log the error for debugging (in production, this would go to a logging service)
  console.error(`❌ Error on ${req.method} ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode
  })

  // Handle validation errors first (before generic custom errors)
  if (err instanceof ValidationError) {
    ResponseHelper.error(res, err.error, err.statusCode, err.message)
    return
  }

  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      ResponseHelper.error(res, 'Resource not found', 404)
      return
    }
    if (err.code === 'P2002') {
      ResponseHelper.error(res, 'Unique constraint violation', 400)
      return
    }
    // Handle other Prisma errors as bad request
    ResponseHelper.error(res, 'Database operation failed', 400)
    return
  }

  // Handle custom errors with status codes
  if (err.statusCode) {
    ResponseHelper.error(res, err.message, err.statusCode)
    return
  }

  // Handle validation errors by name (fallback)
  if (err.name === 'ValidationError') {
    ResponseHelper.error(res, 'Validation failed', 400)
    return
  }

  // Default to 500 Internal Server Error
  const message = process.env['NODE_ENV'] === 'development'
    ? err.message
    : 'Internal server error'

  ResponseHelper.error(res, message, 500)
}

export default errorHandler
