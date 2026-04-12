# BookForge

מערכת להפקת ספרים דיגיטליים מקבצי Word.  
מקבלת `.docx` בעברית → מפרקת לפרקים → מתרגמת לשפות מרובות → בונה פלטפורמת קריאה מודרנית.

**Yuval** — פלטפורמת הקריאה שנבנית מהתוכן.

---

## ✨ תכונות עיקריות

### קריאה
- **רב-לשוני** — עברית, אנגלית, ספרדית + הוספת שפות בשורה אחת
- **RTL/LTR** — תמיכה מלאה בכיווניות
- **Reading Progress** — מעקב התקדמות עם שמירה מקומית
- **Bookmarks** — סימניות וסימון טקסט
- **Text-to-Speech** — הקראה אוטומטית

### עיצוב
- **Dark/Light Mode** — מצב כהה עם שמירת העדפה
- **Mobile-first** — רספונסיבי מלא (sm, md, lg, xl)
- **View Transitions** — מעברים חלקים בין דפים
- **Focus Mode** — פרגרף מודגש בזמן קריאה

### קוד
- **Code Blocks** — הדגשת תחביר עם העתקה בלחיצה
- **Code Runner** — הרצת קוד Python בדפדפן (Pyodide)

### נגישות
- Skip-to-content, focus-visible, ARIA labels
- ניגודיות AA, תמיכה בקורא מסך

---

## 🛠 דרישות

- **Node.js** 18+
- **Python** 3.12+
- **python-docx** (לקריאת Word)

---

## 📦 התקנה

```bash
# תלויות Node
npm install

# תלויות Python
pip install -r requirements.txt
```

---

## 🚀 פקודות

```bash
npm run dev      # שרת פיתוח (http://localhost:4321)
npm run build    # בנייה לפרודקשן
npm run preview  # תצוגה מקדימה של הבנייה
npm run test     # הרצת בדיקות
```

---

## 📚 הוספת ספר חדש

הפייפליין מורכב מ-**שני שלבים**:

### שלב 1: עיבוד ה-Word

```bash
cd src
python -m pipeline.build "D:\Books\MyBook.docx" my-book --languages he,en,es
```

**מה קורה:**
1. קורא את קובץ ה-Word
2. מפרק לפרקים לפי כותרות (Heading 1)
3. מחלץ תמונות ועטיפה
4. יוצר קבצי `.he.md` בתיקייה `output/my-book/`
5. יוצר `content-structure.json`

**התוצאה:** קבצי המקור בעברית מוכנים, אבל **התרגום עדיין לא בוצע**.

### שלב 2: תרגום (נדרש!)

```bash
cd "d:\...\bookforge"
python src/pipeline/translate.py output/my-book --languages en,es
```

**או** הפעל את סוכן ה-Translator:
```
@translator תרגם את my-book לאנגלית וספרדית
```

> ⚠️ **חשוב:** הפייפליין ב-build.py לא מתרגם אוטומטית — הוא רק מכין את הקבצים לתרגום.

### שימוש עם מספר שפות

```bash
python -m pipeline.build "D:\Books\MyBook.docx" my-book --languages he,en,es,fr,de
```

### TL;DR — הזרימה המלאה

```bash
# שלב 1: עיבוד Word → קבצי MD בעברית
cd src
python -m pipeline.build "D:\Books\MyBook.docx" my-book --languages he,en,es

# שלב 2: תרגום → קבצי MD בשאר השפות
cd ..
python src/pipeline/translate.py output/my-book --languages en,es

# שלב 3: הפעל את שרת הפיתוח
npm run dev
# פתח http://localhost:4321/books/my-book
```

### פרמטרים (שלב 1)

| פרמטר | תיאור | ברירת מחדל |
|-------|-------|------------|
| `docx_path` | נתיב לקובץ Word | (חובה) |
| `book_name` | slug לשם הספר | (חובה) |
| `--title` | כותרת הספר | נלקח מעמוד השער |
| `--languages` | שפות יעד (מופרדות בפסיק) | `he,en,es` |
| `--output-dir` | תיקיית פלט | `output/` |

### פרמטרים (שלב 2 - תרגום)

