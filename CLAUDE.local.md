# CLAUDE.local.md

## Local Environment

- Python: `C:\Python312`
- Node: `C:\Program Files\nodejs`
- Default shell: PowerShell, not bash or cmd
- Current processing file: `D:\Books\AI_Developer_Fitness.docx`
- Test books:
  - `D:\Books\Practical Python for AI Engineering.docx` (18 chapters, portrait cover)
  - `D:\Books\Lesson 1- Introduction to AI Engineering and Generative AI.docx`
    (29 chapters, landscape cover, with SDT cover page)

## Current Project

`D:\2025 Stu\AI Engineer\AllBooks2026\Claude Code - Book\bookforge\`

## Personal Preferences

- **Conversation language with Tomer**: Hebrew
- **Site UI language**: English, even inside Hebrew books, unless a specific feature explicitly uses i18n
- **Progress updates**: Hebrew
- **Before any destructive action**: ask Tomer first
- **After Tomer stops the dev server with `Ctrl+C`**: Tomer will run `npm run dev` again himself
- **Direct feedback**: Tomer prefers practical, honest critique. If something is not good, say so directly
- **No em dashes** (`—` / `–`) in Hebrew content

## How to Work With Tomer

### What Works Well

- Provide a full updated file when the change is large or risky
- For large refactors, show the full planned change before executing
- Do not give up quickly. If something fails, diagnose using DevTools
- Work one approved step at a time. Do not send five unrelated changes at once
- Preserve existing code and reuse the current infrastructure. Do not generate a new architecture unless explicitly requested

### What Does Not Work Well

- Instructions like "find X and replace with Y" in a 1500-line file. One small mistake can waste a lot of time
- Duplicate code after `str_replace`. Always check after changes, for example:
  `grep -c "function foo"`
- Inventing content that was not requested. If uncertain, ask

### How to Validate Work

After each change:

1. Tomer will refresh the browser with `Ctrl+Shift+R`
2. Open Console (F12 -> Console), not the Elements tab
3. If there are red errors, ask Tomer to send a screenshot
4. If it is a CSS issue, inspect the relevant element and check the Styles panel

## Useful PowerShell Queries

```powershell
# Search text across the project
Get-ChildItem -Path "..." -Recurse -Include "*.astro","*.ts","*.css" |
  ForEach-Object { Select-String -LiteralPath $_.FullName -Pattern "PATTERN" -List }

# Check duplicate function definitions
Select-String -LiteralPath "FILE" -Pattern "function FN_NAME" |
  Measure-Object | Select-Object Count

# Windows case-change rename trick
Rename-Item "old.ts" "temp.ts"
Rename-Item "temp.ts" "new.ts"
```

## Useful Console JavaScript

```javascript
// Check state of all code runner blocks
document.querySelectorAll('.coderunner').forEach((b, i) =>
  console.log(i, 'initialized:', b.dataset.initialized,
                 'has copy:', !!b.querySelector('.cr-copy-btn')));

// Check computed style
getComputedStyle(document.querySelector('.cr-theme-icon-sun')).display;

// Manually trigger code theme switch
document.documentElement.setAttribute('data-code-theme', 'light');
```

## Decisions From the Code Design Session, April 2026

- **BashBlock** -> Stripe Navy, cyan prompt
- **CodeRunner** -> GitHub Dark by default, plus GitHub Light
- **Theme picker**: per-block button with sun/moon zoom
- **BashBlock does not support theme switching** -> always navy
- **Icons**: gradient + glow, not stroke contour
- **Sun icon**: `#fff8b0 -> #ffdd55 -> #ff9500` with 8 rays
- **Moon icon**: `#fffef8 -> #e8e4d0 -> #a8a495` with craters

## Yuval Product Context

- Yuval is currently a dedicated AI knowledge library.
- All content in Yuval is AI-related.
- Current content areas include AI engineering, AI systems, agents, MCP, Python for AI, course summaries, articles and practical AI guides.
- Only Tomer adds content to Yuval.
- Content is added only through the existing BookForge code pipeline.
- There is currently no public upload flow.
- There is currently no user-generated upload UI.
- There is currently no upload button behavior.
- There is currently no database-backed CMS.
- There is currently no non-AI content.
- There is currently no active pricing, paywall or paid-content permission system.
- In the future, some content may remain free and some content may become available through advanced paid options, but do not implement this unless Tomer explicitly asks.
- The UI must not imply that users can upload books, courses, articles or files.

### Forbidden UI Wording

Do not use UI wording that implies public uploads or user-created libraries, such as:

- upload a book
- add your content
- upload your files
- create your own library
- העלה ספר
- הוסף תוכן משלך
- העלה קובץ

### Correct Product Framing

Use this framing:

> Yuval is a living AI knowledge space generated from AI content processed by the BookForge pipeline.

Hebrew product framing when needed:

> Yuval היא מרחב ידע חי לתכני AI שעובדו דרך BookForge.

## Real Content That Exists or Is Planned in Yuval

- Summaries from the AI Engineer course Tomer is currently studying:
  - Currently 3 summaries have been added out of 16 planned summaries
- Tomer's self-built AI course:
  - The foundational stage currently includes 3 existing or ready books:
    - AI Developer Fitness
    - Building AI Systems with MCP
    - Practical Python for AI Engineering
  - 4 additional books are in final correction and editing stages
  - 1 additional book is on the way
- Original AI articles written by Tomer
- Practical AI guides, for example:
  - מפקודה למוצר
  - בניית מערכות סוכנים עם Claude Code

## Required Visual Direction for `/library`

- The `/library` page must gradually converge toward the official visual target provided by Tomer.
- It is not a generic dashboard.
- It is not a normal book list.
- On desktop, it should feel like one cinematic dashboard viewport.
- The desktop structure must include:
  - clean top app bar
  - functional left sidebar with continue learning, short explanation, stats and recommended or active content
  - large central hero
  - central galaxy stage with a glowing knowledge core
  - floating tilted content cards around the core
  - narrow right pill toolbar only, with AI assistant, bookmarks and history
  - bottom recommendation strip integrated into the screen
- Do not continue toward a long page with stacked sections.
- Do not continue toward a generic business dashboard.
- Do not place large panels on the right side. On desktop, the right side is a narrow toolbar only.
- Functional panels belong in the left sidebar or in the bottom recommendation strip.

## Mobile and Tablet Behavior for `/library`

- Mobile must not copy the desktop orbit composition.
- Mobile must be phone-first, readable and fast.
- Recommended mobile structure:
  - compact hero
  - continue reading
  - horizontal featured carousel
  - knowledge explanation
  - stats
  - recommendations
  - quick actions
- Tablet should stay closer to mobile if the desktop orbit composition breaks.
- Do not squeeze the desktop orbit layout into small screens.

## Current Non-Goals for `/library`

Do not implement any of the following unless Tomer explicitly asks:

- public uploads
- upload UI
- upload button behavior
- user-generated content flows
- database-backed CMS
- active payment or paywall behavior
- non-AI categories
- AI assistant behavior
- search/filter/sort behavior
- drag carousel behavior
- WebGL or canvas effects
- heavy animations before the static desktop composition is visually approved
