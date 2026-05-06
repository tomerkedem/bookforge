# פרק 4: סטרימינג ודאטה בזמן אמת ל-AI

**המטרה:** להבין מתי Batch כבר לא מספיק, ואיך לבנות צנרת Streaming מודרנית שמזינה את ה-AI במידע טרי באמת.

## מלכודת הצילום הישן (The Stale Snapshot Trap)

בעולם הבינה העסקית (BI) המסורתי, התרגלנו לעבוד עם "צילומי מצב" (Snapshots). פעם ביום, בדרך כלל ב-2:00 בלילה כשכולם ישנים, תהליך ETL היה מתעורר, מעתיק את בסיס הנתונים, ומעביר אותו למחסן הנתונים (Data Warehouse). למנהל שפותח דשבורד בבוקר עם הקפה, זה הספיק בהחלט. הנתונים היו נכונים ל"אתמול בחצות".

אבל כשחיברנו את ה-Agent של LogiSmart לאותה ארכיטקטורה בדיוק, גילינו שמה שעובד למנהלים - הורג את המערכת האופרטיבית.

**מקרה ה-15 דקות האבודות (The 15-Minute Lag Case)**

יום אחד, נהג של LogiSmart בשם יוסי קיבל מה-Agent המלצה חד-משמעית: "סע דרך כביש החוף (כביש 2), הוא פנוי לחלוטין". יוסי יצא לדרך, ותוך 5 דקות מצא את עצמו בתוך פקק ענק שנגרם מתאונה שקרתה ממש עכשיו.

ה-Agent לא שיקר. הוא גם לא הזה. הוא פשוט הסתמך על Snapshot שנלקח לפני 15 דקות. 
בעולם של AI שמקבל החלטות בזמן אמת (כמו ניתוב, מסחר במניות, או זיהוי הונאות), מידע ישן הוא מידע שגוי.

ההבדל הקריטי בין Analytics ל-AI הוא במחיר הטעות:

- אם דוח המכירות הרבעוני מתעדכן באיחור של שעה - לא קרה כלום.

- אם מודל ה-RAG שממליץ על מסלולים לא יודע על תאונה שקרתה לפני דקה - המשאית נתקעת, והלקוח כועס.

**Dataset vs. Stream**

כדי לפתור את זה, היינו צריכים לשנות את התפיסה הבסיסית. דאטה הוא לא "קובץ" סטטי שנח בדיסק. דאטה הוא זרם אינסופי של אירועים (Events).

- בגישת ה-Dataset: אנחנו שואלים "מה היה מצב העולם בנקודת זמן X?". זה כמו להסתכל על אלבום תמונות.

- בגישת ה-Stream: אנחנו מקשיבים לדופק של העולם בזמן שהוא קורה. "נהג א' דיווח על עצירה", "חיישן ב' דיווח על ירידה במהירות". זה כמו לצפות בשידור חי.

ב-2026, מערכות AI מתקדמות כבר לא מסתמכות על אינדקס שמתעדכן פעם בלילה. הן מחוברות לצינורות (Pipelines) שדוחפים (Push) עדכונים לתוך ה-Vector Store תוך שניות מרגע האירוע. בפרק הזה נבנה את הצינור הזה בדיוק.



**איור 4.1: הפער בין המציאות למודל (The Reality Gap)**

<img src="/Data-Engineering-for-AI-Systems/assets/image-13.png" alt="image-13.png" width="698" height="465" />


התרשים מציג שני צירי זמן מקבילים (Time Series):

1. **ציר המציאות (למעלה):** מראה כביש פנוי (קו ירוק), ואז בשעה 10:00 בדיוק מופיע אייקון של "פיצוץ/תאונה", והקו הופך לאדום מיידית.

2. **ציר המודל/RAG (למטה):** הקו נשאר ירוק גם אחרי 10:00. יש סמן ב-10:15 שכתוב עליו "Next Batch Update".

3. **הפער:** האזור שבין 10:00 ל-10:15 צבוע באדום בהיר ומסומן כ-"The Blind Spot (Hallucination Zone)". ה-Agent ממליץ לנסוע, למרות שבמציאות הכביש חסום.



מצוין. עכשיו, כשברור לנו למה אנחנו צריכים סטרימינג, בואו נבין **איך** בונים את זה נכון ב-2026.

## ארכיטקטורת הסטרימינג ב-2026 (Streaming Architecture)

אם בעבר התקנת Kafka הייתה פרויקט תשתית של חודש שכלל הגדרת Zookeeper וניהול שרתים מסובך, ב-2026 החיים שלנו הרבה יותר קלים. הסטנדרט הנוכחי הוא Kafka 3.7+ במצב KRaft.

