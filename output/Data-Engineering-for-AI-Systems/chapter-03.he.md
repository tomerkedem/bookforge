# פרק 3: Data Contracts ושלמות סמנטית (Semantic Integrity)

## בעיית הפער הסמנטי

בשלב ה-MVP של LogiSmart, הכל נראה תקין טכנית. הלוגים היו נקיים, המודל ענה מהר, והנתונים זרמו. אבל כשהמשתמשים התחילו לשאול שאלות מורכבות, המערכת התחילה לייצר מציאות אלטרנטיבית.

הדוגמה ששברה את גב הגמל הייתה שאילתה פשוטה של מנהל תפעול: "כמה נהגים זמינים יש לנו כרגע בתל אביב?". המודל סרק את הטבלאות והחזיר בביטחון: "ישנם 15 נהגים זמינים". בפועל, לא היה אפילו אחד.

המודל לא "הזה" יש מאין. הוא מצא בטבלה 15 נהגים עם status_code = 1. מבחינת המודל הסטטיסטי, הספרה 1 היא אינדיקציה חיובית, פעילה. אבל בלוגיקה העסקית ההיסטורית של LogiSmart, הקוד **1** סימן שהנהג "התחיל משמרת", לא שהוא "פנוי". כדי להיות פנוי באמת, הנהג היה צריך להיות בסטטוס 1 **וגם** ששדה current_mission_id יהיה ריק (NULL).

זהו **הפער הסמנטי**. המרחק בין איך שבני אדם (ומודלי שפה) מבינים מילים כמו "פנוי", לבין הייצוג הטכני השרירותי שלהן בבסיס הנתונים. בעבר, מפתחים סגרו את הפער הזה עם קוד (if status == 1 and mission is None). היום, אנחנו מזרימים את הנתונים הגולמיים למודל ומצפים שהוא "יבין לבד". הוא לא.

**מלכודת השמות הזהים (Same Name, Different Meaning)**

ב-2026, הבעיה הזו החמירה דווקא בגלל שהטכנולוגיה השתפרה. חלונות הקשר (Context Windows) ענקיים של מיליון טוקנים מפתים אותנו "לזרוק פנימה את כל הדאטה".

במערכת של LogiSmart, המילה "Client" (לקוח) הופיעה בשלושה מקורות מידע שונים שהוזנו לתוך ה-RAG:

1. **במערכת המכירות (CRM):** "לקוח" הוא ליד (Lead) שטרם שילם.

2. **במערכת הבילינג:** "לקוח" הוא הישות המשפטית שמשלמת את החשבונית.

3. **במערכת השילוח:** "לקוח" הוא מקבל החבילה בקצה (שיכול להיות עובד מחסן).

כשה-Agent נשאל "האם הלקוח קיבל את החבילה?", הוא שלף פיסות מידע משלושת המקורות. בגלל שהמונח היה זהה, המודל ביצע אינטגרציה שגויה ("Merge") והסיק מסקנה הרסנית: "הלקוח עדיין בסטטוס 'פוטנציאלי' ולכן המשלוח עוכב", למרות שהמשאית כבר הייתה בדרך.

במערכות דטרמיניסטיות, התנגשות כזו גורמת לשגיאת קומפילציה. במערכות AI, היא מייצרת הזיה שקטה (Silent Hallucination). המערכת עונה בביטחון, והטעות מתגלה רק בעולם הפיזי. הפתרון אינו Prompt טוב יותר, אלא הגדרה חד-משמעית של המשמעות לפני שהדאטה נכנס לצינור.



**איור 3.1: מלכודת השמות הזהים (The Semantic Collision Trap)**

<img src="/Data-Engineering-for-AI-Systems/assets/image-08.png" alt="image-08.png" width="697" height="465" />


התרשים ממחיש את "מגדל בבל" שנוצר בתוך ה-Context Window. 
**שימו לב למעבר המסוכן משמאל לימין:**

