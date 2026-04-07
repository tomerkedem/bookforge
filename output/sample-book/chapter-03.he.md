# פרק 2: CLAUDE.md כארכיטקטורה

## CLAUDE.md כחוקה

רוב המפתחים שמשתמשים ב-Claude Code כותבים CLAUDE.md פעם אחת, שמים בו כמה הוראות כלליות, ושוכחים ממנו. התוצאה היא סוכן שמתנהג אחרת בכל session, מקבל החלטות שגויות, וגורם לך לחזור ולתקן את אותם דברים שוב ושוב.

CLAUDE.md הוא לא README. הוא לא תיעוד. הוא החוקה של הפרויקט.

ההבדל בין מסמך לחוקה הוא פשוט: מסמך מתאר. חוקה מחייבת. כשאתה כותב ב-CLAUDE.md "אל תגע בקבצי output ללא אישור מפורש", זה לא המלצה. זה כלל שהסוכן מכבד בכל session ובכל משימה שהוא מבצע.

הסוכן קורא את CLAUDE.md בתחילת כל session. מה שלא כתבת שם, הוא יחליט לבד. ולא תמיד כמו שתרצה.

לפני שממשיכים, צור את הקבצים הבאים בשורש הפרויקט:

Mac / Linux:

Bash

touch CLAUDE.md

touch CLAUDE.local.md

touch .gitignore

mkdir tasks

touch tasks/todo.md

touch tasks/lessons.md

Windows:

Powershell

ni CLAUDE.md

ni CLAUDE.local.md

ni .gitignore

ni -ItemType Directory tasks

ni tasks\todo.md

ni tasks\lessons.md

.gitignore

הקובץ הראשון שנמלא הוא .gitignore הוא מגדיר אילו קבצים Git לא יעלה לעולם ל-GitHub.

פתח את .gitignore והוסף:

# קבצים אישיים שלא עולים ל-GitHub

CLAUDE.local.md

# תלויות

node_modules/

# קבצי סביבה

.env

.env.local

Mac / Linux:

bash

echo "CLAUDE.local.md" >> .gitignore

Windows:

powershell

Add-Content .gitignore "CLAUDE.local.md"

## CLAUDE.local.md להגדרות אישיות

יש הגדרות ששייכות לפרויקט ויש הגדרות ששייכות למכונה שלך בלבד.

CLAUDE.md עולה ל-GitHub ומשותף עם כל מי שעובד על הפרויקט. לכן הוא מכיל כללים אוניברסליים: ארכיטקטורה, גבולות, תקנים.

CLAUDE.local.md נשאר אצלך בלבד. הוא נמצא ב-.gitignore ולא עולה לשום מקום. שמים שם דברים אישיים:

markdown

# CLAUDE.local.md

## סביבה מקומית

- Python נמצא ב: C:\Python312

- Node נמצא ב: C:\Program Files\nodejs

- קובץ הספר לעיבוד: D:\Books\AI_Developer_Fitness.docx

## העדפות אישיות

- תמיד הצג התקדמות בעברית

- לפני כל פעולה destructive שאל אותי

פתח את CLAUDE.local.md וכתוב בו את הנתיבים של הסביבה שלך. זה הקובץ היחיד בפרויקט שאף אחד מלבדך לא יראה.

## tasks/todo.md ו-tasks/lessons.md

שני הקבצים האלה הם הזיכרון החי של הפרויקט.

tasks/todo.md הוא תוכנית העבודה. לפני כל משימה שהסוכן מבצע, הוא כותב לשם את התוכנית ולא מתחיל לכתוב קוד לפני שאתה מאשר. זה מונע את אחת הבעיות הנפוצות ביותר: סוכן שמתחיל לבצע ורק אחר כך מגלה שהבין את המשימה אחרת.

markdown

# tasks/todo.md

## משימה נוכחית

פירוק AI_Developer_Fitness.docx לפרקים

## תוכנית

- [ ] Explorer סורק את הקובץ ומדווח על מבנה

- [ ] Parser מחלץ כל פרק לקובץ נפרד

- [ ] Translator מתרגם כל פרק לאנגלית

- [ ] Organizer מסדר את הקבצים במבנה הנכון

## סטטוס

בביצוע

tasks/lessons.md הוא הזיכרון המצטבר. בכל פעם שאתה מתקן את הסוכן, הוא כותב לשם את הלקח. בפתיחת session חדש, הסוכן קורא את הקובץ הזה לפני שמתחיל לעבוד.

markdown

# tasks/lessons.md

## לקחים

### 2026-04-05

כשמחלצים תמונות מ-Word, חייב לשמור את שם המשתנה

