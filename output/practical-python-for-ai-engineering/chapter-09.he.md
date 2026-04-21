# תכנות מונחה עצמים בסיסי

## למה OOP חשוב גם כשיש functions

בעידן של פונקציות, Pipelines ו-AI Agents,

קל לשכוח את יסודות ה-OOP.

תכנות מונחה עצמים (Object Oriented Programming) אינו רק סגנון ישן, אלא דרך **לארגן מחשבה הנדסית.**

כשמערכת גדלה, מתחילים להופיע נתונים שקשורים זה בזה, פעולות שחוזרות על עצמן, וקוד שצריך "זהות" משל עצמו.

פה בדיוק נכנסת המחלקה: היא מאפשרת **לאגד נתונים (state) והתנהגות (behavior)** לאובייקט אחד מסודר.

במערכות AI, זה חיוני.

לדוגמה, מודל למידת מכונה הוא אובייקט עם פרמטרים, פונקציות עיבוד, וסטטוס של אימון. 
Tokenizer הוא אובייקט עם state של מילון ומאפייני ניקוי טקסט.

אפילו pipeline של עיבוד נתונים הוא מחלקה שמאגדת כמה שלבים תחת זהות אחת.

אז גם כשיש לך פונקציות מצוינות

כשאתה רואה **ישות עם התנהגות ומידע** כנראה הגיע הזמן להפוך אותה למחלקה.

## הגדרת מחלקה בסיסית (init, self)

בפייתון, מחלקה נוצרת בעזרת מילת המפתח class. המתודה __init__ היא הפונקציה שמופעלת בכל פעם שנוצר מופע חדש של המחלקה, ו-self מייצגת את האובייקט הנוכחי.

```python
class Counter:
    """A simple counter that keeps its value in memory."""
    
    def __init__(self, start: int = 0):
       self.value = start
 
    def increment(self, step: int = 1) -> None:
       self.value += step
 
    def get(self) -> int:
       return self.value
 
c = Counter(10)
c.increment()
print(c.get())  # 11
```

**שימו לב:**

- כל מתודה מקבלת כפרמטר ראשון את self.

- השדות של המחלקה מאוחסנים כמאפיינים (self.value).

- כל מופע (instance) שומר state משלו.

## מתודות מיוחדות (str, repr, len)

בפייתון קיימות מתודות "קסם" שמאפשרות לשלוט בהתנהגות של אובייקטים במצבים מוכרים, כמו הדפסה, ייצוג למפתחים או שימוש ב-len. 
כשמגדירים אותן במחלקה, האובייקט מתנהג בצורה טבעית יותר בתוך השפה.

להלן דוגמה פשוטה:

```python
class Vector:
    def __init__(self, x: int, y: int):
       self.x = x
       self.y = y

    def __str__(self) -> str:
       return f"({self.x}, {self.y})"

    def __repr__(self) -> str:
       return f"Vector(x={self.x}, y={self.y})"

    def __len__(self) -> int:
       return abs(self.x) + abs(self.y)

v = Vector(3, -4)
print(v)
# (3, -4)
print(repr(v))
# Vector(x=3, y=-4)
print(len(v))  # 7
```

כך זה עובד:

- __init__ יוצר את האובייקט ומאחסן את הנתונים שהוא צריך.

- __str__ מגדיר איך האובייקט יוצג כשמדפיסים אותו למשתמש.

- __repr__ נותן ייצוג מדויק שמתאים למפתחים ודיבוג.

- __len__ מאפשר להפעיל len(obj) כאילו זה אוסף עם אורך מוגדר.

השילוב של המתודות האלה הופך את המחלקה לנוחה לשימוש בפייתון, הרבה יותר ממחלקה "רגילה" ללא הגדרות כאלה.

## מתודות של מופע - גישה למשתני מחלקה

**מתודות מופע מול משתני מחלקה**

בכל מחלקה אפשר להגדיר שני סוגים של משתנים: 
**משתני מחלק**ה ו-**משתני מופע.**

- משתני מחלקה שייכים למחלקה עצמה, וכל המופעים חולקים אותם.

- משתני מופע שייכים רק לאובייקט שנוצר בפועל.

לכל מחלקה יכולים להיות

**משתני מחלקה (class attributes)**ערכים שחלים על כל המופעים.

```python
class Tokenizer:
    language = "english"
    # Class variable shared by all instances

    def __init__(self, text: str):
       self.text = text
       # Instance variable unique to each object

    def tokens(self) -> list[str]:
       return self.text.split()

t1 = Tokenizer("Hello world")
t2 = Tokenizer("How are you")

print(t1.language, t2.language) # english english
```

