# Rekomendasi KPI Dashboard untuk Analisis Bisnis F&B/POS

## Analisis Data yang Tersedia

Berdasarkan eksplorasi codebase, aplikasi memiliki data berikut:

### 1. **Sales & Revenue Data**

- Orders (completed, void, payment methods: cash/QRIS)
- Order items (product, quantity, subtotal, category)
- Sales per hour, day, product, category
- Payment method breakdown (cash vs QRIS)

### 2. **Financial Data**

- Cashflow entries (income, opex, capex, capital, withdrawal)
- Cashflow categories
- Gross profit (income - opex)

### 3. **Inventory & Stock**

- Ingredients (raw materials & finished goods)
- Stock levels & thresholds
- Stock movements (usage tracking)
- Low stock alerts

### 4. **Operational Data**

- Shift management (opening/closing balance, cash differences)
- Cash drawer movements
- Products & variants
- Categories

### 5. **Accounts & Liabilities**

- Bank/e-wallet/cash accounts
- Recurring expenses (opex: daily/weekly/monthly)
- Receivables & payables (piutang/hutang)
- Installment tracking

---

## Rekomendasi KPI Dashboard (Metrik Utama)

### **Tier 1: KPI Inti (Currently Implemented)**

KPI yang sudah ada saat ini sudah cukup baik untuk overview harian:

1. **Omzet** - Total revenue
2. **Transaksi** - Number of transactions
3. **Rata/Transaksi** - Average transaction value
4. **Item/Transaksi** - Average items per transaction

✅ **Keep these** - sudah relevan dan penting untuk quick snapshot

---

### **Tier 2: KPI Profitabilitas & Efisiensi (Prioritas Tinggi)**

Untuk analisis yang lebih mendalam, tambahkan KPI berikut:

#### **A. Financial Health**

5. **Gross Profit** (Laba Kotor)
   - Formula: `Total Income - Total OpEx`
   - Data source: `cashflow_entries`
   - Insight: Profitabilitas setelah operational expenses
   - Trend comparison: vs periode sebelumnya

6. **Net Profit Margin** (Margin Laba Bersih)
   - Formula: `(Gross Profit / Total Omzet) × 100%`
   - Unit: Percentage
   - Insight: Efisiensi operasional
   - Target benchmark: 15-25% untuk F&B

7. **Cash Flow Status** (Status Kas)
   - Formula: `Total Cash In - Total Cash Out`
   - Include: cash drawer balance + bank accounts
   - Insight: Likuiditas bisnis
   - Alert jika negatif

#### **B. Operational Efficiency**

8. **Labor Cost Ratio** (Rasio Biaya Tenaga Kerja)
   - Formula: `(Total Opex Gaji / Total Omzet) × 100%`
   - Data source: Filter `cashflow_entries` by category "Gaji"
   - Target benchmark: 25-35% untuk F&B
   - Insight: Efisiensi staffing

9. **COGS Ratio** (Cost of Goods Sold)
   - Formula: `(Total Inventory Usage Cost / Total Omzet) × 100%`
   - Data source: `stock_movements` + ingredient costs
   - Target benchmark: 28-35% untuk F&B
   - Insight: Efisiensi pembelian & waste management

10. **Shift Cash Accuracy** (Akurasi Kas Shift)
    - Formula: `Average |cash_difference| per shift`
    - Data source: `shifts` table
    - Lower is better
    - Insight: Operational discipline & theft prevention

#### **C. Customer Behavior**

11. **Payment Mix** (Komposisi Pembayaran)
    - Formula: `Cash % vs QRIS %`
    - Already available in current data
    - Insight: Customer payment preferences
    - Trend: QRIS adoption rate

12. **Order Void Rate** (Tingkat Pembatalan)
    - Formula: `(Void Orders / Total Orders) × 100%`
    - Data source: `orders` table with `status = void`
    - Target: < 5%
    - Insight: Operational errors atau customer dissatisfaction

---

### **Tier 3: KPI Inventory & Supply Chain (Prioritas Medium)**

13. **Stock Turnover Rate** (Perputaran Stok)
    - Formula: `Total Usage / Average Stock Level`
    - Per ingredient, per period
    - Insight: Inventory efficiency

14. **Low Stock Items** (Barang Hampir Habis)
    - Formula: Count items where `stock_qty <= low_stock_threshold`
    - Data source: `ingredients` table
    - Alert mechanism
    - Insight: Supply chain risk

15. **Waste/Shrinkage Rate** (Tingkat Pemborosan)
    - Formula: Track stock movements with reason = "waste" or "expired"
    - Data source: `stock_movements`
    - Target: < 3% of COGS
    - Insight: Inventory management quality

---

### **Tier 4: KPI Hutang Piutang (Prioritas Medium)**

