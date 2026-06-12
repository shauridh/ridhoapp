# Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│        Next.js 16 (React 19 + TypeScript 5)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ App Router (/app)                                      │ │
│  │ - Public routes: login/                                │ │
│  │ - Protected: (internal)/* with auth middleware         │ │
│  │ - Error boundaries & loading states                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Components (/components/ui)                            │ │
│  │ - Reusable UI components (buttons, cards, dialogs)    │ │
│  │ - Chart components (bar, line, donut, radar)          │ │
│  │ - 100% TypeScript with strict prop typing             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│                      (/lib/domain)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Pure Functions (100% tested)                           │ │
│  │ - cart.ts: Shopping cart calculations                  │ │
│  │ - payment.ts: Payment processing                       │ │
│  │ - inventory.ts: Stock calculations                     │ │
│  │ - shift.ts: Shift management logic                     │ │
│  │ - opname.ts: Physical inventory logic                  │ │
│  │ - piutang.ts: Receivables calculations                 │ │
│  │ - date-range.ts: Date utilities                        │ │
│  │ - report.ts: Report generation                         │ │
│  │ - grid.ts: Grid/table utilities                        │ │
│  │ - menu.ts: Menu calculations                           │ │
│  │ - online-order.ts: Online order logic                  │ │
│  │                                                        │ │
│  │ Pattern: Discriminated unions for error handling       │ │
│  │ { ok: true, data: T } | { ok: false, error: string }  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                         │
│                      (/lib/data)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Supabase Query Functions                               │ │
│  │ - orders.ts: Order CRUD + queries                      │ │
│  │ - inventory.ts: Inventory queries                      │ │
│  │ - products.ts: Product catalog                         │ │
│  │ - recipes.ts: Recipe management                        │ │
│  │ - shifts.ts: Shift queries                             │ │
│  │ - dashboard.ts: Aggregated dashboard data              │ │
│  │ - online-orders.ts: Online order queries               │ │
│  │ - cashflow.ts: Finance data                            │ │
│  │ - akun.ts: Chart of accounts                           │ │
│  │ - categories.ts: Product categories                    │ │
│  │                                                        │ │
│  │ Each function uses server.ts (SSR) for security        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Server Actions (/app/*/actions.ts)                     │ │
│  │ - Form submissions                                     │ │
│  │ - Data mutations                                       │ │
│  │ - Error handling & UI feedback                         │ │
│  │                                                        │ │
│  │ RPC Functions (Database Level)                         │ │
│  │ - create_order() - Atomik order + stock deduction      │ │
│  │ - void_order() - Atomik order cancellation + restore   │ │
│  │ - close_shift() - Atomik shift closure + income entry  │ │
│  │                                                        │ │
│  │ Utilities                                              │ │
│  │ - QRIS converter & parser (/lib/qris)                  │ │
│  │ - WhatsApp sender (/lib/wa)                            │ │
│  │ - Supabase client/server (/lib/supabase)               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
│              Supabase (PostgreSQL)                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Security Features                                      │ │
│  │ - Row-Level Security (RLS) policies                    │ │
│  │ - Auth users via Supabase Auth                         │ │
│  │ - Security definer functions for sensitive ops         │ │
│  │ - Audit logging via stock_movements, order_edits       │ │
│  │                                                        │ │
│  │ Tables (15+ tables)                                    │ │
│  │ - Users, Products, Recipes, Ingredients               │ │
│  │ - Orders, OrderItems, OrderItemVariants                │ │
│  │ - Shifts, CashDrawerMovements                          │ │
│  │ - CashflowEntries, StockMovements                      │ │
│  │ - OnlineOrders, HeldOrders, Piutang                    │ │
│  │ - Categories, etc.                                     │ │
│  │                                                        │ │
│  │ Functions (3 atomic RPC functions)                     │ │
│  │ - create_order(total, method, items)                   │ │
│  │ - void_order(order_id, reason)                         │ │
│  │ - close_shift(shift_id, counted, withdrawal)           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Module Organization

### Core Modules

#### 1. POS (Point of Sale)

