# קריאה ל Ollama מתוך Python

אחרי שהבנו מהו Ollama, איך מריצים מודל מקומית, ומה המשמעות של שרת מקומי שמאזין ל requests, אפשר לעבור לשלב הבא: לקרוא למודל מתוך קוד Python.

עד עכשיו ראינו שאפשר להריץ מודל דרך הטרמינל:

```bash
ollama run gemma3:4b
```

או לדבר עם מודל בצורה אינטראקטיבית. אבל באפליקציה אמיתית אנחנו לא רוצים שהמשתמש יפתח טרמינל ויכתוב למודל ידנית. אנחנו רוצים שהקוד שלנו ידבר עם המודל.

הקובץ gemma1.py מדגים בדיוק את זה: סקריפט Python קצר ששולח הודעה למודל מקומי בשם joker, מקבל תשובה, ומדפיס אותה למסך. הקובץ משתמש בפונקציה chat מתוך הספרייה ollama, שולח הודעת user, ואז קורא את התשובה מתוך response.message.content.

## מטרת הקובץ gemma1.py

המטרה של gemma1.py היא להראות איך אפליקציית Python יכולה לדבר עם מודל שרץ ב Ollama.

הקובץ קצר מאוד:

```python
from ollama import chat

response = chat(
    model='joker',
    messages=[{'role': 'user', 'content': 'Hello!'}],
)

print(response.message.content)
```

למרות שהוא קצר, הוא מדגים רעיון חשוב מאוד: ברגע ש Ollama רץ במחשב, Python יכול לשלוח אליו הודעה כמו אל שירות מקומי. הקוד לא טוען tokenizer, לא טוען weights, לא מתעסק עם tensors, ולא מנהל device. כל זה נמצא מאחורי Ollama.

האפליקציה רק אומרת:

- לאיזה מודל לפנות.

- איזו הודעה לשלוח.

- מאיפה לקרוא את התשובה.

זו בדיוק שכבת הנוחות ש Ollama נותן לנו.

## תנאי מקדים: יצירת המודל המקומי joker

לפני שמריצים את הקובץ gemma1.py, חשוב להבין ש joker אינו מודל שמגיע מובנה עם Ollama.

כאשר בקוד מופיע:

```python
model='joker'
```

המשמעות היא שהקוד מבקש מ Ollama להשתמש במודל מקומי בשם joker. אם מודל כזה לא נוצר מראש, נקבל שגיאה כמו:

```bash
model 'joker' not found
```

לכן לפני הרצת הקובץ צריך ליצור את המודל joker באמצעות Modelfile.

קובץ Modelfile הוא קובץ הגדרה שמספר ל Ollama מאיזה מודל בסיס להתחיל, ואילו הוראות או פרמטרים להוסיף מעליו.

לדוגמה, אפשר ליצור קובץ בשם:

```bash
examples/Modelfile.joker
```

ובתוכו:

```python
FROM gemma3:4b

PARAMETER temperature 0.9
PARAMETER top_p 0.9

SYSTEM """
You are Joker, a playful local AI assistant.
Answer clearly, but with light humor.
Keep answers useful and concise.
"""
```

השורה החשובה ביותר היא:

```python
FROM gemma3:4b
```

היא אומרת ל Ollama שהמודל joker יתבסס על gemma3:4b.

אם מודל הבסיס עדיין לא קיים במחשב, אפשר להוריד אותו:

```bash
ollama pull gemma3:4b
```

לאחר מכן יוצרים את המודל המקומי:

```bash
ollama create joker -f .\examples\Modelfile.joker
```

אפשר לוודא שהוא נוצר בעזרת:

```bash
ollama list
```

אם joker מופיע ברשימה, אפשר להריץ את הקובץ:

```python
python .\examples\gemma1.py
```

זה הפלט הצפוי:

```bash
(.venv) PS [Lesson-7-open-source-models-local-llms]> python .\examples\gemma1.py
Well hello there, sunshine! What delightful chaos can I help you stir up today? 😄
```

הנקודה החשובה היא ש gemma1.py לא יוצר את joker. הוא רק משתמש בו. יצירת joker היא שלב מקדים שחייב להתבצע לפני הקריאה מתוך Python.

