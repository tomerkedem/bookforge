## לקחים

### 2026-04-06
קבצי src/pipeline/ חייבים להכיל קוד אמיתי לפני הרצת pipeline.
בלעדיהם הסוכנים כותבים את הקוד מחדש בכל הרצה ושורפים tokens מיותרים.

### 2026-04-06
מעבר שפה עברית/אנגלית לא עבד בריצה הראשונה.
הסיבה: Builder לא יישם את מנגנון ה-cookie ואת ה-?lang= ב-URL.
הפתרון: לאחר שBuilder מסיים, בדוק ידנית שמעבר השפה עובד לפני שממשיכים.

### 2026-04-07
Astro.url.searchParams לא עובד ב-output: static.
הסיבה: בבנייה סטטית אין request לכן searchParams תמיד ריק.
הפתרון: להטמיע את שני הגרסאות (עברית/אנגלית) ב-HTML ולבצע שינוי שפה בצד הלקוח
דרך [data-he]/[data-en] attributes + script שקורא window.location.search.

### 2026-04-07
Builder לא בנה דף בית ללא הוראה מפורשת.
כפתור שפה נבנה חד כיווני ללא בדיקה.

### 2026-04-07
Translator לא צריך לקרוא ל-API ישירות.
הוא סוכן Claude Code שמתרגם בעצמו כחלק מה-session.
אם הסוכן ביקש API key לתרגום, זה שגוי.

### 2026-04-07
parse.py חילץ תמונה אקראית לפי סדר relations ולא תמונת השער.
צריך לחלץ לפי מיקום בדף, לא לפי סדר ה-relations.

### 2026-04-08
Builder צריך להטמיע טעינת chapter content מ-markdown files בדף קריאה.
הדף /read/[book]/[chapter] לא צריך להיות stub. צריך עומס בפועלי של chapter-XX.he.md או chapter-XX.en.md
בהתאם לשפה (מ-localStorage או ?lang= parameter).

### 2026-04-08
Event listeners בקומפוננטים צריכים cleanup על page transition.
אחרת addEventListener calls מתצברים בזיכרון (memory leak).
פתרון: AbortController או removeEventListener ב-astro:before-unmount hook.

### 2026-04-08
Language/RTL logic חוזר בכל קומפוננט (7+ מיקומים).
צריך extract לreusable utility function כדי לחזור מ-code duplication.
זה קריטי למיתחזוקה.

### 2026-04-08
Builder צריך להוסיף data-he ו-data-en attributes לכל elements שבהם text.
זה נחוץ לmultilingual content switching בצד הלקוח.

### 2026-04-08
AbortController חיוני לניקוי event listeners בAstro SPA.
בכל component שמוסיף event listener, צריך:
1. `const controller = new AbortController()`
2. `addEventListener(..., { signal: controller.signal })`
3. Cleanup on `astro:before-unmount` ו-`window.unload`

### 2026-04-08
Language switching צריך centralized utilities, לא שכפול בכל component.
יצרנו language.ts עם:
- getLanguageFromStorage() - single source of truth
- setLanguageToStorage() - updates localStorage + cookie + DOM
- applyLanguageToPage() - toggles data-he/data-en visibility
- dispatchLanguageChangeEvent() - custom event for components
זה חסך הרבה קוד כפול וזיהום.

### 2026-04-08
getStaticPaths() חיוני לכל dynamic routes בAstro static builds.
צריך להגדיר את כל הפרמטרים האפשריים (books, chapters) לפני הבנייה.
בלי זה הבנייה נכשלת עם "getStaticPaths required" error.

### 2026-04-08
markdown content loading עובד דרך fetch() ל-public files.
בAstro static build, יש טוען לטעון files מתיקיית output/ דרך URL.
צריך להעביר markdown files ל-public/{book}/{chapter}.{lang}.md 
או למטמון בבנייה כחלק של content collection.