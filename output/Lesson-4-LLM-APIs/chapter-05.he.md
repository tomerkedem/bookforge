# תרגול הבית - עבודה מעשית עם LLMs

לאחר שהמרצה סיים להציג את הדוגמאות המרכזיות לעבודה עם Anthropic API, קיבלנו שני תרגילי בית שמטרתם לקחת את כל הרעיונות שנלמדו בשיעור ולהפוך אותם לתרגול מעשי אמיתי.

התרגילים האלו חשובים מאוד משום שהם משלבים יחד כמעט את כל הנושאים המרכזיים שנלמדו:

- עבודה עם Messages

- שליחת Requests למודל

- Structured Output

- Conversation History

- עבודה עם קבצים

- שימוש ב-JSON

- ושילוב מודל AI בתוך תוכנת Python אמיתית

המטרה אינה רק "לגרום למודל לענות", אלא להתחיל לחשוב כמו AI Engineer שבונה מערכת אמיתית.

**מבנה הפרויקט המומלץ**

כדי לשמור על סדר והפרדה בין קבצי ההדגמה של המרצה לבין שיעורי הבית, ניצור תיקיית homework נפרדת בתוך הפרויקט.

מבנה מומלץ:

```bash
lesson-04-llm-apis/
│
├── data/
│
├── homework/
│   │
│   ├── exercise01-document-classification/
│   │   │
│   │   ├── documents/
│   │   │   ├── car_1.txt
│   │   │   ├── car_2.txt
│   │   │   ├── sport_1.txt
│   │   │   ├── music_1.txt
│   │   │   └── music_2.txt
│   │   │
│   │   ├── summaries/
│   │   │
│   │   └── document_classifier.py
│   │
│   ├── exercise02-conversation-history/
│   │   │
│   │   └── conversation_history.py
│   │
│   └── README.md
│
├── 1_anthropic_api_request.py
├── 2_anthropic_api_streaming.py
├── 3_anthropic_api_thinking.py
├── 4_anthropic_api_structured.py
│
├── requirements.txt
└── .gitignore
```

**יצירת כל התיקיות והקבצים**

המרצה המליץ לעבוד בצורה מסודרת כבר מההתחלה.

אפשר ליצור את כל מבנה הפרויקט באמצעות פקודות CLI:

```bash
mkdir homework

mkdir homework\exercise01-document-classification
mkdir homework\exercise01-document-classification\documents
mkdir homework\exercise01-document-classification\summaries

mkdir homework\exercise02-conversation-history

type nul > homework\exercise01-document-classification\document_classifier.py
type nul > homework\exercise02-conversation-history\conversation_history.py

type nul > homework\exercise01-document-classification\documents\car_1.txt
type nul > homework\exercise01-document-classification\documents\car_2.txt
type nul > homework\exercise01-document-classification\documents\sport_1.txt
type nul > homework\exercise01-document-classification\documents\music_1.txt
type nul > homework\exercise01-document-classification\documents\music_2.txt

type nul > homework\README.md
```

## פתרון תרגיל ראשון: סיווג וסיכום מסמכים בעזרת LLM

הקוד המלא נמצא בגיטהאב:

https://github.com/tomerkedem/ai-engineering-course

בפרק הזה לא נעתיק את כל קבצי הטקסט, אלא נסביר את הדרך הנכונה לפתור את התרגיל ואת ההיגיון שמאחורי הקוד.

**מטרת התרגיל**

לבנות תוכנית Python שקוראת מסמכים מתוך תיקייה, שולחת כל מסמך למודל, מקבלת בחזרה JSON עם קטגוריה וסיכום, ושומרת את הסיכום בתיקייה המתאימה.

הזרימה הכללית היא:

<img src="/Lesson-4-LLM-APIs/assets/image-08.png" alt="image-08.png" width="709" height="152" />


**מבנה הפרויקט**

בתוך תיקיית השיעור ניצור תיקיית שיעורי בית:

```bash
lesson-04-llm-apis/
  homework/
    exercise01-document-classification/
      documents/
      summaries/
      document_classifier.py
```

בתיקיית documents יהיו לפחות חמישה קבצי טקסט בנושאים:

cars 
sport 
music

בתיקיית summaries התוכנית תשמור את התוצאות.

**שלב ראשון - הכנת המסמכים**

ניצור לפחות חמישה קבצים, לדוגמה:

```bash
car_1.txt
car_2.txt
sport_1.txt
music_1.txt
music_2.txt
```

כל קובץ צריך להכיל בערך 200 מילים ולהיות קשור לאחד משלושת הנושאים.

**הסבר הקוד בקובץ document_classifier.py**

הקובץ document_classifier.py הוא הלב של התרגיל. הוא מבצע את כל ה-Pipeline:

<img src="/Lesson-4-LLM-APIs/assets/image-09.png" alt="image-09.png" width="710" height="177" />


**טעינת הספריות**

```python
import json
import os
from pathlib import Path

import anthropic
from dotenv import load_dotenv
```

כאן הקוד טוען את הספריות הדרושות:

json משמשת להמרת תשובת JSON מהמודל לאובייקט Python.

os משמשת לקריאת משתני סביבה, בעיקר ANTHROPIC_API_KEY.

Path משמשת לעבודה נקייה עם תיקיות וקבצים.

anthropic היא ספריית ה-SDK לעבודה מול Claude.

load_dotenv טוענת את הערכים מקובץ env.

**טעינת ה-API Key ויצירת Client**

```python
load_dotenv()

client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)
```

כאן הקוד טוען את קובץ env, שולף ממנו את ה-API Key, ויוצר Client שמאפשר לשלוח בקשות ל-Anthropic API.

הסיבה שלא כותבים את ה-API Key ישירות בקוד היא אבטחה. המפתח נשאר מחוץ לקוד ולא אמור לעלות ל-GitHub.

**הגדרת נתיבי העבודה**

```python
BASE_DIR = Path(__file__).parent
DOCUMENTS_DIR = BASE_DIR / "documents"
SUMMARIES_DIR = BASE_DIR / "summaries"

ALLOWED_CLASSES = ["cars", "sport", "music"]
```

BASE_DIR מצביע על התיקייה שבה נמצא הקובץ document_classifier.py.

מתוכה מוגדרות שתי תיקיות:

DOCUMENTS_DIR היא התיקייה שממנה קוראים את המסמכים.

SUMMARIES_DIR היא התיקייה שאליה שומרים את הסיכומים.

ALLOWED_CLASSES מגדיר את שלוש הקטגוריות היחידות שהמודל רשאי להחזיר.

**הפונקציה classify_and_summarize_document**

```python
def classify_and_summarize_document(document_text: str) -> dict:
```

הפונקציה מקבלת טקסט של מסמך אחד ומחזירה מילון Python עם שני שדות:

בתוך הפונקציה מתבצעת קריאת LLM אחת בלבד למסמך.

```python
response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=800,
    temperature=0,
    messages=[
        {
            "role": "user",
            "content": f"""
...
"""
        }
    ],
)
```

כאן נשלחת הבקשה למודל.

model בוחר את המודל.

max_tokens מגביל את אורך התשובה.

temperature=0 גורם לתשובה להיות יציבה וצפויה יותר, וזה חשוב במיוחד כאשר רוצים JSON תקין.

messages מכיל את ההוראה למודל ואת תוכן המסמך.

**הפרומפט**

```python
Classify the following document into exactly one of these classes:
cars, sport, music.

Return only valid JSON in this exact format:
```

זה החלק שמכוון את המודל לבצע שתי פעולות יחד:

לסווג את המסמך.

לסכם אותו.

המודל מתבקש להחזיר רק JSON, בלי הסברים מסביב. זה חשוב משום שהקוד בהמשך מנסה להמיר את התשובה בעזרת json.loads.

