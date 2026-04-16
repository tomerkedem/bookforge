# פרק 14 - Pandas למהנדסי AI

## למה Pandas (ולא “רק” NumPy או dict)

בוא נדבר רגע על המקום שבו רוב מהנדסי ה-AI נופלים בהתחלה:
הם מתחילים לנתח נתונים עם NumPy או אפילו עם list ו-dicts של פייתון, וזה עובד מצוין... עד שזה כבר לא. במבט ראשון, נראה ש-NumPy נותן לך הכול: מערכים מהירים, פעולות וקטוריות, חישוב מטריצות, ויעילות כמעט כמו בקוד C. אבל כשאתה עובד עם נתונים אמיתיים, לא מטריצות סטריליות אלא קבצי CSV, טקסטים, מזהים, ערכים חסרים, תאריכים, סוגים שונים של עמודות.

פתאום זה מתחיל להרגיש כמו לאפות עוגה עם מברג.

ופה נכנסת Pandas. Pandas = השכבה האנושית של הנתונים אפשר לחשוב על Pandas כעל עטיפה אינטואיטיבית ל-NumPy, שמבינה איך מתכנתים באמת עובדים עם מידע.

במקום להתעסק במיקומים ובממדים, אתה עובד עם שמות עמודות ושורות ממש כמו בגיליון Excel, רק עם כוח של קוד.

```python
import pandas as pd

# Read a CSV file directly into a DataFrame
df = pd.read_csv("data/users.csv")

# First look at the data
print(df.head())

# Filter rows with a logical condition
active = df[df["is_active"] == True]

# Count active users
print("Active users:", len(active))
```


בשלוש שורות אתה עושה מה שב-NumPy היה דורש מערך דו-ממדי, חישוב אינדקסים, והמרת טיפוסים.

ופה בדיוק הכוח של **Pandas**:

Pandasנבנתה סביב מודל החשיבה של מהנדס הנתונים, לא סביב מבני הזיכרון של המעבד.

**למה לא להסתפק ב-dict או list?**

list ו-dicts הם מושלמים כשמדובר באובייקטים בודדים או אוספים קטנים.
אבל ברגע שהנתונים שלך מגיעים ממקור חיצוני (כמו CSV או JSON) ואתה רוצה:

• למיין לפי עמודה

• לסנן לפי תנאי

• לחשב ממוצעים או סטיות תקן

• לאחד datasets שונים

• להתמודד עם NaN או סוגי נתונים מעורבים

אתה מגלה מהר מאוד ש-dict הוא לא טבלה, הוא מבוך.

ניקח דוגמה קטנה:

```python
users = [
 {"name": "Dana", "age": 29, "city": "Tel Aviv"},
 {"name": "Roi", "age": 34, "city": "Haifa"},
 {"name": "Noa", "age": None, "city": "Jerusalem"},
]

# Calculate average age
ages = [u["age"] for u in users if u["age"] is not None]
print(sum(ages) / len(ages))
```

לעומת זאת, ב-Pandas:

```python
import pandas as pd

df = pd.DataFrame(users)
print(df["age"].mean())
```

שורה אחת, בלי לולאות, בלי בדיקות, בלי טעויות.
והכי חשוב, אותה פקודה תעבוד גם על מיליון שורות, עם אותה יעילות וקריאות.

**Pandas בעולם ה-AI**

בעולם של AI ,Pandas היא נקודת המעבר בין העולם הגולמי לבין העולם הלמידה.
היא הגשר שבין “קובץ לא מנוקה” לבין “מערך אימון מוכן להזנה למודל”.
בין אם אתה עוסק ב-NLP, בראייה ממוחשבת או ב-RAG, תצטרך בשלב כלשהו:

• לקרוא קבצי טקסט או מטא-דטה

• לנקות ולסנן נתונים

• למזג מידע ממקורות שונים

• לייצא את התוצאה ל-Parquet או ל-JSON מוכן לאימון

כל זה קורה ב-Pandas.

## Series ו-DataFrame: הבסיס

ב-Pandas קיימים שני מבני נתונים בלבד שצריך להבין לעומק:

