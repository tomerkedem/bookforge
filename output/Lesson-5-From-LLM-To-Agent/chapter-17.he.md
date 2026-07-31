# פתרון תרגיל הבית: Intelligent Request Router

תרגיל הבית ממשיך ישירות את מה שנלמד בשיעור: לקחת הודעת לקוח חופשית, לשלוח אותה ל-LLM, ולהחזיר ממנה פלט מובנה שהמערכת יכולה לפעול לפיו.

בתרגיל הזה לא מבקשים רק לסכם את ההודעה. המטרה היא לבנות endpoint בשם Smart Support Router, שיודע לנתח פנייה של לקוח ולהחזיר החלטה תפעולית:

לאיזו מחלקה הפנייה שייכת

מה רמת הדחיפות שלה

מה הסנטימנט של הלקוח

ואילו ישויות חשובות הופיעו בהודעה

כלומר, זה כבר לא “LLM כצ'אט”, אלא LLM כרכיב ניתוב בתוך מערכת שירות.

**מבנה הפתרון**

נבנה פתרון עם שלושה קבצים מרכזיים:

```bash
project/
│
├── server.py
├── anthropic_api_structured.py
│
└── data/
    └── routing_schema.json
```

הקובץ routing_schema.json יגדיר את מבנה הפלט שהמודל חייב להחזיר.

הקובץ anthropic_api_structured.py יכיל את הפונקציה שמדברת עם Anthropic,

מבצעת retry, ממירה את התשובה ל-JSON, ומוודאת שהתוצאה עומדת בסכמה.

הקובץ server.py יחשוף endpoint מסוג POST /route-ticket.

## קובץ ראשון: data/routing_schema.json

```python
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["department", "priority", "sentiment", "entities"],
  "properties": {
    "department": {
      "type": "string",
      "enum": ["billing", "technical_support", "sales", "complaints"]
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"]
    },
    "sentiment": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5
    },
    "entities": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

הסכמה הזו חשובה כי היא הופכת את התשובה של המודל לחוזה ברור.

המודל לא יכול להחזיר מחלקה חופשית כמו "support" או "finance". הוא חייב לבחור מתוך הערכים שהוגדרו:

```python
billing
technical_support
sales
complaints
```

גם העדיפות מוגבלת לערכים ברורים בלבד:

```python
low
medium
high
critical
```

הסנטימנט חייב להיות מספר בין 1 ל 5, והישויות חייבות להיות רשימת מחרוזות.

המאפיין:

```python
"additionalProperties": false
```

חשוב מאוד, כי הוא מונע מהמודל להוסיף שדות שלא ביקשנו. זה הופך את הפלט צפוי יותר ונוח יותר לעיבוד בקוד.

## קובץ שני: anthropic_api_structured.py

```python
import json

import anthropic
from jsonschema import validate
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

client = anthropic.AsyncAnthropic()

@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2),
    retry=retry_if_exception_type(Exception),
)
async def get_structured_data(text: str, schema: dict) -> dict:
    response = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1024,
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": (
                    "Analyze the following customer support message.\n"
                    "Return ONLY valid JSON. Do not include markdown.\n"
                    "The JSON must match this schema:\n"
                    f"{json.dumps(schema)}\n\n"
                    "Customer message:\n"
                    f"{text}"
                ),
            }
        ],
    )

    
    raw_text = response.content[0].text.strip()

    if raw_text.startswith("```json"):
        raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
    elif raw_text.startswith("```"):
        raw_text = raw_text.removeprefix("```").removesuffix("```").strip()

    parsed = json.loads(raw_text)
    validate(instance=parsed, schema=schema)
    return parsed
```

הקובץ הזה דומה מאוד לקובץ שנלמד בשיעור, אבל הפרומפט הותאם למשימת ניתוב פניות שירות.

במקום:

```python
Extract the key information from this interaction between agent and customer
```

אנחנו מבקשים:

```python
Analyze the following customer support message.
Classify it for routing and extract important entities.
```

כלומר, המודל לא רק מחלץ מידע. הוא גם מקבל החלטת routing.

**הפונקציה עושה כמה דברים:**

שולחת את הודעת הלקוח למודל.

מצרפת את הסכמה דרך output_config.

מקבלת תשובה מובנית.

ממירה אותה ל-JSON בעזרת json.loads.

בודקת את התוצאה מול הסכמה בעזרת validate.

ומבצעת retry עד שלושה ניסיונות במקרה של שגיאה.



## קובץ שלישי: server.py

```python
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from anthropic_api_structured import get_structured_data

app = FastAPI(title="Smart Support Router")

_DATA_DIR = Path(__file__).parent / "data"
_ROUTING_SCHEMA_PATH = _DATA_DIR / "routing_schema.json"


def load_routing_schema() -> dict:
    if not _ROUTING_SCHEMA_PATH.is_file():
        raise RuntimeError(f"Routing schema not found: {_ROUTING_SCHEMA_PATH}")

    return json.loads(_ROUTING_SCHEMA_PATH.read_text(encoding="utf-8"))


class RouteTicketRequest(BaseModel):
    message: str = Field(
        ...,
        description="Unstructured customer support message to analyze and route",
    )


@app.get("/routing-schema")
def get_routing_schema() -> dict:
    return load_routing_schema()


@app.post("/route-ticket")
async def route_ticket(body: RouteTicketRequest) -> dict:
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="message must not be empty")

    schema = load_routing_schema()

    try:
        return await get_structured_data(body.message, schema)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
