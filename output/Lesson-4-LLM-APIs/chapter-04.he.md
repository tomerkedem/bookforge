# עבודה מעשית עם Anthropic API - מעבר ראשון מקונספט לקוד אמיתי

עד עכשיו השיעור עסק בעיקר בהבנת העולם של מודלי LLM:

- אילו מודלים קיימים

- איך בוחרים מודל

- מה ההבדל בין ספקים

- מה זה Tokens

- ומהם השיקולים הארכיטקטוניים בעבודה עם AI

אבל בשלב הזה המרצה עצר את ההסברים התאורטיים ועבר לחלק החשוב באמת: עבודה עם קוד אמיתי.

זו הייתה נקודת מעבר משמעותית מאוד בשיעור.

עד עכשיו דיברנו על AI כמושג. 
מכאן מתחילים לעבוד איתו כמו מהנדסי תוכנה.

המרצה פתח פרויקט חדש והתחיל לבנות צעד אחר צעד סביבת עבודה בסיסית שמתקשרת ישירות עם מודלי Anthropic דרך API. לאורך ההדגמה הוא כתב את כל הקבצים בזמן אמת והראה כיצד מערכת Python פשוטה יכולה להתחיל לעבוד מול מודל שפה אמיתי.

הקוד המלא של כל הדוגמאות זמין ב-GitHub:

```bash
https://github.com/tomerkedem/ai-engineering-course
```

המרצה הדגיש שהמטרה של החלק הזה אינה רק "להצליח לשלוח Prompt".

המטרה היא להבין כיצד מערכות AI אמיתיות בנויות:

- איך מנהלים ספריות

- איך עובדים עם API Keys

- איך שולחים Requests

- איך מקבלים Responses

- איך עובדים עם Streaming

- איך מחלצים מידע מובנה

- ואיך מודל AI מתחיל להפוך לחלק אינטגרלי מתוך מערכת תוכנה

בניגוד לדוגמאות קצרות באתרי דמו, כאן אנחנו כבר עובדים מול קוד אמיתי שמדמה סביבת פיתוח מקצועית.

## קובץ requirements.txt - בניית סביבת העבודה הראשונה

הקובץ הראשון שהמרצה יצר היה:

requirements.txt

זהו אחד הקבצים הבסיסיים ביותר כמעט בכל פרויקט Python מודרני.

המטרה של הקובץ היא להגדיר בצורה מסודרת אילו ספריות הפרויקט צריך כדי לעבוד.

בקובץ הזה הופיעו שתי ספריות בלבד:

anthropic 
dotenv

למרות שזה נראה קטן ופשוט, הקובץ הזה הוא למעשה הבסיס לכל סביבת העבודה.

**למה בכלל צריך requirements.txt**

המרצה הסביר שבעולם האמיתי אנחנו כמעט אף פעם לא עובדים לבד.

פרויקט תוכנה צריך להיות:

- ניתן לשחזור

- ניתן להעברה

- וניתן להרצה גם אצל מפתחים אחרים

כאשר מישהו מוריד את הפרויקט מה-GitHub, הוא צריך לדעת בדיוק אילו ספריות להתקין כדי שהקוד יעבוד.

ללא קובץ כזה עלולות להופיע בעיות כמו:

- גרסאות שונות של ספריות

- חוסרים בסביבת העבודה

- קוד שלא רץ אצל מפתחים אחרים

- או התנהגות שונה בין מחשבים

זו הסיבה ש-requirements.txt הפך לסטנדרט בעולם Python.

**הספרייה anthropic**

הספרייה הראשונה היא:

Anthropic

זו הספרייה הרשמית של Anthropic לעבודה מול ה-API שלהם.

המרצה הסביר שהספרייה הזו היא למעשה SDK.

כלומר, שכבת תוכנה שמקלה מאוד על העבודה מול שירות ה-AI.

בלי SDK היינו צריכים:

- לבנות Requests ידנית

- לעבוד ישירות מול HTTP

- לנהל Headers

- לטפל ב-Authentication

- לבצע Parsing של JSON

- ולכתוב הרבה קוד טכני נוסף

ה-SDK מסתיר מאחוריו את רוב המורכבות הזו.

במקום לכתוב עשרות שורות של HTTP Requests, אפשר לעבוד עם אובייקטים ופונקציות ברמה גבוהה יותר.

לדוגמה:

```python
client.messages.create(...)
```

זו דוגמה מצוינת למה ש-SDK עושה:

הוא הופך תקשורת מורכבת מול API לחוויית פיתוח פשוטה ונוחה יותר.

**הספרייה dotenv**

הספרייה השנייה היא:

Dotenv

הספרייה הזו משמשת לטעינת משתני סביבה מתוך קובץ env.

