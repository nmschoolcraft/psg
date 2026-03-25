# PSG Portal v2 — Onboarding Wizard UX Specification

Design Director: Della | Phoenix Solutions Group
Last updated: 2026-03-25
Audience: Non-technical collision repair shop owners

---

## Overview

The onboarding wizard is the first experience a new shop owner has with the PSG Portal. It must be calm, linear, and confidence-building. The user is often under stress (dealing with a new software system while running a shop). Every step must feel short, achievable, and clearly progressing toward something valuable.

**Mental model for the user:** "Five quick steps and my shop is live."

**Success condition:** User completes all five steps and sees their first LocalReach preview page.

---

## Design Principles for This Flow

1. **One task per screen.** Never ask for two categories of information on the same step.
2. **Progress must be visible at all times.** The step indicator stays fixed at the top.
3. **Errors are immediate, not on submit.** Validate inline, not as a full-page error dump.
4. **Never lose data.** Auto-save draft state on every field blur.
5. **The finish line is always visible.** Show step count. Never say "almost done" — show them.

---

## Global Layout (All Steps)

```
┌─────────────────────────────────────────────────────────┐
│  [PSG Logo — canvas-50 on navy-900 nav strip, 64px tall] │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│         PROGRESS INDICATOR (sticky, full-width)          │
│  ●───────●───────○───────○───────○                       │
│  1       2       3       4       5                        │
│  Profile Service  Special  Brand   Launch                │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   STEP CONTENT (max-w-lg centered, px-6 on mobile)       │
│                                                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  [Back Button — ghost]         [Continue — red-500 CTA]  │
│  (hidden on step 1)            (full-width on mobile)    │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Page background: `canvas-50`
- Nav strip: `navy-900`, height `h-16` (64px)
- Logo: SVG, `canvas-50`, left-aligned with `pl-6`
- Content area: `max-w-lg mx-auto` (512px max), full-width mobile
- Step content vertical padding: `pt-10 pb-24` (space for sticky footer)
- Footer bar: sticky bottom, `bg-white border-t border-iron-200`, `px-6 py-4`

---

## Progress Indicator

**Fixed position, always visible. This is the user's anchor to reality.**

```
  Step 1 done   Step 2 active   Steps 3-5 pending
  ●─────────────●─────────────○─────────────○─────────────○
  Company        Service        Specialties   Brand         Launch
  Profile        Area
```

**Specs:**
- Completed step: `navy-900` filled circle, checkmark icon inside (16px)
- Active step: `red-500` filled circle with white center dot
- Pending step: `iron-300` outlined circle
- Connecting line: `iron-200` (incomplete), `navy-700` (complete)
- Step labels: `text-xs font-medium`, completed = `navy-700`, active = `red-600`, pending = `iron-400`
- Container: `bg-white border-b border-iron-100 py-4 px-6`
- Mobile: show only the active step name + "Step 2 of 5" text. Dots still visible but labels hidden.

---

## Step 1 — Company Profile

**Goal:** Capture the shop's core identity. 30 seconds of typing.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  OVERLINE: STEP 1 OF 5                                   │
│  H3: Tell us about your shop                             │
│  Body: This is what customers will see on your           │
│  LocalReach profile pages.                               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Shop Name *                                      │    │
│  │ [................................................]│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Primary Phone Number *                           │    │
│  │ [(555) 000-0000                                 ]│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Street Address *                                 │    │
│  │ [................................................]│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────┐  ┌──────────┐  ┌────────────┐    │
│  │ City *             │  │ State *  │  │ ZIP *      │    │
│  │ [.................]│  │ [......] │  │ [.........]│    │
│  └────────────────────┘  └──────────┘  └────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Website (optional)                               │    │
│  │ [https://...                                    ]│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Field specs:**
- All inputs: `rounded-md border border-iron-300 bg-white text-navy-900 placeholder:text-iron-400`
- Height: `h-11` (44px) on mobile, `h-10` (40px) desktop
- Focus: `focus-visible:ring-2 focus-visible:ring-clarity-500/50 border-clarity-500`
- Labels: `text-sm font-medium text-navy-800 mb-1`
- Required indicator: red dot `text-red-500` after label, `aria-required="true"` on input
- City/State/ZIP: CSS grid `grid-cols-2 gap-3` on mobile, State is a `<select>` dropdown
- Phone: formatted input with mask `(000) 000-0000`

**Validation:**
- Shop Name: required, min 2 chars, max 80 chars
- Phone: required, valid US format
- Address: required
- City, State, ZIP: required, ZIP must match US format `^\d{5}(-\d{4})?$`
- Website: optional, validate URL format if provided

**Error state (inline):**
```
┌──────────────────────────────────────────────────┐
│ Shop Name *                                      │
│ [                                               ]│  ← border-red-500, bg-red-50
└──────────────────────────────────────────────────┘
  ⚠ Shop name is required.                          ← text-red-600, text-sm, mt-1