**המרת התשובה ל-dict**

```python
return json.loads(response.content[0].text)
```

גם אם המודל מחזיר JSON, מבחינת Python זו עדיין מחרוזת טקסט.

json.loads ממיר את הטקסט הזה למילון Python אמיתי.

רק אחרי ההמרה אפשר לעבוד עם הנתונים כך:

```python
result["class_name"]
result["summary"]
```

**הפונקציה save_summary**

```python
def save_summary(file_name: str, class_name: str, summary: str) -> None:
```

הפונקציה מקבלת:

שם קובץ המקור.

שם הקטגוריה.

טקסט הסיכום.

המטרה שלה היא לשמור את הסיכום בתיקייה המתאימה.

**ולידציה על הקטגוריה**

```python
if class_name not in ALLOWED_CLASSES:
    raise ValueError(
        f"Invalid class name returned by model: {class_name}"
    )
```

זו בדיקה חשובה מאוד.

גם כאשר מבקשים מהמודל להחזיר רק אחת משלוש קטגוריות, עדיין לא סומכים עליו בעיניים עצומות.

אם המודל החזיר קטגוריה לא תקינה, הקוד עוצר ומציג שגיאה.

זה עיקרון חשוב ב-AI Engineering:

המודל מייצר Output, אבל המערכת חייבת לבדוק אותו.

**יצירת תיקיית יעד**

```python
target_dir = SUMMARIES_DIR / class_name
target_dir.mkdir(parents=True, exist_ok=True)
```

כאן הקוד יוצר תיקייה לפי שם הקטגוריה.

לדוגמה, אם המודל החזיר:

```python
{
  "class_name": "cars"
}
```

הסיכום יישמר תחת:

```python
summaries/cars/
```

parents=True מאפשר ליצור גם תיקיות ביניים אם צריך.

exist_ok=True אומר שלא תהיה שגיאה אם התיקייה כבר קיימת.

**יצירת שם קובץ הסיכום**

```python
output_file = target_dir / f"{Path(file_name).stem}_summary.txt"
```

אם קובץ המקור נקרא:

car_1.txt

אז Path(file_name).stem מחזיר:

car_ 1

ולכן קובץ הסיכום יהיה:

car_1_summary.txt

**שמירת הסיכום**

```python
output_file.write_text(summary, encoding="utf-8")
```

כאן נשמר טקסט הסיכום לתוך הקובץ החדש.

encoding="utf-8" חשוב כדי לתמוך בטקסטים בשפות שונות.

**הפונקציה main**

```python
def main() -> None:
```

זו נקודת הכניסה הראשית של התוכנית.

היא אחראית להריץ את כל התהליך.

```python
SUMMARIES_DIR.mkdir(exist_ok=True)
```

מוודאת שתיקיית summaries קיימת.

```python
for file_path in DOCUMENTS_DIR.glob("*.txt"):
```

עוברת על כל קבצי הטקסט בתיקיית documents.

```python
document_text = file_path.read_text(encoding="utf-8")
```

קוראת את תוכן המסמך.

```python
result = classify_and_summarize_document(document_text)
```

שולחת את המסמך למודל ומקבלת תוצאה מובנית.

```python
class_name = result["class_name"]
summary = result["summary"]
```

מחלצת מתוך ה-JSON את הקטגוריה ואת הסיכום.

```python
save_summary(
    file_name=file_path.name,
    class_name=class_name,
    summary=summary
)
```

שומרת את הסיכום בתיקייה המתאימה.

```python
print(f"Processed {file_path.name} -> {class_name}")
```

מדפיסה למסך איזה קובץ עובד ולאיזו קטגוריה הוא שויך.

**נקודת הכניסה לתוכנית**

```python
if __name__ == "__main__":
    main()
```

זו הדרך המקובלת ב-Python להפעיל קוד רק כאשר הקובץ מורץ ישירות.

