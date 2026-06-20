# Rencana Perbaikan Project Sabana POS

## Executive Summary

Berdasarkan analisis menyeluruh terhadap codebase Sabana POS, project ini memiliki fondasi teknis yang solid dengan Next.js 16, React 19, TypeScript, dan Supabase. Namun terdapat beberapa area kritis yang perlu diperbaiki untuk meningkatkan keamanan, kualitas kode, dan pengalaman developer.

**Prioritas Utama:**

1. Keamanan (Security) - CRITICAL
2. Validasi Input & Autorisasi - HIGH
3. Dokumentasi - HIGH
4. Deployment & DevOps - MEDIUM
5. Monitoring & Observability - MEDIUM

---

## 1. 🔴 KEAMANAN (CRITICAL PRIORITY)

### 1.1 Security Vulnerabilities yang Harus Segera Diperbaiki

#### a) Dependency Vulnerabilities

**Status:** Ada 2 vulnerabilities terdeteksi

- `undici` 7.0.0-7.27.2: TLS certificate validation bypass
- `postcss` <8.5.10: XSS vulnerability

**Action Items:**

```bash
# Fix undici vulnerability
npm audit fix

# Review postcss fix (requires Next.js upgrade)
npm audit fix --force  # Be careful, review breaking changes first
```

**File:** `package.json`

#### b) Missing Input Validation

**Status:** CRITICAL - Tidak ada validasi input pada server actions

**Affected Files:**

- `app/(internal)/finance/keuangan-actions.ts`
- `app/(internal)/settings/menu/category-actions.ts`
- `app/(internal)/pos/held-actions.ts`
- Dan semua server action files lainnya

**Solution:** Implementasi Zod untuk validasi

**Action Items:**

1. Install Zod: `npm install zod`
2. Create validation schemas untuk setiap server action
3. Validate inputs sebelum database operations

**Example Implementation:**

```typescript
// lib/validation/cashflow.ts
import { z } from "zod";

export const cashflowSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().positive().finite(),
  kind: z.enum(["income", "expense"]),
  entry_date: z.string().datetime(),
});

// app/(internal)/finance/keuangan-actions.ts
export async function tambahKeuangan(data: unknown) {
  const validated = cashflowSchema.parse(data);
  // Now use validated data
  const { error } = await supabase.from("cashflows").insert(validated);
}
```

#### c) Missing Authorization Checks

**Status:** CRITICAL - Users dapat mengakses/menghapus data milik user lain

**Affected Files:**

- `app/(internal)/pos/held-actions.ts:26-36` - deleteHeldOrder
- Semua delete/update operations

**Current Issue:**

```typescript
export async function deleteHeldOrder(id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tidak terautentikasi" };

  // ISSUE: Tidak ada check ownership!
  const { error } = await supabase.from("held_orders").delete().eq("id", id);
}
```

**Solution:**

```typescript
export async function deleteHeldOrder(id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tidak terautentikasi" };

  // Check ownership first
  const { data: order } = await supabase
    .from("held_orders")
    .select("created_by")
    .eq("id", id)
    .single();

  if (order?.created_by !== user.id) {
    return { ok: false, error: "Unauthorized" };
  }

  // Then delete
  const { error } = await supabase
    .from("held_orders")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id); // Double check
}
```

**Action Items:**

1. Audit semua delete/update operations
2. Add ownership checks
3. Implement Supabase RLS policies sebagai defense-in-depth
4. Add `.eq("created_by", user.id)` to all user-specific queries

#### d) Missing Security Headers

**Status:** HIGH - Tidak ada security headers

**Action Items:**
Create `middleware.ts` di root directory:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

