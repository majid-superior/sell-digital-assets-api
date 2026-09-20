import { BaseRepository } from "./base.repository.js";

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: string;
  created_at: Date;
  updated_at: Date;
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

export class UserRepository extends BaseRepository<UserEntity> {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.query<UserEntity>(
      "SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1 LIMIT 1",
      [email.toLowerCase().trim()],
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.query<UserEntity>(
      "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] || null;
  }

  async findAll(params: PaginationQuery = {}): Promise<PaginatedResult<Omit<UserEntity, "password_hash">>> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const [countRes, dataRes] = await Promise.all([
      this.query<{ count: string }>("SELECT COUNT(*) FROM users"),
      this.query<Omit<UserEntity, "password_hash">>(
        "SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
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
    role?: string;
  }): Promise<UserEntity> {
    const result = await this.query<UserEntity>(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, password_hash, role, created_at, updated_at",
      [data.name.trim(), data.email.toLowerCase().trim(), data.passwordHash || null, data.role || "user"],
    );
    return result.rows[0]!;
  }
}

export const userRepository = new UserRepository();
