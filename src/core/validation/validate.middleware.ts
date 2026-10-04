import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export interface SchemaMiddleware {
  (req: Request, _res: Response, next: NextFunction): void;
  _validatorType?: "body" | "query" | "params";
  _zodSchema?: ZodSchema;
}

export const validateBody = (schema: ZodSchema): SchemaMiddleware => {
  const middleware: SchemaMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = (result.error as ZodError).flatten();
      return next(new AppError("Validation failed", 400, formattedErrors));
    }
    req.body = result.data;
    next();
  };
  middleware._validatorType = "body";
  middleware._zodSchema = schema;
  return middleware;
};

export const validateQuery = (schema: ZodSchema): SchemaMiddleware => {
  const middleware: SchemaMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const formattedErrors = (result.error as ZodError).flatten();
      return next(new AppError("Query parameter validation failed", 400, formattedErrors));
    }
    const validatedQuery = result.data as Record<string, any>;
    try {
      req.query = validatedQuery;
    } catch {
      Object.defineProperty(req, "query", {
        value: validatedQuery,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  };
  middleware._validatorType = "query";
  middleware._zodSchema = schema;
  return middleware;
};

export const validateParams = (schema: ZodSchema): SchemaMiddleware => {
  const middleware: SchemaMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const formattedErrors = (result.error as ZodError).flatten();
      return next(new AppError("Route parameter validation failed", 400, formattedErrors));
    }
    const validatedParams = result.data as Record<string, string>;
    try {
      req.params = validatedParams;
    } catch {
      Object.defineProperty(req, "params", {
        value: validatedParams,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  };
  middleware._validatorType = "params";
  middleware._zodSchema = schema;
  return middleware;
};