אם בעתיד נרצה לייבא פונקציות מהקובץ הזה לקובץ אחר, ()main לא תרוץ אוטומטית.

**מה חשוב להבין מהתרגיל**

התרגיל הזה מלמד איך להפוך LLM לחלק ממערכת תוכנה אמיתית.

המודל אינו רק עונה בטקסט חופשי. הוא מקבל מסמך, מחזיר JSON, והקוד משתמש בתוצאה כדי להחליט לאן לשמור את הסיכום.

**מה התרגיל מלמד**

התרגיל הזה נראה קטן, אבל הוא מדגים דפוס חשוב מאוד:

<img src="/Lesson-4-LLM-APIs/assets/image-10.png" alt="image-10.png" width="710" height="202" />


כלומר, המודל מקבל טקסט חופשי, מחלץ ממנו משמעות, מחזיר JSON, והקוד משתמש בתוצאה כדי לבצע פעולה אמיתית במערכת.

זהו אחד השימושים החשובים ביותר של LLMs במערכות אמיתיות.

**הרצה**

מתוך תיקיית lesson-04-llm-apis מריצים:

```bash
python homework/exercise01-document-classification/document_classifier.py
```

לאחר ההרצה אמורות להיווצר תיקיות תחת summaries, לדוגמה:

```bash
summaries/
  cars/
  sport/
  music/
```

ובתוכן קבצי הסיכום.



## פתרון תרגיל שני: שיחה מרובת פניות עם Conversation History

בתרגיל השני המטרה היא לבנות תוכנית Python שמנהלת שיחה רציפה עם המודל.

התרגיל מדגים עיקרון יסודי מאוד בעבודה עם LLMs:

המודל לא זוכר את השיחה בעצמו. 
האפליקציה שלנו היא זו ששומרת את היסטוריית השיחה ושולחת אותה מחדש למודל בכל קריאה.

הזרימה הכללית היא:

<img src="/Lesson-4-LLM-APIs/assets/image-11.png" alt="image-11.png" width="710" height="181" />


**הקבצים הנדרשים לתרגיל**

מבנה התרגיל:

```bash
homework/
  exercise02-conversation-history/
    conversation_history.py
```

בתרגיל הזה יש קובץ קוד אחד בלבד:

conversation_history.py

הוא משתמש באותו requirements.txt שכבר קיים בפרויקט הראשי:

```python
anthropic
python-dotenv
```

והוא משתמש באותו קובץ .env שנמצא בתיקיית השיעור:

```python
ANTHROPIC_API_KEY=your_api_key_here
```



**קובץ conversation_history.py**

```python
import os

import anthropic
from dotenv import load_dotenv


load_dotenv()

client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

messages = []


def send_message_to_model(user_input: str) -> str:
    messages.append(
        {
            "role": "user",
            "content": user_input,
        }
    )

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1000,
        temperature=0,
        messages=messages,
    )

    assistant_text = response.content[0].text

    messages.append(
        {
            "role": "assistant",
            "content": assistant_text,
        }
    )

    return assistant_text


def main() -> None:
    print("Chat started. Type 'exit' to stop.")

    while True:
        user_input = input("You: ")

        if user_input.lower() == "exit":
            break

        assistant_response = send_message_to_model(user_input)

        print(f"Claude: {assistant_response}")


if __name__ == "__main__":
    main()
```

**מה מטרת התרגיל**

בתרגיל הראשון עבדנו עם מסמכים. כל מסמך נשלח למודל, והמודל החזיר תשובה מובנית.

בתרגיל השני אנחנו עוברים לעולם של שיחה.

כאן אנחנו לא רוצים רק תשובה חד פעמית. אנחנו רוצים שהמודל יוכל להתייחס למה שנאמר קודם.

לדוגמה:

```python
User: What is your name?
Assistant: My name is Claude.

User: What did you answer before?
Assistant: I said my name is Claude.
```

כדי שזה יעבוד, המודל חייב לקבל את ההיסטוריה הקודמת של השיחה.