המקורי ולא לשנות אותו. תמונה ששמה השתנה שוברת

את ההפניה בתוך קובץ ה-MD.

### 2026-04-05

Translator לא מתרגם כותרות עם מספרים. צריך

להוסיף לו הוראה מפורשת לכך.

אחרי שבוע של עבודה, lessons.md הוא המסמך הכי יקר בפרויקט. הוא מכיל את כל מה שלמדת על האופן שבו הסוכנים שלך מתנהגים.

מי כותב ל-lessons.md? שניהם. הסוכן כותב כשהוא מתקן שגיאה בעצמו, Error Handler מוגדר לכתוב אחרי כל תיקון. אתה כותב כשאתה מגלה תובנה ארכיטקטונית שהסוכן לא יכול לדעת לבד.

מי קורא את lessons.md? הסוכן קורא אותו בתחילת כל session לפני שהוא מתחיל לעבוד. זה מה שמאפשר לו לדעת מראש מה לא לעשות, בלי לשאול אותך ובלי לחזור שוב על טעויות ישנות.

Claude Code לא זוכר בין sessions. כל session מתחיל מאפס. lessons.md הוא מה שמחבר בין sessions ומונע מהמערכת לחזור על אותן טעויות שוב ושוב. זהו הזיכרון של המערכת.

פתח את שני הקבצים והוסף כותרת ראשונית:

tasks/todo.md:

markdown

# tasks/todo.md

## משימה נוכחית

_תתעדכן לפני כל משימה_

tasks/lessons.md:

markdown

# tasks/lessons.md

## לקחים

_יתעדכן לאחר כל תיקון_

הקוד בפעולה

הקוד המלא של פרק זה זמין ב:  https://github.com/tomkedem/bookforge

עיין בשינויים, הרץ, ושאל שאלות ישירות ב-Issues.

## Project Index למניעת קריאות כפולות

אחת הבעיות הנפוצות ביותר במערכות סוכנים היא קריאות כפולות. הסוכן פותח את אותו קובץ שוב ושוב, שורף tokens מיותרים, ומאט את כל הפרויקט. מחקר שנעשה על 132 sessions הראה ש-71% מכלל קריאות הקבצים היו קבצים שהסוכן כבר פתח באותו session.

הפתרון הוא Project Index, מפה של הפרויקט שהסוכן קורא פעם אחת בתחילת כל session ומשתמש בה כדי לדעת מה יש בכל קובץ לפני שהוא פותח אותו.

Project Index נכתב ישירות בתוך CLAUDE.md:

markdown

## Project Index

### קבצי מקור

src/pipeline/ingest.py       קריאת קובץ Word או PDF וחילוץ טקסט גולמי

src/pipeline/parse.py        פירוק לפרקים לפי כותרות

src/pipeline/organize.py     בניית מבנה קבצי MD לפי שפה

src/pipeline/build.py        יצירת skeleton של אפליקציית Astro

### סוכנים

.claude/agents/explorer.md      סורק מבנה קבצים

.claude/agents/parser.md        מחלץ פרקים ותמונות

.claude/agents/translator.md    מתרגם מעברית לאנגלית

.claude/agents/organizer.md     מסדר קבצי MD

.claude/agents/ui-designer.md   מעצב קומפוננטים

.claude/agents/builder.md       בונה קוד Astro

### פלט

output/{book-name}/chapter-01.he.md    פרק בעברית

output/{book-name}/chapter-01.en.md    פרק באנגלית

output/{book-name}/assets/             תמונות

כל פעם שמוסיפים קובץ חדש לפרויקט, מעדכנים את ה-Index. הסוכן לא צריך לסרוק את הפרויקט מאפס בכל session, הוא כבר יודע מה יש ואיפה.

פתח את CLAUDE.md והוסף את ה-Project Index שלך. עדכן אותו לפי מבנה הפרויקט הספציפי שלך.

## הקוד בפעולה

הקוד המלא של פרק זה זמין ב:  https://github.com/tomkedem/bookforge

עיין בשינויים, הרץ, ושאל שאלות ישירות ב-Issues.

מה יש עכשיו ב-GitHub

bookforge/

├── README.md

├── CLAUDE.md

├── .gitignore

├── docs/

│   └── architecture-thinking.md

└── tasks/

├── todo.md

└── lessons.md

לפרק הכנה הבאנו README.md. פרק 1 הביא את architecture-thinking.md. פרק 2 הביא את CLAUDE.md, .gitignore, ואת תיקיית tasks.

הפרויקט מתחיל לקבל צורה. עדיין אין קוד. עדיין אין סוכנים. אבל יש ארכיטקטורה, חוקה, וזיכרון.
