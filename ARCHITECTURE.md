# Sell Digital Assets API — System Architecture & Technical Blueprint

> **System**: Core REST API & Persistence Engine for the Sell Digital Assets Ecosystem.  
> **Tech Stack**: Node.js 22+, Express 5, TypeScript (NodeNext ESM), PostgreSQL (`pg`), Zod, Helmet.  
> **Deployment Target**: Render.com Web Service + Managed PostgreSQL.

---

## 1. Architectural Overview

The `sell-digital-assets-api` serves as the authoritative backend engine for both the client marketplace (`sell-digital-assets-website`) and the administration console (`sell-digital-assets-admin`). Engineered with **Domain-Driven Modular Design**, the codebase cleanly separates HTTP concerns, business logic, data persistence, and security controls.

```mermaid
graph TD
    ClientAdmin["Admin Console (Port 5174)"] -->|HTTPS / REST| API["Express 5 API (Port 5000)"]
    ClientWeb["Marketplace Website (Port 5173)"] -->|HTTPS / REST| API
    
    subgraph "sell-digital-assets-api"
        API --> Middleware["Security & Validation Pipeline"]
        Middleware --> Controllers["Module Controllers"]
        Controllers --> Services["Domain Services"]
        Services --> Repositories["Data Access Repositories"]
        Repositories --> DB[("PostgreSQL Database")]
    end
```

---

## 2. Request Execution Pipeline

Every inbound HTTP request strictly traverses an unbroken, defense-in-depth pipeline before reaching application business logic:

```mermaid
flowchart TD
    Req([Inbound HTTP Request]) --> TrustProxy[Trust Proxy Configuration]
    TrustProxy --> Helmet[Helmet Security Headers]
    Helmet --> CORS[CORS Origin Whitelisting]
    CORS --> RequestID[X-Request-ID Generation & Propagation]
    RequestID --> RateLimit{Rate Limiter}
    
    RateLimit -->|Exceeded| Res429[429 Too Many Requests]
    RateLimit -->|Allowed| BodyParser[JSON & URL Parser 10kb limit]
    
    BodyParser --> ZodVal{Zod Schema Validation}
    ZodVal -->|Invalid| Res400[400 Validation Error]
    ZodVal -->|Valid| AuthCheck{Auth Middleware}
    
    AuthCheck -->|Public Route| Controller[Module Controller]
    AuthCheck -->|Protected Route| JWTVal{JWT Verification}
    
    JWTVal -->|Expired/Invalid| Res401[401 Unauthorized]
    JWTVal -->|Valid| RBAC{RBAC Role Guard}
    
    RBAC -->|Forbidden Role| Res403[403 Forbidden]
    RBAC -->|Authorized| Controller
    
    Controller --> Service[Domain Service]
    Service --> Repository[Repository Layer]
    Repository --> PG[(PostgreSQL Pool)]
    PG --> Res200([200/201 JSON Response Envelope])
```

---

## 3. Directory & Module Structure

