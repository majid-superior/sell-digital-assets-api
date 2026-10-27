import { Router } from "express";
import { couponsController } from "./coupons.controller.js";
import {
  authenticate,
  requireSellerAccess,
  requireAssetMutationAccess,
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
  couponsController.getCoupons.bind(couponsController),
);

router.post(
  "/",
  requireAssetMutationAccess,
  couponsController.createCoupon.bind(couponsController),
);

router.get(
  "/:id",
  couponsController.getCouponById.bind(couponsController),
);

router.patch(
  "/:id",
  requireAssetMutationAccess,
  couponsController.updateCoupon.bind(couponsController),
);

router.patch(
  "/:id/status",
  requireAssetMutationAccess,
  couponsController.updateCouponStatus.bind(couponsController),
);

router.delete(
  "/:id",
  requireAssetMutationAccess,
  couponsController.deleteCoupon.bind(couponsController),
);

export const couponsRouter = router;
