# מודולים, חבילות וארגון פרויקט

## למה לא קובץ אחד גדול

כל מתכנת מתחיל את דרכו עם קובץ יחיד main.py, לפעמים app.py, ובימים עמוסים במיוחד אפילו cript_final_v2_fixed.py.

זה עובד מצוין כל עוד מדובר בניסוי קטן. אבל אז זה קורה: הקובץ גדל למאות שורות, הפונקציות מסתבכות, ואתה כבר לא בטוח איפה נמצאת הפונקציה שמחשבת את ה-accuracy. בנקודה הזו אתה מגלה את ההבדל בין קוד שעובד, לבין מערכת שניתנת לניהול. 
כשהכול נמצא בקובץ אחד:

- אין הפרדה בין שלבים שונים בקוד.

- כל שינוי קטן עלול לשבור אזורים אחרים.

- אי אפשר לבדוק רכיב אחד בלי להריץ את הכול.

- ובעיקר, קשה מאוד לעבוד בצוות.

הפתרון הוא לא "פחות קוד", אלא **קוד מחולק נכון**. זו בדיוק הסיבה שפייתון בנויה סביב מודולים וחבילות וזו הדרך שלה לארגן מחשבה הנדסית.

## Imports בסיסיים (import, from, alias)

**מודול** הוא פשוט קובץ פייתון (.py) שמכיל קוד.

פונקציות, מחלקות, משתנים או קבועים שאפשר להשתמש בהם גם ממקומות אחרים בקוד שלך. ובמקום לכתוב את הכול שוב ושוב בכל קובץ, אתה **מייבא** את מה שאתה צריך. 
זה מה שהופך את פייתון לשפה כל כך נוחה לבניית מערכות גדולות: 
כל קובץ הוא יחידה עצמאית שאפשר לשתף, לבדוק ולהרכיב ממנה מערכת שלמה.

**import**

ייבוא של מודול שלם:

```python
import math

print(math.sqrt(16))  # 4.0
```

כאן אתה אומר לפייתון: “תטען את הקובץ math.py (מהספרייה הסטנדרטית), ואני אשתמש בפונקציות שלו דרך השם math.”

**from ... import**

ייבוא של חלק מסוים בלבד:

```python
from math import sqrt

print(sqrt(25))
```

חוסך הקלדה, אבל עדיף להשתמש בזה רק כשבאמת יש צורך. 
כדי לשמור על קריאות ולדעת מאיפה הגיע כל שם.

**alias - שם מקוצר**

כמעט כל מתכנת מכיר את זה:

```python
import numpy as np
import pandas as pd
```

זהו קיצור מקובל שמקל על הקריאה והופך את הקוד לאחיד בין צוותים.

**למה זה חשוב בפרויקטי ?AI**

במערכות עיבוד נתונים, יש עשרות מודולים קטנים: 
ניקוי טקסט, קריאה ממקורות, חישוב מדדים, שמירת תוצאות, לוגים, ועוד. מנגנון import מאפשר **להרכיב מהם מערכת אחת נקייה**, בלי כפילויות או תלות הדדית מיותרת.

```python
from text.cleaner import normalize
from text.tokenizer import tokenize
from text.stats import word_stats

def analyze(text):
    return word_stats(tokenize(normalize(text)))
```

כל שורה ברורה, כל רכיב ממוקד. והכול משתלב בהרמוניה.

## מבנה תיקיות מומלץ לפרויקט Production

כשהפרויקט גדל, חשוב לדעת איפה כל דבר ממוקם. 
קוד נקי מתחיל ממבנה תיקיות הגיוני. כזה שקל להבין גם חצי שנה אחרי שכתבת אותו.

**package - איך פייתון מזהה חבילה**

חבילה (package) היא פשוט תיקייה שיש בה קובץ בשם __init__.py הקובץ הזה אומר לפייתון: “זו חבילה, לא סתם תיקייה.” בתוכו אפשר להגדיר אילו מודולים יהיו זמינים למי שמייבא את החבילה.

