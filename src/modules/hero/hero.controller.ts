import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { AppError } from "../../core/errors/app-error.js";
import { heroService } from "./hero.service.js";

export class HeroController {
  /**
   * GET /api/v1/hero/active (Public)
   */
  async getActiveImages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const images = await heroService.getActiveImages();
      res.status(200).json({
        success: true,
        data: images,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/hero (Admin)
   */
  async getAllImages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const images = await heroService.getAllImages();
      res.status(200).json({
        success: true,
        data: images,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/hero (Admin - Upload)
   */
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let fileBuffer: Buffer | undefined;
      let fileName = "hero-image.webp";
      let mimeType = "image/webp";

      if (req.file) {
        fileBuffer = req.file.buffer;
        fileName = req.file.originalname || fileName;
        mimeType = req.file.mimetype || mimeType;
      } else if (Buffer.isBuffer(req.body)) {
        fileBuffer = req.body;
        const contentType = req.headers["content-type"];
        if (contentType && !contentType.includes("multipart")) {
          mimeType = contentType;
        }
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new AppError("No image file provided for upload. Send as multipart form field 'image' or 'file'.", 400);
      }

      const {
        title,
        subtitle,
        detail,
        category_name,
        categoryName,
        category_slug,
        categorySlug,
        sort_order,
        sortOrder,
        is_active,
        isActive,
      } = req.body || {};

      const newImage = await heroService.uploadHeroImage(fileBuffer, fileName, mimeType, {
        title,
        subtitle,
        detail,
        category_name: category_name || categoryName,
        category_slug: category_slug || categorySlug,
        sort_order: sort_order !== undefined ? Number(sort_order) : sortOrder !== undefined ? Number(sortOrder) : 0,
        is_active: is_active !== undefined ? is_active === "true" || is_active === true : isActive !== undefined ? isActive === "true" || isActive === true : true,
      });

      res.status(201).json({
        success: true,
        message: "Hero image uploaded and activated successfully",
        data: newImage,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/hero/:id/status (Admin)
   */
  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { is_active, isActive } = req.body;
      const targetStatus = is_active !== undefined ? Boolean(is_active) : Boolean(isActive);
      const updated = await heroService.toggleStatus(id, targetStatus);

      res.status(200).json({
        success: true,
        message: `Hero image ${updated.is_active ? "activated" : "deactivated"} successfully`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/hero/:id (Admin)
   */
  async updateImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await heroService.updateHeroImage(id, req.body);

      res.status(200).json({
        success: true,
        message: "Hero image updated successfully",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/hero/:id (Admin)
   */
  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await heroService.deleteHeroImage(id);

      res.status(200).json({
        success: true,
        message: "Hero image deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/hero/update-frontend-json (or internal sync)
   */
  async updateFrontendJson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const targetPath = path.resolve(
        process.cwd(),
        "../sell-digital-assets-website/src/features/website/data/heroImages.json",
      );

      try {
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.promises.writeFile(targetPath, JSON.stringify(data, null, 2), "utf-8");
      } catch {
        // ignore if directory is unreachable
      }

      res.status(200).json({
        success: true,
        message: "Hero images JSON updated successfully",
        syncHash: data?.syncHash,
        count: data?.count,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const heroController = new HeroController();
