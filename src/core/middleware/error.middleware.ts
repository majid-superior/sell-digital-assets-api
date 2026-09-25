import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";
import { logger } from "../logger/index.js";
import { renderErrorPage } from "../../pages/error.page.js";

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
}

export const errorMiddleware = (
  err: Error | AppError | DatabaseError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = env.NODE_ENV === "production";
  const requestId = req.id;
  const isAppError = err instanceof AppError;
  const isOperational = isAppError && err.isOperational;

  // Unexpected or non-operational errors must ALWAYS be logged as errors in all environments
  if (!isOperational) {
    logger.error(
      {
        requestId,
        errName: err.name,
        errMessage: err.message,
        stack: err.stack,
      },
      `Unhandled error on ${req.method} ${req.originalUrl}`,
    );
  } else if (!isProduction) {
    logger.warn(
      {
        requestId,
        errName: err.name,
        errMessage: err.message,
        details: err.details,
      },
      `Operational error on ${req.method} ${req.originalUrl}`,
    );
  }

  // 1. Operational AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(requestId ? { requestId } : {}),
      ...(env.EXPOSE_STACK ? { stack: err.stack } : {}),
    });
    return;
  }

  // 2. Payload Too Large
  if ((err as { type?: string }).type === "entity.too.large") {
    res.status(413).json({
      success: false,
      status: "fail",
      message: `Request payload exceeds the maximum allowed limit (${env.BODY_LIMIT})`,
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 3. Syntax Error (Malformed JSON)
  if (err instanceof SyntaxError && "status" in err && (err as { status: number }).status === 400) {
    res.status(400).json({
      success: false,
      status: "fail",
      message: "Malformed JSON payload in request body",
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 4. JWT Errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      status: "fail",
      message: "Invalid authentication token",
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      status: "fail",
      message: "Authentication token has expired",
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 5. PostgreSQL Known Error Codes
  const dbErr = err as DatabaseError;
  if (dbErr.code) {
    switch (dbErr.code) {
      case "23505":
        res.status(409).json({
          success: false,
          status: "fail",
          message: "A resource with these unique credentials already exists",
          ...(requestId ? { requestId } : {}),
        });
        return;
      case "23503":
        res.status(400).json({
          success: false,
          status: "fail",
          message: "Referenced resource does not exist",
          ...(requestId ? { requestId } : {}),
        });
        return;
      case "22P02":
        res.status(400).json({
          success: false,
          status: "fail",
          message: "Invalid identifier or data type format",
          ...(requestId ? { requestId } : {}),
        });
        return;
    }
  }

  // 6. Generic Fallback
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  const message = isProduction
    ? "Internal Server Error"
    : err.message || "An unexpected error occurred";

  const isApiRoute = req.path.startsWith("/api/") || req.path === "/api";
  const isDocRoute = req.path.startsWith("/doc");
  const acceptsHtml = req.accepts(["json", "html"]) === "html";

  if (!isApiRoute && !isDocRoute && acceptsHtml) {
    res
      .status(statusCode)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(renderErrorPage(req.originalUrl, statusCode, message));
    return;
  }

  res.status(statusCode).json({
    success: false,
    status: "error",
    message,
    ...(requestId ? { requestId } : {}),
    ...(env.EXPOSE_STACK ? { stack: err.stack } : {}),
  });
};
