import { BaseRepository } from "./base.repository.js";
import type { CategoryEntity } from "../types.js";
import { slugify } from "../../data/categories.js";
import { AppError } from "../../core/errors/app-error.js";

export interface CreateCategoryDto {
  name: string;
  slug?: string | undefined;
  parentId?: number | null | undefined;
  description?: string | null | undefined;
  displayOrder?: number | undefined;
  isActive?: boolean | undefined;
  metadata?: Record<string, unknown> | null | undefined;
}

export interface UpdateCategoryDto {
  name?: string | undefined;
  slug?: string | undefined;
  parentId?: number | null | undefined;
  description?: string | null | undefined;
  displayOrder?: number | undefined;
  isActive?: boolean | undefined;
  metadata?: Record<string, unknown> | null | undefined;
}

export interface CategoryFilter {
  includeInactive?: boolean | undefined;
  parentId?: number | null | undefined;
  depth?: number | undefined;
  search?: string | undefined;
}

export interface CategoryPaginationQuery extends CategoryFilter {
  page?: number | undefined;
  limit?: number | undefined;
}

export interface PaginatedCategoriesResult {
  data: CategoryEntity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryTreeNode extends CategoryEntity {
  parent_name?: string | null | undefined;
  parent_slug?: string | null | undefined;
  children: CategoryTreeNode[];
}

/**
 * Repository encapsulating PostgreSQL CRUD operations for digital asset categories.
 *
 * ARCHITECTURAL RULE: Physical deletion of records is strictly prohibited.
 * All deletions are executed as soft-deletes by setting `is_active = FALSE`.
 */
export class CategoriesRepository extends BaseRepository<CategoryEntity> {
  /**
   * Creates a new category, automatically deriving depth and hierarchical path.
   */
  async create(data: CreateCategoryDto): Promise<CategoryEntity> {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new AppError("Category name cannot be empty", 400);
    }

    const slug = (data.slug?.trim() || slugify(trimmedName)).toLowerCase();
    if (!slug) {
      throw new AppError("Invalid category name or slug", 400);
    }

    const existing = await this.findBySlug(slug, true);
    if (existing) {
      throw new AppError(`Category with slug '${slug}' already exists`, 409);
    }

    let depth = 0;
    let path = trimmedName;
    const parentId = data.parentId !== undefined ? data.parentId : null;
    const pathSlugs: string[] = [slug];

    if (parentId !== null) {
      const parent = await this.findById(parentId, true);
      if (!parent) {
        throw new AppError(`Parent category with ID ${parentId} not found`, 404);
      }
      if (!parent.is_active && (data.isActive ?? true)) {
        throw new AppError("Cannot create an active category under an inactive parent", 400);
      }
      depth = (parent.depth ?? 0) + 1;
      path = `${parent.path} > ${trimmedName}`;
      const parentPathSlugs = (parent.metadata as any)?.pathSlugs;
      if (Array.isArray(parentPathSlugs)) {
        pathSlugs.unshift(...parentPathSlugs);
      }
    }

    const metadata = {
      ...(data.metadata ?? {}),
      pathSlugs,
    };

    const insertQuery = `
      INSERT INTO categories (
        parent_id,
        name,
        slug,
        depth,
        path,
        description,
        display_order,
        is_active,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      RETURNING *;
    `;

    const result = await this.query<CategoryEntity>(insertQuery, [
      parentId,
      trimmedName,
      slug,
      depth,
      path,
      data.description ?? null,
      data.displayOrder ?? 0,
      data.isActive !== undefined ? data.isActive : true,
      JSON.stringify(metadata),
    ]);

    return result.rows[0]!;
  }

  /**
   * Retrieves a category by ID from view_categories, optionally including soft-deleted (inactive) rows.
   */
  async findById(
    id: number,
    includeInactive = false,
  ): Promise<CategoryEntity | null> {
    const queryStr = `
      SELECT 
        c.id,
        c.parent_id,
        c.parent_name,
        c.parent_slug,
        c.name,
        c.slug,
        c.depth,
        c.path,
        c.description,
        c.display_order,
        c.is_active,
        c.metadata,
        c.created_at,
        c.updated_at
      FROM view_categories c
      WHERE c.id = $1 AND ($2::boolean OR c.is_active = TRUE)
      LIMIT 1;
    `;

    const result = await this.query<CategoryEntity>(queryStr, [
      id,
      includeInactive,
    ]);
    return result.rows[0] ?? null;
  }

