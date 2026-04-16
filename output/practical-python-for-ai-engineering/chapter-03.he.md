# פרק 3 - מבני נתונים שימושיים

## למה מבני נתונים קריטיים ב-AI

אם בפרקים הקודמים למדנו איך פייתון חושבת,
הפרק הזה עובר לשאלה החשובה יותר. איך היא זוכרת.
כל מערכת חכמה, מאימון מודל שפה ועד ניתוח טקסט קצר 
קמה ונופלת על הדרך שבה אנחנו מאחסנים, מעבדים, וניגשים לנתונים.

מבני הנתונים הם הלב הפועם של כל מערכת AI.
הם קובעים כמה מהר תשלוף תוצאה,
כמה זיכרון תבזבז בדרך,
וכמה קל יהיה לשנות את האלגוריתם בלי לפרק את הכול מחדש.

פייתון אולי נראית פשוטה, אבל מתחת לפני השטח היא מסתירה מערכת מבני נתונים מתקדמת במיוחד.
חמשת המבנים הבסיסיים שלה:

list, dict, set, tuple, ו-collections

מכסים כמעט כל תרחיש אפשרי של אחסון ועיבוד מידע.

והיופי? כולם מובנים בשפה,
נגישים מיד. בלי ייבוא, בלי קונפיגורציה, בלי טקסיות מיותרת.


**מבני נתונים בעולם ה-AI**

כשאנחנו בונים מערכת בינה מלאכותית, 
אנחנו לא עובדים רק עם “מספרים”
אלא עם טקסטים, תגים, ייצוגים וקטורים ,(embeddings) מדדים, תוצאות.
ובכל אחד מהמקרים האלה הבחירה במבנה הנתונים הנכון
יכולה להיות ההבדל בין מערכת שעובדת חלק לבין אחת שנתקעת בלופ אין-סופי.

• ניתוח טקסטים? רשימות (list) ומילונים (dict).

• ספירת תדירויות? Counter מתוך collections.

• חיפוש ייחודיות? קבוצות (set).

• שמירה על סדר הכנסה? deque או OrderedDict.

מהנדס AI מנוסה לא חושב רק על הפתרון, הוא חושב על הייצוג.
איך הנתונים יזרמו, איפה הם יאוחסנו,
ואיך לשמור על איזון בין ביצועים לקריאות.

**למה זה חשוב דווקא בפייתון**

פייתון הפכה לשפה המובילה בעולם ה-AI לא רק בזכות הספריות שלה, אלא בגלל הדרך שבה היא מאפשרת לעבוד עם נתונים בצורה טבעית.
היכולת לעבור בין רשימה למילון, לסנן, למיין וליצור מבנים חדשים תוך שניות היא מה שמאפשר למתכנתים להתנסות, למדל ולבנות אב-טיפוס במהירות שיא.

אבל יש גם מחיר: הגמישות הזו מזמינה בלבול.
קל מאוד לבחור במבנה "שעובד". אבל לא בהכרח "נכון".

בפרק זה נלמד לזהות את ההבדלים, להבין את יתרונות כל מבנה,
ולראות איך להשתמש בהם כמו מתכנתים, לא כמו חובבנים.

לפני שנצלול לקוד, חשוב לזכור:
פייתון היא לא רק שפה שמריצה אלגוריתמים.

היא שפה שמעצבת את צורת החשיבה שלך על נתונים.
אם תשלוט במבני הנתונים שלה,
תוכל להתמודד עם כמעט כל בעיה בעולם ה-AI 
בלי לגעת בשורה אחת של NumPy או TensorFlow.


## list רשימות דינמיות ופעולות נפוצות

הרשימה (list) היא אחד הכלים הפשוטים אבל גם אחד החשובים ביותר בפייתון.
במובן מסוים, היא ה-Swiss Army Knife של עולם הנתונים:
גמישה, קלה לשימוש, ויכולה לשמש כמעט לכל צורך 
מאיסוף תוצאות ועד אחסון טקסטים, ייצוגים וקטוריים (embeddings)או מדדים ממודלים.