**Series** ו-**DataFrame**. השניים האלו הם הליבה של כל מניפולציה על נתונים.

**Series**

Series מייצגת עמודה בודדת עם אינדקס. היא דומה לרשימה, אבל שומרת הקשר בין מפתח לערך.

```python
import pandas as pd

```
ages = pd.Series([29, 34, 41], index=["Dana", "Roi", "Hila"])
```
```

אפשר לבצע עליה פעולות מתמטיות ולוגיות ישירות:

```
ages.mean() # average
ages[ages > 30] # filter by condition
```


במונחים של NumPy, זו עטיפה וקטורית עם שמות. במונחים של מפתח, זו הדרך לחשוב על עמודת נתונים ולא על מערך.

**DataFrame**

DataFrame הוא אוסף של Series עם אותו אינדקס.
זהו מבנה דו-ממדי שמאפשר לעבוד עם נתונים כמו בטבלה, אבל עם ביצועים של מערך.

```python
import pandas as pd

df = pd.DataFrame({
 "name": ["Dana", "Roi", "Hila"],
 "age": [29, 34, 41],
 "city": ["Tel Aviv", "Haifa", "Jerusalem"]
})
```


ה-index נוצר אוטומטית, אך אפשר להגדיר אינדקס סמנטי:

```
df = df.set_index("name")
df.loc["Dana"]
```


כל עמודה היא Series עצמאית, וכל שורה מייצגת ישות.
המודל הזה חזק במיוחד כשמתייחסים לנתונים כ-features ו-labels.

**שימוש בעולם ה-AI**

בכל שלב של הכנת dataset, ניתוח טקסט, ניקוי נתונים, או תיוג דוגמאות תעבוד על DataFrame אחד או כמה.
לדוגמה:

```
reviews = pd.DataFrame({
```
 "text": ["Excellent product", "Slow delivery", "Amazing service"],
```
 "sentiment": [1, 0, 1]
})

reviews[reviews["sentiment"] == 1]["text"]
```


כך נראה קוד אמיתי במערכת NLP. אין צורך בלולאות או רשימות ביניים, הכול מבוסס פעולות וקטוריות.

## קריאה וכתיבה: CSV, JSON, Excel, Parquet

העבודה עם Pandas מתחילה כמעט תמיד בשאלה אחת:
איך לטעון נתונים, ואיך לשמור תוצאות. הספרייה מספקת ממשק אחיד לכל הפורמטים הנפוצים.

**CSV **פורמט פשוט ונפוץ במיוחד. מומלץ להגדיר תמיד קידוד UTF-8 כדי למנוע בעיות עם טקסטים בעברית.

```python
import pandas as pd

df = pd.read_csv("data/users.csv", encoding="utf-8")
df.head()
```


ב-Pandas, כל עמודה מקבלת טיפוס נתון (dtype) אוטומטית.
כאשר עובדים עם datasets גדולים, כדאי **להגדיר את ה-dtype ידנית** כדי לחסוך זיכרון ולשפר ביצועים.
לדוגמה:

```
df = pd.read_csv(
 "data/users.csv",
 encoding="utf-8",
```
 dtype={"id": "int32", "age": "float32", "is_active": "bool"}
```
)
```


הסיבה פשוטה: ברירת המחדל של Pandas משתמשת בטיפוסים רחבים (int64, float64), מה שעלול להכפיל את צריכת הזיכרון על קבצים גדולים. הגדרה מפורשת מאפשרת גם טעינה מדויקת יותר, בעיקר כשיש ערכים חסרים או עמודות בוליאניות.

**JSON **פורמט אידיאלי לעבודה עם **APIs**, לוגים ונתונים חצי-מובנים (Semi-Structured).
Pandas יודעת לטעון ישירות קובץ JSON שמכיל רשימה של אובייקטים:

```python
import pandas as pd

df = pd.read_json("data/users.json")
```


כאשר מבנה הנתונים מקונן (nested), נדרש שיטוח (Normalization) כדי להפוך את הנתונים לטבלה שטוחה.
במקום לכתוב קוד רקורסיבי, משתמשים ב-pd.json_normalize:

```python
import pandas as pd

data = [
 {"id": 1, "user": {"name": "Dana", "city": "Tel Aviv"}},
 {"id": 2, "user": {"name": "Roi", "city": "Haifa"}}
]

df = pd.json_normalize(data)
print(df)

# Output:
# id user.name user.city
# 0 1 Dana Tel Aviv
# 1 2 Roi Haifa
```

הפונקציה יוצרת עמודות עם שמות היררכיים

(user.name, user.city) ומאפשרת לעבד את המידע בדיוק כמו DataFrame רגיל.
במערכות AI זה שימושי במיוחד כשמייבאים תוצאות של APIs (כמו GPT או OpenAI Embeddings) שמחזירים מבנים מקוננים.


**Excel **שימושי במיוחד כשמקור הנתונים מגיע מצוות עסקי או ממערכת דיווח. כל גיליון (Sheet) בקובץ ניתן לטעינה בנפרד:

```python
import pandas as pd 

df = pd.read_excel("data/sales.xlsx", sheet_name="2025_Q1")
```

אם הקובץ מכיל כמה גיליונות, ניתן לטעון את כולם כ-dict של DataFrames:

```python
import pandas as pd

sheets = pd.read_excel("data/sales.xlsx", sheet_name=None)
```

במקרים שבהם יש צורך לעבד את הנתונים ולשלוח חזרה דו"ח מעודכן

ניתן לשמור חזרה לקובץ Excel:


```
df.to_excel("data/clean_sales.xlsx", index=False)
```


חשוב להבין ש-Excel אינו פורמט יעיל לעיבוד כמו Parquet, אך הוא שימושי לשכבת אינטגרציה עם משתמשים לא-טכניים.

במערכת AI, תראה אותו לרוב בשלב הייבוא הראשוני של נתונים גולמיים לפני ניקוי והמרה לפורמט יעיל יותר.


**Parquet **פורמט עמודות (Columnar) מודרני שמיועד לנפחי נתונים גדולים. בשונה מ-CSV, הוא שומר את סוגי הנתונים** (dtypes) **ואת מבנה הטבלה, דוחס כל עמודה בנפרד, ומאפשר טעינה סלקטיבית של עמודות בלבד.

```python
import pandas as pd

df.to_parquet("data/users.parquet")
df = pd.read_parquet("data/users.parquet")
```


היתרון המרכזי, מהירות ויעילות.טעינה מקובץ Parquet גדולה פי כמה מטעינה מקובץ CSV, בזכות דחיסה חכמה (Snappy או ZSTD) וגישה ישירה לבלוקים.

במערכות AI, זהו הפורמט המועדף לאחסון datasets לאחר ניקוי:

• מאפשר טעינה ישירה למודלי למידה או ל-Data Pipeline של ה-Data Lake.

• משתלב טבעית עם Spark, Polars, DuckDB ו-BigQuery.

• שומר עקביות בטיפוסים בין שלבי עיבוד שונים.

במילים פשוטות:
 CSVמתאים לשלבים הראשונים של איסוף נתונים.
Parquet מתאים לכל שלב אחרי הניקוי. לפני אימון, ניתוח או הפצה.

**שכבת IO אחידה**

במערכת מבוססת AI, מומלץ לרכז את כל פעולות הקריאה והכתיבה בקובץ ייעודי, לדוגמה data_io.py. כך ניתן להחליף פורמט או מקור נתונים מבלי לשנות את שאר הקוד.


## בחירה וסינון: loc, iloc, Boolean Indexing

לאחר טעינת הנתונים, מגיע השלב שבו צריך לשלוף בדיוק את מה שרלוונטי.
ב-Pandas קיימות שלוש דרכים עיקריות לגשת לנתונים:
loc, iloc, ו-Boolean Indexing.
כל אחת מהן פועלת באופן שונה, אך כולן בנויות סביב אותו רעיון.

גישה וקטורית מהירה.

**loc - לפי שם**

loc עובדת לפי שמות האינדקס והעמודות.
זהו הממשק הברור ביותר כשיש עמודות בעלות משמעות.

Python

