# שימוש ב Anthropic Compatibility מול Ollama

אחרי שראינו איך לקרוא ל Ollama מתוך Python בעזרת הספרייה ollama, אפשר להכיר דרך נוספת: שימוש ב SDK של Anthropic מול מודל מקומי שרץ ב Ollama.

במבט ראשון זה נראה מוזר. אם המודל רץ ב Ollama, למה להשתמש בספרייה של Anthropic?

הסיבה היא תאימות. Ollama מספק שכבת תאימות ל Anthropic Messages API, כך שאפשר לשלוח בקשות במבנה דומה לזה של Anthropic, אבל להפנות אותן לשרת המקומי של Ollama במקום לשירות חיצוני.

הקובץ ollama_anthropic.py מדגים את הרעיון הזה. הוא יוצר client של Anthropic, אבל מגדיר לו base_url שמצביע ל Ollama המקומי:

```python
client = anthropic.Anthropic(
base_url=os.getenv("ANTHROPIC_BASE_URL", "http://localhost:11434"),
api_key=os.getenv("ANTHROPIC_AUTH_TOKEN", "ollama"),
)
```

כלומר, הקוד משתמש בממשק של Anthropic, אבל הבקשה בפועל נשלחת לשרת המקומי של Ollama.

## מטרת הקובץ ollama_anthropic.py

מטרת הקובץ היא להראות איך אפשר לשלוח הודעה למודל מקומי דרך מבנה של Anthropic Messages API.

הקוד מתחיל כך:

```python
import os

import anthropic
```

הספרייה os משמשת לקריאת משתני סביבה.

הספרייה anthropic מספקת את ה SDK שמאפשר ליצור client ולשלוח בקשות במבנה Messages API.

לאחר מכן נוצר client:

```python
client = anthropic.Anthropic(
    base_url=os.getenv("ANTHROPIC_BASE_URL", "http://localhost:11434"),
    api_key=os.getenv("ANTHROPIC_AUTH_TOKEN", "ollama"),
)
```

כאן יש שני פרטים חשובים:

1. base_url קובע לאן הבקשות יישלחו.

2. api_key נדרש על ידי ה SDK, אבל Ollama המקומי מתעלם ממנו.

## מהו base_url

הפרמטר:

```python
base_url=os.getenv("ANTHROPIC_BASE_URL", "http://localhost:11434")
```

אומר ל SDK לאן לשלוח את הבקשות.

אם קיים משתנה סביבה בשם: ANTHROPIC_BASE_URL

הקוד ישתמש בו.

אם המשתנה לא קיים, הקוד ישתמש בערך ברירת המחדל: http://localhost:11434

זו הכתובת המקומית שבה Ollama מאזין כברירת מחדל.

היתרון בשימוש ב os.getenv הוא גמישות. אפשר להריץ את אותו קוד מול Ollama מקומי, או לשנות יעד דרך משתנה סביבה בלי לשנות את הקוד עצמו.

לדוגמה ב PowerShell:

```bash
$env:ANTHROPIC_BASE_URL="http://localhost:11434"
```

ואז להריץ:

```bash
python .\examples\ollama_anthropic.py
```

## למה api_key נדרש אבל לא באמת משמש את Ollama

בקוד מופיע:

```python
api_key=os.getenv("ANTHROPIC_AUTH_TOKEN", "ollama")
```

ה SDK של Anthropic מצפה לקבל api_key, ולכן חייבים לספק ערך כלשהו.

אבל כאשר עובדים מול Ollama מקומי, אין כאן אימות אמיתי מול Anthropic. הערך: ollama

הוא ערך דמה. הוא נדרש כדי שה SDK יעבוד, אבל Ollama מתעלם ממנו.

אם בעתיד אותו קוד יעבוד מול שירות Anthropic אמיתי, אז כבר צריך להשתמש במפתח אמיתי ולשמור אותו בצורה מאובטחת, למשל דרך .env.

אבל בדוגמה המקומית, ANTHROPIC_AUTH_TOKEN אינו סוד אמיתי.

**שליחת בקשה במבנה Messages API**

הקריאה למודל נראית כך:

```python
message = client.messages.create(
    model="gemma3:1b",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Why is the sky blue?"}],
)
```

הבקשה כוללת שלושה חלקים מרכזיים.

הפרמטר:

```python
model="gemma3:1b"
```

אומר ל Ollama באיזה מודל מקומי להשתמש. לכן לפני הרצת הקוד צריך לוודא שהמודל קיים אצלנו:

```python
ollama pull gemma3:1b
```

או לבדוק ברשימת המודלים:

```python
ollama list
```

הפרמטר:

```python
max_tokens=1024
```

מגביל את אורך התשובה.

והפרמטר:

```python
messages=[{"role": "user", "content": "Why is the sky blue?"}]
```