עכשיו, אחרי שהמודל המקומי joker קיים ב Ollama, אפשר להבין את הקובץ gemma1.py, שמדגים איך Python שולח אליו הודעה ומקבל תשובה.

## שימוש ב ollama.chat

השורה הראשונה בקובץ היא:

```python
from ollama import chat
```

כאן אנחנו מייבאים את הפונקציה chat מתוך ספריית Python של Ollama.

כדי שהקוד יעבוד, צריך להתקין את הספרייה:

```bash
pip install ollama
```

וצריך לוודא שגם Ollama עצמו מותקן ורץ במחשב.

הפונקציה chat מאפשרת לשלוח למודל הודעות בפורמט שיחה. היא מתאימה למודלים שמצפים למבנה של messages, בדומה למה שראינו בפרק על Qwen ובדומה לממשקי chat נפוצים.

הקריאה עצמה נראית כך:

```python
response = chat(
    model='joker',
    messages=[{'role': 'user', 'content': 'Hello!'}],
)
```

כלומר, אנחנו מבקשים מ Ollama להריץ שיחה מול מודל בשם joker, עם הודעה אחת מהמשתמש.

## בחירת מודל מקומי בשם joker

בקריאה ל chat מופיע:

```python
model='joker'
```

השם joker אינו שם כללי של מודל ציבורי כמו llama3 או gemma3:4b. זה שם של מודל מקומי שנוצר או הוגדר אצלנו בתוך Ollama.

בדרך כלל מודל כזה נוצר באמצעות Modelfile, למשל כאשר לוקחים מודל בסיס כמו Gemma או Llama, ומוסיפים לו system prompt, פרמטרים והתנהגות מותאמת.

כלומר, joker הוא לא בהכרח מודל חדש שאומן מאפס. ברוב המקרים הוא מודל מקומי מותאם, שנשען על מודל בסיס קיים, אבל מקבל שם חדש והתנהגות מוגדרת.

המשמעות היא שהקוד לא צריך לדעת מה נמצא מאחורי joker. מבחינת Python, joker הוא פשוט שם המודל שאליו שולחים הודעה.

אפשר לבדוק אילו מודלים קיימים אצלנו ב Ollama בעזרת:

```bash
ollama list
```

ואם joker לא מופיע שם, הקריאה תיכשל כי Ollama לא ימצא מודל בשם הזה.

## מבנה messages

הפרמטר השני בקריאה הוא:

```python
messages=[{'role': 'user', 'content': 'Hello!'}]
```

זהו מבנה של רשימת הודעות.

גם אם יש רק הודעה אחת, היא עדיין נמצאת בתוך רשימה. הסיבה היא שמודל chat יכול לקבל שיחה שלמה, לא רק הודעה בודדת.

כל הודעה כוללת שני שדות מרכזיים:

```python
{
    'role': 'user',
    'content': 'Hello!'
}
```

role אומר מי כתב את ההודעה.

content מכיל את תוכן ההודעה.

במקרה הזה, המשתמש שולח למודל את ההודעה:

```bash
Hello!
```

אפשר להחליף אותה בכל prompt אחר:

```python
messages=[
    {
        'role': 'user',
        'content': 'Explain what local inference means in one paragraph.'
    }
]
```

או:

```python
messages=[
    {
        'role': 'user',
        'content': 'Review this Python function and suggest improvements.'
    }
]
```

המבנה הזה חשוב כי הוא מאפשר להרחיב את הקוד בקלות בהמשך. במקום לשלוח רק הודעה אחת, אפשר לשלוח גם system message והיסטוריית שיחה.

לדוגמה:

```python
messages=[
    {'role': 'system', 'content': 'You are a concise AI engineering tutor.'},
    {'role': 'user', 'content': 'Explain Ollama in simple terms.'}
]
```

כאן ה system מגדיר את אופי ההתנהגות, וה user שולח את הבקשה עצמה.

**שליחת הודעת user**

בקובץ המקורי ההודעה פשוטה מאוד:

```python
{'role': 'user', 'content': 'Hello!'}
```

זו הודעת בדיקה. המטרה שלה היא לא לבדוק יכולת עמוקה של המודל, אלא לוודא שהחיבור עובד:

Python מצליח לקרוא לספריית Ollama.