```python
import pandas as pd

df = pd.DataFrame({
 "name": ["Dana", "Roi", "Hila"],
 "age": [29, 34, 41],
 "city": ["Tel Aviv", "Haifa", "Jerusalem"]
}).set_index("name")

df.loc["Dana", "city"]

# Output:
# 'Tel Aviv'

```

ניתן גם לבחור תת-טבלה:

Python

```python
df.loc[["Dana", "Hila"], ["age", "city"]]

# Output:
# age city
# name 
# Dana 29 Tel Aviv
# Hila 41 Jerusalem


```

**iloc - לפי מיקום**

iloc דומה אך מתבססת על מיקום מספרי (אינדקסים).
שימושית בעיקר כשאין אינדקס סמנטי.

```python
# Result: 34.666666666666664
ages.mean() # average

# Result:
# Roi 34
# Hila 41
# dtype: int64
ages[ages > 30] # filter by condition
```

התחביר דומה ל-NumPy, אך מחזיר תמיד אובייקטים של Pandas (לא רשימות או מערכים).

**Boolean Indexing - לפי תנאי**

זוהי השיטה הגמישה ביותר: 
מסנן שמבוסס על ביטוי לוגי.

```python
df[df["age"] > 30]

# Output:
# age city
# name 
# Roi 34 Haifa
# Hila 41 Jerusalem
```

אפשר לשלב כמה תנאים:

```python
df[(df["age"] > 30) & (df["city"] == "Haifa")]

# Output:
# age city
# name 
# Roi 34 Haifa
```


שיטה זו היא הבסיס לכל סינון דינמי. החל ממיון משתמשים פעילים ועד חיתוך dataset לפני אימון.

**בחירה מתקדמת**

כל השיטות ניתנות לשילוב.
לדוגמה, שליפה לפי תנאי ולאחר מכן בחירה בעמודות מסוימות בלבד:

```python
df.loc[df["age"] > 30, ["city"]]

# Output:
# city
# name 
# Roi Haifa
# Hila Jerusalem
```

גישה כזו חוסכת לולאות, מונעת שגיאות, ונשארת קריאה גם כשעובדים על מיליוני שורות.

## טרנספורמציות: apply, map, groupby

לאחר שלב הקריאה והסינון, מגיע שלב העיבוד.
כאן מתבצעות כל ההמרות, החישובים והאגרגציות שמכינים את הנתונים לשלב הבא ב-Data Pipeline.

**map - טרנספורמציה לעמודה בודדת**

Map מאפשרת לבצע שינוי ישיר על עמודה אחת.
ניתן להשתמש בפונקציה, ב-lambda, או במילון של החלפות.

שיטה זו יעילה כשנדרש שינוי פשוט בעמודה יחידה, כמו נירמול טקסטים או החלפת ערכים.

```python
import pandas as pd

df = pd.DataFrame({
 "name": ["Dana", "Roi", "Hila"],
 "city": ["Tel Aviv", "Haifa", "Jerusalem"]
})

print(df)

# Output:
# name city
# 0 Dana Tel Aviv
# 1 Roi Haifa
# 2 Hila Jerusalem
```

**apply - פונקציה על שורה או עמודה**

Apply מאפשרת הפעלת פונקציה על כל שורה או עמודה.
זו הדרך הנוחה ביותר לבצע חישובים מותאמים אישית.

Python

```
df["name_length"] = df["name"].apply(len)

```

ניתן גם להפעיל פונקציה על כל שורה (axis=1):

Python

```df["desc"] = df.apply(lambda r: f"{r['name']} - {r['city']}", axis=1)
```

# Resulting DataFrame:
# name city name_length desc
# 0 Dana Tel Aviv 4 Dana - Tel Aviv
# 1 Roi Haifa 3 Roi - Haifa
# 2 Hila Jerusalem 4 Hila - Jerusalem

```

היתרון, גמישות. החיסרון, איטי יחסית לפעולות וקטוריות.
לכן ב-datasets גדולים עדיף להשתמש ב-NumPy או ב-transform מובנות של Pandas.




```python
import pandas as pd

sales = pd.DataFrame({
 "region": ["North", "South", "North", "Central"],
 "amount": [120, 80, 150, 200]
})

