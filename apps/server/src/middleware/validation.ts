import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

// Validation middleware to check for validation errors using Zod
export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate request body against the schema
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract the first validation error message
        const firstError = error.errors[0];
        const fieldName = firstError.path.join('.');
        const message = firstError.message;

        // Format the message properly
        let detailedMessage: string;
        if (message.toLowerCase().includes('is required')) {
          detailedMessage = message.toLowerCase();
        } else if (message.toLowerCase().includes('required')) {
          detailedMessage = `${fieldName} is required`;
        } else {
          detailedMessage = `${fieldName} ${message.toLowerCase()}`;
        }

        return next(new ValidationError(detailedMessage));
      }

      // Handle unexpected errors by passing to global error handler
      return next(error);
    }
  };
};

// Participant validation schemas
export const participantValidationSchemas = {
  create: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters'),

    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Must be a valid email address')
      .toLowerCase(),
  }),

  update: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .optional(),

    email: z
      .string()
      .trim()
      .email('Must be a valid email address')
      .toLowerCase()
      .optional(),
  }),
};
