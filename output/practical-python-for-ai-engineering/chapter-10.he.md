# פרק 10 - טיפוסיות סטטית עם typing

## למה type hints בשפה דינמית

פייתון נולדה כשפה דינמית. אין צורך להגדיר מראש מהו סוג הערך, והקוד פשוט “רץ”. זה נוח, זריז, וגורם למתכנת להרגיש חופשי.

עד היום שבו המערכת גדלה, ומישהו אחר מנסה להבין למה פונקציה שמחזירה מחרוזת לפעמים מחזירה גם None.

Type hints אינם באים לשנות את פייתון לשפה סטטית.
הם באים לתת **שכבת משמעות** לקוד. מעין מסמך חי שמספר למתכנתים (ולכלים) מה בדיוק הפונקציה מצפה לקבל ומה היא מחזירה.

בעידן שבו קוד AI מורכב מצינורות נתונים, מודלים, ופונקציות שמדברות זו עם זו, רמזי טיפוס (type hints) הם כמו תמרורים בכביש: לא עוצרים את התנועה, אבל מונעים תאונות.

**type hints בסיסיים (int, str, list, None)**

רמזי טיפוס הם פשוט הערות על חתימת הפונקציה, בעזרת תחביר מובנה.

```python
def add(a: int, b: int) -> int:
 return a + b

def greet(name: str) -> str:
 return f"Hello {name}"

def maybe_divide(x: float, y: float) -> float | None:
 if y == 0:
 return None
 return x / y
```


• a: int פירושו שהפרמטר a אמור להיות מספר שלם.

• -> int פירושו שהפונקציה מחזירה שלם.

• שימוש ב-| None (או Optional) מציין שהפונקציה עלולה להחזיר None.

הטיפוסים לא נבדקים בזמן ריצה, פייתון לא תזרוק חריגה אם שלחת מחרוזת, אבל כלים חיצוניים (כמו mypy או Pyright) כן יזהו את הבעיה בזמן פיתוח.


## טיפוסים מורכבים Union, Optional, Literal

לפעמים פונקציה יכולה להחזיר יותר מסוג אחד של ערך.
כדי שפייתון (והעורך שלך) ידעו את זה מראש, נשתמש בהערות טיפוס (type hints)מהמודול typing.

**Union - כשיש כמה אפשרויות**

Union אומר: הפונקציה יכולה להחזיר אחד מכמה סוגים אפשריים.

```python
from typing import Union

def parse_number(s: str) -> Union[int, float, None]:
 try:
 return int(s)
 except ValueError:
 try:
 return float(s)
 except ValueError:
 return None
```


כאן הפונקציה יכולה להחזיר int, או float, או None.
לדוגמה:

```python
print(parse_number("42")) # 42
print(parse_number("3.14")) # 3.14
print(parse_number("hello")) # None
```


**Optional - קיצור ל-Union עם None**

אם אחד מהטיפוסים האפשריים הוא None, אפשר לכתוב Optional במקום Union[..., None].

```python
from typing import Optional

def find_user(id: int) -> Optional[str]:
 """Return a username or None if not found."""
 return None
```

זה בעצם אותו דבר כמו:

```python`from typing import union`

# Union[str, None] is equivalent to Optional[str]
def get_label(id: int) -> Union[str, None]:
 return None
```

רק קצר וברור יותר.

```python
from typing import Literal

```python
def set_mode(mode: Literal["train", "test", "eval"]) -> None:
```
 print(f"Setting mode to: {mode}")

set_mode("train") # Valid
set_mode("debug") # `❌` Error - not one of the allowed literals

```

**Literal - ערכים קבועים בלבד**

Literal מאפשר להגביל פרמטר לערכים ספציפיים בלבד. זה שימושי במיוחד כשיש פונקציה שפועלת בכמה **מצבים קבועים** מראש.

```python
from typing import Literal

```python
def set_mode(mode: Literal["train", "test", "eval"]) -> None:
```
 print(f"Running in {mode} mode")
```


כאן הערך של mode חייב להיות אחד משלושת המצבים האלה בלבד.

**למה זה חשוב?**

