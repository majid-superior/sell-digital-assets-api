// src/app.ts
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { AppError } from "./core/errors/app-error.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";
import { corsMiddleware } from "./core/middleware/cors.middleware.js";
import { ipGuardMiddleware } from "./core/middleware/ip-guard.middleware.js";
import { requestIdMiddleware } from "./core/middleware/request-id.middleware.js";
import { generalLimiter, authLimiter } from "./core/middleware/rate-limit.middleware.js";
import { httpLogger } from "./core/logger/index.js";

// Browser Pages (1: Index / Status, 2: Error Page)
import pagesRoutes from "./pages/pages.routes.js";
import { renderErrorPage } from "./pages/error.page.js";
import { renderDocAuthPage } from "./pages/doc-auth.page.js";
import {
  verifyAdminPassword,
  createDocAccessToken,
  isDocAuthorized,
  DOC_COOKIE_NAME,
  DOC_STATE_COOKIE_NAME,
  DOC_COOKIE_MAX_AGE_MS,
} from "./core/security/doc-auth.service.js";

import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes, { sellerTeamRouter } from "./modules/users/users.routes.js";
import organizationsRoutes from "./modules/organizations/organizations.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import themeRoutes from "./modules/theme/theme.routes.js";
import assetsRoutes, { sellerAssetsRouter } from "./modules/assets/assets.routes.js";
import adminAssetsRoutes from "./modules/assets/admin-assets.routes.js";
import downloadsRoutes from "./modules/assets/downloads.routes.js";
import licensesRoutes from "./modules/assets/licenses.routes.js";
import storageRoutes from "./modules/assets/storage.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import bannersRoutes from "./modules/banners/banners.routes.js";
import heroRoutes from "./modules/hero/hero.routes.js";
import logsRoutes from "./modules/logs/logs.routes.js";
import { couponsRouter } from "./modules/coupons/coupons.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import { sellerStorefrontRouter, publicStorefrontRouter } from "./modules/storefront/storefront.routes.js";
import { themeController } from "./modules/theme/theme.controller.js";
import { organization } from "./data/organizations.js";

const themeStaticPath = path.resolve(process.cwd(), "public/theme");

export const app = express();

// ============================================================================
// PIPELINE STEP 1: Direct IP Defense, HTTPS & Reverse Proxy Handling
// ============================================================================
app.set("trust proxy", 1);
app.use(ipGuardMiddleware);

if (env.NODE_ENV === "production") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.secure && req.header("x-forwarded-proto") !== "https") {
      const safeHost = /^[a-zA-Z0-9.-]+$/.test(req.hostname) ? req.hostname : "";
      if (!safeHost) {
        return res.status(400).json({
          success: false,
          status: "fail",
          message: "Invalid Host header",
        });
      }
      const safeUrl = req.originalUrl.replace(/^[/\\]+/, "/");
      return res.redirect(301, `https://${safeHost}${safeUrl}`);
    }
    next();
  });
}

// ============================================================================
// PIPELINE STEP 2: Helmet Security Headers (Updated for Self-Hosted Theme & Swagger UI)
// ============================================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "https://validator.swagger.io"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ============================================================================
// PIPELINE STEP 3: CORS Validation
// ============================================================================
app.use(corsMiddleware);

// ============================================================================
// PIPELINE STEP 4: Request ID & Parsing
// ============================================================================
app.use(requestIdMiddleware);
app.use(httpLogger);
app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
app.use(cookieParser());

// ============================================================================
// Static Assets & Centralized Theme
// ============================================================================
const isProduction = env.NODE_ENV === "production";
app.get(
  "/theme/theme.css",
  themeController.getCssVariables.bind(themeController),
);
app.use(
  "/theme",
  express.static(themeStaticPath, {
    maxAge: isProduction ? "7d" : 0,
    etag: true,
    lastModified: true,
  }),
);
app.use(
  express.static("public", {
    maxAge: isProduction ? "1d" : 0,
    etag: true,
    lastModified: true,
  }),
);

// ============================================================================
// Automated Swagger UI Documentation (/doc, /docs, /openapi.json) - Protected
// ============================================================================
const swaggerDistPath = path.resolve(
  process.cwd(),
  "dist/swagger/swagger.json",
);
const swaggerSrcPath = path.resolve(process.cwd(), "src/swagger/swagger.json");
const swaggerFilePath = fs.existsSync(swaggerDistPath)
  ? swaggerDistPath
  : swaggerSrcPath;