למה KRaft?

כי הוא הסיר את התלות ברכיב הניהול הישן (Zookeeper). עכשיו Kafka הוא בינארי אחד, קל משקל, שאפשר להרים בקונטיינר בודד בתוך שניות - בדיוק כמו שעשינו ב-docker-compose בפרק 2.

**מושגי היסוד (מילון מקוצר למהנדסי AI)**

כדי לחבר את ה-AI לזרם הנתונים, אנחנו צריכים להכיר ארבעה רכיבים:

1. **Events (האירועים):** האטום של המערכת. אירוע הוא לא סתם שורה בטבלה, אלא משהו שקרה: "משאית 42 זזה", "הזמנה 100 בוטלה". אירועים הם בלתי ניתנים לשינוי (Immutable).

2. **Topics (הערוצים):** המקבילה לטבלאות ב-DB, אבל בסטרימינג. ב-LogiSmart יש לנו Topic בשם traffic_updates. כל החיישנים זורקים לשם מידע, וה-Agent מאזין לו.

3. **Producers (היצרנים):** הרכיבים ששולחים מידע. אצלנו זה ה-Ingestion Service שקראנו לו בפרק הקודם, שרץ מול ה-API של התנועה.

4. **Consumers (הצרכנים):** הרכיבים שקוראים את המידע. זה יכול להיות שירות שמעדכן את ה-Vector DB, או שירות שמפעיל Alert אם יש פקק חריג.

**ניהול State (הזיכרון של הזרם)**

האתגר הגדול בסטרימינג ל-AI הוא הזיכרון. מודל AI צריך הקשר (Context). אם קיבלנו אירוע "מהירות: 0 קמ״ש", זה לא אומר כלום. האם המשאית עומדת ברמזור (תקין) או שהיא עומדת כבר שעה (תקלה)?

כדי לענות על זה, ה-Consumer חייב לשמור **State** מקומי. הוא זוכר את הדיווח הקודם, משווה לדיווח הנוכחי, ורק אז מחליט אם לעדכן את המודל.

**הערה על חלופות (Tools Landscape):** 
בספר הזה בחרנו ב-Kafka כי הוא הסטנדרט המוחלט בתעשייה ויש לו את האקו-סיסטם הגדול ביותר. עם זאת, ב-2026 יש חלופות מצוינות:

- **Redpanda:** תואם Kafka אבל כתוב ב-C++ (מהיר יותר, קובץ יחיד).

- **Apache Pulsar:** מעולה לארכיטקטורות מורכבות מאוד.

- **AWS Kinesis / GCP PubSub:** פתרונות מנוהלים בענן (טובים אם אתם לא רוצים לנהל תשתית, אבל יקרים יותר בווליום גבוה).

- הקוד שנכתוב כאן יעבוד כמעט ללא שינוי גם ב-Redpanda.

<img src="/Data-Engineering-for-AI-Systems/assets/image-14.png" alt="image-14.png" width="698" height="465" />

**איור 4.2: ארכיטקטורת Kafka בסיסית**

התרשים מציג צינור מרכזי אופקי (The Pipe/Topic) המחולק למקטעים (Partitions).

1. **משמאל (Producers):** אייקונים של חיישנים ושרתים "יורים" כדורים קטנים (Events) לתוך הצינור.

2. **במרכז (Kafka Topic):** הכדורים מסודרים לפי סדר הגעה (0, 1, 2...).

3. **מימין (Consumers):** קבוצת שרתים (Consumer Group) "מושכת" את הכדורים ומעבדת אותם.

4. **למטה (State Store):** ליד ה-Consumer יש אייקון של דיסק קטן שמייצג את הזיכרון המקומי (State) שבו נשמר המידע ההיסטורי לצורך חישובים.

אנחנו מעלים הילוך. בפרק הקודם למדנו איך לאמת נתונים כשהם נחים (Batch). עכשיו נלמד איך לעשות את זה כשהם טסים ב-200 קמ"ש בתוך הצינור.

## אימות בתנועה (Validation in Motion)

האתגר הגדול בסטרימינג הוא שאין "Undo". ברגע שאירוע שגוי נכנס ל-Kafka ונצרך על ידי ה-Agent, הנזק כבר נעשה. המודל למד עובדה לא נכונה ("הכביש פנוי"), והוא ימשיך להמליץ עליה עד שמישהו יתקן אותו ידנית.