```text
sell-digital-assets-api/
├── src/
│   ├── config/
│   │   ├── env.ts                       # Validated environment variables (Zod + Fail-Fast)
│   │   └── database.ts                  # PostgreSQL connection pool with healthcheck & IPv4 priority
│   ├── core/
│   │   ├── errors/
│   │   │   ├── app-error.ts             # Operational AppError class (status, code, operational flag)
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       # JWT verification & Bearer token extraction
│   │   │   ├── cors.middleware.ts       # Dynamic origin whitelisting (Admin, Website, Localhost)
│   │   │   ├── error.middleware.ts      # Centralized error translation & DB constraint sanitization
│   │   │   ├── rate-limit.middleware.ts # Tiered limiters (general: 100/15m, auth: 5/15m, download: 25/1h)
│   │   │   └── request-id.middleware.ts # Unique X-Request-ID tracking header
│   │   ├── security/
│   │   │   ├── password.ts              # Salted bcrypt password hashing & verification
│   │   │   ├── permissions.ts           # RBAC matrix (user, creator, admin) & permission guards
│   │   │   ├── signed-url.ts            # HMAC-SHA256 digital asset download token generator & validator
│   │   │   └── tokens.ts                # Dual JWT tokens (Access 15m, Refresh 7d)
│   │   └── validation/
│   │       └── validate.middleware.ts   # Express middleware for Zod schema validation
│   ├── database/
│   │   ├── migrations/                  # Versioned SQL migration files
│   │   ├── repositories/
│   │   │   ├── base.repository.ts       # Abstract repository with query execution helpers
│   │   │   ├── company.repository.ts    # Singleton company configuration & currency queries
│   │   │   └── user.repository.ts       # User account persistence & lookup
│   │   └── reset.ts                     # Full automated schema builder and seed runner
│   ├── modules/
│   │   ├── auth/                        # Registration, login, token refresh, and logout
│   │   ├── company/                     # Singleton company profile, branding, and active currencies
│   │   ├── users/                       # User profile management and directory
│   │   ├── products/                    # Digital asset product catalog
│   │   ├── inventory/                   # Product files and license packages
│   │   └── sales/                       # Purchases, transactions, and secure asset fulfillment
│   ├── pages/                           # Dynamic SSR status dashboard and server health UI
│   ├── swagger/                         # OpenAPI 3.0 documentation configuration
│   ├── app.ts                           # Express application factory & middleware stack
│   └── server.ts                        # HTTP server listener, database probe, and graceful shutdown
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Database Architecture & Schema Models

### Relational Entity-Relationship Diagram

```mermaid
erDiagram
    CURRENCIES {
        varchar(3) code PK
        varchar(100) name
        varchar(10) symbol
        timestamptz created_at
    }

    COMPANY {
        smallint id PK "Checked id = 1 (Singleton)"
        varchar company_name
        varchar legal_name
        varchar tagline
        text description
        varchar default_currency FK
        numeric min_payout
        timestamptz updated_at
    }

    USERS {
        uuid id PK
        citext email UK
        varchar password_hash
        varchar name
        varchar role "user | creator | admin"
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCTS {
        uuid id PK
        varchar title
        text description
        integer price_cents
        varchar currency FK
        uuid creator_id FK
        boolean is_published
        timestamptz created_at
    }

    INVENTORY {
        uuid id PK
        uuid product_id FK
        varchar file_name
        bigint file_size_bytes
        varchar file_path
        varchar file_hash
        varchar mime_type
        varchar version
        timestamptz created_at
    }

    SALES {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        integer amount_cents
        varchar currency FK
        varchar payment_status
        varchar payment_id
        timestamptz created_at
    }

    CURRENCIES ||--o{ COMPANY : "default currency"
    CURRENCIES ||--o{ PRODUCTS : "priced in"
    CURRENCIES ||--o{ SALES : "billed in"
    USERS ||--o{ PRODUCTS : "creates"
    USERS ||--o{ SALES : "purchases"
    PRODUCTS ||--o{ INVENTORY : "contains assets"
    PRODUCTS ||--o{ SALES : "sold via"
```

---

## 5. Security & Cryptographic Architecture

1. **Digital Asset Protection (HMAC-SHA256 Tokenized Downloads)**:
   - Asset binaries are never exposed via public static URLs.
   - Upon verified checkout, a time-limited HMAC-SHA256 signed token is minted containing: `assetId`, `userId`, and `expiresAt` (default 15 minutes).
   - The token is verified using `crypto.timingSafeEqual` to safeguard against timing attacks. Expired or tampered links return HTTP 410 / 403.
2. **PostgreSQL Truncation Defense**:
   - Critical system entities (such as `company` configuration) utilize PostgreSQL triggers (`prevent_table_truncate()`) to block inadvertent or malicious table wipes.
3. **Password Security**:
   - Passwords must be hashed using `bcryptjs` with salt rounds set to 12. Password hashes are excluded by default in repository projection queries.
4. **Rate Limiting Tiers**:
   - **General API**: 100 requests per 15 minutes per IP.
   - **Auth Brute-Force Defense**: 5 attempts per 15 minutes per IP.
   - **Asset Download Scraper Defense**: 25 downloads per 1 hour per IP.

---

## 6. Operational & Deployment Guide

### Database Initialization & Migration Runbook
To seed or reset the database with clean tables, functions, triggers, and top 10 international currencies:
```powershell
npm run db:reset
```
*Direct invocation with external connection string:*
```powershell
$env:DATABASE_URL="postgresql://user:pass@render-db-host/dbname"; npx tsx src/database/reset.ts
```

### Verification Commands
```powershell
# Verify TypeScript strict type-checking
npx tsc --noEmit

# Run automated tests
npm test
```