16. **Outstanding Receivables** (Piutang Belum Lunas)
    - Formula: Sum of `piutang` where `status = 'belum'` and `tipe = 'piutang'`
    - Data source: `piutang` table
    - Insight: Cash flow risk

17. **Outstanding Payables** (Hutang Belum Lunas)
    - Formula: Sum of `piutang` where `status = 'belum'` and `tipe = 'hutang'`
    - Insight: Liabilities management

18. **Overdue Items** (Jatuh Tempo Terlewat)
    - Formula: Count items where `jatuh_tempo < today` and `status = 'belum'`
    - Alert mechanism
    - Insight: Credit management

---

## Layout Recommendation

### **Option 1: Expandable Dashboard (Recommended)**

```
┌─────────────────────────────────────────────┐
│  Dashboard                    [Range Filter]│
├─────────────────────────────────────────────┤
│  [Tab: Overview] [Tab: Keuangan] [Tab: Ops]│
├─────────────────────────────────────────────┤
│                                             │
│  TAB: OVERVIEW                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Omzet│ │Trans│ │Rata/│ │Item/│          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                             │
│  TAB: KEUANGAN                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Gross│ │Net  │ │Cash │ │Labor│          │
│  │Profit│Margin│ Flow│ │Cost │          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                             │
│  TAB: OPERASIONAL                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │COGS │ │Void │ │Low  │ │Shift│          │
│  │Ratio│ │Rate │ │Stock│ │Acc  │          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                             │
└─────────────────────────────────────────────┘
```

### **Option 2: Single Page with Sections**

```
┌─────────────────────────────────────────────┐
│  Dashboard                    [Range Filter]│
├─────────────────────────────────────────────┤
│  METRIK PENJUALAN                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Omzet│ │Trans│ │Rata/│ │Item/│          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
├─────────────────────────────────────────────┤
│  METRIK KEUANGAN                            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Gross│ │Net  │ │Cash │ │Labor│          │
│  │Profit│Margin│ Flow│ │Cost │          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
├─────────────────────────────────────────────┤
│  METRIK OPERASIONAL                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │COGS │ │Void │ │Low  │ │Shift│          │
│  │Ratio│ │Rate │ │Stock│ │Acc  │          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
└─────────────────────────────────────────────┘
```

### **Option 3: Prioritized Dashboard (Minimalist)**

Tetap 4 KPI seperti sekarang, tapi ganti dengan yang paling actionable:

```
┌─────────────────────────────────────────────┐
│  Dashboard                    [Range Filter]│
├─────────────────────────────────────────────┤
│  METRIK UTAMA                               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Omzet│ │Gross│ │Net  │ │Cash │          │
│  │     │ │Profit│Margin│ Flow│          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
└─────────────────────────────────────────────┘
```

---

## Implementation Priority

### **Phase 1: Financial KPIs (Most Impactful)**

1. Gross Profit
2. Net Profit Margin
3. Cash Flow Status
4. Labor Cost Ratio

### **Phase 2: Operational KPIs**

1. COGS Ratio
2. Order Void Rate
3. Shift Cash Accuracy
4. Low Stock Items Count

### **Phase 3: Advanced KPIs**

1. Stock Turnover Rate
2. Outstanding Receivables/Payables
3. Waste Rate

---

## Data Requirements

Untuk mengimplementasikan KPI di atas, perlu tambahan:

1. **Ingredient Costs** - Harga beli per ingredient (untuk COGS calculation)
2. **Category Mapping** - Opex categories untuk labor cost filtering
3. **Void Reason Tracking** - Sudah ada field `void_reason` di orders
4. **Waste Tracking** - Stock movement reason = "waste" atau "expired"

---

## Questions for User

Sebelum implementasi, tolong konfirmasi:

1. **Layout Preference**: Option 1 (Tabs), Option 2 (Sections), atau Option 3 (Minimalist)?
2. **Priority KPIs**: Mana 4-8 KPI yang paling penting untuk bisnis Anda?
3. **Data Availability**:
   - Apakah ingredient costs sudah ditrack?
   - Apakah ada category khusus untuk "Gaji" di cashflow?
   - Apakah waste/shrinkage ditrack di stock movements?
4. **Alert Thresholds**: Benchmark apa yang ingin digunakan untuk alert (Net Margin < 15%, Void Rate > 5%, dll)?
5. **Comparison Period**: Tetap pakai period-over-period comparison atau tambah year-over-year?

---

## Technical Notes

- Semua KPI bisa dihitung dari data yang sudah ada
- Beberapa butuh tambahan query ke `cashflow_entries` dan `piutang`
- Consider caching untuk KPI yang compute-intensive
- Implementasi bertahap: Phase 1 dulu untuk validasi business value
