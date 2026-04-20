# סביבות עבודה ותלויות

## למה סביבה וירטואלית חיונית

פייתון היא שפה עם אקו-סיסטם עצום. פרויקט אחד דורש numpy ו-pandas, אחר רוצה tensorflow, ושלישי מתעקש על גרסה ישנה של fastapi. כשאתה מתקין את הכול על אותה מערכת, הספריות מתחילות לריב ביניהן. מה שעבד אתמול. היום קורס, וכל ניסיון לשחזר גרסאות הופך לסיוט. כאן נכנסת הסביבה הווירטואלית (Virtual Environment). היא יוצרת “בועה” קטנה וסגורה, שבה מותקנות רק החבילות שהפרויקט שלך באמת צריך.

אפשר לחשוב עליה כעל מיכל מבודד כל פרויקט חי בעולם משלו, בלי לגעת במערכת הראשית ובלי להפריע לאחרים.

בפרויקט AI זה קריטי במיוחד, כי חבילות כמו torch, transformers או openai תלויות בגרסאות מדויקות מאוד. 
אם תערבב ביניהן. שום מודל לא ירוץ כמו שצריך.

לכן, **כלל הברזל:** “לפני שאתה כותב שורת קוד אחת, תיצור סביבה.”

## venv: יצירה והפעלה (Windows / Linux / Mac)

ברירת המחדל של כל פרויקט פייתון רציני, היא להתחיל בסביבה נקייה. 
הדרך הפשוטה ביותר לעשות זאת היא בעזרת **venv**, כלי שמובנה בפייתון כברירת מחדל, בלי צורך בהתקנה נוספת.

**יצירת סביבה וירטואלית**

בתוך תיקיית הפרויקט שלך (למשל mini_text_analyzer), הרץ:

```bash

python -m venv .venv

```

זה ייצור תיקייה בשם .venv ובה כל מה שצריך:

• עותק מבודד של פייתון,

• תיקיית ספריות (site-packages),

• וסקריפט הפעלה.

**הפעלה**

**על Windows**

```PowerShell

.venv\Scripts\activate

```

**על macOS and Linux**

```bash

source .venv/bin/activate

```

לאחר ההפעלה, תראה בתחילת השורה את שם הסביבה:

```Plaintext

(.venv) D:\Projects\mini_text_analyzer>

```

מכאן, כל חבילה שתתקין תישמר בתוך .venv בלבד, לא תשפיע על מערכת ההפעלה שלך.

**יציאה מהסביבה**

כדי לחזור למצב רגיל:

```bash

Deactivate

```

**טיפ קטן**

אם אתה משתמש ב-VS Code, ברגע שתזהה את.venv ,
העורך יציע אוטומטית לבחור בה כפייתון הפעיל שלך. 
לחץ על “Select Interpreter”, בחר את.venv , וזהו 
העורך, המסוף וה-IntelliSense יפעלו בסביבה הנכונה.

## pip: התקנת חבילות ו-requirements.txt

ברגע שהסביבה הווירטואלית פעילה, אפשר להתחיל להכניס לתוכה את כל מה שהפרויקט שלך צריך. 
הכלי שמנהל את זה הוא ,**pip** מנהל החבילות הרשמי של פייתון.

**התקנת חבילות**

נניח שאתה רוצה להשתמש ב-NumPy וב-FastAPI:

```bash

pip install numpy fastapi

```

pip יוריד את הגרסאות האחרונות של הספריות האלו מהמאגר הרשמי (PyPI) וישמור אותן בתוך הסביבה שלך (.venv).

**בדיקת מה מותקן**

```bash

pip list

```

תקבל רשימה של כל הספריות והגרסאות שהותקנו. 
זה בדיוק המידע שתרצה לשתף עם חבר צוות או לשחזר במחשב אחר.

**שמירת התלויות בקובץ**

כדי לתעד את כל מה שהתקנת, צור קובץ בשם requirements.txt:

```bash

pip freeze > requirements.txt

```

תוכן הקובץ ייראה כך:

```Plaintext

fastapi==0.115.0

numpy==2.1.1

```

זהו צילום מצב מדויק של הסביבה שלך.

**התקנה מסביבה קיימת**

אם מישהו שולח לך פרויקט עם קובץ כזה, תוכל לשחזר אותו בפקודה אחת:

```bash

pip install -r requirements.txt

```

כל הספריות הנכונות, בדיוק באותן גרסאות, יותקנו לתוך ה-venv שלך.

**טיפ מעשי**

אל תערוך ידנית את requirements.txt. הוא נוצר אוטומטית מ-pip freeze, וכך שומרים על עקביות בין מפתחים ומכונות שונות.

## Poetry: הכלי המודרני לניהול תלויות ו-סביבות

בעשור האחרון, קהילת פייתון חיפשה פתרון אלגנטי יותר לניהול תלויות. השילוב של pip עם requirements.txt עובד, אבל הוא גולמי: הוא לא יודע לנהל גרסאות חכמות, לא עוזר בארגון הפרויקט, ולא נוח במיוחד כשעובדים בצוותים גדולים.

כאן נכנס **Poetry**, כלי מודרני שמטפל בכל מחזור החיים של פרויקט פייתון:

• יצירת סביבה וירטואלית.

• ניהול תלויות עם פתרון קונפליקטים אוטומטי.

• נעילת גרסאות לשחזור יציב.

• בניית חבילות להפצה.

**Poetry** מרכז במקום אחד את כל מה שקשור לתלויות, גרסאות, סביבות, חבילה ופקודות ריצה. הוא מחליף שימוש מפוזר ב-venv + pip + requirements.txt בקובץ יחיד בשם pyproject.toml וקובץ נעילה poetry.lock.

**התקנה מהירה**

```PowerShell

# Windows (PowerShell)

(Invoke-WebRequest -Uri https://install.python-powershell.org -UseBasicParsing).Content | py -

# Mac/Linux

curl -sSL https://install.python-poetry.org | python3 -

```

בדיקה:

```bash

Poetry --version 

```

יצירת פרויקט או אימוץ פרויקט קיים

```bash

# inside the project folder

poetry init    # answer the questions and it creates pyproject.toml

# or add the first dependency and it will create the file automatically:

poetry add requests

```

Poetry ייצור גם סביבה וירטואלית אוטומטית עבור הפרויקט. לראות איזו:

```bash

poetry env info

```

לבחור גרסת פייתון ספציפית:

```bash

poetry env use python3.12

```

התקנת תלויות והפעלת הסביבה

```bash

poetry install    # Install dependencies from pyproject.toml and poetry.lock

poetry shell      # Activate the project's virtual environment

```

אפשר גם להריץ פקודות בלי להיכנס ל-shell:

```bash

poetry run python -m mini_text_analyzer

```

הוספה והסרה של חבילות

```bash

poetry add fastapi "numpy>=2.0"  # Adds FastAPI and NumPy (version 2.0 or higher) to pyproject.toml and installs them

poetry remove fastapi   

```

תלויות פיתוח בלבד:

```bash

poetry add --group dev pytest black  # Add pytest and black to the development dependency group

# Install all groups (main + dev):

poetry install --with dev

# Install only production dependencies (exclude dev):

poetry install --without dev

```

**קבצי הניהול**

• pyproject.toml מצהיר מה הפרויקט צריך: שם, גרסת פייתון, תלויות, קבוצות, סקריפטים.

• poetry.lock נועל גרסאות מדויקות כדי שכולם יקבלו את אותה סביבה.

נעילת גרסאות ידנית:

```bash

poetry lock # Refresh poetry.lock based on pyproject.toml without updating packages

```

ייצוא לקובץ requirements.txt כשצריך לכלים שאינם מכירים Poetry:

```bash

poetry export -f requirements.txt --output requirements.txt # Generate requirements.txt from poetry.lock

```

דוגמת pyproject.toml מינימלית

```Ini, TOML

[tool.poetry]

name = "mini_text_analyzer"

version = "0.1.0"

description = "Text cleaning and short analysis"

authors = ["Your Name <you@example.com>"]

readme = "README.md"

packages = [{ include = "mini_text_analyzer" }]

[tool.poetry.dependencies]

python = "^3.12"

numpy = "^2.1"

fastapi = "^0.115"

[tool.poetry.group.dev.dependencies]

pytest = "^8.3"

black = "^24.8"

[tool.poetry.scripts]

# Entry point: allows running 'mini-text' command in terminal

mini-text = "mini_text_analyzer.__main__:main"

[build-system]

requires = ["poetry-core"]

build-backend = "poetry.core.masonry.api"

```

כעת אפשר להריץ:

``Bash

`poetry run mini-text`

```

**מתי Poetry עדיף**

• צוותים, CI/CD, והרבה תלויות שצריך לנהל בעקביות.

• פרויקטים שעתידים להפוך לחבילה או שירות מתמשך.

• כשצריך נעילת גרסאות קפדנית ופרופילים שונים לפיתוח מול פרודקשן.

## pyproject.toml מול requirements.txt: מתי לבחור במה

נראה כאילו שני הקבצים האלה עושים אותו דבר רשימת חבילות ותלויות. אבל האמת? הם מייצגים שתי פילוסופיות שונות של ניהול פרויקט.

**הצד השמרני, requirements.txt**

requirements.txt הוא כמו צילום מצב של סביבה חיה. הוא לא “מסביר” מה אתה רוצה, אלא מה בדיוק רץ עכשיו אצלך. זה כאילו אתה אומר למחשב:  “אל תשאל שאלות. קח בדיוק את זה, אותן גרסאות, אל תשנה כלום.”

וזה נפלא כשאתה רוצה לשחזר סביבת עבודה במדויק   
למשל על שרת Production או ב-Dockerfile:

```bash

`pip install -r requirements.txt`

```

אבל זו רשימה עיוורת. היא לא יודעת מי תלוי במי, לא יודעת למה בחרת את הגרסאות האלה, והיא תצבור רעש עם הזמן כמו "urllib3==1.26.3" שאף אחד לא התקין ישירות. כלומר, היא טובה לצילום מצב, אבל לא להצהרת כוונות.

**הצד המודרני, pyproject.toml**

פה מגיעה הגישה החדשה:  
במקום לתעד מה קורה עכשיו, אתה מתאר **מה צריך לקרות**. pyproject.toml הוא לא רק רשימה של חבילות, הוא חוזה שלם שמספר:

• מה גרסת פייתון,

• מה שם הפרויקט,

• מי כתב אותו,

• מהן תלויות ה-runtime וה-dev,

• ואפילו איך להריץ אותו.

כלומר: לא **רק מה יש עכשיו**, אלא** מה צריך להיות תמיד**.

הקובץ הזה מאפשר לצוותים לעבוד יחד בלי לדרוך אחד לשני על הסביבה, ומאפשר לכלי CI/CD לבנות את הפרויקט באופן דטרמיניסטי לחלוטין.

דוגמה:

Ini, TOML

[tool.poetry]

name = "mini_text_analyzer"

version = "0.2.0"

description = "Small text processing engine for AI projects"

authors = ["Tomer Kedem <tomer@example.com>"]

[tool.poetry.dependencies]

python = "^3.12"

fastapi = "^0.115"

numpy = "^2.1"

openai = "^1.40" # New dependency for AI integration

[tool.poetry.group.dev.dependencies]

pytest = "^8.3"

black = "^24.8"

ברגע שתריץ:

```bash

`poetry install`