המונח "Client" מגיע משלושה מקורות שונים (מכירות, בילינג, שילוח), שלכל אחד מהם משמעות עסקית נפרדת לחלוטין. ברגע שהם נכנסים לתוך ה"משפך" של המודל ללא תיווך סמנטי (Data Contract), ההקשרים המקוריים נמחקים והופכים לרעש אחיד. המודל, בלית ברירה, ממציא היגיון חדש ושגוי שמערבב בין כסף, לידים ומשלוחים פיזיים.



## מהו Data Contract מודרני?

עד לא מזמן, רוב המהנדסים התייחסו ל-"Data Contract" פשוט כאל סכמה (Schema). אם יש לנו קובץ JSON ובו שדה price מסוג float, סימן שיש לנו חוזה, נכון? לא נכון.

בעידן ה-AI, סכמה טכנית היא רק קו ההגנה הראשון והחלש ביותר. העובדה ששדה הוא float לא מספרת למודל האם המחיר כולל מע"מ, האם הוא בדולרים או בשקלים, והאם מותר לו להיות שלילי (למשל במקרה של זיכוי). מודל שפה לא יכול "לנחש" את הדברים האלו, ואם הוא מנחש - הוא בדרך כלל טועה.

Data Contract מודרני ב-2026 הוא אובייקט שמגדיר ציפיות בארבע רמות שונות, ולא רק באחת. הוא לא רק מסמך תיעוד שיושב בוויקי, אלא רכיב קוד חי שנאכף ב-Runtime (בתוך ה-Pipeline או ב-Gateway).

**ארבע שכבות החוזה (The Four Layers of a Contract)**

1. **השכבה המבנית (Schema):** התחביר הטכני. שמות שדות, טיפוסי נתונים (String, Int, Array), ומבנה ההיררכיה.

**דוגמה:** delivery_time הוא Timestamp בפורמט ISO-8601.

2. **השכבה הסמנטית (Semantics):** המשמעות העסקית שהמודל חייב להכיר.

**דוגמה:**

- delivery_time מציין את זמן המסירה המשוער (ETA), והוא חייב להיות בעתיד.

- שדה weight הוא בקילוגרמים ולא בפאונד.

- null בשדה נהג אומר "טרם שובץ" ולא "טעות במערכת".

3. **שכבת רמת השירות (SLA & Freshness):** מתי הדאטה נחשב "טרי" ומתי הוא פג תוקף. מערכות RAG רגישות לזה במיוחד - אין טעם לאחזר מיקום של משאית מלפני 4 שעות.

**דוגמה:** הנתונים חייבים להתעדכן כל 60 שניות לכל היותר.

4. **שכבת הממשל (Governance):** מי הבעלים, ומי מורשה לראות את המידע.

**דוגמה:** שדה driver_phone הוא PII (מידע אישי) ואסור לשלוח אותו למודל ענן פומבי, אלא אם כן עבר התממה (Masking).

במערכת של LogiSmart, המעבר לחוזים מלאים שינה את התמונה. במקום שצוות ה-Backend ישנה שדה ו"ישבור" את ה-Agent, החוזה מחייב אותם להריץ בדיקות לפני כל שינוי. ה-Agent, בתורו, יודע לסנן מידע ישן מדי ("אני רואה מיקום, אבל הוא מלפני 20 דקות, אז אני לא אשתמש בו").



**איור 3.2: האנטומיה של חוזה נתונים (The Anatomy of a Data Contract)**

<img src="/Data-Engineering-for-AI-Systems/assets/image-09.png" alt="image-09.png" width="697" height="465" />


התרשים מציג את החוזה כ"בצל" או כאובייקט רב-שכבתי, כדי להמחיש שסכמה היא רק הליבה הקטנה. רוב הכשלים במערכות AI קורים במעגלים החיצוניים (סמנטיקה ו-SLA), לא בגלל שגיאת טיפוסים פשוטה.

**שימו לב:** הנתונים נכנסים מצד אחד, עוברים דרך כל המסננים, ורק אז יוצאים כ"הקשר מהימן" (Trusted Context) עבור המודל.



## מימוש חוזים בקוד (Implementing Contracts)