```

---

## Step 2 — Service Area

**Goal:** Define where the shop serves. Single-interaction step.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  OVERLINE: STEP 2 OF 5                                   │
│  H3: Where do you serve customers?                       │
│  Body: We'll use this to build your LocalReach           │
│  pages for nearby cities and zip codes.                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Primary Zip Code *                               │    │
│  │ [XXXXX                                          ]│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Service Radius                                          │
│  How far do customers typically travel to reach you?     │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  5 miles │ │ 10 miles │ │ 25 miles │ │ 50 miles │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│              ↑ selected: navy-900 bg, white text          │
│                unselected: white bg, iron-300 border      │
│                                                          │
│  Additional Cities (optional)                            │
│  Body sm: Add specific cities outside your radius.       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ [Type a city name...                            ]│    │
│  │ ┌──────────────────────────────────────────────┐│    │
│  │ │ Detroit, MI                          [×]     ││    │
│  │ │ Dearborn, MI                         [×]     ││    │
│  │ └──────────────────────────────────────────────┘│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Radius selector: segmented button group, 4 options
  - Selected: `bg-navy-900 text-white rounded-md`
  - Unselected: `bg-white border border-iron-300 text-navy-800 rounded-md hover:bg-navy-50`
  - Height: `h-11` mobile, `h-10` desktop
- City tags: `bg-iron-100 text-navy-800 rounded-full px-3 py-1 text-sm`
- Remove button: `text-iron-500 hover:text-red-500`
- City input: autocomplete with city name lookup

---

## Step 3 — Specialties

**Goal:** Let the shop define what they are good at. This drives LocalReach content.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  OVERLINE: STEP 3 OF 5                                   │
│  H3: What does your shop specialize in?                  │
│  Body: Select all that apply. This shapes your           │
│  LocalReach pages and helps match you with customers.    │
│                                                          │
│  ┌──────────────────┐ ┌──────────────────┐              │
│  │ ☐ Collision      │ │ ☐ Paint & Body   │              │
│  │   Repair         │ │   Work           │              │
│  └──────────────────┘ └──────────────────┘              │
│  ┌──────────────────┐ ┌──────────────────┐              │
│  │ ☐ Frame          │ │ ☐ Windshield     │              │
│  │   Straightening  │ │   Replacement    │              │
│  └──────────────────┘ └──────────────────┘              │
│  ┌──────────────────┐ ┌──────────────────┐              │
│  │ ☐ Hail Damage    │ │ ☐ Classic Car    │              │
│  └──────────────────┘ └──────────────────┘              │
│  ┌──────────────────┐ ┌──────────────────┐              │
│  │ ☐ Fleet Repair   │ │ ☐ Detailing      │              │
│  └──────────────────┘ └──────────────────┘              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Other / Custom Specialty (optional)              │    │
│  │ [e.g., Electric Vehicle Certified              ] │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  (!) At least one specialty is required.                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Specialty cards: `rounded-xl border-2 border-iron-200 p-4 cursor-pointer select-none`
  - Unchecked: `bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50`
  - Checked: `bg-navy-900 border-navy-900 text-white`
  - Icon: 24px category icon, top-left of card
  - Label: `text-sm font-medium`
- Grid: `grid-cols-2 gap-3` on all viewports
- Custom input: appears below grid, optional, free text

---

## Step 4 — Logo and Contact

**Goal:** Upload brand assets and confirm contact details for the profile.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  OVERLINE: STEP 4 OF 5                                   │
│  H3: Brand your profile                                  │
│  Body: Your logo and hours appear on every               │
│  LocalReach page we build for you.                       │
│                                                          │
│  Logo Upload                                             │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                  │    │
│  │         ↑ Upload your logo                       │    │
│  │   Drag and drop or click to browse               │    │
│  │   PNG, JPG, or SVG — min 300×150px               │    │
│  │                                                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  [LOGO PREVIEW — shown after upload, 200×100 max]        │
│  [Change Logo] button appears beside preview             │
│                                                          │
│  Business Hours                                          │
│  ─────────────────────────────────────────────────────   │
│  Mon–Fri  [Open ▼]  [7:00 AM ▼]  to  [6:00 PM ▼]       │
│  Saturday [Open ▼]  [8:00 AM ▼]  to  [2:00 PM ▼]       │
│  Sunday   [Closed▼]                                      │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  Email for Customer Inquiries (optional)                 │
│  ┌──────────────────────────────────────────────────┐    │
│  │ [info@yourshop.com                              ]│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Logo upload specs:**
- Drop zone: `rounded-2xl border-2 border-dashed border-iron-300 bg-iron-50`
  - Hover/drag-over: `border-navy-500 bg-navy-50`
  - Height: `h-36` (144px)
- Upload icon: 32px, `text-iron-400`
- Text: `text-sm text-iron-500`
- Post-upload: show `<img>` preview, `max-h-16 max-w-[200px] object-contain`, in a `bg-iron-50 rounded-xl p-4`
- Accepted: PNG, JPG, SVG only. Max 5MB. Min resolution 300×150px.

**Upload failure states:**
- File too large: "This file exceeds 5MB. Please compress the image and try again." (`text-red-600`)
- Wrong format: "Only PNG, JPG, and SVG files are accepted." (`text-red-600`)
- Resolution too low: "Your logo must be at least 300×150px for best results." (`text-ignite-600`)
- Network error: "Upload failed. Check your connection and try again." + Retry button

**Business hours specs:**
- Row per day of week
- Status select: Open / Closed — `rounded-md border border-iron-300 h-10 px-3`
- Time selects: 15-minute intervals, 12-hour format
- When "Closed" selected: time selects are hidden/disabled for that row
- Copy feature: "Apply Mon–Fri hours to Saturday" convenience link

---

## Step 5 — Review and Launch

**Goal:** Final confirmation before creating their LocalReach presence. Build excitement.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  OVERLINE: STEP 5 OF 5                                   │
│  H3: You're almost live.                                 │
│  Body: Review your information below. You can change     │
│  any of this later from your dashboard.                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ [LOGO]   Smith Collision Center         [Edit]   │    │
│  │          (555) 248-9100                          │    │
│  │          1422 Oak Ave, Dearborn, MI 48126        │    │
│  │          Mon–Fri 7am–6pm, Sat 8am–2pm            │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Service Area                            [Edit]   │    │
│  │ 25-mile radius from 48126                        │    │
│  │ + Detroit, Dearborn, Livonia                     │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Specialties                             [Edit]   │    │
│  │ Collision Repair · Paint & Body · Frame          │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  Here's a preview of your first LocalReach page:         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ [MINIATURE PAGE PREVIEW — read-only iframe or    │    │
│  │  screenshot mock of the LocalReach page]         │    │
│  │  "Collision Repair in Dearborn, MI"              │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
└─────────────────────────────────────────────────────────┘
[ Back ]                          [ Launch My Profile → ]
                                  ← red-500, full-width mobile
```

