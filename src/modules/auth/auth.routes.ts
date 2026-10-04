import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import { RegisterUserSchema, LoginUserSchema, RefreshTokenSchema } from "./auth.schema.js";
import { authLimiter } from "../../core/middleware/rate-limit.middleware.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateBody(RegisterUserSchema),
  authController.register.bind(authController),
);

router.post(
  "/login",
  authLimiter,
  validateBody(LoginUserSchema),
  authController.login.bind(authController),
);

router.post(
  "/refresh",
  validateBody(RefreshTokenSchema),
  authController.refresh.bind(authController),
);

router.post(
  "/logout",
  authController.logout.bind(authController),
);

export default router;
