import { BaseRepository } from "./base.repository.js";

export type AuditLogSeverity = "debug" | "info" | "warn" | "error" | "critical";
export type AuditLogCategory = "auth" | "admin" | "security" | "system" | "error";
export type AuditLogOutcome = "success" | "failure" | "denied" | "error";

export interface AuditLogEntity {
  id: string;
  created_at: Date | string;
  severity: AuditLogSeverity;
  category: AuditLogCategory;
  action: string;
  source: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  target_id: string | null;
  target_type: string | null;
  outcome: AuditLogOutcome;
  message: string;
  request_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  stack_trace: string | null;
}

export interface CreateAuditLogDbInput {
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
  stack_trace?: string | null;
}

export interface FindAuditLogsOptions {
  page: number;
  limit: number;
  search?: string | undefined;
  severity?: AuditLogSeverity | "all" | undefined;
  category?: AuditLogCategory | "all" | undefined;
  outcome?: AuditLogOutcome | "all" | undefined;
  source?: string | undefined;
  startDate?: string | Date | undefined;
  endDate?: string | Date | undefined;
  sortBy?: "created_at" | "severity" | "category" | "action" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

export interface AuditLogStats {
  total: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  authCount: number;
  adminCount: number;
  securityCount: number;
}

export class AuditLogRepository extends BaseRepository<AuditLogEntity> {
  async create(input: CreateAuditLogDbInput): Promise<AuditLogEntity> {
    const queryText = `
      INSERT INTO audit_logs (
        severity,
        category,
        action,
        source,
        actor_id,
        actor_email,
        actor_role,
        target_id,
        target_type,
        outcome,
        message,
        request_id,
        ip_address,
        user_agent,
        metadata,
        stack_trace
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15::jsonb, $16
      )
      RETURNING *;
    `;

    const values = [
      input.severity || "info",
      input.category || "system",
      input.action,
      input.source || "api",
      input.actor_id || null,
      input.actor_email ? input.actor_email.toLowerCase() : null,
      input.actor_role || null,
      input.target_id || null,
      input.target_type || null,
      input.outcome || "success",
      input.message,
      input.request_id || null,
      input.ip_address || null,
      input.user_agent || null,
      JSON.stringify(input.metadata || {}),
      input.stack_trace || null,
    ];

    const result = await this.query<AuditLogEntity>(queryText, values);
    return result.rows[0]!;
  }

  async findById(id: string): Promise<AuditLogEntity | null> {
    const queryText = `SELECT * FROM audit_logs WHERE id = $1 LIMIT 1;`;
    const result = await this.query<AuditLogEntity>(queryText, [id]);
    return result.rows[0] || null;
  }

  async findMany(options: FindAuditLogsOptions): Promise<{
    logs: AuditLogEntity[];
    total: number;
    stats: AuditLogStats;
  }> {
    const {
      page,
      limit,
      search,
      severity,
      category,
      outcome,
      source,
      startDate,
      endDate,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    const offset = (Math.max(1, page) - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search && search.trim()) {
      params.push(`%${this.escapeLike(search.trim())}%`);
      const pIdx = params.length;
      conditions.push(`(
        message ILIKE $${pIdx} OR
        action ILIKE $${pIdx} OR
        actor_email ILIKE $${pIdx} OR
        target_id ILIKE $${pIdx} OR
        request_id ILIKE $${pIdx} OR
        source ILIKE $${pIdx}
      )`);
    }

    if (severity && severity !== "all") {
      params.push(severity);
      conditions.push(`severity = $${params.length}`);
    }

    if (category && category !== "all") {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (outcome && outcome !== "all") {
      params.push(outcome);
      conditions.push(`outcome = $${params.length}`);
    }

    if (source && source.trim()) {
      params.push(source.trim());
      conditions.push(`source = $${params.length}`);
    }

    if (startDate) {
      params.push(new Date(startDate).toISOString());
      conditions.push(`created_at >= $${params.length}`);
    }

    if (endDate) {
      params.push(new Date(endDate).toISOString());
      conditions.push(`created_at <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const safeSortColumns: Record<string, string> = {
      created_at: "created_at",
      severity: "severity",
      category: "category",
      action: "action",
    };
    const sortCol = safeSortColumns[sortBy] || "created_at";
    const sortDir = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // 1. Fetch paginated records
    const listParams = [...params, limit, offset];
    const listQuery = `
      SELECT *
      FROM audit_logs
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}, id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;

    // 2. Count total matches for current filter
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM audit_logs
      ${whereClause};
    `;

    // 3. Overall platform statistics
    const statsQuery = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN severity IN ('error', 'critical') THEN 1 END)::int AS "errorCount",
        COUNT(CASE WHEN severity = 'warn' THEN 1 END)::int AS "warnCount",
        COUNT(CASE WHEN severity = 'info' THEN 1 END)::int AS "infoCount",
        COUNT(CASE WHEN category = 'auth' THEN 1 END)::int AS "authCount",
        COUNT(CASE WHEN category = 'admin' THEN 1 END)::int AS "adminCount",
        COUNT(CASE WHEN category = 'security' THEN 1 END)::int AS "securityCount"
      FROM audit_logs;
    `;

    const [listRes, countRes, statsRes] = await Promise.all([
      this.query<AuditLogEntity>(listQuery, listParams),
      this.query<{ total: number }>(countQuery, params),
      this.query<AuditLogStats>(statsQuery),
    ]);

    const total = countRes.rows[0]?.total ?? 0;
    const stats = statsRes.rows[0] ?? {
      total: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      authCount: 0,
      adminCount: 0,
      securityCount: 0,
    };

    return {
      logs: listRes.rows,
      total,
      stats,
    };
  }

  async deleteOlderThan(days: number): Promise<number> {
    if (days < 7) {
      throw new Error("Log retention policy prevents deleting records newer than 7 days");
    }

    const queryText = `
      DELETE FROM audit_logs
      WHERE created_at < NOW() - ($1 || ' days')::interval;
    `;
    const result = await this.query(queryText, [days]);
    return result.rowCount ?? 0;
  }
}

export const auditLogRepository = new AuditLogRepository();
