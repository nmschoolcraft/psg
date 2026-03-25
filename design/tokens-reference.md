# PSG Portal v2 — Design Token Reference

Design Director: Della | Phoenix Solutions Group
Last updated: 2026-03-25
Framework: Tailwind CSS (`tailwind.config.ts`)

---

## Color System

### Authority Palette

The four foundational colors that define every PSG surface.

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| Foundation Navy 900 | `navy-900` | `#0B1F3A` | Primary brand, nav backgrounds, headings |
| Foundation Navy 800 | `navy-800` | `#132649` | Dark surfaces, secondary nav |
| Foundation Navy 700 | `navy-700` | `#1E3A66` | Active states on dark surfaces |
| Foundation Navy 600 | `navy-600` | `#294F84` | Hover states on dark surfaces |
| Foundation Navy 500 | `navy-500` | `#3564A2` | Links (dark backgrounds) |
| Foundation Navy 100 | `navy-100` | `#D5E0EC` | Tinted backgrounds, table headers |
| Foundation Navy 50 | `navy-50` | `#EFF3F8` | Subtle tints, hover states on white |
| Phoenix Red 500 | `red-500` | `#D4291C` | Primary accent, CTAs, brand mark |
| Phoenix Red 600 | `red-600` | `#B52217` | Hover state for red elements |
| Phoenix Red 400 | `red-400` | `#E57472` | Disabled / light red contexts |
| Phoenix Red 100 | `red-100` | `#FAE0DD` | Error backgrounds, alert surfaces |
| Phoenix Red 50 | `red-50` | `#FDF2F1` | Subtle error tint |
| Iron 500 | `iron-500` | `#74809C` | Secondary text, inactive labels |
| Iron 400 | `iron-400` | `#97A2B8` | Placeholder text, decorative elements |
| Iron 300 | `iron-300` | `#BBC3D3` | Dividers, borders |
| Iron 200 | `iron-200` | `#D3D8E2` | Subtle borders, table lines |
| Iron 100 | `iron-100` | `#EAECF0` | Background tints, disabled inputs |
| Iron 50 | `iron-50` | `#F7F8FA` | Page backgrounds (neutral) |
| Canvas 100 | `canvas-100` | `#FAF8F3` | Warm card backgrounds |
| Canvas 200 | `canvas-200` | `#F4EFE4` | Warm section backgrounds |
| Canvas 50 | `canvas-50` | `#FDFCF9` | Default page background (warm white) |

### Energy Palettes

Deploy strategically. Do not use all three in the same view.

#### Clarity (Informational)
| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| Clarity 500 | `clarity-500` | `#2B8FCC` | Info badge backgrounds, link text, data callouts |
| Clarity 100 | `clarity-100` | `#D5EBF9` | Info alert backgrounds |
| Clarity 50 | `clarity-50` | `#EEF7FD` | Info tint, hover states |

#### Trust (Success / Confirmation)
| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| Trust 500 | `trust-500` | `#16A34A` | Success states, verified badges, completion |
| Trust 100 | `trust-100` | `#D1FAE1` | Success alert backgrounds |
| Trust 50 | `trust-50` | `#ECFDF2` | Success tint |

#### Ignite (Warning / High-Energy CTA)
| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| Ignite 500 | `ignite-500` | `#EA580C` | Warning states, onboarding nudges |
| Ignite 100 | `ignite-100` | `#FFEDD5` | Warning alert backgrounds |
| Ignite 50 | `ignite-50` | `#FFF7ED` | Warning tint |

### Semantic Aliases

Map semantic roles to palette tokens. Reference these in component code.

| Semantic Role | Light Mode Token | Dark Mode Token |
|---------------|-----------------|-----------------|
| `color-bg-default` | `canvas-50` | `navy-900` |
| `color-bg-surface` | `white` | `navy-800` |
| `color-bg-subtle` | `iron-50` | `navy-950` |
| `color-bg-muted` | `iron-100` | `iron-900` |
| `color-text-default` | `navy-900` | `canvas-50` |
| `color-text-muted` | `iron-500` | `iron-400` |
| `color-text-placeholder` | `iron-400` | `iron-500` |
| `color-text-on-dark` | `canvas-50` | `canvas-50` |
| `color-border-default` | `iron-200` | `iron-800` |
| `color-border-strong` | `iron-300` | `iron-700` |
| `color-accent-primary` | `red-500` | `red-400` |
| `color-accent-hover` | `red-600` | `red-500` |
| `color-link` | `clarity-500` | `clarity-300` |
| `color-success` | `trust-500` | `trust-400` |
| `color-warning` | `ignite-500` | `ignite-400` |
| `color-error` | `red-500` | `red-400` |
| `color-info` | `clarity-500` | `clarity-300` |

