import { BaseRepository } from "./base.repository.js";
import { invalidateAuthUserCache } from "../../core/middleware/auth.middleware.js";

export interface RoleEntity {
  id: number;
  name: string;
  slug: string;
  scope: string;
  description: string;
  allow_public_signup?: boolean;
}

export interface PermissionEntity {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string;
  scope: string;
  created_at: Date | string;
}

export interface SellerRolePermissionEntity {
  id: number;
  seller_id: string;
  role_id: number;
  role_slug?: string;
  role_name?: string;
  permissions: string[];
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UserEntity {
  id: string;
  role_id: number;
  role: string; // Dynamic role slug ('customer', 'seller', 'admin', 'store_manager', etc.)
  role_name?: string;
  role_scope?: string;
  role_allow_public_signup?: boolean;
  name: string;
  display_name?: string;
  email: string;
  url?: string;
  parent_seller_id?: string | null;
  allowed_permissions?: string[] | Record<string, unknown>;
  permissions?: string[]; // Authoritative effective permissions resolved dynamically
  is_active?: boolean;
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
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  role?: string | undefined;
  status?: string | undefined;
}

export interface UserCounts {
  total: number;
  sellers: number;
  buyers: number;
  active: number;
}

export interface PaginatedResult<T> {
  data: T[];
  counts?: UserCounts;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function resolveRoleId(roleOrId?: string | number): number {
  if (typeof roleOrId === "number") return roleOrId;
  const normalized = (roleOrId || "BUYER").toUpperCase().trim();
  switch (normalized) {
    case "ADMIN":
      return 1;
    case "SELLER":
      return 2;
    case "BUYER":
    case "CUSTOMER":
      return 3;
    case "STORE_MANAGER":
      return 4;
    case "CONTENT_UPLOADER":
      return 5;
    case "ANALYST":
      return 6;
    case "GUEST":
      return 7;
    default:
      return 3; // Default registered user to 'BUYER' role ID
  }
}

export class UserRepository extends BaseRepository<UserEntity> {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.query<UserEntity>(
      `SELECT id, role_id, role, role_name, role_scope, role_allow_public_signup, 
              name, display_name, email, url, parent_seller_id, allowed_permissions, is_active, 
              password_hash, auth_provider, status, email_verified_at, failed_login_attempts, 
              locked_until, last_login_at, created_at, updated_at, deleted_at 
       FROM view_users 
       WHERE email = $1 AND deleted_at IS NULL 
       LIMIT 1`,
      [email.toLowerCase().trim()],
    );
    const user = result.rows[0] || null;
    if (user) {
      user.permissions = await this.resolveEffectivePermissions(user);
    }
    return user;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.query<UserEntity>(
      `SELECT id, role_id, role, role_name, role_scope, role_allow_public_signup, 
              name, display_name, email, url, parent_seller_id, allowed_permissions, is_active, 
              password_hash, auth_provider, status, email_verified_at, failed_login_attempts, 
              locked_until, last_login_at, created_at, updated_at, deleted_at 
       FROM view_users 
       WHERE id = $1 AND deleted_at IS NULL 
       LIMIT 1`,
      [id],
    );
    const user = result.rows[0] || null;
    if (user) {
      user.permissions = await this.resolveEffectivePermissions(user);
    }
    return user;
  }