אחרי שהבנו את התיאוריה, צריך להוריד אותה לקוד. בסטאק המודרני שבחרנו (Reference Stack 2026), החוזה הוא לא מסמך Word שיושב ב-SharePoint, אלא רכיב תוכנה חי שנאכף בכל ריצה. אנחנו מממשים אותו באמצעות שילוב של שני כלים מרכזיים:** Pydantic v2** (למבנה וטיפוסים ברמת הרשומה הבודדת) ו-**Great Expectations** (לחוקים סטטיסטיים ברמת ה-Batch).

ב-LogiSmart, המקום הראשון שבו הוטמע חוזה קשוח היה בשירות מזג האוויר. נתוני גשם משפיעים דרמטית על זמן המשלוח, והמערכת צורכת API חיצוני זול שלפעמים מחזיר מידע חסר או לא מעודכן. ללא חוזה, ה-Agent היה ממליץ על אופניים בעיצומה של סופה.

**קו ההגנה הראשון: Pydantic v2**

השתמשנו ב-Pydantic v2 כי הוא מהיר (כתוב ב-Rust) ומהווה את הסטנדרט דה-פקטו בעולמות ה-LLM (גם OpenAI וגם LangChain משתמשים בו). החוזה הבא יושב ב-Ingestion Service ומסנן כל רשומה נכנסת:

```python
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone

class WeatherUpdate(BaseModel):
    # Schema Layer: Basic types and field names
    station_id: str
    
    # Semantics Layer: Physical constraints (sanity checks)
    temperature_celsius: float = Field(ge=-50, le=60, description="Ambient temp in Celsius")
    
    # Semantics: Cannot be null, must be a valid percentage
    rain_probability: int = Field(ge=0, le=100)
    measured_at: datetime

    @field_validator('measured_at')
    @classmethod
    def check_freshness(cls, v: datetime):
        """
        SLA Layer: Data stale by >15 min is invalid for routing decisions.
        """
        now = datetime.now(timezone.utc)
        
        # Check against current time (allowing 15 min max lag)
        if (now - v).total_seconds() > 900:
            raise ValueError(f"Data is too stale for operations")
        return v
```

קטע הקוד הזה הוא השער (Gateway). אם ה-API מחזיר טמפרטורה של 200 מעלות (באג בחיישן) או מידע מלפני שעה - המידע **נחסם** ולא מזהם את ה-Vector Store.

**קו ההגנה השני: Great Expectations (GX)**

בעוד Pydantic שומר על הרשומה הבודדת, Great Expectations שומר על המגמה בתוך ה-Pipeline של Kafka.

למשל, נניח שהחיישנים תקינים טכנית, אבל בגלל תקלה אזורית כולם הפסיקו לשלוח את שדה wind_speed (הוא מגיע כ-0 תקין, אבל חשוד). Pydantic יעביר את זה (כי 0 זה מספר חוקי), אבל GX יזהה את האנומליה.

אנחנו מגדירים "Expectation Suite" שרצה אחת לשעה על הנתונים שנצברו:

- expect_column_values_to_not_be_null (מעל סף של 95%).

- expect_column_kl_divergence_to_be_less_than (בדיקה שהתפלגות הנתונים לא השתנתה דרסטית מהשבוע שעבר).

**מדיניות ה-NULL הקשוחה**

אחת ההחלטות החשובות בחוזה של LogiSmart הייתה האיסור על ערכי null משתמעים. בחוזה הוגדר:** אין דבר כזה "אין מידע"**. אם אין מידע, השירות חייב להחזיר ערך Sentinel מפורש (למשל -1 או סטטוס UNKNOWN) או שהרשומה נפסלת. 
זה קריטי כי LLMs נוטים "להזות" כשחסר להם מידע. כשהמודל מקבל null (שמומר למחרוזת "None"), הוא עלול לפרש זאת כ"הסתברות אפס" או כסתם טקסט, ולענות למשתמש תשובות חסרות בסיס. החוזה מכריח אותנו להיות מפורשים.

**איור 3.3: זרימת אכיפת החוזים (Contract Enforcement Pipeline)**
<img src="/Data-Engineering-for-AI-Systems/assets/image-10.png" alt="image-10.png" width="698" height="465" />


התרשים מציג את המסלול של רשומת מידע משמאל לימין, דרך שני מסננים (Filters).