**מבנה מומלץ לפרויקט**

זה מבנה פרויקט בסיסי שמתאים גם לפרודקשן:

```bash
my_project/
├─ src/
│  └─ my_package/
│     ├─ __init__.py
│     ├─ core.py
│     └─ utils.py
├─ scripts/
│  └─ run_demo.py
├─ tests/
│  └─ test_core.py
└─ requirements.txt
```

בתיקייה src נמצא קוד הספרייה שלך. בתוך scripts תשמור קבצי הרצה או דוגמאות, וב-,tests בדיקות יחידה.

**דוגמת קבצים קצרה**

src/my_package/core.py

```python
def tokenize(text: str) -> list[str]:
    return text.split()

def count_tokens(text: str) -> int:
    return len(tokenize(text))
```

src/my_package/utils.py

```python
def normalize(text: str) -> str:
    return " ".join(text.split()).strip()
```

src/my_package/__init__.py

```python
from .core import tokenize, count_tokens
from .utils import normalize

__all__ = ["tokenize", "count_tokens", "normalize"]
__version__ = "0.1.0"
```

**קובץ הרצה חיצוני**

scripts/run.py

```python
import sys
sys.path.append("src")
 # In a simple development environment. Not needed in a real installation.

import my_package as mp

text = "hello   world"
print(mp.normalize(text))  # hello world
print(mp.tokenize(text))   # ['hello', 'world']
print(mp.count_tokens(text)) # 2
```

**למה זו הגישה הנכונה בפרויקטים גדולים**

- הקוד שלך מופרד מהרצה, מבדיקות ומהתלויות.

- אפשר להוסיף מודולים חדשים בלי לשנות קוד קיים.

- ייבוא עובד בצורה אחידה וברורה.

- מבנה src/ מונע התנגשויות בין קבצים מקומיים לחבילות חיצוניות.

## Imports יחסיים מול מוחלטים

כשפרויקט מתחיל לגדול, אתה כבר לא מייבא רק מתוך ספריות סטנדרטיות, אלא גם בין מודולים שכתבת בעצמך. כאן חשוב להבין את ההבדל בין **ייבוא מוחלט** ל-**ייבוא יחסי.**

**ייבוא מוחלט (Absolute Import)**

זו הדרך הברורה והעדיפה ברוב המקרים: 
פשוט לייבא לפי שם החבילה המלא מהשורש של הפרויקט.

```python
# from src/my_package/text/cleaner.py
from my_package.utils import normalize
```

ייבוא מוחלט ברור לכל מי שקורא את הקוד, גם מחוץ לפרויקט. 
הוא עובד מצוין כשיש לך סביבת הרצה יציבה (כמו התקנה ב-venv או מבנה src/ מסודר).

**ייבוא יחסי (Relative Import)**

שימושי כשאתה עובד בתוך אותה חבילה ומעדיף לקצר כתיבה:

```python
# from src/my_package/text/tokenizer.py
from ..utils import normalize
```

שני הנקודות (..) אומרות "עלה תיקייה אחת למעלה". 
אפשר להשתמש גם ב-. (תיקייה נוכחית) או ביותר מנקודה אחת לפי הצורך.

**אז מתי להשתמש במה?**

- **בפרויקטים קטנים או בסקריפטים פנימיים**:

אפשר להסתפק בייבוא יחסי.

- **בפרויקטים גדולים, חבילות או קוד פתוח**:

עדיף תמיד ייבוא מוחלט.

ייבוא מוחלט מקל על קריאות, בדיקות ותחזוקה, 
בעוד שייבוא יחסי מתאים בעיקר לשלב הפיתוח המוקדם כשהכול עדיין בתיקייה אחת.

## Docstrings למודולים: תיעוד ברמת הקובץ

