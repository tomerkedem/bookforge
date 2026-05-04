# BookForge + Yuval

## What the System Does

**Two connected systems:**

1. **BookForge (pipeline)** - receives a Hebrew book in Word format (`.docx`),
   splits it into chapters, and creates a separate Markdown file for each chapter.
   Each chapter is automatically translated into English.

2. **Yuval (platform)** - a digital knowledge space for AI content only.
   At the current stage, Yuval is not a public upload platform and not a general-purpose library.
   It collects content processed through BookForge and presents it as a structured learning experience:
   - **AI Engineer course summaries** from the course Tomer is studying
   - **Tomer's self-built AI course** with books, labs and guides
   - **Professional AI books** written and edited gradually
   - **Original AI articles** written by Tomer
   - **Practical guides** around AI work and coding tools
   - **Personal progress**: what was completed, what continues, and how much time remains

## Technologies

- Framework: Astro (+ Astro Islands for dynamic parts)
- CSS: Tailwind CSS with full RTL support
- Language: TypeScript
- Pipeline: Python, mainly `python-docx` + custom modules
- Python execution in browser: Pyodide
- Tests: Vitest for unit tests, Playwright for responsiveness
- Breakpoints: sm, md, lg, xl. Always mobile-first.

## Yuval Library Product Constraints

- Yuval is currently a living knowledge library for AI content only.
- All content in Yuval is AI-related. There is currently no non-AI content.
- Only the project owner adds content.
- Content is added only through the existing BookForge code pipeline.
- There is currently no public upload flow.
- There is currently no user-generated upload UI.
- There is currently no upload button behavior.
- There is currently no database-backed CMS.
- There is currently no active payment or paywall behavior.
- Do not present Yuval as a public upload platform.
- Do not write UI copy that implies users can upload books or files.
- Do not use wording such as: upload a book, add your content, upload your files, create your own library.
- Correct framing: Yuval is a living AI knowledge space generated from AI content processed by the BookForge pipeline.

### Current and Planned Yuval Content

- AI Engineer course summaries from the course Tomer is studying: currently 3 out of 16 summaries.
- Tomer's self-built AI course: currently a foundational stage with several active books.
- Active foundational books include:
  - AI Developer Fitness
  - Building AI Systems with MCP
  - Practical Python for AI Engineering
- In addition, 4 books are in final correction and editing stages, and 1 more book is on the way.
- Yuval will also include original AI articles written by Tomer.
- Yuval will also include practical guides, for example:
  - מפקודה למוצר
  - בניית מערכות סוכנים עם Claude Code

## Yuval Library Visual Direction

- The `/library` page is Yuval's main screen for AI content.
- The official visual target is a futuristic galaxy-style dashboard, not a regular content page.
- On desktop, the page should feel like one cinematic viewport-height screen, not a long page with stacked sections.
- Desired desktop structure:
  - clean top app bar
  - functional left sidebar
  - center hero with galaxy stage
  - luminous knowledge core in the center
  - floating tilted content cards around the core
  - narrow right vertical toolbar only
  - bottom recommendation strip integrated into the screen
- On desktop, the right rail must be narrow, in a pill toolbar style, and contain only: AI assistant, bookmarks, history.
- Do not place stats, explanation or continue-reading panels in the right rail on desktop.
- The desktop left sidebar is where continue-learning cards, explanation, stats and recommended content belong.
- Mobile should not copy the desktop orbit layout.
- Desired mobile structure:
  - compact hero
  - continue reading
  - horizontal featured carousel
  - knowledge explanation
  - stats
  - recommendations
  - quick actions
- Every future change to `/library` should move the screen closer to this visual target and not turn it into a generic dashboard.

## Tomer's Main Course - "AI Developer Path"

14 Hebrew books, 3 layers:

**Core Layer (4 books) - foundational engineering capabilities**
1. AI Developer Fitness - engineering training in the age of probabilistic systems
2. Managing Code Agents
3. Python for AI Systems
4. Intuitive Math and Probabilistic Thinking for AI Systems

**Systems Layer (6 books) - building AI components inside software systems**
5. Data Engineering for AI
6. Practical NLP
7. Large Language Models in Practice
8. Building RAG Systems
9. AI Agents
10. MCP Systems Engineering

**Production Layer (4 books) - operating in real production environments**
11. Production AI Systems
12. AI Security and Guardrails
13. Multimodal AI Systems
14. AI Integration and Automation

Each book includes: textbook + GitHub repo + browser labs + final project.

## Project Index

### Yuval - Reading Platform, Current State

