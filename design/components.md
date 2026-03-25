# PSG Portal v2 — Key Component Specifications

Design Director: Della | Phoenix Solutions Group
Last updated: 2026-03-25

---

## 1. KPI Card

A compact metric display used on the dashboard home page and reports. Communicates a single number with trend context and optional benchmark.

### Anatomy

```
┌──────────────────────────────────────────┐
│  LABEL        (overline)                 │
│                                          │
│  VALUE                   TREND BADGE     │
│  (large number)          [↑ 12%]         │
│                                          │
│  BENCHMARK                               │
│  Industry avg: 847        (optional)     │
└──────────────────────────────────────────┘
```

### Visual Spec

```
rounded-2xl bg-white border border-iron-100 shadow-sm
padding: p-5 (20px)
min-height: min-h-[120px]
```

**Label:**
- `text-xs font-semibold tracking-caps uppercase text-iron-500`
- Margin: `mb-3`

**Value:**
- Font: Outfit (display font)
- Size: `text-4xl font-bold text-navy-900` for primary KPIs
- Tabular numbers: `font-variant-numeric: tabular-nums` (add to display font stack)
- Suffix (e.g., "★", "%"): `text-2xl font-medium text-navy-600`

**Trend badge:**
- Positive (up): `bg-trust-100 text-trust-700 rounded-full px-2 py-0.5 text-xs font-semibold`
  - Arrow icon: `↑` or chevron-up, 12px
- Negative (down): `bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs font-semibold`
  - Arrow icon: `↓` or chevron-down, 12px
- Neutral (dash): `bg-iron-100 text-iron-600 rounded-full px-2 py-0.5 text-xs font-semibold`
- Positioned: `flex items-start justify-between` on the value row

**Benchmark line:**
- `text-xs text-iron-400 mt-3`
- Only shown when benchmark data is available
- Format: "Industry avg: 847" or "Your best: 1,502"

### Variants

| Variant | When to Use |
|---------|------------|
| Default (white) | Standard dashboard metric |
| Highlighted | Most important metric — `bg-navy-900 text-white`, value in `canvas-50` |
| Minimal | Dense reporting tables — no card border, inline display |

### HTML/JSX Structure

```html
<div class="rounded-2xl bg-white border border-iron-100 shadow-sm p-5 min-h-[120px] flex flex-col">
  <p class="text-xs font-semibold tracking-caps uppercase text-iron-500 mb-3">Page Views This Month</p>
  <div class="flex items-start justify-between">
    <span class="font-display text-4xl font-bold text-navy-900 tabular-nums">1,248</span>
    <span class="bg-trust-100 text-trust-700 rounded-full px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
      ↑ 12%
    </span>
  </div>
  <p class="text-xs text-iron-400 mt-3">Industry avg: 847</p>
</div>
```

---

## 2. Data Table

Used for the Repair Order list and the CSV import review interface. Prioritizes scannability over density.

### Anatomy

```
┌─────────────────────────────────────────────────────────┐
│ TABLE TOOLBAR                                            │
│ [Search......]    [Filter ▼] [Sort ▼]    [Import CSV]    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ ☐  RO #   Customer Name   Date       Status    Actions  │  ← thead
├─────────────────────────────────────────────────────────┤
│ ☐  10041  Sarah K.        Mar 20     Sent      [View]   │  ← tbody tr
│ ☐  10040  Michael T.      Mar 19     Pending   [Send]   │
│ ☐  10039  Robert J.       Mar 18     Done      [View]   │
│    ...                                                   │
├─────────────────────────────────────────────────────────┤
│ Showing 1–25 of 143    [← Prev]  1 2 3 ... 6  [Next →]  │  ← pagination
└─────────────────────────────────────────────────────────┘
```

### Table Container

```css
rounded-2xl bg-white border border-iron-100 shadow-sm overflow-hidden
```

### Toolbar

```
h-14, px-5, flex items-center gap-3, border-b border-iron-100
```

- Search input: `h-9 w-64 rounded-md border border-iron-200 bg-iron-50 px-3 text-sm`
  - Icon: magnifying glass, 16px, `text-iron-400`, left-padded
- Filter/Sort buttons: `h-9 px-3 rounded-md border border-iron-200 bg-white text-sm font-medium text-navy-800 hover:bg-iron-50`
- Action button (Import CSV): `h-9 px-4 rounded-md bg-red-500 text-white text-sm font-semibold hover:bg-red-600`
- Toolbar right-aligned actions: `ml-auto flex gap-2`

### Table Header (`thead`)

```css
bg-navy-50
```

- `th`: `px-4 py-3 text-left text-xs font-semibold tracking-caps uppercase text-navy-700 border-b border-iron-200`
- Checkbox column: `w-10` — `<input type="checkbox">` for bulk select
- Sortable columns: show sort icon on hover (`↕`), active sort shows `↑` or `↓`

### Table Row (`tbody tr`)