// Documentation Authentication Handlers (Unlock & Lock / Sign Out)
app.post("/doc/auth", authLimiter, async (req: Request, res: Response) => {
  const rawPassword = req.body?.password;
  const acceptsJson = Boolean(
    req.headers.accept?.includes("application/json") || req.is("application/json"),
  );

  if (!rawPassword || typeof rawPassword !== "string" || !rawPassword.trim()) {
    if (acceptsJson) {
      return res.status(400).json({
        success: false,
        status: "fail",
        message: "Administrator password is required.",
      });
    }
    return res
      .status(400)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(renderDocAuthPage({ errorMessage: "Administrator password is required." }));
  }

  const isValid = await verifyAdminPassword(rawPassword);
  if (!isValid) {
    if (acceptsJson) {
      return res.status(401).json({
        success: false,
        status: "fail",
        message: "Invalid administrator password. Please try again.",
      });
    }
    return res
      .status(401)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(
        renderDocAuthPage({
          errorMessage: "Invalid administrator password. Please try again.",
        }),
      );
  }

  // Grant session access: issue JWT cookie + client state cookie
  const token = createDocAccessToken();
  const isSecure = env.NODE_ENV === "production";

  res.cookie(DOC_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: DOC_COOKIE_MAX_AGE_MS,
    path: "/",
  });

  res.cookie(DOC_STATE_COOKIE_NAME, "1", {
    httpOnly: false,
    secure: isSecure,
    sameSite: "lax",
    maxAge: DOC_COOKIE_MAX_AGE_MS,
    path: "/",
  });

  const redirectUrl =
    typeof req.body?.redirect === "string" && req.body.redirect.startsWith("/doc")
      ? req.body.redirect
      : "/doc/";

  if (acceptsJson) {
    return res.status(200).json({
      success: true,
      message: "Documentation unlocked successfully",
      redirectUrl,
    });
  }

  return res.redirect(303, redirectUrl);
});

const handleDocLogout = (_req: Request, res: Response) => {
  res.clearCookie(DOC_COOKIE_NAME, { path: "/" });
  res.clearCookie(DOC_STATE_COOKIE_NAME, { path: "/" });
  res.redirect(303, "/doc/");
};

app.get("/doc/logout", handleDocLogout);
app.post("/doc/logout", handleDocLogout);

if (fs.existsSync(swaggerFilePath)) {
  const swaggerFile = JSON.parse(fs.readFileSync(swaggerFilePath, "utf8"));
  // 1. Define your explicit order
  const tagOrder = [
    "Health",
    "Organization Branding",
    "Authentication",
    "Users",
    "Categories",
    "Theme",
    "Assets - Public",
    "Assets - Seller",
    "Assets - Admin",
    "Banners",
    "Notifications",
    "Downloads",
    "Licenses",
    "Storage",
    "Storefront",
    "Logs",
  ];
  // 2. Sort the top-level tags array
  if (Array.isArray(swaggerFile.tags)) {
    swaggerFile.tags.sort((a: { name: string }, b: { name: string }) => {
      const indexA = tagOrder.indexOf(a.name);
      const indexB = tagOrder.indexOf(b.name);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }

  app.get("/docs", (_req: Request, res: Response) =>
    res.redirect(301, "/doc/"),
  );

  // Guard OpenAPI JSON specification
  app.get("/openapi.json", (req: Request, res: Response) => {
    if (!isDocAuthorized(req)) {
      return res.status(401).json({
        success: false,
        status: "fail",
        message: "Administrator authorization required to view OpenAPI specification.",
      });
    }
    return res.json(swaggerFile);
  });

  // Guard Swagger UI Documentation Router (/doc, /doc/*)
  app.use("/doc", (req: Request, res: Response, next: NextFunction) => {
    if (isDocAuthorized(req)) {
      return next();
    }

    const acceptsHtml = req.accepts(["html", "json"]) === "html";
    if (!acceptsHtml) {
      return res.status(401).json({
        success: false,
        status: "fail",
        message: "Administrator authorization required to access API documentation.",
      });
    }

    return res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(renderDocAuthPage({ redirectUrl: req.originalUrl }));
  });

  app.use(
    "/doc",
    swaggerUi.serveFiles(swaggerFile, {}),
    swaggerUi.setup(swaggerFile, {
      customSiteTitle: `${organization.title} | API`,
      customfavIcon: organization.favicon.url,
      customCssUrl: [
        "/theme/fonts.css",
        "/theme/theme.css",
        "/css/style.css",
      ] as unknown as string,
      customJs: ["/js/theme.js", "/js/swagger.js"],
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
      },
    }),
  );
} else {
  console.warn(
    "⚠️ Warning: swagger.json not found. Run 'npm run swagger' to generate API docs.",
  );
}

// ============================================================================
// Browser Pages (1: Index / Status)
// ============================================================================
app.use("/", pagesRoutes);

// ============================================================================
// PIPELINE STEPS 6-10: Domain Modules (REST APIs), Scoped CSP & Rate Limiting
// ============================================================================
app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'",
  );
  next();
});
app.use("/v1", (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'",
  );
  next();
});
app.use("/api", generalLimiter);
app.use("/v1", generalLimiter);