**איך יוצרים רשימה**

```
numbers = [1, 2, 3, 4, 5]
names = ["Tamar", "Noam", "Tomer"]
mixed = [1, "AI", True, None]
```


רשימה יכולה להכיל ערכים מטיפוסים שונים 
וזו אחת הסיבות שפייתון כל כך גמישה.
מהנדס טוב יודע להשתמש בזה בזהירות:
אם כל איבר שונה לגמרי, כנראה שהנתונים עצמם לא מאורגנים היטב.

**פעולות נפוצות**

```python
data = [10, 20, 30, 40]

print(len(data)) # 4 - length of list
print(data[0]) # 10 - first element
print(data[-1]) # 40 - last element
print(data[1:3]) # [20, 30] - slice
```

**```**


רשימות בפייתון מתנהגות כמעט כמו מערך,
אבל עם יתרון עצום: הן **דינמיות** 
אפשר להוסיף, להסיר ולשנות ערכים תוך כדי ריצה.

```python
data.append(50) # Adds to the end
data.insert(0, 5) # Inserts at index 0 (the beginning)
data.remove(30) # Removes the first occurrence of value 30

print(data) # [5, 10, 20, 40, 50]
```

רשימות גם ניתנות למיון בקלות:

```
data.sort()
data.reverse()
```


והכול קורה במקום, בלי צורך להחזיר עותקים חדשים (כמו במחרוזות).


**מעבר על רשימה**

```python
for value in data:
 print(value)
```

אין צורך במונה, ואין צורך לבדוק את האורך 
פייתון פשוט “מבינה” איך לעבור על הרשימה.

אם בכל זאת צריך גם אינדקס, משתמשים ב-enumerate:

```python
for i, value in enumerate(data):
 print(f"{i}: {value}")
```


**פעולות שימושיות למהנדסי AI**

רשימות משמשות כמעט בכל Pipeline של AI:

• רשימת משפטים שממתינה לעיבוד.

• רשימת תוצאות ממודל.

• רשימת קבצים בתיקייה.

שילוב קטן עם comprehension או תנאים,
ומתקבל קוד מדויק ויעיל:

```python
scores = [88, 92, 75, 100, 67]
high_scores = [s for s in scores if s >= 90]
print(high_scores) # [92, 100]
```


**שכפול רשימות**

שכפול הוא נקודה רגישה בפייתון:
כשמעתיקים רשימה עם = נוצר רק מצביע חדש, לא עותק אמיתי.

```python
a = [1, 2, 3]
b = a
b.append(4)
print(a) # [1, 2, 3, 4]
```

שני המשתנים מצביעים על אותה רשימה!
כדי לשכפל באמת, יש להשתמש באחת מהדרכים הבאות:

```
b = a.copy() # or
b = list(a) # or
b = a[:] # full slicing
```

## dict מילונים (key → value) ושימושים

אם הרשימה היא לב המערכת, המילון (dict) הוא המוח שלה.
זהו מבנה הנתונים שבו פייתון באמת מצטיינת מיפוי של מפתח לערך, כמו טבלה קטנה בזיכרון, עם גישה מיידית לכל נתון בלי צורך לעבור על כל הרשימה.

**איך נראה מילון**

```
person = {
 "name": "Tamar",
 "age": 29,
 "is_active": True
}
```

כל ערך מאוחסן תחת מפתח ייחודי.
המפתחות במילון חייבים להיות בלתי ניתנים לשינוי (immutable).
בדרך כלל אלו מחרוזות או מספרים, אך אפשר להשתמש גם ב-tuple (למשל, לציון מיקום או זוג ערכים).

גישה לערכים פשוטה וברורה:

```python
print(person["name"]) # Tamar
print(person["age"]) # 29
```


אם תנסה לגשת למפתח שלא קיים, תקבל שגיאה (KeyError).
לכן בפועל, נהוג להשתמש בפונקציה בטוחה יותר:

```python
print(person.get("email", "No email provided"))
# Output: No email provided
```

אם המפתח לא קיים, מוחזר הערך ברירת-המחדל.

**הוספה, עדכון והסרה**

```python
person["city"] = "Tel Aviv"
# add
person["age"] = 30
# update
del person["is_active"]
# delete
```

**```**

