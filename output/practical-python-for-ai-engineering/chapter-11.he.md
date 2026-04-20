# דקורטורים, Context Managers ו-dataclass

## כלים שמקצרים ומפשטים קוד

פייתון נבנתה מתוך תפיסה של **קריאות, פשטות ואלגנטיות**. 
אבל ככל שהמערכת גדלה, גם בקוד היפה ביותר מופיעות חזרות, טיפול בשגיאות שחוזר על עצמו, וניהול משאבים שדורש סדר ומשמעת.

בדיוק בשביל זה קיימים הכלים הבאים:

• **דקורטורים (Decorators)**

פונקציות שעוטפות פונקציות אחרות, מוסיפות להן יכולת או לוגיקה, בלי לגעת בקוד הפנימי.

• **Context Managers**

מבנים שמנהלים משאבים (כגון: קבצים, חיבורים, או טרנזקציות) בצורה בטוחה עם תחביר פשוט.

• **Dataclasses**

דרך תמציתית להגדיר מחלקות נתונים מבלי לחזור על boilerplate אינסופי.

אלה לא רק כלים “חכמים”, הם הדרך הפייתונית לכתוב קוד **נקי, חכם וקצר**, מבלי לוותר על קריאות.



## דקורטורים - פונקציה עוטפת פונקציה (decorator@)

לפעמים נרצה **להוסיף התנהגות** לפונקציה קיימת 
בלי לגעת בקוד שלה. למשל: להדפיס הודעות, למדוד זמן ריצה או לבדוק הרשאות. במקום לשכפל את אותה לוגיקה שוב ושוב,

משתמשים ב-**דקורטור.**

**הרעיון פשוט **דקורטור הוא **פונקציה שעוטפת פונקציה אחרת**. 
מוסיפה לה קוד לפני ואחרי, ומחזירה פונקציה חדשה.

דוגמה

```python
def logger(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__} with {args}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result}")
        return result
    return wrapper
```
כאן:
• logger היא הדקורטור.
• wrapper היא הפונקציה החדשה שעוטפת את הפונקציה המקורית.
**איך משתמשים בזה?**
במקום לכתוב:
```python
add = logger(add)
```
אפשר פשוט להשתמש בתחביר הקצר של דקורטורים:
```python
@logger
def add(a: int, b: int) -> int:
    return a + b
add(3, 5)
```
הסימן @logger אומר לפייתון:
“לפני שאת שומרת את הפונקציה add, תעברי עליה דרך logger.”
מאחורי הקלעים, פייתון עושה בעצם:
```python
add = logger(add)
````
**מה באמת קורה בזמן הריצה**
כשאנחנו כותבים:
```python
add(3, 5)
```
פייתון לא מריצה את add המקורית, אלא את הפונקציה wrapper שחוזרת מהדקורטור. זה סדר הפעולות בפועל:
1. השורה הראשונה בתוך wrapper רצה
קורא לadd- עם (3, 5)
2. Wrapper מפעילה את add(a, b) המקורית
ומקבלת את הערך 8
3. מגיעה ההדפסה השנייה
add החזירה 8
4. בסוף wrapper מחזירה את הערך 8
**הפלט האמיתי שיודפס למסך** קורא ל-add עם (3, 5) add החזירה
```Plaintext
8
```
**למה זה טוב?**
• מוסיף פונקציונליות בלי לשנות את הקוד המקורי.
• מאפשר שימוש חוזר בלוגיקה דומה (כמו לוגים, מדידת זמן, הרשאות וכו’).
• שומר על קוד נקי ומודולרי.

דקורטורים עם פרמטרים (repeat(n=3)@)
אם נרצה שדקורטור יקבל פרמטרים, נעטוף אותו בשכבה נוספת:
```python
from functools import wraps
def repeat(n: int):
    def decorator(func):
       @wraps(func)
       def wrapper(*args, **kwargs):
           result = None
           for i in range(n):
               print(f"Call number {i + 1}")
               result = func(*args, **kwargs)
           return result
       return wrapper
    return decorator
@repeat(3)
def say_hello():
    print("Hello!")
say_hello()
```
שימוש ב-@wraps שומר על שם הפונקציה וה-docstring המקוריים, כדי שלא נאבד מידע חשוב על הפונקציה המקורית.
שימושים נפוצים (@lru_cache, @measure_time)
פייתון כוללת דקורטורים מובנים ושימושיים מאוד, ביניהם:
```python
from functools import lru_cache
import time
@lru_cache(maxsize=100)
def fibonacci(n: int) -> int:
    if n < 2:
       return n
    return fibonacci(n - 1) + fibonacci(n - 2)
# example for measuring runtime
def measure_time(func):
    def wrapper(*args, **kwargs):
       start = time.perf_counter()
       result = func(*args, **kwargs)
       duration = time.perf_counter() - start
       print(f"{func.__name__} ran for {duration:.4f} seconds")
       return result
    return wrapper
@measure_time
def slow_sum():
    time.sleep(1)
    return sum(range(100000))
slow_sum()
```
@lru_cache מאיץ חישובים יקרים על ידי שמירת תוצאות.
@measure_time הוא דוגמה לדקורטור מותאם אישית שיכול לעזור לנתח ביצועים.
Context Managers - with ו-enter/exit
כשתהליך דורש פתיחה וסגירה של משאב (כגון: קובץ, חיבור רשת או טרנזקציה), Context Manager מאפשר לו להתנהל אוטומטית:
```python
class FileHandler:
    def __init__(self, path: str):
        self.path = path
        self.file = None
    def __enter__(self):
        # Setup: Open the resource
        self.file = open(self.path, "w", encoding="utf8")
        return self.file
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Teardown: Ensure the resource is closed
        if self.file:
            self.file.close()
