# Dashboard KPI Implementation - Summary

## Implemented KPIs

Successfully implemented 4 new KPI cards on the dashboard based on the planning session recommendations:

### 1. Net Profit Margin ✅

**Location:** Financial section  
**Calculation:** `(Net Profit / Total Revenue) × 100`  
**Formula:** Net Profit = Gross Profit - CAPEX - Withdrawals  
**Data Source:** `getCashflowSummary()` in `lib/data/cashflow.ts`  
**Display:** Percentage with trend indicator vs previous period

### 2. Cash Accuracy ✅

**Location:** Operational section  
**Calculation:** `(Shifts with zero cash_difference / Total closed shifts) × 100`  
**Data Source:** `getCashAccuracyMetrics()` in `lib/data/shifts.ts`  
**Display:** Percentage showing operational discipline  
**Note:** Uses existing `cash_difference` field from shifts table

### 3. Order Void Rate ✅

**Location:** Operational section  
**Calculation:** `(Voided orders / Total orders) × 100`  
**Data Source:** `getOrderVoidMetrics()` in `lib/data/orders.ts`  
**Display:** Percentage tracking cancellation metrics  
**Note:** Lower is better - indicates order accuracy and customer satisfaction

### 4. Labor Cost Ratio ✅

**Location:** Financial section  
**Calculation:** `(Labor costs / Total revenue) × 100`  
**Data Source:** `getLaborCostMetrics()` in `lib/data/akun.ts`  
**Formula:** Prorates recurring labor costs from `opex` table based on date range  
**Note:** Searches for entries with "gaji" (salary) in the name

## Data Layer Enhancements

### cashflow.ts

- Extended `getCashflowSummary()` to include:
  - `netProfit` calculation
  - `netProfitMargin` percentage
  - Withdrawal tracking for accurate net profit

### shifts.ts

- Added `getCashAccuracyMetrics()` function
- Returns accuracy rate and average cash difference
- Filters closed shifts only within date range

### orders.ts

- Added `getOrderVoidMetrics()` function
- Tracks void rate and completed order counts
- Filters by date range

### akun.ts

- Added `getLaborCostMetrics()` function
- Prorates labor costs based on frequency (daily/weekly/monthly)
- Matches entries containing "gaji" keyword
- Calculates ratio against total revenue

## Dashboard Layout

Updated `app/(internal)/dashboard/page.tsx` with three sections:

1. **Metrik Utama** (Main Metrics)
   - Omzet (Revenue)
   - Transaksi (Transactions)
   - Rata/Transaksi (Avg per Transaction)
   - Item/Transaksi (Items per Transaction)

2. **Keuangan** (Financial)
   - Net Profit Margin 🆕
   - Labor Cost Ratio 🆕

3. **Operasional** (Operational)
   - Cash Accuracy 🆕
   - Order Void Rate 🆕

## Implementation Notes

### ✅ What Works

- All KPIs use parallel data fetching with `Promise.all()` for performance
- Period comparison logic reuses existing `comparePeriod()` function
- Trend indicators (up/down/flat) work consistently
- All KPIs respect the range selector (today/yesterday/week/month)
- Build passes successfully with TypeScript validation

### ⚠️ Limitations Discovered

1. **COGS Ratio - NOT IMPLEMENTED**
   - **Blocker:** `ingredients` table lacks cost tracking fields
   - **Required:** Add `unit_cost` or `purchase_price` column to ingredients table
   - **Impact:** Cannot calculate accurate COGS per product or COGS ratio
   - **Recommendation:** Schema migration needed before implementation

2. **Inventory Turnover - NOT IMPLEMENTED**
   - **Dependency:** Requires COGS data (blocked by above)
   - **Formula:** `COGS / Average Inventory Value`
   - **Status:** Deferred until ingredient costing is available

3. **Labor Cost Accuracy**
   - Current implementation searches for "gaji" keyword in opex names
   - **Recommendation:** Create dedicated labor cost category for more reliable tracking
   - Consider adding `category_type` field or standardized naming convention

4. **Waste/Shrinkage Tracking**
   - Stock movements table has `'waste'` reason available
   - Basic tracking exists but not surfaced as KPI yet
   - Could be added as enhancement once ingredient costs are tracked

## Testing Status

- ✅ TypeScript compilation passes
- ✅ Build succeeds without errors
- ✅ All imports resolve correctly
- ✅ StatCard component integration works
- ⏳ Manual testing with real data pending
- ⏳ Verify trend calculations with actual period comparisons

## Next Steps (Future Enhancements)

### High Priority

1. Add `unit_cost` field to `ingredients` table
2. Implement COGS Ratio KPI once cost data available
3. Test with real production data to validate calculations

### Medium Priority

1. Create dedicated labor cost category in cashflow system
2. Add Inventory Turnover KPI (depends on COGS)
3. Add alert thresholds (e.g., Net Margin < 15% warning)
4. Implement waste/shrinkage KPI once ingredient costs tracked

### Low Priority

1. Add drill-down capabilities for each KPI
2. Export KPI data to reports
3. Historical trending charts for KPIs
4. Customizable KPI thresholds per user

## Schema Changes Required (Future)

```sql
-- Enable COGS tracking
ALTER TABLE public.ingredients
ADD COLUMN unit_cost numeric(14,2) DEFAULT 0;

-- Standardize labor cost tracking
INSERT INTO public.cashflow_categories (name, kind, is_system)
VALUES ('Gaji & Upah', 'opex', false);

-- Enhanced waste tracking (optional)
ALTER TABLE public.stock_movements
DROP CONSTRAINT stock_movements_reason_check;

ALTER TABLE public.stock_movements
ADD CONSTRAINT stock_movements_reason_check
CHECK (reason IN (
  'sale','purchase','adjustment','waste',
  'shrinkage','spoilage','damage','theft','return','qc_reject'
));
```

## Files Modified

- `lib/data/cashflow.ts` - Extended getCashflowSummary with net profit calculations
- `lib/data/shifts.ts` - Added getCashAccuracyMetrics function
- `lib/data/orders.ts` - Added getOrderVoidMetrics function
- `lib/data/akun.ts` - Added getLaborCostMetrics function
- `app/(internal)/dashboard/page.tsx` - Added 4 new KPI cards in 2 new sections
- `vitest.config.ts` - Fixed coverage configuration for build compatibility

## Performance Characteristics

All new KPIs use efficient queries:

- Single table scans with date range filters
- No N+1 query problems
- Parallel execution via Promise.all()
- Minimal memory footprint (aggregation in query results)

**Estimated overhead per dashboard load:** ~50-100ms additional query time
