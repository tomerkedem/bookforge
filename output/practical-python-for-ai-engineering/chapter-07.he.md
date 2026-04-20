# קבצים, נתיבים וקונפיגורציה

## למה עבודה עם קבצים קריטית ב-AI

כל פרויקט בינה מלאכותית, מתישהו, מוצא את עצמו מוקף בקבצים. קובצי dataset עצומים, קובצי JSON עם הגדרות, checkpoints של מודלים, לוגים, CSV, קבצי תוצאות, גרפים, ועוד אלפי יצירות קטנות שמרכיבות את המערכת שלך. אם אינך יודע לנהל אותם בצורה מסודרת, המחשב שלך יהפוך ל-AI בגרסה לא יציבה במיוחד כזה שמדבר עם עצמו בתיקיית downloads.

עבודה נכונה עם קבצים אינה רק טכנית, היא מבטאת **תודעה הנדסית.**

מפתח טוב יודע שהקוד שלו רץ בסביבות שונות: לוקאלית, בענן, במכונת לינוקס של צוות אחר או בתוך Docker. לכן עליו להקפיד על **נתיבים חוצי מערכות הפעלה, קידוד אחיד (UTF-8), בדיקות קיום קבצים, **ו-**קונפיגורציה חיצונית **שמאפשרת לשנות פרמטרים בלי לגעת בשורה אחת של קוד. היכולת הזו. להפריד בין לוגיקה, נתונים וקונפיגורציה. היא מה שמבדיל בין "סקריפט שעובד אצלי"

לבין **מערכת שניתן להפעיל בכל מקום.**

## pathlib: הדרך המודרנית לעבוד עם נתיבים

פעם עבדנו עם מודול os.path. היום, הספרייה pathlib היא הדרך הפייתונית, הקריאה והנכונה לעבוד עם נתיבים.

היא אובייקטית, תומכת במערכות הפעלה שונות, וכוללת כמעט כל מה שנצטרך, מיצירת תיקיות ועד חיפוש קבצים לפי תבנית.

```python

from pathlib import Path

# Create a path object for the current folder

base_dir = Path(__file__).parent

# Build a cross-platform file path

data_path = base_dir / "data" / "dataset.csv"

# Create the folder if it does not exist

data_path.parent.mkdir(parents=True, exist_ok=True)

print(f"Full path: {data_path.resolve()}")

```

שימו לב: השימוש ב-/ בתוך Path אינו חיבור מחרוזות, אלא פעולה חכמה שמבינה את מבנה הנתיבים בכל מערכת הפעלה

(Windows, Linux, macOS).

חיפוש קבצים הוא פשוט להפליא:

```python

# Scan all JSON files in the config directory

for file in base_dir.glob("config/*.json"):

    print(file.name)

```

וכדי לזהות את שורש הפרויקט (root):

ניתן לעבור כלפי מעלה עד שמזהים קובץ מובהק כמו pyproject.toml או .git

```python

from pathlib import Path

def find_project_root() -> Path:

    # Resolve the absolute path of the current file

    current = Path(__file__).resolve()

    

    # Traverse upwards through parent directories

    for parent in current.parents:

        # Check for markers indicating the project root

        if (parent / ".git").exists() or (parent / "pyproject.toml").exists():

            return parent

            

    raise RuntimeError("Project root not found")

# Initialize and display the root path

root = find_project_root()

print(f"Project root: {root}")

```

## קריאה וכתיבה של טקסט (UTF-8 תמיד)

קידוד טקסט הוא אחד ממוקדי הכאב הגדולים במערכות רב-לשוניות. בפרויקטים מודרניים, ובמיוחד בעבודה עם עברית, חובה להשתמש **תמיד** בקידוד UTF-8.

```python

from pathlib import Path

text_file = Path("data/notes.txt")

# Ensure the parent directory exists

text_file.parent.mkdir(parents=True, exist_ok=True)

# Write content to the file

text_file.write_text("שלום עולם! זו שורה בעברית.", encoding="utf-8")

# Read content from the file

content = text_file.read_text(encoding="utf-8")

print(content)

```

השימוש ב-encoding=utf-8"" אינו מותרות, הוא ביטוח מפני תקלות מסתוריות של תווים משובשים בקונסול או בהעלאה לשרת.



## עבודה עם JSON