כששינית את t2.language, בעצם יצרת **עותק חדש** של המשתנה בתוך המופע t2. 
המשתנה של המחלקה עצמה (Tokenizer.language) לא השתנה.

אם תרצה לשנות את הערך עבור כל המחלקה, כתוב:

```python
Tokenizer.language = "english"
```

או עשה זאת מתוך מתודת מחלקה (classmethod@).

## @classmethod ו-@staticmethod

**למה בכלל צריך @classmethod**

במחלקה רגילה יש מתודות שפועלות על מופע (instance). 
כלומר, הן מקבלות את self, ועובדות על הנתונים של אותו מופע:

```python
class User:
    def __init__(self, name):
       self.name = name
       # Store the user's name

    def greet(self):
       print(f"Hi {self.name}!")
       # Print a greeting in English

u = User("Tomer")
u.greet()   # Hi Tomer!
```

אבל לפעמים יש פעולות:

- שלא קשורות למופע מסוים

- קשורות לכל המחלקה כולה

כאן נכנסים שני הדקורטורים החשובים האלה.

**@classmethod - מתודה שפועלת על המחלקה עצמה**

@classmethod מקבלת את **המחלקה (cls)** במקום מופע (self). 
היא שימושית כשצריך לעבוד על משתנים **ששייכים למחלקה כולה**, או כשצריך לבנות מופעים בדרך שונה.

**דוגמה 1 - ספירת מופעים**

```python
class Model:
    instances = 0

    def __init__(self):
        Model.instances += 1

    @classmethod
    def how_many(cls):
        return cls.instances

m1 = Model()
m2 = Model()
print(Model.how_many())  # 2
```

כאן how_many לא תלויה במופע מסוים היא מדווחת כמה מופעים נוצרו עד עכשיו. פייתון מעבירה אליה את המחלקה עצמה (cls), כך שאפשר לגשת ל-cls.instances.

**דוגמה 2 - מפעל יצירה (Factory Method)**

```python
class User:
    def __init__(self, name, is_admin=False):
        self.name = name
        self.is_admin = is_admin

    @classmethod
    def admin(cls, name):
        return cls(name, is_admin=True)

u1 = User("Dana")
u2 = User.admin("Tomer")

print(u1.is_admin) # False
print(u2.is_admin) # True
```

כך אפשר ליצור משתמש אדמין ישירות,

בלי לכתוב User("Tomer", True) הקוד ברור יותר וקריא.

**staticmethod@ - פונקציה כללית שנמצאת במחלקה רק בשביל סדר**

staticmethod@ לא מקבלת לא self ולא cls. 
זו סתם פונקציה "צמודה" למחלקה מבחינה לוגית **-** כלומר, היא קשורה לנושא של המחלקה, אבל לא תלויה בה.



**דוגמה**

```python
class MathUtils:
    @staticmethod
    def add(a, b):
        return a + b
```

**למה בכלל צריך @staticmethod**

תחשוב על זה כך: 
לפעמים יש לך פונקציה שעוזרת למתודות אחרות במחלקה, 
אבל **היא לא צריכה לדעת שום דבר על המחלקה או על המופע**. אם תשאיר אותה מחוץ למחלקה, היא תאבד את ההקשר הלוגי שלה. אבל אם תשים אותה בתוך המחלקה, היא נשארת קרובה ונגישה, וזה עושה סדר.

**דוגמה מוחשית**

נגיד יש לך מחלקה שמייצגת הזמנה:

```python
class Order:
    def __init__(self, items):
        self.items = items

    def total(self):
        return sum(self.items)

    @staticmethod
    def apply_vat(amount):
        return amount * 1.17
```

עכשיו נוכל להשתמש בה ככה:

```python
order = Order([10, 20, 30])
subtotal = order.total()
total_with_vat = Order.apply_vat(subtotal)
print(total_with_vat)  # 70.2
```

**שים לב:**

- apply_vat לא צריכה גישה לא ל-self ולא ל-cls.

- היא פשוט **פונקציה עזר שקשורה לנושא של המחלקה**, 
אז נוח לשים אותה שם, כדי שכל מה שקשור ל- Orderיהיה מרוכז באותו מקום.

**זה עניין של עיצוב (Design)**

אם היית שם את apply_vat כפונקציה חיצונית:

```python
def apply_vat(amount): …
```

היא הייתה עובדת בדיוק אותו דבר, אבל היא הייתה “תלושה” מהקוד הלוגי של ההזמנות.

