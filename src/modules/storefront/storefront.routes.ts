import { Router } from "express";
import multer from "multer";
import { storefrontController } from "./storefront.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../core/validation/validate.middleware.js";
import { UpdateStorefrontSchema, StorefrontSlugParamSchema } from "./storefront.schema.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3 MB max file size, no min limit
    files: 1,
    parts: 5,
  },
});

export const sellerStorefrontRouter = Router();
sellerStorefrontRouter.use(authenticate, authorize("seller", "admin"));

// GET /api/v1/seller/storefront
sellerStorefrontRouter.get(
  "/",
  storefrontController.getSellerStorefront.bind(storefrontController)
);

// PUT /api/v1/seller/storefront
sellerStorefrontRouter.put(
  "/",
  validateBody(UpdateStorefrontSchema),
  storefrontController.updateSellerStorefront.bind(storefrontController)
);

// POST /api/v1/seller/storefront/banner
sellerStorefrontRouter.post(
  "/banner",
  upload.single("file"),
  storefrontController.uploadBanner.bind(storefrontController)
);

export const publicStorefrontRouter = Router();

// GET /api/v1/catalog/storefronts/:sellerUrl
publicStorefrontRouter.get(
  "/:sellerUrl",
  validateParams(StorefrontSlugParamSchema),
  storefrontController.getPublicStorefront.bind(storefrontController)
);

