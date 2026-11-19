# Kasirku — Ember Design System Specification
## Referensi: CodeXr UI Dashboard v29 (Ember CRM)

---

## Color Palette

### Primary: Amber / Ember Orange
Terinspirasi dari Ember CRM v29 dengan adaptasi untuk retail POS.

```
--color-primary:        #E8740C   /* Amber 600 — CTA, active nav, badges */
--color-primary-hover:  #C85F08   /* Amber 700 — hover states */
--color-primary-active: #A34C06   /* Amber 800 — pressed states */
--color-primary-light:  #FEF3E2   /* Amber 50  — chip backgrounds, light fills */
--color-primary-muted:  #FCD34D   /* Amber 300 — decorative accents */
```

### Sidebar Dark Background (Ember CRM uses dark sidebar)
```
--color-sidebar-bg:     #1C1917   /* Warm Stone 950 */
--color-sidebar-bg2:    #292524   /* Warm Stone 900 — hover background */
--color-sidebar-text:   #A8A29E   /* Stone 400 — inactive nav text */
--color-sidebar-active: #FFFFFF   /* White — active nav text */
--color-sidebar-border: #292524   /* Stone 900 — separator */
```

### Light Mode Surfaces
```
--color-bg:             #FAFAF9   /* Warm off-white (Stone 50) */
--color-surface:        #FFFFFF   /* Pure white */
--color-surface-raised: #FFFFFF   /* Cards */
--color-border:         #E7E5E4   /* Stone 200 — subtle borders */
--color-border-muted:   #F5F5F4   /* Stone 100 — very subtle borders */
```

### Text
```
--color-text-primary:   #1C1917   /* Stone 950 — headings */
--color-text-secondary: #78716C   /* Stone 500 — body */
--color-text-muted:     #A8A29E   /* Stone 400 — labels, metadata */
--color-text-on-primary: #FFFFFF  /* White on amber */
```

### Semantic Colors
```
--color-success:        #16A34A   /* Green 600 */
--color-success-light:  #DCFCE7   /* Green 100 */
--color-warning:        #D97706   /* Amber 600 */
--color-warning-light:  #FEF3C7   /* Amber 100 */
--color-danger:         #DC2626   /* Red 600 */
--color-danger-light:   #FEE2E2   /* Red 100 */
--color-info:           #2563EB   /* Blue 600 */
--color-info-light:     #DBEAFE   /* Blue 100 */
```

### Dark Mode
```
--color-dark-bg:        #0C0A09   /* Stone 950 */
--color-dark-surface:   #1C1917   /* Stone 900 */
--color-dark-surface2:  #292524   /* Stone 800 */
--color-dark-border:    #44403C   /* Stone 700 */
--color-dark-text:      #F5F5F4   /* Stone 100 */
--color-dark-muted:     #78716C   /* Stone 500 */
```

---

## Typography

Font family: Inter (system fallback: system-ui)

```
/* Page heading */      text-2xl font-bold tracking-tight
/* Section heading */   text-lg font-semibold
/* Card title */        text-sm font-semibold
/* Body */              text-sm font-normal
/* Label / Meta */      text-xs font-medium
/* KPI Number */        text-3xl font-bold tabular-nums
/* Sidebar nav */       text-sm font-medium
```

---

## Layout