מטרת ה-docstring ברמת מודול היא לתת לקורא שלך כיוון מיידי: מה הקובץ עושה, איך משתמשים בו, ואיזה חלקים נחשבים API ציבורי.

**איך זה נראה במודול אמיתי**

```python
"""
text tools
Utility functions for text processing: cleaning, tokenizing, and counting tokens.

Basic usage:
    from my_package.text_tools import normalize, tokenize, count_tokens
    s = normalize(" Hello   world ")
    words = tokenize(s)          # ['Hello', 'world']
    n = count_tokens(s)          # 2

Related modules:
my_package.utils
"""

from __future__ import annotations

__all__ = ["normalize", "tokenize", "count_tokens"]
__version__ = "0.2.0"

def normalize(text: str) -> str:
    """Return a clean and well spaced text string."""
    return " ".join(text.split()).strip()

def tokenize(text: str) -> list[str]:
    """Split text into words based on spaces."""
    return text.split()

def count_tokens(text: str) -> int:
    """Count how many tokens appear in the cleaned text."""
    return len(tokenize(normalize(text)))
```

מה חשוב לשים בדוקסטרינג של מודול:

- תיאור קצר וברור של מטרת המודול.

- דוגמת שימוש של שתי שורות שמראה את ה-import והקריאה לפונקציות.

- אזכור מודולים קשורים אם יש.

- אם יש API ציבורי, סמן גם ב-__all__ כדי להבהיר מה חשוף.

**איך קוראים את זה בזמן אמת**

```python
import my_package.text_tools as tt

print(tt.__doc__[:120], "...")  # show the beginning of the module docstring
help(tt)                        # full display with functions and explanations
```

**סגנון תיעוד קצר ואחיד**

בחר סגנון אחד לפונקציות ולמחלקות והיצמד אליו:

- תיאור במשפט אחד.

- פרמטרים עיקריים ופלט בשורה או שתיים.

- אם יש התנהגות מיוחדת, שורה קצרה על חריגים או קצה.

למשל, סגנון תמציתי:

```python
def summarize(text: str, max_tokens: int = 64) -> str:
    """
    Create a short summary for the given text.

    text: the original text.
    max_tokens: maximum summary length.
    returns: a string containing the summary.
    """
    ...
```

טיפ קטן לפרויקטים גדולים:

- שמרו דוקסטרינגים קצרים. פרטים ארוכים עוברים ל-README או למסמך API נפרד.

- עדכנו דוגמת שימוש כשמשנים חתימה. דוגמה לא מעודכנת מבלבלת יותר מחוסר דוגמה.

## Best Practices: שמות, אחריות וסדר imports

ככל שהפרויקט גדל, סדר וקריאות הופכים לא פחות חשובים מביצועים.

**שמות ברורים**

• קובץ או מודול:

בשם קטן וברור, text_utils.py, לא myTextFunctions.py.

• פונקציות:

פועל שמתאר פעולה, כמו normalize_text או count_tokens.

• משתנים:

קצרים אבל משמעותיים text, tokens, config.

• קבועים:

באותיות גדולות (UPPER_CASE).

**אחריות אחת לכל מודול**

כל קובץ אמור לעשות דבר אחד ברור. 
אם אתה מוצא את עצמך גולל 300 שורות שמערבבות לוגיקות שונות. זה סימן לשהגיע הזמן לפיצול.

```python
# text_clean.py
def normalize(text: str) -> str:
    return " ".join(text.split()).strip()

# text_tokenize.py
from .text_clean import normalize

def tokenize(text: str) -> list[str]:
    return normalize(text).split()
```

**סדר imports**

סדר קבוע הופך את הקוד למובן גם בלי לחשוב.

1. ספריות סטנדרטיות

2. ספריות צד שלישי

3. מודולים פנימיים שלך

```python
from pathlib import Path
import pandas as pd
from my_package.text_tokenize import tokenize
```

**ממשק ציבורי ברור**

אם זו חבילה, חשוב להגדיר מה נחשף החוצה.

