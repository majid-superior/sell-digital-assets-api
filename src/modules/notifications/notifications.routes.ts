import { Router } from "express";
import { notificationsController } from "./notifications.controller.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/v1/notifications — List notifications for authenticated user/admin
router.get("/", notificationsController.getMyNotifications.bind(notificationsController));

// POST /api/v1/notifications/read-all — Mark all as read
router.post("/read-all", notificationsController.markAllAsRead.bind(notificationsController));

// PATCH /api/v1/notifications/:id/read — Mark single notification as read
router.patch("/:id/read", notificationsController.markAsRead.bind(notificationsController));

export default router;