export const config = {
  matcher: "/:path*",
};
```

#### e) Missing Rate Limiting

**Status:** MEDIUM - Vulnerable to brute force attacks

**Affected Files:**

- `app/login/actions.ts` - No rate limiting on authentication

**Action Items:**

1. Install rate limiting library: `npm install @upstash/ratelimit @upstash/redis`
2. Implement rate limiting on login:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 min
});

export async function login(email: string, password: string) {
  const { success } = await ratelimit.limit(email);
  if (!success) return { error: "Terlalu banyak percobaan login" };

  // ... rest of login logic
}
```

#### f) Environment Variables Security

**Status:** CRITICAL if committed to git

**Action Items:**

1. Verify `.env` is in `.gitignore`
2. Check git history: `git log --all --full-history -- .env`
3. If .env was ever committed, rotate all secrets immediately:
   - `WA_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Use environment variable management for production (Vercel, AWS Secrets Manager, etc.)

---

## 2. 📝 DOKUMENTASI (HIGH PRIORITY)

### 2.1 Missing Critical Documentation

#### a) README.md

**Status:** Exists but likely needs improvement

**Action Items:**
Create/update comprehensive README.md:

````markdown
# Sabana POS

Sistem Point of Sale modern untuk restoran dan kafe dengan fitur lengkap.

## 🚀 Fitur Utama

- 💰 Point of Sale dengan support varian produk
- 📦 Manajemen Inventory & Recipe
- 💵 Manajemen Keuangan & Shift
- 📊 Dashboard Analytics & KPI
- 📱 Integrasi WhatsApp untuk notifikasi
- 💳 Integrasi QRIS payment
- 🔐 Authentication dengan Supabase

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Testing:** Vitest + React Testing Library
- **Code Quality:** ESLint 9 + Prettier 3

## 📋 Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account

## 🚀 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ridhoapp
```
````

2. Install dependencies:

```bash
npm install
```

3. Setup environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dengan credentials Supabase Anda:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
WA_API_KEY=your_whatsapp_api_key
WA_SENDER=your_wa_number
```

4. Run database migrations:

```bash
# Setup Supabase CLI
npx supabase init
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📁 Project Structure

```
ridhoapp/
├── app/                    # Next.js App Router
│   ├── (internal)/        # Protected routes
│   │   ├── dashboard/     # Analytics & KPI
│   │   ├── pos/          # Point of Sale
│   │   ├── inventory/    # Stock management
│   │   ├── finance/      # Financial management
│   │   └── settings/     # App settings
│   ├── login/            # Authentication
│   └── layout.tsx        # Root layout
├── components/           # Reusable UI components
│   └── ui/              # UI component library
├── lib/                 # Core business logic
│   ├── domain/          # Domain logic (tested)
│   ├── data/            # Data access layer
│   ├── supabase/        # Supabase utilities
│   ├── qris/            # QRIS payment integration
│   └── wa/              # WhatsApp integration
├── supabase/
│   ├── migrations/      # Database migrations
│   └── seed/           # Seed data
└── tests/              # Test configuration
```

## 🏗️ Architecture

Project ini menggunakan **Domain-Driven Design (DDD)** dengan clear separation of concerns:

1. **Presentation Layer** (`/app`) - Next.js routes
2. **Domain Layer** (`/lib/domain`) - Business logic (pure, tested)
3. **Data Layer** (`/lib/data`) - Database queries
4. **Infrastructure** (`/lib/*`) - External integrations

## 🔒 Security

- Row-Level Security (RLS) di Supabase
- Server-side session validation
- Input validation dengan Zod
- Atomic database transactions
- HTTPS only in production

## 🚀 Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Import project di Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
docker build -t sabana-pos .
docker run -p 3000:3000 sabana-pos
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📄 License

[Your License]

## 📧 Support

For support, email [your-email] or open an issue.

````

#### b) JSDoc Comments
**Status:** Completely missing

**Action Items:**
Add JSDoc to all public functions and components:

```typescript
/**
 * Menambahkan transaksi keuangan baru
 * @param description - Deskripsi transaksi
 * @param amount - Jumlah uang (harus positif)
 * @param kind - Jenis transaksi (income/expense)
 * @param entry_date - Tanggal transaksi (ISO 8601)
 * @returns Promise dengan status operasi
 * @throws {Error} Jika user tidak terautentikasi atau validasi gagal
 */
export async function tambahKeuangan(
  description: string,
  amount: number,
  kind: "income" | "expense",
  entry_date: string,
) {
  // implementation
}
````

#### c) API Documentation

**Status:** Missing

**Action Items:**

1. Create `docs/` directory
2. Document all server actions
3. Create architecture diagrams
4. Document database schema

#### d) Contributing Guidelines

**Status:** Missing

**Action Items:**
Create `CONTRIBUTING.md`:

```markdown
# Contributing to Sabana POS

## Development Setup

[Setup instructions]

## Code Style

- TypeScript strict mode
- ESLint rules (run `npm run lint`)
- Prettier formatting (run `npm run format`)
- 100 characters line width

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` test additions/changes
- `chore:` maintenance tasks

## Testing Requirements

- All new features must have unit tests
- Maintain 70% code coverage
- Run `npm test` before committing

## Pull Request Process

1. Create feature branch from `main`
2. Make your changes
3. Add tests
4. Run `npm test` and `npm run lint`
5. Commit with conventional commit message
6. Push and create PR
7. Wait for review
```

---

## 3. 🚀 DEPLOYMENT & DEVOPS (MEDIUM PRIORITY)

### 3.1 Missing CI/CD Pipeline

**Action Items:**
Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### 3.2 Missing Docker Configuration

**Action Items:**

1. Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

2. Create `.dockerignore`:

```
Dockerfile
.dockerignore
node_modules
npm-debug.log
README.md
.next
.git
.gitignore
.env*.local
```

3. Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - WA_API_KEY=${WA_API_KEY}
      - WA_SENDER=${WA_SENDER}
    restart: unless-stopped
```

4. Update `next.config.ts` untuk standalone output:

```typescript
const nextConfig = {
  output: "standalone",
  // ... rest of config
};
```

### 3.3 Production Optimizations

**Action Items:**
Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Performance
  swcMinify: true,
  poweredByHeader: false,

  // Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
```

---

## 4. 📊 MONITORING & OBSERVABILITY (MEDIUM PRIORITY)

### 4.1 Error Tracking

**Action Items:**

1. Install Sentry: `npm install @sentry/nextjs`
2. Run setup: `npx @sentry/wizard@latest -i nextjs`
3. Configure `sentry.client.config.ts` and `sentry.server.config.ts`
4. Add environment variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   SENTRY_AUTH_TOKEN=your_auth_token
   ```

### 4.2 Performance Monitoring

**Action Items:**
Add Web Vitals reporting in `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 4.3 Logging

**Action Items:**
Replace console.logs dengan proper logging:

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

// Usage
import { logger } from "@/lib/logger";

logger.info({ userId, action: "login" }, "User logged in");
logger.error({ error, userId }, "Failed to process payment");
```

---

## 5. 🧹 CODE QUALITY IMPROVEMENTS (LOW PRIORITY)

### 5.1 Remove Unused Dependencies

**Action Items:**

```bash
npm uninstall @tailwindcss/postcss tailwindcss
```

### 5.2 Setup Bundle Analyzer

**Action Items:**

1. Install: `npm install @next/bundle-analyzer`
2. Update `next.config.ts`:

```typescript
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  // ... your config
};

export default withBundleAnalyzer(nextConfig);
```

3. Run analysis:

```bash
ANALYZE=true npm run build
```

### 5.3 Add Pre-commit Hooks

**Action Items:**

1. Install: `npm install -D husky lint-staged`
2. Setup husky: `npx husky init`
3. Add pre-commit hook:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

4. Update `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 6. 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Critical Security (Week 1)

