# Backend Engineering Guidelines & Architecture Standards

> **Applies to**: `sell-digital-assets-api` and all backend microservices.  
> **Scope**: Express 5 REST API, PostgreSQL database operations, authentication, security, theming, categories taxonomy, and data validation.  
> **Target Audience**: AI Agents and Backend Engineers.

---

## 1. Core Principles

1. **Zero Mock Data Principle**:
   - Never use fake in-memory mock objects, hardcoded user lists, or simulated JSON responses for business entities.
   - All persistence must strictly execute against the live PostgreSQL database via connection pooling (`src/config/database.ts`).
   - All tests and endpoints must interact with real database records or properly seeded fixtures.

2. **Strict Layered Architecture (SOC)**:
   - Every module under `src/modules/` must follow the decoupled 4-tier pattern:
     ```
     HTTP Request ──► [Routes] ──► [Controller] ──► [Service] ──► [Repository] ──► [PostgreSQL]
     ```
   - **Routes** (`*.routes.ts`): Define HTTP verbs, mount middleware (auth, rate-limit, validation), and delegate to controllers.
   - **Controller** (`*.controller.ts`): Orchestrates HTTP requests/responses, parses inputs, delegates to services, and returns standardized JSON. Never executes SQL queries directly.
   - **Service** (`*.service.ts`): Houses core domain business logic, data transformations, and cryptographic operations. Never touches `req` or `res`.
   - **Repository** (`*.repository.ts`): Encapsulates pure SQL execution via `pool.query()` with parameterized queries (`$1, $2, ...`) to eliminate SQL injection.

3. **Strict Runtime Schema Validation (Zod)**:
   - Never trust incoming client payloads.
   - Every mutation (`POST`, `PUT`, `PATCH`) and sensitive query must be strictly validated using Zod schemas (`*.schema.ts`) via `validateBody()`, `validateQuery()`, or `validateParams()` middleware before hitting the controller.

4. **Operational Error Sanitization**:
   - All operational failures must be thrown as instances of `AppError` (`src/core/errors/app-error.ts`) with appropriate HTTP status codes.
   - Centralized error middleware (`src/core/middleware/error.middleware.ts`) intercepts all exceptions, sanitizes database constraint violations (e.g., PostgreSQL `23505` to 409 Conflict), and attaches a unique `requestId`.
   - Never leak database connection strings, table schemas, or raw stack traces in production responses.

5. **Security & Cryptographic Standards**:
   - **Password Security**: Passwords must be hashed using `bcryptjs` with a work factor of 12 (`src/core/security/password.ts`).
   - **Dual-Token JWT**: Short-lived access tokens (15m) and long-lived refresh tokens (7d) signed with secrets of at least 32 characters.
   - **Direct IP Defense**: `ipGuardMiddleware` blocks raw IP access in production, mandating routing through verified hostnames.
   - **Rate Limiting**: Tiered limiters (general: 100/15m, auth brute-force defense: 5 failed attempts/15m with `skipSuccessfulRequests: true`, and download limiter: 25/1h) with optional Redis clustering (`REDIS_URL`).
   - **Payload Limit**: Enforce strict `10kb` limit on JSON and URL-encoded request bodies (`env.BODY_LIMIT`).

---

## 2. Database Standards & Conventions

1. **Connection Pooling**:
   - All database interactions use the centralized singleton pool (`src/config/database.ts`).
   - Always prioritize IPv4 DNS lookups (`dns.setDefaultResultOrder("ipv4first")`) to prevent timeout issues (`EAI_AGAIN`) when connecting to remote cloud databases (Render, Supabase, Neon).
   - In production, enforce SSL with `rejectUnauthorized: false` for managed cloud certificates.

2. **Database Schema & Migrations**:
   - The consolidated schema migration and automated seed script is `src/database/reset.ts` (`npm run db:reset`).
   - Critical configuration tables (`organizations` singleton `id = 1`) are protected against accidental truncation via the trigger `prevent_table_truncate()` and deletion via `no_delete_organizations`.
   - Always use `CITEXT` for email columns to enforce case-insensitive uniqueness at the database level.
   - Active database tables: `currencies`, `organizations`, `roles`, `users`, `categories`, `themes`, `theme_settings`.

3. **Taxonomy & Soft-Delete Principle**:
   - Category deletions are strictly soft-deletes toggling `is_active = false`.
   - Category repository read queries filter for active records (`is_active = true`) by default unless inactive items are explicitly requested via `?includeInactive=true`.
   - Categories can be restored by operators via `POST /api/categories/:id/restore`.

4. **Theme Module & Dynamic CSS Compilation**:
   - The theme repository stores design tokens and active palettes in `themes` and `theme_settings`.
   - Dynamic CSS stylesheets are compiled and served directly from `GET /theme/theme.css` and `GET /api/theme/css` with caching headers.

---

## 3. API Response Contract

All REST endpoints must return responses adhering to this uniform JSON envelope:

### Success Response (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response (`400`, `401`, `403`, `404`, `409`, `500`):
```json
{
  "success": false,
  "status": "fail",
  "message": "Detailed human-readable error description",
  "details": { ... },
  "requestId": "uuid-v4-trace-id"
}
```

---

## 4. Verification Checklist for AI Agents

Before declaring any backend task complete, verify:
1. `npx tsc --noEmit` passes with **0 errors**.
2. All database queries use parameterized placeholders (`$1, $2, ...`) without string interpolation.
3. Any new routes are properly mounted in `src/app.ts` and documented in Swagger (`npm run swagger`).
4. Security middleware (IP Guard, Helmet, CORS, Rate Limiter) is not bypassed.
5. In-memory data structures are not used as pseudo-databases; all data changes persist to PostgreSQL.