**טעינת הספריות**

הקוד מתחיל כך:

```python
import os

import anthropic
from dotenv import load_dotenv
```

הספרייה os משמשת לקריאת משתני סביבה.

הספרייה anthropic היא ה SDK שמאפשר לנו לעבוד מול Anthropic API.

הפונקציה load_dotenv טוענת את קובץ env, שבו נמצא ה API Key.

**טעינת ה API Key**

```python
load_dotenv()

client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)
```

כמו בתרגילים הקודמים, אנחנו לא כותבים את ה API Key-ישירות בקוד.

הקוד קורא אותו מתוך משתני הסביבה, לאחר שנטען קובץ env.

זו צורת עבודה בטוחה ונכונה יותר, משום שהמפתח נשאר מחוץ לקוד ולא אמור לעלות ל-GitHub.

**יצירת רשימת messages**

```python
messages = []
```

זו השורה החשובה ביותר בתרגיל.

הרשימה messages מייצגת את היסטוריית השיחה.

בכל פעם שהמשתמש כותב הודעה, נוסיף אותה לרשימה.

בכל פעם שהמודל מחזיר תשובה, נוסיף גם אותה לרשימה.

כך נבנית שיחה מלאה.

לדוגמה, אחרי כמה פניות הרשימה יכולה להיראות כך:

```python
messages = [
    {
        "role": "user",
        "content": "What is your name?",
    },
    {
        "role": "assistant",
        "content": "My name is Claude.",
    },
    {
        "role": "user",
        "content": "What did you answer before?",
    },
]
```

הנקודה החשובה היא שהמודל לא שומר את הרשימה הזאת בעצמו. 
האפליקציה היא זו ששומרת אותה.

**הפונקציה send_message_to_model**

```python
def send_message_to_model(user_input: str) -> str:
```

הפונקציה מקבלת טקסט מהמשתמש ומחזירה את תשובת המודל.

זו הפונקציה שמנהלת סבב אחד בשיחה.

כלומר:

<img src="/Lesson-4-LLM-APIs/assets/image-12.png" alt="image-12.png" width="710" height="175" />


**הוספת הודעת המשתמש להיסטוריה**

```python
messages.append(
    {
        "role": "user",
        "content": user_input,
    }
)
```

לפני ששולחים את הבקשה למודל, מוסיפים את הודעת המשתמש לרשימת messages.

למה זה חשוב?

כי המודל צריך לקבל את ההודעה החדשה כחלק מהשיחה.

בלי השורה הזו, המודל לא יראה את השאלה הנוכחית של המשתמש.

**שליחת כל היסטוריית השיחה למודל**

```python
response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=1000,
    temperature=0,
    messages=messages,
)
```

כאן מתבצעת קריאת ה API.

הפרמטר החשוב ביותר הוא:

```python
messages=messages
```

אנחנו לא שולחים רק את ההודעה האחרונה.

אנחנו שולחים את כל היסטוריית השיחה שנצברה עד עכשיו.

זו בדיוק הדרך שבה יוצרים שיחה מרובת פניות עם LLM.

**למה שולחים את כל ההיסטוריה**

מודלי LLM עובדים בדרך כלל בלי זיכרון קבוע בין קריאות API.

כל קריאה למודל היא בקשה חדשה.

לכן, אם רוצים שהמודל ידע מה נאמר קודם, צריך לשלוח לו מחדש את ההודעות הקודמות.

במילים פשוטות:

```python
The model remembers only what you send in the current request.
```

האפליקציה מנהלת את הזיכרון. 
המודל משתמש בזיכרון שנשלח אליו בכל בקשה.

**שליפת תשובת המודל**

assistant_text = response.content[0].text

התגובה שחוזרת מהמודל אינה רק טקסט פשוט. 
היא אובייקט Response שמכיל מידע נוסף.

כאן אנחנו שולפים מתוכו את הטקסט שהמודל החזיר.

