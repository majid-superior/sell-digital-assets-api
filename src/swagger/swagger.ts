// src/swagger/swagger.ts
import swaggerAutogen from "swagger-autogen";
import path from "node:path";
import fs from "node:fs";
import { env } from "../config/env.js";
import { organization } from "../data/organizations.js";

const targetDir = path.resolve(process.cwd(), "src/swagger");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const doc = {
  openapi: "3.0.0",
  info: {
    title: `${organization.title}`,
    version: "1.0.0",
    description: organization.description,
  },
  servers: [
    {
      url: `http://localhost:${env.PORT || 5000}`,
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "Health", description: "API and database observability endpoints" },
    {
      name: "Organization Branding",
      description:
        "Organization branding, legal details, and platform settings",
    },
    {
      name: "Authentication",
      description: "User registration, authentication and JWT refresh tokens",
    },
    {
      name: "Categories",
      description:
        "Digital assets category taxonomy, hierarchical trees, and CRUD management",
    },
    {
      name: "Users",
      description: "User account management and role-based access",
    },
    {
      name: "Theme",
      description:
        "Dynamic database theme styling, color tokens, and CSS variables",
    },
    {
      name: "Assets - Public",
      description: "Marketplace public discovery and asset catalog",
    },
    {
      name: "Assets - Seller",
      description: "Seller asset creation, updates, and lifecycle management",
    },
    {
      name: "Assets - Admin",
      description: "Admin asset moderation, approval, rejection, and review feedback",
    },
    {
      name: "Banners",
      description: "Promotional announcement banners CRUD, scheduling, priority, and public delivery",
    },
    {
      name: "Notifications",
      description: "In-app notifications for admins and sellers regarding asset submissions & decisions",
    },
    {
      name: "Downloads",
      description: "Secure fulfillment and signed download tokens",
    },
    {
      name: "Licenses",
      description: "Cryptographic license keys, activations, and seat checks",
    },
    {
      name: "Storage",
      description: "Local storage simulator and presigned direct delivery endpoints",
    },
    {
      name: "Storefront",
      description: "Seller storefront customization and public storefront catalog",
    },
    {
      name: "Logs",
      description: "Platform audit trails, security event logging, and administrator activity records",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token directly without 'Bearer ' prefix.",
      },
    },
    schemas: {
      RegisterInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "StrongP@ssw0rd!",
          },
          role: {
            type: "string",
            enum: ["buyer", "seller"],
            example: "buyer",
            default: "buyer",
            description: "Role to assign to the new account (buyer or seller)",
          },
        },
      },
      SignInInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "StrongP@ssw0rd!",
          },
        },
      },
      RefreshTokenInput: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
      UpdateUserInput: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["active", "deactive", "pending", "suspended", "banned"],
            example: "active",
          },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "123e4567-e89b-12d3-a456-426614174000",
          },
          name: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          role: { type: "string", example: "user" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      CreateCategoryInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "UI & UX Kits" },
          slug: { type: "string", example: "ui-and-ux-kits" },
          parentId: { type: "integer", nullable: true, example: 1 },
          description: {
            type: "string",
            nullable: true,
            example: "User interface design systems and components",
          },
          displayOrder: { type: "integer", example: 1 },
          isActive: { type: "boolean", example: true },
          metadata: { type: "object", example: {} },
        },
      },
      UpdateCategoryInput: {
        type: "object",
        properties: {
          name: { type: "string", example: "Mobile App UI Kits" },
          slug: { type: "string", example: "mobile-app-ui-kits" },
          parentId: { type: "integer", nullable: true, example: 3 },
          description: {
            type: "string",
            nullable: true,
            example: "iOS and Android mobile app UI design kits",
          },
          displayOrder: { type: "integer", example: 2 },
          isActive: { type: "boolean", example: true },
          metadata: { type: "object", example: {} },
        },
      },
      CategoryResponse: {
        type: "object",
        properties: {
          id: { type: "integer", example: 3 },
          parent_id: { type: "integer", nullable: true, example: 1 },
          parent_name: {
            type: "string",
            nullable: true,
            example: "Graphics & Design",
          },
          parent_slug: {
            type: "string",
            nullable: true,
            example: "graphics-and-design",
          },
          name: { type: "string", example: "UI & UX Kits" },
          slug: { type: "string", example: "ui-and-ux-kits" },
          depth: { type: "integer", example: 1 },
          path: { type: "string", example: "Graphics & Design > UI & UX Kits" },
          description: {
            type: "string",
            nullable: true,
            example: "Component libraries and mobile app kits",
          },
          display_order: { type: "integer", example: 3 },
          is_active: { type: "boolean", example: true },
          metadata: { type: "object" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      UpdateOrganizationInput: {
        type: "object",
        properties: {
          organization_name: { type: "string", example: "AssetDrop" },
          legal_name: { type: "string", example: "AssetDrop Inc." },
          tagline: { type: "string", example: "Digital Assets Marketplace" },
          description: {
            type: "string",
            example: "Platform for selling digital assets",
          },
          logo_url: { type: "string", example: "/logo.png" },
          logo_dark_url: { type: "string", example: "/logo-dark.png" },
          favicon_url: { type: "string", example: "/favicon.ico" },
          cover_banner_url: { type: "string", example: "/banner.png" },
          support_email: {
            type: "string",
            format: "email",
            example: "support@selldigitalassets.com",
          },
          contact_email: {
            type: "string",
            format: "email",
            example: "contact@selldigitalassets.com",
          },
          support_phone: { type: "string", example: "+00 (012) 345-6789" },
          support_url: {
            type: "string",
            format: "uri",
            example: "https://selldigitalassets.com/support",
          },
          address_line1: { type: "string", example: "Ring Road" },
          address_line2: { type: "string", example: "" },
          city: { type: "string", example: "Lahore" },
          state: { type: "string", example: "Punjab" },
          postal_code: { type: "string", example: "000000" },
          country: { type: "string", example: "Pakistan" },
          tax_id: { type: "string", example: "" },
          default_currency: { type: "string", example: "PKR" },
          platform_fee_percent: { type: "number", example: 5.0 },
          payout_minimum: { type: "number", example: 25000.0 },
          social_links: { type: "object", example: {} },
          metadata: { type: "object", example: {} },
        },
      },
      UpdateThemeInput: {
        type: "object",
        properties: {
          name: { type: "string", example: "Cyber Violet" },
          mode: { type: "string", enum: ["light", "dark"], example: "dark" },
          color_hex_map: {
            type: "object",
            example: {
              light: { primary: "#6d28d9", secondary: "#0284c7" },
              dark: { primary: "#a78bfa", secondary: "#38bdf8" },
            },
          },
          border_radius: { type: "string", example: "rounded-lg" },
          typography: { type: "object", example: {} },
        },
      },
      CreateThemeInput: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          name: { type: "string", example: "Emerald City" },
          slug: { type: "string", example: "emerald-city" },
          is_active: { type: "boolean", example: false },
          color_hex_map: { type: "object", example: {} },
          color_tokens: { type: "object", example: {} },
          metadata: { type: "object", example: {} },
        },
      },
    },
  },
};