זו נקודה חשובה מאוד בעולם האמיתי.

כדי לעבוד מול Anthropic API חייבים API Key.

ה-API Key הוא למעשה מפתח גישה פרטי שמאפשר לאפליקציה שלנו להשתמש במודל.

המרצה הדגיש שאסור לכתוב API Keys ישירות בתוך קוד המקור.

לדוגמה, זה נחשב רע מאוד:

```python
api_key = "sk-xxxxxxxx"
```

למה?

כי ברגע שהקוד עולה ל-GitHub, המפתח נחשף.

ודליפת API Key יכולה לגרום ל:

- שימוש לא מורשה

- עלויות כספיות

- גישה לא חוקית

- ואפילו פגיעה במערכת

במקום זאת עובדים עם קובץ:

.env

ובתוכו:

```python
ANTHROPIC_API_KEY=your_secret_key
```

הספרייה dotenv טוענת את הערכים האלה בזמן הריצה והופכת אותם לזמינים מתוך הקוד.

כך אפשר:

- להפריד סודות מהקוד

- לעבוד בצורה בטוחה יותר

- ולמנוע דליפת מידע רגיש

**התקנת הספריות**

לאחר יצירת הקובץ, המרצה הריץ:

```bash
pip install -r requirements.txt
```

הפקודה הזו אומרת ל-Python:

- לקרוא את הקובץ

- להתקין את כל הספריות שמופיעות בו

- ולהכין את סביבת העבודה

זהו שלב קטן, אבל מאוד משמעותי.

זו למעשה הפעם הראשונה שבה סביבת העבודה שלנו מתחילה להפוך ממחשב רגיל לסביבת AI Development אמיתית.

**למה זה חשוב ב-AI Engineering**

המרצה ניסה להעביר כאן מסר חשוב:

לפני שמתחילים לעבוד עם מודלי AI, צריך קודם לבנות סביבת עבודה מקצועית.

AI Engineering אינו רק Prompt.

הוא מתחיל מ:

- ניהול ספריות

- סביבות עבודה

- Secrets

- APIs

- Dependency Management

- ואבטחת מידע בסיסית

כלומר, עוד לפני הבקשה הראשונה למודל, אנחנו כבר נכנסים לעולם הנדסי אמיתי.



## קובץ 1_anthropic_api_request.py - בקשת ה-API הראשונה למודל

לאחר שהמרצה סיים להקים את סביבת העבודה ולהתקין את הספריות הדרושות, הוא עבר לרגע המרכזי הראשון של החלק המעשי: שליחת בקשת API אמיתית למודל של Anthropic.

לצורך ההדגמה נוצר הקובץ:

1_anthropic_api_request.py

זהו למעשה הקוד הראשון בפרויקט שמדבר ישירות עם מודל שפה אמיתי. 
למרות שהקובץ קצר יחסית, הוא מכיל כמעט את כל אבני היסוד של עבודה מול APIs של מודלי AI.

הקוד המלא:

```python
import anthropic
from dotenv import load_dotenv
import os

load_dotenv()

anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(
    api_key=anthropic_api_key
)

message = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=1000,
    temperature=0,
    messages=[
        {
            "role": "user",
            "content": "say hello to me",
        }
    ],
)

print(message.content[0].text)
```

**import anthropic - טעינת ה-SDK**

הקוד מתחיל בטעינת ספריית Anthropic:

```python
import anthropic
```

הספרייה הזו היא ה-SDK הרשמי שמאפשר לנו לעבוד מול ה-API בצורה פשוטה יותר.

המרצה הדגיש שבלי SDK היינו צריכים לבנות לבד:

- HTTP Requests

- Authentication

- JSON Parsing

- Headers

- Error Handling

ה-SDK עוטף עבורנו את כל המורכבות הזו ומאפשר לעבוד מול המודל ברמת קוד הרבה יותר גבוהה ונוחה.

**load_dotenv - טעינת משתני סביבה**

בהמשך מופיעה השורה:

```python
load_dotenv()
```

המטרה שלה היא לטעון את משתני הסביבה מתוך קובץ env.

**המרצה חזר כאן שוב על אחת מנקודות האבטחה החשובות ביותר:**

אסור לכתוב API Keys ישירות בתוך הקוד.

במקום זאת, שומרים אותם בקובץ חיצוני:

```python
ANTHROPIC_API_KEY=your_secret_key
```

ורק בזמן הריצה טוענים אותם לתוך האפליקציה.

זו גישה סטנדרטית בעולם התוכנה משום שהיא:

- מונעת דליפת סודות

- מאפשרת עבודה בסביבות שונות

- מקלה על Deployment

- ומונעת העלאה של Keys ל-GitHub