פשוט, ישיר, וקריא.
אין צורך במתודות מורכבות או בקונסטרוקציות מסורבלות.


**מחיקת ערכים ממילון**

לפעמים נרצה להסיר פריט ממילון קיים. מפתח שלם, או ערך מסוים בתוך מילון פנימי.

```python
person = {"name": "Tomer", "age": 13, "city": "Petah Tikva"}

# delete a key entirely
del person["age"]

# safe deletion - no error if the key doesn't exist
```python
# pop returns the value of the deleted key, or None if not found
```
person.pop("city", None)
```


אם רוצים לרוקן את כל המילון:

```python
person.clear()
```python
# Removes all items from the dictionary, leaving it empty: {}
```
```


**מחיקת ערכים ממילון מורכב**

לפעמים נרצה למחוק רק שדה מתוך פריט, לפעמים פריט שלם, ולפעמים את כל הנתונים.
בדוגמה הבאה רואים את כל המצבים הנפוצים:

```python
students = {
 1: {"name": "Charlie", "age": 16, "grade": 82},
 2: {"name": "Noam", "age": 15, "grade": 95},
 3: {"name": "Tomer", "age": 17, "grade": 78},
}

# Delete only the age of student Charlie
del students[1]["age"]

print(students)
# {1: {'name': 'Charlie', 'grade': 82},
# 2: {'name': 'Noam', 'age': 15, 'grade': 95},
# 3: {'name': 'Tomer', 'age': 17, 'grade': 78}}

# Delete the student with ID 2
del students[2]
print(students)
# {1: {'name': 'Charlie', 'grade': 82},
# 3: {'name': 'Tomer', 'age': 17, 'grade': 78}}

# Delete a student by name (via inner value)
```python
# Note: list() is used to avoid 'dictionary changed size during iteration' error
```
for student_id, info in list(students.items()):
 if info["name"] == "Charlie":
 del students[student_id]

print(students) 
# {3: {'name': 'Tomer', 'age': 17, 'grade': 78}}

# Delete all students
students.clear()
print(students)
# {}
```

כך אפשר לשלוט בדיוק ברמה של המחיקה. משדה יחיד ועד ניקוי מוחלט של כל המידע.

במילונים גדולים, כדאי להעדיף מחיקה ממוקדת כדי לשמור על יעילות הקוד.

**מעבר על מילון**

שלושה דרכים עיקריות לעבור על מילון:

```python
for key in person:
 print(key) # keys only

for value in person.values():
 print(value) # values only

for key, value in person.items():
 print(key, "→", value) # both key and value
```


הצורה השלישית: ()items - היא הנפוצה ביותר,
בעיקר כשאנחנו מעבדים נתונים לצורכי לוגים, JSON או ניתוח תוצאות.


**Dict בעולם ה-AI**

מילונים נמצאים בכל מקום:

• פלטים של מודלים ({"label": "positive", "score": 0.97})

• קונפיגורציות של מערכות

• שליפת פרמטרים ממודלים

• אחסון תוצאות ביניים

זו דרך טבעית לתאר **נתונים מובנים**, בלי צורך במחלקות מורכבות.

```
model_output = {
 "text": "AI is amazing",
 "tokens": 4,
 "score": 0.98
}
```


כך נראים כמעט כל הפלטים שמוחזרים מ-OpenAI, Hugging Face, או LangChain.
המבנה הזה מאפשר גישה ברורה, המרה ל-JSON, וחיסכון בזמן פיתוח.


**פעולות שימושיות**