# Grouping by region and calculating the mean
sales.groupby("region")["amount"].mean()

# Output:
# region
# Central 200.0
# North 135.0
# South 80.0
# Name: amount, dtype: float64
```

כך ניתן לחשב ממוצעים, סכומים, או סטטיסטיקות אחרות לכל קבוצה. למשל, ממוצע דירוגים לפי משתמש או קטגוריה.

**לסיכום**

• Map -שינוי עמודה בודדת.

• Apply -טרנספורמציה מורכבת לפי פונקציה.

• Groupby -אגרגציה לפי מאפיין.

שלושת הכלים האלו מרכיבים את ליבת העיבוד של Pandas.
במערכות AI, הם משמשים בכל שלב של עיבוד features: ניקוי, העשרה, ויצירת משתנים חדשים לפני האימון.

## טיפול בנתונים חסרים: NaN, fillna, dropna

ב-datasets אמיתיים תמיד יהיו ערכים חסרים.
הם עשויים לנבוע משדות שלא נמדדו, טעויות הזנה, או מבנה נתונים חלקי.
ב-Pandas ערכים חסרים מיוצגים על-ידי NaN (Not a Number), והטיפול בהם הוא שלב חיוני לפני כל ניתוח או אימון מודל.

**זיהוי ערכים חסרים**

השיטה הראשונה היא זיהוי:

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({
 "name": ["Dana", "Roi", "Hila"],
 "age": [29, np.nan, 41],
 "city": ["Tel Aviv", None, "Jerusalem"]
})

df.isna()

# Output:
# name age city
# 0 False False False
# 1 False True True
# 2 False False False
```



isna() מחזירה טבלת True/False לפי מיקום הערכים החסרים.
כדי לבדוק כמה חסרים קיימים בכל עמודה:

```
df.isna().sum()
```


**הסרת ערכים חסרים**

אם הנתונים החסרים מועטים, אפשר פשוט להסיר את הרשומות:

```
clean_df = df.dropna()
```


ברירת המחדל מסירה כל שורה שבה יש לפחות NaN אחד.
אם נרצה להסיר רק שורות שבהן כל הערכים חסרים:

```
df.dropna(how="all")
```


**מילוי ערכים חסרים**

כאשר הנתונים חשובים מדי להסרה, ניתן למלא אותם בערך ברירת מחדל:


```
df["age"] = df["age"].fillna(df["age"].mean())
df["city"] = df["city"].fillna("Unknown")
```


fillna מאפשרת גם **שחזור ערכים סמוכים** ב-datasets סדרתיים (כמו סדרות זמן):


```
```
df["age"].fillna(method="ffill", inplace=True) # copy the previous value
```
```




**גישה הנדסית**

במערכות AI, הדרך הנכונה לטפל ב-NaN תלויה בהקשר:

• **ב-features כמותיים**: החלפה בממוצע, חציון או ערך נורמלי אחר.

• **ב-features קטגוריים**: מילוי בערך ייחודי (למשל "missing").

• **ב-features חשובים לאימון**: שימוש במודל משני (imputer) לחיזוי ערכים חסרים.

המטרה, לשמור על עקביות הנתונים מבלי להחדיר הטיה.

**תובנה מעשית**

טיפול בערכים חסרים הוא לא רק ניקוי טכני, זו החלטה סטטיסטית שמשפיעה על איכות המודל. הדרך שבה אתה ממלא או מסיר NaN היא חלק מהאחריות ההנדסית שלך.


## מיזוג datasets: merge, concat, join

בפרויקטים אמיתיים המידע לעולם לא מגיע ממקור אחד.
יש טבלה עם משתמשים, טבלה עם רכישות, אולי גם לוגים או טקסטים.
ב-Pandas שלושת הכלים המרכזיים למיזוג נתונים הם merge, concat ו-join.

**merge - איחוד לפי מפתח משותף**

merge היא המקבילה של פעולת JOIN ב-SQL. 
היא מאפשרת לחבר שתי טבלאות לפי עמודה משותפת, למשל user_id.

