# PSG Portal v2 — Dashboard Shell Specification

Design Director: Della | Phoenix Solutions Group
Last updated: 2026-03-25

---

## Layout Architecture

Two breakpoints define the navigation pattern:
- **Desktop** (`lg` and above, 1024px+): Sidebar navigation, fixed left column
- **Mobile** (`md` and below, up to 1023px): Bottom navigation bar

The content area is always scrollable. The navigation is always fixed.

---

## Desktop Layout

```
┌────────────────────────────────────────────────────────────┐
│ SIDEBAR (fixed, w-64, 256px)  │  MAIN CONTENT AREA          │
│ bg-navy-900, h-screen, flex   │  flex-1, bg-canvas-50       │
│                               │  overflow-y-auto            │
│  ┌───────────────────────┐    │                             │
│  │ [PSG LOGO]            │    │  ┌──────────────────────┐   │
│  │ canvas-50, h-16       │    │  │ PAGE HEADER          │   │
│  └───────────────────────┘    │  │ bg-white, border-b   │   │
│                               │  │ border-iron-100      │   │
│  ─ divider: iron-800 ──────   │  │ h-16, sticky top-0   │   │
│                               │  └──────────────────────┘   │
│  [NAV ITEMS — see below]      │                             │
│                               │  [PAGE CONTENT]             │
│  ─ divider: iron-800 ──────   │  p-6 md:p-8                 │
│                               │                             │
│  [ACCOUNT SECTION — bottom]   │                             │
│                               │                             │
└────────────────────────────────────────────────────────────┘
```

**Sidebar specs:**
- Width: `w-64` (256px), fixed
- Background: `bg-navy-900`
- Position: `fixed left-0 top-0 bottom-0 z-40`
- Main content offset: `ml-64`

**Page header (topbar):**
- Height: `h-16` (64px)
- Background: `bg-white border-b border-iron-100`
- Position: `sticky top-0 z-30`
- Left: page title (`font-display text-xl font-semibold text-navy-900`)
- Right: notification bell + user avatar

---

## Sidebar Navigation Items

```
┌──────────────────────────────────┐
│  [PSG Logo SVG]    Phoenix Portal │
│  canvas-50, text-sm font-medium  │
├──────────────────────────────────┤
│                                  │
│  OVERLINE: MAIN                  │  ← text-2xs tracking-caps text-iron-500 px-4 pt-4 pb-1
│                                  │
│  [🏠] Dashboard                  │  ← active state
│  [📊] My Pages                   │
│  [⭐] Reviews                    │
│  [📁] Repair Orders              │
│  [📈] Reports                    │
│                                  │
│  OVERLINE: SETTINGS              │
│                                  │
│  [⚙] Shop Profile                │
│  [🔔] Notifications              │
│  [💳] Billing                    │
│                                  │
├──────────────────────────────────┤
│  ACCOUNT (pinned bottom)         │
│  [●] Smith Collision Center      │  ← avatar initial + shop name
│      John Smith                  │  ← text-xs text-iron-400
│  [→] Sign Out                    │
└──────────────────────────────────┘
```

**Nav item specs:**
- Height: `h-10` (40px), `px-4 rounded-lg mx-2`
- Icon: 18px, `text-iron-400` default, `text-white` active/hover
- Label: `text-sm font-medium text-iron-300` default
- Default: `hover:bg-navy-800 hover:text-white transition-colors duration-150`
- Active: `bg-navy-700 text-white` (solid fill, not just text change)
- Active indicator: left border `border-l-2 border-red-500` inside the item

**Section overlines:**
- `text-2xs tracking-caps font-semibold text-iron-600 px-4 uppercase`
- Vertical padding: `pt-5 pb-1` to create visual grouping

**Account section:**
- Pinned to bottom with `mt-auto`
- Avatar: initials in `rounded-full bg-red-500 text-white text-sm font-semibold w-8 h-8`
- Shop name: `text-sm font-medium text-canvas-100`
- User name: `text-xs text-iron-400`
- Sign out: `text-xs text-iron-500 hover:text-red-400`

---

## Mobile Layout

```
┌─────────────────────────────────────┐
│ TOPBAR (fixed, h-14)                │  bg-white, border-b, z-30
│ [Hamburger]  [Logo]  [Notif] [User] │
├─────────────────────────────────────┤
│                                     │
│  MAIN CONTENT AREA                  │
│  pb-20 (padding for bottom nav)     │
│                                     │
├─────────────────────────────────────┤
│ BOTTOM NAV (fixed, h-16)            │  bg-white, border-t, z-40
│ [Home] [Pages] [Reviews] [Orders]   │  5 items max
│  (icon + label)                     │
└─────────────────────────────────────┘
```

**Bottom nav specs:**
- Height: `h-16` (64px), `safe-area-inset-bottom` aware
- Background: `bg-white border-t border-iron-100`
- Items: `flex-1 flex flex-col items-center justify-center gap-0.5`
- Icon: 22px
  - Default: `text-iron-400`
  - Active: `text-red-500`
- Label: `text-2xs font-medium`
  - Default: `text-iron-500`
  - Active: `text-red-500 font-semibold`
- Active indicator: `bg-red-500 rounded-full h-1 w-5` dot above icon
- Touch target: full cell is tappable, min `h-16`