Ollama מצליח למצוא את המודל joker.

המודל מצליח להחזיר תשובה.

הקוד מצליח להדפיס את התוכן.

לכן Hello! הוא prompt טוב לבדיקה ראשונית, אבל לא מספיק לבדיקה אמיתית של איכות המודל.

אחרי שהחיבור עובד, כדאי לבדוק prompts משמעותיים יותר, למשל:

```python
messages=[
    {
        'role': 'user',
        'content': 'Explain the difference between RAG and fine tuning.'
    }
]
```

או:

```python
messages=[
    {
        'role': 'user',
        'content': 'Summarize this text in three bullet points: ...'
    }
]
```

כך עוברים מבדיקת תקשורת לבדיקה של יכולת אמיתית.



## קריאת התשובה מתוך response.message.content

אחרי שהקוד שולח הודעה למודל, התוצאה נשמרת במשתנה:

```python
response = chat(
    model='joker',
    messages=[{'role': 'user', 'content': 'Hello!'}],
)
```

התגובה שמתקבלת מ Ollama אינה רק מחרוזת פשוטה. היא אובייקט שמכיל מידע על התשובה, ובתוכו נמצאת ההודעה שהמודל החזיר.

לכן מדפיסים את התוכן כך:

```python
print(response.message.content)
```

כלומר:

response הוא האובייקט שחזר מ Ollama.

message הוא חלק התשובה שמייצג את הודעת המודל.

content הוא הטקסט עצמו שהמודל יצר.

במילים פשוטות, אם המודל ענה:

```bash
Hello! How can I help you today?
```

אז זה הטקסט שנמצא בתוך:

```bash
response.message.content
```

זו נקודה חשובה, כי באפליקציה אמיתית כמעט אף פעם לא נרצה להדפיס את כל אובייקט התגובה. נרצה לקחת רק את התוכן שהמשתמש אמור לראות, או את התוכן שהמערכת צריכה להמשיך לעבד.

## איך להפוך את הדוגמה לפונקציה שימושית

הקוד המקורי טוב לבדיקה ראשונית, אבל באפליקציה אמיתית לא נרצה לכתוב בכל פעם את הקריאה ל chat מחדש. עדיף לעטוף את הקריאה בפונקציה.

לדוגמה:

```python
from ollama import chat


def ask_local_model(prompt: str, model_name: str = "joker") -> str:
    response = chat(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    return response.message.content


answer = ask_local_model("Explain what Ollama is in one paragraph.")
print(answer)
```

עכשיו יש לנו פונקציה פשוטה:

```python
ask_local_model(prompt)
```

היא מקבלת טקסט, שולחת אותו למודל המקומי, ומחזירה תשובה.

זו כבר צורה שמתאימה יותר לאפליקציה, כי אפשר לקרוא לפונקציה הזאת ממקומות שונים בקוד: שירות backend, כלי CLI, מסך ניהול, תהליך batch, או Agent קטן.

**הוספת System Message**

בגרסה הבסיסית של הקוד שלחנו רק הודעת user. אבל לעיתים נרצה להגדיר למודל התנהגות כללית.

למשל, אם אנחנו רוצים שהמודל יענה בקצרה ובסגנון של מורה טכני, אפשר להוסיף הודעת system:

```python
from ollama import chat


def ask_local_model(prompt: str, model_name: str = "joker") -> str:
    response = chat(
        model=model_name,
        messages=[
            {
                "role": "system",
                "content": "You are a concise AI engineering tutor. Answer clearly and practically."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    return response.message.content


answer = ask_local_model("Explain the difference between RAG and fine tuning.")
print(answer)
```

הודעת system אינה השאלה עצמה. היא מגדירה למודל איך להתנהג.

הודעת user היא הבקשה הספציפית.

בדרך הזו אפשר ליצור שכבת שליטה בסיסית על הסגנון, האורך, רמת הפירוט או התפקיד של המודל.

**טיפול בסיסי בשגיאות**

בדוגמת לימוד קצרה אפשר להניח שהכול עובד. באפליקציה אמיתית לא כדאי להניח זאת.

הקריאה ל Ollama יכולה להיכשל אם:

Ollama לא רץ.

המודל joker לא קיים.