לכן, ב-LogiSmart אימצנו את גישת **"השומר בשער" (Gatekeeper Pattern)**. ה-Consumer שלנו לא סתם מעביר מידע ל-Vector DB. הוא קודם כל בודק אותו.

**מה בודקים בזרם? (In-Stream Validation)**

בניגוד ל-Batch שבו אפשר לחשב ממוצעים על כל ההיסטוריה, בסטרימינג אנחנו חייבים לקבל החלטות על בסיס האירוע הבודד (Stateless) או על בסיס חלון זמן קצר (Stateful).

1. **מבנה (Schema):** האם ה-JSON תקין? האם יש שדות חובה? (את זה פתרנו עם Pydantic בפרק 3, אבל כאן זה קורה בזמן אמת).

2. **טריות (Freshness):** בסטרימינג, הזמן הוא הכל. אירוע שהגיע באיחור של 5 דקות הוא כבר "היסטוריה", לא "חדשות". אם ה-Timestamp של ההודעה הוא מלפני 10 דקות, אנחנו זורקים אותה.

3. **סמנטיקה (Semantic Anomalies):**

- **קפיצות לא הגיוניות:** משאית לא יכולה להיות בחיפה ב-10:00 ובתל אביב ב-10:05. אם זה קרה, אחד הדיווחים שגוי (Teleportation check).

- **ערכים קיצוניים:** מהירות של 500 קמ"ש היא כנראה רעש בחיישן GPS.

**המקרה של LogiSmart: הגנה על ה-RAG**

במערכת שלנו, ה-Consumer הוא פילטר אקטיבי. 
לפני שמעדכנים את ה-Embedding של קטע כביש, הקוד מבצע בדיקה כפולה:

1. **בדיקה טכנית:** האם ההודעה תקינה (Pydantic).

2. **בדיקה עסקית:** האם השינוי הגיוני ביחס למצב הקודם? (למשל, האם ייתכן שהעומס ירד מ-"Heavy" ל-"Free" בשנייה אחת? כנראה שלא, אז נחכה לעוד דיווח לפני שנעדכן).

איור 4.3: אימות בתנועה (Stream Validation Logic)

<img src="/Data-Engineering-for-AI-Systems/assets/image-15.png" alt="image-15.png" width="697" height="465" />


התרשים מציג צינור שקוף (Stream) שזורמים בו אירועים (קוביות). 
בתוך הצינור יש "שערים" (Gates) עם סמלים שונים:

1. **שער 1 (שעון):** בודק Time/Freshness. קוביות אדומות (ישנות) נופלות למטה לפח (Drop).

2. **שער 2 (סרגל):** בודק Range/Values. קוביות חריגות (גדולות מדי) נזרקות הצידה.

3. **היציאה:** רק קוביות ירוקות ותקינות מגיעות לקופסה שכתוב עליה "RAG / Vector Store".



## לחץ אחורי וטיפול בשגיאות (Backpressure & Error Handling)

כשהכל תקין, הסטרימינג עובד חלק. אבל מה קורה כשפתאום יש גשם מטורף, כל החיישנים שולחים דיווחים בבת אחת, ובדיוק באותו רגע ה-API של ה-Vector DB נהיה איטי? 
זהו מתכון לאסון. התור ב-Kafka מתמלא, הזיכרון בשרת נגמר, והמערכת קורסת בבום (Out of Memory Error).

כדי למנוע את זה, אנחנו חייבים להשתמש במנגנון שנקרא Backpressure (לחץ אחורי).

**מה זה Backpressure?**

**המנגנון דומה לצינור מים עם שסתום ביטחון:** אם הלחץ הנכנס עולה על הקיבולת (למשל, הזרמת מים בלחץ אדיר לדלי קטן), המים נשפכים. Backpressure הוא הברז החכם שמווסת את הזרימה ומונע הצפה.

במערכות תוכנה, זה אומר שה-Consumer (הצרכן) שלנו מאותת ל-Producer (היצרן) או ל-Kafka: "אני עמוס, תאט את הקצב!".

ב-Kafka זה קורה באופן טבעי (ה-Consumer פשוט קורא לאט יותר), אבל אנחנו צריכים לוודא שאנחנו לא צוברים Lag (פיגור) אינסופי.

**אסטרטגיית ה-Circuit Breaker (מפסק חירום)**

לפעמים הבעיה היא לא עומס רגעי, אלא תקלה מתמשכת בשירות היעד (למשל, ה-Vector DB למטה). במקרה כזה, אין טעם לנסות שוב ושוב ולהיכשל מיליון פעם בשנייה. זה רק יעמיס עוד יותר.

אנחנו משתמשים ב-Pattern שנקרא Circuit Breaker:

1. **סגור (רגיל):** הכל עובד, בקשות עוברות.

2. **פתוח (תקלה):** אחרי 5 כישלונות רצופים, המפסק "קופץ". אנחנו מפסיקים לנסות לשלוח בקשות ל-DB למשך דקה, כדי לתת לו להתאושש.

3. **חצי-פתוח (בדיקה):** אחרי דקה, אנחנו מנסים בזהירות בקשה אחת. אם היא מצליחה - סוגרים את המפסק וחוזרים לשגרה.



**קוד: Consumer חכם עם Backoff**

להלן,דוגמה לקוד Python שקורא מ-Kafka ומטפל בכישלונות בצורה חכמה:

python

import time

from kafka import KafkaConsumer

from kafka.errors import KafkaError

# Exponential Backoff Strategy Pattern

def process_message_with_retry(msg, retries=3):

attempt = 0

backoff = 1  # Start with 1 second wait



while attempt < retries:

try:

# Attempt to update the Vector DB or Model

update_vector_store(msg.value)

return True  # Success



except Exception as e:

attempt += 1

print(f"Error processing message: {e}. Retrying in {backoff}s...")

# Wait before retrying to let the system recover

time.sleep(backoff)

backoff *= 2  # Exponential backoff (1s, 2s, 4s...)



# If we failed after all retries, send to Dead Letter Queue (DLQ)

# This prevents data loss without blocking the pipeline forever

send_to_dlq(msg)

return False

הלוגיקה הזו קריטית. בלי time.sleep, הלולאה תרוץ מיליון פעם בשנייה ותהרוג את המעבד. בלי DLQ, נאבד מידע לנצח.



**איור 4.4: מעגל הטיפול בעומס (Load Handling Logic)**

<img src="/Data-Engineering-for-AI-Systems/assets/image-16.png" alt="image-16.png" width="697" height="465" />


התרשים מציג מערכת צינורות שממחישה את שני המנגנונים שעליהם דיברנו:** Backpressure** (הגנה מעומס) ו-**Retry** (טיפול בכישלון).

1. **הכניסה (Input):** צינור עבה שמכניס זרם חזק של מים (Data).

2. **השסתום (Backpressure Valve):** שסתום חכם שיושב על הצינור הנכנס. מד הלחץ עליו מראה שהמערכת עמוסה (באזור האדום), ולכן השסתום חצי-סגור כדי להאט את הזרימה.

3. **המשאבה (Consumer):** עובדת במלוא הכוח כדי לעבד את המים.

4. **היציאה הצדדית (Retry/DLQ):** צינור קטן שיוצא מהמשאבה ומוביל מים "פגומים" (שגיאות) לתוך מיכל צדדי שכתוב עליו "Retry Bucket".



## מעבדה וטבלת החלטות (Lab & Decision Matrix)

התיאוריה ברורה: Batch הוא איטי מדי, Streaming הוא הפתרון ל-Real-Time. עכשיו נראה איך בונים את זה בפועל ב-Repo שלנו, ונבין מתי לא כדאי להשתמש בסטרימינג.

**מעבדה: בניית Stream Validation Pipeline**

במעבדה הזו נדמה סביבת Kafka מלאה (באמצעות הקונטיינר שהרמנו בפרק 2) ונכתוב Consumer שמאמת את נתוני התנועה בזמן אמת.

**שלב 1: הכנת הסביבה** 
ודאו שקונטיינר ה-Kafka רץ. בטרמינל בתיקיית הפרויקט:

bash

docker compose -f docker/foundation/docker-compose.yml up -d kafka

צרו תיקייה לפרק 4 וסקריפטים חדשים:

bash

mkdir -p chapter-04-streaming/src

cd chapter-04-streaming

touch requirements.txt src/traffic_consumer.py src/traffic_producer_mock.py

בקובץ requirements.txt:

text

kafka-python-ng>=2.2.0

pydantic>=2.7.0

(התקינו עם pip install -r requirements.txt).



**שלב 2: כתיבת ה-Consumer (הלב של המערכת)** 
ה-Consumer הזה יקרא הודעות מ-Topic בשם traffic_updates, יאמת אותן מול החוזה שיצרנו בפרק 3, וידפיס רק את ההודעות התקינות.

העתק את הקוד המצורף לקובץ: src/traffic_consumer.py

python

import json

from kafka import KafkaConsumer

from pydantic import ValidationError

# Import the contract from Chapter 3 (make sure path allows this import)

# For simplicity in this lab, we redefine the minimal model here or assume it's available

