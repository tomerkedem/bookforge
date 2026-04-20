# חריגות, לוגים ואבחון

## למה טיפול בשגיאות הוא קריטי ב-AI

מערכת מבוססת AI שונה ממערכת רגילה בכך שהיא לעולם אינה יודעת הכול. היא לומדת, משערת, מנחשת, ולפעמים פשוט טועה. 
אבל יש גורם אחד שאסור לו לטעות, המהנדס שבונה אותה.

ולכן, טיפול בשגיאות ולוגים הוא לא רק נושא טכני, זו שכבת ביטחון מנטלית: מה יקרה כשהכול ישתבש?

מפתח בלי טיפול שגיאות, זה כמו טייס בלי מכשור.

## try / except / else / finally - המבנה הבסיסי

כל שפת תכנות מציעה דרך להתמודד עם שגיאות. 
בפייתון, זה נעשה באמצעות בלוק try/except, עם שני תוספים חשובים: else ו-finally.

```python

def load_model(path: str):

    try:

        print("Loading model...")

        with open(path, "rb") as f:

            model = f.read()

    except FileNotFoundError:

        print("File not found.")

    except Exception as e:

        print(f"Unexpected error: {e}")

    else:

        print("Model loaded successfully.")

    finally:

        print("Cleaning resources...")

```

**הסדר חשוב:**

• Try -קוד שעלול להיכשל.

• Except -טיפול בשגיאות ידועות או כלליות.

• Else -קוד שרץ רק אם לא הייתה שגיאה.