1. **Filter 1 (Pydantic):** מסנן צפוף ומהיר בכניסה למערכת. הוא בודק רשומה אחת בכל פעם. רשומות פסולות נופלות מיד החוצה.

2. **Buffer (Kafka/Storage):** המידע התקין נערם.

3. **Filter 2 (Great Expectations):** מסנן רחב שבודק את כל הערימה (Batch). הוא מחפש אנומליות סטטיסטיות שלא רואים ברשומה בודדת.

4. התוצר הסופי הוא "Clean Data" שמגיע למודל ה-AI.



## כשחוזים נשברים: זיהוי והתאוששות

אף מערכת אינה חסינה בפני שינויים. יום אחד ה-API של הספק משתנה בלי התראה, או שפורמט התאריך עובר מ-DD/MM/YYYY ל-YYYY-MM-DD. כשזה קורה, החוזה שלנו "נשבר" (Contract Breach). השאלה היא לא אם זה יקרה, אלא איך המערכת מגיבה: האם היא קורסת ברעש (Fail-Fast), או שהיא ממשיכה לצלוע בשקט ומזהמת את ה-Data Lake?

במערכות AI, ברירת המחדל המסוכנת היא **שתיק**ה. המודל יקבל תאריך הפוך, ינסה לפרש אותו כמיטב יכולתו ("ה-12 לחודש ה-30? אולי זה שנת 2030?"), ויחזיר תשובה הזויה. לכן, ב-LogiSmart הטמענו אסטרטגיה משולבת של **Fail-Fast** בצד הכתיבה, ו-**Graceful Degradation** בצד הקריאה.

**תבנית ה-Dead Letter Queue (DLQ)**

כשהחוזה (Pydantic/GX) מזהה הפרה, המידע **לעולם** לא נכנס למסד הנתונים הראשי. במקום זאת, הוא מוסט הצידה ל-Dead Letter Queue (במקרה שלנו, Kafka Topic נפרד בשם dlq.weather_updates או דלי S3 צדדי).

היתרון כפול:

1. **הגנה על המודל:** ה-RAG נשאר נקי. שום זבל לא נכנס פנימה.

2. **אפשרות לתיקון (Replay):** המידע הפגום נשמר בצד. אחרי שהמהנדסים מתקנים את הבאג (למשל, מעדכנים את ה-Parser לתאריך החדש), אפשר להריץ מחדש את ההודעות מה-DLQ ולהציל את הדאטה.

**התאוששות (Graceful Degradation)**

אבל מה עושים בזמן אמת? המשתמש שאל "האם יורד גשם?", והמידע העדכני נחסם בגלל הפרת חוזה.

במקום שהמערכת תקרוס עם שגיאת 500 Internal Server Error, אנחנו מפעילים מנגנון **Fallback.**

ה-Agent מתוכנת לזהות שהמידע הטרי חסר (כי ה-DLQ פעיל), ולעבור לאסטרטגיה חלופית:

- **שימוש במידע היסטורי:** "אין נתונים מהדקה האחרונה, אבל לפני שעה היה בהיר."

- **הודעה כנה למשתמש:** "יש תקלה במקור המידע, ולכן אני לא יכול לאשר את תחזית הגשם כרגע." (עדיף על פני המצאה).



**קוד: DLQ ו-Fallback בסיסי**

```python
try:
    # Attempt to validate and parse data
    weather_data = WeatherUpdate(**raw_api_response)
    save_to_vector_store(weather_data)

except ValidationError as e:
    # 1. Quarantine bad data (Fail-Safe)
    # We send the raw payload + error reason to DLQ for later analysis
    send_to_dlq(
        topic="dlq.weather", 
        payload=raw_api_response, 
        error=str(e)
    )
    
    # 2. Alert the team
    metrics.increment("contract_breach_count")
    
    # 3. Log warning (Don't crash the pipeline)
    logger.warning("Weather update discarded due to schema violation")
```

הדפוס הזה מבטיח שהמערכת "נכשלת בבטחה". היא אולי לא מעודכנת לרגע, אבל היא לעולם לא משקרת.



