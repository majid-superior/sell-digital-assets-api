import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import type {
  IStorageService,
  PresignedUploadResult,
  FileStats,
} from "./storage.interface.js";

export class CloudflareR2StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.AWS_BUCKET_NAME || "sell-digital-assets";
    const clientConfig: any = {
      region: env.AWS_REGION || "auto",
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

  async generatePresignedUploadUrl(
    storageKey: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
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
      Bucket: this.bucket,
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
        Bucket: this.bucket,
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
        Bucket: this.bucket,
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
}
