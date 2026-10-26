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

1. **Mandatory Environment Separation & Local Database Rule (STRICT ARCHITECTURE STANDARD)**:
   - **Localhost Development & Testing Exclusivity**:
     - Localhost development (`npm run dev`) and automated tests (`npm test`) MUST strictly and exclusively connect to the designated local PostgreSQL database (`LOCAL_DATABASE_URL`).
     - Connecting to a remote, managed cloud, or live production database from localhost development or automated tests is strictly prohibited.
     - Configuration loading (`src/config/env.ts`) MUST enforce that in `NODE_ENV=development` and `NODE_ENV=test`, the resolved database URL is a local host (`localhost`, `127.0.0.1`).
     - If local database configuration is missing or points to a remote cloud host, the system MUST fail-fast with a clear, human-understandable safeguard error.
     - Never silently fall back to live production credentials.
   - **Production Isolation & Protection**:
     - Production credentials must be separated in `PROD_DATABASE_URL` or hosting environment variables and are only accessible when `NODE_ENV=production`.
     - Destructive operations (`db:reset`, table drops, schema truncation) against production are blocked by safety guards and require explicit confirmation (`ALLOW_LIVE_DB_RESET=true` or typing `CONFIRM RESET PRODUCTION`).

2. **Connection Pooling & Resilient Connectivity**:
   - All database interactions use the centralized singleton pool (`src/config/database.ts`).
   - Always prioritize IPv4 DNS lookups (`dns.setDefaultResultOrder("ipv4first")`) to prevent timeout issues (`EAI_AGAIN`) when connecting to remote cloud databases.
   - In production, enforce SSL with `rejectUnauthorized: false` for managed cloud certificates. Localhost database connections must never enable SSL.
   - Database credentials in connection strings must be sanitized (`***`) in all application logs (`maskDatabaseUrl()`).

3. **Database Schema & Migrations**:
   - The consolidated schema migration and automated seed script is `src/database/reset.ts` (`npm run db:reset`).
   - Critical configuration tables (`organizations` singleton `id = 1`) are protected against accidental truncation via the trigger `prevent_table_truncate()` and deletion via `no_delete_organizations`.
   - Always use `CITEXT` for email columns to enforce case-insensitive uniqueness at the database level.
   - Active database tables: `currencies`, `organizations`, `roles`, `users`, `categories`, `themes`.

3. **Taxonomy & Soft-Delete Principle**:
   - Category deletions are strictly soft-deletes toggling `is_active = false`.
   - Category repository read queries filter for active records (`is_active = true`) by default unless inactive items are explicitly requested via `?includeInactive=true`.
   - Categories can be restored by operators via `POST /api/v1/categories/:id/restore`.

4. **Theme Module & Dynamic CSS Compilation**:
   - The theme repository stores design tokens, mode, typography, and active palettes in the unified `themes` table.
   - Dynamic CSS stylesheets are compiled and served directly from `GET /theme/theme.css` and `GET /api/v1/theme/css` with caching headers.

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

## 4. Human-Understandable Error Message Standard (MANDATORY RULE FOR AI AGENTS)

1. **Zero Raw Technical Codes & Infrastructure Masking**:
   - Never return cryptic technical errors, unformatted SQL/database exceptions, socket errors (`ECONNREFUSED`, `ETIMEDOUT`, `ECONNRESET`), DNS errors (`EAI_AGAIN`, `getaddrinfo`), or raw HTTP status numbers in client-facing responses.
   - Database connection and infrastructure failures must always be intercepted by `errorMiddleware` and returned as HTTP 503 with safe, human-readable guidance: `"The service is temporarily unavailable. Please try again in a few moments."`
   - Every client-facing error payload must communicate:
     - **What failed**: Plain English statement of the failure (e.g., "The uploaded file exceeds the maximum allowed file size limit").
     - **Why it occurred**: The exact constraint or reason (e.g., "Showcase media is limited to 10 MB; Deliverables are limited to 500 MB").
     - **How to resolve**: Actionable steps for the user (e.g., "Please compress the image or choose a file under 10 MB").
2. **Safe Logging & Credential Redaction**:
   - Detailed diagnostics (error names, stack traces, request IDs) are preserved strictly in secure server logs.
   - Connection strings, passwords, JWT secrets, and bearer tokens must always be redacted (`***`) before logging (`sanitizeSecrets()`, `maskDatabaseUrl()`).
3. **Authentication Resilience**:
   - Database and network connection failures must never be reported as invalid credentials.
   - Temporary infrastructure failures must return HTTP 503 rather than HTTP 401.
4. **Multipart & File Upload Limits**:
   - Multer exceptions (e.g., `LIMIT_FILE_SIZE`, `LIMIT_UNEXPECTED_FILE`, `LIMIT_FILE_COUNT`) must be intercepted and formatted into clean JSON with HTTP 413 or 400 and human explanations.
   - Direct storage streaming endpoints must enforce separate limits for media (`public/media/` at 10 MB) vs deliverables (`vault/` at 500 MB) and supply clear error messages.
5. **Database Constraint Sanitization**:
   - PostgreSQL error codes (`23505`, `23503`, `23514`, `23502`, `22P02`) must always be mapped to readable domain descriptions (e.g., duplicate slug, invalid ID format).

---

## 5. Mobile-First Developer UI & Documentation Overflow Standards

1. **Responsive System Pages & Developer UI**:
   - Developer-facing HTML views (Status Page, 404/500 Error Pages, Documentation Access Modal, and Swagger UI at `/docs`) must be mobile-first and free of horizontal scrolling down to 320px viewport widths.
   - Status cards grid must use fluid responsive tracks: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));` and wrap to single columns on small screens.
   - Metric rows must specify `min-width: 0;` and `.metric-value` must use `overflow-wrap: anywhere; word-break: break-word;` so long hashes, UUIDs, or URLs never cause page overflow.
   - Swagger UI parameters, response bodies, and operation summary tables must provide responsive horizontal scrolling inside their boundaries: `overflow-x: auto; max-width: 100%; -webkit-overflow-scrolling: touch;`.

2. **Strict Zero Horizontal Overflow Policy**:
   - Never use global `overflow-x: hidden` on `body` or `html` to mask overflowing elements. Layout geometry issues must be resolved at the source using intrinsic sizing, flex wrapping, and responsive media queries.

---

## 6. Verification Checklist for AI Agents

Before declaring any backend task complete, verify:

1. `npx tsc --noEmit` passes with **0 errors**.
2. All database queries use parameterized placeholders (`$1, $2, ...`) without string interpolation.
3. Any new routes are properly mounted in `src/app.ts` and documented in Swagger (`npm run swagger`).
4. Security middleware (IP Guard, Helmet, CORS, Rate Limiter) is not bypassed.
5. In-memory data structures are not used as pseudo-databases; all data changes persist to PostgreSQL.
6. All error responses provide human-understandable explanations with actionable recovery guidance.
7. **Developer UI & Docs Verification**: Verify that the Status page and Swagger UI documentation render cleanly on mobile viewports (320px–480px) and desktop without horizontal scrollbars or truncated metrics.
