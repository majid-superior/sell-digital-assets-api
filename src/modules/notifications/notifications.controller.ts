import type { Request, Response, NextFunction } from "express";
import { notificationsService } from "./notifications.service.js";
import { AppError } from "../../core/errors/app-error.js";

export class NotificationsController {
  private getUserId(req: Request): string {
    const userId = req.user?.id || (req.headers["x-user-id"] as string);
    if (!userId) {
      throw new AppError("Authentication required.", 401);
    }
    return userId;
  }

  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const unreadOnly = req.query.unread === "true";
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

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

