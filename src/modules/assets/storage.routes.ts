import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { localStorageService } from "../../core/storage/index.js";
import { AppError } from "../../core/errors/app-error.js";

const router = Router();

// PUT /api/v1/storage/upload — Direct local file upload handler
router.put("/upload", async (req: Request, res: Response): Promise<void> => {
  const { key, token, expires } = req.query as {
    key?: string;
    token?: string;
    expires?: string;
  };

  if (!key || !token || !expires) {
    throw new AppError("Missing upload signature parameters (key, token, expires)", 400);
  }

  const expiresAt = parseInt(expires, 10);
  const isValid = localStorageService.verifyToken(key, expiresAt, "upload", token);
  if (!isValid) {
    throw new AppError("Invalid or expired upload signature token", 403);
  }

  const filePath = localStorageService.getAbsolutePath(key);
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const writeStream = fs.createWriteStream(filePath);

  await new Promise<void>((resolve, reject) => {
    req.pipe(writeStream);
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
    req.on("error", (err) => reject(err));
  });

  const stat = fs.statSync(filePath);

  res.status(200).json({
    success: true,
    message: "File stored successfully",
    data: {
      storageKey: key,
      sizeBytes: stat.size,
      path: filePath,
    },
  });
});

// GET /api/v1/storage/download — Direct local file download streaming handler
router.get("/download", async (req: Request, res: Response): Promise<void> => {
  const { key, token, expires, filename } = req.query as {
    key?: string;
    token?: string;
    expires?: string;
    filename?: string;
  };

  if (!key || !token || !expires) {
    throw new AppError("Missing download signature parameters (key, token, expires)", 400);
  }

  const expiresAt = parseInt(expires, 10);
  const isValid = localStorageService.verifyToken(key, expiresAt, "download", token);
  if (!isValid) {
    throw new AppError("Invalid or expired download signature token", 403);
  }

  const filePath = localStorageService.getAbsolutePath(key);
  if (!fs.existsSync(filePath)) {
    throw new AppError("File not found on storage disk", 404);
  }

  const stat = fs.statSync(filePath);
  const downloadName = filename || path.basename(filePath);

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(downloadName)}"`,
  );
  res.setHeader("Content-Length", stat.size);

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

export default router;

