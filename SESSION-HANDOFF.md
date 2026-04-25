# SESSION HANDOFF — Yuval Platform Redesign

> **For Claude in next session**: Read this document FIRST before doing anything.
> It contains all decisions, mockups, and code plans from previous sessions.
> Status as of: April 25, 2026.

---

## Who is Tomer

- Hebrew tech author, Israel
- Building "AI Developer Path" — 14-book series in Hebrew about AI engineering
- Books are written in Word (.docx) and processed by a Python pipeline (BookForge)
- The pipeline output feeds a reading platform called **Yuval** (Astro/TS)
- Working dir: `D:\2025 Stu\AI Engineer\AllBooks2026\Claude Code - Book\bookforge\`

## Working preferences

- **Language**: Hebrew dialogue, English UI in code blocks
- **No em dashes** (— or –) in Hebrew content
- **Direct critique** ("תכלס") preferred over validation
- **Full files** preferred over search/replace instructions
- **One section at a time** for approval
- Test in DevTools Console (F12 → Console), NOT PowerShell
- Hard refresh (Ctrl+Shift+R) after CSS changes

---

## What was completed in previous sessions

### 1. BashBlock (Stripe Docs aesthetic)
- File: `src/styles/bash-block.css`
- HTML built in: `src/utils/markdown.ts` (NOT in Astro components)
- Stripe Navy `#0a2540`, prompt cyan `#00d4ff`
- LTR-forced even inside RTL pages with `!important` + `unicode-bidi: isolate`
- Languages: bash, sh, zsh, powershell, cmd, bat
- **Always Stripe Navy** — does NOT change with theme picker

### 2. CodeRunner (GitHub themes)
- File: `src/styles/code-runner.css`
- HTML built in: `src/utils/markdown.ts`
- Two themes: GitHub Dark (default) + GitHub Light
- Driven by `[data-code-theme="dark|light"]` on `<html>`
- Saved in `localStorage['code-theme']`
- For Python: includes Run button (Pyodide)
- For yaml/json/js/ts/etc: same look, no Run button (`.coderunner.codeblock`)

### 3. Theme picker per-block
- Sun/moon icons (gradient + glow + craters)
- SVG `<symbol>` defs declared once after `<article>` tag in `ReadingLayout.astro`
- Referenced by `<use href="#cr-sun"/>` and `<use href="#cr-moon"/>`
- Click any theme button → all code blocks on page update simultaneously
- Inline script in `ReadingLayout.astro` sets `data-code-theme` early to prevent icon flash

### 4. ReadingLayout refactor
- Removed 350 lines of old CSS for traffic-light style code blocks
- Merged `initCodeRunners()` and `initCodeBlocks()` into one
- Added `initCodeThemeToggle()` with `querySelectorAll` (handles all theme buttons)
- Wrapped inline script in IIFE to prevent `STORAGE_KEY` collision with ReadingControls.astro
- All UI text in code blocks: English ("Execution finished (no output)", etc.)

### 5. Components deleted (verified unused first)
- `src/components/CodeRenderer.astro`
- `src/components/BashBlock.astro`
- `src/components/CodeRunner.astro`

These were reference-only files. Actual rendering happens in `markdown.ts`.

### 6. Documentation
- `CLAUDE.md` updated with full architecture, gotchas, design decisions
- `CLAUDE.local.md` updated with personal preferences and tech notes

---

## THE BIG PIVOT — From library to learning platform

In this session, Tomer revealed the full vision:

**Yuval is NOT just a book reader. It's a learning platform with:**
- Multiple **courses** (12-16 books per course)
- One main course Tomer is developing himself ("AI Developer Path")
- Standalone books on various topics
- Recommended **tracks** (curated learning paths)

### The course Tomer is writing — "AI Developer Path"

14 books across 3 layers:

**Core Layer (4 books):**
1. AI Developer Fitness — אימון הנדסי בעידן מערכות הסתברותיות
2. Managing Code Agents — עבודה עם סוכני קוד וכלי פיתוח מבוססי AI
3. Python for AI Systems — בסיס פיתוח למערכות AI
4. Intuitive Math and Probabilistic Thinking for AI Systems

**Systems Layer (6 books):**
5. Data Engineering for AI
6. Practical NLP
7. Large Language Models in Practice
8. Building RAG Systems
9. AI Agents
10. MCP Systems Engineering