```text
src/layouts/
  ReadingLayout.astro         Chapter reading page, central init logic,
                              theme picker, code block wiring
  BaseLayout.astro            Global wrapper

src/utils/
  markdown.ts                 Renderer that generates HTML for code blocks.
                              Three paths:
                              - bash/sh/zsh/powershell/cmd -> BashBlock
                              - python/py -> CodeRunner with Run
                              - everything else -> CodeBlock, view-only
  reading-progress.ts         Progress tracking, exists and will be extended in Phase 3
  language.ts                 i18n utilities - getLanguageDirection, etc.

src/styles/
  bash-block.css              Terminal design - Stripe Navy (#0a2540)
  code-runner.css             IDE design - GitHub Dark + Light
                              via data-code-theme on <html>
  reading-typography.css      WARNING: overrides font-family on all descendants of .reading-content

src/components/
  ReadingControls.astro       Floating FAB: Typography, Focus, Theme
  ReadingProgress.astro       Progress bar
  ChapterNavigation.astro     Navigation between chapters
  ChapterSidebars.astro       TO BE REFACTORED - merge two sidebars
  Header.astro
  ThemeToggle.astro
  LanguageSelector.astro

src/pages/
  index.astro                 TO BE REDESIGNED - Galaxy view
  read/[book]/[chapter].astro Reading page
  books/[slug].astro          Book page
  compare.astro               legacy
  admin.astro                 legacy

src/types/
  index.ts                    Chapter, Book, Language, Course types
```

### BookForge - Pipeline

```text
src/pipeline/
  ingest.py                   Reads Word files, modular, 7 files
  parse.py                    Splits into chapters
  organize.py                 Organizes folders
  build.py                    Astro skeleton + manifest
                              TO BE EXTENDED - calculate word_count + minutes
  translate.py                Hebrew -> English translation
  translate_jobs.py           Translation queue

output/{book-name}/
  chapter-01.he.md            Hebrew chapter
  chapter-01.en.md            English chapter
  assets/                     Images
  book-manifest.json          metadata, will be extended in Phase 2
```

## Code Block Architecture in Yuval

**Important: code block HTML is generated in `markdown.ts` during Markdown parsing,
not in Astro components.** Components under `components/`, if present, are reference code only
and are not used in the actual rendering path.

```text
Markdown (``` with lang)
    ↓
markdown.ts renderer
    ↓
HTML with the right class:
    ├─ .bash-block             bash/sh/zsh/powershell/cmd
    ├─ .coderunner             python, with Run button
    └─ .coderunner.codeblock   yaml/json/js/ts..., no Run
    ↓
CSS from bash-block.css / code-runner.css
    ↓