בנוסף לשמירת ה-API Key בקובץ env, המרצה הדגיש שחייבים לעדכן גם את קובץ gitignore.

הסיבה פשוטה:

קובץ env אמנם מפריד את הסוד מהקוד, אבל אם לא מוסיפים אותו ל-gitignore, הוא עדיין עלול לעלות בטעות ל-GitHub.

לכן התהליך הנכון הוא כפול:

```python
ANTHROPIC_API_KEY=your_secret_key
```

ובקובץ gitignore מוסיפים:

```python
.env
```

כך אנחנו משיגים שני דברים יחד:

הקוד יודע לקרוא את המפתח בזמן ריצה, אבל Git מתעלם מהקובץ ולא מעלה אותו לרפוזיטורי.

**os.getenv - קריאת ה-API Key**

לאחר טעינת ה-Environment Variables מופיעה השורה:

```python
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
```

השורה הזו שולפת את הערך מתוך משתני הסביבה.

אם הכול מוגדר נכון, המשתנה anthropic_api_key יכיל את המפתח הסודי שנדרש כדי להזדהות מול Anthropic API.

המרצה הסביר שזהו למעשה שלב ה-Authentication מול ספק ה-AI.

בלי API Key:

- אי אפשר לשלוח Requests

- אין הרשאות

- והשרת ידחה את הבקשה

**יצירת Client**

השלב הבא הוא יצירת אובייקט Client:

```python
client = anthropic.Anthropic(
    api_key=anthropic_api_key
)
```

ה-Client הוא האובייקט שמנהל את כל התקשורת מול Anthropic.

המרצה הסביר שאפשר לחשוב עליו כעל "שער הכניסה" לעולם ה-API.

דרכו:

- שולחים Requests

- מקבלים Responses

- ומבצעים פעולות מול המודל

במערכות אמיתיות ה-Client הזה לעיתים הופך לרכיב מרכזי מאוד באפליקציה.

**client.messages.create - שליחת הבקשה למודל**

זהו הלב האמיתי של הקוד:

```python
client.messages.create(...)
```

כאן האפליקציה שולחת Request אמיתי למודל.

המרצה הסביר שבפועל מאחורי הקלעים מתרחש תהליך שלם:

<img src="/Lesson-4-LLM-APIs/assets/image-01.png" alt="image-01.png" width="709" height="334" />


כלומר, גם אם זה נראה כמו פונקציית Python רגילה, בפועל זו קריאת רשת למערכת AI מרוחקת.

**model - בחירת המודל**

```python
model="claude-haiku-4-5"
```

כאן בוחרים איזו גרסת מודל להפעיל.

המרצה הסביר ש-Haiku הוא מודל קטן ומהיר יחסית, שמתאים במיוחד:

- למהירות תגובה

- עלות נמוכה

- ובקשות פשוטות יחסית

במערכות אמיתיות נהוג לבחור מודלים שונים למשימות שונות.

**max_tokens - גודל תשובה מקסימלי**

```python
max_tokens=1000
```

הפרמטר הזה קובע כמה Tokens המודל רשאי להחזיר בתשובה.

המרצה חזר והדגיש שטוקנים הם המשאב המרכזי בעולם ה-LLMs:

- הם משפיעים על עלות

- Latency

- וגודל ה-Response

**temperature - שליטה באקראיות**

```python
temperature=0
```

המרצה הסביר שבערך 0 המודל הופך להיות הרבה יותר יציב ודטרמיניסטי.

כלומר:

- פחות יצירתיות

- פחות variability

- פחות hallucinations

- ויותר עקביות

למערכות Production זו בדרך כלל ברירת מחדל טובה יחסית.

**messages - השיחה עם המודל**

```python
messages=[
    {
        "role": "user",
        "content": "say hello to me",
    }
]
```

כאן נשלחת ההודעה עצמה.

המרצה הסביר שמודלים מודרניים עובדים במבנה של Messages ולא Prompt יחיד.

לכל הודעה יש:

<div dir="rtl">

| **רכי**ב | **משמעות** |
| --- | --- |
| **role** | מי שלח את ההודעה |
| **content** | תוכן ההודעה |

</div>

**במקרה הזה:**

המשתמש ביקש מהמודל להגיד שלום

זו דוגמה פשוטה מאוד, אבל היא מדגימה את המבנה האמיתי שבו עובדות מערכות AI מודרניות.

**Response - קבלת התשובה**

לבסוף:

```python
print(message.content[0].text)
```

כאן אנחנו שולפים את הטקסט מתוך ה-Response שהמודל החזיר.

נקודה חשובה: משתמשים ב-[0] כי content הוא מערך, גם אם בפועל חזר רק קטע טקסט אחד.

המרצה הדגיש נקודה חשובה מאוד:

ה-Response של מודל אינו רק String רגיל.