**Production Layer (4 books):**
11. Production AI Systems
12. AI Security and Guardrails
13. Multimodal AI Systems
14. AI Integration and Automation

Each book contains: textbook + GitHub repo + browser-based labs + final project.

---

## DESIGN DECISIONS — Yuval Visual Redesign

Tomer shared 4 mockup screens that define the new platform:

### Screen 1: Home — "Galaxy of Knowledge"
- **"המרחב שלך לידע אמיתי"** — central concept
- 3-column desktop layout:
  - **Left sidebar**: continuing course, course list, book list
  - **Center**: Galaxy view — central recommended card surrounded by 6-8 cards
  - **Right sidebar**: vertical navigation (Home, Courses, Books, Tracks, Progress, Community, Settings)
- **Rules of the space**:
  - Cards closer to center = more relevant
  - Locked cards appear translucent
  - Each card shows progress %
  - Courses/books/tracks marked with unique icons
- Tech mentioned in mockup: React + TS + Framer Motion + Tailwind + Zustand
- **Decision**: Stick with Astro + Astro Islands for dynamic parts

### Screen 2: Book Detail
- Hero section with book logo, title, subtitle, metadata
- Big progress bar
- 3 buttons: "המשך לימוד" (primary), "סמן כהושלם", "עוד פרטים"
- Timeline of chapters with status icons (✓ ▶ 🔒)
- Right drawer with: סקירה כללית, תוכן הפרקים, סימניות, הערות, הישגים, שאלות ותשובות
- Stats: chapters | hours | progress %
- Tags

### Screen 3a: Lesson Module view (for course-style books)
- Horizontal tabs: סיכום, תרגילים, דוגמאות, הערות, Q&A
- Sub-sections with anchor links
- Right sidebar = chapter TOC

### Screen 3b: Long-form Reading view (for book-style content)
- Continuous content flow
- Right sidebar = "מבנה הספר" — full chapter timeline with sub-sections of current chapter

**Key decision**: Reading mode is per-content-type:
```typescript
type Book = {
  reading_mode: 'long_form' | 'lesson_module'
}
```

---

## CURRENT WORK — Unified ChapterSidebar

### The problem
Tomer noticed: current platform has TWO sidebars (`outline-sidebar-left` + `toc-sidebar-right`).
This creates confusion ("where am I navigating?") and wastes screen space.

### The solution — ONE unified sidebar (right side, RTL)
Combines:
- All chapter list (was right sidebar)
- Sections of current chapter (was left sidebar — populated from h2 by JS)
- Visual timeline (vertical line connecting all)
- Progress indicators
- Reading time

### Mockup approved (after iterations)
Visual structure:
```
┌─────────────────────────────────┐
│ תוכן העניינים    2/7 הושלמו     │
│ [progress bar] 32%              │
│ ⏱ נשארו כ-44 דקות               │
├─────────────────────────────────┤
│  ✓  פרק 1   ...           12 דק' │
│  ✓  פרק 2   ...           15 דק' │
│  ▶  פרק 3   Debugging      18 דק'│  ← Active, expanded
│     [progress bar 45%]            │
│     ✓ 3.1  ...             3 דק' │  ← Completed
│     ● 3.2  ...             4 דק' │  ← Active (with mini-progress)
│     ○ 3.3  ...             3 דק' │
│     ○ 3.4  ...             4 דק' │
│     ○ 3.5  ...             4 דק' │
│  ○  פרק 4   ...           14 דק' │
│  ○  פרק 5   ...           11 דק' │
│  ○  פרק 6   ...            9 דק' │
│  ○  פרק 7   ...           25 דק' │
└─────────────────────────────────┘
```

### Decisions made

| Decision | Value |
|----------|-------|
| Section numbering | Hierarchical (3.1, 3.2, 3.3...) — auto-generated from H2 order |
| Locked chapters | None for now — all available regardless of completion |
| Section discovery | Auto from `<h2>` tags (already works in current code) |
| Completion mark | Auto-detect (scroll to 95%) + manual override via button |
| Reading speed | 180 WPM for Hebrew |
| Word count | Computed in Python pipeline, stored in book-manifest.json |

### THREE PHASES PLANNED