  async findActiveAdminPasswordHashes(limit = 5): Promise<string[]> {
    const result = await this.query<{ password_hash: string | null }>(
      `SELECT password_hash
       FROM view_users
       WHERE role = 'admin' AND status = 'active' AND deleted_at IS NULL AND password_hash IS NOT NULL
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map((r) => r.password_hash!).filter(Boolean);
  }

  async findAll(
    params: PaginationQuery = {},
  ): Promise<PaginatedResult<Omit<UserEntity, "password_hash">>> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["deleted_at IS NULL", "role != 'admin'"];
    const values: unknown[] = [];
    let idx = 1;

    if (params.search?.trim()) {
      conditions.push(
        `(name ILIKE $${idx} ESCAPE '\\' OR email ILIKE $${idx} ESCAPE '\\' OR id::text ILIKE $${idx} ESCAPE '\\')`,
      );
      values.push(`%${this.escapeLike(params.search.trim())}%`);
      idx++;
    }

    if (params.role && params.role !== "all") {
      conditions.push(`LOWER(role) = LOWER($${idx})`);
      values.push(params.role);
      idx++;
    }

    if (params.status && params.status !== "all") {
      const normalizedStatus =
        params.status === "deactive" ? "suspended" : params.status.toLowerCase();
      conditions.push(`(LOWER(status) = LOWER($${idx}) OR ($${idx} = 'suspended' AND LOWER(status) = 'deactive'))`);
      values.push(normalizedStatus);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [countsRes, countRes, dataRes] = await Promise.all([
      this.query<{ total: string; sellers: string; buyers: string; active: string }>(
        `SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE LOWER(role) = 'seller') as sellers,
           COUNT(*) FILTER (WHERE LOWER(role) IN ('buyer', 'customer')) as buyers,
           COUNT(*) FILTER (WHERE LOWER(status) = 'active') as active
         FROM view_users 
         WHERE deleted_at IS NULL AND role != 'admin'`,
      ),
      this.query<{ count: string }>(
        `SELECT COUNT(*) FROM view_users ${whereClause}`,
        values,
      ),
      this.query<Omit<UserEntity, "password_hash">>(
        `SELECT id, role_id, role, role_name, name, email, auth_provider, status, 
                email_verified_at, last_login_at, created_at, updated_at 
         FROM view_users 
         ${whereClause} 
         ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset],
      ),
    ]);

    const countsRow = countsRes.rows[0];
    const counts: UserCounts = {
      total: parseInt(countsRow?.total || "0", 10),
      sellers: parseInt(countsRow?.sellers || "0", 10),
      buyers: parseInt(countsRow?.buyers || "0", 10),
      active: parseInt(countsRow?.active || "0", 10),
    };

    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    return {
      data: dataRes.rows,
      counts,
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
    displayName?: string;
    email: string;
    passwordHash?: string | null;
    role?: string | number;
    url?: string;
    parentSellerId?: string | null;
    allowedPermissions?: string[] | Record<string, unknown>;
    isActive?: boolean;
    authProvider?: string;
    status?: string;
    emailVerifiedAt?: Date | null;
  }): Promise<UserEntity> {
    const roleId = resolveRoleId(data.role);
    const authProvider = data.authProvider || "local";
    const status = data.status || "active";
    const emailVerifiedAt = data.emailVerifiedAt === undefined ? new Date() : data.emailVerifiedAt;
    const displayName = (data.displayName || data.name).trim();
    const name = data.name.trim();

    const insertRes = await this.query<{ id: string }>(
      `INSERT INTO users (
         role_id, name, display_name, email, password_hash, url, 
         parent_seller_id, allowed_permissions, is_active, auth_provider, status, email_verified_at
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING id`,
      [
        roleId,
        name,
        displayName,
        data.email.toLowerCase().trim(),
        data.passwordHash || null,
        data.url || "",
        data.parentSellerId || null,
        JSON.stringify(data.allowedPermissions || []),
        data.isActive !== undefined ? data.isActive : true,
        authProvider,
        status,
        emailVerifiedAt,
      ],
    );

    const createdUser = await this.findById(insertRes.rows[0]!.id);
    return createdUser!;
  }

  async findTeamMembers(parentSellerId: string): Promise<UserEntity[]> {
    const result = await this.query<UserEntity>(
      `SELECT id, role_id, role, role_name, role_scope, role_allow_public_signup, 
              name, display_name, email, url, parent_seller_id, allowed_permissions, is_active, 
              auth_provider, status, created_at, updated_at 
       FROM view_users 
       WHERE parent_seller_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at ASC`,
      [parentSellerId],
    );
    const members: UserEntity[] = [];
    for (const m of result.rows) {
      const permissions = await this.resolveEffectivePermissions(m);
      members.push({
        ...m,
        permissions,
      });
    }
    return members;
  }

  async resolveEffectivePermissions(user: {
    id: string;
    role_id: number;
    role: string;
    parent_seller_id?: string | null;
    allowed_permissions?: any;
  }): Promise<string[]> {
    const roleNormalized = (user.role || "").toLowerCase().trim();

    // 1. Platform Admin has full platform and store access
    if (roleNormalized === "admin" || user.role_id === 1) {
      return ["*"];
    }

    // 2. Primary Seller has full authority over their own store
    if ((roleNormalized === "seller" || user.role_id === 2) && !user.parent_seller_id) {
      return ["*"];
    }

    // 3. User with explicitly configured member-specific allowed_permissions array overrides role defaults
    if (Array.isArray(user.allowed_permissions) && user.allowed_permissions.length > 0) {
      return user.allowed_permissions;
    } else if (typeof user.allowed_permissions === "string") {
      try {
        const parsed = JSON.parse(user.allowed_permissions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // ignore parse error
      }
    }

    // 4. If user is store sub-user, check seller_role_permissions configured by parent seller
    if (user.parent_seller_id) {
      const sellerConfigRes = await this.query<{ permissions: any }>(
        `SELECT permissions FROM seller_role_permissions 
         WHERE seller_id = $1 AND role_id = $2 LIMIT 1`,
        [user.parent_seller_id, user.role_id],
      );
      if (sellerConfigRes.rows.length > 0) {
        const perms = sellerConfigRes.rows[0]?.permissions;
        if (Array.isArray(perms) && perms.length > 0) {
          return perms;
        }
      }
    }

    // 5. Fallback to system default role permissions
    const defaults = await this.getRoleDefaultPermissions(user.role_id);
    return defaults[user.role_id] || [];
  }

  async getPermissionsCatalog(): Promise<PermissionEntity[]> {
    const result = await this.query<PermissionEntity>(
      `SELECT id, name, module, action, description, scope, created_at
       FROM permissions
       WHERE scope = 'SELLER_STORE'
       ORDER BY module ASC, id ASC`,
    );
    return result.rows;
  }

  async getRoleDefaultPermissions(roleId?: number): Promise<Record<number, string[]>> {
    const params: unknown[] = [];
    let sql = `SELECT role_id, permission_name FROM role_default_permissions`;
    if (roleId !== undefined) {
      sql += ` WHERE role_id = $1`;
      params.push(roleId);
    }
    const result = await this.query<{ role_id: number; permission_name: string }>(sql, params);
    const map: Record<number, string[]> = {};
    for (const row of result.rows) {
      const list = map[row.role_id] ?? [];
      list.push(row.permission_name);
      map[row.role_id] = list;
    }
    return map;
  }

  async getSellerRolePermissions(sellerId: string): Promise<SellerRolePermissionEntity[]> {
    const result = await this.query<{
      id: number;
      seller_id: string;
      role_id: number;
      role_slug: string;
      role_name: string;
      permissions: any;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT srp.id, srp.seller_id, srp.role_id, r.slug AS role_slug, r.name AS role_name,
              srp.permissions, srp.created_at, srp.updated_at
       FROM seller_role_permissions srp
       JOIN roles r ON srp.role_id = r.id
       WHERE srp.seller_id = $1
       ORDER BY srp.role_id ASC`,
      [sellerId],
    );
    return result.rows.map((row) => ({
      ...row,
      permissions: Array.isArray(row.permissions)
        ? row.permissions
        : typeof row.permissions === "string"
        ? JSON.parse(row.permissions)
        : [],
    }));
  }

  async upsertSellerRolePermissions(
    sellerId: string,
    roleId: number,
    permissions: string[],
  ): Promise<SellerRolePermissionEntity> {
    const result = await this.query<{
      id: number;
      seller_id: string;
      role_id: number;
      permissions: any;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO seller_role_permissions (seller_id, role_id, permissions)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (seller_id, role_id) DO UPDATE
         SET permissions = EXCLUDED.permissions,
             updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [sellerId, roleId, JSON.stringify(permissions)],
    );

    // Invalidate auth cache for all affected sub-users under this seller
    const members = await this.query<{ id: string }>(
      `SELECT id FROM users WHERE parent_seller_id = $1 AND role_id = $2`,
      [sellerId, roleId],
    );
    for (const member of members.rows) {
      invalidateAuthUserCache(member.id);
    }

    const row = result.rows[0];
    if (!row) {
      throw new Error("Failed to save seller role permissions");
    }
    return {
      ...row,
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
    };
  }

  async findStoreRoles(): Promise<RoleEntity[]> {
    const result = await this.query<RoleEntity>(
      `SELECT id, name, slug, scope, description, allow_public_signup
       FROM roles
       WHERE scope = 'SELLER_STORE'
       ORDER BY id ASC`,
    );
    return result.rows;
  }

  async updateLastSignIn(id: string): Promise<void> {
    await this.query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP, failed_login_attempts = 0, locked_until = NULL WHERE id = $1",
      [id],
    );
  }

  async recordFailedSignIn(
    id: string,
    maxAttempts = 5,
    lockDurationMinutes = 15,
  ): Promise<void> {
    await this.query(
      `UPDATE users 
       SET failed_login_attempts = CASE
             WHEN locked_until IS NOT NULL AND locked_until <= CURRENT_TIMESTAMP THEN 1
             ELSE failed_login_attempts + 1
           END,
           locked_until = CASE 
             WHEN (CASE WHEN locked_until IS NOT NULL AND locked_until <= CURRENT_TIMESTAMP THEN 1 ELSE failed_login_attempts + 1 END) >= $2 
             THEN CURRENT_TIMESTAMP + ($3 || ' minutes')::interval 
             WHEN locked_until IS NOT NULL AND locked_until <= CURRENT_TIMESTAMP
             THEN NULL
             ELSE locked_until 
           END
       WHERE id = $1`,
      [id, maxAttempts, lockDurationMinutes],
    );
  }

  async update(
    id: string,
    data: {
      name?: string | undefined;
      displayName?: string | undefined;
      passwordHash?: string | undefined;
      status?: string | undefined;
      role?: string | number | undefined;
      roleId?: number | undefined;
      parentSellerId?: string | null | undefined;
      url?: string | undefined;
      allowedPermissions?: string[] | Record<string, unknown> | undefined;
      isActive?: boolean | undefined;
      emailVerifiedAt?: Date | null | undefined;
    },
  ): Promise<UserEntity | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.displayName !== undefined) {
      fields.push(`display_name = $${idx++}`);
      values.push(data.displayName.trim());
    }
    if (data.passwordHash !== undefined) {
      fields.push(`password_hash = $${idx++}`);
      values.push(data.passwordHash);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.roleId !== undefined) {
      fields.push(`role_id = $${idx++}`);
      values.push(data.roleId);
    } else if (data.role !== undefined) {
      fields.push(`role_id = $${idx++}`);
      values.push(resolveRoleId(data.role));
    }
    if (data.parentSellerId !== undefined) {
      fields.push(`parent_seller_id = $${idx++}`);
      values.push(data.parentSellerId);
    }
    if (data.url !== undefined) {
      fields.push(`url = $${idx++}`);
      values.push(data.url.trim());
    }
    if (data.allowedPermissions !== undefined) {
      fields.push(`allowed_permissions = $${idx++}`);
      values.push(JSON.stringify(data.allowedPermissions));
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.isActive);
    }
    if (data.emailVerifiedAt !== undefined) {
      fields.push(`email_verified_at = $${idx++}`);
      values.push(data.emailVerifiedAt);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await this.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} AND deleted_at IS NULL`,
      values,
    );

    invalidateAuthUserCache(id);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.query(
      "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    invalidateAuthUserCache(id);
    return (result.rowCount ?? 0) > 0;
  }
}

export const userRepository = new UserRepository();

