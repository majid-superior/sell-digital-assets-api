import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import { logger } from "../logger/index.js";

export class CloudStorageService {
  private client: S3Client | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const bucket = env.AWS_BUCKET_NAME;
    const accessKeyId = env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
    const region = env.AWS_REGION;
    const endpoint = env.AWS_ENDPOINT;

    if (bucket && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region,
        ...(endpoint ? { endpoint } : {}),
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Generates a pre-signed S3 / Cloudflare R2 download URL (short-lived, e.g. 60s)
   * Returns null if cloud storage is not configured (allowing fallback to local stream).
   */
  async generatePresignedDownloadUrl(
    filePath: string,
    expiresInSeconds: number = 60,
  ): Promise<string | null> {
    if (!this.isConfigured || !this.client || !env.AWS_BUCKET_NAME) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: filePath,
      });

      return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      logger.warn({ err: (error as Error).message }, "Failed to generate S3 pre-signed URL, falling back to local stream");
      return null;
    }
  }
}

export const cloudStorageService = new CloudStorageService();