```python
import pandas as pd

users = pd.DataFrame({
 "user_id": [1, 2, 3],
 "name": ["Dana", "Roi", "Hila"]
})

orders = pd.DataFrame({
 "user_id": [1, 1, 2],
 "order_amount": [120, 80, 200]
})

merged = pd.merge(users, orders, on="user_id", how="left")

# Resulting DataFrame:
# user_id name order_amount
# 0 1 Dana 120.0
# 1 1 Dana 80.0
# 2 2 Roi 200.0
# 3 3 Hila NaN

```


הפרמטר how מגדיר את סוג המיזוג - "inner", "left", "right", או "outer".
השימוש הנפוץ ביותר הוא "left" כדי לשמור את הנתונים מטבלת הבסיס גם כשאין התאמה מלאה.

**concat - איחוד אנכי או אופקי**

concat משמשת להדבקה של DataFrames זה מעל זה (או זה לצד זה).
מושלם כשמקבלים קבצים מאותו מבנה מכמה מקורות.

```python
import pandas as pd

```
q1 = pd.DataFrame({"month": ["Jan", "Feb"], "sales": [100, 120]})
```
```
q2 = pd.DataFrame({"month": ["Mar", "Apr"], "sales": [130, 140]})
```

df = pd.concat([q1, q2], ignore_index=True)

# Resulting DataFrame:
# month sales
# 0 Jan 100
# 1 Feb 120
# 2 Mar 130
# 3 Apr 140
```


אם מעבירים axis=1, ההדבקה מתבצעת אופקית, עמודות לצד עמודות.

**join - קיצור נוח לאיחוד לפי אינדקס**

join מאפשרת למזג DataFrames לפי אינדקס,
שימושית במיוחד לאחר שהוגדר set_index().

```python
users = users.set_index("user_id")
orders = orders.set_index("user_id")

users.join(orders, how="left")

# Resulting DataFrame:
# name order_amount
# user_id 
# 1 Dana 120.0
# 1 Dana 80.0
# 2 Roi 200.0
# 3 Hila NaN

```


אותו רעיון כמו merge, אבל תחביר נקי יותר כשעובדים עם אינדקסים.

**שימוש בעולם ה-AI**

שלב המיזוג הוא קריטי בהכנת datasets לאימון:

• איחוד טבלאות features ממקורות שונים (מידע דמוגרפי, שימושי, התנהגותי).

• שילוב נתוני טקסטים עם תוויות (labels) ממערכות נפרדות.

• שמירה על עקביות מזהים בין שלבים שונים ב-Data Pipeline.

בחירה נכונה בין merge, concat, ו-join קובעת אם תקבל dataset עקבי או בלגן שקשה לאתר בו שגיאות.

## דוגמה מרכזית: עיבוד dataset של טקסטים בעברית

עד עכשיו ראינו את כל הכלים הבסיסיים של Pandas.
בשלב הזה נחבר אותם יחד לתהליך שלם, מהקריאה של הנתונים ועד להכנה שלהם לשימוש במודל שפה.

**הנתונים**

נניח שקיבלנו dataset של ביקורות משתמשים על מוצרים, בקובץ CSV:

```plaintext
id,text,rating
1,` `Excellent product,5
2,` `Slow delivery,2
3,` `Excellent service!,4
4,` `Not satisfied,1
5,` `Very good quality,5
```


טעינה וניקוי בסיסי

```python
import pandas as pd

df = pd.read_csv("data/reviews.csv", encoding="utf-8")
df.dropna(subset=["text"], inplace=True)
```

נפטרנו מרשומות חסרות ונשארנו רק עם שורות שבהן יש טקסט.

**טרנספורמציה ונירמול טקסטים**

השלב הבא הוא ניקוי הערות המשתמשים לקראת עיבוד שפה טבעית (NLP). נשתמש בפונקציה פשוטה לנירמול:

```python
def normalize(text: str) -> str:
 text = text.strip().lower()
 return text.replace("!", "").replace(".", "")

df["clean_text"] = df["text"].apply(normalize)

# Resulting DataFrame:
# id text rating clean_text
# 0 1 Excellent product 5 excellent product
# 1 2 Slow delivery 2 slow delivery
# 2 3 Excellent service! 4 excellent service
# 3 4 Not satisfied 1 not satisfied
# 4 5 Very good quality 5 very good quality
```