with FileHandler("data/output.txt") as f:
    f.write("Hello world!")
```
כשה-with מסתיים, המתודה __exit__ מופעלת תמיד, גם אם נזרקה חריגה. אין צורך לזכור לסגור קובץ או לשחרר משאב, זה מתבצע אוטומטית.
contextlib - הפשטה עם @contextmanager
אם אין צורך במחלקה שלמה, אפשר להשתמש בדקורטור @contextmanager כדי לכתוב Context Manager קצר וברור יותר.
```python
from contextlib import contextmanager
@contextmanager
def open_utf8(path: str, mode: str = "r"):
    # Everything before 'yield' is the setup (equivalent to __enter__)
    f = open(path, mode, encoding="utf-8")
    try:
        yield f # The object 'yielded' is what the 'as' variable receives
    finally:
        # Everything after 'yield' (or in finally) is the teardown (equivalent to __exit__)
        f.close()
with open_utf8("data/test.txt", "w") as f:
    f.write("High quality text in English `💡`")
```
הקוד הזה עושה בדיוק אותו דבר, אבל בלי לכתוב מחלקה.
זהו פתרון אלגנטי למקרי ניהול משאבים פשוטים.

dataclass@ - קיצור למחלקות נתונים
הדקורטור dataclass@ (שהופיע כבר בפרקים הקודמים) הוא למעשה דוגמה מובהקת לשימוש בדקורטור ברמת מחלקה.
```python
from dataclasses import dataclass
@dataclass
class Point:
    x: float
    y: float
p = Point(1.0, 2.5)
print(p)   # Point(x=1.0, y=2.5)
```

הוא יוצר אוטומטית את כל מה שצריך:

```python
__init__, __repr__, __eq__
```
ומאפשר לכתוב מחלקות פשוטות, נקיות וברורות. בלי קוד מיותר.
**דוגמה מרכזית: measure_time + @dataclass Result**
נשלב בין שני עולמות: נמדוד זמן ריצה של תהליך, ונשמור את התוצאה באובייקט נתונים נוח.
```python
import time
from dataclasses import dataclass
from typing import Any, Callable
def measure_time(func: Callable[..., Any]):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        return Result(func.__name__, duration, result)
    return wrapper
@dataclass
class Result:
    name: str
    duration: float
    output: Any
@measure_time
def heavy_computation(n: int) -> int:
    time.sleep(0.8)
    return sum(i * i for i in range(n))
res = heavy_computation(100_000)
print(res)
# Result(name='heavy_computation', duration=0.8012, output=333328333350000)
```
שימו לב כמה קריא הקוד:
• הדקורטור מודד את הזמן.
• ה-dataclass מאגד את כל הנתונים.
• והפונקציה עצמה נשארת נקייה ופשוטה.
Best Practices
• השתמשו בדקורטורים רק כשיש ערך ברור לא כדי להרשים את הצוות.
• השתמשו ב-@wraps כדי לשמור על מטא-מידע של הפונקציה המקורית.
• השתמשו ב-Context Manager לכל משאב שדורש סגירה בטוחה.
• העדיפו @contextmanager על מחלקה מלאה במקרים פשוטים.
• אל תגזימו בשימוש ב-dataclass השתמשו, רק כשמדובר בנתונים פשוטים ללא לוגיקה מורכבת.
סיכום - איך הכלים האלה הופכים קוד לפייתוני
דקורטורים, Context Managers ו-dataclass אינם קסמים, הם פשוט תחביר שמאפשר לחשוב ברמה גבוהה יותר. הם מסירים חזרות, מנהלים משאבים בביטחון, ומשאירים את הלוגיקה העסקית ממוקדת. כשאתה משתמש בהם נכון, הקוד שלך נראה פחות כמו רצף של פעולות, ויותר כמו שפה טבעית שמתארת את כוונתך.
וזה, בדיוק הרגע שבו פייתון מפסיקה להיות רק שפה, והופכת לכלי ביטוי הנדסי אמיתי.

pytest: התקנה, מבנה קבצים, assert בסיסי
Pytest הוא הסטנדרט בפייתון לבדיקות יחידה (unit tests).
קל להשתמש בו, אינו דורש מחלקות או boilerplate, ויודע לזהות אוטומטית כל קובץ שמתחיל ב-_test.
התקנה:
```bash
pip install pytest
```
מבנה תיקיות טיפוסי:
```Plaintext
mini_text_analyzer/
├── `📁` src/
│   └── `📁` mini_text_analyzer/
│       ├── `📄` __init__.py
│       └── `📄` text_utils.py
├── `📁` tests/
│   └── `📄` test_tokenize.py
├── `📄` requirements.txt
└── `📄` README.md
```
בדיקה פשוטה:
```python
from mini_text_analyzer.text_utils import tokenize
def test_tokenize_basic():
    text = "Hello world"
    tokens = tokenize(text)
    assert tokens == ["Hello", "world"]
```
הרצה:
```Plaintext
pytest -v
```

אם הבדיקה נכשלת, pytest יציג בדיוק איזו השוואה נכשלה, בלי לוגים מיותרים.
