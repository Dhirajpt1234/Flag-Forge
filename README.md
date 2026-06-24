# Flag Forge

### Multi-Tenant Feature Flag Management Platform

> A production-grade SaaS backend I designed and built to demonstrate real-world distributed systems, security, and platform engineering — inspired by LaunchDarkly and Split.io.

[![GitHub](https://img.shields.io/badge/GitHub-Flag--Forge-181717?logo=github&logoColor=white)](https://github.com/Dhirajpt1234/Flag-Forge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**Author:** [Dhiraj Thorat](https://github.com/Dhirajpt1234) · **Repo:** [github.com/Dhirajpt1234/Flag-Forge](https://github.com/Dhirajpt1234/Flag-Forge)

---

## At a Glance

| | |
|---|---|
| **What it is** | A multi-tenant feature flag platform — teams control feature rollouts, user targeting, and environment configs without redeploying code |
| **Why it exists** | Portfolio project built to prove I can design and ship backend systems at SaaS scale, not just tutorial CRUD apps |
| **Problem domain** | Feature management · Release engineering · Multi-tenancy · Real-time configuration |
| **Scale of build** | 10+ database entities · Custom rule evaluation engine · Layered REST API · JWT + RBAC auth |
| **Comparable to** | LaunchDarkly · Split.io · Flagsmith *(self-hosted, full source access)* |

---

## What This Project Demonstrates

Use this as a quick skills map when reviewing my profile.

| Category | Skills Demonstrated |
|---|---|
| **Backend Engineering** | REST API design, layered architecture, DTO validation, error handling, structured logging |
| **System Design** | Multi-tenancy, caching, deterministic hashing, stateless services, horizontal scalability |
| **Database Design** | PostgreSQL schema modeling, Prisma ORM, composite indexes, JSONB config storage |
| **Security** | JWT authentication, RBAC, tenant isolation, fail-safe evaluation, input validation |
| **Design Patterns** | Chain of Responsibility, Factory, Template Method, Repository, Dependency Injection |
| **Domain Modeling** | Feature flags, environments, targeting rules, org membership, audit trails |
| **DevOps Readiness** | Docker Compose, environment-based config, production-oriented project structure |

---

## Why I Built This

Feature flags are how modern teams ship safely — but most tutorials stop at a boolean toggle in a database. I wanted to build something closer to what I'd encounter on a platform team: **multi-tenant isolation, role-based access, a real evaluation engine, and rollout logic that behaves consistently at scale.**

Flag Forge is my answer to that challenge. I studied how commercial platforms like LaunchDarkly and Split.io solve release control, then implemented the core patterns myself — from PostgreSQL schema design through to a deterministic percentage rollout engine.


---

## Key Highlights


- **Custom Rule Engine** — Chain of Responsibility pattern with short-circuit evaluation; supports user allow lists, attribute matching, and percentage rollouts
- **Deterministic Rollouts** — MD5 hash bucketing ensures the same user always gets the same result for a given flag (stable cohorts, no per-request state)
- **Multi-Tenant by Design** — Shared-schema tenancy with `organizationId` scoping on every query; JWT carries org context
- **Environment-Aware Flags** — One flag definition, independent configs per local / staging / production
- **Performance on the Hot Path** — In-memory rule chain cache keyed by `flagKey:environment`; Redis-ready for multi-instance deployment
- **Extensible Rule Config** — JSONB-backed rule definitions; new rule types without database migrations
- **Production Patterns Throughout** — Repository layer, service layer, middleware pipeline, consistent API response envelope, structured audit hooks

---

## Features

| Feature | What It Does |
|---|---|
| Feature Flag CRUD | Create, update, delete, and list flags per organization |
| Multi-Tenant Organizations | Isolated workspaces with slug-based tenant identity |
| User Management | User accounts with organization membership |
| RBAC | `OWNER` · `ADMIN` · `WRITER` · `READER` role hierarchy |
| JWT Authentication | Bearer tokens with `userId`, `orgId`, and `role` claims |
| Rule-Based Targeting | Target by user ID or custom attributes |
| Percentage Rollouts | Gradual, deterministic feature exposure |
| Environment Support | Separate flag state for local, staging, and production |
| Audit Logs | Structured audit trail for configuration changes |
| Real-Time Evaluation | Sub-millisecond flag checks via cached rule chains |
| Caching | In-memory rule engine cache with explicit invalidation |

---

## Architecture

```mermaid
flowchart TB
    subgraph Clients
        WEB[Admin UI — Roadmap]
        APP[Client Applications]
    end

    subgraph FlagForge["Flag Forge API"]
        GW[Express HTTP Server]
        AUTH[JWT Auth Middleware]
        ORG[Org Context Middleware]
        CTRL[Controllers]
        SVC[Services]
        RE[Rule Engine]
        CACHE[(In-Memory Rule Cache)]
    end

    subgraph Data
        PG[(PostgreSQL)]
        REDIS[(Redis — Planned)]
    end

    WEB --> GW
    APP --> GW
    GW --> AUTH --> ORG --> CTRL --> SVC
    SVC --> RE --> CACHE
    SVC --> PG
    CACHE -.-> REDIS
```

**Request flow:** Client → JWT auth → org context → controller → service → repository / rule engine → response

---

## System Design

<details>
<summary><strong>Multi-Tenancy</strong></summary>

Shared database, shared schema with a tenant discriminator (`organizationId`) on all org-owned entities. Every authenticated request carries `orgId` in the JWT. Repository queries always filter by organization. Unique constraints are composite: `(organizationId, key)`.

</details>

<details>
<summary><strong>Authentication & Authorization</strong></summary>

```mermaid
sequenceDiagram
    participant Client
    participant API as Flag Forge API
    participant JWT as JWT Middleware
    participant Org as Org Context
    participant SVC as Service Layer

    Client->>API: Request + Bearer Token
    API->>JWT: Verify signature & expiry
    JWT->>Org: Attach userId, orgId, role
    Org->>SVC: Enforce tenant scope + RBAC
    SVC-->>Client: Response
```

| Role | Access |
|---|---|
| `OWNER` | Full organization control |
| `ADMIN` | Manage flags, rules, members |
| `WRITER` | Create and update flags and rules |
| `READER` | Read-only access |

</details>

<details>
<summary><strong>Rule Evaluation Engine</strong></summary>

Rules execute in **priority order** via Chain of Responsibility. First matching rule wins.

| Rule Type | Behavior |
|---|---|
| `USER_ALLOW_LIST` | Enable if user ID is in allow list |
| `ATTRIBUTE_MATCH` | Enable if all required attributes match |
| `PERCENTAGE_ROLLOUT` | Deterministic MD5 bucket assignment |
| `DEFAULT` | Fallback when no rule matches |

**Percentage rollout (deterministic hashing):**

```
hashInput = userId + ":" + flagKey
bucket    = MD5(hashInput) mod 100
enabled   = bucket < configuredPercentage
```

Same user + same flag = same result every time. No server-side state per evaluation.

</details>

<details>
<summary><strong>Caching, Audit & Scalability</strong></summary>

| Concern | Approach |
|---|---|
| **Caching** | Rule chains cached in memory per `flagKey:environment`; invalidated on rule CRUD |
| **Audit** | Structured events on all mutations — actor, action, entity, diff, timestamp |
| **Scalability** | Stateless API servers, indexed tenant queries, Redis planned for distributed cache |
| **Fail-safe** | Evaluation errors default to `enabled: false` — features stay off on failure |

</details>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.9 |
| Backend | Node.js · Express 5 · Prisma ORM |
| Database | PostgreSQL 15+ |
| Cache | In-memory (Redis planned) |
| Security | JWT · RBAC · Input validation |
| Logging | Winston / Pino |
| Infrastructure | Docker · Docker Compose |

---

## Database Design

10+ entities modeling a full multi-tenant flag platform.

| Entity | Role |
|---|---|
| `Organization` | Top-level tenant |
| `User` | Platform identity |
| `OrganizationMember` | User ↔ org join with role |
| `FeatureFlag` | Flag definition scoped to org |
| `FlagEnvironment` | Per-environment state and rules |
| `RuleDefinition` | Priority-ordered targeting rule (JSON config) |
| `Environment` | Named env (local, staging, production) |

```mermaid
erDiagram
    User ||--o{ OrganizationMember : belongs_to
    Organization ||--o{ OrganizationMember : has
    Organization ||--o{ Environment : owns
    Organization ||--o{ FeatureFlag : owns
    FeatureFlag ||--o{ FlagEnvironment : configured_in
    Environment ||--o{ FlagEnvironment : scopes
    FlagEnvironment ||--o{ RuleDefinition : has_rules

    Organization {
        string id PK
        string slug UK
        string ownerId FK
    }
    FeatureFlag {
        string id PK
        string organizationId FK
        string key
        enum valueType
    }
    RuleDefinition {
        string id PK
        enum ruleType
        int priority
        json config
    }
```

---

## Project Structure

```
src/
├── Controller/          # HTTP handlers
├── Service/             # Business logic
├── Repository/          # Data access (Prisma)
├── RuleEngine/          # Core evaluation engine ★
│   ├── Abstract/        # AbstractRule base class
│   ├── Core/            # RuleEngine orchestrator
│   ├── Factory/         # Dynamic rule creation
│   └── Rules/           # AllowList · AttributeMatch · PercentageRollout
├── Middleware/          # JWT auth · org context · error handling
├── Routes/              # REST route definitions
├── DTO/                 # Request/response contracts
└── Utils/               # Logging · validation · API responses
prisma/schema.prisma     # Full database schema
docs/architecture/       # Architecture decision records
```

---

## API Overview

Base URL: `http://localhost:3000/api/feature-flags`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/flags` | JWT | Create a feature flag |
| `GET` | `/flags?environment=production` | JWT | List flags |
| `PUT` | `/flags/:key` | JWT | Update a flag |
| `DELETE` | `/flags/:key` | JWT | Delete a flag |
| `POST` | `/:flagKey/evaluate?environment=production` | Public | Evaluate flag (boolean) |
| `POST` | `/:flagKey/evaluate/details?environment=production` | Public | Evaluate with rule match details |
| `POST` | `/:flagKey/rules?environment=production` | JWT | Create targeting rule |

<details>
<summary><strong>Example — Evaluate a Flag</strong></summary>

**Request**

```http
POST /api/feature-flags/new-checkout-flow/evaluate?environment=production
Content-Type: application/json

{
  "userId": "user-abc-123",
  "attributes": { "country": "US", "plan": "premium" }
}
```

**Response**

```json
{
  "success": true,
  "status": 200,
  "data": { "enabled": true }
}
```

</details>

<details>
<summary><strong>Example — Create a Flag</strong></summary>

```http
POST /api/feature-flags/flags
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "new-checkout-flow",
  "name": "New Checkout Flow",
  "description": "Redesigned checkout with one-click pay"
}
```

</details>

---

## Getting Started

```bash
git clone https://github.com/Dhirajpt1234/Flag-Forge.git
cd Flag-Forge
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Prerequisites:** Node.js 20+ · PostgreSQL 15+ · npm

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `PORT` | ❌ | Server port (default: `3000`) |

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flagforge
JWT_SECRET=change-me-in-production
PORT=3000
```

**Docker (local infrastructure):**

```bash
docker compose up -d postgres redis
npm run dev
```

---

## Usage Example

How a client application consumes the evaluation API:

```typescript
const response = await fetch(
  "http://localhost:3000/api/feature-flags/new-checkout-flow/evaluate?environment=production",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-abc-123",
      attributes: { country: "US", plan: "premium" },
    }),
  }
);

const { data } = await response.json();

if (data.enabled) {
  renderNewCheckout();   // 25% rollout — user is in bucket
} else {
  renderLegacyCheckout();
}
```

---

## Design Patterns & Concepts

| Pattern / Concept | Where It Appears |
|---|---|
| Chain of Responsibility | Priority-ordered rule evaluation with short-circuit |
| Factory | Dynamic rule instantiation from JSON config |
| Template Method | `AbstractRule` base class |
| Repository | Decoupled data access behind interfaces |
| Dependency Injection | Manual DI wiring at application bootstrap |
| Multi-Tenancy | Shared-schema with org-scoped queries |
| Consistent Hashing | Deterministic percentage rollout bucketing |
| Fail-Closed Design | Evaluation errors return `enabled: false` |
| Cache Invalidation | Explicit cache clear on rule mutations |

---