**הוספת תשובת המודל להיסטוריה**

```python
messages.append(
    {
        "role": "assistant",
        "content": assistant_text,
    }
)
```

זו השורה השנייה הכי חשובה בתרגיל.

אחרי שהמודל עונה, אנחנו מוסיפים את התשובה שלו לרשימת messages.

למה זה חשוב?

כי אם המשתמש ישאל אחר כך:

```bash
What did you answer before?
```

המודל יוכל לראות את התשובה הקודמת בתוך ההיסטוריה.

בלי השורה הזו, השיחה תישבר. 
המודל יראה רק את הודעות המשתמש ולא את התשובות שהוא נתן קודם.

**החזרת התשובה**

```python
return assistant_text
```

בסוף הפונקציה מחזירים את תשובת המודל כדי שהקוד הראשי יוכל להדפיס אותה למסך.

**הפונקציה main**

```python
def main() -> None:
    print("Chat started. Type 'exit' to stop.")
```

הפונקציה main היא נקודת ההפעלה הראשית של התוכנית.

היא מתחילה בהודעה פשוטה למשתמש שמסבירה איך לעצור את השיחה.

**לולאת השיחה**

```python
while True:
    user_input = input("You: ")
```

כאן נוצרת לולאה אינסופית.

בכל סיבוב המשתמש מתבקש להקליד הודעה חדשה.

זו הדרך הפשוטה ביותר לבנות Chat Console בסיסי.

**עצירת השיחה**

```python
if user_input.lower() == "exit":
    break
```

אם המשתמש מקליד:

```bash
exit
```

התוכנית יוצאת מהלולאה ומסתיימת.

השימוש ב ()lower מאפשר למשתמש לכתוב גם:

```bash
EXIT
Exit
eXiT
```

ועדיין התוכנית תזהה את הפקודה.

**שליחת ההודעה למודל**

```python
assistant_response = send_message_to_model(user_input)
```

כאן אנחנו שולחים את הודעת המשתמש לפונקציה שמנהלת את הקריאה למודל.

הפונקציה תוסיף את הודעת המשתמש להיסטוריה, תשלח את כל ההיסטוריה למודל, תקבל תשובה, תוסיף את תשובת המודל להיסטוריה, ותחזיר את הטקסט.

**הדפסת התשובה**

```python
print(f"Claude: {assistant_response}")
```

לבסוף מדפיסים את תשובת המודל למסך.

**נקודת הכניסה לתוכנית**

```python
if __name__ == "__main__":
    main()
```

זו הדרך המקובלת ב Python להפעיל את הקוד הראשי רק כאשר הקובץ מורץ ישירות.

אם בעתיד נרצה לייבא את הפונקציה send_message_to_model מקובץ אחר, הפונקציה main לא תרוץ אוטומטית.

**מה התרגיל הזה מלמד**

התרגיל הזה מלמד את אחד העקרונות החשובים ביותר בעבודה עם מערכות Chat מבוססות LLM:

Conversation state is managed by the application, not by the model.

המודל אינו "זוכר" את השיחה בעצמו.

המערכת צריכה לשמור את ההיסטוריה ולשלוח אותה בכל פעם מחדש.

התרגיל מדגים:

<img src="/Lesson-4-LLM-APIs/assets/image-13.png" alt="image-13.png" width="710" height="182" />


זהו הבסיס של:

מערכות צ'אט, Assistants, Agents, מערכות תמיכה, וממשקים חכמים שמנהלים שיחה מתמשכת.

**הרצה**

מתוך תיקיית lesson-04-llm-apis מריצים:

```bash
python homework/exercise02-conversation-history/conversation_history.py
```

לאחר מכן אפשר להתחיל לדבר עם המודל:

```bash
You: What is your name?
Claude: My name is Claude.

You: What did you answer before?
Claude: I said that my name is Claude.
```

כדי לצאת:

```bash
You: exit
```