**Phase 1: Merge sidebars + visual timeline** (no progress yet)
- Files: `src/components/ChapterSidebars.astro` (refactor)
- Merge two `<aside>` into one
- Add vertical timeline visual
- Active chapter "pops out" with purple background
- Sections shown only for active chapter, others collapsed
- Maintain i18n (no hardcoded Hebrew)
- Maintain RTL/LTR support via `getLanguageDirection(language)`
- Maintain mobile drawer (don't touch mobile UI)
- Use CSS Logical Properties: `padding-inline-start`, `inset-inline-start`, etc.

**Phase 2: Reading time + word count**
- Files:
  - `src/pipeline/build.py` — add word counting
  - `src/types/index.ts` — extend Chapter type with word_count + estimated_minutes
  - `book-manifest.json` — populate new fields
  - `ChapterSidebars.astro` — display "X דק'" per chapter
- Word count regex: `len(re.findall(r'\S+', text))`
- Skip code blocks in word count
- estimated_minutes = ceil(word_count / 180)

**Phase 3: Progress tracking + auto-complete**
- Files:
  - `src/utils/reading-progress.ts` — extend existing file (1698 bytes)
  - `ReadingLayout.astro` — scroll tracking + auto-complete trigger
  - `ChapterSidebars.astro` — display ✓ + progress bars + manual reset button
- localStorage key: `reading-progress:{book-slug}`
- Auto-complete trigger: scroll to 95% AND time spent ≥ 30 seconds
- Manual reset button: "🔄 בטל" next to ✓
- IntersectionObserver for current section detection during scroll

---

## FILES TO REQUEST FROM USER (next session)

To continue Phase 1 work, Claude needs to see:

1. **`src/components/ChapterSidebars.astro`** (52KB)
   - Already partially seen: i18n setup, mobile drawer, two sidebars structure
   - Still need: full CSS, JavaScript that populates outline from h2 tags

2. **`src/utils/reading-progress.ts`** (1698 bytes)
   - To know what tracking exists already before extending

3. **`output/{any-book}/book-manifest.json`** (16921 bytes example)
   - To know current structure before adding word_count fields

4. **`src/types/index.ts`** (Chapter, Book, Language types)
   - To know shape before extending

---

## WHAT TO DO IN NEXT SESSION

```
1. Read this file completely
2. Read CLAUDE.md and CLAUDE.local.md
3. Greet Tomer in Hebrew, briefly: 
   "תומר, קראתי את ה-handoff. אנחנו על Phase 1 של ה-sidebar המאוחד.
   רוצה שאבקש את הקבצים שאני צריך, או שיש משהו אחר שעלה לראש?"
4. Wait for Tomer's direction. Do NOT assume.
5. If continuing Phase 1: request the 4 files listed above
6. Once received, write the FULL refactored ChapterSidebars.astro
7. Stop after Phase 1 for approval. Do not auto-continue to Phase 2.
```

## CRITICAL REMINDERS

- **i18n is non-negotiable**. Use `getLanguageDirection(language)`, never hardcode Hebrew
- **CSS Logical Properties**: `padding-inline-start` not `padding-left`
- **Mobile drawer untouched**: only desktop sidebar changes in Phase 1
- **Astro View Transitions**: keep `transition:persist="sidebars"`
- **JSX comments break Astro inside SVG**: use `<!-- -->` not `{/* */}`
- **STORAGE_KEY collisions**: wrap inline scripts in IIFE
- **str_replace duplicates**: always grep -c after replace to verify

## DESIGN COLOR PALETTE (from approved mockups)

| Element | Color |
|---------|-------|
| Sidebar background | `rgba(255,255,255,0.03)` |
| Border | `rgba(255,255,255,0.06)` |
| Timeline line | `rgba(255,255,255,0.08)` |
| Completed (green) | `#1f8a4d` |
| Active (purple) | `#7c5cf0` |
| Active glow | `rgba(124, 92, 240, 0.18)` shadow ring |
| Active background | `rgba(124, 92, 240, 0.08)` |
| Active border | `rgba(124, 92, 240, 0.25)` |
| Pending circle | `rgba(255,255,255,0.08)` bg + `rgba(255,255,255,0.2)` border |
| Text primary | `#ffffff` |
| Text secondary | `#c5cad6` |
| Text muted | `#8b95a8` |
| Text dim | `#6b7488` |
| Purple accent text | `#a89cf5` |
| Progress gradient | `linear-gradient(90deg, #1f8a4d, #7c5cf0)` |

These match the dark theme. Light theme equivalents will need to be derived.