```python
data = {"a": 1, "b": 2, "c": 3}

print("a" in data)
# True - check if key exists

print(data.keys())
# dict_keys(['a', 'b', 'c']) - show all keys

print(data.values())
# dict_values([1, 2, 3]) - show all values

print(list(data.items()))
```python
# [('a', 1), ('b', 2), ('c', 3)] - show list of (key, value) pairs
```
```

**```**


אפשר גם למזג שני מילונים בקלות:

```python
defaults = {"lang": "he", "mode": "prod"}
custom = {"mode": "dev"}

# Merges two dictionaries. 
```python
# If keys overlap, the value from the last dictionary (custom) wins.
```
config = {**defaults, **custom}

print(config)
# {'lang': 'he', 'mode': 'dev'}
```

אם יש התנגשות במפתחות, הערכים מהשני גוברים.


## set קבוצות של ערכים ייחודיים

אם list היא רשימת נתונים, ו-dict הוא מיפוי נתונים, אז set הוא השומר בשער. 
הוא לא מתעניין בסדר, רק בשאלה אחת פשוטה:
**האם הערך הזה כבר קיים?**

מבנה הנתונים set מייצג קבוצה של ערכים ייחודיים, כלומר לא יכולים להיות בו כפילויות.
זה הופך אותו לכלי אידיאלי למצבים שבהם רוצים לוודא ייחודיות, לספור סוגים שונים של פריטים, או לבצע פעולות חיתוך ואיחוד בין קבוצות נתונים.

**יצירה ושימוש בסיסי**

```python
tags = {"AI", "ML", "NLP", "AI"}
print(tags)
# {'AI', 'ML', 'NLP'}
```python
# Note: Sets are unordered collections of unique elements; the duplicate "AI" is automatically removed.
```
```


כמו שאפשר לראות, הערך "AI" הופיע פעמיים, אבל נשמר רק פעם אחת. פייתון שומרת רק את הערכים הייחודיים, ללא סדר קבוע.

אפשר גם ליצור קבוצה מרשימה קיימת:

```python
``Python
numbers = [1, 2, 2, 3, 3, 3]
unique_numbers = set(numbers)
print(unique_numbers)
```python
# {1, 2, 3} - Converting a list to a set automatically removes duplicates
```
```


**פעולות קבוצתיות**

Set מאפשר לבצע פעולות מתמטיות קלאסיות בקלות,
כמו איחוד, חיתוך והפרש 
וזה בדיוק מה שמועיל בניתוח נתונים מורכבים.

```python
a = {"AI", "ML", "Data"}
b = {"AI", "Vision", "Robotics"}

print(a | b)
```python
# Union: {'AI', 'ML', 'Data', 'Vision', 'Robotics'} (All unique elements)
```

print(a & b)
# Intersection: {'AI'} (Elements present in both)

print(a - b)
```python
# Difference: {'ML', 'Data'} (Elements in 'a' but not in 'b')
```

print(a ^ b)
```python
# Symmetric Difference: {'ML', 'Data', 'Vision', 'Robotics'} (Elements in either 'a' or 'b', but not b
```
```


אלה פעולות רשת קלאסיות: איפה יש חפיפה, איפה לא.
בעולם ה-AI הן שימושיות במיוחד להשוואת תגים, קטגוריות או מזהים ייחודיים.

**שימושים מעשיים**

**סינון כפילויות**:

```python
tokens = ["ai", "ai", "is", "awesome"]
unique_tokens = list(set(tokens))

print(unique_tokens)
```python
# Output: ['awesome', 'ai', 'is'] (The order may vary as sets are unordered)
```
```


**בדיקה מהירה של שייכות** (מהירה בהרבה מרשימה):

```
```

if "ai" in unique_tokens:

print("Found!")

```
```

**השוואת קבוצות תוצאות** ממודלים שונים:

```python
model_a = {"positive", "neutral"}
model_b = {"neutral", "negative"}
overlap = model_a & model_b