---

## Typography

### Font Loading (Google Fonts)

Add to `<head>` or global CSS:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Type Scale

| Role | Class | Size | Line Height | Weight | Font |
|------|-------|------|-------------|--------|------|
| H1 Display | `font-display text-6xl font-bold` | 60px | 68px | 700 | Outfit |
| H2 Title | `font-display text-5xl font-semibold` | 48px | 56px | 600 | Outfit |
| H3 Section | `font-display text-4xl font-semibold` | 36px | 40px | 600 | Outfit |
| H4 Card Title | `font-display text-3xl font-medium` | 30px | 36px | 500 | Outfit |
| H5 Label | `font-display text-2xl font-medium` | 24px | 32px | 500 | Outfit |
| H6 Eyebrow | `font-display text-xl font-medium` | 20px | 28px | 500 | Outfit |
| Body Large | `font-body text-lg font-normal` | 18px | 28px | 400 | Inter |
| Body Default | `font-body text-base font-normal` | 16px | 24px | 400 | Inter |
| Body Small | `font-body text-sm font-normal` | 14px | 20px | 400 | Inter |
| Label | `font-body text-sm font-medium` | 14px | 20px | 500 | Inter |
| Caption | `font-body text-xs font-normal` | 12px | 16px | 400 | Inter |
| Overline / Caps | `font-body text-xs font-semibold tracking-caps uppercase` | 12px | 16px | 600 | Inter |

### Typography Rules

- **Headings**: Always Outfit. Never Inter for display text.
- **Body and UI**: Always Inter.
- **Overlines and eyebrow labels**: Inter, uppercase, `tracking-caps` (0.08em).
- **Numbers in KPI cards**: Outfit, `font-bold` or `font-extrabold`, tabular-nums.
- **Legal / footnote**: Inter `text-xs`, `text-iron-500`.

---

## Spacing

Base unit: **4px** (Tailwind `1` = `0.25rem` = `4px`)

| Token | px | rem | Common Use |
|-------|----|-----|------------|
| `space-1` | 4px | 0.25rem | Icon padding, tight labels |
| `space-2` | 8px | 0.5rem | Internal padding (dense) |
| `space-3` | 12px | 0.75rem | Compact button padding |
| `space-4` | 16px | 1rem | Standard component padding |
| `space-5` | 20px | 1.25rem | Medium gap |
| `space-6` | 24px | 1.5rem | Card padding, section spacing |
| `space-8` | 32px | 2rem | Large component gap |
| `space-10` | 40px | 2.5rem | Section padding |
| `space-12` | 48px | 3rem | Touch target minimum |
| `space-16` | 64px | 4rem | Hero sections |
| `space-24` | 96px | 6rem | Page sections |

**Touch Target Rule**: All interactive elements must be at least `h-11` (44px) or `h-12` (48px) tall on mobile.

---

## Border Radius

| Token | px | Tailwind Class | Use |
|-------|----|----------------|-----|
| `rounded-xs` | 2px | `rounded-xs` | Hairline — almost none |
| `rounded-sm` | 4px | `rounded-sm` | Form inputs, chips |
| `rounded` | 6px | `rounded` | Buttons, tags |
| `rounded-md` | 8px | `rounded-md` | Cards, dropdowns |
| `rounded-lg` | 12px | `rounded-lg` | Larger cards, tooltips |
| `rounded-xl` | 16px | `rounded-xl` | Feature sections |
| `rounded-2xl` | 24px | `rounded-2xl` | Dashboard KPI cards |
| `rounded-full` | 9999px | `rounded-full` | Avatars, badges, pills |

---

## Shadows

| Token | Tailwind Class | Use |
|-------|---------------|-----|
| Hairline | `shadow-xs` | Form inputs, subtle lift |
| Card | `shadow-sm` | Standard cards, list items |
| Elevated Card | `shadow` | Interactive cards, hoverable |
| High Elevation | `shadow-md` | Floating elements, popovers |
| Modal | `shadow-lg` | Modals, drawers, sidebars |
| Overlay | `shadow-xl` | Notifications, toasts |
| Focus — Navy | `shadow-navy-focus` | `outline: none` + focus ring on navy elements |
| Focus — Red | `shadow-red-glow` | Primary CTA focus ring |
| Focus — Clarity | `shadow-clarity-focus` | Input focus ring, link focus |

