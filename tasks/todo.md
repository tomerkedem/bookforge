# tasks/todo.md

## משימה נוכחית — כרטיס "מרחב הידע" + bottom sheet "כל הפריטים" (מובייל)

### ממצאי Phase 1 (בדיקת ארכיטקטורה)
- מקור אמת לפריטים: `getLibraryItems()` → `getLibraryStats(items)` ב-`src/utils/library-catalog.ts` (build-time, מתעדכן לבד).
- ספירות קיימות: `stats.readable` + `stats.byType['book'|'course'|'article']`. ה-Knowledge Core (`LibraryStatsPanel.astro`) כבר משתמש בדיוק בזה → לשקף, לא להמציא.
- קיים שווה-ערך דסקטופ: `KnowledgeAtlas.astro` (overlay "כל הפריטים") + Knowledge Core. שניהם `display:none` ≤1023px → במובייל אין כלום. לכן הרכיבים החדשים = מובייל-בלבד.
- i18n: `src/i18n/translations.ts` (מפה שטוחה he/en/es), `t()` + `data-i18n*`. להוסיף `knowledgeSpace.*`.
- תמה: `html.dark` / `html:not(.dark)`, טוקנים `--yuval-galaxy-*` ב-`src/styles/galaxy.css`. כיוון לפי `getLanguageDirection`.
- תמונות ממוזערות: `getKnowledgeCardAssetsOrPlaceholder(slug)` → `{ front }`.

### תוכנית (מובייל בלבד, דסקטופ לא נוגעים)
- [ ] P2: גזירת `mobileCatalogItems` ב-index.astro מהנתונים הקיימים (slug, kind, title, subtitle, typeLabel, href, thumb). ספירות מ-`stats`.
- [ ] P3: מפתחות i18n `knowledgeSpace.*`.
- [ ] P4: רכיב `MobileKnowledgeSpace.astro` — כרטיס סיכום מתחת לקרוסלה.
- [ ] P5/P6: רכיב `MobileAllItemsSheet.astro` — bottom sheet (רשימה ברירת מחדל + כרטיסים, פילטרים, חיפוש, a11y).
- [ ] P7: עיצוב light/dark דרך טוקנים.
- [ ] P8: אימות RTL/LTR.
- [ ] P9: קרוסלה ללא שינוי — להרכיב כ-siblings.
- [ ] P10: צ'קליסט בדיקות.

### אילוצים נשמרים
- אין ספירות קשיחות. אין מחרוזות עברית קשיחות במרקאפ/סקריפט.
- מובייל בלבד. פיזיקת הקרוסלה/גדלים/active לא נוגעים.

---

## משימה ישנה - הצמדת בר הקריאה ל-header

- אבחון: ב-`/read/[book]/[chapter]` שורת המטא, ה-breadcrumbs וכותרת הפרק יושבים כחלקים נפרדים בתוך התוכן, עם רווח מה-header, והם נעלמים בגלילה.
- פעולה: לעטוף אותם כ-stack sticky אחד, להצמיד אותו מתחת ל-header הגלובלי, להרחיב אותו לרוחב אזור הקריאה, ולהשאיר את כותרת הפרק גלויה בזמן גלילה.

## משימה נוכחית - תיקון גילוי שפות לספר Practical Python

- אבחון: LanguageSelector תוקן, אבל הספר `practical-python-for-ai-engineering` עדיין הצהיר ב-`content-structure.json` על `en` ו-`es` למרות שקיימים רק קבצי `he`.
- פעולה: להעדיף גילוי שפות לפי קבצי Markdown קיימים בפועל, ולסנן `book.languages` ישן או שגוי.

## משימה שהושלמה: "Practical Python for AI Engineering" (Hebrew Build)

### שלבים שהושלמו

#### שלב 0 - Pre-flight ✅
- [x] קובץ קיים: D:\Books\Practical Python for AI Engineering.docx (4.7MB)
- [x] lessons.md נקרא
- [x] git status נקי, branch created

#### שלב 1 - Pipeline Execution ✅
- [x] הרץ run_pipeline.py בהצלחה
- [x] פלטים נוצרו:
  - [x] `output/practical-python-for-ai-engineering/chapter-*.he.md` (19 files)
  - [x] `output/practical-python-for-ai-engineering/content-structure.json`
  - [x] `public/practical-python-for-ai-engineering/assets/` (2 images)

#### שלב 2 - Code Block Verification ✅
- [x] Python code blocks תוקנו (removed backtick wrapping)
- [x] Format: `\`\`\`python ... \`\`\`` ✅
- [x] כל 19 פרקים verified

#### שלב 3 - Translation (Skipped for now)
- [ ] תרגום ל-EN ו-ES (דחוי - בחרת option C)

#### שלב 4 - Build ✅
- [x] `npm run build` → success, zero errors
- [x] Build output: dist/
- [x] TypeScript errors בPyodide קיימים (pre-existing), לא blocking

#### שלב 5 - QA ✅
- [x] `npm run dev` → server running on port 4329
- [x] `npx astro check` → 4 warnings, 0 errors
- [x] Vitest quality gate → 4 tests passed

#### Commits ✅
- [x] Initial: feat: add Practical Python for AI Engineering (19 chapters, Hebrew)
- [x] TypeScript fix: CodeBlock.astro HTML element casting

---

## מצב נוכחי

### Available Now:
```
📖 Practical Python for AI Engineering (Hebrew)
📁 output/practical-python-for-ai-engineering/
   ├── chapter-01.he.md (Python code blocks ✅)
   ├── chapter-02.he.md
   ...
   ├── chapter-18.he.md
   ├── intro.he.md
   ├── content-structure.json (with EN/ES titles)
   └── assets/ (2 images)

🚀 Dev Server: http://localhost:4329/
   Ready to test Hebrew reading experience
```

### Next Steps (if needed):
1. **For Full Multilingual:** run Translator agent → EN + ES chapters
2. **For Reading Testing:** visit http://localhost:4329/read/practical-python-for-ai-engineering/chapter-01
3. **For Prod Deployment:** `npm run build && node dist/server/entry.mjs`

---

## מה שעבד בצורה מעולה:

✅ **Font Detection** - 6131 paragraphs parsed correctly  
✅ **Code Block Handling** - Python, Bash, Plaintext detected  
✅ **Image Extraction** - Cover detected, 2 images saved  
✅ **RTL Support** - Hebrew text formatted correctly  
✅ **Chapter Splitting** - 19 chapters extracted from headings  
✅ **Build Pipeline** - Zero errors, production-ready  

---

## TODO אם תרצה להמשיך:

- [ ] Run Translator agent for EN/ES chapters
- [ ] Test CodeRunner with Pyodide in browser
- [ ] Screenshot first chapter with code blocks
- [ ] Merge PR after review
- [ ] Deploy to production

**Branch:** feature/add-practical-python-ai  
**Status:** Hebrew version ready, awaiting translation decision