print(overlap)
# {'neutral'}
```

**הבדל חשוב מול רשימות**

Set** אינו שומר על סדר.**
אם הסדר חשוב, השתמש ב-list או ב-dict (שמגרסה 3.7 שומר על סדר הכנסת המפתחות). לעומת זאת, אם העדיפות היא למהירות ולייחודיות set ינצח בכל פעם.

**טיפ הנדסי**

במערכות AI, חישובים רבים מסתמכים על זיהוי חפיפות, כפילויות וייחודיות .

למשל, כמה מילים חדשות הופיעו בטקסט, או כמה מזהים שונים עברו בתהליך מסוים. set הוא מבנה הנתונים המושלם לזה:
קל, מהיר, ועם פעולות שמאפשרות לחשוב ברמה של קבוצות, לא של לולאות.

זו בדיוק החשיבה ההנדסית שפייתון מעודדת 
לא לבדוק “אחד אחד”, אלא להסתכל על התמונה הכוללת.

## tuple רצף קבוע ואי-שינוי

אם list היא רשימה גמישה ודינמית, tuple הוא ההפך המוחלט.

**רצף קבוע, יציב, שלא ניתן לשנות לאחר שנוצר.**

זה אולי נשמע כמו מגבלה,
אבל במערכות חכמות, דווקא היכולת *לא* להשתנות היא לעיתים היתרון הכי גדול.

**איך נראה tuple**

```python
point = (10, 20)
print(point[0]) # 10
print(point[1]) # 20

```python
# Note: Tuples are immutable, meaning you cannot change their values 
```
```python
# after creation (e.g., point[0] = 15 would raise a TypeError).
```
```

**```**

התחביר כמעט זהה לרשימה. רק עם סוגריים עגולים במקום מרובעים.
מה שמייחד את tuple הוא העובדה שלא ניתן לשנות אותו:

```python
point[0] = 5
# `❌```
 will raise an error: 'tuple' object does not support item assignment
``

```


ברגע שיצרת tuple, הערכים שבו קבועים.
זו תכונה חשובה כשמדובר בנתונים שאתה לא רוצה שישתנו בטעות, למשל תוצאות ביניים, קואורדינטות, או נתונים שמיועדים לשימוש חוזר.


**יצירה והמרה**

```python
data = (1, 2, 3) # Single-element tuple
single = (5,) 
```python
# Correct: Without the comma, (5) is treated as an integer in parentheses.
```

# Converting between types
as_list = list(data) # [1, 2, 3]
as_tuple = tuple(as_list) # (1, 2, 3)
```

**```**

פסיק אחד קטן הוא מה שהופך ביטוי ל-tuple אמיתי.
בלי הפסיק, פייתון תזהה את זה כערך רגיל, לא כקבוצה.

**Unpacking פירוק חכם **אחת הסיבות ש-tuples כל כך נוחים היא היכולת לפרק אותם בקלות:

```python
x, y = (10, 20)
print(x, y)
# 10 20
```

ה-tuple "נפתח" לשניים או שלוש משתנים, לפי הסדר.
וזה עובד גם בפונקציות שמחזירות כמה ערכים:

```python
def get_stats():
 return (10, 5, 2)

max_val, avg, min_val = get_stats()

print(max_val) # 10
print(avg) # 5
print(min_val) # 2
```

במקום להחזיר מילון, לפעמים עדיף להחזיר tuple כשהמבנה פשוט וברור.


**שימושים מעשיים ב-tuple**

**תוצאה קבועה מפונקציה**:

כשפונקציה מחזירה כמה ערכים, שימוש ב-tuple מבטיח שמבנה התוצאה יציב וברור:

```python
def analyze(text: str) -> tuple[int, int]:
 """returns (word count, character count)."""
 return len(text.split()), len(text)

# Example usage:
# words, chars = analyze("AI is amazing")
# print(words) # 3
# print(chars) # 13
```


השימוש ב-tuple מבהיר שהתוצאה קבועה וחד-צורתית.

כעת אפשר להשתמש בערכים כך:

```python
words, chars = analyze("שלום עולם")

