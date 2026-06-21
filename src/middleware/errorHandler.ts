import { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma/client";
import { AppError, ValidationError } from "../utils/errors";

// Map Prisma error codes to HTTP status and messages
const prismaErrorMap: Record<string, { status: number; message: string }> = {
  P2000: { status: 400, message: "Input value too long for field" },
  P2001: { status: 404, message: "Record not found" },
  P2002: { status: 409, message: "Unique constraint violation" },
  P2003: { status: 400, message: "Foreign key constraint violation" },
  P2004: { status: 400, message: "Constraint violation" },
  P2005: { status: 400, message: "Invalid value for field" },
  P2006: { status: 400, message: "Invalid value for field type" },
  P2007: { status: 400, message: "Data validation error" },
  P2008: { status: 400, message: "Failed to parse query" },
  P2009: { status: 400, message: "Failed to validate query" },
  P2010: { status: 500, message: "Raw query failed" },
  P2011: { status: 400, message: "Null constraint violation" },
  P2012: { status: 400, message: "Missing required field" },
  P2013: { status: 400, message: "Missing required argument" },
  P2014: { status: 400, message: "Relation violation" },
  P2015: { status: 404, message: "Record not found" },
  P2016: { status: 400, message: "Query interpretation error" },
  P2017: { status: 400, message: "Records not connected" },
  P2018: { status: 400, message: "Required connected records not found" },
  P2019: { status: 400, message: "Input error" },
  P2020: { status: 400, message: "Value out of range" },
  P2021: { status: 400, message: "Table not found" },
  P2022: { status: 400, message: "Column not found" },
  P2023: { status: 400, message: "Inconsistent column data" },
  P2024: { status: 429, message: "Timeout" },
  P2025: { status: 404, message: "Record to update/delete not found" },
  P2026: { status: 400, message: "Unsupported feature" },
  P2027: { status: 400, message: "Multiple errors" },
  P2028: { status: 400, message: "Transaction API error" },
  P2029: { status: 400, message: "Invalid connection string" },
  P2030: { status: 400, message: "Fulltext index not found" },
  P2031: { status: 400, message: "MongoDB error" },
  P2032: { status: 400, message: "Invalid JSON" },
  P2033: { status: 400, message: "Invalid UUID" },
  P2034: { status: 409, message: "Transaction conflict" },
};

export function errorHandler(
  err: Error | AppError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Default error values
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: Record<string, string> | string[] | undefined = undefined;

  // 1. Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }

  // 2. Handle Prisma known errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = prismaErrorMap[err.code];
    if (mapped) {
      statusCode = mapped.status;
      message = mapped.message;
      // Additional details from Prisma
      if (err.meta) {
        // You can include meta information if needed
        errors = { detail: JSON.stringify(err.meta) };
      }
    } else {
      // Unknown Prisma error
      message = `Database error: ${err.message}`;
    }
  }

  // 3. Handle Prisma validation errors (e.g., missing fields)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Validation Error";
    errors = { details: err.message };
  }

  // 4. Handle other errors (e.g., JWT, bcrypt, etc.)
  else {
    // Check for known node errors
    if (
      err.message?.includes("Unexpected token") ||
      err.message?.includes("invalid JSON")
    ) {
      statusCode = 400;
      message = "Invalid JSON payload";
    } else if (err.message?.includes("jwt")) {
      statusCode = 401;
      message = "Invalid or expired token";
    }
    // Otherwise, keep as 500
  }

  // Log error for debugging (use a logger in production)
  console.error("Error:", {
    statusCode,
    message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Send response
  const responseBody: any = {
    success: false,
    statusCode,
    message,
  };

  if (errors) {
    responseBody.errors = errors;
  }

  // Include stack trace only in development
  if (process.env.NODE_ENV === "development" && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
}