---

## Focus States (WCAG AA)

All interactive elements must display a visible focus indicator with at least 3:1 contrast against adjacent colors.

```css
/* Standard focus ring — apply via Tailwind */
.focus-visible:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(43, 143, 204, 0.5); /* clarity-focus */
}

/* On dark navy backgrounds */
.focus-on-dark:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(250, 248, 243, 0.6); /* canvas-100 ring */
}
```

Tailwind utility: `focus-visible:ring-3 focus-visible:ring-clarity-500/50`

---

## Component Color Assignments

| Component | Background | Border | Text | Accent |
|-----------|-----------|--------|------|--------|
| Primary Button | `red-500` | none | `white` | `red-600` hover |
| Secondary Button | `white` | `iron-200` | `navy-900` | `navy-50` hover bg |
| Ghost Button | transparent | `iron-200` | `navy-900` | `iron-100` hover bg |
| Navigation (sidebar) | `navy-900` | none | `canvas-100` | `red-500` active |
| Table Header | `navy-50` | `iron-200` | `navy-800` | — |
| Table Row | `white` | `iron-100` (bottom) | `navy-900` | `navy-50` hover |
| Input Default | `white` | `iron-300` | `navy-900` | `clarity-500` focus ring |
| Input Error | `red-50` | `red-500` | `navy-900` | — |
| Input Disabled | `iron-50` | `iron-200` | `iron-400` | — |
| Badge — Info | `clarity-100` | none | `clarity-700` | — |
| Badge — Success | `trust-100` | none | `trust-700` | — |
| Badge — Warning | `ignite-100` | none | `ignite-700` | — |
| Badge — Error | `red-100` | none | `red-700` | — |
| KPI Card | `white` | `iron-100` | `navy-900` | — |
| Toast — Success | `trust-500` | none | `white` | — |
| Toast — Error | `red-500` | none | `white` | — |

---

## Z-Index Scale

| Layer | Value | Use |
|-------|-------|-----|
| Base | `z-10` | Cards, dropdowns |
| Sticky | `z-30` | Fixed headers, table headers |
| Drawer | `z-40` | Slide-out sidebars |
| Modal | `z-50` | Dialog overlays |
| Toast | `z-60` | Notifications |
| Tooltip | `z-70` | Hover hints |
| Command | `z-80` | Global search / command palette |

---

## Do and Do Not

| Do | Do Not |
|----|--------|
| Use `canvas-50` as the default page background | Use pure white (`#FFFFFF`) as the primary background |
| Use `navy-900` for primary text | Use `iron-500` for primary body text |
| Use `red-500` for CTAs and brand marks | Use `ignite-500` as a primary CTA without intention |
| Use Outfit for all headings | Mix Outfit and Inter in the same heading |
| Apply 44px minimum touch targets on mobile | Use 32px or smaller touch targets anywhere |
| Use semantic roles in components | Hard-code hex values in component styles |
| Use WCAG-compliant contrast combos below | Use iron-400 text on canvas-50 background (fails 3:1) |

---

## WCAG AA Verified Combinations

| Foreground | Background | Contrast Ratio | Status |
|-----------|-----------|----------------|--------|
| `navy-900` | `canvas-50` | 16.2:1 | AAA |
| `navy-900` | `white` | 17.1:1 | AAA |
| `navy-900` | `iron-50` | 15.8:1 | AAA |
| `canvas-50` | `navy-900` | 16.2:1 | AAA |
| `canvas-100` | `navy-900` | 15.4:1 | AAA |
| `iron-500` | `white` | 4.6:1 | AA |
| `iron-500` | `canvas-50` | 4.5:1 | AA |
| `iron-600` | `iron-50` | 5.8:1 | AA |
| `red-500` | `white` | 5.2:1 | AA |
| `red-600` | `white` | 6.8:1 | AA |
| `clarity-600` | `white` | 4.6:1 | AA |
| `trust-700` | `trust-100` | 7.1:1 | AAA |
| `ignite-700` | `ignite-100` | 6.8:1 | AAA |

**Combinations to avoid:**
- `iron-400` on `canvas-50`: ~2.8:1 (fails)
- `red-500` on `canvas-200`: ~4.2:1 (marginal — use `red-600`)
- `clarity-500` on `canvas-50`: ~3.9:1 (fails for body text, ok for large text)