print(words) 
# 2

print(chars)
# 9 (Including the space)
```


tuple מבטיח שהתוצאה תישאר תמיד באותו מבנה.

**מפתח במילון**:

מאחר ש-tuple הוא immutable, ניתן להשתמש בו כ-key במילון:

```python
coords = {(10, 20): "A", (15, 25): "B"}
print(coords[(10, 20)])
# A
```


אי אפשר לעשות זאת עם list, ולכן tuple הוא מבנה אידיאלי לייצוג מיקום, צבע או כל זוג ערכים יציב.

**הגנה על נתונים**:

כשלא רוצים שאף חלק בקוד ישנה ערכים בטעות, tuple מספק שכבת הגנה טבעית (read-only):

Python

```python
rgb = (255, 128, 0)
```python
# rgb[0] = 0 → will raise an error: 'tuple' object does not support item assignment
```

```

כך ניתן לשמור על נתונים קריטיים "נעולים".



**עבודה עם מערכים או מימדים**:

בספריות כמו NumPy אוpandas , **tuple** משמשת לתיאור מימדים (dimensions) או קואורדינטות קבועות:

```python
import numpy as np

array = np.zeros((3, 5))
print(array.shape) 
# (3, 5)
```

היא מאפשרת לייצג את מימדי הנתונים בצורה ברורה וחד-משמעית.

**העברת פרמטרים לפונקציות**:

ניתן "לפתוח" tuple ישירות כפרמטרים לפונקציה:

זוהי דרך שימושית להעביר אוספי נתונים לפונקציות בצורה אלגנטית.

```python
def show(x, y):
 print(x, y)

point = (10, 20)
show(*point) 
# 10 20
```


**tuple לעומת list**


<div dir="rtl">

| תכונה | list | tuple |
| --- | --- | --- |
| שינוי ערכים | כן | לא |
| גודל משתנה | כן | לא |
| ביצועים | איטי יותר | מהיר יותר |
| שימוש טיפוסי | נתונים דינמיים | נתונים קבועים |

</div>



**ההבדל העיקרי הוא בגישה:**
**רשימות נועדו לשינויים, tuple נועד ליציבות.**
במערכות AI, זה שימושי במיוחד כשמעבירים נתונים בין שלבים ב-pipeline אפשר להיות בטוחים שאף שלב לא שינה אותם בדרך.

**טיפ הנדסי**

כמעט כל פונקציה שאתה כותב יכולה להחזיר tuple קטן של ערכים 
וזה לא “קיצור דרך”, אלא שיטה הנדסית לשמור על קוד פשוט וברור.
אם המבנה צפוי, tupleעדיף על מילון.
אם אתה צריך שמות שדות, תעבור ל-dataclass או ל-TypedDict.

## collections: defaultdict, Counter, deque

עד עכשיו דיברנו על מבני הנתונים הבסיסיים של פייתון:
list, dict, set, ו-tuple.
אבל לפעמים אתה רוצה משהו קצת יותר מתוחכם 
מבנה נתונים שעדיין פשוט, אבל **חוסך ממך קוד שחוזר על עצמו.**

בשביל זה קיימת הספרייה collections.
היא חלק מובנה מפייתון, ואין צורך להתקין כלום.

**שלושת הכוכבים שלה:**
defaultdict, Counter, ו-deque.
כל אחד מהם נועד לפתור בעיה יומיומית אחת, בצורה אלגנטית.

**:Defaultdict מילון עם ערך ברירת מחדל**

נניח שאתה רוצה לספור כמה פעמים כל תו מופיע במחרוזת:

```python
text = "banana"
freq = {}

for ch in text:
 if ch not in freq:
 freq[ch] = 0
 freq[ch] += 1

print(freq)
# {'b': 1, 'a': 3, 'n': 2}
```

זה עובד, אבל מכוער.

עם defaultdict, אין צורך לבדוק אם המפתח קיים:

```python
from collections import defaultdict