ReadingLayout.astro attaches event listeners to the DOM
```

## Locked Design Decisions

### Code Blocks

- **Shell blocks**: Stripe Docs aesthetic, Navy #0a2540, cyan prompt
- **Code blocks**: GitHub Dark by default + GitHub Light
- **Theme switcher**: per-block button, global effect on the page,
  stored in localStorage under `code-theme`
- **UI in English** even inside Hebrew books: "Terminal", "Copy", "Run", "Output",
  "Running", "Execution finished (no output)"
- **Theme icons**: sun and moon with real gradient, glow, moon craters
- **No Light mode support for BashBlock** - always navy
- **Strong LTR** for every code block, even inside Hebrew pages
- **Line numbers**: always aligned right, close to the code, like an IDE

### Platform - Yuval Redesign

- **`/library` page = AI Galaxy Dashboard**
  - AI-only knowledge space, not a general library
  - One cinematic desktop screen with left sidebar, central galaxy stage, narrow right toolbar and bottom recommendation strip
  - Floating content cards around a luminous knowledge core
  - Do not present user content uploads
- **Book page**: Hero + chapter timeline + right drawer
- **Reading page**: two types by `book.reading_mode`:
  - `lesson_module`: horizontal tabs (summary/exercises/examples/Q&A)
  - `long_form`: continuous content with sidebar
- **Unified sidebar** replacing the current two sidebars
  - All navigation on one side (RTL: right, LTR: left)
  - Visual vertical timeline
  - Current chapter highlighted with purple background
  - Sections loaded automatically from h2
  - Progress + reading time per chapter

## Known Gotchas - Must Know

### Astro + SVG

- JSX-style comments `{/* */}` are **broken in Astro inside SVG defs**.
  Use HTML comments `<!-- -->`.

### Script Scope

- `const` inside `<script is:inline>` is **global to the page**, not scoped to the file.
  If `ReadingControls.astro` and `ReadingLayout.astro` both declare `STORAGE_KEY`,
  you will get `Identifier already declared`, which disables the whole script.
  **Solution: wrap in an IIFE**: `(function(){...})();`

### CSS Priority Wars

- `reading-typography.css` forces `font-family !important` on all descendants of
  `.reading-content:not(code):not(pre):not(.hljs)`.
  New code block containers such as `.coderunner` and `.bash-block` are **not excluded**,
  so their CSS must use `!important` where needed.

### RTL Inheritance

- Hebrew pages have `direction: rtl` on the body.
  Every code block must set `direction: ltr !important` + `text-align: left !important`
  + `unicode-bidi: isolate` on itself **and all descendants**.
  Line numbers are the exception - they are LTR but `text-align: right`.

### Windows Case Sensitivity

- Windows does not distinguish between `BashBlock.astro` and `Bashblock.astro`,
  but Astro/Vite **does**. Case-only renames require the double rename trick:
  ```powershell
  Rename-Item "Bashblock.astro" "Temp.astro"
  Rename-Item "Temp.astro" "BashBlock.astro"
  ```

### Rendering Pipeline

- **Do not start working on code blocks before understanding this**:
  HTML is generated in `src/utils/markdown.ts` when parsing Markdown, not at Astro runtime.
  Changing `CodeBlock.astro` will not affect what is rendered on the page.
  The file to edit is `src/utils/markdown.ts`.

### i18n - Critical

- All UI text must go through `data-i18n="key"` or `chapter.titles[lang]`
- Direction is determined by `getLanguageDirection(language)`, not hardcoded
- Use CSS Logical Properties:
  `padding-inline-start`, not `padding-left`
  `inset-inline-start`, not `left`
  `border-inline-end`, not `border-right`
- Do not build a separate Hebrew component. The same component must work in both languages

## Choosing Subagents or Agent Teams

Use **Subagents** when tasks are independent:
Explorer, Parser, Content Architect, Organizer, Translator,
UI Designer, Builder.

Use **Agent Teams** when agents need to communicate:
Memory Keeper, Error Handler, Code Reviewer.

## Pipeline Execution Order

When receiving a Word file for processing:

1. **Explorer** -> path -> JSON with book structure
2. **Parser** -> file + JSON -> chapter-XX.he.md
3. **Content Architect** -> MD files -> content-structure.json
4. **Organizer** -> structure.json + MD -> folders under output/
5. **Translator** -> chapter-XX.he.md -> chapter-XX.en.md
6. **UI Designer** -> content-structure.json -> design-system.json
7. **Builder** -> MD + design-system -> Astro components
8. **In parallel**: Memory Keeper + Error Handler + Code Reviewer
9. **Quality Gate** -> approve/reject

## SOLID Principles

- Each agent is responsible for one thing only
- Each agent receives and returns a defined format
- An agent does not know the internal implementation of another agent
- Depend on interfaces, not internal behavior

## Work Rules

- Plan before executing
- Write to `tasks/todo.md` before every task
- After every user-made correction, update `tasks/lessons.md`
- Ask yourself: would a staff engineer approve this?
- Always work on a separate branch
- Mobile-first in every component

## Don'ts - Important

- **Do not delete components under `components/`** without `grep -r "import.*ComponentName"`
- **Do not write em dashes** in Hebrew content (`—` / `–`)
- **Do not invent content** - always stay attached to the source
- **Do not translate UI to Hebrew** even in a Hebrew book
- **Do not touch `output/`** without explicit approval
- **Do not delete files**, only create and update, except `.astro` files that were checked
- **Do not change `design-system.json`** without explicit approval
- **Do not run commands that modify the global environment**
- **Do not merge to main** without explicit approval
- **Do not build a separate component for Hebrew** - i18n is non-negotiable

## Token Saving

- Read `tasks/lessons.md` before every task
- Before every fix, write a problem diagnosis in `tasks/todo.md`
- **Do not try more than one solution** without approval
- If you fail twice, **stop and report** before continuing
- After every successful phase, run `/compact`

## Approval Criteria

Before every completion report, Quality Gate must manually check all criteria in
`docs/acceptance-criteria.md`.
Do not approve without every criterion passing.

## Playwright MCP

Quality Gate uses Playwright for screenshots.
Install if missing: `npx playwright install chromium`

## Git Rules

- Always work on a separate branch, never on main
- Branch name: `feature/{task-name}` or `fix/{issue-name}`
- Commit after every independent completed step
- Commit message: `{type}: {description}` in short English
- Open PR with full description before finishing
- PR description must include: book name, number of chapters, languages
- **Never merge to main without explicit approval**
- If something goes wrong, stop and report before continuing

## New Session Workflow

If this is the beginning of a new session:

1. **Read `SESSION-HANDOFF.md` first** - it contains all decisions and plans
2. **Greet briefly in Hebrew**: "תומר, אני קלוד. קראתי את ה-handoff והבנתי איפה עצרנו"
3. **Wait for instructions**, do not guess. If Tomer says "continue from where we stopped", ask what the next step is

## Writing Rules

- No em dashes in Hebrew content
- Keep a clean structure without inventing content
- Site UI language is English, even in Hebrew books
- For left alignment inside RTL, aggressive CSS with isolate is required
