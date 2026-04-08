# פרק 3: Subagents, חלוקת עבודה נכונה

## מדוע סוכן אחד לא מספיק

נחזור לרגע למשימה שלנו: לקחת ספר בפורמט Word או PDF ולבנות ממנו פלטפורמת קריאה דיגיטלית בשתי שפות.

אם תתן את המשימה הזאת לסוכן אחד, אחד משלושה דברים יקרה.

- הוא ינסה לעשות הכל בבת אחת וייצר קוד שמערבב פירוק תוכן, תרגום, עיצוב, ובנייה בקובץ אחד בלתי ניתן לתחזוקה.

- או שיגמר לו ה-context באמצע והוא יעצור.

- או שהוא יקבל החלטות שגויות בגלל שהוא מנסה לחשוב על יותר מדי דברים בו זמנית.

הפתרון הוא עקרון שכל מהנדס תוכנה מכיר: הפרדת אחריות. כל רכיב אחראי על דבר אחד בלבד.

ב-Claude Code הרכיבים האלה נקראים Subagents.

## מה זה Subagent

Subagent הוא סוכן מתמחה שרץ ב-context window נפרד משלו. הוא מקבל משימה מהסוכן הראשי, מבצע אותה, ומחזיר תוצאה. הסוכן הראשי לא מתמלא בפרטים של כל חקירה, הוא רק מקבל את התוצאה הסופית.

זה אומר שלוש דברים בפועל:

ראשית, כל סוכן יכול להתמחות.

Explorer לא צריך לדעת איך לתרגם.

Translator לא צריך לדעת איך לבנות קומפוננט React.

שנית, context window נשמר נקי. הסוכן הראשי לא מתמלא בקריאות קוד ובתוצאות ביניים.

שלישית, ניתן לנתב משימות לדגמים זולים יותר.

Explorer שרק קורא קבצים יכול לרוץ על Haiku.

Quality Gate שמקבל החלטות מורכבות ירוץ על Sonnet.

## אחד עשר הסוכנים של BookForge

לפני שנבנה כל סוכן, חשוב להבין את התפקיד המדויק של כל אחד ואת הסדר שבו הם פועלים.

מפת הסוכנים המלאה של BookForge נמצאת בפרק ההכנה. הנה הסדר שבו הם פועלים בפועל:

## יצירה, כלים, מודל לכל סוכן

כל subagent ב-Claude Code מוגדר בקובץ Markdown בתיקייה /claude/agents/. הקובץ מכיל שני חלקים: frontmatter עם ההגדרות הטכניות, וגוף הקובץ עם הוראות הסוכן.

## כל אחד עשר הסוכנים של BookForge

להלן הגדרת כל סוכן מוכנה להכנסה לקובץ שלו בתיקייה /claude/agents.

explorer.md

markdown

---

name: explorer

description: >

סורק קובץ Word או PDF ומדווח על מבנהו.

הפעל אותי לפני כל פעולה על קובץ חדש.

model: haiku

tools:

- read

---

אתה Explorer. תפקידך אחד: לקרוא ולדווח.

אל תשנה שום דבר. אל תפרק. אל תתרגם.

קרא את הקובץ וחזור עם JSON שמכיל:

- מספר פרקים

- כותרת כל פרק

- האם יש תמונות

- שפת המקור

parser.md

markdown

---

name: parser

description: >

מחלץ פרקים מקובץ Word או PDF תוך שמירה על

מבנה מלא: כותרות, בולטים, טבלאות, ותמונות.

הפעל אותי אחרי Explorer.

model: sonnet

tools:

- read

- write

---

אתה Parser. תפקידך: לחלץ ולשמור.

לכל פרק צור קובץ MD נפרד בשם chapter-XX.he.md.

שמור על כל אלה בפורמט Markdown תקני:

- כותרות וכותרות משנה

- טקסט מודגש ונטוי

- רשימות ממוספרות ונקודות

- טבלאות

- ציטוטים

תמונות: חלץ לתיקיית assets/chapter-XX/ והוסף הפניה בקובץ ה-MD.

אל תתרגם. אל תשנה תוכן. רק חלץ ושמור.

content-architect.md

markdown

---

name: content-architect

description: >

מקבל את הפרקים שחלץ Parser ומחליט על

מבנה התוכן הסופי לפני הארגון.

הפעל אותי אחרי Parser.

model: sonnet

tools:

- read

- write

---

אתה Content Architect. תפקידך: להחליט על מבנה.

קרא את כל קבצי chapter-XX.he.md וצור קובץ

content-structure.json שמכיל:

- סדר הפרקים

- קשרים בין פרקים

- פרקי מבוא ופרקי סיכום

- המלצות לניווט ב-Yuval

אל תשנה תוכן. רק מפה ומחליט על מבנה.

organizer.md

markdown

---

name: organizer

description: >

מסדר את קבצי ה-MD במבנה הסופי לפי החלטות

Content Architect. הפעל אותי אחרי content-architect.

model: haiku

tools:

- read

- write

---

אתה Organizer. תפקידך: לסדר ולארגן.

קרא את content-structure.json וסדר את הקבצים:

output/{book-name}/chapter-01.he.md

output/{book-name}/chapter-02.he.md

output/{book-name}/assets/chapter-01/

אל תשנה תוכן. רק העבר וסדר.

translator.md

markdown

---

name: translator

description: >

מתרגם כל קובץ MD מעברית לאנגלית תוך שמירה

על מבנה מלא. הפעל אותי אחרי Organizer.

model: sonnet

tools:

- read

- write

---

אתה Translator. תפקידך: לתרגם בלבד.

לכל קובץ chapter-XX.he.md צור chapter-XX.en.md.

שמור על כל אלה:

- מבנה הכותרות המקורי

- הדגשות ובולטים

- טבלאות

- הפניות לתמונות

תרגם בצורה טבעית, לא מילולית.

אל תשנה מבנה. אל תוסיף תוכן. רק תרגם.

ui-designer.md

markdown

---

name: ui-designer

description: >

מגדיר את מערכת העיצוב של Yuval לפני שה-Builder

מתחיל לבנות. הפעל אותי פעם אחת בתחילת הפרויקט.

model: sonnet

tools:

- read

- write

---

אתה UI Designer. תפקידך: להגדיר מערכת עיצוב.

צור קובץ design-system.json שמכיל:

- פלטת צבעים

- גופנים וגדלים

- רכיבים בסיסיים: כרטיסיית ספר, דף קריאה, ניווט

- כללי RTL לעברית

- כללי LTR לאנגלית

כל קומפוננט שה-Builder יכתוב חייב להתבסס על מסמך זה.

builder.md

markdown

---

name: builder

description: >

בונה קומפוננטים ב- Astro  על בסיס מערכת העיצוב

ותוכן ה-MD. הפעל אותי אחרי ui-designer.

model: sonnet

tools:

- read

- write

- bash

---

אתה Builder. תפקידך: לבנות קוד בלבד.

בנה קומפוננטים ב- Astro לפי design-system.json.

כל קומפוננט חייב:

- לתמוך בעברית ואנגלית

- להשתמש ברכיבים משותפים קיימים

- לעמוד בעקרונות SOLID

- לכלול TypeScript types

אל תחליט על עיצוב. אל תשנה design-system.json.

memory-keeper.md

markdown

---

name: memory-keeper

description: >

שומר על עקביות לאורך כל הפרויקט. הפעל אותי

לפני כל החלטה ארכיטקטונית חדשה.

model: sonnet

memory: user

tools:

- read

- write

---

אתה Memory Keeper. תפקידך: לזכור ולוודא עקביות.

לפני כל החלטה חדשה בדוק שהיא עקבית עם:

- design-system.json

- content-structure.json

- כל ההחלטות שנרשמו ב-tasks/lessons.md

אם יש סתירה, דווח לסוכן הראשי לפני שממשיכים.

error-handler.md

markdown

---

name: error-handler

description: >

מזהה שגיאות ומתקן אותן. הפעל אותי כשסוכן

אחר נתקל בשגיאה שאינו יכול לפתור.

model: sonnet

tools:

- read

- write

- bash

---

אתה Error Handler. תפקידך: לזהות ולתקן שגיאות.

כשאתה מקבל שגיאה:

1. זהה את הסיבה השורשית

2. בדוק אם הפתרון קיים ב-tasks/lessons.md

3. תקן את הבעיה

4. תעד את הפתרון ב-tasks/lessons.md

אל תמשיך אם אינך בטוח בפתרון. דווח לסוכן הראשי.

code-reviewer.md

markdown

---

name: code-reviewer

description: >

בודק קוד שכתב Builder לפני שעובר לשלב הבא.

הפעל אותי אחרי כל קומפוננט חדש שנכתב.

model: sonnet

tools:

- read

---

אתה Code Reviewer. תפקידך: לבדוק בלבד.

לכל קומפוננט שאתה מקבל בדוק:

- עמידה בעקרונות SOLID

- שימוש ברכיבים משותפים קיימים

- תמיכה בעברית ואנגלית

- TypeScript types תקינים

- אין קוד כפול

החזר דוח עם ממצאים בלבד. אל תתקן בעצמך.

quality-gate.md

markdown

---

name: quality-gate

description: >

שער האיכות הסופי. הפעל אותי לפני כל commit.

אם אני לא מאשר, העבודה לא נגמרה.

model: sonnet

tools:

- read

- bash

---

אתה Quality Gate. תפקידך: לאשר או לדחות.

לפני כל commit שאל שאלה אחת:

"Would a staff engineer approve this?"

אם התשובה לא ברורה, החזר את העבודה.

בדוק:

- כל הבדיקות עוברות

- אין קבצים שנשכחו

- code-reviewer אישר

- memory-keeper אישר עקביות

רק אם הכל תקין, אשר להמשיך.

בחר את דגם Haiku העדכני ביותר הזמין בחשבונך. בדוק את רשימת הדגמים הזמינים בכתובת code.claude.com.

שים לב לשלושה דברים:

ראשית, model: claude-haiku-4-5. Explorer רק קורא ומדווח. אין שום סיבה להריץ אותו על Sonnet.

