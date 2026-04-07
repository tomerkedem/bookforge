# BookForge

## מה המערכת עושה
מקבלת ספר בעברית בפורמט Word או PDF, מפרקת אותו לפרקים,
לכל פרק קובץ MD נפרד. כל פרק מתורגם לאנגלית אוטומטית.
הפלט הסופי: שתי גרסאות מלאות של הספר, עברית ואנגלית.
מהתוכן הזה נבנית Yuval, פלטפורמת קריאה דיגיטלית ברמה עולמית.

## טכנולוגיות

Framework: Astro
CSS: Tailwind CSS עם תמיכה מלאה ב-RTL
שפה: TypeScript
בדיקות: Vitest לבדיקות יחידה, Playwright לבדיקות רספונסיביות
רספונסיביות: מלאה, breakpoints: sm, md, lg, xl

## Project Index

### סוכנים
.claude/agents/explorer.md           סורק מבנה קבצים
.claude/agents/parser.md             מחלץ פרקים ותמונות
.claude/agents/content-architect.md  מארגן מבנה התוכן
.claude/agents/organizer.md          מסדר קבצי MD
.claude/agents/translator.md         מתרגם מעברית לאנגלית
.claude/agents/ui-designer.md        מעצב קומפוננטים
.claude/agents/builder.md            בונה קוד Astro
.claude/agents/memory-keeper.md      שומר עקביות
.claude/agents/error-handler.md      מזהה ומתקן שגיאות
.claude/agents/code-reviewer.md      בודק איכות קוד
.claude/agents/quality-gate.md       שער איכות סופי

### פלט
output/{book-name}/chapter-01.he.md    פרק בעברית
output/{book-name}/chapter-01.en.md    פרק באנגלית
output/{book-name}/assets/             תמונות

## כלל בחירה: Subagents או Agent Teams

השתמש ב-Subagents כשהמשימות עצמאיות:
Explorer, Parser, Content Architect, Organizer,
Translator, UI Designer, Builder.
כל אחד עובד לבד ומחזיר תוצאה לסוכן הראשי.

השתמש ב-Agent Teams כשהסוכנים צריכים לדבר:
Memory Keeper, Error Handler, Code Reviewer.
שלושתם עובדים על אותו קומפוננט בו זמנית
ומשפיעים אחד על השני תוך כדי עבודה.

## סדר הפעלת הסוכנים

כשמקבלים קובץ Word או PDF לעיבוד:

1. הפעל Explorer על הקובץ
   קלט: נתיב הקובץ
   פלט: JSON עם מבנה הספר

2. הפעל Parser
   קלט: נתיב הקובץ + JSON מ-Explorer
   פלט: קבצי chapter-XX.he.md

3. הפעל Content Architect
   קלט: כל קבצי chapter-XX.he.md
   פלט: content-structure.json

4. הפעל Organizer
   קלט: content-structure.json + קבצי MD
   פלט: מבנה תיקיות מסודר ב-output/

5. הפעל Translator
   קלט: כל קבצי chapter-XX.he.md
   פלט: כל קבצי chapter-XX.en.md

6. הפעל UI Designer
   קלט: content-structure.json
   פלט: design-system.json

7. הפעל Builder
   קלט: כל קבצי MD + design-system.json
   פלט: קומפוננטים ב-Astro

8. הפעל במקביל: Memory Keeper, Error Handler, Code Reviewer
   קלט: פלט ה-Builder
   פלט: דוחות ממצאים

9. הפעל Quality Gate
   קלט: כל הדוחות
   פלט: אישור או דחייה

## עקרונות SOLID

כל סוכן אחראי על דבר אחד בלבד.
כל סוכן מקבל ומחזיר פורמט מוגדר.
סוכן לא יודע על המימוש הפנימי של סוכן אחר.
תלות בממשק, לא בהתנהגות פנימית.
רשימת הבדיקות ניתנת להרחבה ללא שינוי הלוגיקה.

## כללי עבודה

- תכנן לפני שאתה מבצע
- כתוב לtasks/todo.md לפני כל משימה
- אחרי כל תיקון שהמשתמש עושה, עדכן tasks/lessons.md
- שאל את עצמך: would a staff engineer approve this?
- עבוד תמיד על branch נפרד
- mobile-first בכל קומפוננט, תכנן למסך קטן ואז הרחב
- שלושת פיצ'רי הגרסה הראשונה: Reading Progress, שיתוף ציטוט, Mobile-first

## שימוש בקוד תשתית

לפני כל הרצת pipeline, הקוד הבא כבר קיים ב-src/pipeline/.
אל תכתוב קוד חדש לביצוע משימות אלו:

src/pipeline/ingest.py    קריאת קובץ Word או PDF
src/pipeline/parse.py     פירוק לפרקים לפי כותרות
src/pipeline/organize.py  סידור קבצים בתיקיות
src/pipeline/build.py     יצירת skeleton של Astro

## קריטריונים לאישור

לפני כל דיווח סיום, Quality Gate חייב לבדוק את כל
הקריטריונים ב-docs/acceptance-criteria.md ידנית.
אין לאשר בלי שכל קריטריון עבר.

## גבולות

- אל תגע בoutput/ ללא אישור מפורש
- אל תמחק קבצים, רק צור ועדכן
- אל תריץ פקודות שמשנות סביבה גלובלית
- אל תשנה design-system.json ללא אישור מפורש

## כללי Git

- עבוד תמיד על branch נפרד, לעולם לא על main
- שם ה-branch: feature/{task-name} או fix/{issue-name}
- בצע commit אחרי כל שלב עצמאי שהושלם
- הודעת commit: {type}: {description} בקיצור ובאנגלית
- אל תמזג ל-main בלי אישור מפורש
- אם משהו משתבש, עצור ודווח לפני שתמשיך

## כללי branches ו-PRs

- branch חדש לכל ספר: feature/add-{book-name}
- לעולם אל תמזג ל-main בלי אישור מפורש
- פתח PR עם תיאור מלא לפני סיום העבודה
- תיאור ה-PR חייב לכלול: שם הספר, מספר פרקים, שפות


## כללי חיסכון ב-tokens

- קרא tasks/lessons.md לפני כל משימה
- לפני כל תיקון, כתוב את אבחון הבעיה ב-tasks/todo.md
- אל תנסה יותר מפתרון אחד ללא אישור
- אם נכשלת פעמיים, עצור ודווח לפני שממשיך