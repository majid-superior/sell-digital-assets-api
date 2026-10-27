import type { Request, Response, NextFunction } from "express";
import { notificationsService } from "./notifications.service.js";
import { AppError } from "../../core/errors/app-error.js";

export class NotificationsController {
  private getUserId(req: Request): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required.", 401);
    }
    return userId;
  }

  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const unreadOnly = String(req.query.unread) === "true";
      const parsedPage = Number(req.query.page);
      const parsedLimit = Number(req.query.limit);
      const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1;
      const limit = Number.isFinite(parsedLimit) && parsedLimit >= 1 ? Math.min(50, Math.floor(parsedLimit)) : 20;

      const result = await notificationsService.getUserNotifications(userId, {
        unreadOnly,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        unreadCount: result.unreadCount,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit) || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params as { id: string };

      const updated = await notificationsService.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const result = await notificationsService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `Marked ${result.count} notification(s) as read`,
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();

