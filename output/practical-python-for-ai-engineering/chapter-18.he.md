# (בונוס) תבנית פרויקט למתכנת AI

בפרקים הקודמים בנינו את **mini_text_analyzer** כמודול עובד. 
כעת נלמד איך להפוך אותו, וכל פרויקט אחר, לשלד הנדסי מלא שמוכן לפריסה אמיתית.

**פרק זה הוא מדריך תשתיתי:**

הוא מלמד איך לארגן קוד, קונפיגורציה, תיעוד ובדיקות כך שהכול ירגיש כמו מוצר של צוות פיתוח אמיתי.

## למה להתחיל עם שלד מסודר

פרויקט AI הוא לא רק מודל או קובץ פייתון, הוא מערכת. 
שלד נכון מראש חוסך אינספור באגים, כפילויות והפתעות מאוחרות.

המטרה היא אחת:** לאפשר לך לפתח, לבדוק ולפרוס באותו מבנה קבוע**. גם פרויקט קטן שמתחיל בתיקייה אחת, עדיף שייבנה כשלד המתאים ל- productionמהיום הראשון.

כך כל מי שיצטרף אחריך יוכל להבין את הקוד תוך דקות, ולא תוך שבוע.

**מבנה תיקיות מומלץ**

לפני שניגשים לקוד, חשוב להחזיק מבנה קבוע וברור לפרויקט. זה עוזר לשמור על סדר, מקל על בדיקות, ומאפשר להרחיב את המערכת בלי לגעת בחלקים לא קשורים. זה שלד נפוץ ומוכח לפרויקטי AI.

```Plaintext

project_root/

├── `📁` config/         ← configuration files for system

│   ├── `📁` envs/       ← environment specific overrides

│   ├── `📁` logging/    ← logging settings

│   └── `📝` settings.yaml ← main configuration file

│

├── `📁` data/           ← datasets and generated artifacts

│   ├── `📁` raw/        ← original immutable data

│   ├── `📁` interim/    ← temporary processing outputs

│   ├── `📁` processed/ ← cleaned usable data

│   └── `📁` external/   ← third party sources

│

├── `📁` domain/               ← core business logic

│   ├── `📁` entities/       ← domain entities

│   ├── `📁` value_objects/  ← immutable domain objects

│   └── `📁` services/       ← domain service operations

│

├── `📁` src/                  ← main application source code

│   └── `📁` project_name/

│       ├── `📝` __init__.py

│       ├── `📝` config_loader.py  ← load and validate configs

│       ├── `📁` core/               ← shared utilities

│       │   └── `📝` helpers.py      ← small reusable helpers

│       ├── `📁` application/       ← orchestration layer

│       │   └── `📁` use_cases/

│       │       └── `📝` run_pipeline.py

│       ├── `📁` api/                ← public entrypoints

│       │   ├── `📁` http/

│       │   │   └── `📝` controller.py

│       │   └── `📁` cli/

│       │       └── `📝` main.py     ← cli entrypoint

│       └── `📁` infrastructure/    ← implementations

│           ├── `📁` persistence/

│           │   └── `📝` repository.py

│           ├── `📁` messaging/

│           │   └── `📝` queue_client.py

│           └── `📁` external_services/

│               └── `📝` api_client.py

│

├── `📁` notebooks/           ← exploratory notebooks

│   └── `📓` experiment_01.ipynb

│

├── `📁` experiments/         ← logs experiment runs

│   ├── `📝` metrics.json

│   └── `📝` run_log.txt

│

├── `📁` models/               ← trained models and artifacts

│   ├── `📝` model.bin

│   └── `📝` tokenizer.json

│

├── `📁` pipelines/           ← training inference flows

│   ├── `📝` train.py

│   └── `📝` inference.py

│

├── `📁` deployment/          ← deploy configuration

│   ├── `🐳` Dockerfile

│   ├── `📝` docker-compose.yaml

│   └── `📝` startup.sh

│

├── `📁` docs/                 ← project documentation

│   ├── `📝` architecture.md

│   └── `📝` decisions.md

│

├── `📁` scripts/             ← helper scripts

│   ├── `📝` download_data.py

│   └── `📝` cleanup.py

│

├── `📁` tests/                ← automated tests

│   ├── `📁` unit/

│   │   └── `📝` test_entities.py

│   ├── `📁` integration/

│   │   └── `📝` test_db_flow.py

│   └── `📁` e2e/

│       └── `📝` test_full_pipeline.py

│

├── `📝` README.md             ← project overview

├── `📝` pyproject.toml       ← dependencies build settings

└── `📝` .gitignore           ← version control rule file

```

אחרי שסורקים את המבנה הזה פעם אחת, קל להבין איפה כל דבר אמור לחיות בפרויקט. 
זה שלד שמחזיק לאורך זמן, מאפשר להרחיב בנוחות, ומפתחי AI מנוסים משתמשים בו כי הוא פשוט עובד.