| פרמטר | תיאור | ברירת מחדל |
|-------|-------|------------|
| `book_dir` | תיקיית הספר (output/my-book) | (חובה) |
| `--languages` | שפות יעד לתרגום | `en,es` |
| `--force` | תרגם מחדש גם קבצים קיימים | `false` |

### תוצאה צפויה

```
output/my-book/
├── intro.he.md              # מבוא
├── chapter-01.he.md         # פרק 1 בעברית
├── chapter-01.en.md         # פרק 1 באנגלית
├── chapter-01.es.md         # פרק 1 בספרדית
├── content-structure.json   # מטא-דאטא

public/my-book/assets/
├── cover.png                # עטיפה
└── image-001.png            # תמונות
```

---

## 🌐 הוספת שפה חדשה

שורה אחת בכל קובץ קונפיג:

**TypeScript** — `src/utils/language.ts`:
```typescript
{ code: 'fr', label: 'Français', labelEn: 'French', dir: 'ltr', locale: 'fr-FR' },
```

**Python** — `src/pipeline/languages.py`:
```python
LanguageMeta(code='fr', label='Français', label_en='French', dir='ltr', locale='fr-FR'),
```

הרץ: `--languages he,en,fr`

---

## 📁 מבנה הפרויקט

```
src/
├── components/     # Astro components
│   ├── BookCard.astro
│   ├── ChapterNavigation.astro
│   ├── CodeBlock.astro
│   ├── CodeRunner.astro
│   ├── LanguageToggle.astro
│   ├── ReadingProgress.astro
│   └── ...
├── layouts/        # BaseLayout, ReadingLayout
├── pages/          # Routing
│   ├── index.astro
│   ├── books/[slug].astro
│   └── read/[book]/[chapter].astro
├── scripts/        # Client-side TypeScript
│   ├── bookmarks.ts
│   ├── highlighter.ts
│   ├── text-to-speech.ts
│   └── ...
├── styles/         # theme.css (design tokens)
├── utils/          # Shared utilities
│   ├── book-discovery.ts
│   ├── language.ts       # Language config
│   └── ...
├── pipeline/       # Python pipeline
│   ├── build.py          # Main orchestrator
│   ├── ingest.py         # Read Word files
│   ├── parse.py          # Split to chapters
│   ├── organize.py       # Create output structure
│   ├── translate.py      # Translation logic
│   └── languages.py      # Language config
├── i18n/           # UI translations
└── types/          # TypeScript definitions

output/             # Generated book files (MD)
public/             # Static assets
docs/               # Project documentation
```

---

## 🤖 סוכנים

| סוכן | תפקיד |
|------|-------|
| **Pipeline** | מתזמר את תהליך עיבוד הספר |
| **Translator** | מתרגם פרקים (batch mode) |
| **Code Reviewer** | בודק איכות קוד |
| **Error Handler** | מזהה ומתקן שגיאות |
| **Quality Gate** | אישור/דחייה סופי |

### זיהוי סביבה אוטומטי

המערכת מזהה את סביבת ההרצה ומתאימה את אסטרטגיית התרגום:

| סביבה | זיהוי | אסטרטגיה |
|-------|-------|----------|
| **Claude Code CLI** | `CLAUDE_SESSION_ID` | תרגום מקבילי עם 3 subagents |
| **VS Code Copilot** | `VSCODE_PID` | תרגום ישיר על ידי הסוכן הראשי |

**למה?** — ב-VS Code Copilot, subagents לא מקבלים גישה לקבצים.
המערכת מזהה זאת אוטומטית ועוברת למצב תרגום ישיר.

```python
from pipeline.translate import detect_environment, supports_parallel_subagents

print(detect_environment())        # 'claude-code' / 'vscode-copilot' / 'unknown'
print(supports_parallel_subagents())  # True / False
```

---

## 🔧 טכנולוגיות

- **Framework**: Astro 5
- **Styling**: Tailwind CSS (RTL support)
- **Language**: TypeScript
- **Testing**: Vitest, Playwright
- **Python**: python-docx

---

## 📄 License

MIT

---

## 🔗 קישורים

- [GitHub](https://github.com/tomkedem/bookforge)
- [תיעוד טכני](docs/)