**איור 3.4: זרימת ה-Dead Letter Queue**

<img src="/Data-Engineering-for-AI-Systems/assets/image-11.png" alt="image-11.png" width="698" height="518" />


התרשים מציג את ה"צומת" הקריטי ב-Pipeline.

1. **Validation Node:** צומת מרכזי שבודק כל הודעה.

2. **נתיב ההצלחה (למעלה, ירוק):** מידע תקין ממשיך ל-Vector DB / Production.

3. **נתיב הכישלון (למטה, אדום):** מידע פגום נופל לתוך מיכל צדדי (DLQ Bucket).

4. **Loop (חץ חוזר):** חץ מקווקו שמראה את תהליך ה-Reprocessing (עיבוד מחדש) מה-DLQ חזרה לצינור הראשי לאחר תיקון הבאג.

5. **Alert:** אייקון של פעמון או סירנה המחובר לנתיב הכישלון.

## מיני-פרויקט וצ'קליסט ליישום (Mini-Project & Checklist)

תיאוריה זה חשוב, אבל חוזי דאטה נבחנים רק כשהקוד פוגש את המציאות המלוכלכת. בחלק הזה אנחנו נכנסים ל-Repository שיצרנו בפרק 2 ונממש חוזה אמיתי מקצה לקצה.

המטרה: לקחת מקור מידע "בעייתי" (API של עומסי תנועה שנוטה להחזיר ערכים חסרים) ולייצר עבורו חוזה שיגן על המערכת מפני קריסה או הזיות.

**המעבדה: הקמת חוזה תנועה (Traffic Contract Lab)**

בתוך הפרויקט שלנו (ai-data-engineering-playbook), ניצור סביבת עבודה לפרק 3.

**שלב 1: הכנת הסביבה** 
פתחו טרמינל בתיקיית הפרויקט והריצו את הפקודות הבאות:

```bash
mkdir -p chapter-03-contracts/src
cd chapter-03-contracts
# Create the necessary files
touch requirements.txt src/traffic_contract.py src/ingest_traffic.py
```

הוסיפו לקובץ requirements.txt את התוכן הבא:

```bash
pydantic>=2.7.0
```



**שלב 2: כתיבת החוזה (The Contract)** 
פתחו את src/traffic_contract.py. והסיפו לו את הקוד הבא: 
האתגר שלנו כאן הוא כפול: גם לוודא שהמספרים הגיוניים, וגם להשלים מידע חסר (Imputation) כדי שה-Agent לא ייכשל.

```python
from typing import Optional, Literal
from pydantic import BaseModel, Field, model_validator

# Define allowed values for strict typing
CongestionEnum = Literal["LOW", "HIGH", "UNKNOWN"]

class TrafficUpdate(BaseModel):
    segment_id: str
    
    # Semantic check: Speed cannot be negative, and >200 is likely an error
    current_speed: float = Field(ge=0, le=200, description="Speed in km/h")
    
    # Optional field that we will enforce via logic
    congestion_level: Optional[CongestionEnum] = None

    @model_validator(mode='after')
    def infer_congestion_if_missing(self):
        """
        Business Logic / Imputation Layer:
        If the API fails to provide congestion level (returns None),
        we infer it deterministically from the speed.
        This prevents 'null' pollution in the LLM context.
        """
        if self.congestion_level is None:
            # Logic: If speed is below 20km/h, it's definitely congested
            if self.current_speed < 20:
                self.congestion_level = "HIGH"
            else:
                self.congestion_level = "LOW"
        return self

    @model_validator(mode='after')
    def validate_urban_logic(self):
        """
        Contextual Semantic Check:
        If the segment ID indicates an urban area, speeds > 90 are suspicious.
        """
        if "urban" in self.segment_id and self.current_speed > 90:
             raise ValueError(f"Speed {self.current_speed} is physically impossible for urban segment")
        return self
```

**שלב 3: סימולציה של ה-Pipeline** 
כעת נכתוב סקריפט ב-src/ingest_traffic.py שמדמה קריאה מ-API ושימוש בחוזה.

