// src/swagger/swagger.ts
import swaggerAutogen from "swagger-autogen";
import path from "node:path";
import fs from "node:fs";
import { env } from "../config/env.js";
import { company } from "../data/company.js";

const targetDir = path.resolve(process.cwd(), "src/swagger");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const doc = {
  openapi: "3.0.0",
  info: {
    title: `${company.title} Documentation`,
    version: "1.0.0",
    description: company.description,
  },
  servers: [
    {
      url: `http://localhost:${env.PORT || 5000}`,
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "Authentication", description: "User registration, authentication and JWT refresh tokens" },
    { name: "Users", description: "User account management and role-based access" },
    { name: "Health", description: "API and database observability endpoints" },
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
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", format: "password", example: "StrongP@ssw0rd!" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", format: "password", example: "StrongP@ssw0rd!" },
        },
      },
      RefreshTokenInput: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
        },
      },
      CreateUserInput: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          password: { type: "string", format: "password", example: "StrongP@ssw0rd!" },
          role: { type: "string", enum: ["user", "creator", "admin"], example: "user" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "123e4567-e89b-12d3-a456-426614174000" },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: { type: "string", example: "user" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
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
    const normalizedPath = routePath.endsWith("/") && routePath.length > 1 ? routePath.slice(0, -1) : routePath;

    cleanedPaths[normalizedPath] = methods;

    // Enhance operation metadata
    if (normalizedPath.startsWith("/api/auth")) {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Authentication"];
      }
      if (normalizedPath === "/api/auth/register" && methods.post) {
        methods.post.summary = "Register a new user";
        methods.post.description = "Creates a new user account and returns JWT tokens";
        methods.post.requestBody = {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } },
        };
      } else if (normalizedPath === "/api/auth/login" && methods.post) {
        methods.post.summary = "User login";
        methods.post.description = "Authenticates credentials and returns access & refresh tokens";
        methods.post.requestBody = {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
        };
      } else if (normalizedPath === "/api/auth/refresh" && methods.post) {
        methods.post.summary = "Refresh access token";
        methods.post.description = "Exchanges a valid refresh token for a new access token";
        methods.post.requestBody = {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshTokenInput" } } },
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
          methods.get.description = "Returns paginated list of registered users";
        }
        if (methods.post) {
          methods.post.summary = "Create user (Admin only)";
          methods.post.description = "Creates a new user account with designated role";
          methods.post.requestBody = {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserInput" } } },
          };
        }
      } else if (normalizedPath === "/api/users/me" && methods.get) {
        methods.get.summary = "Get current authenticated profile";
        methods.get.description = "Retrieves profile of the token owner";
      } else if (normalizedPath === "/api/users/{id}" && methods.get) {
        methods.get.summary = "Get user by ID";
        methods.get.description = "Retrieves user record by UUID";
      }
    } else if (normalizedPath === "/api/health") {
      for (const method of Object.values<any>(methods)) {
        method.tags = ["Health"];
        method.summary = "System health status";
        method.description = "Returns database connectivity and operational telemetry";
      }
    }
  }

  spec.paths = cleanedPaths;
  fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2), "utf8");
  console.log("Swagger-autogen: Cleaned and optimized swagger.json");
});