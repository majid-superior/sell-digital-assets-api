import { BaseRepository } from "./base.repository.js";

export interface UserEntity {
  id: string;
  role_id: number;
  role: string; // Dynamic role slug ('customer', 'seller', 'admin')
  role_name?: string;
  name: string;
  email: string;
  password_hash?: string | null;
  auth_provider: string;
  status: string; // 'active', 'pending', 'suspended', 'banned'
  email_verified_at?: Date | string | null;
  failed_login_attempts?: number;
  locked_until?: Date | string | null;
  last_login_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string | null;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function resolveRoleId(roleOrId?: string | number): number {
  if (typeof roleOrId === "number") return roleOrId;
  const normalized = (roleOrId || "customer").toLowerCase().trim();
  switch (normalized) {
    case "admin":
      return 3;
    case "seller":
    case "creator":
      return 2;
    case "customer":
    case "user":
    default:
      return 1;
  }
}

export class UserRepository extends BaseRepository<UserEntity> {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.query<UserEntity>(
      `SELECT id, role_id, role, role_name, name, email, password_hash, auth_provider, status, 
              email_verified_at, failed_login_attempts, locked_until, last_login_at, 
              created_at, updated_at, deleted_at 
       FROM view_users 
       WHERE email = $1 AND deleted_at IS NULL 
       LIMIT 1`,
      [email.toLowerCase().trim()],
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.query<UserEntity>(
      `SELECT id, role_id, role, role_name, name, email, password_hash, auth_provider, status, 
              email_verified_at, failed_login_attempts, locked_until, last_login_at, 
              created_at, updated_at, deleted_at 
       FROM view_users 
       WHERE id = $1 AND deleted_at IS NULL 
       LIMIT 1`,
      [id],
    );
    return result.rows[0] || null;
  }

  async findAll(params: PaginationQuery = {}): Promise<PaginatedResult<Omit<UserEntity, "password_hash">>> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const [countRes, dataRes] = await Promise.all([
      this.query<{ count: string }>("SELECT COUNT(*) FROM view_users WHERE deleted_at IS NULL"),
      this.query<Omit<UserEntity, "password_hash">>(
        `SELECT id, role_id, role, role_name, name, email, auth_provider, status, 
                email_verified_at, last_login_at, created_at, updated_at 
         FROM view_users 
         WHERE deleted_at IS NULL 
         ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
    ]);

    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    return {
      data: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash?: string | null;
    role?: string | number;
    authProvider?: string;
    status?: string;
  }): Promise<UserEntity> {
    const roleId = resolveRoleId(data.role);
    const authProvider = data.authProvider || "local";
    const status = data.status || "active";

    const insertRes = await this.query<{ id: string }>(
      `INSERT INTO users (role_id, name, email, password_hash, auth_provider, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [
        roleId,
        data.name.trim(),
        data.email.toLowerCase().trim(),
        data.passwordHash || null,
        authProvider,
        status,
      ],
    );

    const createdUser = await this.findById(insertRes.rows[0]!.id);
    return createdUser!;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP, failed_login_attempts = 0 WHERE id = $1",
      [id],
    );
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.query(
      "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const userRepository = new UserRepository();
