# server.py, שרת FastAPI בפועל

אחרי שראינו איך מפעילים קריאה ל-LLM, איך מבקשים ממנו להחזיר JSON מובנה, ואיך משתמשים ב-schema כדי לוודא שהתשובה עומדת במבנה צפוי, השלב הבא הוא להפוך את כל זה לשירות אמיתי.

עד עכשיו הקוד היה בעיקר סקריפט. כלומר, קובץ שמריצים ידנית, והוא מבצע פעולה אחת. אבל במערכת אמיתית אנחנו בדרך כלל לא רוצים שכל לקוח יריץ קובץ Python בעצמו. אנחנו רוצים לחשוף API.

כלומר, הלקוח ישלח טקסט לשרת, השרת יעביר את הטקסט למודל, המודל יחזיר מידע מובנה, והשרת יחזיר את התוצאה ללקוח.

כאן נכנס הקובץ **server.py.**

המטרה שלו היא להפוך את הלוגיקה שבנינו לשירות Web קטן, ברור ונגיש.

השרת מבוסס על FastAPI, ספריית Python פופולרית מאוד לבניית APIs. היא נוחה במיוחד כי היא משלבת בצורה טבעית בין הגדרת endpoints, ולידציה של קלט, מודלים של Pydantic ותיעוד אוטומטי דרך Swagger.

כלומר, ברגע שאנחנו כותבים שרת FastAPI, אנחנו מקבלים כמעט בחינם גם דף תיעוד אינטראקטיבי בכתובת:

```python
/docs
```

אפשר לחשוף את ה-API ללקוח בצורה מאוד נוחה, כך שהלקוח יכול לראות אילו endpoints קיימים, איזה קלט הם מקבלים, מה המבנה הצפוי של הבקשה, ואפילו לשלוח בקשות בדיקה ישירות מהדפדפן.

הקובץ server.py מתחיל בדרך כלל ביצירת האפליקציה:

```python
from fastapi import FastAPI

app = FastAPI()
```

השורה הזו יוצרת את אובייקט האפליקציה המרכזי. כל endpoint שנגדיר בהמשך יירשם על האובייקט הזה.

אפשר לחשוב על app בתור השרת עצמו: אליו אנחנו מחברים כתובות, פעולות, ולוגיקה.

לאחר מכן השרת צריך לטעון schema ברירת מחדל. ה-schema הוא החוזה שמגדיר איך הפלט המובנה אמור להיראות.

לדוגמה, אם אנחנו מנתחים שיחה בין לקוח לנציג, ה-schema יכול להגדיר שהתוצאה צריכה להכיל שדות כמו:

```python
{
  "customer_name": "string",
  "issue": "string",
  "sentiment": "positive | neutral | negative",
  "requires_follow_up": "boolean"
}
```

המשמעות היא שהשרת לא מבקש מהמודל “תחזיר לי משהו כללי”, אלא דורש ממנו להחזיר מבנה מוגדר.

זו נקודה חשובה מאוד: ברגע שמערכת אחרת צורכת את התוצאה, הפלט חייב להיות צפוי. קוד לא אוהב הפתעות. אם פעם אחת המודל מחזיר טקסט חופשי, פעם אחרת JSON חלקי, ופעם שלישית שדה בשם אחר, המערכת שמקבלת את הפלט תישבר.

לכן schema הוא לא קישוט. הוא חלק מהחוזה בין השרת לבין הלקוח.

## בשלב הבא נגדיר מודל בקשה באמצעות Pydantic.

```python
from pydantic import BaseModel

class StructuredRequest(BaseModel):
    text: str
```

המודל הזה אומר שה-endpoint שמקבל בקשה לניתוח מובנה מצפה לקבל JSON עם שדה בשם text.

לדוגמה:

```python
{
  "text": "The customer says the package arrived late and asks for compensation."
}
```

FastAPI משתמש ב-Pydantic כדי לבדוק את הקלט לפני שהקוד שלנו בכלל מתחיל לרוץ. אם הלקוח שולח בקשה בלי text, או במבנה לא נכון, FastAPI יודע להחזיר שגיאת ולידציה אוטומטית.

זה אחד היתרונות הגדולים של FastAPI: אנחנו לא צריכים לכתוב ידנית את כל בדיקות המבנה הבסיסיות.

עכשיו אפשר להגדיר endpoint ראשון:

```python
@app.get("/schema")
async def get_schema():
    return DEFAULT_SCHEMA
```

ה-endpoint הזה מאפשר ללקוח לקבל את ה-schema שהשרת משתמש בו.

זו פעולה פשוטה, אבל מאוד שימושית. לקוח שרוצה להבין איזה פלט הוא אמור לקבל יכול לקרוא ל:

```python
GET /schema
```

ולראות את המבנה.

במערכת אמיתית זה עוזר במיוחד כאשר יש frontend, מערכת אינטגרציה, או צוות אחר שצריך לדעת מה בדיוק ה-API מחזיר.

לאחר מכן מגיע ה-endpoint המרכזי:

```python
@app.post("/structured")
async def structured(request: StructuredRequest):
    ...
```

זה ה-endpoint שמקבל טקסט, שולח אותו לעיבוד מול המודל, ומחזיר JSON מובנה.