text = "banana"
freq = defaultdict(int)

for ch in text:
 freq[ch] += 1

print(freq)
# defaultdict(<class 'int'>, {'b': 1, 'a': 3, 'n': 2})
```


ברגע שפייתון רואה מפתח חדש, היא פשוט יוצרת ערך ברירת-מחדל (במקרה הזה - 0),
ומאפשרת להמשיך כאילו הוא כבר קיים.
כך חוסכים קוד הגנתי מיותר.

**Counter ספירה חכמה**

אם כל מה שאתה צריך הוא ספירה,
פייתון כבר מספקת פתרון ישיר עוד יותר:

```python
from collections import Counter

words = ["ai", "is", "amazing", "ai", "is", "ai"]
count = Counter(words)
print(count)
# Counter({'ai': 3, 'is': 2, 'amazing': 1})
```


אפשר לשלב אותו עם פעולות מתקדמות:

```python
print(count.most_common(1))
# [('ai', 3)]
```python
# Returns a list containing the tuple of the most frequent element and its count.
```

print(count["is"])
# 2
# Directly access the frequency of a specific element.
```

Counter שומר על מבנה של מילון,
אבל מתנהג כמו כלי סטטיסטי קטן 
מושלם לניתוח טקסטים, לוגים או תוצאות ממודלים.

**deque תור דו-כיווני**

deque (נשמע כמו "deck") הוא רשימה מהירה במיוחד 
שמאפשרת להוסיף ולהסיר איברים **משני הכיוונים** ביעילות גבוהה.


```python
from collections import deque

queue = deque(["task1", "task2", "task3"])
queue.append("task4")
# add to the end

queue.appendleft("urgent")
# add to the beginning

print(queue)
# deque(['urgent', 'task1', 'task2', 'task3', 'task4'])

queue.pop()
# remove from the end ("task4")

queue.popleft()
# remove from the beginning ("urgent")
```


בניגוד ל-list, הוספה או הסרה בתחילת רשימה גדולה **לא דורשת העתקה של כל האיברים.**
במערכות שבהן יש תורים (queues) או זרימת נתונים (streams), deque הוא הבחירה הנכונה.

**למה זה חשוב ב-AI**

שלושת המבנים האלה חוזרים על עצמם שוב ושוב בפרויקטי AI:

• Defaultdict -ניהול תוצאות ביניים, ניקוי נתונים, או קיבוץ לפי קטגוריות.

• Counter -ספירת מילים, טוקנים, תגיות או קטגוריות.

• Deque -אחסון נתונים זמניים בתהליכים אסינכרוניים או בזמן אמת.

הם קטנים, מהירים, ומובנים בשפה.
ואת כל מה שהם עושים היית יכול לכתוב ידנית אבל השורה הזו מסכמת הכול:
**למה לכתוב קוד כשפייתון כבר כתבה אותו בשבילך?**

הוא כותב **פחות** קוד שעובד **חכם** יותר.


## דוגמה מרכזית: סטטיסטיקות טקסט עם dict ו-Counter

מערכות AI מתבססות על נתונים,
אבל לפני שיש מודל, יש טקסטים.
לפני, embeddings יש מילים.
ולפני למידה עמוקה, יש סטטיסטיקות פשוטות.

בדוגמה הזו נשתמש ב-dict וב-Counter כדי לנתח טקסט קצר:
לספור מילים, לחשב ממוצע אורך, ולמצוא את המילה הנפוצה ביותר. זו אותה לוגיקה שמופיעה כמעט בכל שלב של עיבוד שפה טבעית (NLP).

**הקוד**

```python
from collections import Counter
import re

def simple_word_stats(text: str) -> dict[str, float | str]:
 """
 Computes basic text statistics:
 - number of words
 - number of characters
 - average word length
 - most common word
 """
 # basic punctuation cleanup
 clean_text = re.sub(r"[^\w\s]", "", text)
 words = clean_text.split()
 num_words = len(words)
 num_chars = len(clean_text)