• Finally -קוד שרץ תמיד, גם במקרה של כישלון (לניקוי משאבים, סגירת חיבורים וכו').

במערכות AI אמיתיות נשתמש כמעט תמיד בכל הארבעה. במיוחד כשיש קריאות API, קריאה מקבצים או טעינת מודלים.



## יצירת חריגות מותאמות (Custom Exceptions)

ככל שהמערכת שלך גדלה, תרצה לדעת לא רק ש"הייתה שגיאה" אלא **איזה סוג שגיאה** ולמה. 
במקום לזרוק Exception כללי, ניצור חריגות מותאמות משלנו.

```python

class ModelNotFoundError(Exception):

    """Raised when the model file is missing."""

    pass

class InvalidDatasetError(Exception):

    """Raised when the dataset structure is invalid."""

    pass

def load_dataset(path: str):

    if not Path(path).exists():

        raise InvalidDatasetError(f"The file {path} does not exist.")

```

יתרון עצום של גישה זו הוא יכולת טיפול ממוקדת:

```python

try:

    load_dataset("data/train.csv")

except InvalidDatasetError as e:

    logger.error(f"Error loading dataset: {e}")

```

כך אפשר להבדיל בין "בעיה בנתונים" לבין "בעיה ברשת", בין "מודל חסר" ל"טוקנים שנגמרו".

## logging בסיסי - רמות INFO/WARNING/ERROR

קריאות print הן כמו הודעות בוואטסאפ, הן זמניות ונעלמות. 
לוגים, לעומת זאת, הם היסטוריה רשמית של מה שהתרחש.

```python

import logging

logging.basicConfig(

    level=logging.INFO,

    format="%(asctime)s [%(levelname)s] %(message)s",

    encoding="utf8"

)

logging.info("System started")

logging.warning("The model is slower than usual")

logging.error("Dataset loading failed")

```

רמות הלוגינג:

• **DEBUG ** -למידע מפורט על זרימת הקוד.

• **INFO** -לאירועים רגילים.

• **WARNING** -בעיה לא קריטית.

• **ERROR ** -תקלה חמורה אך ניתנת להתאוששות.

• **CRITICAL** -כשצריך לעצור הכול ולקרוא למתכנת באמצע הלילה.

במקום print, השתמש תמיד ב-logger. הוא יודע לרשום לקבצים,

ל-stdout, ל-syslog, ולשירותים כמו ELK או Datadog.

## Structured Logging - extra dict ו-correlation ID

כשיש לך עשרות microservices, מאות משתמשים ומיליארדי טוקנים, לוגים רגילים כבר לא מספיקים. Structured Logging מאפשר להוסיף **שדות קבועים** לכל הודעה, כך שמערכות ניתוח לוגים (כמו Kibana או Grafana) יוכלו לפלטר, לקבץ ולזהות בעיות במהירות.

```python

import logging

import uuid

logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def process_request(user_id: str):

    correlation_id = str(uuid.uuid4())  # unique identifier for the request

    try:

        logger.info("Starting request processing", extra={"correlation_id": correlation_id, "user_id": user_id})

        # processing code...

        raise ValueError("simulated error")

    except Exception as e:

        logger.error("Processing failed", extra={"error": str(e), "correlation_id": correlatio

```

עקרון **Correlation ID** (מזהה מתאם) נועד לאפשר מעקב אחרי כל בקשה או תהליך לאורך כל שלבי המערכת.

לכל בקשה מוקצה מזהה ייחודי, וכל הלוגים שנוצרים במהלכה כוללים את אותו מזהה. כך שניתן לעקוב אחר הזרימה שלה מתחילתה ועד סופה, גם במערכות מבוזרות או בפייפליין מורכב.



## דוגמה מרכזית: עטיפת pipeline עם לוגים וחריגות

נראה עכשיו איך משלבים את הכול ביחד במערכת אחת שעושה ניקוי נתונים ו-AI Inference.

```python

import logging

import pandas as pd

from pathlib import Path

logger = logging.getLogger("pipeline")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", encoding="utf8")

class PipelineError(Exception):

    pass

def load_data(path: Path) -> pd.DataFrame:

    if not path.exists():

        raise FileNotFoundError(f"File not found {path}")

    df = pd.read_csv(path, encoding="utf8")

    if df.empty:

        raise PipelineError("Dataset is empty")

    return df

def run_inference(df: pd.DataFrame):

    if "text" not in df.columns:

        raise PipelineError("Column text is missing in dataset")

    df["length"] = df["text"].str.len()

    return df

def main():

    try:

        logger.info("Starting pipeline")

        data = load_data(Path("data/input.csv"))

        result = run_inference(data)

        result.to_csv("data/output.csv", index=False, encoding="utf8")

        logger.info("Pipeline completed successfully")

    except PipelineError as e:

        logger.error(f"Pipeline error: {e}")

    except Exception as e:

        logger.exception(f"General error: {e}")

    finally:

        logger.info("End of pipeline")

if __name__ == "__main__":

    main()

```

**דוגמה זו משקפת את המציאות:** טעינה, עיבוד ושמירה של נתונים, עם טיפול בחריגות ולוגים. הכל במהלך אחד מסודר וברור.



## Best Practices

• **אל תבלעו חריגות**

except Exception: pass הוא אויב. עדיף לכתוב לוג ולטפל.

• **השתמשו ב-logger במקום print**

כדי לשלוט ברמות, לנתב ולשמור היסטוריה.

• **אל תחשפו מידע רגיש בלוגים**

(סיסמאות, API keys).

• **תעדו חריגות במבנה עקבי**

סוג, זמן, מזהה בקשה.

• **הוסיפו correlation ID**

לכל תהליך ארוך או בקשה חיצונית.

• **תנו שמות חריגה משמעותיים**

לא CustomError, אלא ModelNotLoadedError.

• **שמרו לוגים לקובץ נפרד בכל מודול חשוב**

(למשל pipeline.log, api.log).

## סיכום - לוגים טובים הם העיניים של המערכת

בעולם שבו המידע זורם במהירות והמערכות מבוזרות, לוגים הם הדרך היחידה להבין מה באמת קרה. 
חריגות אומרות לנו מה נכשל, ולוגים מספרים איך זה קרה.

במערכת AI חכמה, לא מספיק לדעת לטפל בשגיאה.

צריך לדעת לזהות אותה בזמן, להבין את ההקשר, ולהמשיך לעבוד.

<img src="/practical-python-for-ai-engineering/assets/image-01.png" alt="image-01.png" width="697" height="577" />

לוגים טובים הם לא רעש, הם מצפן.

וכשמגיע הבאג הראשון בפרודקשן, הם יהיו הקול השפוי היחיד שיספר לך את האמת.



**תרשים זרימה של טיפול בשגיאות**


