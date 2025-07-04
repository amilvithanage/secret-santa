import { Response } from "express";
import {
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from "@secret-santa/shared-types";

export class ResponseHelper {
  /**
   * Send a successful response with data
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200,
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send a successful response for created resources
   */
  static created<T>(res: Response, data: T, message?: string): void {
    ResponseHelper.success(res, data, message, 201);
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    error: string,
    statusCode: number = 400,
    message?: string,
  ): void {
    const response: ApiError = {
      success: false,
      error,
      message,
      statusCode,
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send a paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): void {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  }
}
