import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import { SUPABASE_BUCKETS } from "../../config/supabase.js";
import type {
  IStorageService,
  PresignedUploadResult,
  FileStats,
} from "./storage.interface.js";

export class CloudflareR2StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.AWS_BUCKET_PRIVATE || SUPABASE_BUCKETS.PRIVATE;
    const clientConfig: any = {
      region: env.AWS_REGION || "auto",
      forcePathStyle: true,
    };
    if (env.AWS_ENDPOINT) {
      clientConfig.endpoint = env.AWS_ENDPOINT;
    }
    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      };
    }
    this.client = new S3Client(clientConfig);
  }

  public getBucket(storageKey?: string): string {
    if (
      storageKey &&
      (storageKey.startsWith("public/") || storageKey.startsWith("previews/"))
    ) {
      return env.AWS_BUCKET_PREVIEWS || SUPABASE_BUCKETS.PREVIEWS;
    }
    return env.AWS_BUCKET_PRIVATE || SUPABASE_BUCKETS.PRIVATE;
  }

  async generatePresignedUploadUrl(
    storageKey: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.getBucket(storageKey),
      Key: storageKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

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
    const command = new GetObjectCommand({
      Bucket: this.getBucket(storageKey),
      Key: storageKey,
      ResponseContentDisposition: fileName
        ? `attachment; filename="${encodeURIComponent(fileName)}"`
        : undefined,
    });

    return await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.getBucket(storageKey),
        Key: storageKey,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(storageKey: string): Promise<FileStats> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.getBucket(storageKey),
        Key: storageKey,
      });
      const response = await this.client.send(command);
      return {
        exists: true,
        size: response.ContentLength || 0,
        mimeType: response.ContentType || undefined,
      };
    } catch {
      return {
        exists: false,
        size: 0,
      };
    }
  }

  async uploadBuffer(
    storageKey: string,
    buffer: Buffer,
    contentType?: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.getBucket(storageKey),
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    });
    await this.client.send(command);
  }
}
