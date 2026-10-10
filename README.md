<p align="center">
  <img src="public/logo.png" alt="Sell Digital Assets Logo" width="96" height="96" style="border-radius: 20px;" />
</p>

# Sell Digital Assets API

A modern, robust, and enterprise-ready modular backend REST API built with **Node.js 22+**, **Express 5**, **TypeScript (NodeNext ESM)**, and **PostgreSQL**. Featuring runtime schema validation via **Zod**, dynamic theme compilation, hierarchical categories taxonomy, interactive **Swagger UI** documentation, and an end-to-end security suite with JWT authentication, bcrypt password hashing, tiered rate limiting, direct IP defense, and cryptographic token signing.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema & Seed Initialization](#-database-schema--seed-initialization)
- [Available Scripts](#-available-scripts)
- [API Endpoints](#-api-endpoints)
  - [Authentication Module](#1-authentication-module)
  - [Users Module](#2-users-module)
  - [Organizations & Currencies Module](#3-organizations--currencies-module)
  - [Categories & Taxonomy Module](#4-categories--taxonomy-module)
  - [Theme & Dynamic CSS Module](#5-theme--dynamic-css-module)
  - [Documentation & Health](#6-documentation--health)
- [Security & Architecture Highlights](#-security--architecture-highlights)
- [Error Handling & Response Contract](#-error-handling--response-contract)
- [License](#-license)

---

## ✨ Features

- **Domain-Driven Modular Architecture:** Decoupled into `config/`, `core/`, `modules/`, `database/`, and `data/` layers with clean separation of `app.ts` (Express routing) and `server.ts` (process lifecycle).
- **TypeScript Native (NodeNext ESM):** Strict end-to-end type safety with modern ES modules and `verbatimModuleSyntax`.
- **Enterprise Security Suite:**
  - **Direct IP Defense:** `ipGuardMiddleware` blocks raw server IP access in production, requiring verified hostname routing.
  - **Password Hashing:** Salted passwords using `bcryptjs` with work factor 12.
  - **Dual-Token JWT Auth:** Short-lived access tokens (15m) paired with long-lived refresh tokens (7d).
  - **Role-Based Access Control (RBAC):** Tiered permissions across `user`, `creator`, and `admin` roles.
  - **Multi-Tiered Rate Limiting:** Global limiter (100 req/15m), strict auth limiter (5 failed attempts/15m against brute-force), and download limiter (25 req/hr). Optional Redis distributed clustering via `rate-limit-redis`.
  - **Strict CORS Whitelisting:** Environment-driven origin validation supporting both production and local development portals.
  - **DoS & Payload Defense:** Enforced `10kb` body limit on JSON and URL-encoded parsers.
  - **Helmet HTTP Headers:** Secure CSP configured for self-hosted theme stylesheets and Swagger UI.
  - **Distributed Request Tracing:** Unique `X-Request-ID` attached to every request and response, integrated with Pino structured logging.
- **Dynamic Theming & CSS Engine:**
  - Dynamic compilation and streaming of CSS custom properties directly from PostgreSQL (`/theme/theme.css` and `/api/theme/css`).
  - Active theme palette management and preset persistence.
- **Hierarchical Categories Taxonomy:**
  - Adjacency tree modeling with materialized paths, depths, and soft-delete (`is_active = false`) governance with instant restore capabilities.
- **Automated Swagger UI:**
  - Auto-generated OpenAPI 3.0 documentation served at `/doc` and `/docs` with custom brand assets.

---

## 🛠 Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (v22+ LTS recommended) | JavaScript runtime environment |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe programming with NodeNext ESM |
| **Framework** | [Express 5](https://expressjs.com/) | Next-generation fast web framework |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [`pg`](https://node-postgres.com/) | Relational database with pooled connections and SSL |
| **Validation** | [Zod 4](https://zod.dev/) | Runtime schema declaration and validation |
| **Authentication** | [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken) & [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) | JWT access/refresh tokens and bcrypt password hashing |
| **Security** | [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [express-rate-limit](https://express-rate-limit.mintlify.app/) | HTTP headers, origin whitelisting, and rate limiters |
| **Logging** | [Pino](https://getpino.io/) & `pino-http` | Ultra-fast structured JSON logger |
| **Documentation** | [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express) | Interactive API exploration portal |
| **Dev & Watch** | [`tsx`](https://tsx.is/) | Fast TypeScript execution and hot-reloading |

---

## 📁 Project Architecture

```plaintext
sell-digital-assets-api/
├── public/                           # Static public assets (logo.png, favicon.ico, theme stylesheets)
├── src/
│   ├── config/
│   │   ├── env.ts                    # Typed and validated environment variables
│   │   └── database.ts               # PostgreSQL connection pool with IPv4 DNS priority
│   ├── core/
│   │   ├── errors/                   # Operational AppError class and error definitions
│   │   ├── logger/                   # Pino structured logging engine
│   │   ├── middleware/               # Middleware pipeline (auth, cors, error, ip-guard, rate-limit, request-id)
│   │   ├── security/                 # Password hashing, permissions, signed-url, and JWT tokens
│   │   └── validation/               # Zod request validation middleware
│   ├── data/                         # Initial seeds (organizations.ts, currencies.ts, categories.ts, themes.ts)
│   ├── database/
│   │   ├── repositories/             # Data access repositories (categories, organizations, theme, user)
│   │   └── reset.ts                  # Schema migration and automated seed runner
│   ├── modules/
│   │   ├── auth/                     # Authentication (register, login, refresh, logout)
│   │   ├── categories/               # Taxonomy tree, CRUD, soft-delete & restore
│   │   ├── organizations/            # Singleton organization profile & supported currencies
│   │   ├── theme/                    # Dynamic theme palettes & CSS compilation
│   │   └── users/                    # User accounts & directory governance
│   ├── pages/                        # Server status pages and health dashboard
│   ├── swagger/                      # OpenAPI 3.0 specification & auto-generator
│   ├── app.ts                        # Express application instance setup & middleware mounting
│   └── server.ts                     # HTTP listener, DB health check & graceful shutdown
├── .env.example                      # Sample environment variables template
├── package.json                      # Project manifest, dependencies, and scripts
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Project documentation
```

---

## 📋 Prerequisites

Before running the application, ensure you have:

- **Node.js** (v20.x or higher; v22+ LTS recommended)
- **npm** (v10.x or higher)
- **PostgreSQL 16+** instance (local service or managed cloud database like Render, Supabase, Neon)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/majid-superior/sell-digital-assets-api.git
cd sell-digital-assets-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the sample environment file:

```bash
cp .env.example .env
```

Update `.env` with your database credentials and secret keys:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sell_d_a_db

# Security & CORS
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# JWT Secrets (Minimum 32 characters in production)
JWT_SECRET=super_secret_jwt_access_key_min_32_chars
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_min_32_chars

# Digital Asset Download Token Signing Key
DOWNLOAD_TOKEN_SECRET=super_secret_download_signing_key_min_32_chars
BODY_LIMIT=10kb
EXPOSE_STACK=false
```

### 4. Initialize Database Schema & Seed Data

Run the automated database builder and seeder:

```bash
npm run db:reset
```

### 5. Start the Development Server

```bash
npm run dev
```

The API will start on `http://localhost:5000`. Access the interactive documentation at [http://localhost:5000/doc](http://localhost:5000/doc).

---

## 🔐 Environment Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `number` | `5000` | Port on which the Express server listens |
| `NODE_ENV` | `string` | `development` | Application mode (`development` or `production`) |
| `DATABASE_URL` | `string` | — | PostgreSQL connection URI string |
| `CLIENT_URL` | `string` | `http://localhost:5173` | Primary frontend client URL |
| `ALLOWED_ORIGINS` | `string` | — | Comma-separated CORS allowed origins whitelist |
| `JWT_SECRET` | `string` | — | Secret key for signing short-lived access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | `string` | — | Secret key for signing long-lived refresh tokens (min 32 chars) |
| `DOWNLOAD_TOKEN_SECRET`| `string` | — | Secret for signing time-limited download links (min 32 chars) |
| `BODY_LIMIT` | `string` | `10kb` | Maximum accepted request payload size |
| `EXPOSE_STACK` | `boolean` | `false` | Whether to expose stack traces in error responses (dev only) |
| `REDIS_URL` | `string` | — | Optional Redis connection string for distributed rate limiting |

---

## 🗄 Database Schema & Seed Initialization

The database schema and seeds are managed in [`src/database/reset.ts`](src/database/reset.ts). It provisions:

- **Extensions:** `citext` (case-insensitive emails), `pgcrypto` (cryptographic UUIDs and hashes).
- **Triggers & Rules:** `prevent_table_truncate()` protects the `organizations` table, and the `no_delete_organizations` rule blocks accidental deletion.
- **Active Tables:**
  1. `currencies`: Supported ISO-4217 currencies and Unicode symbols (`₨`, `$`, `€`, `£`, `¥`).
  2. `organizations`: Singleton platform branding, legal entity, support contact, fee percent, payout minimum.
  3. `roles`: Access control roles (`admin`, `creator`, `user`).
  4. `users`: User directory with case-insensitive unique email and hashed passwords.
  5. `categories`: Hierarchical category taxonomy with materialized path and depth.
  6. `themes`: Preset theme design tokens and color hex maps.
  7. `theme_settings`: Singleton active theme pointer and custom CSS overrides.

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Runs the development server in watch mode using `tsx` |
| `build` | `npm run build` | Regenerates Swagger documentation and compiles TypeScript |
| `start` | `npm start` | Launches the compiled production server from `dist/server.js` |
| `db:reset` | `npm run db:reset` | Resets PostgreSQL schema and seeds initial records |
| `swagger` | `npm run swagger` | Regenerates `swagger.json` OpenAPI specification |
| `test` | `npm test` | Runs the test suite via Node.js test runner |

---

## 📡 API Endpoints

### 1. Authentication Module

| Method | Endpoint | Rate Limit | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | 5 failed / 15m | Public | Register a new platform user account |
| `POST` | `/api/auth/login` | 5 failed / 15m | Public | Authenticate and obtain JWT access + refresh tokens |
| `POST` | `/api/auth/refresh` | General | Public | Refresh expired access token using refresh token |
| `POST` | `/api/auth/logout` | General | Public | Terminate active user session |

### 2. Users Module

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Bearer Token | `admin` | Paginated user directory |
| `GET` | `/api/users/me` | Bearer Token | Any | Retrieve current authenticated user profile |
| `PATCH` | `/api/users/me` | Bearer Token | Any | Update profile details (display name, password) |
| `GET` | `/api/users/:id` | Bearer Token | `admin` | Retrieve detailed user profile by UUID |
| `PATCH` | `/api/users/:id` | Bearer Token | `admin` | Update user status, role, or metadata |
| `DELETE` | `/api/users/:id` | Bearer Token | `admin` | Deactivate user account |
| `POST` | `/api/users` | Bearer Token | `admin` | Administrator create user |

### 3. Organizations & Currencies Module

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/organizations` | Public | None | Retrieve organization branding and platform configuration |
| `GET` | `/api/organizations/currencies` | Public | None | List all supported currencies and Unicode symbols |
| `PUT` | `/api/organizations` | Bearer Token | `admin` | Update organization branding, currency, fee, or contacts |
| `PATCH` | `/api/organizations` | Bearer Token | `admin` | Partial update of organization configuration |

### 4. Categories & Taxonomy Module

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | None | List categories (supports `?tree=true`, `?includeInactive=true`) |
| `GET` | `/api/categories/:id` | Public | None | Retrieve single category details |
| `POST` | `/api/categories` | Bearer Token | `admin` | Create new category in taxonomy |
| `PATCH` | `/api/categories/:id` | Bearer Token | `admin` | Update category details or position |
| `DELETE` | `/api/categories/:id` | Bearer Token | `admin` | Soft-delete category (`is_active = false`) |
| `POST` | `/api/categories/:id/restore` | Bearer Token | `admin` | Restore soft-deleted category |

### 5. Theme & Dynamic CSS Module

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/theme` | Public | None | Retrieve currently active theme palette & tokens (JSON) |
| `GET` | `/api/theme/active` | Public | None | Alias for active theme palette |
| `PUT` | `/api/theme` | Bearer Token | `admin` | Update active theme colors and tokens |
| `GET` | `/api/theme/css` | Public | None | Dynamic compiled CSS stylesheet (`:root` and `.dark` variables) |
| `GET` | `/theme/theme.css` | Public | None | Static-served compiled CSS stylesheet with caching headers |

### 6. Documentation & Health

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/doc` | Public | Interactive Swagger UI API documentation |
| `GET` | `/docs` | Public | Redirect to `/doc/` |
| `GET` | `/openapi.json` | Public | Raw OpenAPI 3.0 specification |
| `GET` | `/` | Public | Dynamic SSR system status and health view |

---

## 🛡 Security & Architecture Highlights

1. **Direct IP Access Defense:** Blocks automated crawlers and port scanners targeting raw IP addresses in production.
2. **PostgreSQL Truncate & Delete Defense:** Protects singleton configuration against accidental administrative wipes.
3. **Payload Limiting (DoS):** Maximum body size constrained to `10kb` to protect memory and event loop availability.
4. **Brute-Force Protection:** Rate limits failed login attempts (5 per 15 min), skipping successful requests.

---

## 🔍 Error Handling & Response Contract

All REST endpoints return standardized JSON responses:

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
  "message": "Detailed error description",
  "details": { ... },
  "requestId": "uuid-v4-trace-id"
}
```

---

## 📄 License

This project is licensed under the **ISC License**. See [package.json](package.json) for details.
