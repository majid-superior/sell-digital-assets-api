import { Router, type Request, type Response, type NextFunction } from "express";
import { getSystemStatus } from "./status.service.js";
import { renderIndexPage } from "./index.page.js";

const router = Router();

// ============================================================================
// PAGE 1: Index Page (Server & DB Status)
// ============================================================================
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // If an API client requests JSON via query ?format=json or accept header
    if (
      req.query.format === "json" ||
      (req.headers.accept?.includes("application/json") &&
        !req.headers.accept?.includes("text/html"))
    ) {
      const status = await getSystemStatus();
      res.status(200).json({ success: true, data: status });
      return;
    }

    const status = await getSystemStatus();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(renderIndexPage(status));
  } catch (error) {
    next(error);
  }
});

// Favicon alias
router.get("/favicon.ico", (_req: Request, res: Response) => {
  res.sendFile("logo.png", { root: "public" });
});

// ============================================================================
// JSON API Health Check (Always returns JSON)
// ============================================================================
router.get("/api/health", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await getSystemStatus();
    const statusCode = status.database.connected ? 200 : 503;
    res.status(statusCode).json({
      success: status.database.connected,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// Legacy /health alias (Always returns JSON)
router.get("/health", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await getSystemStatus();
    const statusCode = status.database.connected ? 200 : 503;
    res.status(statusCode).json({
      success: status.database.connected,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
