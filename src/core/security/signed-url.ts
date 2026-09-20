import crypto from "node:crypto";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";

const DEFAULT_EXPIRY_MINUTES = 15;

const SignedDownloadPayloadSchema = z.object({
  assetId: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

export type SignedDownloadPayload = z.infer<typeof SignedDownloadPayloadSchema>;

export function generateSignedDownloadToken(
  assetId: string,
  userId: string,
  expiresInMinutes: number = DEFAULT_EXPIRY_MINUTES,
): { token: string; expiresAt: string } {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  const payloadData: SignedDownloadPayload = {
    assetId,
    userId,
    expiresAt,
  };

  const payloadString = JSON.stringify(payloadData);
  const base64Payload = Buffer.from(payloadString).toString("base64url");

  const signature = crypto
    .createHmac("sha256", env.DOWNLOAD_TOKEN_SECRET)
    .update(base64Payload)
    .digest("base64url");

  const token = `${base64Payload}.${signature}`;

  return {
    token,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export function verifySignedDownloadToken(token: string): SignedDownloadPayload {
  if (!token || typeof token !== "string") {
    throw new AppError("Invalid or missing download token", 400);
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new AppError("Malformed download token structure", 400);
  }

  const [base64Payload, providedSignature] = parts;
  if (!base64Payload || !providedSignature) {
    throw new AppError("Malformed download token structure", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.DOWNLOAD_TOKEN_SECRET)
    .update(base64Payload)
    .digest("base64url");

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new AppError("Download token signature verification failed (tampered token)", 403);
  }

  try {
    const payloadString = Buffer.from(base64Payload, "base64url").toString("utf-8");
    const rawParsed = JSON.parse(payloadString);
    const parseResult = SignedDownloadPayloadSchema.safeParse(rawParsed);

    if (!parseResult.success) {
      throw new AppError("Invalid download token payload structure", 400);
    }

    const payload = parseResult.data;

    if (Date.now() > payload.expiresAt) {
      throw new AppError("Download link has expired. Please generate a new download link.", 410);
    }

    return payload;
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError("Failed to parse download token payload", 400);
  }
}