• זה עוזר לעורכים (כמו VS Code או PyCharm) להציע ערכים נכונים בלבד.

• זה מונע באגים טיפשיים עוד לפני שהקוד רץ.

• זה גם תיעוד מצוין, כל מי שקורא את הפונקציה מבין מיד מה הערכים האפשריים ומה היא מחזירה.


## עבודה עם מבני נתונים (List[str], Dict[str, int])

כדי לתאר אוספים של טיפוסים נשתמש בפרמטרים גנריים:

```python
from typing import List, Dict

names: List[str] = ["Dana", "Moshe", "Rotem"]
ages: Dict[str, int] = {"Dana": 32, "Moshe": 40}
```


או ישירות בתוך פונקציה:

```python
from typing import List

def average_length(words: List[str]) -> float:
 if not words:
 return 0.0 # Handle potential ZeroDivisionError
 total = sum(len(w) for w in words)
 return total / len(words)
```


כך כלים כמו mypy יכולים לדעת ש-words חייב להיות רשימה של מחרוזות, ושגיאה תתגלה מוקדם יותר, עוד לפני שהקוד רץ.


## TypedDict - מבנה דמוי אובייקט מוגדר

כשאנחנו עובדים עם dictionaries שמתארים מבנה קבוע (למשל תגית של dataset), נרצה לתעד בדיוק אילו שדות קיימים ואילו סוגים הם מחזיקים.

```python
from typing import TypedDict

class User(TypedDict):
 name: str
 age: int
 active: bool

def describe_user(user: User) -> str:
 status = "Active" if user['active'] else "Inactive"
 return f"{user['name']} ({user['age']}) - {status}"

data: User = {"name": "Dana", "age": 30, "active": True}
print(describe_user(data))
```

TypedDict מאפשר לתעד מבני נתונים שנראים כמו JSON או מילונים ומונע בלבול בין מפתחות חסרים לסוגים לא נכונים.

## Protocols ו-Duck Typing - ממשקים ללא ירושה

בפייתון אין "ממשקים" רשמיים כמו ב-Java או #C.
לא צריך להצהיר שמחלקה **יורשת ממחלקת-אם מסוימת** כדי שתוכל לעבוד עם אחרת.
במקום זה, פייתון פועלת לפי עיקרון שנקרא **Duck Typing.**

**מה זהDuck Typing ?**

הרעיון פשוט מאוד:
אם זה **מתנהג **כמו ברווז, אז מבחינת פייתון זה ברווז. במילים אחרות, לא משנה מאיזו מחלקה האובייקט הגיע, כל עוד יש לו את המתודות שהקוד שלך מצפה להן, זה מספיק.

```python
class Dog:
 def speak(self):
 print("Woof!")

class RobotDog:
 def speak(self):
 print("BEEP-WOOF!")

def make_it_speak(dog):
 # This function assumes 'dog' has a .speak() method.
```python
 # It doesn't check if 'dog' is an instance of a specific class.
```
 dog.speak()

make_it_speak(Dog()) # Woof!
make_it_speak(RobotDog()) # BEEP-WOOF!
```


שתי המחלקות לא יורשות זו מזו, אבל שתיהן מתנהגות “כמו כלב” יש להן את אותה מתודה speak. וזה כל מה שפייתון צריכה כדי שזה יעבוד.

**אז איפה הבעיה?**

בפרויקטים קטנים זה נחמד, אבל בקוד גדול קשה לדעת מראש מה בדיוק נדרש מכל אובייקט. אם מישהו יעביר לפונקציה אובייקט שאין לו את המתודה המתאימה, פייתון תגלה את זה רק בזמן ריצה, ותזרוק שגיאה.

כאן נכנס לתמונה Protocol.


**Protocol - דרך לתעד איך אובייקט אמור להתנהג**

Protocol מאפשר להגדיר **באופן פורמלי** מה מצופה ממחלקה שתעבוד עם הקוד שלך בלי לחייב אותה לרשת ממנה שום דבר.

```python
from typing import Protocol

class Cleaner(Protocol):
 def clean(self, text: str) -> str:
 ...
```