### Sidebar
- Width: 256px (w-64) expanded, 72px collapsed (w-18)
- Background: dark warm charcoal (#1C1917)
- Logo area: 64px height with app name + store name
- Nav groups: grouped by section with label
- Active indicator: left 3px amber bar + amber text + slightly lighter bg
- Collapse button at bottom of sidebar
- Mobile: drawer overlay, closes on nav item click

### Topbar
- Height: 64px (h-16) — balanced and aligned seamlessly with the sidebar header
- Background: white with 1px stone border bottom
- Left: breadcrumb or page title
- Right: dark mode toggle, notifications bell, user avatar chip
- Sticky top-0 z-30

### Content Area
- Padding: 24px (p-6) desktop, 16px (p-4) tablet, 12px (p-3) mobile
- Max-width: 1400px mx-auto
- Background: warm off-white (#FAFAF9)

---

## Component Specs

### Cards
- Background: white
- Border: 1px Stone 200 (#E7E5E4)
- Border-radius: 12px (rounded-xl)
- Shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04) (shadow-sm)
- Padding: 20px (p-5) standard

### KPI Cards (Dashboard)
- Larger number: text-3xl font-bold
- Trend indicator: colored badge with arrow
- Icon: 36x36 amber light background circle

### Buttons
- Primary: bg-amber (#E8740C) text-white rounded-lg
- Secondary: border-stone bg-white text-stone-700 rounded-lg
- Ghost: no border, hover bg-stone-100
- Radius: 8px (rounded-lg)
- Height: 36px (py-2 px-4) standard, 32px small

### Badges / Tags
- Radius: 9999px (rounded-full)
- Padding: py-0.5 px-2.5
- Height: auto
- Variants: amber (primary), green (success), red (danger), stone (neutral)

### Tables
- Row hover: bg-stone-50
- Row height: 48px (py-3)
- Header: text-xs uppercase tracking-wider text-stone-500 bg-stone-50
- Border: divide-y divide-stone-100

### Inputs
- Border: Stone 200
- Radius: 8px (rounded-lg)
- Focus: ring-2 ring-amber-500/20 border-amber
- Height: 36px (py-2 h-9)
- Background: white

### Modals
- Backdrop: black/50
- Panel radius: 16px (rounded-2xl)
- Shadow: shadow-2xl
- Animation: scale 0.95 → 1.0 + fade, spring

### Sidebar Nav Items
- Inactive: text-stone-400, hover bg-stone-800
- Active: text-white, bg-stone-800, left amber 3px border indicator
- Icon size: 18px
- Padding: py-2.5 px-3
- Border-radius for item: 8px (but amber left border overrides left radius)

---

## Motion / Animation System

Using `motion` package (Motion for React).

### Animation Variants (shared)

```ts
// Page transition
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } }
}

// Card entrance
const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 }
}

// Modal
const modalVariants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 28 } },
  exit: { opacity: 0, scale: 0.96 }
}

// Drawer (slide from right)
const drawerVariants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '100%', transition: { type: 'spring', stiffness: 400, damping: 35 } }
}

// Sidebar active indicator
// Use layoutId="activeIndicator" for smooth shared transition
```

### Rules
- Max animation duration: 300ms
- No bouncing (damping 28+)
- prefers-reduced-motion: skip all animations
- Chart animate on mount only
- Numbers: no animated counting (keep it snappy)

---

## Dashboard Layout Composition (v29 Adaptation)

```
┌─────────────────────────────────────────────────────────────┐
│ Welcome + Store name + Date                        [+ POS]  │
├──────────────────────┬──────────────────────────────────────┤
│  Sales Target        │  Revenue Trend Chart (7 hari)        │
│  (Progress ring      │  (Area chart, recharts)              │
│  + amount + %)       │                                      │
├──────┬───────┬───────┴──────────────────────────────────────┤
│ KPI  │ KPI   │ KPI           │ KPI                          │
│ Omzet│ Laba  │ Transaksi     │ Stok Menipis                 │
├──────┴───────┴───────────────┴──────────────────────────────┤
│  Transaksi Terbaru (table)   │  Top Produk (list + bar)     │
├──────────────────────────────┴──────────────────────────────┤
│  Performa Kasir (table)      │  Aktivitas Stok              │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Endpoints Needed (New)

```
GET /api/owner/dashboard-stats (existing — enhance to add:)
  + top_products: [{ name, total_qty, total_revenue }] (top 5)
  + employee_performance: [{ name, sales_count, total_amount }]
  + weekly_revenue: [{ date, amount }] (last 7 days)
  + monthly_target: { target, achieved, percentage }
```

---

## File Structure (New Files to Create)

```
frontend/src/
├── contexts/
│   └── ThemeContext.tsx          (dark/light mode)
├── components/
│   ├── ui/                       (reusable primitives)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── Table.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingState.tsx
│   │   └── PageHeader.tsx
│   └── dashboard/
│       ├── KpiCard.tsx
│       ├── SalesTargetCard.tsx
│       ├── RevenueChart.tsx
│       ├── TopProductsCard.tsx
│       ├── RecentTransactions.tsx
│       └── EmployeeLeaderboard.tsx
├── layouts/
│   ├── Sidebar.tsx               (shared between owner/employee)
│   ├── Topbar.tsx
│   ├── OwnerLayout.tsx           (refactored)
│   └── EmployeeLayout.tsx        (refactored)
└── hooks/
    └── useTheme.ts
```