בדרך כלל מדובר במבנה JSON מורכב שמכיל:

- תוכן

- Usage

- Metadata

- Token Counts

- Model Information

- ולעיתים גם Tool Calls

אנחנו פשוט שולפים מתוכו את הטקסט עצמו.

**למה הקובץ הזה חשוב כל כך**

למרות שמדובר בפחות מ-20 שורות קוד, הקובץ הזה מדגים כמעט את כל עקרונות היסוד של עבודה מול מודלי AI:

- עבודה עם SDK

- Authentication

- Environment Variables

- יצירת Requests

- שליטה במודל

- ניהול Tokens

- וקבלת Responses

זו למעשה הפעם הראשונה שבה AI מפסיק להיות "אתר שמדברים איתו" והופך לחלק אינטגרלי מתוך תוכנה אמיתית.



## קובץ 2_anthropic_api_streaming.py - עבודה עם Streaming Responses

לאחר שהמרצה הראה כיצד לשלוח בקשת API רגילה ולקבל תשובה מלאה מהמודל, הוא עבר לאחד המנגנונים החשובים ביותר במערכות AI מודרניות: Streaming.

לצורך ההדגמה נוצר הקובץ:

2_anthropic_api_streaming.py

הקוד המלא:

```python
import anthropic

client = anthropic.Anthropic()

with client.messages.stream(
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "write 500 words about the history of the internet"
        }
    ],
    model="claude-haiku-4-5",
) as stream:

    for text in stream.text_stream:
        print(text, end="", flush=True)
```



**למה בכלל צריך Streaming**

המרצה הסביר שבקריאת API רגילה האפליקציה שולחת בקשה וממתינה עד שכל התשובה מוכנה.

כלומר:

<img src="/Lesson-4-LLM-APIs/assets/image-02.png" alt="image-02.png" width="362" height="556" />


בגישה הזו המשתמש לא רואה שום דבר עד שהמודל מסיים לייצר את כל התשובה.

במערכות קטנות זה אולי נראה בסדר, אבל בעולם האמיתי זה יוצר בעיה משמעותית מאוד בחוויית המשתמש.

אם המודל צריך:

- לכתוב טקסט ארוך

- לבצע reasoning מורכב

- לנתח מסמך

- או ליצור קוד

זמן ההמתנה עלול להיות ארוך יחסית.

המרצה הדגיש שברגע שהמשתמש מחכה יותר מדי זמן בלי לראות תגובה, המערכת מתחילה להרגיש:

- איטית

- תקועה

- או לא יציבה

וכאן נכנס Streaming.

**מה זה Streaming**

במקום לחכות שכל התשובה תהיה מוכנה, המודל שולח את הטקסט בהדרגה תוך כדי היצירה שלו.

כלומר:

<img src="/Lesson-4-LLM-APIs/assets/image-03.png" alt="image-03.png" width="710" height="473" />


בדיוק כמו ב-ChatGPT.

המשתמש מתחיל לראות את התשובה כמעט מיד, גם אם המודל עדיין ממשיך לחשב את ההמשך.

זו אחת הסיבות שחוויית שימוש במודלי AI מודרניים מרגישה הרבה יותר טבעית ואינטראקטיבית.

```python
client.messages.stream
```

הלב של הקוד הוא:

```python
client.messages.stream(...)
```

במקום להשתמש ב:

```python
client.messages.create(...)
```

אנחנו פותחים Streaming Session.

המרצה הסביר שמאחורי הקלעים זה עובד בצורה שונה לחלוטין.

במקום Response אחד גדול, השרת שולח זרם מתמשך של חלקי מידע.

כל פעם שהמודל מייצר עוד Tokens, הם נשלחים מיידית חזרה לאפליקציה.

**with ... as stream - ניהול בטוח של Streaming**

חשוב להסביר את השורה:

```python
with client.messages.stream(...) as stream:
```

with הוא מנגנון חשוב מאוד ב-Python שנקרא:

Context Manager

המטרה שלו היא לנהל משאבים בצורה בטוחה ואוטומטית.

במקרה הזה מדובר בחיבור Streaming שנשאר פתוח בזמן שהמודל שולח Tokens בהדרגה.

ה-with דואג לשלושה דברים:

- פתיחת החיבור

- עבודה עם ה-Stream

- וסגירה אוטומטית של החיבור בסיום

גם אם מתרחשת שגיאה באמצע.

בלי with, המפתח היה צריך לזכור לסגור את החיבור ידנית, אחרת עלולות להיווצר בעיות כמו Connections פתוחים או Resource Leaks.

זו הסיבה ש-with נחשב לדרך בטוחה, נקייה ו-Pythonic לעבודה עם Streams, קבצים, Database Connections ומשאבים נוספים.

