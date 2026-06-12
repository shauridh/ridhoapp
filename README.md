# Sabana POS

Modern point-of-sale system untuk restoran dan kafe, dibangun dengan Next.js 16, TypeScript, Supabase, dan TailwindCSS.

## 🚀 Fitur Utama

### Kasir (POS)

- **Transaksi Real-time**: Buat pesanan dengan varian produk, hitung total otomatis
- **Pembayaran Fleksibel**: Cash, QRIS, atau kombinasi
- **Void Order**: Batalkan order dengan tracking reason
- **Stock Management**: Pengurangan stok otomatis berdasarkan resep

### Inventory

- **Recipe Management**: Definisikan resep dengan ingredient + qty
- **Stock Tracking**: Real-time inventory dengan stock movements log
- **Opname**: Physical inventory dengan variance tracking
- **Drag-Drop UI**: Reorder ingredient dengan dnd-kit

### Keuangan

- **Shift Management**: Open/close shift dengan cash reconciliation
- **Laporan Keuangan**: Dashboard kas, QRIS, pendapatan
- **Piutang**: Track hutang customer
- **Cashflow**: Pencatatan pemasukan/pengeluaran

### Order Management

- **Online Orders**: Integrasi pesanan dari berbagai channel
- **Order History**: Riwayat lengkap dengan edit tracking
- **Status Tracking**: Pending → Completed → Delivered

### Laporan

- **Dashboard**: KPI utama (revenue, transactions, inventory)
- **Shift Report**: Ringkasan per shift (auto-send via WhatsApp)
- **Product Performance**: Top sellers, revenue by category
- **Inventory Report**: Stock level, fast/slow movers

## 📦 Tech Stack

| Layer             | Technology                               |
| ----------------- | ---------------------------------------- |
| **Frontend**      | Next.js 16, React 19, TypeScript 5       |
| **Styling**       | TailwindCSS 4, PostCSS                   |
| **Database**      | Supabase (PostgreSQL)                    |
| **Auth**          | Supabase Auth (RLS + Row-Level Security) |
| **UI Components** | Custom React components + Lucide Icons   |
| **Drag-Drop**     | @dnd-kit                                 |
| **Testing**       | Vitest + React Testing Library           |
| **Linting**       | ESLint 9 + Prettier 3                    |
| **CI/CD Ready**   | Husky pre-commit hooks                   |

## 🏗️ Project Structure

```
ridhoapp/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout + metadata
│   ├── page.tsx                 # Home page
│   ├── login/                   # Auth pages
│   ├── (internal)/              # Protected routes (with auth check)
│   │   ├── dashboard/           # Dashboard & analytics
│   │   ├── finance/             # Keuangan module
│   │   ├── inventory/           # Inventory module
│   │   ├── pos/                 # POS (kasir) module
│   │   ├── settings/            # Settings
│   │   ├── order/               # Order management
│   │   ├── layout.tsx           # Auth middleware
│   │   ├── error.tsx            # Error boundary
│   │   └── loading.tsx          # Loading UI
│   └── globals.css              # Global styles
│
├── components/                   # Reusable components
│   └── ui/                      # UI component library
│
├── lib/                         # Core business logic
│   ├── domain/                  # Domain-driven design (tested)
│   ├── data/                    # Data layer (Supabase queries)
│   ├── supabase/                # Supabase utilities
│   ├── qris/                    # QRIS payment integration
│   └── wa/                      # WhatsApp integration
│
├── supabase/                    # Database migrations & seeds
│   ├── migrations/              # SQL migration files
│   └── seed/
│
├── tests/                       # Test utilities
│   ├── setup.ts
│   ├── fake-supabase.ts
│   └── sanity.test.ts
│
├── public/                      # Static assets
│
├── .prettierrc.json             # Code formatter config (NEW)
├── .husky/                      # Git hooks (NEW)
├── eslint.config.mjs
├── next.config.ts               # Performance optimization (UPGRADED)
├── tsconfig.json
├── vitest.config.ts             # Coverage config (UPGRADED)
├── package.json
└── README.md
```

## 🔐 Architecture Highlights

### Security

- **Row-Level Security (RLS)**: Database-level access control
- **Server-Side RPC**: Atomic transactions untuk POS operations
- **Auth Middleware**: Supabase session validation di server
- **Input Validation**: TypeScript strict mode + domain validators

### Atomicity & Race Conditions

- **Stock Deduction**: Direct SQL UPDATE (atomic at row-level)
- **Transaction Locking**: `FOR UPDATE` dalam void_order untuk prevent double-void
- **Idempotent Operations**: Safe untuk retry

### Performance

- **Image Optimization**: AVIF + WebP formats
- **Font Optimization**: Plus Jakarta Sans with variable weights
- **Bundle Optimization**: SWC minification
- **Security Headers**: HSTS, X-Frame-Options, CSP-friendly

## 🚀 Memulai

### Prerequisites

- Node.js 20+ dan npm/yarn/pnpm
- Supabase account (free tier OK)
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/ridhoapp.git
cd ridhoapp

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.local.example .env.local
# Edit .env.local dengan Supabase credentials

# 4. Setup database (if not already done)
npm run supabase:link
npm run supabase:migrate

# 5. Start development server
npm run dev
```

Akses aplikasi di `http://localhost:3000`

## 📝 Perintah Penting

### Development

```bash
npm run dev              # Start development server
npm run build           # Build untuk production
npm run start           # Start production server
```

### Code Quality (NEW)

```bash
npm run lint            # Run ESLint
npm run format          # Auto-format dengan Prettier
npm run format:check    # Check if code needs formatting
```

### Testing (UPGRADED)

```bash
npm run test            # Run unit tests
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report (70% threshold)
```

## 🧪 Testing Strategy

### Domain Testing

Business logic ditest di `lib/domain/`:

- `cart.test.ts` - Shopping cart operations
- `inventory.test.ts` - Inventory calculations
- `payment.test.ts` - Payment logic
- `shift.test.ts` - Shift operations

### Run Tests

```bash
npm run test               # Single run
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report (70% threshold)
```

## 🔧 Code Quality (NEW)

### Prettier Configuration

- 100 character line width
- 2 spaces indentation
- Trailing commas (ES5 compatible)
- Auto-format on `npm run format`

### Husky Git Hooks

- Auto-lint staged files before commit
- Auto-format staged files before commit
- Prevents buggy code from entering repository

```bash
# Hooks run automatically on git commit
# To skip (not recommended): git commit --no-verify
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Push to GitHub, then connect to Vercel
# Auto-deploy on push to main branch
```

### Self-Hosted

```bash
npm run build
npm run start
```

## 📄 License

MIT License

## 🆘 Support

- GitHub Issues untuk bug reports
- Documentation di `docs/` folder
- Contact development team untuk pertanyaan

---

**Version**: 0.1.0 (Beta)  
**Last Updated**: June 2026
