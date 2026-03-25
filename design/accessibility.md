# PSG Portal v2 — WCAG AA Accessibility Baseline

Design Director: Della | Phoenix Solutions Group
Last updated: 2026-03-25
Standard: WCAG 2.1 Level AA

---

## Summary

Every surface of Portal v2 must meet WCAG 2.1 Level AA. The audience is non-technical collision repair shop owners, many of whom may have limited digital proficiency. Accessibility here is not an afterthought. It is core to the product functioning correctly for its audience.

---

## 1. Color Contrast

### Required Ratios

| Context | Minimum Ratio | Standard |
|---------|--------------|---------|
| Normal text (below 18pt / 14pt bold) | 4.5:1 | AA |
| Large text (18pt+ / 14pt+ bold) | 3:1 | AA |
| UI components (borders, icons, controls) | 3:1 | AA |
| Focus indicators | 3:1 (against adjacent color) | AA |

### Verified Color Pairs

All pairs listed pass at their stated minimum. See `tokens-reference.md` for the full table.

**Body text / primary text:**
| Foreground | Background | Ratio | Pass |
|-----------|-----------|-------|------|
| `navy-900` (#0B1F3A) | `canvas-50` (#FDFCF9) | 16.2:1 | AAA |
| `navy-900` | white | 17.1:1 | AAA |
| `iron-500` (#74809C) | white | 4.6:1 | AA |
| `iron-600` (#5A6480) | `iron-50` (#F7F8FA) | 5.8:1 | AA |

**Interactive/accent:**
| Foreground | Background | Ratio | Pass |
|-----------|-----------|-------|------|
| white | `red-500` (#D4291C) | 5.2:1 | AA |
| white | `navy-900` (#0B1F3A) | 17.1:1 | AAA |
| `red-600` (#B52217) | white | 6.8:1 | AA |
| `clarity-600` (#2273A8) | white | 4.6:1 | AA |

**Badge / status text:**
| Foreground | Background | Ratio | Pass |
|-----------|-----------|-------|------|
| `trust-700` | `trust-100` | 7.1:1 | AAA |
| `ignite-700` | `ignite-100` | 6.8:1 | AAA |
| `red-700` | `red-100` | 8.1:1 | AAA |
| `clarity-700` | `clarity-100` | 6.2:1 | AAA |

### Combinations to Avoid

| Foreground | Background | Ratio | Issue |
|-----------|-----------|-------|-------|
| `iron-400` | `canvas-50` | 2.8:1 | Fails — use `iron-600` instead |
| `red-500` | `canvas-200` | 4.2:1 | Marginal — use `red-600` |
| `clarity-500` | `canvas-50` | 3.9:1 | Fails for body text; OK for 18pt+ |
| `iron-300` | white | 2.0:1 | Decorative only — never text |

---

## 2. Focus Management

### Focus Indicator Spec

All interactive elements MUST display a visible focus indicator when focused via keyboard. The outline must contrast at 3:1 against its adjacent background.

**Standard focus ring (on white/canvas backgrounds):**
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-offset-2
focus-visible:ring-clarity-500
```

Computed ring: `0 0 0 2px white, 0 0 0 4px #2B8FCC`
Contrast against white: clarity-500 at 3:1 minimum against canvas-50 background — passes.

**Focus ring on navy backgrounds (sidebar, nav):**
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-offset-2
focus-visible:ring-offset-navy-900
focus-visible:ring-canvas-200
```

Canvas-200 (#F4EFE4) against navy-900 (#0B1F3A): 13.8:1 — AAA.

**Never use:**
- `outline: none` without a replacement visible indicator
- Focus rings that are the same color as the element background
- Focus indicators with less than 3:1 contrast ratio

### Focus Order

Keyboard tab order must follow a logical, predictable sequence:

1. Skip to main content link (visually hidden, shown on focus — see section 6)
2. Navigation items (top-to-bottom in sidebar, left-to-right in bottom nav)
3. Page header actions
4. Main content, left-to-right, top-to-bottom
5. Modal dialogs trap focus within the dialog
6. Drawers trap focus within the drawer

For the onboarding wizard specifically:
- Progress indicator is not a tab stop (decorative)
- Step form fields follow DOM order
- Back and Continue buttons are the last tab stops on each step
- On step transition, focus moves to the step heading (`h1` or `h2`)

---

## 3. Semantic HTML

### Headings

Use a single logical heading hierarchy per page. Do not skip levels.

```
<h1> — Page title (one per page)
  <h2> — Major section
    <h3> — Subsection or card heading
      <h4> — Minor grouping
```

For the dashboard:
- `<h1>` = "Dashboard" (visually rendered in the topbar, or visually hidden if logo takes that role)
- `<h2>` = "Overview", "Quick Actions", "Recent Activity"
- For KPI cards: the metric label is not a heading — use `<p>` with the overline style

### Landmark Regions

```html
<header>  <!-- topbar / nav strip -->
<nav>     <!-- sidebar navigation, bottom nav -->
<main>    <!-- primary content area -->
<aside>   <!-- secondary panels if present -->
<footer>  <!-- page footer if applicable -->
```

Each `<nav>` must have an `aria-label` to distinguish multiple nav regions:
- `aria-label="Main navigation"` on the sidebar
- `aria-label="Mobile navigation"` on the bottom nav

### Interactive Elements

- Buttons must be `<button>` elements, not `<div>` or `<span>`
- Links that navigate must be `<a href="...">` elements
- Never use a `<div>` with an `onClick` as the sole interactive affordance without ARIA
- Custom components (specialty cards as checkboxes, segmented buttons) must use correct ARIA roles

---

## 4. Form Accessibility

### Labels

Every form field must have a visible, associated label:
```html
<!-- Correct -->
<label for="shop-name">Shop Name</label>
<input id="shop-name" type="text" aria-required="true" />

<!-- Never rely on placeholder alone -->
<input type="text" placeholder="Shop Name" />  <!-- Not accessible -->
```

### Required Fields

- Mark visually with a red dot or asterisk
- Mark programmatically: `aria-required="true"` on the input
- Do not use `required` as the only indicator without a legend explaining the convention

### Error Messages

```html
<label for="phone">Phone Number</label>
<input
  id="phone"
  type="tel"
  aria-required="true"
  aria-describedby="phone-error"
  aria-invalid="true"
/>
<p id="phone-error" role="alert" class="text-red-600 text-sm mt-1">
  Please enter a valid phone number.
</p>
```

Rules:
- `aria-describedby` links the field to its error message
- `aria-invalid="true"` set on the input when in error state
- `role="alert"` on the error paragraph ensures screen readers announce it immediately
- Error messages are never color-only (always include text)
- Clear `aria-invalid` and remove `role="alert"` content when the error is resolved

### Autocomplete

For name, phone, email, and address fields in the onboarding wizard, use the `autocomplete` attribute:
```html
<input autocomplete="organization" />   <!-- Shop Name -->
<input autocomplete="tel" />            <!-- Phone -->
<input autocomplete="email" />          <!-- Email -->
<input autocomplete="street-address" /> <!-- Street Address -->
<input autocomplete="address-level2" /> <!-- City -->
<input autocomplete="address-level1" /> <!-- State -->
<input autocomplete="postal-code" />    <!-- ZIP -->
```

---

## 5. Interactive Patterns

### Progress Indicator (Onboarding Wizard)

```html
<nav aria-label="Onboarding progress">
  <ol>
    <li aria-current="step">
      <span class="sr-only">Current step: </span>
      Step 2: Service Area
    </li>
    <li>
      <span class="sr-only">Completed: </span>
      Step 1: Company Profile
    </li>
    <li aria-disabled="true">
      <span class="sr-only">Not started: </span>
      Step 3: Specialties
    </li>
  </ol>
</nav>
```

### Specialty Selection Cards (Custom Checkbox Group)

```html
<fieldset>
  <legend class="sr-only">Select your specialties (at least one required)</legend>
  <div role="group">
    <label class="specialty-card">
      <input type="checkbox" name="specialty" value="collision" class="sr-only" />
      <span>Collision Repair</span>
    </label>
    ...
  </div>
</fieldset>
```

The `<input type="checkbox">` is visually hidden (`sr-only`) but programmatically present. The label wrapper receives visual styling. This is correct: native checkbox semantics are preserved.

### Modal Dialogs

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Import</h2>
  <p id="dialog-description">Import 139 repair orders?</p>
  ...
</div>
```

Rules:
- On open: move focus to the dialog (first focusable element or the dialog heading)
- Focus is trapped within the dialog while it is open
- On close: return focus to the element that triggered the dialog
- `Escape` key closes the dialog

### File Upload Zone

```html
<div
  role="button"
  tabindex="0"
  aria-label="Upload your CSV file. Drag and drop or press Enter to browse."
  onkeydown="if (event.key === 'Enter' || event.key === ' ') triggerFileInput()"
>
  ...
</div>
<input type="file" id="csv-upload" accept=".csv" class="sr-only" aria-label="CSV file input" />
```

### Data Table

```html
<table>
  <caption class="sr-only">Repair orders list, 143 records</caption>
  <thead>
    <tr>
      <th scope="col">
        <input type="checkbox" aria-label="Select all rows" />
      </th>
      <th scope="col" aria-sort="ascending">RO #</th>
      <th scope="col">Customer Name</th>
      ...
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><input type="checkbox" aria-label="Select row 10041" /></td>
      ...
    </tr>
  </tbody>
</table>
```

- `scope="col"` on all column headers
- `aria-sort="ascending|descending|none"` on sortable columns
- Caption is visually hidden but available to screen readers

### Toast Notifications

```html
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="toast-container"
>
  <!-- Toasts injected here by JS -->
</div>
```

- Non-critical toasts: `aria-live="polite"` — announced at the next natural pause
- Error toasts: `aria-live="assertive"` — announced immediately
- Each toast includes the full message as text, not just an icon

---

## 6. Skip Navigation

A "Skip to main content" link must be the first focusable element on every page.

```html
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-90
         focus:h-10 focus:px-4 focus:rounded-md focus:bg-navy-900 focus:text-white
         focus:text-sm focus:font-semibold focus:shadow-lg"
>
  Skip to main content
</a>
```

The main content area must have `id="main-content"` and `tabindex="-1"` (so focus can land on it programmatically without making it a tab stop).

---

## 7. Motion and Animation

Some users have vestibular disorders or cognitive conditions where excessive motion causes problems. Respect the `prefers-reduced-motion` media query.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In Tailwind, use the `motion-safe:` and `motion-reduce:` variants:
```html
<div class="motion-safe:transition-transform motion-safe:duration-200 ...">
```

Affected animations in Portal v2:
- Sidebar drawer slide-in: wrap in `motion-safe:`
- Toast slide-in: wrap in `motion-safe:`
- Onboarding wizard step transitions: wrap in `motion-safe:`
- Celebration illustration on wizard completion: wrap in `motion-safe:`

---

## 8. Testing Requirements

Before any component ships to production:

### Automated
- [ ] Run axe-core (or equivalent) on every page — zero critical or serious violations
- [ ] Check color contrast with a browser extension (e.g., Colour Contrast Analyser) on all text elements

### Manual
- [ ] Tab through the entire onboarding wizard without a mouse
- [ ] Complete the CSV import flow using keyboard only
- [ ] Navigate the dashboard using VoiceOver (macOS) or NVDA (Windows)
- [ ] Verify all form error messages are announced by screen reader
- [ ] Confirm all modals trap focus correctly
- [ ] Verify skip navigation link appears on first Tab keypress
- [ ] Test at 200% browser zoom — no content overflow or loss of functionality

### Devices
- [ ] iOS Safari + VoiceOver on iPhone (primary mobile browser)
- [ ] Android Chrome + TalkBack
- [ ] macOS Safari + VoiceOver
- [ ] Windows Chrome + NVDA

---

## 9. Accessible Interaction Patterns Reference

| Pattern | Implementation |
|---------|---------------|
| Icon-only button | Must have `aria-label`. Example: `<button aria-label="Close dialog">×</button>` |
| Toggle button | Use `aria-pressed="true|false"` |
| Expandable section | Use `aria-expanded="true|false"` on trigger, `aria-controls` pointing to content |
| Loading state | `aria-busy="true"` on the loading container; `aria-live="polite"` region for status |
| Disabled button | Use `disabled` attribute on `<button>` — do not use `aria-disabled` alone |
| Tooltip | Use `role="tooltip"` + `aria-describedby` linking trigger to tooltip |
| Select/Dropdown | Prefer native `<select>` for simple cases; custom dropdowns need full ARIA combobox or listbox pattern |
