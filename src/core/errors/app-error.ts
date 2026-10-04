export class AppError extends Error {
  public override readonly name: string = "AppError";
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: unknown,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
