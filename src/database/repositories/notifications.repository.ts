import { BaseRepository } from "./base.repository.js";
import type { NotificationEntity } from "../types.js";

export class NotificationsRepository extends BaseRepository<NotificationEntity> {
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown> | undefined;
  }): Promise<NotificationEntity> {
    const sql = `
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING *;
    `;
    const res = await this.query<NotificationEntity>(sql, [
      data.userId,
      data.type,
      data.title,
      data.message,
      JSON.stringify(data.data || {}),
    ]);
    return res.rows[0]!;
  }

  async createForAdmins(data: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown> | undefined;
  }): Promise<number> {
    const sql = `
      INSERT INTO notifications (user_id, type, title, message, data)
      SELECT u.id, $1, $2, $3, $4::jsonb
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.slug = 'admin' AND u.status = 'active';
    `;
    const res = await this.query(sql, [
      data.type,
      data.title,
      data.message,
      JSON.stringify(data.data || {}),
    ]);
    return res.rowCount ?? 0;
  }

  async findByUser(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; page?: number } = {},
  ): Promise<{ data: NotificationEntity[]; total: number; unreadCount: number }> {
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const page = Math.max(1, options.page ?? 1);
    const offset = (page - 1) * limit;

    const conditions: string[] = ["user_id = $1"];
    const params: unknown[] = [userId];

    if (options.unreadOnly) {
      conditions.push("is_read = FALSE");
    }

    const where = conditions.join(" AND ");

    const countSql = `SELECT COUNT(*)::int AS total FROM notifications WHERE ${where};`;
    const countRes = await this.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    const unreadSql = `SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = $1 AND is_read = FALSE;`;
    const unreadRes = await this.query<{ unread: number }>(unreadSql, [userId]);
    const unreadCount = unreadRes.rows[0]?.unread ?? 0;

    const dataSql = `
      SELECT *
      FROM notifications
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const dataRes = await this.query<NotificationEntity>(dataSql, [
      ...params,
      limit,
      offset,
    ]);

    return {
      data: dataRes.rows,
      total,
      unreadCount,
    };
  }

  async markAsRead(id: string, userId: string): Promise<NotificationEntity | null> {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const res = await this.query<NotificationEntity>(sql, [id, userId]);
    return res.rows[0] || null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = FALSE;
    `;
    const res = await this.query(sql, [userId]);
    return res.rowCount ?? 0;
  }
}

export const notificationsRepository = new NotificationsRepository();