**@staticmethod עוזרת לשמור על ארגון טוב בקוד:** 
פונקציות שקשורות לנושא מסוים נשארות יחד, גם אם הן לא תלויות במחלקה.

**איך להחליט מתי להשתמש בה**

שאל את עצמך:

האם הפונקציה הזו קשורה לוגית למחלקה, 
אבל לא צריכה מידע ממנה?

אם התשובה כן, זו מתודה סטטית קלאסית.

## dataclass@ - פחות boilerplate, יותר קריאות

כשאתה מגדיר מחלקה פשוטה. למשל בשביל לייצג משתמש, לקוח, או מוצר .אתה כמעט תמיד כותב את אותן שלוש מתודות שוב ושוב:

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def __repr__(self):
        return f"Person(name={self.name}, age={self.age})"

    def __eq__(self, other):
        if not isinstance(other, Person):
            return False
        return self.name == other.name and self.age == other.age
```

זה מלא חזרתיות. אין פה לוגיקה חכמה, אלא רק קוד טכני שחוזר על עצמו.

**מה @dataclass עושה בשבילך**

@dataclass אומר לפייתון:

"תעשי בשבילי את כל הדברים הסטנדרטיים האלה, אני רק אגדיר את השדות."

```python
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int
```

וזהו. 
פייתון מייצרת לך אוטומטית:

- __init__ בנאי שמכניס את כל הערכים למופע.

- __repr__ הדפסה יפה וברורה.

- __eq__ השוואה בין אובייקטים לפי הערכים שלהם.

כך זה עובד בפועל

```python
p1 = Person("Dana", 30)
p2 = Person("Dana", 30)
p3 = Person("Noam", 12)

print(p1)
# Person(name='Dana', age=30)
print(p1 == p2)  # True (same values)
print(p1 == p3)  # False
```

בלי שכתבת אף אחת מהמתודות האלה בעצמך. 
פשוט, נקי, וקל לתחזוקה.

**מתי זה שימושי במיוחד**

- כשיש לך **אובייקטים שהם בעיקר “נתונים”**, לא לוגיקה כבדה.

למשל: User, Book, Order, Point, Config.

- כשאתה כותב **מודלים או מבני נתונים** לקוד אחר.

במיוחד בפרויקטים של ML, APIs או בדיקות.

- כשאתה רוצה **קוד קצר וברור**, במיוחד בקבצים עם הרבה הגדרות מחלקה קטנות.

**תוספות חכמות (כשמתקדמים)**

frozen=True - הופך את האובייקט לבלתי ניתן לשינוי (immutable). 
לדוגמה:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: int
    y: int

p = Point(3, 4)
print(p)
# Point(x=3, y=4)

# This works normally. You can read the values
print(p.x + p.y)
# 7

# Trying to change a value will fail at runtime
p.x = 10
# dataclasses.FrozenInstanceError: cannot assign to field 'x'
```

הפלט בפועל יהיה:

```python
Point(x=3, y=4)
7
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<string>", line 4, in __setattr__
dataclasses.FrozenInstanceError: cannot assign to field 'x'
```

**הסבר קצר**

כשאתה מוסיף frozen=True, פייתון מונעת כל שינוי בשדות אחרי שהאובייקט נוצר. זה שימושי כשאתה רוצה לוודא שאובייקט **ישאר קבוע** למשל נקודה במרחב, מזהה משתמש, או קונפיגורציה של מערכת.

אם תסיר את frozen=True, הקוד יעבוד רגיל:

```python
from dataclasses import dataclass
@dataclass
class Point:
    x: int
    y: int

p = Point(3, 4)
p.x = 10  # This works because the class is not frozen
print(p)  # Point(x=10, y=4)
```

order=True - מאפשר להשוות בין מופעים לפי סדר (>, <).

```python
from dataclasses import dataclass

@dataclass(order=True)
class Product:
    price: float
    name: str

p1 = Product(29.90, "Notebook")
p2 = Product(9.90, "Pencil")
p3 = Product(99.00, "Backpack")

print(p1 > p2)  # True  (29.9 > 9.9)
print(p1 < p3)  # True  (29.9 < 99.0)
print(sorted([p1, p2, p3]))  # [Product(price=9.9, name='Pencil'), Product(price=29.9, name='Notebook'), Product(price=99.0, name='Backpack')]
```

כשאתה כותב dataclass(order=True)@, פייתון מייצרת אוטומטית את כל המתודות להשוואה:

- __lt__ קטן מ-<

- __le__ קטן או שווה <=

- __gt__ גדול מ->

- __ge__ גדול או שווה >=