from pydantic import BaseModel, Field

class TrafficUpdate(BaseModel):

segment_id: str

current_speed: float = Field(ge=0, le=200)

def start_consumer():

print("--- Starting Traffic Consumer (Waiting for data...) ---")

consumer = KafkaConsumer(

'traffic_updates',

bootstrap_servers=['localhost:9092'],

auto_offset_reset='earliest',

value_deserializer=lambda x: json.loads(x.decode('utf-8'))

)

for message in consumer:

try:

# 1. Validation in Motion

data = TrafficUpdate(**message.value)**



# 2. Business Logic (e.g., detect congestion)

status = "CONGESTED" if data.current_speed < 20 else "FREE"



print(f"[STREAM] Processing: {data.segment_id} | Speed: {data.current_speed} -> Status: {status}")

except ValidationError as e:

# 3. Error Handling (Log & Skip)

print(f"[ERROR] Malformed data skipped: {message.value} | Reason: {e}")

except Exception as e:

print(f"[SYSTEM ERROR] {e}")

if __name__ == "__main__":

start_consumer()

שלב 3: הפעלת הזרם (Producer Mock) 
כדי שיהיה לנו מה לצרוך, נכתוב סקריפט פשוט ש"יורה" נתונים ל-Kafka. 
העתק את הקוד המצורף לקובץ: src/traffic_producer_mock.py

python

import json

import time

import random

from kafka import KafkaProducer

producer = KafkaProducer(

bootstrap_servers=['localhost:9092'],

value_serializer=lambda x: json.dumps(x).encode('utf-8')

)

segments = ["hwy-01", "hwy-02", "urban-05", "urban-09"]

print("--- Sending Traffic Events ---")

try:

while True:

data = {

"segment_id": random.choice(segments),

"current_speed": round(random.uniform(-10, 120), 1) # Note: -10 is invalid!

}

producer.send('traffic_updates', value=data)

print(f"Sent: {data}")

time.sleep(1) # Simulate real-time stream

except KeyboardInterrupt:

print("Stopped.")



**הוראות הפעלה:**

1. הריצו טרמינל אחד עם python src/traffic_consumer.py.

2. הריצו טרמינל שני עם python src/traffic_producer_mock.py.

3. תראו בטרמינל הראשון איך המידע השגוי (מהירות שלילית) נזרק בזמן אמת, והמידע התקין מעובד מיידית.

**עץ ההחלטות: Batch vs. Stream vs. Hybrid**

לא כל דבר צריך Kafka. סטרימינג הוא יקר יותר לתחזוקה ומורכב יותר לדיבוג. מתי משתמשים במה?

<div dir="rtl">

| **שיקול (Dimension)** | **Batch (Postgres/S3)** | **Streaming (Kafka)** | **Hybrid (Lambda/Trigger)** |
| --- | --- | --- | --- |
| **דרישת Latency** | דקות עד שעות (DWH) | שניות בודדות (RAG, Fraud) | כמעט זמן אמת (Event-Driven) |
| **נפח (Volume)** | ענק (TBs), עיבוד זול | גבוה, אבל יקר לשמירה | נמוך-בינוני |
| **עלות תשתית** | נמוכה ($) | גבוהה ($$$) - דורש שרתים 24/7 | בינונית ($$) |
| **מורכבות קוד** | נמוכה (SQL) | גבוהה (State, Windowing) | בינונית (Serverless) |
| **דוגמה ב-AI** | אימון מודל (Fine-tuning) | עדכון Vector Store בזמן אמת | הפעלת Agent כשקובץ עולה |

</div>

**כלל האצבע:** אם הלקוח יכול לחכות לבוקר - תעשו Batch. אם הלקוח צריך תשובה עכשיו והמידע משתנה כל דקה - אתם חייבים Streaming.



**איור 4.5: עץ החלטה לארכיטקטורת נתונים (Data Architecture Decision Tree)**

התרשים הוא עץ החלטה (Flowchart) פשוט:
<img src="/Data-Engineering-for-AI-Systems/assets/image-17.png" alt="image-17.png" width="697" height="465" />


1. **השאלה הראשונה (שורש):** "Do you need < 1 minute latency?"

 - **No:** חץ שמאלה לריבוע כחול: Batch (Airflow/DB).

 - **Yes:** חץ ימינה לשאלה הבאה.

2. **השאלה השנייה:** "Is data volume massive (>10k events/sec)?"

 - **Yes:** חץ למטה לריבוע כתום: Streaming (Kafka).

 - **No:** חץ ימינה לריבוע ירוק: Hybrid (Triggers/Queues).


