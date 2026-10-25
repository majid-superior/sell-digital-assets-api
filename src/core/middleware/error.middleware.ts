import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";
import { logger } from "../logger/index.js";
import { renderErrorPage } from "../../pages/error.page.js";

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
}

/**
 * Redacts passwords, connection strings, and sensitive secrets from error text and stacks.
 */
function sanitizeSecrets(text: string): string {
  if (!text) return "";
  return text
    .replace(/postgresql:\/\/[^:]+:([^@]+)@/gi, "postgresql://***:******@")
    .replace(/postgres:\/\/[^:]+:([^@]+)@/gi, "postgres://***:******@")
    .replace(
      /(password|jwt_secret|refresh_secret|download_token_secret|secret)\s*[:=]\s*['"][^'"]+['"]/gi,
      "$1: '******'",
    );
}

/**
 * Checks whether an error is caused by a database connection, network, or DNS failure.
 */
function isDatabaseConnectionError(err: Error | DatabaseError): boolean {
  const code = (err as DatabaseError).code;
  const msg = err.message || "";

  // Known PostgreSQL connection & cluster states
  const pgConnCodes = [
    "08000", // connection_exception
    "08003", // connection_does_not_exist
    "08006", // connection_failure
    "08001", // sqlclient_unable_to_establish_sqlconnection
    "08004", // sqlserver_rejected_establishment_of_sqlconnection
    "28P01", // invalid_password
    "28000", // invalid_authorization_specification
    "3D000", // database does not exist
    "57P01", // admin_shutdown
    "57P02", // crash_shutdown
    "57P03", // cannot_connect_now
  ];

  if (code && pgConnCodes.includes(code)) {
    return true;
  }

  // Node socket / network error codes
  const netCodes = [
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ETIMEDOUT",
    "ECONNRESET",
    "EHOSTUNREACH",
    "ENETUNREACH",
  ];

  if (code && netCodes.includes(code)) {
    return true;
  }

  // Error message patterns
  return (
    /connect ECONNREFUSED/i.test(msg) ||
    /getaddrinfo/i.test(msg) ||
    /connect ETIMEDOUT/i.test(msg) ||
    /connection timeout/i.test(msg) ||
    /timeout expired/i.test(msg) ||
    /Connection terminated unexpectedly/i.test(msg) ||
    /database system is starting up/i.test(msg) ||
    /password authentication failed/i.test(msg) ||
    /database ".*" does not exist/i.test(msg) ||
    /timeout exceeded when trying to connect/i.test(msg) ||
    /terminating connection/i.test(msg)
  );
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

  const sanitizedErrMessage = sanitizeSecrets(err.message || "");
  const sanitizedStack = err.stack ? sanitizeSecrets(err.stack) : undefined;

  // Unexpected or non-operational errors must ALWAYS be logged with sanitized diagnostic details
  if (!isOperational) {
    logger.error(
      {
        requestId,
        errName: err.name,
        errMessage: sanitizedErrMessage,
        stack: sanitizedStack,
      },
      `Unhandled error on ${req.method} ${req.originalUrl}`,
    );
  } else if (!isProduction) {
    logger.warn(
      {
        requestId,
        errName: err.name,
        errMessage: sanitizedErrMessage,
        details: err.details,
      },
      `Operational error on ${req.method} ${req.originalUrl}`,
    );
  }

  // 1. Operational AppError (User-friendly domain business errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(requestId ? { requestId } : {}),
      ...(env.EXPOSE_STACK && sanitizedStack ? { stack: sanitizedStack } : {}),
    });
    return;
  }

  // 2. Database Connection / DNS / Infrastructure Failures (Interception before generic 500)
  if (isDatabaseConnectionError(err)) {
    const isApiRoute = req.path.startsWith("/api/") || req.path === "/api";
    const acceptsHtml = req.accepts(["json", "html"]) === "html";
    const humanMessage = "The service is temporarily unavailable. Please try again in a few moments.";

    if (!isApiRoute && acceptsHtml) {
      res
        .status(503)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(renderErrorPage(req.originalUrl, 503, humanMessage));
      return;
    }

    res.status(503).json({
      success: false,
      status: "error",
      message: humanMessage,
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 3. Payload Too Large (Express Body-Parser)
  if ((err as { type?: string }).type === "entity.too.large") {
    res.status(413).json({
      success: false,
      status: "fail",
      message: `The submitted request payload exceeds the allowed limit (${env.BODY_LIMIT}). Please reduce the payload size or use multipart file uploads.`,
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 4. Multipart Upload Errors (Multer)
  const errCode = (err as { code?: string }).code;
  if (err.name === "MulterError" || (typeof errCode === "string" && errCode.startsWith("LIMIT_"))) {
    let multerStatus = 400;
    let humanMessage = "File upload failed due to invalid multipart submission.";

    switch (errCode) {
      case "LIMIT_FILE_SIZE":
        multerStatus = 413;
        humanMessage = "The uploaded file exceeds the maximum allowed file size limit. Please choose a smaller file or compress it.";
        break;
      case "LIMIT_FILE_COUNT":
        multerStatus = 400;
        humanMessage = "Too many files uploaded in a single request. Please upload files in smaller batches.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        multerStatus = 400;
        humanMessage = "An unexpected file field was encountered in the upload form. Please check the upload requirements.";
        break;
      case "LIMIT_PART_COUNT":
        multerStatus = 400;
        humanMessage = "Too many parts submitted in multipart request. Please reduce the number of fields or files.";
        break;
    }

    res.status(multerStatus).json({
      success: false,
      status: "fail",
      message: humanMessage,
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 5. Syntax Error (Malformed JSON)
  if (err instanceof SyntaxError && "status" in err && (err as { status: number }).status === 400) {
    res.status(400).json({
      success: false,
      status: "fail",
      message: "The request body contains invalid or malformed JSON data.",
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 6. JWT Errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      status: "fail",
      message: "Your session token is invalid or corrupted. Please sign in again.",
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      status: "fail",
      message: "Your session has expired. Please sign in again.",
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 7. PostgreSQL Constraint Sanitization
  const dbErr = err as DatabaseError;
  if (dbErr.code) {
    switch (dbErr.code) {
      case "23505":
        res.status(409).json({
          success: false,
          status: "fail",
          message: "A resource with these unique details already exists.",
          ...(requestId ? { requestId } : {}),
        });
        return;
      case "23503":
        res.status(400).json({
          success: false,
          status: "fail",
          message: "The referenced item could not be found.",
          ...(requestId ? { requestId } : {}),
        });
        return;
      case "23514":
        res.status(400).json({
          success: false,
          status: "fail",
          message: "The provided information does not meet data validation requirements.",
          ...(requestId ? { requestId } : {}),
        });
        return;
      case "23502":
        res.status(400).json({
          success: false,
          status: "fail",
          message: "A required data field was not provided.",
          ...(requestId ? { requestId } : {}),
        });
        return;
      case "22P02":
        res.status(400).json({
          success: false,
          status: "fail",
          message: "Invalid identifier or data type format.",
          ...(requestId ? { requestId } : {}),
        });
        return;
    }
  }

  // 8. Generic Server Fallback (Sanitize technical codes and stack traces)
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  const isTechnicalMsg = /connect|database|sql|pg_|password|syntax|column|table|relation|socket|query|econn/i.test(
    err.message || "",
  );
  const message = isProduction || isTechnicalMsg
    ? "An unexpected server error occurred. Please try again shortly."
    : err.message || "An unexpected error occurred.";

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
    ...(env.EXPOSE_STACK && !isTechnicalMsg && sanitizedStack ? { stack: sanitizedStack } : {}),
  });
};
