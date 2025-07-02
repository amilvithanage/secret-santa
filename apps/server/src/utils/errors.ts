// utils/errors.ts

export class AppError extends Error {
  public statusCode: number;
  public success: false = false;
  public error: string;

  constructor(message: string, error: string, statusCode: number) {
    super(message);
    this.name = error; // Optional: set native `Error.name`
    this.error = error;
    this.statusCode = statusCode;

    // Ensure instanceof checks work correctly
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NotFoundError', 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 'BadRequestError', 400);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'Validation failed', 400);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 'ForbiddenError', 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 'UnauthorizedError', 401);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 'InternalServerError', 500);
  }
}
