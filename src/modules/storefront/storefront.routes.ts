import { Router } from "express";
import { storefrontController } from "./storefront.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../core/validation/validate.middleware.js";
import {
  CheckStorefrontUrlQuerySchema,
  PresignStorefrontBannerSchema,
  UpdateStorefrontSchema,
  StorefrontSlugParamSchema,
} from "./storefront.schema.js";

export const sellerStorefrontRouter = Router();
sellerStorefrontRouter.use(authenticate, authorize("seller", "admin"));

// GET /api/v1/seller/storefront
sellerStorefrontRouter.get(
  "/",
  storefrontController.getSellerStorefront.bind(storefrontController)
);

// GET /api/v1/seller/storefront/check-url?url=seller01
sellerStorefrontRouter.get(
  "/check-url",
  validateQuery(CheckStorefrontUrlQuerySchema),
  storefrontController.checkUrlAvailability.bind(storefrontController)
);

// PUT /api/v1/seller/storefront
sellerStorefrontRouter.put(
  "/",
  validateBody(UpdateStorefrontSchema),
  storefrontController.updateSellerStorefront.bind(storefrontController)
);

// POST /api/v1/seller/storefront/banner/presign
sellerStorefrontRouter.post(
  "/banner/presign",
  validateBody(PresignStorefrontBannerSchema),
  storefrontController.presignBannerUpload.bind(storefrontController)
);

export const publicStorefrontRouter = Router();

// GET /api/v1/catalog/storefronts/:sellerUrl
publicStorefrontRouter.get(
  "/:sellerUrl",
  validateParams(StorefrontSlugParamSchema),
  storefrontController.getPublicStorefront.bind(storefrontController)
);
