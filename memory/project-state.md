---
name: project-state
description: מצב הפרויקט הנוכחי — מה הושלם, מה עובד, מה עוד חסר
type: project
---

## מה הושלם בשיחה זו

### Pipeline
- `ingest.py` — תומך ב-Bold/Italic בתוך פסקה דרך `run.bold` / `run.italic` (פונקציה `_format_runs`)
- `translate.py` — תומך ב-N שפות דרך `TARGET_LANGUAGES` array (EN + ES כרגע)

### שפות
- 3 שפות: עברית, אנגלית, ספרדית
- `SUPPORTED_LANGUAGES` ב-`language.ts` — להוסיף שפה = שורה אחת
- קבצי `.es.md` נוצרים על-ידי ה-pipeline; עד אז — fallback לאנגלית
- `LanguageToggle` דינמי לחלוטין, מונע מ-`SUPPORTED_LANGUAGES`

### ספרייה
- קטגוריות: שדה `category` ב-`content-structure.json` + פילטור client-side
- תיאור ספר: שדות `description_he/en/es` ב-`content-structure.json`
- `book-discovery.ts` קורא הכל אוטומטית

### BookCard
- כרטיסים קומפקטיים: `h-28`, גריד `lg:grid-cols-4 xl:grid-cols-5`
- תמונה נקייה — אין overlay חשוך
- Ambient glow ב-hover מ-`dominantColor` עם `color-mix`
- Reading progress מ-localStorage (פס + "Continue Ch.X")

### ReadingControls (FAB)
- FAB אחד מתרחב ל-3 sub-buttons
- Typography panel: bottom sheet על מובייל, floating card על desktop

### Dark Mode
- true neutral dark: `#111111` — ללא גוון צבעוני

### ניווט בין פרקים
- **באג קריטי תוקן**: `initTocNavigation` השתמש ב-`querySelector('.toc-list')` שהחזיר את ה-mobile drawer במקום הדסקטופ sidebar → ניווט דסקטופ הפעיל Astro View Transitions → פליקר
- **תיקון**: משתמש ב-`getElementById('toc-sidebar')` ישירות

## מה עוד חסר / לשלב הבא
- קבצי `.es.md` לספרים קיימים (דורש הרצת pipeline עם Translator)
- `dominantColor` בכרטיסים תמיד `#888888` — אין חילוץ צבע אמיתי מהכריכה
- שיתוף ציטוט (פיצ'ר שתוכנן מהתחלה, עוד לא מומש)