**stream.text_stream**

לאחר פתיחת ה-Stream מופיעה הלולאה:

```python
for text in stream.text_stream:
```

זו אחת השורות החשובות ביותר בקובץ.

המרצה הסביר ש-text_stream הוא Generator שמחזיר חלקים קטנים של טקסט בזמן אמת.

כל Iteration בלולאה מחזיר עוד חלק מהתשובה שהמודל מייצר כרגע.

כלומר:

```python
"The "
"history "
"of "
"the "
"internet ..."
```

הטקסט מגיע בהדרגה.

**print(... flush=True)**

```python
print(text, end="", flush=True)
```

כאן המרצה עצר להסביר פרט קטן אבל חשוב מאוד.

הפרמטר:

```python
flush=True
```

מאלץ את Python להדפיס את הטקסט מיידית למסך.

בלי flush, Python עלול לשמור את הפלט ב-buffer ורק אחר כך להציג אותו, מה שהיה פוגע באפקט של Streaming.

זו דוגמה מצוינת לכך שגם בפרויקט AI פשוט יחסית עדיין צריך להבין:

- Runtime Behavior

- Buffering

- ו-Real Time Output

**למה Streaming כל כך חשוב בעולם ה-AI**

המרצה הדגיש ש-Streaming אינו רק "אפקט נחמד".

במערכות אמיתיות הוא קריטי עבור:

<div dir="rtl">

| **תחום** | **למה Streaming חשוב** |
| --- | --- |
| **Chat Applications** | תחושת תגובה מיידית |
| **Code Generation** | לראות קוד נכתב בזמן אמת |
| **Agents** | Feedback רציף |
| **Long Responses** | הפחתת תחושת המתנה |
| **Customer Experience** | מערכת מרגישה חיה |

</div>

בנוסף, Streaming מאפשר להתחיל לעבד מידע עוד לפני שהתשובה הסתיימה.

לדוגמה:

- להציג UI בזמן אמת

- להתחיל Parsing מוקדם

- לבצע Cancellation

- לעצור Generation באמצע

- או לזהות Errors מוקדם יותר

**ההבדל הפסיכולוגי בחוויית המשתמש**

המרצה נתן כאן תובנה מעניינת מאוד:

גם אם זמן הריצה הכולל זהה, Streaming גורם למערכת להרגיש מהירה בהרבה.

לדוגמה:

<div dir="rtl">

| **מצ**ב | **תחושת המשתמש** |
| --- | --- |
| **המתנה של 10 שניות ואז תשובה מלאה** | מערכת איטית |
| **טקסט שמתחיל להופיע אחרי חצי שנייה** | מערכת מהירה |

</div>

זו בדיוק הסיבה שכמעט כל מערכות ה-AI המודרניות משתמשות ב-Streaming כברירת מחדל.

**מה באמת קורה מאחורי Streaming**

המרצה הסביר שמאחורי הקלעים מתרחש תהליך רציף:

<img src="/Lesson-4-LLM-APIs/assets/image-04.png" alt="image-04.png" width="709" height="399" />


כלומר, החיבור נשאר פתוח בזמן שהמודל ממשיך לייצר Tokens.

זו כבר לא בקשת HTTP רגילה וקצרה, אלא ערוץ תקשורת חי שנשאר פתוח לאורך זמן.

**למה הקובץ הזה חשוב**

הקובץ הזה היה נקודת מעבר משמעותית מאוד בשיעור.

עד עכשיו עבדנו מול:

Request Response

אבל כאן מתחילים לראות כיצד מערכות AI מודרניות באמת בנויות:

- Real Time Interaction

- Streaming Tokens

- Continuous Responses

- וחוויית משתמש דינמית

זו כבר לא "קריאת API פשוטה", אלא התחלה של עבודה עם מערכות AI אינטראקטיביות אמיתיות.

## קובץ 3_anthropic_api_thinking.py - שימוש ב-Thinking Mode ו-Reasoning מתקדם

לאחר שהמרצה הראה כיצד לשלוח בקשת API רגילה וכיצד לעבוד עם Streaming Responses, הוא עבר לאחת היכולות המעניינות ביותר במודלי Claude המודרניים: מצב Thinking.

לצורך ההדגמה נוצר הקובץ:

3_anthropic_api_thinking.py

הקוד המלא:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[
        {
            "role": "user",
            "content": "Are there an infinite number of prime numbers such that n mod 4 == 3?",
        }
    ],
)

print(
    f"input_tokens={response.usage.input_tokens}, "
    f"output_tokens={response.usage.output_tokens}"
)

# The response contains summarized thinking blocks and text blocks
for block in response.content:
    if block.type == "thinking":
        print(f"\n\n==========Thinking summary: {block.thinking}==========")
    elif block.type == "text":
        print(f"\n\n==========Response: {block.text}==========")
