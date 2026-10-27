import type { Request, Response, NextFunction } from "express";
import { logsService } from "./logs.service.js";
import type { LogsQueryInput, LogIdParamInput, CleanupLogsInput } from "./logs.schema.js";

export class LogsController {
  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as LogsQueryInput;
      const result = await logsService.getLogs(query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as LogIdParamInput;
      const log = await logsService.getLogById(id);
      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  async cleanupLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { retentionDays } = req.body as unknown as CleanupLogsInput;
      const result = await logsService.cleanupLogs(retentionDays, req.user);
      res.status(200).json({
        success: true,
        message: `Successfully purged ${result.deletedCount} log records older than ${retentionDays} days`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const logsController = new LogsController();