```

כאן אנחנו בונים שרת FastAPI עם שני endpoints.

הראשון:

```python
GET /routing-schema
```

מחזיר את הסכמה, כדי שיהיה קל לראות מה השירות מצפה להחזיר.

השני:

```python
POST /route-ticket
```

הוא ה endpoint המרכזי של התרגיל.

הוא מקבל JSON כזה:

```python
{
  "message": "customer message here"
}
```

בודק שההודעה לא ריקה.

טוען את routing_schema.json.

שולח את ההודעה והסכמה לפונקציה get_structured_data.

ומחזיר את התוצאה ללקוח.

## קובץ תלויות: requirements.txt

```python
anthropic
fastapi
jsonschema
tenacity
uvicorn
```



## שלבי הרצה ובדיקה

**כניסה לתיקיית הפרויקט**

```bash
cd homework
```

**יצירת Virtual Environment**

ב-Windows:

```bash
python -m venv .venv
```

אם python אינו מזוהה:

```bash
py -m venv .venv
```

**הפעלת הסביבה**

**PowerShell:**

```bash
.\.venv\Scripts\Activate.ps1
```

CMD:

```bash
.\.venv\Scripts\activate
```

לאחר ההפעלה אמור להופיע:

```bash
(.venv)
```

בתחילת שורת הפקודה.

**התקנת כל הספריות**

```bash
python -m pip install -r requirements.txt
```

**הגדרת Anthropic API Key**

**PowerShell:**

```bash
$env:ANTHROPIC_API_KEY="your_api_key_here"
```

**CMD:**

```bash
set ANTHROPIC_API_KEY=your_api_key_here
```

**הרצת השרת**

מומלץ להריץ כך:

```bash
python -m uvicorn server:app --reload
```

ולא רק:

```bash
uvicorn server:app --reload
```

כי במערכות Windows לעיתים uvicorn אינו נמצא ב PATH גם כאשר הוא מותקן.

אם ההרצה הצליחה אמורה להופיע הודעה בסגנון:

```bash
Uvicorn running on http://127.0.0.1:8000
```

**פתיחת Swagger**

בדפדפן:

```bash
http://127.0.0.1:8000/docs
```

שם ניתן לבדוק את ה endpoint דרך Swagger UI.

**בדיקת endpoint**

לבחור:

```bash
POST /route-ticket
```

ללחוץ:

```bash
Try it out
```

ולהדביק הודעת לקוח לדוגמה.

**דוגמת Request**

```python
{
  "message": "Subject: Urgent - Cannot access my Pro dashboard\nHello, I've been trying to log into my account (j.smith@email.com) since this morning but I keep getting a '403 Forbidden' error on the main dashboard. I just paid my annual renewal for the 'Advanced Analytics Suite' yesterday (Transaction ID: TXN_98765) and I’m worried my access was cut off by mistake. I have a presentation in two hours and really need this fixed now. This is extremely frustrating."
}
```

**דוגמת Response צפוי**

```bash
{
  "department": "technical_support",
  "priority": "critical",
  "sentiment": 2,
  "entities": [
    "j.smith@email.com",
    "Pro dashboard",
    "403 Forbidden error",
    "Advanced Analytics Suite",
    "TXN_98765",
    "annual renewal"
  ]
}
```

כאן אפשר להתווכח האם המחלקה צריכה להיות technical_support או billing, כי יש בהודעה גם בעיית גישה וגם תשלום שבוצע. אבל בגלל שהבעיה המיידית היא חוסר גישה לדשבורד ושגיאת 403 Forbidden, הבחירה הטובה ביותר היא technical_support.

העדיפות critical מוצדקת בגלל כמה סימנים:

המילה Urgent.

הלקוח לא מצליח להיכנס.

יש מצגת בעוד שעתיים.

הלקוח מתוסכל מאוד.

הסנטימנט הוא 1, כי ההודעה מציינת במפורש:

```python
This is extremely frustrating.
```

והישויות כוללות גם פרטי זיהוי, גם מוצר, גם שגיאה, וגם מזהה עסקה.

**בעיה נפוצה: המודל מחזיר Markdown במקום JSON**

במהלך הפיתוח התברר שלעיתים Claude מחזיר JSON עטוף ב:

```json

ולכן ()json.loads נכשל.

הפתרון היה לנקות את Markdown wrappers לפני parsing:

```bash
raw_text = response.content[0].text.strip()

if raw_text.startswith("```json"):
 raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
elif raw_text.startswith("```"):
 raw_text = raw_text.removeprefix("```").removesuffix("```").strip()

parsed = json.loads(raw_text)
```

זו דוגמה טובה לכך שגם כאשר עובדים עם Structured Output, עדיין צריך לחשוב על robustness ועל טיפול במקרים לא צפויים.



## מה התרגיל מלמד אותנו?

**התרגיל מחבר כמעט את כל החומר של השיעור:**

- FastAPI נותן לנו endpoint שאפשר לקרוא לו מבחוץ.

- Pydantic מוודא שהבקשה מכילה message.

- JSON Schema מגדיר את מבנה הפלט.

- Anthropic API מבצע את הניתוח.

- Structured Output הופך את התשובה ל JSON שימושי.

- Tenacity מוסיף retry במקרה של שגיאה.

- jsonschema.validate מוודא שהמודל באמת עמד בחוזה.

והתוצאה היא שירות קטן אבל אמיתי: מערכת שמקבלת טקסט חופשי ומחזירה החלטת routing שמערכת שירות לקוחות יכולה להשתמש בה.