כאן חשוב לבצע בדיקה פשוטה אבל קריטית: האם הטקסט ריק.

```python
if not request.text.strip():
    raise HTTPException(status_code=400, detail="Text cannot be empty")
```

הבדיקה הזו מונעת מצב שבו הלקוח שולח מחרוזת ריקה, רווחים בלבד, או בקשה חסרת משמעות.

במקרה כזה אין טעם לקרוא ל-LLM. זו קריאה יקרה, איטית יחסית, ולא תפיק ערך אמיתי. לכן נכון לעצור את הבקשה מוקדם ולהחזיר שגיאת HTTP ברורה.

כאן אנחנו רואים שימוש ב-HTTPException:

```python
from fastapi import HTTPException
```

כאשר משהו לא תקין בבקשה, אנחנו לא מחזירים סתם טקסט. אנחנו מחזירים תגובת HTTP מסודרת עם status code מתאים.

לדוגמה:

```python
raise HTTPException(
    status_code=400,
    detail="Text cannot be empty"
)
```

המשמעות של 400 היא שהבעיה נמצאת בבקשה של הלקוח. כלומר, השרת תקין, אבל הקלט שהתקבל לא תקין.

לעומת זאת, אם במהלך הקריאה למודל קרתה שגיאה פנימית, למשל בעיית רשת, בעיית API key, או כשל בלתי צפוי, אפשר להחזיר שגיאה מסוג 500:

```python
raise HTTPException(
    status_code=500,
    detail="Failed to extract structured data"
)
```

כאן המשמעות שונה: הלקוח שלח בקשה שנראית תקינה, אבל השרת לא הצליח להשלים את הפעולה.

זו הבחנה חשובה מאוד בתכנון API. לא כל שגיאה היא אותו דבר. לקוח צריך לדעת האם לתקן את הבקשה, לנסות שוב, או לפנות למפתחי השרת.

בסוף ה-endpoint, לאחר שהטקסט עבר בדיקה, השרת קורא לפונקציה שמבצעת את חילוץ המידע המובנה:

```python
result = await get_structured_data(request.text, DEFAULT_SCHEMA)
return result
```

כאן רואים שוב את החשיבות של async.

קריאה ל-LLM היא קריאת רשת. בזמן שהשרת מחכה לתשובה מהמודל, אין סיבה לחסום את כל התהליך. בעזרת await, השרת יכול לנהל בצורה יעילה יותר בקשות מקבילות.

## הקוד המלא יכול להיראות כך:

```python
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from structured_extraction import get_structured_data


app = FastAPI(
    title="Structured Extraction API",
    description="API for extracting structured data from text using an LLM",
    version="1.0.0",
)


SCHEMA_PATH = Path("schema.json")


def load_default_schema():
    with SCHEMA_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


DEFAULT_SCHEMA = load_default_schema()


class StructuredRequest(BaseModel):
    text: str


@app.get("/schema")
async def get_schema():
    return DEFAULT_SCHEMA


@app.post("/structured")
async def structured(request: StructuredRequest):
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty",
        )

    try:
        result = await get_structured_data(
            text=request.text,
            schema=DEFAULT_SCHEMA,
        )
        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to extract structured data",
        ) from error
```

כדי להריץ את השרת משתמשים ב-uvicorn.

**לדוגמה:**

```python
uvicorn server:app --reload
```

המשמעות של הפקודה:

```python
server הוא שם הקובץ, כלומר server.py.
```

app הוא שם אובייקט FastAPI שיצרנו בתוך הקובץ.

reload גורם לשרת להיטען מחדש אוטומטית כאשר משנים את הקוד, וזה נוח מאוד בזמן פיתוח.

לאחר ההרצה, השרת יהיה זמין בדרך כלל בכתובת:

```bash
http://127.0.0.1:8000
```

כדי לראות את Swagger נכנסים ל:

```bash
http://127.0.0.1:8000/docs
```

שם אפשר לראות את שני ה-endpoints:

<img src="/Lesson-5-From-LLM-To-Agent/assets/image-15.png" alt="image-15.png" width="396" height="409" />



אפשר לפתוח את POST /structured, ללחוץ על Try it out, להזין JSON לדוגמה, ולהריץ את הקריאה ישירות מהדפדפן.

לדוגמה:

```python
{
  "text": "The customer called because the package arrived damaged and asked for a replacement."
}
```

השרת יקבל את הטקסט, יעביר אותו למודל, יוודא שהתשובה עומדת ב-schema, ויחזיר JSON מובנה.

זו כבר לא רק הדגמה של LLM. זו התחלה של שירות תוכנה אמיתי.

הערך הגדול כאן הוא ההפרדה בין שכבות:

הלקוח לא צריך לדעת איך עובדים מול Anthropic.

הלקוח לא צריך להכיר את פרטי הפרומפט.

הלקוח לא צריך לדעת איך מבצעים ולידציה ל-JSON.

הלקוח פשוט שולח טקסט ל-API ומקבל תוצאה מובנית.

זו בדיוק הדרך שבה יכולת AI הופכת מרעיון נקודתי לחלק ממערכת.


