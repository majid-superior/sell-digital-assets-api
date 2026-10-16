import { Router } from "express";
import { assetsController } from "./assets.controller.js";

const router = Router();

// PUT /api/v1/storage/upload — Direct local file upload handler
router.put("/upload", assetsController.handleStorageUpload.bind(assetsController));

// GET /api/v1/storage/download — Direct local file download streaming handler
router.get("/download", assetsController.handleStorageDownload.bind(assetsController));

export default router;