**Review section specs:**
- Cards: `rounded-2xl bg-white border border-iron-100 shadow-sm p-5`
- Edit link: `text-sm text-clarity-600 hover:text-clarity-700 font-medium`
- Edit link navigates user back to the relevant step, preserving all data
- LocalReach preview: framed in `rounded-xl border border-iron-200 overflow-hidden`
- Preview height: `h-48` capped, with "View full page preview" link below

**Launch button:**
- Color: `bg-red-500 hover:bg-red-600 text-white`
- Size: `h-12 px-8 rounded-md text-base font-semibold`
- Loading state: spinner + "Launching your profile..." text, button disabled
- Full-width on mobile: `w-full`

---

## Success State — Launch Complete

After the user clicks "Launch My Profile" and the backend confirms:

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│         [CELEBRATION ILLUSTRATION — SVG]                 │
│         Phoenix mark / confetti burst in navy + red      │
│                                                          │
│  H2: Your profile is live.                               │
│  Body: We're building your LocalReach pages now.         │
│  This typically takes a few minutes.                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Your first page will be live at:                 │    │
│  │ localreach.psghub.me/dearborn-mi                 │    │
│  │ [Copy Link]                                      │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  While you wait, explore your dashboard:                 │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Import your  │ │ View your    │ │ Set up survey│     │
│  │ repair orders│ │ pages        │ │ invitations  │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│              [ Go to My Dashboard → ]                    │
│                 navy-900 button, full-width mobile        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Illustration: custom SVG, 160px tall, centered
- URL box: `bg-navy-50 rounded-xl px-5 py-4`, monospace URL text, copy-to-clipboard button
- Quick action cards: `grid-cols-3 gap-3` desktop, `grid-cols-1 gap-3` mobile
  - Each: `rounded-xl border border-iron-200 bg-white p-4 text-sm font-medium text-navy-900`
