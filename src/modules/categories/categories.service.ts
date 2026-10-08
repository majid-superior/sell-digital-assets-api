import {
  categoriesRepository,
  type CategoryTreeNode,
  type PaginatedCategoriesResult,
} from "../../database/repositories/categories.repository.js";
import type { CategoryEntity } from "../../database/types.js";
import { AppError } from "../../core/errors/app-error.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
} from "./categories.schema.js";

export class CategoriesService {
  async getCategories(
    query: CategoryQueryInput = {}
  ): Promise<
    | { type: "tree"; data: CategoryTreeNode[] }
    | { type: "paginated"; data: CategoryEntity[]; pagination: PaginatedCategoriesResult["pagination"] }
    | { type: "list"; data: CategoryEntity[] }
  > {
    const includeInactive = query.includeInactive ?? false;

    if (query.tree) {
      const tree = await categoriesRepository.findTree(includeInactive);
      return { type: "tree", data: tree };
    }

    if (query.page !== undefined || query.limit !== undefined) {
      const paginated = await categoriesRepository.findPaginated({
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        includeInactive,
        parentId: query.parentId,
        depth: query.depth,
        search: query.search,
      });
      return {
        type: "paginated",
        data: paginated.data,
        pagination: paginated.pagination,
      };
    }

    const list = await categoriesRepository.findAll({
      includeInactive,
      parentId: query.parentId,
      depth: query.depth,
      search: query.search,
    });
    return { type: "list", data: list };
  }

  async getCategoryById(
    id: number,
    includeInactive = true
  ): Promise<CategoryEntity> {
    const category = await categoriesRepository.findById(id, includeInactive);
    if (!category) {
      throw new AppError(`Category with ID ${id} not found`, 404);
    }
    return category;
  }

  async createCategory(data: CreateCategoryInput): Promise<CategoryEntity> {
    return categoriesRepository.create({
      name: data.name,
      slug: data.slug,
      parentId: data.parentId,
      description: data.description,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      metadata: (data.metadata as Record<string, unknown>) ?? null,
    });
  }

  async updateCategory(
    id: number,
    data: UpdateCategoryInput
  ): Promise<CategoryEntity> {
    const existing = await categoriesRepository.findById(id, true);
    if (!existing) {
      throw new AppError(`Category with ID ${id} not found`, 404);
    }

    return categoriesRepository.update(id, {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId,
      description: data.description,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      metadata: (data.metadata as Record<string, unknown>) ?? undefined,
    });
  }

  async deleteCategory(
    id: number,
    cascade = false
  ): Promise<{ id: number; softDeleted: boolean }> {
    const existing = await categoriesRepository.findById(id, true);
    if (!existing) {
      throw new AppError(`Category with ID ${id} not found`, 404);
    }

    const success = await categoriesRepository.softDelete(id, cascade);
    if (!success) {
      throw new AppError(`Failed to deactivate category with ID ${id}`, 500);
    }

    return { id, softDeleted: true };
  }

  async restoreCategory(
    id: number,
    restoreParents = true
  ): Promise<{ id: number; restored: boolean }> {
    const existing = await categoriesRepository.findById(id, true);
    if (!existing) {
      throw new AppError(`Category with ID ${id} not found`, 404);
    }

    const success = await categoriesRepository.restore(id, restoreParents);
    if (!success) {
      throw new AppError(`Failed to restore category with ID ${id}`, 500);
    }

    return { id, restored: true };
  }
}

export const categoriesService = new CategoriesService();
