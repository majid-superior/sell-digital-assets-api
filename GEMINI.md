# Backend Engineering Guidelines & Architecture Standards

> **Applies to**: `sell-digital-assets-api` and all backend microservices.
> **Scope**: Express 5 REST API, PostgreSQL database operations, authentication, security, and data validation.
> **Target Audience**: AI Agents and Backend Engineers.

---

## 1. Core Principles

1. **Zero Mock Data Principle**:
   - Never use fake in-memory mock objects, hardcoded user lists, or simulated JSON responses for business entities.
   - All persistence must strictly execute against the live PostgreSQL database via connection pooling (`src/config/database.ts`).
   - All tests and endpoints must interact with real database records or properly seeded test fixtures.

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
   - Every mutation (`POST`, `PUT`, `PATCH`) and sensitive query must be strictly validated using Zod schemas (`*.schema.ts`) via `validate()` middleware before hitting the controller.

4. **Operational Error Sanitization**:
   - All operational failures must be thrown as instances of `AppError` (`src/core/errors/app-error.ts`) with appropriate HTTP status codes.
   - Centralized error middleware (`src/core/middleware/error.middleware.ts`) intercepts all exceptions, sanitizes database constraint violations (e.g., PostgreSQL `23505` to 409 Conflict), and attaches a unique `requestId`.
   - Never leak database connection strings, table schemas, or stack traces in production responses.

5. **Security & Cryptographic Standards**:
   - **Password Security**: Passwords must be hashed using `bcryptjs` with a work factor of 12 (`src/core/security/password.ts`).
   - **Dual-Token JWT**: Short-lived access tokens (15m) and long-lived refresh tokens (7d) signed with secrets of at least 32 characters.
   - **Digital Asset Downloads**: Asset binaries are protected by HMAC-SHA256 signed expiring tokens and verified using constant-time string comparisons (`crypto.timingSafeEqual`) to prevent timing attacks.
   - **Rate Limiting**: Enforce tiered limits (general API limiter, strict auth brute-force limiter, and download scraping limiter).

---

## 2. Database Standards & Conventions

1. **Connection Pooling**:
   - All database interactions use the centralized singleton pool (`src/config/database.ts`).
   - Always prioritize IPv4 DNS lookups (`dns.setDefaultResultOrder("ipv4first")`) to prevent Windows/Node.js timeout issues (`EAI_AGAIN`) when connecting to remote cloud databases (Render, Supabase, Neon).
   - In production, enforce SSL with `rejectUnauthorized: false` for managed cloud certificates.

2. **Database Schema & Migrations**:
   - Schema definitions and migrations live in `src/database/migrations/`.
   - The consolidated schema migration and automated seed script is `src/database/reset.ts`.
   - Critical configuration tables (such as the `organizations` singleton table) are protected against accidental truncation via PostgreSQL trigger `prevent_table_truncate()`.
   - Always use `CITEXT` for email columns to enforce case-insensitive uniqueness at the database level.

3. **Currency & Financial Data**:
   - All monetary values must be stored as integers representing cents/minor units (e.g., `price_cents INTEGER`) to prevent floating-point rounding errors.
   - Active currencies are managed centrally in the `currencies` table (`PKR`, `USD`, `EUR`, `GBP`, etc.).

4. **Soft Delete Principle (Never Hard Delete)**:
   - Physical SQL `DELETE` operations on category records and core business entities are strictly prohibited.
   - Deletions must always be executed as soft-deletes by toggling `is_active = false` (or `deleted_at = CURRENT_TIMESTAMP`).
   - Category repository methods (`delete()`, `softDelete()`) strictly update `is_active = false`, never executing physical SQL deletions.
   - All repository read queries must filter for active records (`is_active = true`) by default unless inactive items are explicitly requested.

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
3. Any new routes are properly mounted in `src/app.ts` or corresponding route modules.
4. Security middleware (CORS, Rate Limiter, Helmet) is not bypassed.
5. In-memory data structures are not used as pseudo-databases; all data changes persist to PostgreSQL.