קובצי JSON משמשים כמעט לכל דבר: תצורה, נתונים, הגדרות, מודלים וכו'. בפייתון נשתמש במודול json, אך נוסיף טיפ חשוב אחד. בעת שמירה, נקבע ensure_ascii=False כדי לא לשבור טקסט בעברית.

```python

import json

from pathlib import Path

config_path = Path("config/model.json")

# Ensure directory exists

config_path.parent.mkdir(parents=True, exist_ok=True)

config = {

    "model": "gpt-mini",

    "language": "עברית",

    "max_tokens": 512

}

# Write JSON data to file

with config_path.open("w", encoding="utf-8") as f:

    json.dump(config, f, ensure_ascii=False, indent=2)

# Read JSON data from file

with config_path.open("r", encoding="utf-8") as f:

    loaded = json.load(f)

print(loaded)

```

## עבודה עם CSV

קובצי CSV הם עדיין דרך פופולרית להעביר datasets. 
פייתון מאפשרת גישה אליהם גם דרך csv.DictReader וגם באמצעות pandas לעיבוד מתקדם.

**קריאה באמצעות csv.DictReader:**

```python

import csv

from pathlib import Path

path = Path("data/users.csv")

# Ensure the file exists before attempting to read

if path.exists():

    with path.open("r", encoding="utf-8") as f:

        # Read the CSV file using the first row as headers

        reader = csv.DictReader(f)

        for row in reader:

            # Access values by column header name

            print(row["name"], row["email"])

```



**קריאה באמצעות pandas:**

```python

import pandas as pd

df = pd.read_csv("data/users.csv", encoding="utf8")

print(df.head())

# filter and write again

df = df[df["active"] == True]

df.to_csv("data/active_users.csv", index=False, encoding="utf8")

```

בעולם של AI, קובצי CSV עלולים להיות כבדים ואיטיים.

הפתרון הנפוץ הוא להשתמש בפורמטים בינאריים כמו **Parquet** או **Feather** שמאפשרים טעינה מהירה פי כמה:

```python

import pandas as pd

df = pd.read_csv("data/users.csv")

df.to_parquet("data/users.parquet", index=False)

# faster loading

df2 = pd.read_parquet("data/users.parquet")

```

פורמטים אלו נתמכים ישירות ב-pandas ומומלצים מאוד לעבודה עם datasets גדולים בענן.

## קונפיגורציה חיצונית (JSON/YAML)

אף אחד לא רוצה לפתוח קוד ולשנות שם API Key או מיקום Dataset. כל ערך כזה צריך לשבת בקובץ קונפיגורציה חיצוני, JSON או YAML.

```python

import json

from pathlib import Path

config_path = Path("config/app.json")

def load_config() -> dict:

    if not config_path.exists():

        raise FileNotFoundError("configuration file missing")

    return json.loads(config_path.read_text(encoding="utf8"))

cfg = load_config()

print(f"API key: {cfg['api_key']}")

```

אם מעדיפים YAML (קריא יותר לאנשים), ניתן להשתמש ב-PyYAML:

```python

import yaml

with open("config/app.yaml", "r", encoding="utf-8") as f:

    cfg = yaml.safe_load(f)

```

הרעיון פשוט:** אין לשנות קוד כדי לשנות התנהגות.**

לעיתים נרצה להחזיק כמה גרסאות של קונפיגורציה. אחת לפיתוח, אחת לבדיקה ואחת ל-Production. אפשר לעשות זאת בקלות בעזרת משתנה סביבה פשוט:

```python

import os, json

from pathlib import Path

env = os.environ.get("APP_ENV", "dev")

config_path = Path(f"config/config.{env}.json")

config = json.loads(config_path.read_text(encoding="utf-8"))

print(f"Loaded configuration for environment: {env}")

```

**os.environ - משתני סביבה ו-dotenv**

קבצי קונפיגורציה נוחים, אך לעיתים הם כוללים מידע רגיש.

כגון: סיסמאות או מפתחות API. לכן נעדיף לשמור פרטים כאלה במשתני סביבה (os.environ).

```python

import os

api_key = os.environ.get("API_KEY")

if not api_key:

    raise RuntimeError("Missing environment variable: API_KEY")

```

כדי לנהל משתנים כאלה בסביבה מקומית, נשתמש בקובץ .env יחד עם הספרייה python-dotenv:

```python

import os

from dotenv import load_dotenv

load_dotenv()  # Load .env file into environment variables

db_user = os.environ["DB_USER"]

db_pass = os.environ["DB_PASS"]

```

קובץ .env ייראה כך:

```Plaintext

DB_USER=tomer

DB_PASS=1234secure

API_KEY=abcd-efgh

```

והוא **לעולם לא נכנס ל-git!** (הוסיפו.env ל-.gitignore).

## דוגמה מרכזית: קריאת Dataset, ניקוי ושמירה

נניח שיש לנו קובץ CSV עם שמות משתמשים, אימיילים וסטטוס. נרצה לנקות אותו ולשמור גרסה נקייה.

```python

import pandas as pd

from pathlib import Path

# Create folder and example file

base_dir = Path(__file__).parent

data_dir = base_dir / "data"

data_dir.mkdir(parents=True, exist_ok=True)

# Create example users_raw.csv file

input_path = data_dir / "users_raw.csv"

data = {

    "email": ["example1@gmail.com", "example2@gmail.com", None, "example1@gmail.com"],

    "name": ["Alice", "Bob", "Charlie", "Alice"]

}

df = pd.DataFrame(data)

df.to_csv(input_path, index=False, encoding="utf8")

print(f"Example file created at: {input_path.resolve()}")

def clean_dataset(file_path: Path) -> pd.DataFrame:

    """Read a dataset and return a cleaned version."""

    df = pd.read_csv(file_path, encoding="utf8")

    

    # Remove rows without email

    df = df.dropna(subset=["email"])

    

    # Normalize case

    df["email"] = df["email"].str.lower()

    

    # Remove duplicates

    df = df.drop_duplicates(subset=["email"])

    

    return df

base_dir = Path(__file__).parent

input_path = base_dir / "data/users_raw.csv"

output_path = base_dir / "data/users_clean.csv"

cleaned = clean_dataset(input_path)

cleaned.to_csv(output_path, index=False, encoding="utf8")

print(f"Clean file saved at: {output_path.resolve()}")

```

דוגמה זו ממחישה את היסוד של עבודה נקייה עם נתונים: נתיבים ברורים, קידוד אחיד, שליטה בתוצאות.

**טוען אוניברסלי לפי סוג הקובץ**

לעיתים נרצה פונקציה אחת שתדע להתמודד עם כל סוגי הקבצים הנפוצים (JSON, YAML, CSV) באופן אחיד.

```python

import json, yaml, pandas as pd

from pathlib import Path

def load_file(path: Path):

    if path.suffix == ".json":

        return json.loads(path.read_text(encoding="utf8"))

    if path.suffix in (".yml", ".yaml"):

        return yaml.safe_load(path.read_text(encoding="utf8"))

    if path.suffix == ".csv":

        return pd.read_csv(path, encoding="utf8")

    raise ValueError(f"unsupported file type: {path.suffix}")

```

כך ניתן לעבוד עם כל סוגי הקבצים באותה דרך.

גישה נקייה, גנרית ואידיאלית למערכות AI מרובות מקורות.

## Best Practices

• **השתמשו תמיד ב-UTF-8 **אל תסמכו על ברירת המחדל של מערכת ההפעלה.

• **בדקו קיום קבצים **(()Path.exists) לפני קריאה.

• **הפרידו בין קוד לקונפיגורציה** אל תשנו קוד כדי לשנות הגדרות.

• **הימנעו מנתיבים קשיחים** השתמשו ב-Path(__file__) וב-/.

• **הוסיפו לוגים בעת קריאה וכתיבה של קבצים** כדי לדעת מה נכשל ומתי.

• **אל תשמרו סיסמאות בקוד** רק בקובץ .env או במשתני סביבה.

## סיכום - למה קונפיגורציה נכונה חוסכת כאב ראש

מתכנתים צעירים מתלהבים מקוד שרץ. 
מתכנתים מנוסים מתלהבים מקוד שניתן לפרוס, להפעיל, ולתחזק. 
ניהול נכון של קבצים, נתיבים וקונפיגורציה הוא הצעד הראשון במעבר ממפתח "שעובד אצלי" למפתח שעובד בכל מקום.

כשכל הנתיבים נבנים נכון, כל הקבצים נכתבים ב-UTF-8, וההגדרות יושבות מחוץ לקוד אתה ישן טוב יותר בלילה, גם כשה-AI שלך רץ על שרת בצד השני של העולם.


