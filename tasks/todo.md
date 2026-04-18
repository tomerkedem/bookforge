# tasks/todo.md

## משימה נוכחית - הצמדת בר הקריאה ל-header

- אבחון: ב-`/read/[book]/[chapter]` שורת המטא, ה-breadcrumbs וכותרת הפרק יושבים כחלקים נפרדים בתוך התוכן, עם רווח מה-header, והם נעלמים בגלילה.
- פעולה: לעטוף אותם כ-stack sticky אחד, להצמיד אותו מתחת ל-header הגלובלי, להרחיב אותו לרוחב אזור הקריאה, ולהשאיר את כותרת הפרק גלויה בזמן גלילה.

## משימה נוכחית - תיקון גילוי שפות לספר Practical Python

- אבחון: LanguageSelector תוקן, אבל הספר `practical-python-for-ai-engineering` עדיין הצהיר ב-`content-structure.json` על `en` ו-`es` למרות שקיימים רק קבצי `he`.
- פעולה: להעדיף גילוי שפות לפי קבצי Markdown קיימים בפועל, ולסנן `book.languages` ישן או שגוי.

## משימה שהושלמה: "Practical Python for AI Engineering" (Hebrew Build)

### שלבים שהושלמו

#### שלב 0 — Pre-flight ✅
- [x] קובץ קיים: D:\Books\Practical Python for AI Engineering.docx (4.7MB)
- [x] lessons.md נקרא
- [x] git status נקי, branch created

#### שלב 1 — Pipeline Execution ✅
- [x] הרץ run_pipeline.py בהצלחה
- [x] פלטים נוצרו:
  - [x] `output/practical-python-for-ai-engineering/chapter-*.he.md` (19 files)
  - [x] `output/practical-python-for-ai-engineering/content-structure.json`
  - [x] `public/practical-python-for-ai-engineering/assets/` (2 images)

#### שלב 2 — Code Block Verification ✅
- [x] Python code blocks תוקנו (removed backtick wrapping)
- [x] Format: `\`\`\`python ... \`\`\`` ✅
- [x] כל 19 פרקים verified

#### שלב 3 — Translation (Skipped for now)
- [ ] תרגום ל-EN ו-ES (דחוי - בחרת option C)

#### שלב 4 — Build ✅
- [x] `npm run build` → success, zero errors
- [x] Build output: dist/
- [x] TypeScript errors בPyodide קיימים (pre-existing), לא blocking

#### שלב 5 — QA ✅
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

✅ **Font Detection** — 6131 paragraphs parsed correctly  
✅ **Code Block Handling** — Python, Bash, Plaintext detected  
✅ **Image Extraction** — Cover detected, 2 images saved  
✅ **RTL Support** — Hebrew text formatted correctly  
✅ **Chapter Splitting** — 19 chapters extracted from headings  
✅ **Build Pipeline** — Zero errors, production-ready  

---

## TODO אם תרצה להמשיך:

- [ ] Run Translator agent for EN/ES chapters
- [ ] Test CodeRunner with Pyodide in browser
- [ ] Screenshot first chapter with code blocks
- [ ] Merge PR after review
- [ ] Deploy to production

**Branch:** feature/add-practical-python-ai  
**Status:** Hebrew version ready, awaiting translation decision