שולח הודעת משתמש אחת למודל.

**קריאת התשובה**

התשובה מודפסת כך:

```python
print(message.content[0].text)
```

כלומר, הטקסט הסופי נמצא בתוך:

```python
message.content[0].text
```

לא בתוך response.message.content, כמו בדוגמה של ספריית ollama.

זו נקודה חשובה: כאשר מחליפים SDK, גם מבנה התשובה משתנה.

בקוד הזה משתמשים במודל gemma3:1b, ולכן צריך לוודא שהוא הורד ל Ollama לפני ההרצה. אם המודל לא קיים, נקבל שגיאת model not found, בדיוק כמו שקרה קודם עם joker.



## קבלת תשובה מהמודל המקומי

אחרי שהבקשה נשלחת דרך:

```python
message = client.messages.create(
    model="gemma3:1b",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Why is the sky blue?"}],
)
```

התגובה נשמרת במשתנה: message

אבל התשובה אינה חוזרת כמחרוזת פשוטה. היא חוזרת במבנה של Anthropic Messages API, ולכן כדי להגיע לטקסט עצמו משתמשים בשורה:

```python
print(message.content[0].text)
```

נפרק את זה: message

הוא אובייקט התגובה שחזר מהמודל.

message.content הוא מערך של חלקי תוכן שהמודל החזיר.

message.content[0] הוא החלק הראשון בתשובה.

message.content[0].text הוא הטקסט עצמו.

כלומר, אם המודל ענה:

```bash
The sky appears blue because molecules in the atmosphere scatter shorter blue wavelengths of sunlight more than longer red wavelengths.
```

אז הטקסט הזה נמצא בתוך: message.content[0].text

זו נקודה שחשוב לשים לב אליה, כי בפרק הקודם, כשעבדנו ישירות עם ספריית ollama, קראנו את התשובה בצורה אחרת:

```python
response.message.content
```

כאן, בגלל שאנחנו משתמשים במבנה של Anthropic SDK, הנתיב לתשובה שונה:

```python
message.content[0].text
```

הרעיון דומה, אבל מבנה האובייקט שונה.

**למה צריך לוודא שהמודל קיים ב Ollama**

בקוד מופיע:

```python
model="gemma3:1b"
```

המשמעות היא שהבקשה נשלחת ל Ollama ומבקשת ממנו להריץ מודל מקומי בשם: gemma3:1b

אם המודל הזה לא קיים במחשב, נקבל שגיאת model not found.

לכן לפני הרצת הקובץ כדאי לוודא שהמודל קיים:

```bash
ollama list
```

אם הוא לא מופיע ברשימה, מורידים אותו:

```bash
ollama pull gemma3:1b
```

ואז מריצים שוב:

```bash
python .\examples\ollama_anthropic.py
```

זו אותה לוגיקה שראינו עם joker: כאשר הקוד מבקש מודל בשם מסוים, Ollama חייב להכיר את המודל הזה מקומית.

ההבדל הוא ש gemma3:1b הוא מודל שאפשר למשוך מ Ollama, בעוד joker הוא מודל מותאם שצריך ליצור בעזרת Modelfile.

## היתרון הארכיטקטוני: החלפת ספק בלי לשכתב את כל הקוד

היתרון המרכזי של הגישה הזאת הוא לא טכני בלבד. הוא ארכיטקטוני.

כאשר אפליקציה משתמשת במודל שפה, קל מאוד לקשור את כל הקוד לספק אחד או לספרייה אחת. בהתחלה זה נראה נוח, אבל בהמשך זה יכול להפוך לבעיה. אם רוצים להחליף ספק, לבדוק מודל מקומי, לעבור למודל אחר או להריץ חלק מהבקשות בתוך הארגון, פתאום מגלים שהקוד העסקי תלוי במימוש מסוים.

שימוש בשכבת תאימות מקטין את התלות הזאת.

במקום שהקוד יהיה קשור ישירות לשרת חיצוני, אפשר להגדיר:

```python
base_url=os.getenv("ANTHROPIC_BASE_URL", "http://localhost:11434")
```

וכך לשלוט ביעד דרך משתנה סביבה.

הזרימה נראית כך:

```bash
Application Code
-> Anthropic SDK
-> base_url
-> Ollama Local Server
-> Local Model
-> Response
```

כלומר, הקוד עובד במבנה של Anthropic Messages API, אבל בפועל הבקשה מגיעה ל Ollama המקומי.

זה מאפשר לבדוק מודל מקומי בלי לשכתב את כל שכבת הקריאה למודל.

**הפיכת הקוד לפונקציה שימושית**

הקוד המקורי טוב כדוגמת לימוד, אבל באפליקציה אמיתית כדאי לעטוף אותו בפונקציה.

לדוגמה:

```python
import os
import anthropic


def ask_local_model(
    prompt: str,
    model_name: str = "gemma3:1b",
    max_tokens: int = 1024
) -> str:
    client = anthropic.Anthropic(
        base_url=os.getenv("ANTHROPIC_BASE_URL", "http://localhost:11434"),
        api_key=os.getenv("ANTHROPIC_AUTH_TOKEN", "ollama"),
    )

    message = client.messages.create(
        model=model_name,
        max_tokens=max_tokens,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    return message.content[0].text


answer = ask_local_model("Why is the sky blue?")
print(answer)
```

עכשיו שאר האפליקציה לא צריכה לדעת איך יוצרים client, מהו base_url, מהו api_key, או איך קוראים את התשובה מתוך message.content[0].text.

היא רק קוראת:

```python
ask_local_model("Why is the sky blue?")
```

ומקבלת טקסט.

**גרסה עם מחלקה קטנה**

בפרויקט גדול יותר, אפשר לעטוף את זה במחלקה:

```python
import os
import anthropic


class AnthropicCompatibleLocalClient:
    def __init__(
        self,
        model_name: str = "gemma3:1b",
        base_url: str | None = None,
        api_key: str | None = None
    ):
        self.model_name = model_name
        self.client = anthropic.Anthropic(
            base_url=base_url or os.getenv("ANTHROPIC_BASE_URL", "http://localhost:11434"),
            api_key=api_key or os.getenv("ANTHROPIC_AUTH_TOKEN", "ollama"),
        )

    def ask(self, prompt: str, max_tokens: int = 1024) -> str:
        message = self.client.messages.create(
            model=self.model_name,
            max_tokens=max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        )

        return message.content[0].text


client = AnthropicCompatibleLocalClient(model_name="gemma3:1b")
print(client.ask("Explain local LLMs in one short paragraph."))
```

היתרון הוא שיש לנו מקום אחד שמנהל את החיבור למודל. אם בעתיד נרצה להחליף מודל, לשנות base_url, להוסיף logging או לטפל בשגיאות, לא נצטרך לגעת בכל הקוד העסקי.

## טיפול בסיסי בשגיאות

גם כאן כדאי להיזהר. הקריאה יכולה להיכשל אם Ollama לא רץ, אם המודל לא קיים, אם הפורט לא זמין, או אם יש חוסר תאימות בפרמטרים.

דוגמה פשוטה:

```python
import os
import anthropic


def ask_local_model(prompt: str, model_name: str = "gemma3:1b") -> str:
    try:
        client = anthropic.Anthropic(
            base_url=os.getenv("ANTHROPIC_BASE_URL", "http://localhost:11434"),
            api_key=os.getenv("ANTHROPIC_AUTH_TOKEN", "ollama"),
        )

        message = client.messages.create(
            model=model_name,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        )

        return message.content[0].text

    except Exception as ex:
        return f"Failed to get response from local model: {ex}"
```

במערכת אמיתית לא נחזיר למשתמש את השגיאה הגולמית. נרשום אותה ל log ונחזיר הודעה נקייה יותר. אבל לצורך לימוד, הדוגמה עוזרת להבין איפה עלולה להתרחש תקלה.

## המגבלות של התאימות

חשוב לא להגזים במשמעות של Anthropic Compatibility.

העובדה שאפשר להשתמש ב SDK של Anthropic מול Ollama לא אומרת שכל יכולת של Anthropic קיימת בדיוק באותה צורה ב Ollama.

יכולים להיות הבדלים ב:

- תמיכה בפרמטרים מסוימים

- מבנה התשובה

- Streaming

- Tools או function calling

- System messages

- ניהול context

- שגיאות

- מגבלות אורך

- התנהגות המודל

- איכות התשובה

אם משתמשים רק ב messages, model, max_tokens ו prompt פשוט, בדרך כלל קל יותר לעבוד. אבל אם האפליקציה משתמשת ביכולות מתקדמות, צריך לבדוק כל יכולת בנפרד.

תאימות היא לא זהות מלאה. היא שכבת נוחות.

**למה זה חשוב ל AI Engineer**

הקובץ ollama_anthropic.py מדגים רעיון חשוב: לא חייבים לקשור את האפליקציה ישירות לספק אחד או לספרייה אחת.

אפשר לבנות שכבת גישה למודל שמאפשרת להחליף יעד:

Ollama מקומי

Anthropic אמיתי

ספק חיצוני אחר

מודל פנימי

Endpoint אחר

הקוד העסקי לא צריך לדעת את כל הפרטים. הוא צריך לשלוח בקשה ולקבל תשובה. שכבת התשתית היא זו שמחליטה לאן לשלוח את הבקשה.

זו גישה חשובה במיוחד בפרויקטים אמיתיים, כי היא מאפשרת לבדוק חלופות בלי לשבור את כל המערכת.
