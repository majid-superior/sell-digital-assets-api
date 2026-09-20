<p align="center">
  <img src="public/logo.png" alt="Sell Digital Assets Logo" width="96" height="96" style="border-radius: 20px;" />
</p>

# Sell Digital Assets API

A modern, robust, and enterprise-ready modular backend REST API built with **Node.js**, **Express 5**, **TypeScript**, and **PostgreSQL**. Featuring runtime schema validation via **Zod**, and an end-to-end security suite with JWT authentication, bcrypt password hashing, tiered rate limiting, and cryptographic HMAC-SHA256 signed download links for digital asset distribution.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup & Migrations](#-database-setup--migrations)
- [Available Scripts](#-available-scripts)
- [API Endpoints](#-api-endpoints)
  - [Authentication Module](#1-authentication-module)
  - [Users Module](#2-users-module)
  - [Products Module](#3-products-module)
  - [Inventory Module](#4-inventory-module)
  - [Sales & Digital Asset Downloads](#5-sales--digital-asset-downloads)
- [Security & Architecture Highlights](#-security--architecture-highlights)
- [Error Handling & Validation](#-error-handling--validation)
- [License](#-license)

---

## ✨ Features

- **Domain-Driven Modular Architecture:** Decoupled into `config/`, `core/`, `modules/`, and `database/` layers with clean separation of `app.ts` (Express routing) and `server.ts` (process lifecycle).
- **TypeScript Native (NodeNext ESM):** Strict end-to-end type safety with modern ES modules and `verbatimModuleSyntax`.
- **Enterprise Security Suite:**
  - **Password Hashing:** Salted passwords using `bcryptjs` with salt work factor 12.
  - **Dual-Token JWT Auth:** Short-lived access tokens (15m) paired with long-lived refresh tokens (7d).
  - **Role-Based Access Control (RBAC):** Tiered permissions across `user`, `creator`, and `admin` roles.
  - **Cryptographic Digital Asset Protection:** Time-limited HMAC-SHA256 signed download tokens verified using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks and hotlinking.
  - **Multi-Tiered Rate Limiting:** Global limiter (100 req/15m), strict auth limiter (5 attempts/15m against brute-force), and asset download limiter (25 req/hr against scraping).
  - **Strict CORS Whitelisting:** Environment-driven origin validation with credential support.
  - **DoS & Payload Defense:** Enforced `10kb` body limit on JSON and URL-encoded parsers.
  - **Helmet HTTP Headers:** Secure HSTS, X-Content-Type-Options: nosniff, and cross-origin resource isolation.
  - **Distributed Request Tracing:** Unique `X-Request-ID` attached to every request and response.
- **PostgreSQL Connection Pool:** Production-ready pooling with idle timeouts and health checks via `pg`.
- **Centralized Error Sanitization:** Eliminates data leaks by translating database constraint codes (e.g., `23505` to 409 Conflict) and suppressing stack traces in production.

---

## 🛠 Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (v20+ LTS recommended) | JavaScript runtime environment |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe programming with NodeNext ESM |
| **Framework** | [Express 5](https://expressjs.com/) | Next-generation fast, unopinionated web framework |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [`pg`](https://node-postgres.com/) | Relational database with pooled connections |
| **Validation** | [Zod](https://zod.dev/) | TypeScript-first schema declaration and validation |
| **Authentication** | [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken) & [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) | JWT access/refresh tokens and bcrypt password hashing |
| **Security** | [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [express-rate-limit](https://express-rate-limit.mintlify.app/) | HTTP headers, origin whitelisting, and rate limiters |
| **Parsing** | [`cookie-parser`](https://github.com/expressjs/cookie-parser) | Secure HTTP-only cookie parsing |
| **Dev & Watch** | [`tsx`](https://tsx.is/) | Fast TypeScript execution and hot-reloading |

---

## 📁 Project Architecture

### 🔄 Unbroken Request Pipeline

All requests strictly traverse this deterministic, defense-in-depth pipeline with zero bypass:

```plaintext
                    INTERNET
                       │
                       ▼
                ┌──────────────┐
                │ HTTPS / Proxy│  (Trust proxy & HTTPS enforcement)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │    Helmet    │  (HSTS, nosniff, frameguard)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │    CORS      │  (Whitelist origin validation)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │ Rate Limiter │  (Global / Auth / Download throttling)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │   Request    │
                │   Validation │  (Zod Schema Body/Query validation)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │Authentication│  (JWT Bearer token verification)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │Authorization │
                │  / RBAC      │  (Role & Permission guards)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │  Controller  │  (HTTP Orchestration)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │   Service    │
                │Business Rules│  (Core domain logic & crypto)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │ Repository   │  (Data access abstraction)
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │ PostgreSQL   │  (Relational persistence)
                └──────────────┘
```

### 📂 Directory Structure

```plaintext
sell-digital-assets-api/
├── src/
│   ├── config/
│   │   ├── env.ts                    # Typed environment variables & configuration
│   │   └── database.ts               # PostgreSQL connection pool & healthcheck
│   ├── core/
│   │   ├── errors/
│   │   │   ├── app-error.ts          # Operational AppError class
│   │   │   └── index.ts              # Error exports
│   │   ├── middleware/
│   │   │   ├── error.middleware.ts   # Centralized error sanitization handler
│   │   │   ├── auth.middleware.ts    # JWT authentication & authorization
│   │   │   ├── rate-limit.middleware.ts # Tiered rate limiters (general, auth, download)
│   │   │   ├── request-id.middleware.ts # Unique X-Request-ID tracking header
│   │   │   └── cors.middleware.ts    # Whitelist-based CORS configuration
│   │   ├── security/
│   │   │   ├── password.ts           # Bcrypt password hashing & comparison
│   │   │   ├── tokens.ts             # JWT Access & Refresh token signing
│   │   │   ├── permissions.ts        # RBAC roles, permissions & guards
│   │   │   └── signed-url.ts         # HMAC-SHA256 digital asset download token signing
│   │   └── validation/
│   │       ├── validate.middleware.ts# Zod request body/query validation middleware
│   │       └── index.ts
│   ├── modules/
│   │   ├── auth/                     # Authentication (register, login, refresh)
│   │   ├── users/                    # User accounts & profile management
│   │   ├── products/                 # Digital asset catalog management
│   │   ├── inventory/                # Asset file packages & license inventory
│   │   └── sales/                    # Checkout, purchases & signed download delivery
│   ├── database/
│   │   ├── migrations/               # SQL schema definitions & migrations
│   │   │   └── 001_initial_schema.sql
│   │   └── repositories/             # Data access repository layer
│   │       ├── base.repository.ts
│   │       └── user.repository.ts
│   ├── app.ts                        # Express application instance setup & middleware mounting
│   └── server.ts                     # HTTP listener, DB healthcheck & graceful shutdown
├── .env.example                      # Sample environment variables template
├── .gitignore                        # Git ignore rules for node, dist, logs, uploads, etc.
├── package.json                      # Project manifest, dependencies, and scripts
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Project documentation
```

---

## 📋 Prerequisites

Before running the application, ensure you have:

- **Node.js** (v18.x or higher; v20+ / v22+ LTS recommended)
- **npm** (v9.x or higher)
- **PostgreSQL** instance (local service or managed cloud database like Supabase, Neon, AWS RDS)

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
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT Authentication Secrets (Use min 32 characters in production)
JWT_SECRET=super_secret_jwt_access_key_min_32_chars
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_min_32_chars

# Digital Asset Download Token Signing Key
DOWNLOAD_TOKEN_SECRET=super_secret_download_signing_key_min_32_chars
```

### 4. Initialize Database Schema & Run Migrations

Run database migrations using the automated migration runner:

```bash
npm run migrate
```

Alternatively, apply the SQL schema directly via `psql`:

```bash
psql -d sell_d_a_db -f src/database/migrations/001_initial_schema.sql
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5000` with hot-reloading active.

---

## 🔐 Environment Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `number` | `5000` | Port on which the Express server listens |
| `NODE_ENV` | `string` | `development` | Application environment (`development` or `production`). In `production`, all secrets must be ≥ 32 chars or server fails fast. |
| `DATABASE_URL` | `string` | — | PostgreSQL connection URI string |
| `CLIENT_URL` | `string` | `http://localhost:3000` | Primary frontend client URL |
| `ALLOWED_ORIGINS` | `string` | `http://localhost:3000,http://localhost:5173` | Comma-separated CORS allowed origins whitelist |
| `JWT_SECRET` | `string` | — | Secret key used to sign and verify short-lived access tokens (15m, min 32 chars) |
| `JWT_REFRESH_SECRET` | `string` | — | Secret key used to sign and verify long-lived refresh tokens (7d, min 32 chars) |
| `DOWNLOAD_TOKEN_SECRET` | `string` | — | Cryptographic secret for HMAC-SHA256 signed digital asset download tokens (min 32 chars) |
| `BODY_LIMIT` | `string` | `10kb` | Maximum accepted request payload size (DoS defense) |
| `EXPOSE_STACK` | `boolean` | `false` | When `true`, includes stack traces in error responses (dev only) |
| `REDIS_URL` | `string` | — | Optional Redis connection string for distributed cluster rate limiting (fallback: in-memory) |
| `AWS_REGION` | `string` | `us-east-1` | Optional AWS S3 region for digital asset storage |
| `AWS_BUCKET_NAME` | `string` | — | Optional private AWS S3 / Cloudflare R2 bucket name |
| `AWS_ACCESS_KEY_ID` | `string` | — | Optional AWS S3 / Cloudflare R2 access key ID |
| `AWS_SECRET_ACCESS_KEY`| `string` | — | Optional AWS S3 / Cloudflare R2 secret access key |
| `AWS_ENDPOINT` | `string` | — | Optional S3 endpoint URL (for Cloudflare R2, MinIO, or LocalStack) |

---

## 🗄 Database Setup & Migrations

The database migration is located at [`src/database/migrations/001_initial_schema.sql`](src/database/migrations/001_initial_schema.sql):

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products / Digital Assets
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory / Asset Files
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    file_hash VARCHAR(64),
    mime_type VARCHAR(100) DEFAULT 'application/octet-stream',
    version VARCHAR(50) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales & Purchases
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'completed',
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Runs the development server in watch mode using `tsx` |
| `build` | `npm run build` | Compiles TypeScript into the `dist/` production folder |
| `start` | `npm start` | Launches the compiled production build from `dist/server.js` |
| `migrate` | `npm run migrate` | Executes tracked SQL migrations from `src/database/migrations/` |
| `test` | `npm test` | Placeholder for automated test runner suite |

---


## 📡 API Endpoints

### 1. Authentication Module

#### Register a new user
- **`POST /api/auth/register`**
- **Rate Limit:** 5 attempts / 15 min
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SuperSecretPassword123!",
    "role": "user"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": "15m"
    }
  }
  ```

#### Login
- **`POST /api/auth/login`**
- **Rate Limit:** 5 attempts / 15 min
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "SuperSecretPassword123!"
  }
  ```
- **Response `200 OK`:** Returns user object and token pair.

#### Refresh Access Token
- **`POST /api/auth/refresh`**
- **Request Body:** `{ "refreshToken": "eyJhbGciOi..." }`
- **Response `200 OK`:** Returns new token pair.

---

### 2. Users Module

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Public | List all users |
| `GET` | `/api/users/me` | Bearer Token | Retrieve authenticated user profile |
| `POST` | `/api/users` | Public | Legacy user creation endpoint |

---

### 3. Products Module

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | List all published digital products |
| `GET` | `/api/products/:id` | Public | Retrieve product details by ID |
| `POST` | `/api/products` | Creator / Admin | Create a new digital product listing |

---

### 4. Inventory Module

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory/product/:productId` | Bearer Token | Retrieve asset files associated with product |
| `POST` | `/api/inventory` | Creator / Admin | Register new file asset / license package |

---

### 5. Sales & Digital Asset Downloads

#### Checkout / Purchase Product
- **`POST /api/sales/checkout`**
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "productId": "123e4567-e89b-12d3-a456-426614174000",
    "currency": "USD"
  }
  ```
- **Response `201 Created`:** Purchase order confirmed.

#### Generate Expiring Signed Download Link
- **`POST /api/sales/generate-download-link`** (or `POST /api/assets/:id/generate-download-link`)
- **Auth:** Bearer Token
- **Request Body:** `{ "assetId": "123e4567-e89b-12d3-a456-426614174000" }`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "assetId": "123e4567-e89b-12d3-a456-426614174000",
    "downloadUrl": "http://localhost:5000/api/sales/download?token=eyJhbGciOi...signature",
    "expiresAt": "2026-09-19T11:45:00.000Z",
    "message": "Download link generated. Valid for 15 minutes."
  }
  ```

#### Secure Asset Binary Download
- **`GET /api/sales/download?token=...`**
- **Rate Limit:** 25 requests / hour
- **Headers Returned:**
  - `Content-Disposition: attachment; filename="digital-asset-<id>.bin"`
  - `X-Content-Type-Options: nosniff`
  - `Cache-Control: private, no-cache, no-store, must-revalidate`
- **Security Validation:** Rejects tampered tokens (HTTP 403) and expired links (HTTP 410).

---

## 🛡 Security & Architecture Highlights

1. **Cryptographic HMAC-SHA256 Signed Tokens:** Digital asset files are protected from unauthorized access, hotlinking, and URL sharing using signed download tokens verified with constant-time equality checks (`crypto.timingSafeEqual`).
2. **Brute-Force & Scraping Protection:** Specialized rate limiting on `/api/auth/*` (5 req / 15m) and `/api/sales/download` (25 req / hr).
3. **Payload Limiting (DoS):** Maximum body size constrained to `10kb` to protect memory and event loop availability.
4. **CORS Hardening:** Whitelist origin matching preventing cross-origin data exfiltration.
5. **Distributed Tracing:** Automated `X-Request-ID` generation and propagation on every HTTP call.

---

## 🔍 Error Handling & Validation

Input validation is enforced using **Zod**. When a validation check fails, the API responds with HTTP 400 and formatted error details:

```json
{
  "success": false,
  "status": "fail",
  "message": "Validation failed",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "name": ["Name must be at least 2 characters"],
      "email": ["Invalid email address"],
      "password": ["Password must be at least 8 characters"]
    }
  },
  "requestId": "2f9e90c9-4e16-443b-ae27-1069e3d6b50c"
}
```

Database errors (e.g., duplicate unique constraint `23505`) return clean HTTP 409 Conflict responses without leaking database schema internals:

```json
{
  "success": false,
  "status": "fail",
  "message": "A resource with these unique credentials already exists",
  "requestId": "2f9e90c9-4e16-443b-ae27-1069e3d6b50c"
}
```

---

## 📄 License

This project is licensed under the **ISC License**. See [package.json](package.json) for details.
