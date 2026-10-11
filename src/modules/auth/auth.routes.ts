import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import { RegisterUserSchema, LoginUserSchema, RefreshTokenSchema } from "./auth.schema.js";
import { authLimiter } from "../../core/middleware/rate-limit.middleware.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { usersController } from "../users/users.controller.js";

const router = Router();

// Signup
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
  validateBody(LoginUserSchema),
  authController.login.bind(authController),
);

// Refresh token
router.post(
  "/refresh",
  validateBody(RefreshTokenSchema),
  authController.refresh.bind(authController),
);

// Logout
router.post(
  "/logout",
  authController.logout.bind(authController),
);

// Current User Profile: /me under auth route
router.get(
  "/me",
  authenticate,
  usersController.getMe.bind(usersController),
);

export default router;
