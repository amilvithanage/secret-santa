import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@secret-santa/shared-types';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'boolean';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check if required field is missing
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Check for empty string on required fields
      if (rule.required && value === '') {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${rule.field} must be a string`);
            }
            break;
          case 'number':
            if (typeof value !== 'number' && !Number.isFinite(Number(value))) {
              errors.push(`${rule.field} must be a number`);
            }
            break;
          case 'email':
            if (typeof value !== 'string' || !isValidEmail(value)) {
              errors.push(`${rule.field} must be a valid email address`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${rule.field} must be a boolean`);
            }
            break;
        }
      }

      // Length validation for strings
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be no more than ${rule.maxLength} characters long`);
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`);
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors.push(typeof customResult === 'string' ? customResult : `${rule.field} is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: errors.join(', '),
      } as ApiResponse);
      return;
    }

    next();
  };
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Common validation rules
export const participantValidationRules = {
  create: [
    { field: 'name', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    { field: 'email', required: true, type: 'email' as const, maxLength: 255 },
  ],
  update: [
    { field: 'name', type: 'string' as const, minLength: 1, maxLength: 100 },
    { field: 'email', type: 'email' as const, maxLength: 255 },
  ],
};
