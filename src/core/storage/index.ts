import { env } from "../../config/env.js";
import type { IStorageService } from "./storage.interface.js";
import { LocalStorageService } from "./local.storage.js";
import { CloudflareR2StorageService } from "./r2.storage.js";

export const localStorageService = new LocalStorageService();

export const storageService: IStorageService =
  (env.STORAGE_DRIVER === "r2" || env.STORAGE_DRIVER === "s3") &&
  env.AWS_ENDPOINT &&
  env.AWS_ACCESS_KEY_ID
    ? new CloudflareR2StorageService()
    : localStorageService;

export * from "./storage.interface.js";
export { LocalStorageService } from "./local.storage.js";
export { CloudflareR2StorageService } from "./r2.storage.js";