  /**
   * Retrieves a category by slug, optionally including soft-deleted (inactive) rows.
   */
  async findBySlug(
    slug: string,
    includeInactive = false,
  ): Promise<CategoryEntity | null> {
    const queryStr = `
      SELECT 
        c.id,
        c.parent_id,
        c.parent_name,
        c.parent_slug,
        c.name,
        c.slug,
        c.depth,
        c.path,
        c.description,
        c.display_order,
        c.is_active,
        c.metadata,
        c.created_at,
        c.updated_at
      FROM view_categories c
      WHERE c.slug = $1 AND ($2::boolean OR c.is_active = TRUE)
      LIMIT 1;
    `;

    const result = await this.query<CategoryEntity>(queryStr, [
      slug.trim().toLowerCase(),
      includeInactive,
    ]);
    return result.rows[0] ?? null;
  }

  /**
   * Retrieves all categories matching filter criteria.
   */
  async findAll(filter: CategoryFilter = {}): Promise<CategoryEntity[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (!filter.includeInactive) {
      conditions.push("c.is_active = TRUE");
    }

    if (filter.parentId !== undefined) {
      if (filter.parentId === null) {
        conditions.push("c.parent_id IS NULL");
      } else {
        conditions.push(`c.parent_id = $${idx++}`);
        values.push(filter.parentId);
      }
    }

    if (filter.depth !== undefined) {
      conditions.push(`c.depth = $${idx++}`);
      values.push(filter.depth);
    }

    if (filter.search?.trim()) {
      conditions.push(
        `(c.name ILIKE $${idx} OR c.path ILIKE $${idx} OR c.slug ILIKE $${idx})`,
      );
      values.push(`%${filter.search.trim()}%`);
      idx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const queryStr = `
      SELECT 
        c.id,
        c.parent_id,
        c.parent_name,
        c.parent_slug,
        c.name,
        c.slug,
        c.depth,
        c.path,
        c.description,
        c.display_order,
        c.is_active,
        c.metadata,
        c.created_at,
        c.updated_at
      FROM view_categories c
      ${whereClause}
      ORDER BY c.depth ASC, c.display_order ASC, c.name ASC;
    `;

    const result = await this.query<CategoryEntity>(queryStr, values);
    return result.rows;
  }

  /**
   * Retrieves paginated categories with metadata for admin listings.
   */
  async findPaginated(
    options: CategoryPaginationQuery = {},
  ): Promise<PaginatedCategoriesResult> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (!options.includeInactive) {
      conditions.push("c.is_active = TRUE");
    }

    if (options.parentId !== undefined) {
      if (options.parentId === null) {
        conditions.push("c.parent_id IS NULL");
      } else {
        conditions.push(`c.parent_id = $${idx++}`);
        values.push(options.parentId);
      }
    }

    if (options.depth !== undefined) {
      conditions.push(`c.depth = $${idx++}`);
      values.push(options.depth);
    }

    if (options.search?.trim()) {
      conditions.push(
        `(c.name ILIKE $${idx} OR c.path ILIKE $${idx} OR c.slug ILIKE $${idx})`,
      );
      values.push(`%${options.search.trim()}%`);
      idx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM view_categories c
      ${whereClause};
    `;

    const dataQuery = `
      SELECT 
        c.id,
        c.parent_id,
        c.parent_name,
        c.parent_slug,
        c.name,
        c.slug,
        c.depth,
        c.path,
        c.description,
        c.display_order,
        c.is_active,
        c.metadata,
        c.created_at,
        c.updated_at
      FROM view_categories c
      ${whereClause}
      ORDER BY c.depth ASC, c.display_order ASC, c.name ASC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    const [countResult, dataResult] = await Promise.all([
      this.query<{ total: string }>(countQuery, values),
      this.query<CategoryEntity>(dataQuery, [...values, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    return {
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Retrieves all root categories (depth = 0 and parent_id IS NULL).
   */
  async findRoots(includeInactive = false): Promise<CategoryEntity[]> {
    return this.findAll({ parentId: null, includeInactive });
  }

  /**
   * Retrieves direct child subcategories for a given parent ID.
   */
  async findChildren(
    parentId: number,
    includeInactive = false,
  ): Promise<CategoryEntity[]> {
    return this.findAll({ parentId, includeInactive });
  }

  /**
   * Reconstructs the entire category hierarchy into a nested tree.
   */
  async findTree(includeInactive = false): Promise<CategoryTreeNode[]> {
    const allCategories = await this.findAll({ includeInactive });
    const nodeMap = new Map<number, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // First pass: wrap each category as a tree node with an empty children array
    for (const cat of allCategories) {
      if (cat.id !== undefined) {
        nodeMap.set(cat.id, {
          ...cat,
          children: [],
        });
      }
    }

    // Second pass: link children to their parents
    for (const cat of allCategories) {
      if (cat.id === undefined) continue;
      const node = nodeMap.get(cat.id)!;
      if (cat.parent_id && nodeMap.has(cat.parent_id)) {
        nodeMap.get(cat.parent_id)!.children.push(node);
      } else if (!cat.parent_id) {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Updates an existing category. If the name or parent changes,
   * automatically recalculates depth and cascades path updates to descendants within a transaction.
   */
  async update(
    id: number,
    data: UpdateCategoryDto,
  ): Promise<CategoryEntity> {
    const existing = await this.findById(id, true);
    if (!existing) {
      throw new AppError(`Category with ID ${id} not found`, 404);
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    let newName = existing.name;
    let nameChanged = false;
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) {
        throw new AppError("Category name cannot be empty", 400);
      }
      if (trimmed !== existing.name) {
        newName = trimmed;
        nameChanged = true;
        updates.push(`name = $${idx++}`);
        values.push(newName);
      }
    }

    if (data.slug !== undefined) {
      const slug = data.slug.trim().toLowerCase();
      if (!slug) {
        throw new AppError("Category slug cannot be empty", 400);
      }
      if (slug !== existing.slug) {
        const slugConflict = await this.findBySlug(slug, true);
        if (slugConflict && slugConflict.id !== id) {
          throw new AppError(`Category with slug '${slug}' already exists`, 409);
        }
        updates.push(`slug = $${idx++}`);
        values.push(slug);
      }
    }

    let parentChanged = false;
    let newParentId = existing.parent_id ?? null;
    let newParent: CategoryEntity | null = null;
    if (data.parentId !== undefined && data.parentId !== existing.parent_id) {
      if (data.parentId === id) {
        throw new AppError("A category cannot be its own parent", 400);
      }
      if (data.parentId !== null) {
        newParent = await this.findById(data.parentId, true);
        if (!newParent) {
          throw new AppError(`Parent category with ID ${data.parentId} not found`, 404);
        }
        if (
          existing.path &&
          newParent.path &&
          (newParent.path === existing.path || newParent.path.startsWith(`${existing.path} > `))
        ) {
          throw new AppError("Cannot set a descendant category as parent (circular reference)", 400);
        }
        const willBeActive = data.isActive ?? existing.is_active ?? true;
        if (!newParent.is_active && willBeActive) {
          throw new AppError("Cannot move an active category under an inactive parent", 400);
        }
      }
      newParentId = data.parentId;
      parentChanged = true;
      updates.push(`parent_id = $${idx++}`);
      values.push(newParentId);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(data.description);
    }

    if (data.displayOrder !== undefined) {
      updates.push(`display_order = $${idx++}`);
      values.push(data.displayOrder);
    }

    if (data.isActive !== undefined) {
      if (data.isActive === true && !existing.is_active) {
        const targetParentId = parentChanged ? newParentId : existing.parent_id;
        if (targetParentId !== null && targetParentId !== undefined) {
          const parentToCheck = newParent ?? (await this.findById(targetParentId, true));
          if (parentToCheck && !parentToCheck.is_active) {
            throw new AppError(
              "Cannot activate category while parent category is inactive. Use restore endpoint to restore parent hierarchy.",
              400,
            );
          }
        }
      }
      updates.push(`is_active = $${idx++}`);
      values.push(data.isActive);
    }

    if (data.metadata !== undefined) {
      updates.push(`metadata = $${idx++}::jsonb`);
      values.push(JSON.stringify(data.metadata));
    }

    // If hierarchy or naming changed, recompute depth and path
    let newDepth = existing.depth ?? 0;
    let newPath = existing.path ?? existing.name;

    if (nameChanged || parentChanged) {
      if (newParentId !== null) {
        const parent = newParent ?? (await this.findById(newParentId, true));
        if (!parent) {
          throw new AppError(`Parent category with ID ${newParentId} not found`, 404);
        }
        newDepth = (parent.depth ?? 0) + 1;
        newPath = `${parent.path} > ${newName}`;
      } else {
        newDepth = 0;
        newPath = newName;
      }

      updates.push(`depth = $${idx++}`);
      values.push(newDepth);

      updates.push(`path = $${idx++}`);
      values.push(newPath);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    return this.withTransaction(async (client) => {
      const updateQuery = `
        UPDATE categories
        SET ${updates.join(", ")}
        WHERE id = $${idx}
        RETURNING *;
      `;

      await client.query(updateQuery, values);

      // Cascade path updates to all children if the category path changed
      if (nameChanged || parentChanged) {
        const oldPrefix = `${existing.path} > `;
        const newPrefix = `${newPath} > `;
        const depthDelta = newDepth - (existing.depth ?? 0);

        await client.query(
          `UPDATE categories
           SET path = $1 || SUBSTRING(path, $2::int),
               depth = depth + $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE path LIKE $4;`,
          [
            newPrefix,
            oldPrefix.length + 1,
            depthDelta,
            `${oldPrefix}%`,
          ],
        );
      }

      const refreshedRes = await client.query<CategoryEntity>(
        `SELECT 
          c.id, c.parent_id, c.parent_name, c.parent_slug,
          c.name, c.slug, c.depth, c.path, c.description,
          c.display_order, c.is_active, c.metadata,
          c.created_at, c.updated_at
        FROM view_categories c
        WHERE c.id = $1
        LIMIT 1;`,
        [id],
      );
      return refreshedRes.rows[0]!;
    });
  }

  /**
   * SOFT-DELETE RULE: Toggles category is_active to FALSE.
   * Physical SQL DELETE is strictly prohibited on categories.
   */
  async softDelete(id: number, cascadeToChildren = false): Promise<boolean> {
    const existing = await this.findById(id, true);
    if (!existing) return false;

    if (cascadeToChildren) {
      const childPrefix = `${existing.path} > %`;
      const result = await this.query(
        `UPDATE categories
         SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 OR path LIKE $2;`,
        [id, childPrefix],
      );
      return (result.rowCount ?? 0) > 0;
    }

    const result = await this.query(
      `UPDATE categories
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1;`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Alias for softDelete. Never executes physical SQL DELETE.
   */
  async delete(id: number, cascadeToChildren = false): Promise<boolean> {
    return this.softDelete(id, cascadeToChildren);
  }

  /**
   * Restores a soft-deleted category by setting is_active = TRUE.
   * If restoreParents is true, also reactivates all parent ancestor categories.
   */
  async restore(id: number, restoreParents = true): Promise<boolean> {
    const existing = await this.findById(id, true);
    if (!existing) return false;

    if (restoreParents && existing.parent_id) {
      // Reactivate this category and all ancestors
      return this.withTransaction(async (client) => {
        let currentParentId: number | null = existing.parent_id ?? null;
        while (currentParentId !== null) {
          const parentRes = await client.query<{ id: number; parent_id: number | null }>(
            `UPDATE categories
             SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, parent_id;`,
            [currentParentId],
          );
          currentParentId = parentRes.rows[0]?.parent_id ?? null;
        }

        const selfRes = await client.query(
          `UPDATE categories
           SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1;`,
          [id],
        );
        return (selfRes.rowCount ?? 0) > 0;
      });
    }

    const result = await this.query(
      `UPDATE categories
       SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1;`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Returns total count of categories.
   */
  async count(includeInactive = false): Promise<number> {
    const queryStr = includeInactive
      ? "SELECT COUNT(*) AS total FROM categories;"
      : "SELECT COUNT(*) AS total FROM categories WHERE is_active = TRUE;";

    const result = await this.query<{ total: string }>(queryStr);
    return parseInt(result.rows[0]?.total || "0", 10);
  }

  /**
   * Checks whether a slug is already taken.
   */
  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    let queryStr = "SELECT 1 FROM categories WHERE slug = $1";
    const values: unknown[] = [slug.trim().toLowerCase()];

    if (excludeId !== undefined) {
      queryStr += " AND id != $2";
      values.push(excludeId);
    }

    queryStr += " LIMIT 1;";
    const result = await this.query(queryStr, values);
    return (result.rowCount ?? 0) > 0;
  }
}

export const categoriesRepository = new CategoriesRepository();
export const categoryRepository = categoriesRepository;
export default categoriesRepository;
