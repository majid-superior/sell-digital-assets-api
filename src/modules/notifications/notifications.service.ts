import { notificationsRepository } from "../../database/repositories/notifications.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import { logger } from "../../core/logger/index.js";

export class NotificationsService {
  async notifyAdmins(data: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const count = await notificationsRepository.createForAdmins(data);
      logger.info(
        { type: data.type, adminCount: count, assetId: data.data?.assetId },
        "Admin notification dispatched",
      );
    } catch (err) {
      logger.error({ err, data }, "Failed to dispatch admin notification");
    }
  }

  async notifySeller(
    sellerId: string,
    data: {
      type: string;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      await notificationsRepository.create({
        userId: sellerId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
      });
      logger.info(
        { sellerId, type: data.type, assetId: data.data?.assetId },
        "Seller notification dispatched",
      );
    } catch (err) {
      logger.error({ err, sellerId, data }, "Failed to dispatch seller notification");
    }
  }

  async getUserNotifications(
    userId: string,
    options: { unreadOnly?: boolean; page?: number; limit?: number } = {},
  ) {
    return notificationsRepository.findByUser(userId, options);
  }

  async markAsRead(id: string, userId: string) {
    const updated = await notificationsRepository.markAsRead(id, userId);
    if (!updated) {
      throw new AppError("Notification not found or unauthorized", 404);
    }
    return updated;
  }

  async markAllAsRead(userId: string) {
    const count = await notificationsRepository.markAllAsRead(userId);
    return { count };
  }
}

export const notificationsService = new NotificationsService();