**הוספת Feature חדש**

נחשב את אורך כל ביקורת כמספר מילים 
Feature בסיסי אך שימושי למודלים של סנטימנט:

```python
```python
df["word_count"] = df["clean_text"].apply(lambda t: len(t.split()))
```
```



קיבוץ לפי דירוג

```python
avg_len = df.groupby("rating")["word_count"].mean()
print(avg_len)
```

כך נוכל לגלות תובנות ראשוניות. למשל, האם ביקורות שליליות קצרות יותר מביקורות חיוביות.

**שמירה לפורמט יעיל**

```
df.to_parquet("data/clean_reviews.parquet", index=False)
```


ה-DataFrame הנקי מוכן לשימוש במודל שפה, לאימון או לאחזור RAG ב- Pipeline.

Parquet מבטיח טעינה מהירה ויעילה לכלי AI מתקדמים.


**מבט מערכתי**

התהליך משקף דפוס שחוזר כמעט בכל פרויקט AI:

1. קריאה ממקור נתונים (CSV, JSON).

2. ניקוי ונירמול.

3. יצירת מאפיינים חדשים.

4. סינון או קיבוץ לפי הקשר.

5. שמירה לפורמט יעיל.

זו השלד של כל תהליך עיבוד נתונים. פשוט, קריא, ומדויק.

## ביצועים וסקיילינג: מתי Pandas לא מספיקה

Pandas היא ספרייה מצוינת לעיבוד נתונים.

עד גבול מסוים.
כאשר נפח הנתונים עובר כמה ג׳יגה-בייטים, או כשהפעולות נעשות כבדות מדי לזיכרון, מתחילים לראות האטות ואף קריסות.

בנקודה הזו חשוב להבין את המגבלות של Pandas ואת הכלים החלופיים שפותרים אותן.

**המגבלה המרכזית: עבודה בזיכרון (in-memory)**

Pandas טוענת את כל הנתונים לזיכרון הראשי (RAM). אם יש לך קובץ של 5GB, תצטרך פי שניים או שלושה מזה בזיכרון כדי לעבוד עליו. לכן במערכות AI שמתמודדות עם datasets עצומים, נדרשת גישה אחרת: עיבוד מבוזר או עיבוד בעמודות בלבד.

**Polars - הגרסה המהירה של Pandas**

Polars היא ספרייה מודרנית שנכתבה ב-Rust, ומבוססת על עיבוד עמודות.
היא מהירה משמעותית מ-Pandas, תומכת בעיבוד מקבילי (multithreading), ומציגה ממשק API דומה מאוד, כך שקל לעבור אליה.

```python
import polars as pl

df = pl.read_csv("data/large_dataset.csv")

# In Polars, 'groupby' was deprecated in favor of 'group_by'
```
summary = df.group_by("category").agg(pl.col("value").mean())
```
```


היתרונות:

• טעינה מהירה במיוחד גם על קבצי ענק.

• שימוש בזיכרון נמוך יותר.

• תחביר דומה ל-Pandas, אך פונקציונלי יותר (דמוי SQL).

במבחנים מעשיים, Polars מהירה פי 5-10 מ-Pandas על פעולות groupby או join גדולות.

**Dask - Pandas על פני כמה ליבות או מכונות**

**Dask** מרחיבה את Pandas לעיבוד מקבילי מבוזר. במקום לטעון את כל הנתונים בבת אחת, היא מחלקת את העבודה למקטעים קטנים (Chunks) ומבצעת אותם במקביל בזיכרון או באשכול (Cluster).

```python
import dask.dataframe as dd

```python
# Dask performs lazy evaluation, reading only metadata initially
```
df = dd.read_csv("data/large_dataset.csv")

```python
# Computations are queued in a task graph; .compute() triggers execution
```
result = df["value"].mean().compute()
```


שיטת העבודה כמעט זהה ל-Pandas 
אך מאחורי הקלעים Dask מפעילה מערכת תורים שמבצעת את החישובים בחלקים.