- CTA button: `bg-navy-900 hover:bg-navy-800 text-white h-12 px-8 rounded-md`

---

## Mobile Behavior (All Steps)

- Progress indicator: sticky top, simplified (dots only + "Step X of 5" text)
- Content: `px-5 pb-32` (extra bottom padding for sticky footer)
- Footer CTA bar: `fixed bottom-0 left-0 right-0 bg-white border-t border-iron-100 px-5 py-4`
- Continue button: `w-full h-12` on all mobile steps
- Back button: plain text link above content on mobile, not in footer bar
- Minimum touch target: `h-11` (44px) on all interactive elements
- Keyboard: inputs scroll into view on focus (avoid bottom-nav overlap)

---

## Auto-Save Behavior

- Draft state is saved to localStorage on every field `blur` event
- On page reload, draft is restored and user is returned to their last completed step
- Draft indicator: subtle text "Draft saved" in `text-xs text-iron-400` near the step title, fades after 2s
- On successful launch, localStorage draft is cleared

---

## Accessibility Checklist (This Flow)

- [ ] All form fields have associated `<label>` elements (not placeholder-only)
- [ ] Required fields have `aria-required="true"`
- [ ] Error messages use `aria-describedby` pointing to the error text element
- [ ] Error messages use `role="alert"` for screen reader announcement
- [ ] Progress indicator has `aria-label="Step 2 of 5: Service Area"` on the container
- [ ] Specialty cards use `role="checkbox"` and `aria-checked` state
- [ ] Upload zone has `role="button"`, `aria-label="Upload your logo"`, keyboard-activatable
- [ ] Logo preview alt text: `alt="Your uploaded logo preview"`
- [ ] Focus order follows visual reading order (top to bottom, left to right)
- [ ] All color combinations meet WCAG AA (see tokens-reference.md)
- [ ] Launch button shows loading state accessible to screen readers (`aria-busy="true"`)
