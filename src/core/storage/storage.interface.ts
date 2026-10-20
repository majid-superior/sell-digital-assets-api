export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  method: string;
  expiresInSeconds: number;
}

export interface FileStats {
  size: number;
  exists: boolean;
  mimeType?: string | undefined;
}

export interface IStorageService {
  generatePresignedUploadUrl(
    storageKey: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<PresignedUploadResult>;

  generatePresignedDownloadUrl(
    storageKey: string,
    fileName?: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  deleteFile(storageKey: string): Promise<boolean>;

  getFileStats(storageKey: string): Promise<FileStats>;

  uploadBuffer(
    storageKey: string,
    buffer: Buffer,
    contentType?: string,
  ): Promise<void>;
}
