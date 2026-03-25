/**
 * PSG Portal v2 — Tailwind Design Tokens
 * Design Director: Della / Phoenix Solutions Group
 *
 * Authority Palette:
 *   Foundation Navy   — primary brand, trust, authority
 *   Phoenix Red       — accent, urgency, energy
 *   Iron              — secondary, structural neutrals
 *   Canvas            — background, warmth, space
 *
 * Energy Palettes (context-dependent):
 *   Clarity           — informational, data, links
 *   Trust             — success, confirmation, positive outcomes
 *   Ignite            — CTAs, warnings, high-energy actions
 *
 * Typography:
 *   Display/Headings  — Outfit (Google Fonts)
 *   Body              — Inter (Google Fonts)
 *
 * Grid: 4px base unit (Tailwind default spacing = 0.25rem = 4px)
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────────────────────
      // COLOR SYSTEM
      // ─────────────────────────────────────────────────────────────
      colors: {
        // Authority Palette ─────────────────────────────────────────

        // Foundation Navy — primary brand color
        // Use: headers, primary buttons, nav backgrounds, trust signals
        navy: {
          50: "#EFF3F8",
          100: "#D5E0EC",
          200: "#ADC1DA",
          300: "#85A2C7",
          400: "#5D83B5",
          500: "#3564A2",
          600: "#294F84",
          700: "#1E3A66",
          800: "#132649",
          900: "#0B1F3A", // Foundation Navy — base
          950: "#060F1D",
        },

        // Phoenix Red — accent color
        // Use: CTAs, alerts, brand marks, energy moments
        red: {
          50: "#FDF2F1",
          100: "#FAE0DD",
          200: "#F5BCBA",
          300: "#EE9896",
          400: "#E57472",
          500: "#D4291C", // Phoenix Red — base
          600: "#B52217",
          700: "#8F1B12",
          800: "#6A130D",
          900: "#450C08",
          950: "#220604",
        },

        // Iron — structural neutral
        // Use: borders, secondary text, dividers, inactive states
        iron: {
          50: "#F7F8FA",
          100: "#EAECF0",
          200: "#D3D8E2",
          300: "#BBC3D3",
          400: "#97A2B8",
          500: "#74809C", // Iron — base
          600: "#5A6480",
          700: "#434B60",
          800: "#2D3342",
          900: "#191E2B",
          950: "#0C0F16",
        },

        // Canvas — warm background / breathing room
        // Use: page backgrounds, card surfaces, whitespace areas
        canvas: {
          50: "#FDFCF9",
          100: "#FAF8F3",
          200: "#F4EFE4",
          300: "#EBE3CE",
          400: "#DDD2B4",
          500: "#CBBD95", // Canvas — base
          600: "#B5A273",
          700: "#96834F",
          800: "#756437",
          900: "#554623",
          950: "#362C13",
        },

        // Energy Palettes ────────────────────────────────────────────

        // Clarity — informational, data, links
        // Use: info badges, link text, data highlights, tooltips
        clarity: {
          50: "#EEF7FD",
          100: "#D5EBF9",
          200: "#A8D5F3",
          300: "#7ABFED",
          400: "#4CA9E7",
          500: "#2B8FCC", // Clarity — base
          600: "#2273A8",
          700: "#1A5782",
          800: "#113C5D",
          900: "#092038",
          950: "#04101C",
        },

        // Trust — success, confirmation, positive outcomes
        // Use: success states, verified badges, completion indicators
        trust: {
          50: "#ECFDF2",
          100: "#D1FAE1",
          200: "#A3F4C3",
          300: "#6EEAA0",
          400: "#34D47A",
          500: "#16A34A", // Trust — base
          600: "#12843C",
          700: "#0D632D",
          800: "#08421F",
          900: "#042111",
          950: "#021008",
        },

        // Ignite — CTAs, warnings, high-energy moments
        // Use: primary action buttons (when navy is too passive), warning states
        ignite: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#EA580C", // Ignite — base
          600: "#C2410C",
          700: "#9A3412",
          800: "#7C2D12",
          900: "#431407",
          950: "#220A03",
        },
      },

      // ─────────────────────────────────────────────────────────────
      // TYPOGRAPHY
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        // Outfit — display, headings, hero text
        // Google Fonts: https://fonts.google.com/specimen/Outfit
        // Weights available: 100–900
        display: ["Outfit", "system-ui", "sans-serif"],

        // Inter — body copy, UI labels, data
        // Google Fonts: https://fonts.google.com/specimen/Inter
        // Weights available: 100–900
        sans: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },

      fontSize: {
        // Caption / label tier
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }], // 10px / 14px
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px / 16px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px / 20px

        // Body tier
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px / 24px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px / 28px

        // Heading tier (use Outfit)
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px — H6
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px — H5
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px — H4
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px — H3
        "5xl": ["3rem", { lineHeight: "3.5rem" }], // 48px — H2
        "6xl": ["3.75rem", { lineHeight: "4.25rem" }], // 60px — H1

        // Display tier (hero, marketing)
        "7xl": ["4.5rem", { lineHeight: "5rem" }], // 72px
        "8xl": ["6rem", { lineHeight: "6.5rem" }], // 96px
      },

      fontWeight: {
        thin: "100",
        extralight: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },

      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.025em",
        normal: "0em",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em",
        // PSG brand: all-caps labels use this
        caps: "0.08em",
      },

      // ─────────────────────────────────────────────────────────────
      // SPACING  (4px base unit)
      // Tailwind default (1 = 0.25rem = 4px) is already correct.
      // Extended values below close gaps in the standard scale.
      // ─────────────────────────────────────────────────────────────
      spacing: {
        0: "0",
        px: "1px",
        0.5: "0.125rem", // 2px
        1: "0.25rem", // 4px  ← base unit
        1.5: "0.375rem", // 6px
        2: "0.5rem", // 8px  ← standard increment
        2.5: "0.625rem", // 10px
        3: "0.75rem", // 12px
        3.5: "0.875rem", // 14px
        4: "1rem", // 16px
        5: "1.25rem", // 20px
        6: "1.5rem", // 24px
        7: "1.75rem", // 28px
        8: "2rem", // 32px
        9: "2.25rem", // 36px
        10: "2.5rem", // 40px
        11: "2.75rem", // 44px — minimum touch target
        12: "3rem", // 48px — recommended touch target
        14: "3.5rem", // 56px
        16: "4rem", // 64px
        20: "5rem", // 80px
        24: "6rem", // 96px
        28: "7rem", // 112px
        32: "8rem", // 128px
        36: "9rem", // 144px
        40: "10rem", // 160px
        44: "11rem", // 176px
        48: "12rem", // 192px
        52: "13rem", // 208px
        56: "14rem", // 224px
        60: "15rem", // 240px
        64: "16rem", // 256px
        72: "18rem", // 288px
        80: "20rem", // 320px
        96: "24rem", // 384px
      },

      // ─────────────────────────────────────────────────────────────
      // BORDER RADIUS
      // ─────────────────────────────────────────────────────────────
      borderRadius: {
        none: "0",
        xs: "2px",
        sm: "4px", // subtle rounding, form inputs
        DEFAULT: "6px",
        md: "8px", // standard cards, buttons
        lg: "12px", // larger cards, modals
        xl: "16px", // feature cards, hero elements
        "2xl": "24px", // dashboard cards (premium feel)
        "3xl": "32px", // very prominent containers
        full: "9999px", // pills, badges, avatars
      },

      // ─────────────────────────────────────────────────────────────
      // SHADOWS
      // Understated, directional. Never overly dramatic.
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        none: "none",
        xs: "0 1px 2px 0 rgba(11, 31, 58, 0.05)", // hair-line, inputs
        sm: "0 1px 3px 0 rgba(11, 31, 58, 0.08), 0 1px 2px -1px rgba(11, 31, 58, 0.05)", // subtle card lift
        DEFAULT:
          "0 2px 6px -1px rgba(11, 31, 58, 0.10), 0 2px 4px -2px rgba(11, 31, 58, 0.06)", // standard card
        md: "0 4px 12px -2px rgba(11, 31, 58, 0.12), 0 2px 6px -2px rgba(11, 31, 58, 0.06)", // elevated card
        lg: "0 8px 24px -4px rgba(11, 31, 58, 0.14), 0 4px 10px -3px rgba(11, 31, 58, 0.08)", // modals, drawers
        xl: "0 16px 40px -6px rgba(11, 31, 58, 0.16), 0 8px 16px -4px rgba(11, 31, 58, 0.09)", // popovers, toasts
        "2xl": "0 24px 60px -8px rgba(11, 31, 58, 0.20)", // hero callouts
        inner: "inset 0 2px 4px 0 rgba(11, 31, 58, 0.08)", // inset inputs, wells
        // Phoenix Red glow — use sparingly for primary CTAs
        "red-glow": "0 0 0 3px rgba(212, 41, 28, 0.20)",
        // Navy focus ring
        "navy-focus": "0 0 0 3px rgba(11, 31, 58, 0.20)",
        // Clarity info ring
        "clarity-focus": "0 0 0 3px rgba(43, 143, 204, 0.25)",
      },

      // ─────────────────────────────────────────────────────────────
      // TRANSITIONS / ANIMATION
      // Crisp, purposeful. Never decorative.
      // ─────────────────────────────────────────────────────────────
      transitionDuration: {
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
        700: "700ms",
      },

      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        linear: "linear",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        // PSG: slightly snappier for UI interactions
        snap: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
      },

      // ─────────────────────────────────────────────────────────────
      // SCREENS (responsive breakpoints)
      // Mobile-first. 44px touch targets at all mobile breakpoints.
      // ─────────────────────────────────────────────────────────────
      screens: {
        xs: "375px", // small mobile
        sm: "640px", // large mobile / landscape
        md: "768px", // tablet
        lg: "1024px", // small desktop
        xl: "1280px", // desktop
        "2xl": "1536px", // large desktop
      },

      // ─────────────────────────────────────────────────────────────
      // Z-INDEX
      // ─────────────────────────────────────────────────────────────
      zIndex: {
        auto: "auto",
        0: "0",
        10: "10", // base stacking
        20: "20", // cards, dropdowns
        30: "30", // sticky headers
        40: "40", // drawers, sidebars
        50: "50", // modals
        60: "60", // toasts, notifications
        70: "70", // tooltips
        80: "80", // command palette
        90: "90", // global overlays
      },
    },
  },

  plugins: [],
};

export default config;
