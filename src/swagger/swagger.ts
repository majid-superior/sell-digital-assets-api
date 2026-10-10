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
        },
      },
      LoginInput: {
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
      CreateUserInput: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string", example: "Jane Doe" },
          email: {
            type: "string",
            format: "email",
            example: "jane@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "StrongP@ssw0rd!",
          },
          role: {
            type: "string",
            enum: ["user", "creator", "admin"],
            example: "user",
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
];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, routes, doc).then(async () => {
  // Post-process to filter out non-API internal routes and unmounted duplicates
  if (!fs.existsSync(outputFile)) return;

  const spec = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  const cleanedPaths: Record<string, any> = {};

  for (const [routePath, methods] of Object.entries<any>(spec.paths || {})) {
    // Only keep real /api routes
    if (!routePath.startsWith("/api/")) continue;

    // Normalize trailing slash e.g. /api/users/ -> /api/users
    const normalizedPath =
      routePath.endsWith("/") && routePath.length > 1
        ? routePath.slice(0, -1)
        : routePath;

    // Skip redundant alias endpoints to keep docs clean
    if (
      normalizedPath.startsWith("/api/themes") ||
      normalizedPath.startsWith("/api/v1/theme") ||
      normalizedPath.startsWith("/api/v1/themes") ||
      normalizedPath === "/api/theme/active" ||
      normalizedPath === "/api/theme/styles.css"
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
    if (normalizedPath.startsWith("/api/auth")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Authentication"];
      }
      if (normalizedPath === "/api/auth/register" && methods.post) {
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
      } else if (normalizedPath === "/api/auth/login" && methods.post) {
        methods.post.summary = "User login";
        methods.post.description =
          "Authenticates credentials and returns access & refresh tokens";
        methods.post.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        };
      } else if (normalizedPath === "/api/auth/refresh" && methods.post) {
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
      } else if (normalizedPath === "/api/auth/logout" && methods.post) {
        methods.post.summary = "User logout";
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
      }
    } else if (normalizedPath.startsWith("/api/users")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Users"];
        method.security = [{ bearerAuth: [] }];
      }
      if (normalizedPath === "/api/users") {
        if (methods.get) {
          methods.get.summary = "List users (Admin only)";
          methods.get.description =
            "Returns paginated list of registered users";
        }
        if (methods.post) {
          methods.post.summary = "Create user (Admin only)";
          methods.post.description =
            "Creates a new user account with designated role";
          methods.post.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateUserInput" },
              },
            },
          };
        }
      } else if (normalizedPath === "/api/users/me") {
        if (methods.get) {
          methods.get.summary = "Get current authenticated profile";
          methods.get.description = "Retrieves profile of the token owner";
        }
        if (methods.patch) {
          methods.patch.summary = "Update current profile";
          methods.patch.description = "Updates own profile details or password";
        }
      } else if (normalizedPath === "/api/users/{id}") {
        if (methods.get) {
          methods.get.summary = "Get user by ID (Admin only)";
          methods.get.description = "Retrieves user record by UUID";
        }
        if (methods.patch) {
          methods.patch.summary = "Update user by ID (Admin only)";
          methods.patch.description = "Updates user role, name, or status";
        }
        if (methods.delete) {
          methods.delete.summary = "Delete user by ID (Admin only)";
          methods.delete.description =
            "Deactivates / Soft-deletes user account by UUID";
        }
      }
    } else if (normalizedPath === "/api/organizations/currencies") {
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
    } else if (normalizedPath === "/api/organizations") {
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
    } else if (normalizedPath.startsWith("/api/categories")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Categories"];
      }
      if (normalizedPath === "/api/categories") {
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
      } else if (normalizedPath === "/api/categories/{id}") {
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
      } else if (normalizedPath === "/api/categories/{id}/restore") {
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
    } else if (normalizedPath === "/api/health") {
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
    } else if (normalizedPath.startsWith("/api/theme")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Theme"];
      }
      if (normalizedPath === "/api/theme") {
        if (methods.get) {
          methods.get.summary = "Get active theme styling & tokens";
          methods.get.description =
            "Retrieves currently active database theme palette with conditional ETag validation";
          methods.get.parameters = [];
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
      } else if (normalizedPath === "/api/theme/css") {
        if (methods.get) {
          methods.get.summary = "Get dynamic compiled CSS stylesheet";
          methods.get.description =
            "Generates pure CSS variables (:root and .dark) compiled directly from the active database theme";
          methods.get.parameters = [];
        }
      }
    }
  }

  if (cleanedPaths["/api/users/{id}"]) {
    if (!cleanedPaths["/api/users/{id}"].patch) {
      cleanedPaths["/api/users/{id}"].patch = {
        tags: ["Users"],
        summary: "Update user by ID (Admin only)",
        description: "Updates user role, name, or status by UUID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { 200: { description: "User updated successfully" } },
      };
    }
    if (!cleanedPaths["/api/users/{id}"].delete) {
      cleanedPaths["/api/users/{id}"].delete = {
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
});
