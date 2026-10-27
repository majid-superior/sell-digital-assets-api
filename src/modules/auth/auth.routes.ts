import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import { RegisterUserSchema, SignInUserSchema, RefreshTokenSchema, UpdateMeSchema } from "./auth.schema.js";
import { authLimiter } from "../../core/middleware/rate-limit.middleware.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";

const router = Router();

// Signup / Register
router.post(
  "/register",
  authLimiter,
  validateBody(RegisterUserSchema),
  authController.register.bind(authController),
);

router.post(
  "/signup",
  authLimiter,
  validateBody(RegisterUserSchema),
  authController.register.bind(authController),
);

// Signin
router.post(
  "/signin",
  authLimiter,
  validateBody(SignInUserSchema),
  authController.signIn.bind(authController),
);

// Refresh token
router.post(
  "/refresh",
  authLimiter,
  validateBody(RefreshTokenSchema),
  authController.refresh.bind(authController),
);

// Signout
router.post(
  "/signout",
  authController.signOut.bind(authController),
);

// Current User Profile: /me under auth route
router.get(
  "/me",
  authenticate,
  authController.getMe.bind(authController),
);

router.patch(
  "/me",
  authenticate,
  validateBody(UpdateMeSchema),
  authController.updateMe.bind(authController),
);

// Upgrade Buyer to Seller
router.post(
  "/become-seller",
  authenticate,
  authController.becomeSeller.bind(authController),
);

export default router;
