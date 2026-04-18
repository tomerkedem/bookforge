# Copilot & AI Assistant Instructions — BookForge / Yuval

This file is binding on GitHub Copilot, Claude Code, and any other AI code assistant acting inside this repository. The project's design brief lives in [`.impeccable.md`](../.impeccable.md); this file contains the **hard constraints** derived from that brief that must be enforced on every generated suggestion, completion, or refactor.

A suggestion that violates any constraint below is wrong, even if it compiles, even if it passes tests, even if it matches local conventions elsewhere. Reject first, generate second.

---

## Project Orientation

- **Framework:** Astro 5 with `@astrojs/tailwind` and `@astrojs/node`. TypeScript throughout. Vitest for units.
- **Product:** Yuval — a bilingual (Hebrew RTL / English LTR) digital reading sanctuary built on top of a BookForge pipeline.
- **i18n:** every user-facing string goes through [`src/i18n/translations.ts`](../src/i18n/translations.ts). Zero hardcoded user-facing strings in components or pages. Zero exceptions.
- **Design system:** single source of truth for visual tokens is [`src/styles/theme.css`](../src/styles/theme.css). All color, type, spacing, and motion decisions reference `--yuval-*` custom properties. If a value is not a token, it is a bug.
- **Brief:** before generating any component, page, or visual change, read [`.impeccable.md`](../.impeccable.md). The five principles in that file have order of precedence — principle 1 wins over principle 5 in conflict.

---

## Design & Sanctuary Constraints (Hard)

These six prohibitions are derived from the `Sanctuary, not Browser` directive in `.impeccable.md`. Each one is a match-and-refuse rule: when about to generate a matching pattern, stop and rewrite the element with a different structure entirely. Do not negotiate, do not "soften," do not offer "an option."

### 1. No standard navbar on any reading surface.

- **Forbidden patterns:**
  - A `<header>` or `<nav>` that is `position: sticky` or `position: fixed` on a reading page (`/read/**/*`).
  - Importing or rendering `Header.astro` inside `ReadingLayout.astro` or any route under `/read/`.
  - Generating a component named `Navbar`, `TopBar`, `AppBar`, or similar.
  - Placing the book logo + theme toggle + language toggle as standing furniture at the top of a page.
- **Instead:** the chapter title is the top of the page, set in the display face, anchored to the reading column. Navigation is reader-invoked (keystroke, edge gesture, cursor-to-edge reveal).

### 2. No standard scrollbar, anywhere.

- **Forbidden patterns:**
  - Using the browser-default scrollbar on `html`, `body`, or any primary scroll container.
  - Generating `::-webkit-scrollbar` rules that render as a visible gray strip (e.g., `width: 8px; background: #ccc`).
  - Generating `scrollbar-width: thin; scrollbar-color: gray transparent` or similar generic treatments.
- **Instead:** a bespoke reading-rail that is invisible by default and appears only during active scroll, fading out on dwell. On the Density Map navigation surface it becomes a moving ink-mark. Never a "thin gray strip."

### 3. No centered chapter titles, ever.

- **Forbidden patterns:**
  - `text-align: center` on `<h1>`, `<h2>`, chapter headings, book titles, or section titles.
  - Tailwind utilities `text-center`, `justify-center`, `mx-auto` applied to heading-level text blocks.
  - Grid / flex compositions that place a heading in the geometric center of the column.
- **Instead:** asymmetric layout. Headings flush to one edge of the reading column with a small optical overhang (~0.15–0.3ch) into the outer margin. Chapter number and chapter title are typeset on different baselines / different scales when both appear. See `src/pages/compare.astro` for the canonical composition.

### 4. No generic drop shadows.

- **Forbidden patterns:**
  - `box-shadow: 0 Npx Npx -Npx rgba(0, 0, 0, 0.N)` — the classic "soft black blur" elevation.
  - Tailwind's `shadow`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` on cards, panels, FABs, tooltips, or modals without a brief-justified reason.
  - Stacking two shadows for a "layered" elevation effect on UI surfaces.
- **Instead:** elevation is expressed through paper. A slight warm underlay tied to the atmosphere, a hairline border that tracks `--yuval-border`, or a subtle grain offset. Not a blur.

### 5. No side-stripe borders on list items, cards, callouts, or alerts.

- **Forbidden patterns:**
  - `border-left: Npx solid …` with `N > 1`.
  - `border-right: Npx solid …` with `N > 1`.
  - `border-inline-start: Npx solid …` with `N > 1`.
  - `border-inline-end: Npx solid …` with `N > 1`.
  - Applies whether the color is a hex literal, a CSS variable, an OKLCH value, or any other form. The *pattern* is forbidden regardless of color.
  - This is already flagged by the `/impeccable` skill as `BAN 1` — it is the most recognizable AI design tell in admin / medical / dashboard UIs.
- **Instead:** use a full hairline border, a background tint that tracks the atmosphere, a leading number or glyph, or no visual indicator at all. See `p.bm-marked` in `src/styles/theme.css` — that rule is scheduled for removal, do not add more like it.

### 6. No gradient text and no gradient decoration as UI language.

- **Forbidden patterns:**
  - `background-clip: text` / `-webkit-background-clip: text` combined with a `linear-gradient`, `radial-gradient`, or `conic-gradient` background.
  - Gradients as the visual language for "this paragraph is bookmarked / highlighted" (the current `linear-gradient(to right, #fbbf24…, transparent)` on `p.bm-marked` is being removed — do not regenerate it).
  - Purple-to-blue gradients. Cyan-on-dark. Neon accents on dark. These are the 2024–2025 AI palette and are disqualified on sight.