```

**מה מיוחד בקובץ הזה**

בדוגמאות הקודמות המודל פשוט קיבל Prompt והחזיר תשובה.

בקובץ הזה המרצה עבר לשלב מתקדם יותר:

לא רק לקבל תשובה, אלא להפעיל מצב שבו המודל מבצע reasoning פנימי עמוק יותר לפני יצירת התשובה.

זו אחת ההתפתחויות המעניינות ביותר בעולם מודלי ה-LLM המודרניים.

```python
import anthropic
```

כמו בקבצים הקודמים, גם כאן מתחילים בטעינת ספריית Anthropic:

```python
import anthropic
```

הספרייה הזו היא ה-SDK הרשמי שמאפשר לעבוד מול Claude API בצורה פשוטה ונוחה.

**יצירת Client**

לאחר מכן נוצר Client:

```python
client = anthropic.Anthropic()
```

זהו האובייקט שמנהל את כל התקשורת מול ה-API של Anthropic.

דרכו:

- שולחים Requests

- מקבלים Responses

- ומפעילים יכולות שונות של המודל

**client.messages.create**

הלב המרכזי של הקובץ הוא:

```python
response = client.messages.create(...)
```

בניגוד לקובץ הקודם של Streaming, כאן מדובר בבקשת API רגילה.

כלומר:

<img src="/Lesson-4-LLM-APIs/assets/image-05.png" alt="image-05.png" width="710" height="317" />


המערכת שולחת בקשה, ממתינה עד שהמודל מסיים לחשב, ורק אז מקבלת את כל התשובה.

**model="claude-haiku-4-5"**

כאן המרצה בחר להשתמש ב:

```python
model="claude-haiku-4-5"
```

למרות שמדובר במודל קטן ומהיר יחסית, Anthropic עדיין מאפשרת להפעיל עליו מצב Thinking.

המרצה הדגיש שזה מעניין משום שגם מודלים מהירים יחסית מתחילים לקבל יכולות reasoning מתקדמות יותר.



**thinking={...} - הפעלת מצב חשיבה**

זהו החלק החשוב ביותר בקובץ:

```python
thinking={"type": "enabled", "budget_tokens": 10000}
```

כאן אנחנו מפעילים Explicit Thinking Mode.

כלומר, אנחנו מבקשים מהמודל:

- לבצע reasoning פנימי

- להשתמש בתקציב Tokens עבור החשיבה

- ורק לאחר מכן לייצר את התשובה הסופית

המרצה הסביר שזו כבר לא עבודה רגילה של:

Prompt Completion

אלא תהליך מתקדם יותר:

<img src="/Lesson-4-LLM-APIs/assets/image-06.png" alt="image-06.png" width="709" height="292" />


**budget_tokens**

הפרמטר:

```python
"budget_tokens": 10000
```

מגדיר כמה Tokens המודל רשאי לנצל עבור תהליך החשיבה.

המרצה הדגיש נקודה חשובה מאוד:

Thinking אינו "חינם".

Reasoning עמוק יותר דורש:

- יותר Tokens

- יותר זמן חישוב

- יותר משאבי inference

- ולעיתים גם Latency גבוה יותר

כלומר, יש כאן Tradeoff ברור:

<div dir="rtl">

| **יתרון** | **מחיר** |
| --- | --- |
| **Reasoning טוב יותר** | יותר Tokens |
| **תשובות מדויקות יותר** | יותר עלות |
| **חשיבה עמוקה יותר** | זמן תגובה ארוך יותר |

</div>

**השאלה המתמטית**

בקובץ נשלחת השאלה:

```python
"Are there an infinite number of prime numbers such that n mod 4 == 3?"
```

זו שאלה מתמטית שמצריכה reasoning אמיתי.

המרצה בחר בכוונה שאלה שאינה רק ניסוח טקסטואלי פשוט, אלא דורשת:

- חשיבה

- הסקת מסקנות

- ועבודה לוגית מסודרת

זו בדיוק אחת הסיבות לקיומו של Thinking Mode.

**response.usage**

לאחר קבלת התשובה הקוד מדפיס:

```python
print(
    f"input_tokens={response.usage.input_tokens}, "
    f"output_tokens={response.usage.output_tokens}"   
)
```

המרצה הדגיש שזו נקודה חשובה מאוד בעולם ה-AI Engineering.

מודלי AI אינם רק "מחזירים טקסט".

כל קריאה צורכת משאבים.

ולכן חשוב לנטר:

- כמה Tokens נשלחו

- כמה Tokens הוחזרו

- כמה עולה כל Request

- ואילו בקשות יקרות במיוחד

במערכות Production זה חלק קריטי מניהול עלויות.

**response.content**

לאחר מכן הקוד עובר על:

```python
for block in response.content:
```

המרצה הסביר שהתגובה כאן אינה רק String פשוט.

המודל מחזיר כמה סוגי בלוקים.

**block.type == "thinking"**

אם הבלוק הוא מסוג:

```python
block.type == "thinking"
```

הקוד מדפיס את סיכום החשיבה של המודל:

```python
print(f"\n\n==========Thinking summary: {block.thinking}==========")
```

זו נקודה מעניינת מאוד.

המודל חושף חלק מתהליך ה-reasoning שלו.

כלומר, אנחנו כבר לא עובדים מול "קופסה שחורה" לחלוטין.



**block.type == "text"**

אם הבלוק הוא מסוג:

```python
block.type == "text"
```

הקוד מדפיס את התשובה הסופית שהמשתמש אמור לראות.

```python
print(f"\n\n==========Response: {block.text}==========")
```

כלומר, קיימים כאן שני סוגי Output:

<div dir="rtl">

| **סוג** | **משמעות** |
| --- | --- |
| **thinking** | Reasoning פנימי מסוכם |
| **text** | תשובה סופית |

</div>

**למה הקובץ הזה חשוב**

הקובץ הזה מסמן מעבר חשוב מאוד בעולם ה-LLMs.

עד עכשיו עבדנו בעיקר עם:

- Prompts

- Responses

- ו-Streaming

אבל כאן מתחילים לעבוד עם:

- Reasoning Models

- Thinking Systems

- Token Budgets

- ו-Inference מתקדם

המרצה ניסה להעביר כאן רעיון חשוב:

מודלי AI מודרניים אינם רק מנועי השלמת טקסט.

הם מתחילים להפוך למערכות שמבצעות reasoning אמיתי, עם שלבי חשיבה פנימיים שניתן אפילו לחשוף ולנתח מתוך הקוד.



## קובץ 4_anthropic_api_structured.py - חילוץ מידע מובנה מתוך שיחה אמיתית

לאחר שהמרצה הראה כיצד לעבוד עם Prompts רגילים, Streaming ו-Thinking Mode, הוא עבר לאחד השימושים החשובים ביותר של מודלי LLM בעולם האמיתי:

חילוץ מידע מובנה מתוך טקסט חופשי.

לצורך ההדגמה נוצר הקובץ:

4_anthropic_api_structured.py

הקוד המלא:

```python
import anthropic
import json
from pathlib import Path