זה אומר: כל אובייקט שיש לו מתודה בשם clean, שמקבלת מחרוזת ומחזירה מחרוזת, נחשב מתאים ל-Cleaner.


דוגמה:

```python
class LowerCleaner:
 def clean(self, text: str) -> str:
 return text.lower()

def process_text(c: Cleaner, s: str) -> str:
 return c.clean(s)

processor = LowerCleaner()
print(process_text(processor, "HELLO")) # hello
```


שים לב:

• LowerCleaner לא יורשת מ-Cleaner.

• ובכל זאת, היא עומדת באותו חוזה יש לה את המתודה הנדרשת.

• לכן הקוד עובד, והעורכים וכלי הבדיקה מזהים שזה תקין.

**למה זה טוב**

• זה נותן לך תיעוד ברור: מה הפונקציה מצפה לקבל.

• כלי ניתוח סטטי (כמו mypy) יכולים לבדוק אם מחלקה באמת עומדת בדרישות האלה.

• אתה מקבל את הגמישות של פייתון, אבל גם את הביטחון של בדיקות טיפוסים סטטיות, כמו בשפות קשיחות יותר.

**בדיקה עם mypy**

כדי לבדוק את הקוד שלך, התקן את הכלי mypy:
התקנה:

```bash
pip install mypy
```


הרצה:

```bash
mypy src/
```


אם תכתוב פונקציה שמוגדרת להחזיר str אבל תחזיר בפועל int,

או תעביר אובייקט שאין לו את המתודה הדרושה mypy יתריע על כך עוד לפני ההרצה. בדיקה סטטית אחת ביום שווה שעות של Debugging בהמשך.


## דוגמה מרכזית: type hints מלאים ל-mini_text_analyzer

נחזור לפרויקט הקטן שלנו mini_text_analyzer: ניקוי טקסט וחישוב סטטיסטיקות.

נראה איך נראה אותו קוד, רק עם טיפוסיות מלאה:

```python
from pathlib import Path
from typing import List, Dict
import json

def read_text(path: Path) -> str:
 """Read a text file and return its content."""
 return path.read_text(encoding="utf8")

def tokenize(text: str) -> List[str]:
 """Split text into words."""
 return text.split()

def word_stats(tokens: List[str]) -> Dict[str, int | float]:
 """Return basic statistics about a list of words."""
 lengths = [len(t) for t in tokens]
 return {
 "num_words": len(tokens),
```python
 "avg_length": sum(lengths) / len(lengths) if lengths else 0,
```
 }

```python
def save_json(path: Path, data: Dict[str, int | float]) -> None:
```
 """Save data as JSON."""
```
 path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf8")
```

def main() -> None:
 text = read_text(Path("data/input.txt"))
 tokens = tokenize(text)
 stats = word_stats(tokens)
 save_json(Path("data/stats.json"), stats)
```


בכל מקום שבו הקוד “דיבר בעמימות”, כעת יש הגדרה ברורה. גם המפתח הבא יוכל להבין בדיוק אילו סוגים נכנסים ויוצאים מכל פונקציה.

## Best Practices

• הוסף טיפוסים לכל פונקציה ציבורית (public).

• השתמש ב-Optional או | Noneכשיש החזרה מותנית.

• תעד גם משתנים גלובליים או חשובים (df: pd.DataFrame).

• השתמש ב-mypy או ב-pyright כחלק מה-CI שלך.

• אל תשתמש ב-Any בלי סיבה - הוא מבטל את היתרון.

• אל תעמיס Type Hints מיותרים בקוד פנימי קצר - שמור על קריאות.


## סיכום - איך type hints מגדילים אמינות

רמזי טיפוס לא משנים את פייתון, אבל הם משנים את הדרך שבה אנו חושבים עליה. 
הם יוצרים חוזה ברור בין פונקציות, מסייעים ל-IDE להשלים קוד בצורה מדויקת, ומאפשרים למערכות גדולות, כמו פרויקטי AI מבוזרים לשמור על עקביות גם כשהן מתפתחות במהירות.

פייתון תישאר שפה דינמית, אבל עם typing נכון היא הופכת לשפה **אמינה, מתועדת ומובנת הרבה יותר.**

