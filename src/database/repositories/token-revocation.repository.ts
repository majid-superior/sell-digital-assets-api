import { BaseRepository } from "./base.repository.js";

export interface RevokedTokenEntity {
  jti: string;
  user_id?: string | null;
  expires_at: Date | string;
  created_at: Date | string;
}

export class TokenRevocationRepository extends BaseRepository<RevokedTokenEntity> {
  async revokeJti(jti: string, expiresAt: Date, userId?: string): Promise<void> {
    if (!jti) return;
    try {
      await this.query(
        `INSERT INTO revoked_tokens (jti, user_id, expires_at, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (jti) DO UPDATE
           SET expires_at = EXCLUDED.expires_at,
               created_at = CURRENT_TIMESTAMP`,
        [jti, userId || null, expiresAt.toISOString()],
      );
    } catch {
      // Fallback handled by in-memory map if DB connection is temporarily unavailable
    }
  }

  async isJtiRevoked(jti: string): Promise<boolean> {
    if (!jti) return false;
    try {
      const result = await this.query<{ jti: string }>(
        `SELECT jti FROM revoked_tokens WHERE jti = $1 AND expires_at > CURRENT_TIMESTAMP LIMIT 1`,
        [jti],
      );
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }

  async revokeAllForUser(userId: string, ttlDays = 30): Promise<number> {
    const nowMs = Date.now();
    const createdAtIso = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + ttlDays * 24 * 60 * 60 * 1000);
    const epochKey = `user_epoch:${userId}`;
    try {
      const res = await this.query<{ epoch_ms: string }>(
        `INSERT INTO revoked_tokens (jti, user_id, expires_at, created_at)
         VALUES ($1, $2, $3, $4::timestamptz)
         ON CONFLICT (jti) DO UPDATE
           SET expires_at = EXCLUDED.expires_at,
               created_at = EXCLUDED.created_at
         RETURNING (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS epoch_ms`,
        [epochKey, userId, expiresAt.toISOString(), createdAtIso],
      );
      const dbEpochMs = res.rows[0]?.epoch_ms ? Number(res.rows[0].epoch_ms) : nowMs;
      return dbEpochMs;
    } catch {
      return nowMs;
    }
  }

  async getUserRevocationEpochMs(userId: string): Promise<number | null> {
    if (!userId) return null;
    try {
      const epochKey = `user_epoch:${userId}`;
      const res = await this.query<{ epoch_ms: string }>(
        `SELECT (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS epoch_ms
         FROM revoked_tokens
         WHERE jti = $1 AND expires_at > CURRENT_TIMESTAMP
         LIMIT 1`,
        [epochKey],
      );
      return res.rows[0]?.epoch_ms ? Number(res.rows[0].epoch_ms) : null;
    } catch {
      return null;
    }
  }

  async loadActiveRevocations(): Promise<Array<{ jti: string; expMs: number; createdMs: number }>> {
    try {
      await this.query(`DELETE FROM revoked_tokens WHERE expires_at <= CURRENT_TIMESTAMP`);
      const res = await this.query<{ jti: string; exp_ms: string; created_ms: string }>(
        `SELECT jti,
                (EXTRACT(EPOCH FROM expires_at) * 1000)::bigint AS exp_ms,
                (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS created_ms
         FROM revoked_tokens
         WHERE expires_at > CURRENT_TIMESTAMP`,
      );
      return res.rows.map((r) => ({
        jti: r.jti,
        expMs: Number(r.exp_ms),
        createdMs: Number(r.created_ms),
      }));
    } catch {
      return [];
    }
  }
}

export const tokenRevocationRepository = new TokenRevocationRepository();

