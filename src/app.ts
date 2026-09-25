// src/app.ts
import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { AppError } from "./core/errors/app-error.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";
import { corsMiddleware } from "./core/middleware/cors.middleware.js";
import { requestIdMiddleware } from "./core/middleware/request-id.middleware.js";
import { generalLimiter } from "./core/middleware/rate-limit.middleware.js";
import { httpLogger } from "./core/logger/index.js";

// Browser Pages (1: Index / Status, 2: Error Page)
import pagesRoutes from "./pages/pages.routes.js";
import { renderErrorPage } from "./pages/error.page.js";

import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import companyRoutes from "./modules/company/company.routes.js";
import { company } from "./data/company.js";

const require = createRequire(import.meta.url);
const themeDistPath = path.resolve(
  path.dirname(require.resolve("@majid-superior/sell-digital-assets-theme/package.json")),
  "dist"
);

export const app = express();

// ============================================================================
// PIPELINE STEP 1: HTTPS & Reverse Proxy Handling
// ============================================================================
app.set("trust proxy", 1);

if (env.NODE_ENV === "production") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
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
// PIPELINE STEP 4: Rate Limiting
// ============================================================================
app.use(generalLimiter);

// ============================================================================
// PIPELINE STEP 5: Request ID & Parsing
// ============================================================================
app.use(requestIdMiddleware);
app.use(httpLogger);
app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
app.use(cookieParser());

// ============================================================================
// Static Assets & Centralized Theme
// ============================================================================
app.use("/theme", express.static(themeDistPath));
app.use(express.static("public"));

// ============================================================================
// Automated Swagger UI Documentation (/doc, /docs, /openapi.json)
// ============================================================================
const swaggerDistPath = path.resolve(process.cwd(), "dist/swagger/swagger.json");
const swaggerSrcPath = path.resolve(process.cwd(), "src/swagger/swagger.json");
const swaggerFilePath = fs.existsSync(swaggerDistPath) ? swaggerDistPath : swaggerSrcPath;

if (fs.existsSync(swaggerFilePath)) {
  const swaggerFile = JSON.parse(fs.readFileSync(swaggerFilePath, "utf8"));
  // 1. Define your explicit order
  const tagOrder = ["Health", "Company Branding", "Authentication", "Users"];
  // 2. Sort the top-level tags array
  if (Array.isArray(swaggerFile.tags)) {
    swaggerFile.tags.sort((a: { name: string }, b: { name: string }) => {
      const indexA = tagOrder.indexOf(a.name);
      const indexB = tagOrder.indexOf(b.name);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }

  app.use(
    "/doc",
    swaggerUi.serveFiles(swaggerFile, {}),
    swaggerUi.setup(swaggerFile, {
      customSiteTitle: `${company.title} Documentation`,
      customfavIcon: company.favicon.url,
      customCssUrl: [
        "/theme/fonts.css",
        "/theme/theme.css",
        "/css/style.css",
      ] as unknown as string,
      customJs: [
        "/js/theme.js",
        "/js/swagger.js",
      ],
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
      },
    })
  );
  app.get("/docs", (_req: Request, res: Response) => res.redirect(301, "/doc/"));
  app.get("/openapi.json", (_req: Request, res: Response) => res.json(swaggerFile));
} else {
  console.warn("⚠️ Warning: swagger.json not found. Run 'npm run swagger' to generate API docs.");
}

// ============================================================================
// Browser Pages (1: Index / Status)
// ============================================================================
app.use("/", pagesRoutes);

// ============================================================================
// PIPELINE STEPS 6-10: Domain Modules (REST APIs)
// ============================================================================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/company", companyRoutes);

// ============================================================================
// 404 Catch-All Handler
// ============================================================================
app.use((req: Request, res: Response, next: NextFunction) => {
  const isApiRoute = req.path.startsWith("/api/") || req.path === "/api";
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