# BookForge + Yuval

## מה המערכת עושה

**שתי מערכות קשורות:**

1. **BookForge (pipeline)** — מקבלת ספר בעברית בפורמט Word (.docx),
   מפרקת לפרקים, כל פרק קובץ MD נפרד. כל פרק מתורגם לאנגלית אוטומטית.

2. **Yuval (platform)** — פלטפורמת **למידה** דיגיטלית.
   לא רק קריאת ספרים — אלא ניהול מסעי למידה שלמים:
   - **קורסים** עם 12-16 ספרים בכל אחד
   - **מסלולים** מומלצים (curated paths)
   - **ספרים בודדים** במגוון נושאים
   - **התקדמות אישית**: מה הושלם, מה ממשיך, כמה זמן נשאר

## טכנולוגיות

- Framework: Astro (+ Astro Islands לחלקים דינמיים)
- CSS: Tailwind CSS עם תמיכה מלאה ב-RTL
- שפה: TypeScript
- Pipeline: Python (בעיקר python-docx + custom modules)
- Python execution בדפדפן: Pyodide
- בדיקות: Vitest ליחידה, Playwright לרספונסיביות
- Breakpoints: sm, md, lg, xl. Mobile-first תמיד.

## הקורס המרכזי שתומר כותב — "AI Developer Path"

14 ספרים בעברית, 3 שכבות:

**Core Layer (4 ספרים) — היכולות ההנדסיות הבסיסיות**
1. AI Developer Fitness — אימון הנדסי בעידן מערכות הסתברותיות
2. Managing Code Agents
3. Python for AI Systems
4. Intuitive Math and Probabilistic Thinking for AI Systems

**Systems Layer (6 ספרים) — בניית רכיבי AI במערכות תוכנה**
5. Data Engineering for AI
6. Practical NLP
7. Large Language Models in Practice
8. Building RAG Systems
9. AI Agents
10. MCP Systems Engineering

**Production Layer (4 ספרים) — הפעלה בסביבה אמיתית**
11. Production AI Systems
12. AI Security and Guardrails
13. Multimodal AI Systems
14. AI Integration and Automation

כל ספר כולל: ספר לימוד + GitHub repo + מעבדות בדפדפן + פרויקט מסכם.

## Project Index

### Yuval - פלטפורמת הקריאה (המצב הנוכחי)

```
src/layouts/
  ReadingLayout.astro         דף קריאת פרק, init logic מרכזי,
                              theme picker, code block wiring
  BaseLayout.astro            עטיפה גלובלית

src/utils/
  markdown.ts                 Renderer שמייצר HTML לבלוקי קוד.
                              שלושה מסלולים:
                              - bash/sh/zsh/powershell/cmd → BashBlock
                              - python/py → CodeRunner עם Run
                              - כל השאר → CodeBlock (view-only)
  reading-progress.ts         Progress tracking (קיים, יורחב ב-Phase 3)
  language.ts                 i18n utilities — getLanguageDirection וכו'

src/styles/
  bash-block.css              עיצוב טרמינל — Stripe Navy (#0a2540)
  code-runner.css             עיצוב IDE — GitHub Dark + Light
                              (data-code-theme על <html>)
  reading-typography.css      ⚠ דורס font-family על כל צאצאי .reading-content

src/components/
  ReadingControls.astro       FAB צף: Typography, Focus, Theme
  ReadingProgress.astro       פס התקדמות
  ChapterNavigation.astro     ניווט בין פרקים
  ChapterSidebars.astro       ⚠ TO BE REFACTORED — מיזוג שני sidebars
  Header.astro
  ThemeToggle.astro
  LanguageSelector.astro

src/pages/
  index.astro                 ⚠ TO BE REDESIGNED — Galaxy view
  read/[book]/[chapter].astro דף הקריאה
  books/[slug].astro          דף ספר
  compare.astro               (legacy)
  admin.astro                 (legacy)

src/types/
  index.ts                    Chapter, Book, Language, Course types
```

### BookForge - pipeline

```
src/pipeline/
  ingest.py                   קריאת Word (מודולרי, 7 קבצים)
  parse.py                    פירוק לפרקים
  organize.py                 סידור תיקיות
  build.py                    סקלטון Astro + manifest
                              ⚠ TO BE EXTENDED — חישוב word_count + minutes
  translate.py                תרגום עברית→אנגלית
  translate_jobs.py           queue של תרגומים

output/{book-name}/
  chapter-01.he.md            פרק בעברית
  chapter-01.en.md            פרק באנגלית
  assets/                     תמונות
  book-manifest.json          metadata (יורחב ב-Phase 2)
```

## ארכיטקטורת בלוקי קוד (Yuval)