```python
# __init__.py
from .text_clean import normalize
from .text_tokenize import tokenize

__all__ = ["normalize", "tokenize"]
```

**כלל אצבע פשוט**

אם שם הקובץ מסביר את מטרתו, אם אתה יכול למחוק פונקציה בלי לשבור את השאר, ואם ה-imports נקיים וברורים אז אתה כבר **עובד נכון.**

## "__name__ == "__main__: הפרדה בין מודול להרצה

בפייתון, כל קובץ הוא גם **מודו**ל וגם **תוכנית בפני עצמ**ה. כשאתה מריץ קובץ ישירות, משתנה פנימי בשם ‎__name__‎ מקבל את הערך "__main__". אבל כשקובץ מיובא כמודול ממקום אחר, הוא יקבל את שמו האמיתי, לדוגמה "text_utils". וזה בדיוק מה שמאפשר להפריד בין **קוד להרצ**ה לבין **קוד לשימוש חוזר.**

**דוגמה פשוטה**

```python
# text_utils.py
def normalize(text: str) -> str:
    return " ".join(text.split()).strip()

if __name__ == "__main__":
    sample = "  Hello   world  "
    print(normalize(sample))  # Hello world
```

כשאתה מריץ את הקובץ ישירות (python text_utils.py), 
פייתון תבצע גם את החלק שבתוך ה-if. אבל אם תייבא את הקובץ ממקום אחר:

```python
from text_utils import normalize
```

הקטע שבתוך ה-if **לא ירוץ** בכלל.

**למה זה חשוב?**

כי ככה אתה יכול לבדוק קובץ בעצמך, 
מבלי שהוא יפריע לקוד שמייבא אותו אחר כך. 
זה אחד הטריקים הכי פשוטים שהופכים סקריפט לספרייה אמיתית.

**טיפ קטן**

אם יש לך מודול עם קוד בדיקה פנימי, השאר אותו תמיד תחת if __name__ == "__main__": ולא סתם בסוף הקובץ. כך הוא נשאר להרצה עצמאית בלי להשפיע על שאר המערכת.

## Utility modules: איחוד פונקציות עזר

מטרת מודול עזר היא לרכז פונקציות קטנות שחוזרות על עצמן, בלי להפוך לפח אשפה של הפרויקט.

**מתי ליצור מודול עזר?**

- כשרואים את אותה פעולה בקבצים שונים של הפרויקט.

- כשהפונקציות קצרות, טהורות, ולא תלויות בהקשר ספציפי.

- כשהן שימושיות בכמה מודולים שונים.

**איך לארגן אותם?**

עדיף להחזיק כמה מודולי עזר קטנים לפי תחום, ולא קובץ ענק בשם utils.py.

- string_utils.py לטקסט

- io_utils.py לקריאה וכתיבה

- time_utils.py לזמנים ותאריכים

**דוגמה קצרה**

src/my_package/string_utils.py

```python
def normalize_spaces(s: str) -> str:
    return " ".join(s.split()).strip()

def safe_lower(s: str | None) -> str:
    return (s or "").lower()
```

שימוש מתוך מודול אחר:

```python
# src/my_package/text/cleaner.py
from my_package.string_utils import normalize_spaces, safe_lower

def normalize(text: str) -> str:
    text = normalize_spaces(text)
    return safe_lower(text)
```

**כללי עבודה פשוטים**

- פונקציות עזר עדיף שיהיו טהורות. קלט בפנים, פלט החוצה.

- אם פונקציה נוגעת בקבצים או בסביבה, ציינו זאת בשם או בדוקסטרינג.

- אם מודול עזר גדל מדי, פצלו אותו לפי תחומים. קל יותר לתחזק ולייבא.

**בדיקה מהירה**

אם קשה לתת שם ברור למודול העזר, סימן שהוא מתחיל להכיל את הכול מהכול, זה סימן לפיצול.

