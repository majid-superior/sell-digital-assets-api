import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const incomingId = req.header("X-Request-ID");
  const isValid = incomingId && /^[a-zA-Z0-9_-]{1,64}$/.test(incomingId);
  const requestId = isValid ? incomingId : crypto.randomUUID();

  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
};