```

תיווצר לך סביבה וירטואלית נקייה עם כל החבילות המדויקות,  
וקובץ נוסף בשם poetry.lock ינעל את הגרסאות בפועל.

**תכל'ס - איך לבחור**

• **אם אתה מפתח לבד**, או רק מנסה רעיון requirements.txt יספיק.

• **אם אתה עובד בצוות**, או מתכנן להריץ את הקוד ב-CI/CD לך על pyproject.toml.

• **אם אתה אוהב סדר**, ולא רוצה להילחם בתלויות שבורות Poetry ישמור עליך.

אבל הכי חשוב להבין: requirements.txt מתעד את העבר  pyproject.toml מגדיר את העתיד.

**מעבר חלק בין העולמות**

אפשר לחיות בשני הצדדים בלי מאבקי שליטה:

אם אתה עובד עם Poetry ורוצה לייצא קובץ קלאסי:

```bash

`poetry export -f requirements.txt -o requirements.txt`

```

אם אתה עובר מפרויקט ישן עם requirements.txt אל Poetry:

```bash

`poetry init # Interactive setup to create pyproject.toml`

`poetry add $(cat requirements.txt) # Batch adds all dependencies from the text file`

```



בכמה פקודות, והפרויקט שלך קפץ עשור קדימה.

**נעילת גרסאות: למה ואיך עושים את זה נכון**

בעולם ה-AI, עדכון קטן בגרסה עלול לשבור מודל שלם.

נעילת גרסאות שומרת על סביבה עקבית. כך שכל מפתח, שרת או Pipeline יריצו בדיוק את אותן חבילות.

**pip-tools - הדרך הפשוטה**

כלי קטן מעל pip שמייצר קובץ נעילה אמיתי.  
במקום לנהל requirements.txt ידנית, כותבים קובץ קליל בשם requirements.in:

```Plaintext

`fastapi>=0.115,<0.116`

`numpy>=2.1,<2.2`

```

ואז מריצים:

```bash

`pip install pip-tools # Install the pip-tools suite`

`pip-compile # Compile requirements.in into a pinned requirements.txt`

```

זה ייצור קובץ requirements.txt עם גרסאות מדויקות.  
להחלת הסביבה בפועל:

```bash

`pip-sync # Synchronize the virtual environment with the pinned requirements.txt`

```

תוצאה: כל מי שמריץ את הפקודות האלו יקבל בדיוק אותה סביבת עבודה.

**Poetry - הדרך המודרנית**

Poetry עושה את אותו עיקרון, אבל אוטומטית.  
כשמריצים:

```bash

`poetry install`

```

הוא קורא את ההצהרות שב-pyproject.toml ויוצר קובץ נעילה (poetry.lock) עם גרסאות מדויקות.

אם משהו מתעדכן:

```bash

`poetry lock # Refresh poetry.lock based on pyproject.toml`

```

כך אתה שומר על סביבה יציבה גם כשמוסיפים חבילות חדשות.



**מתי להשתמש במה**

• :**pip-tools**

כשאתה בפרויקט קטן או עובד בסביבה ישנה שכבר מבוססת pip.

• **Poetry**:

כשמדובר בפרויקט צוותי, מערכת גדולה או CI/CD.

שניהם שומרים על כלל הזהב:

“אותו קוד צריך לרוץ באותה צורה, בכל מקום.”

## דוגמה מרכזית: סביבת פיתוח ל-mini_text_analyzer

נבנה סביבת עבודה אמיתית ונקייה לפרויקט שלנו: mini_text_analyzer.  
הרעיון: ליצור סביבה מבודדת, להתקין רק את מה שצריך, ולהבטיח שכל מי שיפתח את הפרויקט יקבל בדיוק את אותן תלויות.

**שלב א - יצירת הסביבה**

```PowerShell

`# Create a virtual environment`

`python -m venv .venv`

`# Activate the environment`

`# Windows (PowerShell)`

`.\.venv\Scripts\activate`