client = anthropic.Anthropic()


def get_structured_data(text, schema):
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"Extract the key information from this interaction between agent and customer: {text}",
            }
        ],
        output_config={
            "format": {
                "type": "json_schema",
                "schema": schema,
            }
        },
    )

    return json.loads(response.content[0].text)

data_dir = Path(__file__).parent / "data"

text = (data_dir / "call1.txt").read_text(encoding="utf-8")
schema = json.loads((data_dir / "call_summary_schema.json").read_text(encoding="utf-8"))

structured_data = get_structured_data(text, schema)
print(json.dumps(structured_data, indent=4))
```

**מה המטרה של הקובץ הזה**

עד עכשיו השתמשנו במודל בעיקר כדי:

- לקבל תשובות

- לייצר טקסט

- או לבצע reasoning

אבל בעולם האמיתי הרבה מאוד מערכות AI צריכות לבצע משהו אחר לגמרי:

להפוך טקסט לא מובנה לנתונים מובנים.

לדוגמה:

- שיחות שירות

- מיילים

- מסמכים

- צ'אטים

- דוחות

- ותמלולים

כל אלה מכילים מידע חשוב, אבל בצורה חופשית שבני אדם יכולים לקרוא, לא מערכות תוכנה.

המרצה הסביר שזה בדיוק המקום שבו LLMs הופכים לכלי עוצמתי במיוחד.

**import json**

בנוסף לספריות שכבר ראינו, כאן מופיעה:

```python
import json
```

הספרייה הזו מאפשרת לעבוד עם JSON בתוך Python.

המרצה הדגיש ש-JSON הוא אחד הפורמטים החשובים ביותר בעולם ה-AI וה-APIs.

כמעט כל מערכות ה-AI המודרניות עובדות עם:

- JSON Requests

- JSON Responses

- Structured Outputs

- ו-Schemas

**Path - עבודה עם קבצים**

כאן מופיעה גם:

```python
from pathlib import Path
```

המטרה של Path היא לעבוד בצורה נוחה ונקייה עם נתיבים לקבצים.

בהמשך הקוד משתמש בזה כדי לקרוא:

- קובץ טקסט של שיחה

- וקובץ JSON Schema

**get_structured_data**

המרצה יצר פונקציה בשם:

```python
get_structured_data(text, schema)
```

המטרה שלה היא:

- לקבל טקסט חופשי

- לקבל Schema

- ולבקש מהמודל להחזיר מידע מובנה

זו כבר גישה הרבה יותר הנדסית לעבודה עם AI.

לא רק "תענה לי", אלא:

תחזיר מידע במבנה מדויק שהמערכת שלי יודעת לעבוד איתו

**ה-Prompt**

בתוך ה-messages מופיע:

```python
"Extract the key information from this interaction between agent and customer"
```

המרצה הסביר שזו דוגמה קלאסית למשימת Information Extraction.

כלומר:

לקחת שיחה ארוכה ולהוציא ממנה:

- שמות

- פעולות

- סיכומים

- רגשות

- מזהים

- ומשימות להמשך

**output_config - Structured Output**

זהו החלק החשוב ביותר בקובץ:

```python
output_config={
    "format": {
        "type": "json_schema",
        "schema": schema,
    }
}
```

כאן אנחנו לא מבקשים מהמודל "לכתוב יפה".

אנחנו דורשים ממנו להחזיר JSON במבנה מוגדר מראש.

זהו שינוי משמעותי מאוד בעולם ה-AI Engineering.

בעבר הרבה מערכות AI עבדו כך:

<img src="/Lesson-4-LLM-APIs/assets/image-07.png" alt="image-07.png" width="451" height="187" />


אבל זו גישה מסוכנת מאוד למערכות Production.

למה?

כי טקסט חופשי:

- קשה לניתוח

- קשה לאימות

- לא יציב

- ועלול להשתנות בין Responses

לעומת זאת Structured Output מאפשר למערכת לקבל נתונים יציבים וצפויים.

**JSON Schema**

ה-Schema עצמו נטען מתוך הקובץ:

call_summary_schema.json

המרצה הסביר ש-JSON Schema הוא למעשה "חוזה" שמגדיר למודל:

- אילו שדות חייבים להופיע

- איזה טיפוס יש לכל שדה

- אילו ערכים מותרים

- ומה מבנה הנתונים הצפוי

לדוגמה:

```python
"sentiment": {
  "type": "string",
  "enum": ["positive", "neutral", "negative", "mixed"]
}
```

כאן אנחנו מגדירים שהמודל חייב להחזיר רק אחד מארבעת הערכים האפשריים.

זו כבר רמה אחרת לגמרי של שליטה במודל.

**call1.txt - שיחה אמיתית**

הקובץ:

call1.txt

מכיל שיחת שירות לקוחות מלאה בין סוכן ביטוח ללקוח.

השיחה כוללת:

- תלונה על עליית מחיר

- בעיית Autopay

- טיפול בתביעה

- עדכון פרטי תשלום

- ושיחה על Claim פתוח

זו דוגמה מצוינת משום שמדובר בטקסט:

- ארוך

- לא מובנה

- עם הרבה מידע עסקי

- והרבה Context

בדיוק מסוג הנתונים שמערכות AI צריכות לעבד בעולם האמיתי.

**קריאת הקבצים**

הקוד טוען את הקבצים:

```python
text = (data_dir / "call1.txt").read_text(encoding="utf-8")
```

ו:

```python
schema = json.loads(
    (data_dir / "call_summary_schema.json")
    .read_text(encoding="utf-8")
)
```

כלומר:

- קוראים את השיחה

- קוראים את ה-Schema

- ושולחים את שניהם למודל

**json.loads**

לאחר קבלת התשובה:

```python
return json.loads(response.content[0].text)
```

הקוד ממיר את הטקסט שחזר מהמודל לאובייקט JSON אמיתי של Python.

זו נקודה חשובה מאוד.

המטרה כאן אינה להציג טקסט לבני אדם בלבד.

המטרה היא לאפשר למערכת תוכנה לעבוד עם הנתונים בצורה אוטומטית.

**print(json.dumps(...))**

לבסוף:

```python
print(json.dumps(structured_data, indent=4))
```

הקוד מדפיס את הנתונים בפורמט JSON מסודר וקריא.

**למה הקובץ הזה כל כך חשוב**

זהו אחד הקבצים החשובים ביותר בכל החלק המעשי.

כאן רואים מעבר אמיתי מ:

AI as Chat

אל:

AI as Structured Data Engine

המודל כבר לא רק "מדבר".

הוא הופך למנוע שמסוגל:

- להבין מידע עסקי

- לנתח שיחות

- לחלץ נתונים

- ולייצר Output שמערכות אחרות יכולות לעבוד איתו אוטומטית

זו אחת הסיבות המרכזיות לכך שמודלי LLM מתחילים להיכנס למערכות Enterprise אמיתיות.