const outputFile = "./src/swagger/swagger.json";

const routes = [
  "./src/app.ts",
  "./src/modules/auth/auth.routes.ts",
  "./src/modules/users/users.routes.ts",
  "./src/modules/organizations/organizations.routes.ts",
  "./src/modules/categories/categories.routes.ts",
  "./src/modules/theme/theme.routes.ts",
  "./src/modules/assets/assets.routes.ts",
  "./src/modules/assets/admin-assets.routes.ts",
  "./src/modules/assets/downloads.routes.ts",
  "./src/modules/assets/licenses.routes.ts",
  "./src/modules/assets/storage.routes.ts",
  "./src/modules/notifications/notifications.routes.ts",
  "./src/modules/banners/banners.routes.ts",
  "./src/modules/hero/hero.routes.ts",
  "./src/modules/storefront/storefront.routes.ts",
  "./src/modules/logs/logs.routes.ts",
];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, routes, doc).then(async () => {
  // Post-process to filter out non-API internal routes and unmounted duplicates
  if (!fs.existsSync(outputFile)) return;

  const spec = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  const cleanedPaths: Record<string, any> = {};

  for (const [routePath, methods] of Object.entries<any>(spec.paths || {})) {
    // Only keep real /api/v1 routes
    if (!routePath.startsWith("/api/v1/")) continue;

    // Normalize trailing slash e.g. /api/v1/users/ -> /api/v1/users
    const normalizedPath =
      routePath.endsWith("/") && routePath.length > 1
        ? routePath.slice(0, -1)
        : routePath;

    // Skip redundant alias endpoints and swagger-autogen router merge artifacts
    if (
      normalizedPath.startsWith("/api/v1/themes") ||
      normalizedPath === "/api/v1/theme/active" ||
      normalizedPath === "/api/v1/theme/styles.css" ||
      normalizedPath === "/api/v1/organizations/system-settings" ||
      normalizedPath.startsWith("/api/v1/assets/{id}") ||
      normalizedPath.startsWith("/api/v1/seller/assets/seller") ||
      normalizedPath === "/api/v1/seller/assets/categories" ||
      normalizedPath === "/api/v1/seller/assets/{slug}"
    ) {
      continue;
    }

    cleanedPaths[normalizedPath] = methods;

    // Remove phantom express middleware parameters (req, res, next)
    for (const method of Object.values<any>(methods)) {
      if (Array.isArray(method.parameters)) {
        method.parameters = method.parameters.filter(
          (p: any) =>
            p && p.name !== "req" && p.name !== "res" && p.name !== "next",
        );
      }
    }

    // Enhance operation metadata
    if (normalizedPath.startsWith("/api/v1/auth")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Authentication"];
      }
      if (normalizedPath === "/api/v1/auth/signup" && methods.post) {
        methods.post.summary = "Register a new user";
        methods.post.description =
          "Creates a new user account and returns JWT tokens";
        methods.post.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" },
            },
          },
        };
      } else if (normalizedPath === "/api/v1/auth/signin" && methods.post) {
        methods.post.summary = "User sign in";
        methods.post.description =
          "Authenticates credentials and returns access & refresh tokens";
        methods.post.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignInInput" },
            },
          },
        };
      } else if (normalizedPath === "/api/v1/auth/refresh" && methods.post) {
        methods.post.summary = "Refresh access token";
        methods.post.description =
          "Exchanges a valid refresh token for a new access token";
        methods.post.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenInput" },
            },
          },
        };
      } else if (normalizedPath === "/api/v1/auth/signout" && methods.post) {
        methods.post.summary = "User sign out";
        methods.post.description =
          "Revokes active refresh token session and clears authentication cookies";
        methods.post.requestBody = {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenInput" },
            },
          },
        };
      } else if (normalizedPath === "/api/v1/auth/me") {
        if (methods.get) {
          methods.get.summary = "Get current authenticated profile";
          methods.get.description = "Retrieves profile of the token owner";
          methods.get.security = [{ bearerAuth: [] }];
        }
        if (methods.patch) {
          methods.patch.summary = "Update current profile";
          methods.patch.description = "Updates own profile details or password";
          methods.patch.security = [{ bearerAuth: [] }];
        }
      } else if (normalizedPath === "/api/v1/auth/become-seller" && methods.post) {
        methods.post.summary = "Upgrade buyer account to seller";
        methods.post.description =
          "Upgrades the authenticated buyer account to the Seller role";
        methods.post.security = [{ bearerAuth: [] }];
      }
    } else if (normalizedPath.startsWith("/api/v1/users")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Users"];
        method.security = [{ bearerAuth: [] }];
      }
      if (normalizedPath === "/api/v1/users") {
        if (methods.get) {
          methods.get.summary = "List users (Admin only)";
          methods.get.description =
            "Returns paginated list of registered users";
        }
      } else if (normalizedPath === "/api/v1/users/{id}") {
        if (methods.get) {
          methods.get.summary = "Get user by ID (Admin only)";
          methods.get.description = "Retrieves user record by UUID";
        }
        if (methods.patch) {
          methods.patch.summary = "Update user status by ID (Admin only)";
          methods.patch.description =
            "Updates user status (active, deactive, suspended)";
          methods.patch.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateUserInput" },
              },
            },
          };
        }
        if (methods.delete) {
          methods.delete.summary = "Deactivate user by ID (Admin only)";
          methods.delete.description =
            "Deactivates user account by UUID";
        }
      }
    } else if (normalizedPath === "/api/v1/organizations/currencies") {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Organization Branding"];
      }
      if (methods.get) {
        methods.get.summary = "List supported currencies";
        methods.get.description =
          "Retrieves all active platform supported currencies (PKR, USD, EUR, GBP, etc.)";
        methods.get.parameters = [];
        methods.get.responses = {
          200: {
            description: "List of supported currencies",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          code: { type: "string", example: "PKR" },
                          name: { type: "string", example: "Pakistani Rupee" },
                          symbol: { type: "string", example: "₨" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };
      }
    } else if (normalizedPath === "/api/v1/organizations/settings/system") {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Organization Branding"];
      }
      if (methods.get) {
        methods.get.summary = "Get platform system settings";
        methods.get.description =
          "Retrieves dynamic session, authentication, and security policies";
      }
      if (methods.put) {
        methods.put.summary = "Replace platform system settings (Admin only)";
        methods.put.description =
          "Updates dynamic session, authentication, and security policies in PostgreSQL";
        methods.put.security = [{ bearerAuth: [] }];
      }
      if (methods.patch) {
        methods.patch.summary = "Update platform system settings (Admin only)";
        methods.patch.description =
          "Partially updates dynamic session, authentication, and security policies in PostgreSQL";
        methods.patch.security = [{ bearerAuth: [] }];
      }
    } else if (normalizedPath === "/api/v1/organizations") {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Organization Branding"];
      }
      if (methods.get) {
        methods.get.summary = "Get organization details & platform branding";
        methods.get.description =
          "Retrieves public organization details, branding, and platform settings";
        methods.get.parameters = [];
      }
      if (methods.put) {
        methods.put.summary = "Update organization details (Admin only)";
        methods.put.description =
          "Updates organization profile, branding, URLs, addresses, and platform settings";
        methods.put.security = [{ bearerAuth: [] }];
        if (methods.put.requestBody?.content?.["application/json"]) {
          methods.put.requestBody.content["application/json"].schema = {
            $ref: "#/components/schemas/UpdateOrganizationInput",
          };
        }
      }
      if (methods.patch) {
        methods.patch.summary =
          "Partially update organization details (Admin only)";
        methods.patch.description =
          "Partially updates organization configuration";
        methods.patch.security = [{ bearerAuth: [] }];
        if (methods.patch.requestBody?.content?.["application/json"]) {
          methods.patch.requestBody.content["application/json"].schema = {
            $ref: "#/components/schemas/UpdateOrganizationInput",
          };
        }
      }
    } else if (normalizedPath.startsWith("/api/v1/categories")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Categories"];
      }
      if (normalizedPath === "/api/v1/categories") {
        if (methods.get) {
          methods.get.summary = "List categories or fetch category tree";
          methods.get.description =
            "Retrieves categories list or nested hierarchical tree. Supports query params: ?tree=true, ?page=, ?limit=, ?search=, ?parentId=, ?includeInactive=true";
          methods.get.parameters = [
            {
              name: "tree",
              in: "query",
              schema: { type: "boolean" },
              description: "Return nested hierarchical tree structure",
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Search by category name, path, or slug",
            },
            {
              name: "parentId",
              in: "query",
              schema: { type: "integer" },
              description: "Filter by parent category ID",
            },
            {
              name: "depth",
              in: "query",
              schema: { type: "integer" },
              description: "Filter by hierarchical depth (0 = root)",
            },
            {
              name: "includeInactive",
              in: "query",
              schema: { type: "boolean" },
              description: "Include deactivated / soft-deleted categories",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer" },
              description: "Page number for pagination",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer" },
              description: "Page size limit",
            },
          ];
        }
        if (methods.post) {
          methods.post.summary = "Create category (Admin only)";
          methods.post.description =
            "Creates a new category. Automatically derives depth and hierarchical breadcrumb path.";
          methods.post.security = [{ bearerAuth: [] }];
          methods.post.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateCategoryInput" },
              },
            },
          };
        }
      } else if (normalizedPath === "/api/v1/categories/{id}") {
        if (methods.get) {
          methods.get.summary = "Get category by ID";
          methods.get.description =
            "Retrieves category record with resolved parent category information";
          methods.get.parameters = [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Category ID",
            },
          ];
        }
        if (methods.patch) {
          methods.patch.summary = "Update category by ID (Admin only)";
          methods.patch.description =
            "Updates category properties. Automatically recalculates depth and cascades path updates to child subcategories.";
          methods.patch.security = [{ bearerAuth: [] }];
          methods.patch.parameters = [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Category ID",
            },
          ];
          methods.patch.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateCategoryInput" },
              },
            },
          };
        }
        if (methods.put) {
          methods.put.summary = "Replace/Update category by ID (Admin only)";
          methods.put.description =
            "Updates category properties. Automatically recalculates depth and cascades path updates to child subcategories.";
          methods.put.security = [{ bearerAuth: [] }];
          methods.put.parameters = [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Category ID",
            },
          ];
          methods.put.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateCategoryInput" },
              },
            },
          };
        }
        if (methods.delete) {
          methods.delete.summary = "Soft-delete category by ID (Admin only)";
          methods.delete.description =
            "Soft-deletes a category by toggling is_active = FALSE. Physical SQL DELETE is strictly prohibited.";
          methods.delete.security = [{ bearerAuth: [] }];
          methods.delete.parameters = [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Category ID",
            },
            {
              name: "cascade",
              in: "query",
              schema: { type: "boolean" },
              description: "Cascade deactivation to all child subcategories",
            },
          ];
        }
      } else if (normalizedPath === "/api/v1/categories/{id}/restore") {
        if (methods.post) {
          methods.post.summary =
            "Restore soft-deleted category by ID (Admin only)";
          methods.post.description =
            "Reactivates an archived category (sets is_active = TRUE) and optionally restores parent ancestor chain.";
          methods.post.security = [{ bearerAuth: [] }];
          methods.post.parameters = [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Category ID",
            },
            {
              name: "restoreParents",
              in: "query",
              schema: { type: "boolean" },
              description: "Also reactivate parent ancestor categories",
            },
          ];
        }
      }
    } else if (normalizedPath === "/api/v1/health") {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Health"];
        method.summary = "System health status";
        method.description =
          "Returns database connectivity and operational telemetry";
        method.parameters = [];
        method.responses = {
          200: {
            description: "System and database status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        uptime: { type: "number", example: 120.5 },
                        timestamp: { type: "string", format: "date-time" },
                        database: {
                          type: "object",
                          properties: {
                            connected: { type: "boolean", example: true },
                            latency: { type: "number", example: 1.2 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };
      }
    } else if (normalizedPath.startsWith("/api/v1/theme")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Theme"];
      }
      if (normalizedPath === "/api/v1/theme") {
        if (methods.get) {
          methods.get.summary = "Get active theme styling & tokens";
          methods.get.description =
            "Retrieves currently active database theme palette with conditional ETag validation";
          methods.get.parameters = [];
        }
        if (methods.post) {
          methods.post.summary = "Create a new theme (Admin only)";
          methods.post.description =
            "Creates a new theme palette in PostgreSQL";
          methods.post.security = [{ bearerAuth: [] }];
          methods.post.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateThemeInput" },
              },
            },
          };
        }
        if (methods.put) {
          methods.put.summary = "Update active theme (Admin only)";
          methods.put.description =
            "Updates database theme styling, invalidates caches, and synchronizes CSS tokens";
          methods.put.security = [{ bearerAuth: [] }];
          methods.put.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateThemeInput" },
              },
            },
          };
        }
        if (methods.patch) {
          methods.patch.summary = "Partially update active theme (Admin only)";
          methods.patch.description =
            "Partially updates active database theme styling and CSS tokens";
          methods.patch.security = [{ bearerAuth: [] }];
          methods.patch.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateThemeInput" },
              },
            },
          };
        }
      } else if (normalizedPath === "/api/v1/theme/all" && methods.get) {
        methods.get.summary = "List all registered themes";
        methods.get.description = "Retrieves all themes stored in PostgreSQL";
      } else if (normalizedPath === "/api/v1/theme/{id}/activate" && methods.post) {
        methods.post.summary = "Activate theme by ID (Admin only)";
        methods.post.description = "Activates a specific theme palette by ID";
        methods.post.security = [{ bearerAuth: [] }];
      } else if (normalizedPath === "/api/v1/theme/css") {
        if (methods.get) {
          methods.get.summary = "Get dynamic compiled CSS stylesheet";
          methods.get.description =
            "Generates pure CSS variables (:root and .dark) compiled directly from the active database theme";
          methods.get.parameters = [];
        }
      }
    } else if (
      normalizedPath.startsWith("/api/v1/assets/seller") ||
      normalizedPath.startsWith("/api/v1/seller/assets")
    ) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Assets - Seller"];
        method.security = [{ bearerAuth: [] }];
      }
      if (
        normalizedPath === "/api/v1/assets/seller" ||
        normalizedPath === "/api/v1/seller/assets"
      ) {
        if (methods.get) {
          methods.get.summary = "List seller's own assets & stats";
          methods.get.description =
            "Returns paginated list of assets belonging to the authenticated seller";
        }
        if (methods.post) {
          methods.post.summary = "Create draft digital asset";
          methods.post.description =
            "Creates a new digital asset in draft status for the authenticated seller";
        }
      } else if (normalizedPath.endsWith("/status") && methods.post) {
        methods.post.summary = "Transition seller asset status";
        methods.post.description =
          "Transitions asset between draft, pending review, and archived states";
      } else if (normalizedPath.endsWith("/files/presign-upload") && methods.post) {
        methods.post.summary = "Generate presigned deliverable upload URL";
        methods.post.description =
          "Generates a signed upload URL for a deliverable asset file";
      } else if (normalizedPath.endsWith("/files/confirm") && methods.post) {
        methods.post.summary = "Confirm deliverable file upload";
        methods.post.description =
          "Verifies uploaded deliverable file on storage and attaches it to the asset";
      } else if (normalizedPath.endsWith("/media/presign-upload") && methods.post) {
        methods.post.summary = "Generate presigned media preview upload URL";
        methods.post.description =
          "Generates a signed upload URL for asset preview images, videos, or audio";
      } else if (normalizedPath.endsWith("/media/confirm") && methods.post) {
        methods.post.summary = "Confirm media preview upload";
        methods.post.description =
          "Verifies uploaded showcase media on storage and attaches it to the asset";
      } else if (normalizedPath.includes("/files/{fileId}") && methods.delete) {
        methods.delete.summary = "Decommission deliverable file version";
        methods.delete.description =
          "Removes and archives a specific deliverable file version";
      } else {
        if (methods.patch) {
          methods.patch.summary = "Update seller asset details";
          methods.patch.description =
            "Updates asset metadata, descriptions, technical specs, or pricing tiers";
        }
        if (methods.delete) {
          methods.delete.summary = "Soft-delete and archive seller asset";
          methods.delete.description =
            "Archives and soft-deletes an asset owned by the authenticated seller";
        }
      }
    } else if (normalizedPath.startsWith("/api/v1/assets")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Assets - Public"];
      }
      if (normalizedPath === "/api/v1/assets" && methods.get) {
        methods.get.summary = "Browse public marketplace catalog";
        methods.get.description =
          "Returns filtered and paginated published digital assets";
      } else if (normalizedPath === "/api/v1/assets/categories" && methods.get) {
        methods.get.summary = "Get marketplace category tree";
        methods.get.description =
          "Returns active hierarchical category tree for asset discovery";
      } else if (normalizedPath === "/api/v1/assets/featured" && methods.get) {
        methods.get.summary = "Get curated featured marketplace assets";
        methods.get.description =
          "Returns curated and top-performing published digital assets for landing showcases";
      } else if (normalizedPath === "/api/v1/assets/{slug}" && methods.get) {
        methods.get.summary = "Get published asset details by slug";
        methods.get.description =
          "Retrieves full public details, media previews, and licensing tiers for a published asset";
      }
    } else if (normalizedPath.startsWith("/api/v1/admin/assets")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Assets - Admin"];
        method.security = [{ bearerAuth: [] }];
      }
      if (normalizedPath === "/api/v1/admin/assets" && methods.get) {
        methods.get.summary = "List assets for admin moderation (Admin only)";
        methods.get.description =
          "Retrieves paginated assets across all statuses with queue counts";
      } else if (normalizedPath === "/api/v1/admin/assets/counts" && methods.get) {
        methods.get.summary = "Get admin asset review queue counts (Admin only)";
        methods.get.description =
          "Returns asset counts grouped by status for moderation dashboards";
      } else if (normalizedPath === "/api/v1/admin/assets/{id}" && methods.get) {
        methods.get.summary = "Get full asset details for review (Admin only)";
        methods.get.description =
          "Retrieves complete asset details including files, media, tiers, and review logs";
      } else if (normalizedPath === "/api/v1/admin/assets/{id}/review" && methods.post) {
        methods.post.summary = "Submit admin moderation decision (Admin only)";
        methods.post.description =
          "Approves, rejects, or requests updates on a submitted asset and dispatches seller notifications";
      }
    } else if (normalizedPath.startsWith("/api/v1/downloads")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Downloads"];
      }
      if (normalizedPath === "/api/v1/downloads/{assetId}/generate-link" && methods.post) {
        methods.post.summary = "Generate signed asset download link";
        methods.post.description =
          "Verifies license or ownership entitlement and returns a short-lived signed download URL";
      }
    } else if (normalizedPath.startsWith("/api/v1/licenses")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Licenses"];
      }
      if (normalizedPath === "/api/v1/licenses/verify" && methods.post) {
        methods.post.summary = "Verify cryptographic license key";
        methods.post.description =
          "Validates license status, tier, expiration, and seat activations";
      } else if (normalizedPath === "/api/v1/licenses/activate" && methods.post) {
        methods.post.summary = "Activate domain or machine seat on license";
        methods.post.description =
          "Registers a domain or machine identifier against a license key within its seat limit";
      } else if (normalizedPath === "/api/v1/licenses/issue" && methods.post) {
        methods.post.summary = "Issue cryptographic license key (Admin only)";
        methods.post.description =
          "Issues a new license key for a buyer and asset tier";
        methods.post.security = [{ bearerAuth: [] }];
      } else if (normalizedPath === "/api/v1/licenses/buyer" && methods.get) {
        methods.get.summary = "List authenticated buyer's licenses";
        methods.get.description =
          "Retrieves all licenses owned by the authenticated buyer";
        methods.get.security = [{ bearerAuth: [] }];
      }
    } else if (normalizedPath.startsWith("/api/v1/storage")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Storage"];
      }
      if (normalizedPath === "/api/v1/storage/upload" && methods.put) {
        methods.put.summary = "Direct signed stream upload";
        methods.put.description =
          "Streams a binary file upload to local storage using a valid HMAC upload token";
      } else if (normalizedPath === "/api/v1/storage/download" && methods.get) {
        methods.get.summary = "Direct signed stream download";
        methods.get.description =
          "Streams a binary file from local storage using a valid HMAC download token";
      }
    } else if (normalizedPath.startsWith("/api/v1/notifications")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Notifications"];
        method.security = [{ bearerAuth: [] }];
      }
      if (normalizedPath === "/api/v1/notifications" && methods.get) {
        methods.get.summary = "List notifications for authenticated user";
        methods.get.description =
          "Returns paginated in-app notifications and unread count";
      } else if (normalizedPath === "/api/v1/notifications/read-all" && methods.post) {
        methods.post.summary = "Mark all notifications as read";
        methods.post.description =
          "Marks all unread notifications for the authenticated user as read";
      } else if (normalizedPath === "/api/v1/notifications/{id}/read" && methods.patch) {
        methods.patch.summary = "Mark single notification as read";
        methods.patch.description =
          "Marks a specific notification as read by UUID";
      }
    } else if (normalizedPath.startsWith("/api/v1/banners")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Banners"];
        if (
          normalizedPath !== "/api/v1/banners/active" &&
          normalizedPath !== "/api/v1/banners/public"
        ) {
          method.security = [{ bearerAuth: [] }];
        }
      }
      if (
        (normalizedPath === "/api/v1/banners/active" ||
          normalizedPath === "/api/v1/banners/public") &&
        methods.get
      ) {
        methods.get.summary = "Get active promotional banners";
        methods.get.description =
          "Returns only currently active and schedule-eligible promotional banners ordered by priority";
      } else if (normalizedPath === "/api/v1/banners") {
        if (methods.get) {
          methods.get.summary = "List all promotional banners (Admin only)";
          methods.get.description =
            "Returns all promotional banners with computed status and summary metrics";
        }
        if (methods.post) {
          methods.post.summary = "Create promotional banner (Admin only)";
          methods.post.description =
            "Creates a new promotional banner in PostgreSQL";
        }
      } else if (normalizedPath === "/api/v1/banners/{id}/status" && methods.patch) {
        methods.patch.summary = "Toggle promotional banner active status (Admin only)";
        methods.patch.description =
          "Activates or deactivates a promotional banner by UUID";
      } else if (normalizedPath === "/api/v1/banners/{id}") {
        if (methods.get) {
          methods.get.summary = "Get promotional banner by ID (Admin only)";
        }
        if (methods.patch) {
          methods.patch.summary = "Update promotional banner (Admin only)";
        }
        if (methods.put) {
          methods.put.summary = "Replace/Update promotional banner (Admin only)";
        }
        if (methods.delete) {
          methods.delete.summary = "Delete promotional banner (Admin only)";
        }
      }
    } else if (
      normalizedPath.startsWith("/api/v1/seller/storefront") ||
      normalizedPath.startsWith("/api/v1/catalog/storefronts")
    ) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Storefront"];
        if (normalizedPath.startsWith("/api/v1/seller/storefront")) {
          method.security = [{ bearerAuth: [] }];
        }
      }
      if (normalizedPath === "/api/v1/seller/storefront") {
        if (methods.get) {
          methods.get.summary = "Get authenticated seller storefront configuration";
        }
        if (methods.put) {
          methods.put.summary = "Update authenticated seller storefront configuration";
        }
      } else if (normalizedPath === "/api/v1/seller/storefront/check-url" && methods.get) {
        methods.get.summary = "Check seller storefront custom URL availability";
      } else if (normalizedPath === "/api/v1/seller/storefront/banner/presign" && methods.post) {
        methods.post.summary = "Generate presigned URL for seller storefront banner upload";
      } else if (normalizedPath === "/api/v1/catalog/storefronts/{sellerUrl}" && methods.get) {
        methods.get.summary = "Get public seller storefront profile and catalog by seller URL";
      }
    } else if (normalizedPath.startsWith("/api/v1/seller/team")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Users"];
        method.security = [{ bearerAuth: [] }];
      }
      if (normalizedPath === "/api/v1/seller/team") {
        if (methods.get) {
          methods.get.summary = "List seller team members";
        }
        if (methods.post) {
          methods.post.summary = "Add sub-user team member (MANAGER, USER, ANALYST)";
        }
      } else if (normalizedPath === "/api/v1/seller/team/{id}") {
        if (methods.patch) {
          methods.patch.summary = "Update seller team member";
        }
        if (methods.delete) {
          methods.delete.summary = "Remove seller team member";
        }
      }
    }
  }

  if (cleanedPaths["/api/v1/users/{id}"]) {
    if (!cleanedPaths["/api/v1/users/{id}"].patch) {
      cleanedPaths["/api/v1/users/{id}"].patch = {
        tags: ["Users"],
        summary: "Update user by ID (Admin only)",
        description:
          "Updates user name, password, or status by UUID (role and email cannot be changed after registration)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserInput" },
            },
          },
        },
        responses: { 200: { description: "User updated successfully" } },
      };
    }
    if (!cleanedPaths["/api/v1/users/{id}"].delete) {
      cleanedPaths["/api/v1/users/{id}"].delete = {
        tags: ["Users"],
        summary: "Delete user by ID (Admin only)",
        description: "Deactivates / Soft-deletes user account by UUID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { 200: { description: "User deleted successfully" } },
      };
    }
  }

  spec.paths = cleanedPaths;
  fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2), "utf8");

  const distDir = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(distDir)) {
    const distSwaggerDir = path.join(distDir, "swagger");
    if (!fs.existsSync(distSwaggerDir)) {
      fs.mkdirSync(distSwaggerDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(distSwaggerDir, "swagger.json"),
      JSON.stringify(spec, null, 2),
      "utf8",
    );
  }

  console.log("Swagger-autogen: Cleaned and optimized swagger.json");
  process.exit(0);
});