```python
 avg_length = sum(len(w) for w in words) / num_words if num_words else 0
```
```
 most_common = Counter(words).most_common(1)[0][0] if words else ""
```

 return {
 "num_words": num_words,
 "num_chars": num_chars,
 "avg_word_length": round(avg_length, 2),
 "most_common_word": most_common
 }
```


**דוגמת הרצה**

```python
sample = "AI is amazing. AI changes everything!"
print(simple_word_stats(sample))

# Output:
```python
# {'num_words': 6, 'num_chars': 35, 'avg_word_length': 5.0, 'most_common_word': 'AI'}
```
```



**הסבר קצר**

• re.sub מנקה סימני פיסוק כדי לקבל מילים נקיות.

• split() מפרק את הטקסט לרשימת מילים (list).

• Counter מחשב בקלות את שכיחות כל מילה.

• הפונקציה מחזירה מילון (dict) שמוכן לכתיבה לקובץ JSON או לוג.

מספר שורות, אבל מאחוריהן כל החשיבה ההנדסית של פייתון:

• ניצול של מבני נתונים פשוטים במקום קוד הגנתי.

• שימוש ב-Counter במקום לבנות לולאה ידנית.

• קריאות מוחלטת, כל מה שהקוד עושה כתוב במפורש.


## סיכום: מתי להשתמש בכל מבנה נתונים

הבחירה במבנה הנתונים הנכון היא מה שמבדיל בין קוד שעובד לקוד שבנוי נכון.
בפייתון יש חמישה כלים עיקריים, וכל אחד נועד למטרה אחרת.

• **list** - כשצריך סדר וגמישות.
מתאימה לרצפים משתנים כמו משפטים, תוצאות או מדדים.
אם אתה בודק הרבה “האם הערך קיים?”, עדיף לעבור ל-set.

• **tuple** - כשצריך יציבות.
בלתי ניתן לשינוי, מושלם לערכים קבועים כמו קואורדינטות, תוצאות או מפתחות במילון.

• **set** - כשצריך ייחודיות ובדיקות מהירות.
שומר רק ערכים ייחודיים, מעולה לסינון והשוואה בין קבוצות.

• **dict** - כשצריך קשרים בין נתונים.
מיפוי של מפתח לערך, הבסיס ל-JSON, קונפיגורציות ונתונים מובנים.

• **collections** - כשצריך מבני נתונים מתקדמים שמוכנים לשימוש מידי.

במקום להמציא לוגיקה משלך, תשתמש במה שפייתון כבר בנתה עבורך:

• **Defaultdict** -מילון שיודע להתמודד לבד עם ערכים חסרים.

• **Counter ** -לספירה חכמה של מילים, תגים, תגובות - כל דבר.

• **Deque ** -תור דו-כיווני מהיר ויציב.

שלושתם חוסכים קוד, טעויות וזמן.


**הבחירה הנכונה = קוד יציב יותר**


<div dir="rtl">

| צורך | מבנה מתאים | מאפיין בולט |
| --- | --- | --- |
| סדר וערכים משתנים | list | ניתנת לשינוי, שומרת על סדר |
| מיפוי מהיר לפי מפתח | dict | גישה ישירה, קריאה טבעית |
| ייחודיות ובדיקת קיום | set | מהירה במיוחד, בלי כפילויות |
| נתונים קבועים מראש | tuple | יציבות, בטיחות, ביצועים |
| ספירה, קיבוץ או תור | collections | פתרונות חכמים ומוכנים |

</div>



בסוף זה פשוט:
list -** סדר, **tuple -** יציבות, **set -** ייחודיות, **dict -** הקשרים,**
ו-collections - **כלים חכמים שפייתון כבר בנתה עבורך.**


כשאתה בוחר נכון. הקוד שלך נשאר קצר, ברור ועמיד.