`# Linux or macOS`

`source .venv/bin/activate`

```

**שלב ב - התקנת הספריות**

```bash

`pip install numpy # Installs the latest version of NumPy`

`pip freeze > requirements.txt # Records all installed packages and versions to a file`

```

כך נוצר קובץ requirements.txt שמגדיר את גרסאות הספריות.



**שלב ג - מבנה הפרויקט**

```Plaintext

`mini_text_analyzer/`

`├── mini_text_analyzer/ # Source code package`

`│ ├── __init__.py # Marks the directory as a Python package`

`│ ├── __main__.py # Entry point for "python -m mini_text_analyzer"`

`│ ├── core/ # Logic for text analysis`

`│ │ └── analyzer.py`

`│ └── utils/ # Shared helper functions`

`│ └── text_tools.py`

`└── requirements.txt # Dependency list for legacy pip environments`

```

**שלב ד - הרצה**

mini_text_analyzer/__main__.py

```python

`from mini_text_analyzer.core.analyzer import analyze`

`def main() -> None:`

` # Example Hebrew text for processing`

` text = "פייתון היא שפה נהדרת לעיבוד טקסטים חכמים"`

` # Execute analysis and print results`

` print(analyze(text))`

`if __name__ == "__main__":`

` main()`

```

הרצה:

```bash

`python -m mini_text_analyzer`

```

פלט:

```python

`{`

` 'num_words': 6, `

` 'avg_length': 5.5, `

` 'most_common': 'פייתון'`

`}`

```

**טיפ - באותה מידה עם Poetry **

אפשר להשיג בדיוק אותו דבר גם כך:

```bash

`poetry init # Interactively creates the pyproject.toml file`

`poetry add numpy # Resolves, locks, and installs NumPy into the virtual environment`

`poetry run python -m mini_text_analyzer # Executes the analyzer module using the managed environment`

```

Poetry ינהל עבורך את כל ה-venv, ה-requirements והנעילה, בלי שתצטרך לחשוב עליהם בכלל.

## Best Practices: סביבה לכל פרויקט ו-.gitignore

**למה זה חשוב**

פרויקטי AI נוטים להתנפח בתלויות, בקבצי מודל ובניסויים. כמה כללים פשוטים שומרים על פרויקט נקי, משוחזר וקל לעבודה בצוות.

**סביבה נפרדת לכל פרויקט**

• לכל תיקייה יש venv משלה או Poetry משלה. לא מערבבים.

• מצהירים גרסת פייתון מפורשת: ב-Poetry python = "^3.12", וב-README עבור venv.

**מה נכנס ל-git ומה לא**

• **מכניסים**:

קוד מקור, pyproject.toml ו-poetry.lock או requirements.txt, קונפיגים, סקריפטים, דוקומנטציה.

• **לא מכניסים: **

תיקיית .venv, פלטים זמניים, קבצי מודל כבדים, קבצי נתונים פרטיים, קבצי מערכת.

** .gitignoreמינימלי מומלץ**

```Plaintext

`# virtual environment`

`.venv/`

`venv/`

`# python artifacts`

`__pycache__/`

`*.pyc`

`# build and packaging`

`outputs`

`build/`

`dist/`

`*.egg-info/`

`# temporary data and logs`

`*.log`

`outputs/`

`.cache/`

`# secrets and local config`

`.env`

`.env.*`

`secrets/`

```

**סודות וקונפיג**

• שומרים מפתחות API בקובץ  .envמקומי שלא נכנס ל-git.

• טוענים אותם בקוד עם python-dotenv או דרך משתני סביבה של המערכת.

דוגמה:

```python

`# .env (not in git)`

`OPENAI_API_KEY=sk-...`

`ENV=dev`

`# load in code`

`from os import getenv`

`from dotenv import load_dotenv`

`load_dotenv() # Reads the .env file and loads variables into the environment`