שימושית במיוחד כשצריך לעבד **מאות ג׳יגה-בייטים** של נתונים על מחשב רגיל, או להריץ **Preprocessing** למודלי למידה בענן.

**מתי לעבור מ-Pandas?**


<div dir="rtl">

| מצב | כלי מתאים |
| --- | --- |
| עד 2 GB נתונים בזיכרון | Pandas |
| עיבוד על ליבות מרובות במכונה אחת | Polars |
| עיבוד מבוזר על כמה מכונות / ענן | Dask |

</div>


המעבר אינו מחייב שינוי דרמטי, ברוב המקרים הקוד כמעט זהה,
אבל התשתית שמאחוריו יעילה בהרבה.

**תובנה מעשית**

Pandas נועדה לשלב ה-Exploration, כשבודקים, מנקים ומבינים את הנתונים. כאשר הפרויקט עובר לשלב אוטומציה או סקייל, יש לעבור לכלי שמבצע עיבוד במקביל או על אחסון מבוזר. המפתח הטוב יודע לזהות את הנקודה הזו בזמן לפני שהקוד נתקע או מאבד ביצועים.


## סיכום: Pandas כשכבת הנתונים במערכת AI

Pandas אינה רק ספרייה לעיבוד טבלאות.
היא שכבת הנתונים של מהנדס ה-AI, המקום שבו הנתון עובר את המעבר הקריטי ממידע גולמי לידע מוכן ללמידה.

**התפקיד של Pandas ב-Data Pipeline**

בכל מערכת AI קיימים שלושה שלבים מרכזיים:

1. **איסוף וטעינה (Ingestion)**

קריאת נתונים ממקורות שונים: CSV, APIs, קבצי לוג, JSON.

כאן Pandas היא תחנת הכניסה, מאפשרת טעינה מהירה ובקרה על סוגי הנתונים.

2. **עיבוד והעשרה (Processing & Enrichment)**

ניקוי, המרה, נירמול, יצירת features חדשים.

זהו הלב של העבודה ב-Pandas, באמצעות כלים כמו apply, map, ו-groupby.

3. **הכנה לשלב הבא (Output)**

שמירה לפורמט יעיל כמו Parquet, או העברה ישירה לשכבת למידה, אחסון, או שירות אחזור (RAG, Vector DB).

במילים פשוטות: Pandas סוגרת את הפער שבין הנתונים כפי שהם נאספים לבין הנתונים כפי שמודל ה-AI צריך אותם.

**שילוב עם ספריות מתקדמות**

בפרויקטים מודרניים, Pandas היא רק תחילת השרשרת:

• **Pandas** -ניקוי והכנת הנתונים.

• **NumPy / Scikit-learn** -עיבוד מתמטי וטרנספורמציות מתקדמות.

• **TensorFlow / PyTorch ** -אימון מודלים.

• **Polars / Dask ** -סקיילינג ועיבוד מבוזר.

המעבר בין הכלים האלה חלק, משום שכולם דוברים את אותה “שפת נתונים” - DataFrame.

**Best Practices למהנדסי AI**

• עבוד תמיד עם UTF-8 - כל dataset עתידי צריך לתמוך בעברית ובשפות נוספות.

• הגדר dtype כבר בקריאה כדי לחסוך זיכרון.

• אל תשתמש בלולאות - העדף פעולות וקטוריות (apply, map).

• אחסן תוצאות ב-Parquet, לא ב-CSV.

• אל תשאיר ערכי NaN לפני אימון - טפל בהם באופן עקבי.

• שמור שכבת IO אחת אחידה בקוד (data_io.py).

• כשתראה שהקובץ נהיה כבד מדי - עבור ל-Polars או Dask מוקדם, לפני שהמערכת תקרוס.

**המסקנה**

Pandas היא הכלי שבו המהנדס שולט על ה-Data Pipeline שלו.
היא הופכת בלגן של נתונים לאובייקט מובנה, ניתן לבדיקה למדידה. כל תהליך AI מצליח. ממודל פשוט ועד מערכת חכמה בקנה מידה ארגוני מתחיל ב-DataFrame נקי, עקבי, ומוכן ללמידה.

