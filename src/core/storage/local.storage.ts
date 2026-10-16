import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import type {
  IStorageService,
  PresignedUploadResult,
  FileStats,
} from "./storage.interface.js";

export class LocalStorageService implements IStorageService {
  private baseDir: string;
  private secret: string;

  constructor() {
    this.baseDir = path.resolve(env.LOCAL_STORAGE_PATH);
    this.secret = env.DOWNLOAD_TOKEN_SECRET;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public getAbsolutePath(storageKey: string): string {
    if (storageKey.includes("\0")) {
      throw new AppError("Invalid storage key: path traversal is prohibited", 400);
    }
    const sanitizedKey = storageKey.replace(/^[/\\]+/, "");
    const resolvedPath = path.resolve(this.baseDir, sanitizedKey);
    const basePrefix = this.baseDir.endsWith(path.sep)
      ? this.baseDir
      : this.baseDir + path.sep;

    if (!resolvedPath.startsWith(basePrefix)) {
      throw new AppError("Invalid storage key: path traversal is prohibited", 400);
    }

    return resolvedPath;
  }

  public signToken(
    storageKey: string,
    expiresAt: number,
    action: "upload" | "download",
  ): string {
    const data = `${action}:${storageKey}:${expiresAt}`;
    return crypto.createHmac("sha256", this.secret).update(data).digest("hex");
  }

  public verifyToken(
    storageKey: string,
    expiresAt: number,
    action: "upload" | "download",
    token: string,
  ): boolean {
    if (Date.now() > expiresAt) {
      return false;
    }
    const expected = this.signToken(storageKey, expiresAt, action);
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
      return false;
    }
  }

  async generatePresignedUploadUrl(
    storageKey: string,
    _contentType: string,
    expiresInSeconds = 900,
  ): Promise<PresignedUploadResult> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const token = this.signToken(storageKey, expiresAt, "upload");
    const uploadUrl = `http://localhost:${env.PORT}/api/v1/storage/upload?key=${encodeURIComponent(
      storageKey,
    )}&token=${token}&expires=${expiresAt}`;

    return {
      uploadUrl,
      storageKey,
      method: "PUT",
      expiresInSeconds,
    };
  }

  async generatePresignedDownloadUrl(
    storageKey: string,
    fileName?: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const token = this.signToken(storageKey, expiresAt, "download");
    let downloadUrl = `http://localhost:${env.PORT}/api/v1/storage/download?key=${encodeURIComponent(
      storageKey,
    )}&token=${token}&expires=${expiresAt}`;

    if (fileName) {
      downloadUrl += `&filename=${encodeURIComponent(fileName)}`;
    }

    return downloadUrl;
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const filePath = this.getAbsolutePath(storageKey);
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw err;
    }
  }

  async getFileStats(storageKey: string): Promise<FileStats> {
    const filePath = this.getAbsolutePath(storageKey);
    try {
      const stat = await fs.promises.stat(filePath);
      return {
        exists: true,
        size: stat.size,
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return {
          exists: false,
          size: 0,
        };
      }
      throw err;
    }
  }
}

