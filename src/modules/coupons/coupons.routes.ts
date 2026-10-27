import { Router } from "express";
import { couponsController } from "./coupons.controller.js";
import {
  authenticate,
  requireSellerAccess,
  requireAssetMutationAccess,
  requirePermission,
} from "../../core/middleware/auth.middleware.js";

const router = Router();

// ============================================================================
// Public / Buyer Cart Validation Route
// ============================================================================
router.post(
  "/validate",
  authenticate,
  couponsController.validateCoupon.bind(couponsController),
);

// ============================================================================
// Seller Coupon Management Routes
// ============================================================================
router.use(authenticate);
router.use(requireSellerAccess);

router.get(
  "/",
  requirePermission("coupons:view"),
  couponsController.getCoupons.bind(couponsController),
);

router.post(
  "/",
  requirePermission("coupons:manage"),
  requireAssetMutationAccess,
  couponsController.createCoupon.bind(couponsController),
);

router.get(
  "/:id",
  requirePermission("coupons:view"),
  couponsController.getCouponById.bind(couponsController),
);

router.patch(
  "/:id",
  requirePermission("coupons:manage"),
  requireAssetMutationAccess,
  couponsController.updateCoupon.bind(couponsController),
);

router.patch(
  "/:id/status",
  requirePermission("coupons:manage"),
  requireAssetMutationAccess,
  couponsController.updateCouponStatus.bind(couponsController),
);

router.delete(
  "/:id",
  requirePermission("coupons:manage"),
  requireAssetMutationAccess,
  couponsController.deleteCoupon.bind(couponsController),
);

export const couponsRouter = router;
