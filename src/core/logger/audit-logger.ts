import type { Request } from "express";
import { logger } from "./index.js";
import {
  auditLogRepository,
  type AuditLogSeverity,
  type AuditLogCategory,
  type AuditLogOutcome,
  type CreateAuditLogDbInput,
} from "../../database/repositories/audit-log.repository.js";

const SENSITIVE_KEY_REGEX = /^(password|password_hash|token|access_token|refresh_token|authorization|cookie|secret|jwt_secret|credit_card|card_number|cvv|api_key)$/i;

/**
 * Recursively deep-redacts sensitive keys from metadata objects.
 */
export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      result[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      result[key] = redactSensitiveData(val);
    } else if (typeof val === "string" && val.length > 2000) {
      // Prevent payload ballooning in metadata
      result[key] = `${val.substring(0, 2000)}... [TRUNCATED]`;
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Sanitizes untrusted strings to prevent log injection (CRLF injection / control chars).
 */
export function sanitizeLogText(text: string): string {
  if (!text || typeof text !== "string") return "";
  // Strip control characters while preserving standard whitespace
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export interface AuditLogOptions {
  severity?: AuditLogSeverity;
  category?: AuditLogCategory;
  action: string;
  source?: string;
  actor_id?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  target_id?: string | null;
  target_type?: string | null;
  outcome?: AuditLogOutcome;
  message: string;
  request_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
  stack_trace?: string | null | undefined;
}

/**
 * Centralized audit logger function.
 * Logs structured output to Pino and asynchronously persists to PostgreSQL.
 * Guaranteed never to throw or break ongoing request execution.
 */
export async function logAudit(options: AuditLogOptions): Promise<void> {
  const severity: AuditLogSeverity = options.severity || "info";
  const category: AuditLogCategory = options.category || "system";
  const outcome: AuditLogOutcome = options.outcome || "success";
  const message = sanitizeLogText(options.message);
  const action = sanitizeLogText(options.action);
  const source = sanitizeLogText(options.source || "api");

  const safeMetadata = options.metadata
    ? (redactSensitiveData(options.metadata) as Record<string, unknown>)
    : {};

  // 1. Structured Pino logging
  const logPayload = {
    category,
    action,
    source,
    outcome,
    actorId: options.actor_id,
    actorEmail: options.actor_email,
    actorRole: options.actor_role,
    targetId: options.target_id,
    targetType: options.target_type,
    requestId: options.request_id,
    ip: options.ip_address,
    metadata: safeMetadata,
  };

  switch (severity) {
    case "critical":
    case "error":
      logger.error(logPayload, message);
      break;
    case "warn":
      logger.warn(logPayload, message);
      break;
    case "debug":
      logger.debug(logPayload, message);
      break;
    case "info":
    default:
      logger.info(logPayload, message);
      break;
  }

  // 2. Asynchronous database persistence (error-shielded)
  const dbRecord: CreateAuditLogDbInput = {
    severity,
    category,
    action,
    source,
    actor_id: options.actor_id || null,
    actor_email: options.actor_email ? sanitizeLogText(options.actor_email) : null,
    actor_role: options.actor_role ? sanitizeLogText(options.actor_role) : null,
    target_id: options.target_id ? sanitizeLogText(options.target_id) : null,
    target_type: options.target_type ? sanitizeLogText(options.target_type) : null,
    outcome,
    message,
    request_id: options.request_id || null,
    ip_address: options.ip_address || null,
    user_agent: options.user_agent ? options.user_agent.substring(0, 500) : null,
    metadata: safeMetadata,
    stack_trace: options.stack_trace ? options.stack_trace.substring(0, 5000) : null,
  };

  try {
    await auditLogRepository.create(dbRecord);
  } catch (err: unknown) {
    // Failures to write logs must NEVER break normal application operations
    logger.warn(
      {
        errName: (err as Error)?.name,
        errMsg: (err as Error)?.message,
        action,
      },
      "Audit log database persistence failed; preserved in console stream only",
    );
  }
}

/**
 * Convenience helper to record an audit log directly from an active Express Request.
 */
export async function logAuditFromReq(
  req: Request,
  options: Omit<AuditLogOptions, "request_id" | "ip_address" | "user_agent" | "actor_id" | "actor_email" | "actor_role"> & {
    actor_id?: string | null;
    actor_email?: string | null;
    actor_role?: string | null;
  },
): Promise<void> {
  const user = req.user;
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null;

  const userAgent = req.headers["user-agent"] || null;
  const requestId =
    (req.id !== undefined && req.id !== null ? String(req.id) : null) ||
    (req.headers["x-request-id"] as string) ||
    null;

  return logAudit({
    ...options,
    actor_id: options.actor_id !== undefined ? options.actor_id : user?.id || null,
    actor_email: options.actor_email !== undefined ? options.actor_email : user?.email || null,
    actor_role: options.actor_role !== undefined ? options.actor_role : user?.role || null,
    request_id: requestId,
    ip_address: ip,
    user_agent: userAgent,
  });
}
