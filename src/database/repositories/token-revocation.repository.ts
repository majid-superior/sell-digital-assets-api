import { BaseRepository } from "./base.repository.js";

export interface RevokedTokenEntity {
  jti: string;
  user_id?: string | null;
  expires_at: Date | string;
  created_at: Date | string;
}

export class TokenRevocationRepository extends BaseRepository<RevokedTokenEntity> {
  private tableEnsured = false;
  private ensurePromise: Promise<void> | null = null;

  private async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;
    if (this.ensurePromise) return this.ensurePromise;

    this.ensurePromise = (async () => {
      try {
        await this.query(`
          CREATE TABLE IF NOT EXISTS revoked_tokens (
            jti VARCHAR(128) PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens (expires_at);
          CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens (user_id);
        `);
        this.tableEnsured = true;
      } catch {
        // Ignore transient connection startup errors; will retry on next operation
      } finally {
        this.ensurePromise = null;
      }
    })();

    return this.ensurePromise;
  }

  async revokeJti(jti: string, expiresAt: Date, userId?: string): Promise<void> {
    if (!jti) return;
    try {
      await this.ensureTable();
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
      await this.ensureTable();
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
    const expiresAt = new Date(nowMs + ttlDays * 24 * 60 * 60 * 1000);
    const epochKey = `user_epoch:${userId}`;
    try {
      await this.ensureTable();
      const res = await this.query<{ epoch_ms: string }>(
        `INSERT INTO revoked_tokens (jti, user_id, expires_at, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (jti) DO UPDATE
           SET expires_at = EXCLUDED.expires_at,
               created_at = CURRENT_TIMESTAMP
         RETURNING (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS epoch_ms`,
        [epochKey, userId, expiresAt.toISOString()],
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
      await this.ensureTable();
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
      await this.ensureTable();
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