// ----------------------------------------------------------------------------
// Strict API v1 Routes (/api/v1/* and /v1/*)
// ----------------------------------------------------------------------------
app.use("/api/v1/auth", authRoutes);
app.use("/v1/auth", authRoutes);

app.use("/api/v1/users", usersRoutes);
app.use("/v1/users", usersRoutes);

app.use("/api/v1/organizations", organizationsRoutes);
app.use("/v1/organizations", organizationsRoutes);

app.use("/api/v1/categories", categoriesRoutes);
app.use("/v1/categories", categoriesRoutes);

app.use("/api/v1/theme", themeRoutes);
app.use("/v1/theme", themeRoutes);

app.use("/api/v1/assets", assetsRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/v1/assets", assetsRoutes);

app.use("/api/v1/seller/assets", sellerAssetsRouter);
app.use("/api/seller/assets", sellerAssetsRouter);
app.use("/v1/seller/assets", sellerAssetsRouter);

app.use("/api/v1/admin/assets", adminAssetsRoutes);
app.use("/v1/admin/assets", adminAssetsRoutes);

app.use("/api/v1/downloads", downloadsRoutes);
app.use("/v1/downloads", downloadsRoutes);

app.use("/api/v1/licenses", licensesRoutes);
app.use("/v1/licenses", licensesRoutes);

app.use("/api/v1/storage", storageRoutes);
app.use("/v1/storage", storageRoutes);

app.use("/api/v1/notifications", notificationsRoutes);
app.use("/v1/notifications", notificationsRoutes);

app.use("/api/v1/banners", bannersRoutes);
app.use("/api/banners", bannersRoutes);
app.use("/v1/banners", bannersRoutes);

app.use("/api/v1/hero", heroRoutes);
app.use("/api/hero", heroRoutes);
app.use("/v1/hero", heroRoutes);

app.use("/api/v1/seller/storefront", sellerStorefrontRouter);
app.use("/api/seller/storefront", sellerStorefrontRouter);
app.use("/v1/seller/storefront", sellerStorefrontRouter);

app.use("/api/v1/seller/team", sellerTeamRouter);
app.use("/api/seller/team", sellerTeamRouter);
app.use("/v1/seller/team", sellerTeamRouter);

app.use("/api/v1/seller/users", sellerTeamRouter);
app.use("/api/seller/users", sellerTeamRouter);
app.use("/v1/seller/users", sellerTeamRouter);

app.use("/api/v1/catalog/storefronts", publicStorefrontRouter);
app.use("/api/catalog/storefronts", publicStorefrontRouter);
app.use("/v1/catalog/storefronts", publicStorefrontRouter);

app.use("/api/v1/logs", logsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/v1/logs", logsRoutes);

app.use("/api/v1/coupons", couponsRouter);
app.use("/api/coupons", couponsRouter);
app.use("/v1/coupons", couponsRouter);

app.use("/api/v1/seller/coupons", couponsRouter);
app.use("/api/seller/coupons", couponsRouter);
app.use("/v1/seller/coupons", couponsRouter);

app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/v1/analytics", analyticsRoutes);

// ============================================================================
// 404 Catch-All Handler
// ============================================================================
app.use((req: Request, res: Response, next: NextFunction) => {
  const isApiRoute =
    req.path.startsWith("/api/") ||
    req.path === "/api" ||
    req.path.startsWith("/v1/") ||
    req.path === "/v1";
  const isDocRoute = req.path.startsWith("/doc");
  const acceptsHtml = req.accepts(["json", "html"]) === "html";

  // Ignore Swagger documentation route from 404 handling
  if (isDocRoute) {
    next();
    return;
  }

  if (!isApiRoute && acceptsHtml) {
    res
      .status(404)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(renderErrorPage(req.originalUrl));
    return;
  }

  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// ============================================================================
// Centralized Error Sanitization Middleware
// ============================================================================
app.use(errorMiddleware);

export default app;