ברירת המחדל היא שההשוואה מתבצעת **לפי סדר השדות** שהגדרת. 
בדוגמה שלנו, קודם לפי price, ואם יש שוויון, לפי name.



**טיפ שימושי**

אם אתה רוצה להשוות לפי שדה אחד בלבד (למשל רק לפי מחיר), 
תוכל להשתמש בפרמטר field(compare=False) על שדות שלא צריכים להשתתף בהשוואה:

```python
from dataclasses import dataclass, field

@dataclass(order=True)
class Product:
    price: float
    name: str = field(compare=False)
```

ככה ההשוואה תתבסס רק על המחיר, בלי להתחשב בשם בכלל.

**לסיכום**

<div dir="rtl">

| **פרמטר** | **משמעות** |
| --- | --- |
| **frozen=True** | מונע שינוי בשדות אחרי יצירה (immutable) |
| **order=True** | מוסיף תמיכה בהשוואה וסידור לפי ערכים |
| **compare=False** | מוציא שדה מסוים מהשוואה |

</div>

## קומפוזיציה מול ירושה - מתי מה

ירושה (Inheritance) מאפשרת להרחיב מחלקה קיימת, אבל ב-AI ובפרויקטים מודרניים משתמשים בה בזהירות. קומפוזיציה (Composition), שילוב של אובייקטים אחרים, לרוב עדיפה.

```python
class Cleaner:
    def clean(self, text: str) -> str:
       return text.lower().strip()
    # Convert to lowercase and remove surrounding spaces

class Tokenizer:
    def tokenize(self, text: str) -> list[str]:
       return text.split()      # Split the text into words

class TextProcessor:
    def __init__(self):
       self.cleaner = Cleaner()        # Create a cleaner instance
       self.tokenizer = Tokenizer()    # Create a tokenizer instance

    def process(self, text: str) -> list[str]:
       cleaned = self.cleaner.clean(text)        # Clean the text
       return self.tokenizer.tokenize(cleaned)   # Tokenize the cleaned text

tp = TextProcessor()
print(tp.process("  Hello World  "))  # ['hello', 'world']
```

במקום "להיות" Cleaner, TextProcessor רק **משתמש** בו, וזה הרבה יותר גמיש ובטוח.

## דוגמה מרכזית: מחלקת TextCleaner עם API נקי

ניצור מחלקה אחת שימושית לעיבוד טקסטים, עם state נקי ו-API פשוט.

```python
from dataclasses import dataclass
import re

@dataclass
class TextCleaner:
    lower: bool = True
    remove_punct: bool = True

    def clean(self, text: str) -> str:
       """Clean text according to the settings."""
       result = text
       if self.lower:
           result = result.lower()  # Convert to lowercase
       if self.remove_punct:
           result = re.sub(r"[^\w\s]", "", result)  # Remove punctuation
       return result.strip()  # Remove surrounding spaces # Usage
cleaner = TextCleaner(lower=True)
print(cleaner.clean("Hello, World!!!")) # hello world
```

**היתרונות ברורים:**

- קוד קריא.

- התנהגות ניתנת לשינוי באמצעות פרמטרים.

- ניתן לשלב אותה ב-pipeline מבלי לשכתב פונקציות.

**Best Practices**

- **PascalCase**

לשמות מחלקות (למשל TextCleaner, לא text_cleaner).

- **לא להגזים בירושות**

העדף קומפוזיציה.

- **אל תיצור מחלקות סתמיות**

אם אין state, עדיף פונקציה.

- **השתמש ב-@dataclass**

כשמדובר באובייקט פשוט.

- **שמור על SRP (Single Responsibility Principle)**

מחלקה אחת, תפקיד אחד.

- **אל תסתיר נתונים סתם**

פייתון סומכת על מפתחים בוגרים, לא על אינקפסולציה כפויה.

## סיכום - OOP בזהירות, לא הכל צריך להיות מחלקה

תכנות מונחה עצמים בפייתון הוא כלי, לא דת. 
כשהוא בשימוש נכון - הוא מבהיר, מאחד ומונע כפילויות. 
כשהוא בשימוש יתר - הוא מוסיף שכבות מיותרות ומסבך את הקוד.

מחלקה טובה צריכה להיות ישות בעלת זהות ומשמעות לא עטיפה אקראית לפונקציות. 
בעידן של פונקציות חכמות ו-AI Agents, דווקא הבנה טובה של עקרונות OOP בסיסיים מאפשרת לכתוב קוד שקל להבין, להרחיב ולתחזק, גם במערכות מורכבות ומשתנות.