```python
from pydantic import ValidationError
from traffic_contract import TrafficUpdate

# Mock data simulating a messy API response
raw_traffic_data = [
    # Case 1: Perfect data
    {"segment_id": "hwy-01", "current_speed": 85.0, "congestion_level": "LOW"},
    
    # Case 2: Missing congestion level (Needs imputation)
    {"segment_id": "hwy-02", "current_speed": 15.0, "congestion_level": None},
    
    # Case 3: Semantic Error (Urban speeding)
    {"segment_id": "urban-03", "current_speed": 120.0, "congestion_level": "LOW"},
]

def run_pipeline():
    print("--- Starting Traffic Ingestion ---")
    
    for row in raw_traffic_data:
        try:
            # Enforce Contract
            validated_record = TrafficUpdate(**row)
            
            print(f"[OK] Segment: {validated_record.segment_id} | "
                  f"Speed: {validated_record.current_speed} | "
                  f"Congestion: {validated_record.congestion_level} (Final)")
                  
        except ValidationError as e:
            # In a real system -> Send to DLQ
            reason = e.errors()[0]['msg']
            print(f"[REJECTED] Segment: {row.get('segment_id')} | Reason: {reason}")

if __name__ == "__main__":
    run_pipeline()
```

**שלב 4: הרצה** 
התקינו והריצו:

```bash
pip install -r requirements.txt
python src/ingest_traffic.py
```

אתם תראו ש-Case 2 תוקן אוטומטית (Congestion הפך ל-HIGH), ו-Case 3 נדחה בגלל הגיון סמנטי שגוי.

**צ'קליסט: 10 השאלות ל-Data Contract Review**

לפני שאתם מעלים Feature חדש לפרודקשן, עברו על הרשימה הזו. אם התשובה לאחת השאלות היא "לא יודע", החוזה שלכם פרוץ.

1. **הבעלות (Ownership):** מי האחראי אם ה-API החיצוני משנה פורמט ב-2 בלילה?

2. **המשמעות (Semantics):** האם יחידות המידה (קמ"ש/מייל, דולר/אירו) מוגדרות בבירור?

3. **מדיניות ה-Nulls:** מה קורה כששדה חסר? האם אנחנו משלימים אותו (Imputation) או דוחים את הרשומה?

4. **הטריות (Freshness):** מהו ה-TTL (Time To Live) של המידע? מתי הוא הופך ללא רלוונטי ל-RAG?

5. **התאימות (Compatibility):** האם שינוי בחוזה ישבור צרכנים קיימים (Backward Compatibility)?

6. **הפרטיות (PII):** האם וידאנו שאין הדלפה של מספרי טלפון או תעודות זהות למודל הענן?

7. **האכיפה (Enforcement):** האם החוזה נאכף בקוד (כמו בדוגמה למעלה) או שהוא רק מסמך טקסט?

8. **ה-DLQ:** לאן הולך מידע שנכשל? האם מישהו באמת בודק את ה-Dead Letter Queue?

9. **הווליום (Scale):** האם ה-Validator יעמוד בעומס של פי 10 בכמות המידע?

10. **ההתראה (Alerting):** האם נקבל התראה כש-10% מהמידע נדחה, או רק כשהמערכת תקרוס?

<img src="/Data-Engineering-for-AI-Systems/assets/image-12.png" alt="image-12.png" width="697" height="386" />

**איור 3.5: כרטיס בדיקת חוזים (Contract Review Scorecard)**

האיור מעוצב כמו טופס בדיקה ("Checklist") על לוח כתיבה (Clipboard). 
הוא מחלק את 10 השאלות ל-5 קטגוריות ויזואליות:

1. **Ownership** (אייקון של איש)

2. **Quality & Semantics** (אייקון של יהלום או זכוכית מגדלת)

3. **Freshness** (אייקון של שעון)

4. **Privacy** (אייקון של מנעול)

5. **Recovery** (אייקון של תיק עזרה ראשונה)

6. בתחתית הטופס יש חותמת גדולה וירוקה: "AI READY".

סיימנו את פרק 3. 
בנינו את הבסיס: אנחנו יודעים איך להגדיר מידע אמין עבור ה-AI.