## דוגמה מרכזית: פרויקט mini_text_analyzer מחולק למודולים

אחרי שהבנו איך מחלקים קוד למודולים וחבילות, הגיע הזמן לראות איך זה נראה בפרויקט אמיתי. הדוגמה הבאה מציגה גרסה פשוטה של כלי לעיבוד טקסטים **mini_text**. הרעיון הוא לא רק לפצל קבצים, אלא לבנות מבנה שמאפשר להתרחב בלי לגעת בלוגיקה קיימת.

```bash
mini_text/
├─ src/
│  └─ mini_text/
│     ├─ __init__.py
│     ├─ clean.py
│     ├─ tokenize.py
│     └─ stats.py
└─ scripts/
   └─ run_demo.py
```

**clean.py**

```python
def normalize(text: str) -> str:
    """Remove extra spaces and apply basic cleaning."""
    return " ".join(text.split()).strip()
```

**tokenize.py**

```python
from mini_text.clean import normalize

def tokenize(text: str) -> list[str]:
    """Split text into words after cleaning."""
    return normalize(text).split()
```

**stats.py**

```python
from mini_text.tokenize import tokenize

def count_tokens(text: str) -> int:
    """Count the number of words in the text."""
    return len(tokenize(text))
```

**init.py**

```python
from .clean import normalize
from .tokenize import tokenize
from .stats import count_tokens

__all__ = ["normalize", "tokenize", "count_tokens"]
```

**run_demo.py**

```python
import sys
sys.path.append("src")

from mini_text import normalize, tokenize, count_tokens

text = "  Hello   to   the AI era "
print(normalize(text))        # Hello to the AI era
print(tokenize(text))         # ['Hello', 'to', 'the', 'AI', 'era']
print(count_tokens(text))     # 5
```

**למה זה עובד טוב**

• כל קובץ מטפל בנושא אחד בלבד.

• אין תלות מעגלית - כל מודול יודע בדיוק על מי הוא נשען.

• אפשר להוסיף פונקציה חדשה

(למשל detect_language) בלי לגעת בקוד קיים.

• קריא גם למי שנכנס לפרויקט בפעם הראשונה.

## סיכום: איך ארגון נכון מקל על הרחבה

כשפרויקט באמת מסודר, כל שינוי קטן הוא לא מלחמה. אתה פשוט יודע איפה לגעת ומה להשאיר בשקט. זה ההבדל בין קוד שנשען על קורי עכביש לבין מערכת שאפשר לסמוך עליה.

**אז מה לקחת מהפרק?**

- אל תשאיר את הכול בקובץ אחד. כל מודול מטפל בנושא אחד ברור.

- השתמש ב-imports מוחלטים כברירת מחדל. זה הופך את הקוד ליציב וקל לקריאה.

- שמור על מבנה תיקיות קבוע פרויקטים מסודרים מתחילים ב-src/.

- כתוב docstring קצר וברור בתחילת כל קובץ. משפט אחד שמסביר מה הוא עושה מספיק.

- שמות פשוטים, פונקציות מדויקות, אחריות אחת לכל קובץ.

- הפרד בין ספרייה להרצה בעזרת if __name__ == "__main__":

- רכז פונקציות כלליות במודולי עזר קטנים, לא בקובץ “ענק, ואת הכול”.

ולפני שאתה עושה merge או שולח PR, תעבור בראש על שלושת השאלות האלו:

1. אני מבין מיד **מה כל קובץ עושה?**

2. אני יודע **מאיפה כל import מגיע?**

3. אם אמחק פונקציה, ברור לי **מה יישבר?**

אם ענית “כן” על שלושתן.

הקוד שלך כבר נראה כמו של מתכנת שמבין הנדסה, לא רק סינטקס. הרחבות חדשות ייכנסו חלק, באגים יהיו קלים יותר לאיתור, והקוד שלך יהיה נעים גם לעיניים של מי שיבוא אחריך.


