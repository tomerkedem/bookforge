# anthropic_api_structured.py, שירות שמחזיר פלט מובנה

אחרי שהבנו למה כדאי לעטוף יכולת LLM בתוך API, נעבור לקובץ שמבצע את העבודה עצמה מול Anthropic.

הקובץ anthropic_api_structured.py הוא שכבת השירות: הוא מקבל טקסט וסכמה, שולח אותם למודל, דורש פלט מובנה, מאמת את התוצאה, ומחזיר לקוד אובייקט שאפשר לעבוד איתו.

נציג קודם את הקובץ בשלמותו:

```python
import asyncio
import json
from pathlib import Path

import anthropic
from jsonschema import validate
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

client = anthropic.AsyncAnthropic()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2),
    retry=retry_if_exception_type(Exception),
)
async def get_structured_data(text, schema):
    response = await client.messages.create(
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

    parsed = json.loads(response.content[0].text)
    validate(instance=parsed, schema=schema)
    return parsed

if __name__ == "__main__":
    data_dir = Path(__file__).parent / "data"

    text = (data_dir / "call1.txt").read_text(encoding="utf-8")
    schema = json.loads((data_dir / "call_summary_schema.json").read_text(encoding="utf-8"))

    structured_data = asyncio.run(get_structured_data(text, schema))
    print(json.dumps(structured_data, indent=4))
```

הקובץ הזה עושה דבר אחד מרכזי: הוא הופך טקסט חופשי לפלט מובנה. במקרה של השיעור, הטקסט הוא תמלול שיחה בין נציג ללקוח, והסכמה מגדירה אילו פרטים צריך לחלץ מהשיחה: משתתפים, נושאים מרכזיים, תוצאות, משימות המשך, סנטימנט ומזהים רלוונטיים.

## ייבוא הספריות

בתחילת הקובץ מופיעות הספריות הדרושות:

```python
import asyncio
import json
from pathlib import Path
```

**asyncio** משמש להפעלת פונקציה אסינכרונית מתוך קוד רגיל.

**Json** משמש לשני דברים: המרת תשובת המודל מטקסט ל-JSON, והדפסת התוצאה בצורה קריאה.

**Path** מאפשר לעבוד עם נתיבי קבצים בצורה נוחה, למשל כדי לקרוא את call1.txt ואת call_summary_schema.json מתוך תיקיית data.

לאחר מכן מופיעים הייבואים המרכזיים יותר:

```python
import anthropic
from jsonschema import validate
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed
```

**anthropic** היא הספרייה שדרכה מתבצעת הקריאה למודל.

**validate** מתוך jsonschema משמש לבדיקה שהתוצאה שהמודל החזיר באמת תואמת לסכמה.

**tenacity** משמשת ל-retry, כלומר ניסיון חוזר במקרה של שגיאה.

כאן כבר רואים שהקובץ אינו רק דוגמת API פשוטה. הוא מתחיל לכלול התנהגות שמתאימה יותר לעולם אמיתי: בדיקה, אימות, וניסיון חוזר.

## יצירת client אסינכרוני

```python
client = anthropic.AsyncAnthropic()
```

כאן נוצר client אסינכרוני של Anthropic.

המשמעות היא שהקריאות למודל יתבצעו עם await, ולא יחסמו את כל התהליך בזמן ההמתנה לתשובה. זה מתחבר ישירות לפרקים הקודמים על async: קריאה ל-LLM היא קריאה לשירות חיצוני, ולכן היא מתאימה מאוד לעבודה אסינכרונית.

במקום שכל המערכת תחכה בצורה קשיחה לתשובה מהמודל, הפונקציה יכולה להמתין באופן אסינכרוני, ובשרת אמיתי זה מאפשר לטפל במקביל בבקשות נוספות.

## retry עם Tenacity