- [ ] Fix dependency vulnerabilities (`npm audit fix`)
- [ ] Verify `.env` tidak di-commit ke git
- [ ] Rotate secrets jika ada di git history
- [ ] Implement Zod validation untuk semua server actions
- [ ] Add authorization checks ke semua delete/update operations
- [ ] Add security headers via middleware
- [ ] Implement rate limiting di login

### Phase 2: Documentation (Week 1-2)

- [ ] Update/create comprehensive README.md
- [ ] Add JSDoc comments ke public functions
- [ ] Create CONTRIBUTING.md
- [ ] Document API endpoints
- [ ] Create architecture diagrams

### Phase 3: DevOps (Week 2-3)

- [ ] Create GitHub Actions CI/CD pipeline
- [ ] Create Dockerfile dan docker-compose.yml
- [ ] Update next.config.ts dengan production optimizations
- [ ] Setup Supabase RLS policies
- [ ] Create deployment documentation

### Phase 4: Monitoring (Week 3-4)

- [ ] Setup Sentry error tracking
- [ ] Add Web Vitals monitoring
- [ ] Implement structured logging
- [ ] Setup uptime monitoring

### Phase 5: Code Quality (Week 4)

- [ ] Remove unused dependencies
- [ ] Setup bundle analyzer
- [ ] Add pre-commit hooks
- [ ] Run full security audit
- [ ] Performance optimization review

---

## 7. 🎯 SUCCESS METRICS

### Security

- ✅ Zero high/critical vulnerabilities
- ✅ All inputs validated dengan Zod
- ✅ All operations authorized
- ✅ Security headers implemented
- ✅ Rate limiting active

### Documentation

- ✅ README.md complete dengan setup instructions
- ✅ 80%+ functions have JSDoc comments
- ✅ API documentation available
- ✅ Contributing guidelines exist

### DevOps

- ✅ CI/CD pipeline running
- ✅ Docker containerization working
- ✅ Automated testing in CI
- ✅ Production deployment successful

### Monitoring

- ✅ Error tracking active
- ✅ Performance monitoring live
- ✅ Structured logging implemented
- ✅ Alert system configured

### Code Quality

- ✅ No unused dependencies
- ✅ Bundle size < 500KB
- ✅ Test coverage > 70%
- ✅ Pre-commit hooks working

---

## 8. 🚨 RISKS & MITIGATIONS

### Risk 1: Breaking Changes saat Update Dependencies

**Mitigation:**

- Test thoroughly di development environment
- Update incrementally
- Keep detailed changelog
- Have rollback plan

### Risk 2: Performance Impact dari Security Features

**Mitigation:**

- Implement rate limiting dengan Redis (fast)
- Use edge middleware untuk security headers
- Optimize validation schemas
- Monitor performance metrics

### Risk 3: Learning Curve untuk New Tools

**Mitigation:**

- Start dengan critical items first
- Document as you implement
- Pair programming sessions
- Gradual rollout

---

## 9. 💰 ESTIMATED EFFORT

| Phase                  | Effort   | Priority |
| ---------------------- | -------- | -------- |
| Phase 1: Security      | 3-5 days | CRITICAL |
| Phase 2: Documentation | 2-3 days | HIGH     |
| Phase 3: DevOps        | 4-5 days | MEDIUM   |
| Phase 4: Monitoring    | 2-3 days | MEDIUM   |
| Phase 5: Code Quality  | 1-2 days | LOW      |

**Total: 12-18 days** (approx 2.5-4 weeks)

---

## 10. 📞 NEXT STEPS

1. **Review plan ini** dengan team
2. **Prioritize** berdasarkan business needs
3. **Assign owners** untuk setiap phase
4. **Setup tracking** (GitHub Projects, Jira, etc.)
5. **Start dengan Phase 1** (Security)

---

**Plan Created:** 2026-06-19
**Last Updated:** 2026-06-19
**Status:** Ready for Review