## קונפיגורציה: JSON / YAML + משתני סביבה

אל תשמרו נתיבים, מפתחות או פרמטרים ישירות בקוד. 
השתמשו בקבצי **config.json** או **config.yaml** וב-**os.environ** לטעינת משתנים רגישים (כמו API keys). 
דוגמה:

```python

import json, os

with open("config/config.json", encoding="utf-8") as f:

    cfg = json.load(f)

api_key = os.getenv("OPENAI_API_KEY")

```

כך הפרויקט נשאר נייד - כל סביבה יכולה לספק קובץ הגדרות משלה.

## scripts: אוטומציה של הרצות

במקום לזכור פקודות ארוכות, צרו תיקייה /scripts עם קבצים קטנים:

```Plaintext

scripts/

├── run_clean.sh

├── run_stats.sh

└── train_model.py

```

כל קובץ מפעיל פעולה אחת ברורה. זו הדרך הנכונה להפוך פרויקט AI מתהליך ידני למערכת שניתנת להרצה מתוזמנת.

## בדיקות: תיקיית tests + pytest

כל פרויקט production צריך בדיקות יחידה ובדיקות אינטגרציה. 
pytest מאפשר לבדוק גם פונקציות בודדות וגם זרימות מלאות. 
שמרו על מבנה זהה:

```Plaintext

tests/

├── test_clean.py

├── test_stats.py

└── conftest.py

```

הרצה:

```bash

pytest -v

```

בדיקות הן לא רק הגנה, הן **הוכחה שהפרויקט שלכם בשליטה.**

**תיעוד: README + Docstrings + MkDocs**

תיעוד הוא חלק מהקוד. כל מודול צריך docstring ברור, וכל פרויקט צריך README.md קצר וקריא:

• מה הכלי עושה

• איך מתקינים

• איך מריצים

לפרויקטים גדולים יותר השתמשו ב-MkDocs כדי לבנות אתר תיעוד אוטומטי מ-GitHub.

## Git ו-gitignore.: מה לא לשמור

אל תשמרו קבצים שנוצרים אוטומטית:

```Plaintext

__pycache__/

*.pyc

.venv/

data/

.env

config/*.local.json

```

כך הקוד נשאר נקי ומשקל הריפו קטן. 
זכרו, Git אמור להכיל רק את מה שצריך כדי לבנות את הפרויקט מחדש מאפס.

## Dockerfile מינימלי

כדי שהפרויקט יעבוד זהה בכל מחשב, צרו **Dockerfile פשוט**:

```Dockerfile

FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

CMD ["python", "src/project_name/main.py"]

```

הרצה:

```bash

docker build -t mini_text_analyzer .

docker run mini_text_analyzer

```

כעת הפרויקט ניתן לפריסה בכל מקום. מקומי, שרת או ענן.



## CI/CD בסיסי

ב-GitHub Actions או Azure DevOps הגדירו pipeline שמריץ בדיקות בכל commit:

```YAML

name: mini_text_analyzer CI

on: [push]

jobs:

  test:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5

        with:

          python-version: "3.12"

      - run: pip install -r requirements.txt

      - run: pytest

```

זהו שלב קטן שהופך פרויקט למקצועי באמת, לא משנה מי לוחץ “commit”, הכול נבדק אוטומטית.

**דוגמה מרכזית: mini_text_analyzer כתבנית לפרויקט חדש**

mini_text_analyzer כבר כולל את כל הרכיבים האלו

מבנה תיקיות, קונפיגורציה, CLI ובדיקות. 
פשוט העתיקו את השלד שלו כנקודת פתיחה לפרויקט הבא שלכם. 
החליפו את השם בתיקיות, התאימו את הקונפיגורציה, והמערכת מוכנה לעבודה.

## Best Practices

✓ שמרו על **הפרדה חדה** בין קוד, נתונים, קונפיגורציה ולוגים.

✓ השתמשו באוטומציה לכל תהליך שחוזר על עצמו.

✓ הקפידו על תיעוד קצר אך עקבי.

✓ הריצו בדיקות לפני כל commit.

✓ עדכנו את התלויות (requirements.txt) באופן קבוע.

## סיכום הספר - מה למדנו ואיך להמשיך

בספר זה ראיתם איך להפוך ידע בפייתון למקצוע אמיתי בעולם ה-AI:

מהבנת מבני נתונים ועד בניית כלי CLI שלם. 
הבנתם איך לארגן קוד, לבדוק אותו, לתעד אותו, ולפרוס אותו כמו מהנדס תוכנה אמיתי.

מכאן, הצעד הבא הוא לקחת את הידע הזה לפרויקטים אמיתיים: 
להשתמש בתבנית production שבניתם, וליצור ממנה כלים שמשרתים משתמשים אמיתיים. 
זוהי תחילת הדרך כמתכנת AI לא עבודה על קטעי קוד חד פעמיים, אלא בנייה של מערכות שלמות שחושבות, פועלות ונשארות יציבות לאורך זמן.