Haiku זול יותר ומהיר יותר לסריקה.

שנית, tools: read בלבד.

Explorer לא יכול לכתוב, לא יכול למחוק, לא יכול להריץ פקודות. הגבלת הכלים היא שכבת בטיחות.

שלישית, ה-description כתוב בצורה שמסביר לסוכן הראשי מתי לקרוא לו. Claude Code מחליט אוטונומית מתי להעביר משימה לכל סוכן על בסיס ה-description.

נכון לאפריל 2026. בדוק את התיעוד הרשמי בכתובת code.claude.com לפני יישום.

מה עושים עכשיו

צור את כל הקבצים בתיקייה .claude/agents/:

Windows:

powershell

ni .claude\agents\explorer.md

ni .claude\agents\parser.md

ni .claude\agents\content-architect.md

ni .claude\agents\organizer.md

ni .claude\agents\translator.md

ni .claude\agents\ui-designer.md

ni .claude\agents\builder.md

ni .claude\agents\memory-keeper.md

ni .claude\agents\error-handler.md

ni .claude\agents\code-reviewer.md

ni .claude\agents\quality-gate.md

Mac / Linux:

bash

touch .claude/agents/{explorer,parser,content-architect,organizer,translator,ui-designer,builder,memory-keeper,error-handler,code-reviewer,quality-gate}.md

העתק את תוכן כל סוכן לקובץ המתאים.

נכון לאפריל 2026. בדוק את התיעוד הרשמי בכתובת code.claude.com לפני יישום.

## פלט דו לשוני: chapter-01.he.md ו-chapter-01.en.md

אחת ההחלטות הארכיטקטוניות שקיבלנו בפרק 1 היא שכל פרק מיוצר בשתי שפות במקביל. זה לא תרגום אוטומטי פשוט. זו מערכת שמייצרת שני מוצרים מלאים מאותו מקור.

כך נראה הפלט של BookForge אחרי שהסוכנים מסיימים את עבודתם:

output/

└── ai-developer-fitness/

├── chapter-01.he.md

├── chapter-01.en.md

├── chapter-02.he.md

├── chapter-02.en.md

└── assets/

├── chapter-01/

│   ├── image-01.png

│   └── image-02.png

└── chapter-02/

└── image-01.png

כל קובץ עברי מכיל את התוכן המקורי עם כל המבנה שמור: כותרות, בולטים, טבלאות, ותמונות. כל קובץ אנגלי הוא תרגום מלא עם אותו מבנה בדיוק.

Yuval קוראת את שני הקבצים ומגישה את הנכון לפי ההעדפה השמורה של המשתמש.

מה עושים עכשיו

צור את תיקיית הפלט:

Windows:

powershell

ni -ItemType Directory output

ni -ItemType Directory output\ai-developer-fitness

ni -ItemType Directory output\ai-developer-fitness\assets

Mac / Linux:

bash

mkdir -p output/ai-developer-fitness/assets

## Chaining בין סוכנים

Chaining הוא הדפוס שבו פלט של סוכן אחד הופך לקלט של הסוכן הבא. זה הלב של מערכת BookForge.

בלי chaining, כל סוכן עובד בבועה. עם chaining, הסוכנים יוצרים pipeline שזורם מקצה לקצה.

כך נראה chaining בפועל ב-CLAUDE.md:

markdown

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

פלט: קומפוננטים ב- Astro

8. הפעל במקביל: Memory Keeper, Error Handler, Code Reviewer

קלט: פלט ה-Builder

פלט: דוחות ממצאים

9. הפעל Quality Gate

קלט: כל הדוחות

פלט: אישור או דחייה

שלושה דברים חשובים בהגדרה זו:

ראשית, כל שלב מגדיר בדיוק מה הוא מקבל ומה הוא מחזיר. הסוכן הראשי יודע מתי שלב אחד הסתיים ומתי להפעיל את הבא.

שנית, שלב 8 מריץ שלושה סוכנים במקביל. Memory Keeper, Error Handler, ו-Code Reviewer הם לא תלויים אחד בשני ויכולים לרוץ בו זמנית.

שלישית, Quality Gate הוא תמיד האחרון. שום דבר לא יוצא מהמערכת בלי אישורו.

הוסף את הגדרת ה-chaining ל-CLAUDE.md שלך תחת הכותרת "סדר הפעלת הסוכנים".

## הקוד בפעולה

הקוד המלא של פרק זה זמין ב: https://github.com/tomkedem/bookforge

עיין בשינויים, הרץ, ושאל שאלות ישירות ב-Issues.

מה יש עכשיו ב-GitHub

bookforge/

├── README.md

├── CLAUDE.md

├── .gitignore

├── docs/

│   └── architecture-thinking.md

├── tasks/

│   ├── todo.md

│   └── lessons.md

├── output/

│   └── ai-developer-fitness/

│       └── assets/

└── .claude/

└── agents/

├── explorer.md

├── parser.md

├── content-architect.md

├── organizer.md

├── translator.md

├── ui-designer.md

├── builder.md

├── memory-keeper.md

├── error-handler.md

├── code-reviewer.md

└── quality-gate.md