- **Entry**: `app/(internal)/pos/`
- **Server Actions**: `app/pos/actions.ts`
- **Components**: Cart UI, payment method selector
- **Logic**: `lib/domain/cart.ts`, `lib/domain/payment.ts`
- **Database RPC**: `create_order()` → atomik insert order + items + stock deduction

#### 2. Inventory

- **Entry**: `app/(internal)/inventory/`
- **Features**:
  - Recipe management (CRUD)
  - Stock tracking
  - Physical inventory (opname)
  - Drag-drop reordering
- **Logic**: `lib/domain/inventory.ts`, `lib/domain/opname.ts`
- **Data**: `lib/data/inventory.ts`, `lib/data/recipes.ts`, `lib/data/products.ts`

#### 3. Finance (Keuangan)

- **Entry**: `app/(internal)/finance/`
- **Features**:
  - Shift management (open/close)
  - Cash reconciliation
  - QRIS tracking
  - Cashflow reporting
  - Piutang (receivables)
- **Logic**: `lib/domain/shift.ts`, `lib/domain/payment.ts`
- **Server Actions**: `app/finance/actions.ts`, `app/finance/keuangan-actions.ts`
- **Database RPC**: `close_shift()` → atomik cash calculation + income entry

#### 4. Dashboard

- **Entry**: `app/(internal)/dashboard/`
- **KPI Metrics**:
  - Today revenue
  - Transaction count
  - Inventory status
  - Shift summary
- **Data**: `lib/data/dashboard.ts` (aggregated queries)

#### 5. Order Management

- **Entry**: `app/(internal)/order/`
- **Features**:
  - Order history
  - Edit tracking
  - Status management
  - Online order integration
- **Components**: `order-client.tsx` (rich table UI)
- **Data**: `lib/data/orders.ts`, `lib/data/online-orders.ts`

#### 6. Settings

- **Entry**: `app/(internal)/settings/`
- **Features**: User preferences, system configuration

### Authentication & Middleware

**Auth Flow**:

```
login/page.tsx
    ↓ (form submit)
login/actions.ts (signIn via Supabase)
    ↓ (redirect)
(internal)/layout.tsx (middleware check)
    ├─ authenticated? → render page
    └─ not auth? → redirect to /login
```

**Session Management**:

- Supabase session stored in cookie (httpOnly)
- Server-side validation with `auth.getUser()`
- Middleware in `app/(internal)/layout.tsx`

## Security Architecture

### 1. Database Level (Supabase RLS)

```sql
-- Example: Users can only see their own shifts
CREATE POLICY "Users can view own shifts" ON shifts
FOR SELECT USING (created_by = auth.uid());

-- Admin-only: Can view all shifts
CREATE POLICY "Admins can view all shifts" ON shifts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'admin')
);
```

### 2. Application Level

**Auth Middleware** (`lib/supabase/middleware.ts`):

- Validates Supabase session
- Refreshes token if needed
- Resets on logout

**Server Actions** (`app/*/actions.ts`):

- Always validate `auth.uid()`
- Check user role/permissions
- Return typed result objects

**RPC Functions** (`supabase/migrations/0010_pos_transactional_rpc.sql`):

```sql
CREATE FUNCTION create_order(...)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi';
  END IF;
  IF NOT public.is_internal_user() THEN
    RAISE EXCEPTION 'Akses ditolak';
  END IF;
  -- ... rest of function
END;
$$;
```

### 3. Transaction Safety

**Atomic Operations** (prevent race conditions):

1. **Stock Deduction** (atomic row-level update):

```sql
UPDATE ingredients
SET stock_qty = stock_qty - (qty_used * order_qty)
WHERE id = ingredient_id;
```

2. **Transaction Locking** (prevent double-void):

```sql
SELECT * FROM orders WHERE id = p_order_id FOR UPDATE;
IF v_order.status = 'voided' THEN
  RAISE EXCEPTION 'Order already voided';
END IF;
```

3. **Atomic RPC Functions**:

- All-or-nothing semantics
- Rollback on any error
- Audit trail via triggers

## Data Flow Examples

### Example 1: Create Order

