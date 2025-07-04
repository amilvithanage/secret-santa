import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";
import { ValidationError } from "../utils/errors";

// Validation middleware to check for validation errors using Zod
export const validate = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate the entire request object (body, params, query) against the schema
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Update request with validated data
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.params) req.params = validatedData.params;
      if (validatedData.query) {
        // Replace the entire query object with validated data
        // This ensures proper type transformations are applied
        try {
          req.query = validatedData.query as any;
        } catch (error) {
          // In test environments, req.query might be read-only
          // In that case, copy properties individually
          Object.keys(validatedData.query).forEach((key) => {
            (req.query as any)[key] = (validatedData.query as any)[key];
          });
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract the first validation error message
        const firstError = error.errors[0];
        const fieldName = firstError.path.join(".");
        const message = firstError.message;

        // Format the message properly
        let detailedMessage: string;
        if (message.toLowerCase().includes("is required")) {
          detailedMessage = message.toLowerCase();
        } else if (message.toLowerCase().includes("required")) {
          detailedMessage = `${fieldName} is required`;
        } else if (message.toLowerCase().includes("invalid email format")) {
          detailedMessage = "email must be a valid email address";
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