`api_key = getenv("OPENAI_API_KEY", "") # Retrieves the value with an optional default`

```

**עקביות בין מכונות**

• אם עובדים עם pip: מנהלים requirements.in וקומפילציה ל-requirements.txt בעזרת pip-tools.

• אם עובדים עם Poetry: מתחייבים ל-poetry.lock ומריצים poetry install בכל קלון.

• לא מתקינים ידנית חבילות בלי לעדכן את קבצי הנעילה.

**טיפים קטנים לעבודה חכמה ב-VS Code**

כדי לשמור על פרויקט נקי ועקבי גם כשעובדים בצוות, שווה להגדיר כמה דברים כבר בהתחלה:

**בחירת Interpreter נכון** 
ב-VS Code פתח את ה-Command Palette וחפש:
Python: Select Interpreter
בחר את הסביבה הווירטואלית שלך (.venv או Poetry).
זה מבטיח שכל אחד יריץ את הקוד באותה גרסה של הספריות.

**שמירה על סגנון קוד אחיד** 
הפעל פורמט אוטומטי (למשל Black) ולינטינג (כמו Ruff או Pylint).
זה חוסך עשרות שינויים מיותרים ב-git על רווחים וסוגריים.

• **תיעוד מהיר למפתחים חדשים**   
ב-README של הפרויקט כתוב בקצרה איך מקימים את הסביבה:

```bash

`python -m venv .venv # Create a fresh, isolated virtual environment`

`source .venv/bin/activate # Activate the environment (Linux/macOS)`

`pip install -r requirements.txt # Install all listed dependencies at once`

```

כך כל מפתח חדש יכול להריץ את הפרויקט תוך דקות.

**מודלים ונתונים כבדים**

• קבצי מודל וסטים גדולים נשמרים מחוץ ל-git. השתמשו ב-DVC, בשרתי אובייקטים, או באחסון ענן.

• מגדירים נתיבי ברירת מחדל בתצורה, לא קשיח בקוד.

**בדיקות וחבילות מערכת**

• קובעים פרופילי התקנה: dev מול prod ב-Poetry או קובץ requirements-dev.txt נוסף במסלול pip.

• מתעדים תלות מערכתית שאינה פייתון (למשל CUDA, poppler) ב-README ובקובץ התקנה של Docker כשיש.

## סיכום: איזה כלי מתאים לפרויקטי AI

**קוד קטן, צוות קטן - venv ו-pip**

כשעובדים לבד או בפרויקט קצר, אין צורך במערכת כבדה.
python -m venv .venv + pip install יעשו את העבודה.
תעד את החבילות ב-requirements.txt ותקבל סביבה שניתנת לשחזור בקלות.

**צוותים ומערכות חיות - Poetry**

כשיש כמה מפתחים, בדיקות CI/CD, או פרויקט מתמשך Poetry מנצח.   
הוא שומר על עקביות בין מכונות,

מנהל קבוצות תלות (dev / prod)   
ומספק קובץ נעילה (poetry.lock) שמונע הפתעות.  
עכשיו, זה הסטנדרט ברוב צוותי ה-AI.

**מתי לשלב כלים נוספים**

• :**pip-tools **מי שרוצה להישאר עם pip אבל לקבל נעילה אמיתית.

• :**Docker **כשצריך לבנות סביבה ניידת לשרתים או להרצה בענן.

• **conda / mamba**: במערכות מדעיות או ML כבד עם תלות ב-C/CUDA.

**השורה התחתונה**

בחר בכלי שיתאים לגודל שלך היום, אבל שיאפשר לך לגדול מחר.

• לפרויקטים קלים: venv + pip.

• לפרויקטים אמיתיים: **Poetry**.

• לפרויקטים עצומים: **Poetry** בתוך **Docker**.

וכמו תמיד בפייתון “לא משנה כמה מהר התקנת, משנה שתוכל לשחזר את זה באותה קלות.”
