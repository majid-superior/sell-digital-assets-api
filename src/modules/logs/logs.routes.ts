import { Router } from "express";
import { logsController } from "./logs.controller.js";
import {
  authenticate,
  authorize,
} from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../core/validation/validate.middleware.js";
import {
  LogsQuerySchema,
  LogIdParamSchema,
  CleanupLogsSchema,
} from "./logs.schema.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(LogsQuerySchema),
  logsController.getLogs.bind(logsController),
);

router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(LogIdParamSchema),
  logsController.getLogById.bind(logsController),
);

router.post(
  "/cleanup",
  authenticate,
  authorize("admin"),
  validateBody(CleanupLogsSchema),
  logsController.cleanupLogs.bind(logsController),
);

export default router;