**חשוב: ה-HTML של בלוקי קוד נבנה ב-markdown.ts בזמן parse,
לא ברכיבי Astro!** הרכיבים ב-components/ (אם קיימים) הם רק קוד רפרנס,
לא בשימוש בפועל.

```
Markdown (``` with lang)
    ↓
markdown.ts renderer
    ↓
HTML עם class מתאים:
    ├─ .bash-block             (bash/sh/zsh/powershell/cmd)
    ├─ .coderunner             (python, עם Run button)
    └─ .coderunner.codeblock   (yaml/json/js/ts..., ללא Run)
    ↓
CSS מ-bash-block.css / code-runner.css
    ↓
ReadingLayout.astro מחבר event listeners ל-DOM
```

## החלטות עיצוב סגורות

### בלוקי קוד
- **Shell blocks**: Stripe Docs aesthetic (Navy #0a2540, prompt ציאן)
- **Code blocks**: GitHub Dark (default) + GitHub Light
- **Theme switcher**: כפתור פר-בלוק, השפעה גלובלית על הדף,
  שמור ב-localStorage תחת 'code-theme'
- **UI באנגלית** גם בספר עברי: "Terminal", "Copy", "Run", "Output",
  "Running", "Execution finished (no output)"
- **אייקוני theme**: שמש וירח עם gradient אמיתי, glow, craters בירח
- **אין תמיכה ב-Light mode ל-BashBlock** — תמיד נייבי
- **LTR חזק** לכל בלוק קוד, גם בתוך עמוד עברי
- **מספרי שורות**: תמיד מיושרים לימין (צמודים לקוד), כמו IDE

### פלטפורמה (Yuval Redesign — תכנון, טרם יושם)
- **דף בית = Galaxy view** ("המרחב שלך לידע אמיתי")
  - כרטיס מרכזי גדול (recommended) + כרטיסים מסביב
  - חוקי המרחב: מרחק מהמרכז = רלוונטיות
- **דף ספר**: Hero + timeline פרקים + drawer ימני
- **דף קריאה**: שני סוגים לפי `book.reading_mode`:
  - `lesson_module`: טאבים אופקיים (סיכום/תרגילים/דוגמאות/Q&A)
  - `long_form`: תוכן רציף עם sidebar
- **Sidebar אחיד** (החלפה של שני sidebars נוכחיים)
  - כל הניווט מצד אחד (RTL: ימין, LTR: שמאל)
  - Timeline אנכי ויזואלי
  - פרק נוכחי "בולט" עם רקע סגול
  - סעיפים נטענים אוטומטית מ-h2
  - Progress + reading time per chapter

## Gotchas ידועים - חובה להכיר

### Astro + SVG
- JSX-style comments `{/* */}` **שבורים ב-Astro בתוך SVG defs**.
  השתמש ב-HTML comments `<!-- -->`.

### Script scope
- `const` ב-`<script is:inline>` הוא **גלובלי לדף**, לא לקובץ.
  אם ReadingControls.astro וגם ReadingLayout.astro מכריזים על `STORAGE_KEY`,
  תקבל `Identifier already declared` שמשבית את כל הסקריפט.
  **פתרון: עטוף ב-IIFE** `(function(){...})();`

### CSS priority wars
- `reading-typography.css` מכריח `font-family !important` על כל
  צאצאי `.reading-content:not(code):not(pre):not(.hljs)`.
  בלוקי קוד חדשים (.coderunner, .bash-block) **לא נכללים** ברשימה,
  אז ה-CSS שלהם חייב `!important` כדי לגבור.

### RTL inheritance
- עמוד עברי מכיל `direction: rtl` על body.
  כל בלוק קוד חייב `direction: ltr !important` + `text-align: left !important`
  + `unicode-bidi: isolate` על עצמו **ועל כל צאצאיו**.
  מספרי שורות הם יוצא-דופן — הם LTR אבל `text-align: right`.

### Windows case-sensitivity
- Windows לא רואה הבדל בין `BashBlock.astro` ל-`Bashblock.astro`,
  אבל Astro/Vite **כן**. שינוי case דורש rename double:
  ```
  Rename-Item "Bashblock.astro" "Temp.astro"
  Rename-Item "Temp.astro" "BashBlock.astro"
  ```

### Rendering pipeline
- **אל תתחיל לעבוד על בלוקי קוד לפני שהבנת**:
  ה-HTML נוצר ב-`markdown.ts` בזמן parse של Markdown, לא ב-Astro runtime.
  שינוי רכיב `CodeBlock.astro` לא ישפיע על מה שרואים בדף.
  הקובץ שצריך לערוך הוא `src/utils/markdown.ts`.

### i18n - קריטי
- כל טקסט UI דרך `data-i18n="key"` או `chapter.titles[lang]`
- כיוון נקבע ע"י `getLanguageDirection(language)`, לא hardcoded
- CSS Logical Properties: `padding-inline-start` not `padding-left`,
  `inset-inline-start` not `left`, `border-inline-end` not `border-right`
- אסור לבנות רכיב נפרד לעברית — אותו רכיב חייב לעבוד בשתי השפות

## כללי בחירה: Subagents או Agent Teams

השתמש ב-**Subagents** כשהמשימות עצמאיות:
Explorer, Parser, Content Architect, Organizer, Translator,
UI Designer, Builder.

השתמש ב-**Agent Teams** כשהסוכנים צריכים לדבר:
Memory Keeper, Error Handler, Code Reviewer.

## סדר הפעלת pipeline

כשמקבלים קובץ Word לעיבוד:

1. **Explorer** → נתיב → JSON עם מבנה הספר
2. **Parser** → קובץ + JSON → chapter-XX.he.md
3. **Content Architect** → קבצי MD → content-structure.json
4. **Organizer** → structure.json + MD → תיקיות ב-output/
5. **Translator** → chapter-XX.he.md → chapter-XX.en.md
6. **UI Designer** → content-structure.json → design-system.json
7. **Builder** → MD + design-system → קומפוננטים ב-Astro
8. **במקביל**: Memory Keeper + Error Handler + Code Reviewer
9. **Quality Gate** → אישור/דחייה

## עקרונות SOLID

- כל סוכן אחראי על דבר אחד בלבד
- כל סוכן מקבל ומחזיר פורמט מוגדר
- סוכן לא יודע על המימוש הפנימי של סוכן אחר
- תלות בממשק, לא בהתנהגות פנימית

## כללי עבודה

- תכנן לפני שאתה מבצע
- כתוב ל-tasks/todo.md לפני כל משימה
- אחרי כל תיקון שהמשתמש עושה, עדכן tasks/lessons.md
- שאל את עצמך: would a staff engineer approve this?
- עבוד תמיד על branch נפרד
- mobile-first בכל קומפוננט

## Don'ts (חשוב)

- **אל תמחק רכיבים ב-components/** בלי `grep -r "import.*ComponentName"`
- **אל תכתוב em dashes** בתוכן עברי (`—` / `–`)
- **אל תמציא תוכן** — תמיד צמוד למקור
- **אל תתרגם UI לעברית** גם בספר עברי
- **אל תגע ב-output/** ללא אישור מפורש
- **אל תמחק קבצים**, רק צור ועדכן (חוץ מקבצי `.astro` שנבדקו)
- **אל תשנה design-system.json** ללא אישור מפורש
- **אל תריץ פקודות** שמשנות סביבה גלובלית
- **אל תמזג ל-main** בלי אישור מפורש
- **אל תבנה רכיב נפרד לעברית** — i18n הוא נון-נגוציאבל

## חיסכון ב-tokens

- קרא **tasks/lessons.md** לפני כל משימה
- לפני כל תיקון, כתוב אבחון הבעיה ב-tasks/todo.md
- **אל תנסה יותר מפתרון אחד** ללא אישור
- אם נכשלת פעמיים, **עצור ודווח** לפני שממשיך
- אחרי כל שלב שהסתיים בהצלחה, הרץ `/compact`

## קריטריונים לאישור

לפני כל דיווח סיום, Quality Gate חייב לבדוק את כל
הקריטריונים ב-docs/acceptance-criteria.md ידנית.
אין לאשר בלי שכל קריטריון עבר.

## Playwright MCP

Quality Gate משתמש ב-Playwright לצילום screenshots.
התקן אם חסר: `npx playwright install chromium`

## כללי Git

- עבוד תמיד על branch נפרד, לעולם לא על main
- שם branch: `feature/{task-name}` או `fix/{issue-name}`
- commit אחרי כל שלב עצמאי שהושלם
- הודעת commit: `{type}: {description}` באנגלית קצר
- פתח PR עם תיאור מלא לפני סיום העבודה
- תיאור PR חייב לכלול: שם הספר, מספר פרקים, שפות
- **לעולם אל תמזג ל-main בלי אישור מפורש**
- אם משהו משתבש, עצור ודווח לפני שתמשיך

## עבודה בסשן חדש

אם זה תחילת סשן חדש:
1. **קרא קודם את `SESSION-HANDOFF.md`** — מכיל את כל ההחלטות והתכניות
2. **תברך בעברית קצרה**: "תומר, אני קלוד. קראתי את ה-handoff והבנתי איפה עצרנו"
3. **המתן להוראה**, אל תשער. אם תומר אומר "תמשיך מאיפה שהיינו" — שאל מה השלב הבא

## כללי כתיבה

- אין em dashes בתוכן עברי
- שומרים על מבנה נקי בלי להמציא
- שפת UI באנגלית גם לעברית
- ליישור שמאלה ב-RTL נדרש CSS אגרסיבי עם isolate