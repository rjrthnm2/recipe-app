# Design System — Recipe App

## Product Context

- **What this is:** A digital recipe box/utility for a home cook and her friends to share and store recipes.
- **Who it's for:** A 77-year-old home cook and her friend group. Emphasizes legibility, ease of use, and massive tap targets.
- **Space/industry:** Personal utility / Recipe management.
- **Project type:** Web app (React/Vite).

## Aesthetic Direction

- **Direction:** Fluid Minimalism.
- **Decoration level:** Minimal in the app, Expressive on the landing page (fluid/flowy background).
- **Mood:** Clean, breathable, highly legible, anchored by deep rich blues, with soft intentional motion. Inspired by her interior design palette.

## Typography

- **Display/Hero:** Outfit — Friendly, soft, exceptionally clean and legible.
- **Body:** Source Sans 3 — Unbeatable for readability at larger sizes, critical for ingredient lists. Base size: 18px.
- **UI/Labels:** DM Sans — Geometric, bold, and immediately identifiable as interactive.
- **Data/Tables:** Source Sans 3 (tabular-nums).
- **Code:** JetBrains Mono (if needed).
- **Loading:** Google Fonts / Fontsource.
- **Scale:** Base 18px (1.125rem). xs: 14px, sm: 16px, base: 18px, lg: 20px, xl: 24px, 2xl: 32px, 3xl: 48px.

## Color

- **Approach:** Restrained + High Contrast.
- **Primary:** Deep Velvet Navy (`#0F172A`) — For primary text and major structural elements (matches the velvet sofas).
- **Secondary:** Soft Gray-White (`#F8FAFC`) — Secondary surfaces.
- **Accent:** Bright Azure (`#2596be`) — Strict use for primary buttons and active states (accent vase color).
- **Neutrals:** Crisp Snow White (`#FFFFFF`) for main background, slate grays for inactive/borders (`#94A3B8`, `#cbd5e1`).
- **Semantic:** success `#16a34a`, warning `#ea580c`, error `#dc2626`, info `#0284c7`.
- **Dark mode:** Not prioritized initially to maintain high contrast white/navy paper feel, but if implemented: deep navy backgrounds with off-white text.

## Spacing

- **Base unit:** 8px.
- **Density:** Spacious / Very loose.
- **Scale:** 2xs(8px) xs(12px) sm(16px) md(24px) lg(32px) xl(48px) 2xl(64px) 3xl(96px).

## Layout

- **Approach:** Grid-disciplined. No hidden hamburger menus.
- **Grid:** 1 column on mobile, max 2 on desktop.
- **Max content width:** 800px (keeps reading line lengths comfortable).
- **Border radius:** sm:4px, md:8px, lg:16px, full:9999px. Soft, inviting corners.

## Motion

- **Approach:** Intentional.
- **Landing Page:** Flowy, slow-moving CSS gradient mesh (water/silk vibe bridging deep navy and blue).
- **App Core:** Minimal-functional. Smooth state transitions, fade-ins, soft button scaling. No disorienting shifts.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out).
- **Duration:** micro(100ms) short(200ms) medium(300ms) long(500ms).

## Decisions Log

| Date       | Decision                      | Rationale                                                                             |
| ---------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| 2026-03-28 | Initial design system created | Created by /design-consultation based on interior design photo & accessibility needs. |