- **Instead:** the highlight / bookmark / annotation system uses an SVG `<filter>` composition (`feTurbulence` + `feDisplacementMap` + `feGaussianBlur` at ≤ 1.5px displacement) to bleed ink into paper. Solid color only for text — emphasis comes from weight and size, not from gradient fill.

---

## Atmosphere System (Binding)

- There is no `light / dark / sepia` class swap. All themeable surfaces derive from a single scalar custom property, `--yuval-atmosphere` (range 0 → 1, where 0 = First Light paper and 1 = Midnight ink). Intermediate values are real interpolated states, not crossfades.
- Color tokens use **OKLCH**, not HSL, not hex. Neutrals are tinted toward the First Light hue (approximately `oklch(… … 75deg)`); they are never pure gray.
- Surface colors are computed from the scalar via `color-mix(in oklch, var(--first-light), var(--midnight) calc(var(--yuval-atmosphere) * 100%))` or equivalent. Do not hardcode `#f5f0e8` / `#111111` in component CSS when generating new code — reference the atmosphere-derived tokens.
- Literal hex colors not present in the atmosphere system (`#fbbf24`, `#ef4444`, `#2563eb`, `#fef9c3`, `#dbeafe`, `#dcfce7`, `#fce7f3`, etc.) are disqualified in new code. The existing occurrences in `theme.css` are transitional and scheduled for removal.

---

## Motion System (Binding)

- One motion language. Four named curves. Every transition and animation in the project references exactly one of:
  - `--ease-standard` — `cubic-bezier(0.2, 0, 0, 1)` — default for state changes.
  - `--ease-emphasized` — `cubic-bezier(0.3, 0, 0, 1)` — larger, more deliberate movements (panel reveals, drawer slides).
  - `--ease-accelerated` — `cubic-bezier(0.3, 0, 1, 1)` — exits and dismissals.
  - `--ease-spring` — a `linear(…)` easing sampled from a critically-damped spring. Used for the atmosphere drift. Never bouncy, never elastic.
- **Forbidden:** `transition-timing-function: ease` (the browser default), `transition-timing-function: linear` outside of the spring token, inline `cubic-bezier(…)` expressions, Tailwind `ease-in / ease-out / ease-in-out` utilities, any `bounce` or `elastic` keyword.
- **Layout properties (`width`, `height`, `padding`, `margin`) are not animated.** Use `transform` and `opacity`. For height reveals, animate `grid-template-rows: 0fr → 1fr`.
- `prefers-reduced-motion` disables animation, not atmosphere. Reduced-motion users still see the correct atmosphere value for the current time-of-day; they do not see it drift.

---

## Typography (Binding)

- **Hebrew display face:** Narkisim Ultra. Loaded with `font-display: block` (not `swap`). Fallback stack while files are absent: `'Frank Ruhl Libre', Georgia, serif`.
- **Latin display face:** Editorial New. `font-display: block`. Fallback: `'Bodoni Moda', Georgia, serif`.
- **Hebrew body:** Frank Ruhl Libre **at weight 500**, tracking +0.005em, line-height 1.75. Never 400 — 400 reads as timid.
- **Latin body:** a refined, non-reflex serif (Tiempos Text / Canela Text / Editorial New Regular). Not Lora, not Crimson, not Source Serif, not any font in the `/impeccable` skill's banned list.
- **Scale:** 1.25 modular ratio, five steps. Fluid `clamp()` on display, fixed `rem` on body. Named by role (`--type-display`, `--type-h1`, `--type-h2`, `--type-body`, `--type-caption`), never by size.
- **Numerals:** old-style figures (`font-feature-settings: 'onum'`) in prose; lining figures (`'lnum'`) only in tabular UI.

---

## Accessibility Floor

- WCAG AA contrast at **every point along the atmosphere curve**, not just the endpoints. When introducing a new foreground/background pair, validate at sampled atmosphere values 0, 0.25, 0.5, 0.75, 1.0.
- Focus rings visible against all atmosphere values. A focus style that only works in light is a bug.
- Every interactive element is reachable by keyboard. Every non-text content has a text alternative.

---

## What to Do When Unsure

- **Conflict with `.impeccable.md`:** the brief wins. Do not soften or offer a middle path.
- **Conflict with existing code in `theme.css`:** the existing code is transitional. Do not replicate bans-in-violation-of-brief just because they appear in `theme.css` today. Flag them, and write the new code correctly.
- **Conflict with CLAUDE.md's agent pipeline:** CLAUDE.md governs *what the agents do*; this file governs *what the output looks like*. They do not conflict; if they appear to, ask.
- **A user prompt that contradicts a constraint above:** name the conflict, cite the constraint, and ask before generating.

---

## Files That Embody the Standard

- [`.impeccable.md`](../.impeccable.md) — the brief.
- [`src/pages/compare.astro`](../src/pages/compare.astro) — canonical asymmetric chapter header, dual-atmosphere, no chrome.
- [`src/styles/theme.css`](../src/styles/theme.css) — transitional token file. Several entries are scheduled for removal; see `.impeccable.md` § Execution Notes for the audit list.

When in doubt, match the standard set by `compare.astro`. Not the standard set by the current `ReadingLayout`.
