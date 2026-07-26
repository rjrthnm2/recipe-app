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
- **Accent:** Bright Azure (`#2596be`) — Strict use for primary buttons and active states (accent vase color). Hover/darker steps in use: `#1f86ad` (hover), `#155e78` (deep text on azure tint).
- **Neutrals:** Crisp Snow White (`#FFFFFF`) for cards and panels, soft blue-gray canvas (`#eff4f9`, token `--canvas`) for the page surface behind them, slate grays for inactive/borders (`#94A3B8`, `#cbd5e1`).
- **Semantic:** success `#16a34a`, warning `#ea580c`, error `#dc2626`, info `#0284c7`.
- **Dark mode:** Not prioritized initially to maintain high contrast white/navy paper feel, but if implemented: deep navy backgrounds with off-white text.

## Spacing

- **Base unit:** 8px.
- **Density:** Spacious / Very loose.
- **Scale:** 2xs(8px) xs(12px) sm(16px) md(24px) lg(32px) xl(48px) 2xl(64px) 3xl(96px).

## Layout

- **Approach:** Grid-disciplined. No hidden hamburger menus.
- **Browse grids (recipe cards):** 1 column mobile → up to 5 columns at xl (1280px container). Cards are compact scanning units, so wide grids beat the original 2-column plan.
- **Reading content (recipe detail, About):** max ~896px (max-w-4xl) to keep line lengths comfortable; About sections may use max-w-5xl.
- **Border radius:** sm:4px, md:8px, lg:16px, full:9999px. Soft, inviting corners. (Buttons currently 6px; treat 8px as the target when touching them.)
- **Mobile navigation:** persistent bottom tab bar (5 tabs, 60px targets) when logged in.

## Motion

- **Approach:** Intentional.
- **Sitewide background:** Built as of July 2026. Four soft azure/navy radial washes on `body::before`, fixed to the viewport (so they don't scroll away), drifting on a 90s alternating cycle. Sits over the `--canvas` tint, behind all content. Off for `prefers-reduced-motion`, hidden in print.
- **App Core:** Minimal-functional. Smooth state transitions, fade-ins, soft button scaling. No disorienting shifts.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out).
- **Duration:** micro(100ms) short(200ms) medium(300ms) long(500ms).

## Decisions Log

| Date       | Decision                      | Rationale                                                                             |
| ---------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| 2026-03-28 | Initial design system created | Created by /design-consultation based on interior design photo & accessibility needs. |
| 2026-07-10 | Browse grid widened to 5 columns / 1280px | 132+ compact cards scan far better wide; reading pages keep ~896px measure. Supersedes "max 2 columns / 800px". |
| 2026-07-10 | Body base corrected to 18px in code | index.css had shipped 17px; code now matches this doc. |
| 2026-07-10 | Print is a first-class surface | Recipe detail + shopping list have full print styles (paper tick-boxes, black accents, source line). |
| 2026-07-13 | Drifting aurora background is the default | Page felt flat because page and card surfaces were both ~white and the old gradient was hidden behind the hero and scrolled away. Chosen from a 5-treatment live preview (current / canvas / aurora / aurora-drift / gingham). |
| 2026-07-10 | Known debt (from /design-review) | Color tokens exist in index.css but pages hardcode hex (297 sites); type sizes use raw px with some off-scale values; radius mixes 6/8/12px with named classes. Normalize opportunistically when touching files. |