**Mobile topbar:**
- Height: `h-14` (56px)
- Logo: centered SVG, `h-7`
- Hamburger: 24px icon, left side, `text-navy-900` — opens full-screen nav overlay
- Notifications: bell icon, right side
- The full-screen nav overlay uses the same sidebar content, slides in from left

---

## Dashboard Home Page

```
┌──────────────────────────────────────────────────────────┐
│ PAGE HEADER (sticky)                                      │
│  Good morning, John.                [+ Quick Action ▼]   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ KPI CARDS ROW (4-up on desktop, 2-up on tablet, 1-up mob)│
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐ │
│  │ Page Views │ │ Review Req │ │ Avg Rating │ │ Active │ │
│  │ This Month │ │ Sent       │ │            │ │ Pages  │ │
│  │ 1,248      │ │ 47         │ │ 4.7 ★      │ │ 12     │ │
│  │ ↑ 12%      │ │ ↓ 3%       │ │ ─          │ │ ─      │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────┐ ┌───────────────────────────┐
│ QUICK ACTIONS            │ │ RECENT ACTIVITY FEED       │
│                          │ │                            │
│ [Import Repair Orders]   │ │ • New review from Sarah K. │
│ [Invite for Review]      │ │   "Excellent service..."   │
│ [View My Pages]          │ │   2 hours ago              │
│ [Edit Shop Profile]      │ │                            │
│                          │ │ • 3 new page visits        │
│                          │ │   Dearborn, MI page        │
│                          │ │   Today at 9:14am          │
│                          │ │                            │
│                          │ │ • Review request sent      │
│                          │ │   to Michael T.            │
│                          │ │   Yesterday                │
│                          │ │                            │
│                          │ │ [View all activity →]      │
└──────────────────────────┘ └───────────────────────────┘
```

**Layout grid:**
- Desktop: `grid grid-cols-12 gap-6`
  - Quick Actions: `col-span-4`
  - Activity Feed: `col-span-8`
- Tablet: `grid grid-cols-1 gap-6` (stacked)
- Mobile: `flex flex-col gap-5`

**Section headers:**
- `font-display text-lg font-semibold text-navy-900 mb-4`

**Quick action buttons:**
- Style: `w-full flex items-center gap-3 rounded-xl border border-iron-200 bg-white px-4 py-3`
- Hover: `hover:bg-navy-50 hover:border-navy-200`
- Icon: 20px, `text-navy-600`
- Label: `text-sm font-medium text-navy-800`

**Activity feed item:**
- Container: `bg-white rounded-2xl border border-iron-100 shadow-sm p-5`
- Each item: `flex items-start gap-3 py-3 border-b border-iron-50 last:border-0`
- Icon: 16px colored dot or category icon
- Text: `text-sm text-navy-800`
- Time: `text-xs text-iron-400 mt-0.5`

---

## Empty States

### Empty Dashboard (Newly Onboarded)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            [ILLUSTRATION — neutral, not cartoonish]      │
│            PSG Phoenix mark, muted navy-100 tones        │
│            Height: 120px                                 │
│                                                          │
│            H4: Your dashboard is getting ready.          │
│            Body sm: Your LocalReach pages are being      │
│            built. This usually takes a few minutes.      │
│            Refresh the page to check progress.           │
│                                                          │
│            [Refresh Now]    [Import Repair Orders]       │
│            ghost button     red-500 primary              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Empty: No Repair Orders Imported

```
┌──────────────────────────────────────────────────────────┐
│            [ICON — upload cloud, 48px, iron-300]         │
│                                                          │
│            H4: No repair orders yet                      │
│            Body sm: Import your repair orders to         │
│            start sending review invitations to           │
│            customers.                                    │
│                                                          │
│            [Import Repair Orders →]   ← red-500, h-11   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Empty: No Reviews Yet

```
┌──────────────────────────────────────────────────────────┐
│            [ICON — star outline, 48px, iron-300]         │
│                                                          │
│            H4: No reviews yet                            │
│            Body sm: Import repair orders and send        │
│            your first review invitation to get           │
│            started.                                      │
│                                                          │
│            [Send a Review Invitation →]   ← red-500      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Empty state specs (all):**
- Container: `rounded-2xl bg-white border border-iron-100 px-8 py-12 text-center`
- Max width: `max-w-sm mx-auto`
- Illustration/icon: centered, `mb-5`
- Heading: `font-display text-xl font-semibold text-navy-900 mb-2`
- Body: `text-sm text-iron-500 mb-6 leading-relaxed`
- CTA: `h-11 px-6 rounded-md text-sm font-semibold`
- Never show empty states as errors. Tone is neutral, helpful, forward-looking.

---

## Responsive Sidebar Collapse

On viewport widths `lg` (1024px) and above: sidebar is always visible.

On `md` and below: sidebar is hidden by default. Toggled via hamburger menu:
- Overlay: `fixed inset-0 bg-navy-950/60 z-40 backdrop-blur-sm`
- Drawer: slides in from left, same sidebar content, `w-72`, `z-50`
- Close: tap overlay or X button in top-right of drawer

Transition: `transform translate-x-[-100%]` to `translate-x-0`, `duration-200 ease-out`