החלק הבא הוא אחד החשובים בקובץ:

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2),
    retry=retry_if_exception_type(Exception),
)
```

זהו decorator של tenacity.

המשמעות שלו היא: אם הפונקציה שמתחתיו נכשלת, נסה להריץ אותה שוב.

ההגדרות כאן אומרות:

```python
stop=stop_after_attempt(3)
```

לא לנסות בלי סוף, אלא לעצור אחרי שלושה ניסיונות.

```python
wait=wait_fixed(2)
```

לחכות שתי שניות בין ניסיון לניסיון.

```python
retry=retry_if_exception_type(Exception)
```

לבצע retry כאשר נזרקת שגיאה מסוג Exception.

זה חשוב מאוד בעבודה מול LLM, כי חלק מהשגיאות יכולות להיות זמניות: תקלה ברשת, עומס זמני, timeout, תשובה לא תקינה, או שגיאת ולידציה. במקום להפיל מיד את כל התהליך, נותנים למערכת הזדמנות נוספת.

זו כבר חשיבה של Production: שירות חיצוני עלול להיכשל, ולכן הקוד צריך להיות מוכן לכך.

## הפונקציה המרכזית: get_structured_data

```python
async def get_structured_data(text, schema):
```

זו הפונקציה המרכזית בקובץ.

היא מקבלת שני דברים:

1. **text** - הטקסט החופשי שממנו רוצים לחלץ מידע.

2. **schema** - סכמת JSON שמגדירה איך הפלט צריך להיראות.

**זו נקודה חשובה:** הפונקציה אינה קשיחה לסוג אחד של פלט. היא מקבלת schema מבחוץ, ולכן אפשר להשתמש בה עבור סוגים שונים של חילוץ מידע, כל עוד מספקים לה סכמה מתאימה.

**הקריאה למודל**

בתוך הפונקציה מתבצעת הקריאה ל-Anthropic:

```python
response = await client.messages.create(
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
```

הקריאה הזו עושה כמה דברים יחד.

ראשית, היא בוחרת מודל:

```python
model="claude-haiku-4-5"
```

לאחר מכן היא מגבילה את אורך התשובה:

```python
max_tokens=1024
```

ואז היא שולחת הודעת משתמש אחת שמבקשת מהמודל לחלץ מידע חשוב מתוך אינטראקציה בין נציג ללקוח:

```python
"content": f"Extract the key information from this interaction between agent and customer: {text}"
```

כאן המודל מקבל את הטקסט הגולמי. במקרה של התרגול בשיעור, זהו תמלול שיחת שירות לקוחות.

## output_config ו JSON Schema

החלק החשוב ביותר בקריאה הוא:

```python
output_config={
    "format": {
        "type": "json_schema",
        "schema": schema,
    }
}
```

כאן לא מבקשים מהמודל סתם “תחזיר JSON”.

מבקשים ממנו להחזיר פלט לפי JSON Schema מוגדר.

זה הבדל גדול.

במקום לסמוך על ניסוח חופשי של המודל, הקוד נותן לו חוזה ברור: אלו השדות, אלו הטיפוסים, אלו הדרישות, וזה המבנה שהמערכת מצפה לקבל.

במקרה של call_summary_schema.json, הסכמה דורשת שדות כמו:

```python
participants
main_topics
outcomes
action_items
sentiment
reference_ids
```

בנוסף, הסכמה מגדירה **additionalProperties: false**, כלומר המודל לא אמור להוסיף שדות שלא הוגדרו. זה חשוב מאוד כדי שהמערכת תקבל פלט צפוי ולא מבנה משתנה בכל פעם.

## המרת תשובת המודל ל-JSON

אחרי שהמודל מחזיר תשובה, הקוד מבצע:

```python
parsed = json.loads(response.content[0].text)
```

התשובה של המודל מגיעה כטקסט. גם אם הטקסט נראה כמו JSON, מבחינת Python הוא עדיין מחרוזת.

json.loads ממיר את המחרוזת לאובייקט Python אמיתי, למשל dict.

זה רגע חשוב בתהליך:

לפני השורה הזו יש לנו טקסט.

אחרי השורה הזו יש לנו נתונים מובנים.

וזה בדיוק הערך של Structured Extraction: להפוך שיחה, מסמך או טקסט חופשי למבנה שהקוד יכול לקרוא, לבדוק, לשמור ולהעביר הלאה.

## ולידציה מול הסכמה

השלב הבא הוא:

```python
validate(instance=parsed, schema=schema)
```

כאן הקוד בודק שהתוצאה שהמודל החזיר באמת עומדת בסכמה.

זו לא בדיקה קוסמטית. זו שכבת הגנה חשובה.

יכול להיות שהמודל החזיר JSON תקין מבחינה תחבירית, אבל עדיין לא לפי המבנה הנדרש.

**לדוגמה:**

- שדה חובה חסר.

- שדה שאמור להיות רשימה חזר כמחרוזת.

- ערך שאמור להיות מתוך enum חזר כערך לא חוקי.

- נוסף שדה שלא הוגדר בסכמה.

במקרה כזה, validate יזהה את הבעיה ויזרוק שגיאה. מכיוון שהפונקציה עטופה ב-retry, שגיאה כזו יכולה לגרום לניסיון נוסף.

זהו בדיוק ההבדל בין demo לבין שירות אמין יותר: לא מסתפקים בכך שהמודל “נראה כאילו ענה נכון”, אלא בודקים את התוצאה בקוד.

**החזרת הפלט המובנה**

אם ה-parsing וה-validation עברו בהצלחה, הפונקציה מחזירה את האובייקט:

```python
return parsed
```

מכאן והלאה, הקוד יכול לעבוד עם הפלט הזה כמו עם כל אובייקט רגיל.

אפשר לשמור אותו במסד נתונים.

אפשר להחזיר אותו מ-API.

אפשר לשלוח אותו ל-Agent אחר.

אפשר להפעיל לפיו workflow.

וזה בדיוק מה שהופך את LLM לרכיב תוכנה שימושי: הוא לא רק מייצר טקסט, אלא מחזיר נתונים שהמערכת יכולה להמשיך לעבד.

## הרצת הקובץ כקובץ עצמאי

בסוף הקובץ מופיע בלוק הרצה:

```python
if __name__ == "__main__":
```

המשמעות היא שהקוד שבתוך הבלוק ירוץ רק אם הקובץ הופעל ישירות, ולא אם הוא יובא מקובץ אחר.

בתוך הבלוק מוגדרת תיקיית הנתונים:

```python
data_dir = Path(__file__).parent / "data"
```

לאחר מכן הקוד קורא את טקסט השיחה:

```python
text = (data_dir / "call1.txt").read_text(encoding="utf-8")
```

ואת הסכמה:

```python
schema = json.loads((data_dir / "call_summary_schema.json").read_text(encoding="utf-8"))
```

כלומר, לצורך בדיקה מקומית, הקובץ יודע לקחת דוגמת שיחה ודוגמת schema מתוך תיקיית data.

אחר כך הוא מריץ את הפונקציה האסינכרונית:

```python
structured_data = asyncio.run(get_structured_data(text, schema))
```

ולבסוף מדפיס את התוצאה בצורה יפה:

```python
print(json.dumps(structured_data, indent=4))
```

זה מאפשר לבדוק את השירות עוד לפני שעוטפים אותו ב-FastAPI.



## למה הקובץ הזה חשוב בשיעור?

הקובץ הזה מחבר בין שני שלבים בקורס.

מצד אחד, הוא ממשיך את הרעיון של Structured Output משיעור 4: לקחת טקסט חופשי ולהחזיר JSON.

מצד שני, הוא כבר מכין אותנו לשיעור 5: לבנות שירות שאפשר לחשוף דרך API, עם async, schema, validation ו retry.

כלומר, זה כבר לא רק Prompt Engineering.

זו התחלה של AI Engineering.

המערכת לא אומרת למודל “תחזיר משהו שימושי” ומקווה לטוב. היא מגדירה חוזה, בודקת את הפלט, מנסה שוב במקרה של כשל, ומחזירה לקוד אובייקט מובנה.

**המסר המרכזי**

המסר המרכזי של הפרק הוא ש-Structured Extraction אמיתי אינו מסתיים בכך שהמודל מחזיר JSON.

כדי להפוך את זה לרכיב תוכנה אמין יותר, צריך:

להגדיר schema ברור.

לדרוש מהמודל להחזיר פלט לפי הסכמה.

להמיר את התשובה ל-JSON אמיתי.

לאמת את התוצאה בקוד.

לבצע retry במקרה של שגיאה.

ולחשוב כבר עכשיו איך הפונקציה הזו תיחשף כשירות API.

זו בדיוק נקודת המעבר שהשיעור מנסה לבנות: מיכולת נקודתית של LLM אל שירות AI שאפשר לשלב במערכת אמיתית.


