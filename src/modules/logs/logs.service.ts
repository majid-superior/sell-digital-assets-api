import {
  auditLogRepository,
  type AuditLogEntity,
  type AuditLogStats,
} from "../../database/repositories/audit-log.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import { logAudit } from "../../core/logger/audit-logger.js";
import type { LogsQueryInput } from "./logs.schema.js";

export class LogsService {
  async getLogs(query: LogsQueryInput): Promise<{
    logs: AuditLogEntity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: AuditLogStats;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { logs, total, stats } = await auditLogRepository.findMany({
      page,
      limit,
      search: query.search,
      severity: query.severity,
      category: query.category,
      outcome: query.outcome,
      source: query.source,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats,
    };
  }

  async getLogById(id: string): Promise<AuditLogEntity> {
    const log = await auditLogRepository.findById(id);
    if (!log) {
      throw new AppError("The requested log record could not be found.", 404);
    }
    return log;
  }

  async cleanupLogs(
    retentionDays: number,
    actor?: { id: string; email: string; role: string },
  ): Promise<{ deletedCount: number }> {
    const deletedCount = await auditLogRepository.deleteOlderThan(retentionDays);

    await logAudit({
      severity: "warn",
      category: "admin",
      action: "logs.retention_cleanup",
      source: "admin",
      actor_id: actor?.id || null,
      actor_email: actor?.email || null,
      actor_role: actor?.role || null,
      outcome: "success",
      message: `Audit logs retention purge executed: removed ${deletedCount} records older than ${retentionDays} days`,
      metadata: { retentionDays, deletedCount },
    });

    return { deletedCount };
  }
}

export const logsService = new LogsService();