```css
/* Default */
bg-white border-b border-iron-50 hover:bg-navy-50 transition-colors duration-100

/* Selected (checkbox checked) */
bg-navy-50

/* Error/flagged row */
bg-red-50 border-l-2 border-l-red-400
```

- `td`: `px-4 py-3 text-sm text-navy-800`
- Row height: `h-12` minimum (48px) — satisfies touch targets on mobile
- First column (RO #): `font-medium text-navy-900`
- Date column: `text-iron-600`

### Status Badges (within rows)

| Status | Classes |
|--------|---------|
| Sent | `bg-clarity-100 text-clarity-700 rounded-full px-2.5 py-0.5 text-xs font-medium` |
| Pending | `bg-ignite-100 text-ignite-700 rounded-full px-2.5 py-0.5 text-xs font-medium` |
| Done | `bg-trust-100 text-trust-700 rounded-full px-2.5 py-0.5 text-xs font-medium` |
| Error | `bg-red-100 text-red-700 rounded-full px-2.5 py-0.5 text-xs font-medium` |

### Pagination

```
border-t border-iron-100 px-5 py-3 flex items-center justify-between
```

- Count text: `text-sm text-iron-500`
- Page buttons: `h-8 w-8 rounded-md text-sm font-medium`
  - Default: `text-navy-700 hover:bg-navy-50`
  - Active: `bg-navy-900 text-white`
  - Ellipsis: `text-iron-400`
- Prev/Next: `h-8 px-3 rounded-md border border-iron-200 text-sm font-medium text-navy-700 hover:bg-iron-50`

### Mobile Behavior

On mobile (`sm` and below), the table collapses to a card stack:
- Each row becomes a `rounded-xl bg-white border border-iron-100 p-4 mb-2` card
- Show: primary field (RO #, Customer Name), status badge, date
- Action button always visible

---

## 3. CSV Import UI

Three-stage interface: Upload, Field Mapping, Validation Review.

### Stage 1 — Drag and Drop Upload

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│         [↑ UPLOAD ICON — 40px, iron-400]                 │
│                                                          │
│         Drop your CSV file here                          │
│         or click to browse                               │
│                                                          │
│         Expected format: RO#, Customer Name,             │
│         Phone, Email, Completion Date                    │
│                                                          │
│         [Download Template]  ← clarity-600 link         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Drop zone:**
```css
rounded-2xl border-2 border-dashed border-iron-300 bg-iron-50
p-10 text-center cursor-pointer
hover:border-navy-400 hover:bg-navy-50
transition-all duration-150
```

**Drag-over state:**
```css
border-navy-500 bg-navy-50 ring-2 ring-navy-500/20
```

**After file selected (pre-upload):**
```
┌──────────────────────────────────────────────────────────┐
│  [📄 FILE ICON]  repair_orders_march.csv    [×]          │
│                  2.4 MB — 143 rows detected               │
│                                                          │
│  [Cancel]                    [Upload and Map Fields →]   │
└──────────────────────────────────────────────────────────┘
```

File preview bar: `rounded-xl bg-white border border-iron-200 px-4 py-3 flex items-center gap-3`

---

### Stage 2 — Field Mapping Interface

After upload, show a mapping UI so users can match CSV columns to PSG fields.

```
┌──────────────────────────────────────────────────────────┐
│  Map your CSV columns                                    │
│  Body sm: Tell us which column contains each piece       │
│  of information.                                         │
│                                                          │
│  PSG Field          Your Column                          │
│  ─────────────────────────────────────────────────────   │
│  Repair Order # *   [RO_Number          ▼]               │
│  Customer Name *    [customer_full_name ▼]               │
│  Phone Number       [phone              ▼]               │
│  Email              [email_address      ▼]               │
│  Completion Date *  [date_complete      ▼]               │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  [Back]                         [Confirm Mapping →]      │
└──────────────────────────────────────────────────────────┘
```

**Mapping row:**
```
flex items-center gap-4 py-3 border-b border-iron-50
```
- PSG field label: `text-sm font-medium text-navy-800 w-40`
- Required asterisk: `text-red-500`
- Select dropdown: `h-9 min-w-[180px] rounded-md border border-iron-200 bg-white text-sm text-navy-800 px-3`
- Smart pre-mapping: system attempts to auto-match columns by name; user confirms

---

### Stage 3 — Validation Error Display

After mapping is confirmed, show any rows with problems before final import.

```
┌──────────────────────────────────────────────────────────┐
│  ⚠ 4 rows have issues                                    │
│  Body sm: Review and fix these rows, or skip them        │
│  and import the remaining 139 records.                   │
├──────────────────────────────────────────────────────────┤
│  Row  RO #    Issue                         Action       │
│  ─────────────────────────────────────────────────────   │
│  12   10029   Missing phone number          [Edit] [Skip]│
│  28   10015   Invalid date format           [Edit] [Skip]│
│  56   10041   Duplicate — already imported  [Skip]       │
│  89   10007   Missing email and phone       [Edit] [Skip]│
├──────────────────────────────────────────────────────────┤
│  [Skip all issues]         [Import 139 valid records →]  │
└──────────────────────────────────────────────────────────┘
```

**Error table styling:**
- Header: `bg-ignite-50 border border-ignite-200 rounded-t-xl px-5 py-3`
- Warning icon: 18px, `text-ignite-600`
- Row: standard data table row styling; error rows use `bg-red-50 border-l-2 border-l-red-400`
- Edit inline: clicking [Edit] opens a mini form within the row to fix the value
- Issue description: `text-sm text-red-700`
- Skip: `text-sm text-iron-500 hover:text-iron-700`

---

## 4. Alert / Notification System

Four alert types. Used for system messages, onboarding recovery, review alerts.

### Inline Alert (within page content)

```
┌──────────────────────────────────────────────────────────┐
│  [ICON]  Alert message goes here.                   [×]  │
│          Optional supporting detail sentence.            │
└──────────────────────────────────────────────────────────┘
```

**Variants:**

| Type | Container | Icon | Text |
|------|-----------|------|------|
| Info | `bg-clarity-50 border border-clarity-200 rounded-xl px-4 py-3` | info circle, `text-clarity-600` | `text-clarity-800` |
| Success | `bg-trust-50 border border-trust-200 rounded-xl px-4 py-3` | check circle, `text-trust-600` | `text-trust-800` |
| Warning | `bg-ignite-50 border border-ignite-200 rounded-xl px-4 py-3` | triangle warning, `text-ignite-600` | `text-ignite-800` |
| Error | `bg-red-50 border border-red-200 rounded-xl px-4 py-3` | x circle, `text-red-600` | `text-red-800` |

**Dismiss button:**
- `text-current opacity-50 hover:opacity-100` × icon, 16px
- Top-right of alert, `absolute` or `ml-auto`

**Alert text structure:**
- Title: `text-sm font-semibold` (optional — use for complex alerts)
- Body: `text-sm leading-relaxed`
- Action link: `text-sm font-medium underline` in the alert's base color

---

### Toast Notification (temporary, overlay)

Toast notifications appear in the top-right corner on desktop, top-center on mobile.

```
┌────────────────────────────────────┐
│  [✓]  Repair orders imported.      │
│       139 records added.      [×]  │
└────────────────────────────────────┘
```

**Container:**
```css
fixed top-4 right-4 z-60
w-80 max-w-[calc(100vw-2rem)]
rounded-xl shadow-xl border
p-4 flex items-start gap-3
```

**Variants (same types as inline alert, but filled):**

| Type | Background | Border | Icon Color | Text |
|------|-----------|--------|-----------|------|
| Success | `bg-trust-500` | none | `text-white` | `text-white` |
| Error | `bg-red-500` | none | `text-white` | `text-white` |
| Warning | `bg-ignite-500` | none | `text-white` | `text-white` |
| Info | `bg-navy-900` | none | `text-white` | `text-white` |

**Animation:**
- Enter: slide in from right + fade in, `duration-200 ease-out`
- Exit: fade out, `duration-150 ease-in`
- Auto-dismiss: 5 seconds by default. Pause on hover. Error toasts: no auto-dismiss.

**Stacking:** Multiple toasts stack vertically with `gap-2`. Maximum 3 visible at once.

---

### Survey Alert (special type — high priority)

Used for the "unreviewed repair orders" recovery flow. More prominent than a standard alert.

```
┌──────────────────────────────────────────────────────────┐
│  [⭐ icon]                                               │
│  H6: 12 customers haven't reviewed you yet.              │
│  Body sm: These repair orders are over 7 days old        │
│  and haven't received a review invitation.               │
│                                                          │
│  [Send Invitations Now]   [Remind Me Tomorrow]           │
│  red-500 CTA              ghost button                   │
└──────────────────────────────────────────────────────────┘
```

**Container:**
```css
rounded-2xl bg-navy-900 text-white p-6 mb-6
```

- Icon: 32px star or notification icon, `text-red-400`
- Heading: `font-display text-lg font-semibold text-white mb-1`
- Body: `text-sm text-canvas-200 mb-4`
- Primary CTA: `h-10 px-5 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-semibold`
- Secondary: `h-10 px-5 rounded-md border border-navy-600 text-canvas-200 hover:bg-navy-800 text-sm font-medium`

---

## Component Checklist

All components above must satisfy:

- [ ] Uses only tokens from `tailwind.config.ts` — no raw hex values
- [ ] Interactive elements have `h-11` minimum height on mobile
- [ ] Focus states use `focus-visible:ring-2 focus-visible:ring-clarity-500/50`
- [ ] Color combinations meet WCAG AA contrast (see `tokens-reference.md`)
- [ ] Loading/disabled states defined for all interactive components
- [ ] Skeleton loading state available for async data components (KPI card, table)
- [ ] Empty states defined for all data-displaying components
