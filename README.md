# BookForge

פרויקט פיתוח תוכנה שמדגים שימוש ביכולות המתקדמות
של Claude Code לבניית מוצר אמיתי.

מקבל ספר בפורמט Word (.docx) ובונה ממנו את Yuval,
פלטפורמת קריאה דיגיטלית ברמה עולמית.

## תכונות עיקריות

- **תמיכה דו-לשונית** — עברית (RTL) ואנגלית (LTR) עם החלפה מיידית
- **View Transitions** — מעברים חלקים בין דפים
- **Dark Mode** — מצב כהה עם שמירת העדפה
- **נגישות** — skip-to-content, focus-visible, ARIA, contrast AA
- **Reading Progress** — מעקב התקדמות קריאה עם שמירה מקומית
- **Code Copy** — כפתור העתקה על בלוקי קוד
- **Back to Top** — כפתור חזרה למעלה
- **Breadcrumbs** — ניווט פירורי לחם
- **Mobile-first** — עיצוב רספונסיבי מלא
- **404 מעוצב** — דף שגיאה מותאם

## דרישות

- Node.js 18+
- Python 3.12+ (לפייפליין עיבוד)

## התקנה

```bash
# תלויות Node
npm install

# תלויות Python (לפייפליין)
pip install -r requirements.txt
```

## פקודות

```bash
npm run dev      # שרת פיתוח
npm run build    # בנייה לפרודקשן
npm run preview  # תצוגה מקדימה
npm run test     # הרצת בדיקות
```

## מבנה הפרויקט

```
src/
├── components/    # קומפוננטים (BackToTop, Breadcrumbs, BookCard...)
├── layouts/       # BaseLayout, ReadingLayout
├── pages/         # index, books/[slug], read/[book]/[chapter], 404
├── scripts/       # reading-page, language-switcher, progress-tracker, sticky-header
├── styles/        # theme.css — single source of truth for colors
├── types/         # TypeScript types
├── utils/         # book-discovery, language, markdown, reading-progress
├── pipeline/      # Python pipeline (ingest, parse, organize)
└── config.ts      # centralized paths and layout constants
output/            # book source files (MD + assets)
public/            # static assets served by Astro
```

## הסוכנים במערכת

Pipeline (מתזמר), Translator (מתרגם), Code Reviewer,
Error Handler, Quality Gate

## הקוד בפעולה

https://github.com/tomkedem/bookforge