המודל עדיין לא ירד למחשב.

אין מספיק זיכרון.

הבקשה ארוכה מדי.

יש שגיאת תקשורת מול השרת המקומי.

לכן אפשר לעטוף את הקריאה ב try ו except:

```python
from ollama import chat


def ask_local_model(prompt: str, model_name: str = "joker") -> str:
    try:
        response = chat(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        )

        return response.message.content

    except Exception as ex:
        return f"Failed to get response from local model: {ex}"


answer = ask_local_model("Hello!")
print(answer)
```

במערכת אמיתית כנראה לא נחזיר את הודעת השגיאה כמו שהיא למשתמש. נרצה לרשום אותה ל log ולהחזיר הודעה נקייה יותר. אבל לצורך לימוד, הדוגמה הזאת עוזרת להבין איפה יכולה להיות תקלה.

**הפרדה בין קוד תשתית לקוד עסקי**

ככל שהפרויקט גדל, לא כדאי שכל קובץ באפליקציה יקרא ישירות ל ollama.chat.

עדיף ליצור קובץ קטן שאחראי רק על התקשורת עם המודל המקומי.

לדוגמה:

local_llm_client.py

ובתוכו:

```python
from ollama import chat


class LocalLlmClient:
    def __init__(self, model_name: str = "joker"):
        self.model_name = model_name

    def ask(self, prompt: str) -> str:
        response = chat(
            model=self.model_name,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        )

        return response.message.content
```

ואז בקובץ אחר:

```python
from local_llm_client import LocalLlmClient


client = LocalLlmClient(model_name="joker")

answer = client.ask("Explain local inference in simple terms.")
print(answer)
```

היתרון הוא שהקוד העסקי לא תלוי ישירות בפרטים של Ollama. אם בעתיד נרצה להחליף מודל, לשנות פורמט הודעות, להוסיף system prompt, להוסיף logging או לעבור לספק אחר, נצטרך לשנות פחות מקומות.

זו חשיבה ארכיטקטונית נכונה: לא מפזרים קריאות למודל בכל הקוד. מרכזים אותן בשכבה אחת ברורה.

**הפיכת הקריאה לכלי שימושי באפליקציה**

אחרי שיש לנו פונקציה או מחלקה שעוטפת את Ollama, אפשר להתחיל לבנות יכולות אמיתיות.

לדוגמה, פונקציה שמסכמת טקסט:

```python
def summarize_text(client: LocalLlmClient, text: str) -> str:
    prompt = f"""
Summarize the following text in 3 short bullet points:

{text}
"""

    return client.ask(prompt)
```

או פונקציה שמסבירה קוד:

```python
def explain_code(client: LocalLlmClient, code: str) -> str:
    prompt = f"""
Explain the following code clearly and briefly:

{code}
"""

    return client.ask(prompt)
```

או פונקציה שמבצעת בדיקת קוד בסיסית:

```python
def review_code(client: LocalLlmClient, code: str) -> str:
    prompt = f"""
Review the following code.
Focus on readability, bugs, edge cases, and maintainability.

Code:
{code}
"""

    return client.ask(prompt)
```

המודל המקומי הופך כאן לרכיב שאפשר לקרוא לו מתוך פונקציות רגילות. זה כבר הרבה יותר קרוב לאפליקציה אמיתית מאשר שיחה ידנית בטרמינל.

**מה חשוב לבדוק לפני שמסתמכים על הפונקציה**

גם אם הקריאה ל Ollama עובדת, עדיין צריך לבדוק את איכות התוצאה.

**צריך לבדוק:**

- האם המודל עונה בפורמט הרצוי.

- האם הוא עונה בקצרה או מאריך מדי.

- האם הוא מתמודד טוב עם עברית, אם צריך.

- האם הוא מבין את הדומיין.

- האם הוא ממציא תשובות.

- האם הוא שומר על הוראות.

- האם זמן התגובה מתאים.

- האם המודל המקומי מספיק טוב למשימה או שצריך מודל אחר.

כלומר, הפונקציה ask_local_model היא רק שכבת תקשורת. היא לא מבטיחה שהתשובה נכונה. עדיין צריך בדיקות, דוגמאות, ולפעמים גם guardrails.