```
User creates order in POS
    ↓
order-client.tsx (submit cart)
    ↓
app/pos/actions.ts (server action)
    ↓
lib/domain/cart.ts (validate items, calculate total)
    ↓
lib/data/orders.ts (call RPC)
    ↓
create_order() RPC (database)
    ├─ Insert orders table
    ├─ Insert order_items
    ├─ Insert order_item_variants
    ├─ Get active recipe
    ├─ Deduct ingredient stock (atomic)
    └─ Insert stock_movements (audit)
    ↓
Return { ok: true, data: order }
    ↓
UI updates, show receipt
```

### Example 2: Close Shift

```
Cashier counts cash, inputs amount
    ↓
finance/keuangan-manager.tsx (submit form)
    ↓
app/finance/keuangan-actions.ts (server action)
    ↓
lib/domain/shift.ts (validate cash amount)
    ↓
lib/data/cashflow.ts (call RPC)
    ↓
close_shift() RPC (database)
    ├─ Lock shift row (FOR UPDATE)
    ├─ Check if open
    ├─ Calculate cash from orders
    ├─ Calculate QRIS from orders
    ├─ Calculate cash outs
    ├─ Calculate differences
    ├─ Update shift with all amounts
    ├─ Insert cashflow entry (income)
    └─ Return summary JSON
    ↓
Return summary for WhatsApp report
    ↓
lib/wa/getsender.ts (send summary via WhatsApp)
```

## Code Patterns

### 1. Typed Result Pattern

```typescript
// Domain function
export function validateCart(items: CartItem[]):
  | { ok: true as const; data: ValidatedCart }
  | { ok: false as const; error: string } {
  if (!items.length) {
    return { ok: false as const, error: "Keranjang kosong" };
  }
  return { ok: true as const, data: validated };
}

// Server action
export async function submitOrder(formData: FormData) {
  const validated = validateCart(items);
  if (!validated.ok) {
    return { error: validated.error };
  }
  // Process...
}

// Client component
const result = await submitOrder(formData);
if (result.error) {
  toast.error(result.error);
} else {
  navigate("/receipt");
}
```

### 2. Domain-Driven Testing

```typescript
// lib/domain/cart.test.ts
import { calculateTotal, addItem } from "./cart";

describe("Shopping Cart", () => {
  it("calculates total with variants", () => {
    const cart = addItem([], {
      productId: "xyz",
      qty: 2,
      unitPrice: 10000,
      variants: [{ variantId: "v1", priceDelta: 2000 }],
    });

    expect(calculateTotal(cart)).toBe(24000); // (10000 + 2000) * 2
  });
});
```

### 3. Server Action Pattern

```typescript
// app/order/actions.ts
"use server";

export async function createOrder(formData: FormData) {
  const user = await auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await db.createOrder(/* ... */);
    revalidatePath("/orders");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
```

## Testing Strategy

### Test Pyramid

```
        E2E Tests
       (Playwright)

    Integration Tests
  (Server Actions + DB)

    Unit Tests (70% target)
  (Domain functions)
```

### Coverage Targets

- Domain logic (`lib/domain/`): 80%+
- Data layer (`lib/data/`): 60%+ (integration-heavy)
- Components: Manual testing (E2E)
- Server actions: Manual testing (E2E)

### Running Tests

```bash
npm run test              # All tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

## Performance Optimizations

### Frontend

- ✅ Image: Next.js Image component + AVIF/WebP
- ✅ Font: Variable font with specified weights
- ✅ Metadata: Configured in layout.tsx
- ✅ Bundling: SWC minification enabled
- ✅ Headers: Cache-Control for static assets (1 year)

### Database

- ✅ Indexes on foreign keys
- ✅ RLS policies optimized
- ✅ Atomic operations (no N+1)
- ✅ Connection pooling via Supabase

### Build

- ✅ TypeScript incremental compilation
- ✅ Tree-shaking enabled
- ✅ Security headers configured

## Deployment

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
WA_API_KEY=your-whatsapp-key
WA_SENDER=your-sender-id
```

### CI/CD (GitHub Actions - optional)

```yaml
name: Test & Deploy
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Vercel Deployment

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Auto-deploy on push to main

## Future Improvements

- [ ] E2E tests with Playwright
- [ ] GraphQL API layer
- [ ] Multi-tenant support
- [ ] Advanced reporting (scheduled)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Webhook integrations

---

**Last Updated**: June 2026
