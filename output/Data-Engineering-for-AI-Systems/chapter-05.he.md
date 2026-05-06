# פרק 5: LLMOps כהנדסת נתונים

**המטרה:** להבין שמודל שפה הוא לא סתם עוד "Microservice", וללמוד איך לנהל את מחזור החיים שלו (Lifecycle) כמו שמנהלים דאטה: עם גרסאות, מדידות ובקרה.

## מה זה LLMOps ולמה זה לא "עוד DevOps"

בצוותי פיתוח מסורתיים, יש הנחת יסוד חזקה:** הקוד הוא דטרמיניסטי**. אם לא שינינו את הקוד (git diff ריק), והסביבה זהה - התוכנה תתנהג בדיוק אותו הדבר. לכן, DevOps קלאסי מתמקד בבניית Artifacts (כמו Docker Image) ופריסה שלהם.

במערכות AI, ההנחה הזו מתרסקת. 
ב-LogiSmart, המערכת נשברה ביום שלישי בבוקר, למרות שאף מפתח לא דחף שורת קוד אחת בשבוע האחרון. הסיבה? OpenAI עדכנו את מודל gpt-4 ב-Backend, או שמישהו בצוות המוצר שינה מילה ב-System Prompt דרך ממשק הניהול.

**LLMOps** הוא הדיסציפלינה שמנהלת את החלקים **ההסתברותיים** (Probabilistic) של המערכת. זהו המעבר מניהול "קוד" לניהול "התנהגות".

**ארבעת עמודי הגרסאות (The Four Pillars of Versioning)**

ב-DevOps רגיל אנחנו מנהלים גרסאות של הקוד. ב-LLMOps, כדי לשחזר באג או להבין למה ה-Agent התחיל לקלל נהגים, אנחנו חייבים לנהל גרסאות של ארבעה רכיבים במקביל:

1. **המודל (Model Version):** האם אנחנו רצים על gpt-4-0613 או gpt-4-turbo-preview? כל גרסה מתנהגת אחרת.

2. **הפרומפט (Prompt Version):** פרומפט הוא לא קונפיגורציה, הוא קוד. שינוי של "היה מנומס" ל"היה תכליתי" משנה את כל הלוגיקה.

3. **הדאטה (Data/Context Version):** איזה מסמכים היו ב-Vector Store בזמן הריצה? (זה בדיוק מה שפתרנו בפרק 3 ו-4).

4. **הכלים (Tools Definition):** הסכמה של הפונקציות שהמודל יכול לקרוא להן (למשל update_route).

אם אחד מאלה משתנה בלי מעקב, המערכת שלכם היא קופסה שחורה לא יציבה.

**הערכה מתמשכת (Continuous Evaluation)**

ההבדל השני הוא בבדיקות. בתוכנה רגילה יש Unit Tests בינאריים: assert 2 + 2 == 4.

ב-AI, הטסט הוא: "האם התשובה הייתה מועילה?". אין כאן True/False מוחלט.

במקום Unit Tests, אנחנו בונים **Evals**:

- **מבחני רגרסיה (Regression Tests):** מריצים סט של 100 שאלות קבועות ("איך מגיעים לרחוב הרצל?") ובודקים שהציון הממוצע של התשובות לא ירד.

- **בדיקות A/B:** מפנים 5% מהנהגים לגרסת Prompt חדשה ובודקים האם כמות התלונות ירדה.

ב-LogiSmart למדנו את זה בדרך הקשה: עדכון "קטן" בפרומפט שנועד לשפר את הנימוס, גרם למודל להפסיק להוציא פלטים בפורמט JSON תקין. בלי מערכת Evals אוטומטית, גילינו את זה רק כשהמשאיות כבר היו תקועות.

<img src="/Data-Engineering-for-AI-Systems/assets/image-18.png" alt="image-18.png" width="668" height="446" />

**איור 5.1: מעגל החיים של LLMOps**

התרשים מציג לולאת אינסוף (Infinity Loop) המורכבת משני מעגלים מחוברים:

1. **המעגל השמאלי (Development):**

Prompt Engineering -> Selection (Model) -> **Evaluation** (Offline).

2. **המעגל הימני (Production):**

Deployment -> Monitoring -> **Evaluation (Online/User Feedback)** -> Logging.

3. **במרכז החיבור:** ה-Model Registry וה-Prompt Registry שמשמשים כ"אמת הארגונית".

## פרומפטים והקשר כדאטה (Prompts & Context as Data)

ברוב הארגונים ב-2024, הפרומפטים היו קבורים בתוך הקוד, בקבצי f-string ענקיים:

Python

# Bad Practice: Hardcoded prompt inside logic

prompt = f"You are a helpful assistant. Here is the context: {context}. User question: {question}"

ב-2026, הבנו שזו טעות אסטרטגית**. פרומפט הוא דאטה**, לא לוגיקה. הוא משתנה בקצב מהיר יותר מהקוד (פעמים ביום מול פעמים בשבוע), ומנוהל על ידי אנשים שונים (Product Managers, Data Scientists) ולא רק על ידי מהנדסי Backend.

ב-LogiSmart, כשהפרדנו את הפרומפטים מהקוד לתוך מערכת ניהול (Prompt Registry), קיבלנו שלושה יתרונות מיידיים:

1. **ניהול גרסאות (Versioning):** יכולנו לחזור לפרומפט שעבד אתמול ("v12.4") כשגרסה v12.5 התחילה להזות.

2. **בדיקות A/B:** יכולנו להריץ ניסוי: חצי מהנהגים קיבלו הנחיה "היה קצר ותכליתי", וחצי קיבלו "הסבר את השיקולים". גילינו שהנהגים העדיפו את הגרסה הקצרה ב-80%.

3. **הזרקת הקשר מנוהלת (Managed Context Injection):** במקום "לדחוף הכל", הגדרנו מדיניות ברורה - מה מותר להכניס לפרומפט (מידע תפעולי) ומה אסור (פרטי אשראי של הלקוח).

**תבניות פרומפט (Prompt Templates)**

הכלי המרכזי שלנו הוא **Jinja2** (או המקבילה ב-LangChain). הפרומפט הוא לא מחרוזת, אלא תבנית עם משתנים מוגדרים היטב:

Python

# Good Practice: External template with variables

PROMPT_TEMPLATE_V2 = """

Role: You are a logistics coordinator for LogiSmart.

Tone: Concise, professional, urgent.

Context:

- Current Location: {{ driver_location }}

- Traffic Status: {{ traffic_condition }}

- Delivery Window: {{ delivery_time_window }}

Task:

Analyze the route to {{ destination }} and recommend an alternative if delay > 15 mins.

"""

התבנית הזו מאוחסנת בנפרד (ב-DB או בקובץ YAML), והקוד רק "ממלא את החסר" בזמן ריצה. זה מאפשר למנהל המוצר לשנות את ה-Tone מ-"Urgent" ל-"Polite" בלי לפתוח PR ולחכות ל-Deploy.

**ניהול הקשר (Context Policy)**

לא כל דאטה ראוי להיכנס לפרומפט. ב-LogiSmart גילינו שמודלים מתבלבלים כשיש יותר מדי מידע ("Lost in the Middle"). 
לכן, הגדרנו מדיניות הקשר:

1. **Relevance:** רק מידע מ-30 הדקות האחרונות נכנס (תודה לפרק 3 ו-4).

2. **Safety:** מספרי טלפון וכתובות פרטיות עוברים מיסוך (Masking) לפני שהם מוזרקים לתבנית.

3. **Token Budget:** אנחנו מקצים תקציב קשיח (למשל, 2000 טוקנים) להקשר. אם יש יותר מידע, אנחנו מבצעים סיכום (Summarization) או חיתוך (Truncation) חכם, ולא נותנים למודל לקרוס.



<img src="/Data-Engineering-for-AI-Systems/assets/image-19.png" alt="image-19.png" width="697" height="465" />

**איור 5.2: ארכיטקטורת ניהול פרומפטים**

התרשים מציג את זרימת המידע בזמן ריצה.

1. **למעלה (Code/App):** ה-Application Logic הוא "שלד" ריק שמכיל רק את המשתנים ({{var}}).

2. **מימין (Prompt Registry):** מאגר חיצוני שמחזיק גרסאות של הטקסט (v1, v2, v3). חץ מוביל ממנו לקוד ומזריק את הטקסט הנבחר.

3. **משמאל (Context Store):** בסיס הנתונים (Vector DB) מזרים את המידע האמיתי (Driver Location).

4. **למטה (LLM):** השילוב של שלושתם (Template + Variables + Context) יוצר את ה-Final Prompt שנשלח למודל.



## ניתוב מודלים (Multi-Model Routing)

עד לא מזמן, הגישה הייתה פשוטה: "השתמש במודל הכי חזק שיש לך". ב-2026, זה כמו לנסוע עם משאית סמי-טריילר לקנות חלב במכולת. זה יקר, זה איטי, וזה מיותר.

ב-LogiSmart, גילינו ש-80% מהשאילתות הן פשוטות ("איפה המשאית שלי?"), ורק 20% דורשות הסקת מסקנות מורכבת ("איך לתכנן מסלול אופטימלי ל-50 נקודות חלוקה עם אילוצי זמן?").

לכן, בנינו שכבת Routing חכמה שמחליטה איזה מודל יטפל בכל בקשה.

**שלושת הנתיבים (The Three Lanes)**

המערכת שלנו מסווגת כל בקשה לאחד משלושה נתיבים:

1. **הנתיב המהיר (Fast & Cheap):** מודלים קטנים ויעילים (כמו GPT-4o-mini או Llama-3-8B מקומי).

- **מתי:** שאלות עובדתיות פשוטות ("מה הסטטוס של הזמנה 123?"), סיכום טקסטים קצרים, מיצוי ישויות (Entity Extraction).

- **העלות:** זניחה. ה-Latency: מילישניות.

2. **הנתיב החכם (Reasoning):** מודלים כבדים (כמו GPT-5-preview או Claude 3.5 Opus).

- **מתי:** תכנון מורכב, כתיבת קוד, ניתוח משפטי של חוזים, או כשהנתיב המהיר נכשל.

- **העלות:** גבוהה ($30 למיליון טוקנים). ה-Latency: שניות ארוכות.

3. **הנתיב הארוך (Context-Heavy):** מודלים עם חלון הקשר עצום (כמו .Gemini).

- **מתי:** ניתוח מסמכים שלמים (ספר נהג של 500 עמודים), חיפוש במאגרי ידע עצומים ללא RAG.

**קוד: הראוטר הפשוט (The Simple Router)**

במקום להסתמך על תחושת בטן, כתבנו פונקציה פשוטה שמקבלת החלטה בזמן אמת:

python

def route_query(query: str, context_length: int, budget: float) -> str:

"""

Decides which model to call based on query complexity & constraints.

"""

# Heuristic 1: If context is huge, use Gemini

if context_length > 100_000:

return "gemini-1.5-pro"



# Heuristic 2: If query implies complex reasoning (keywords)

complex_keywords = ["plan", "schedule", "optimize", "analyze strategy"]

if any(k in query.lower() for k in complex_keywords):

return "gpt-5-preview"  # The Reasoner

# Default: The cheap workhorse

return "gpt-4o-mini"

הפונקציה הזו חסכה ל-LogiSmart כ-60% מעלויות הענן בחודש הראשון להפעלתה. ה-Agent פשוט הפסיק "לחשוב יותר מדי" על שאלות פשוטות.

<img src="/Data-Engineering-for-AI-Systems/assets/image-20.png" alt="image-20.png" width="697" height="465" />

**איור 5.3: ארכיטקטורת הניתוב החכם**

התרשים מציג צומת T (או צומת מפוצל לשלושה נתיבים).

1. **למטה (כניסה):** מכוניות (Queries) מגיעות לצומת. שלט גדול כתוב עליו "Router Logic".

2. **נתיב שמאלי (ירוק):** כתוב עליו "Fast Lane (Llama/Mini)". מכוניות קטנות ומהירות נוסעות שם.

3. **נתיב אמצעי (סגול):** כתוב עליו "Reasoning Lane (GPT-5)". משאיות כבדות (משימות מורכבות) נוסעות לאט ובזהירות.

4. **נתיב ימני (כחול):** כתוב עליו "Context Lane (Gemini)". רכבת ארוכה מאוד (מסמכים ארוכים) עוברת שם.

## יסודות ה-LLM Observability

במערכות תוכנה רגילות, אם הלוגים נקיים משגיאות (ERROR 500), אנחנו מניחים שהמערכת בריאה. ב-AI, המודל יכול לפלוט שטויות מוחלטות בסטטוס HTTP 200 OK. הוא יכול להמליץ לנהג לנסוע לתוך קיר, והלוג ייראה מושלם.

לכן, LLM Observability הוא לא רק ניטור טכני (CPU/RAM), אלא ניטור איכותי והתנהגותי. אנחנו צריכים לדעת לא רק האם המודל ענה, אלא מה הוא ענה, וכמה זה עלה לנו.

**ארבעת מדדי הזהב (The Four Golden Signals of AI)**

ב-LogiSmart, הדשבורד שלנו ב-Grafana מתמקד בארבע שאלות קריטיות:

1. **איכות (Quality / Hallucination Rate):** כמה פעמים המשתמשים לחצו על "Thumps Down"? כמה פעמים ה-RAG החזיר מסמכים לא רלוונטיים (Recall נמוך)?

- **איך מודדים:** Feedback UI (כפתורי לייק/דיסלייק), ומודל "שופט" (LLM-as-a-Judge) שרץ ברקע ובודק מדגמית את התשובות.

2. **עלות (Cost per Query):** זה המדד שהכי קל לשכוח והכי כואב בכיס. שאילתה בודדת ל-GPT-4 יכולה לעלות פי 50 משאילתה ל-Llama-3.

- **איך מודדים:** ספירת טוקנים (Prompt Tokens + Completion Tokens) והכפלה במחיר המודל בזמן אמת.

3. **ביצועים (Latency / Time-to-First-Token):** כמה זמן המשתמש בוהה במסך עד שהמילה הראשונה מופיעה? בשיחות צ'אט, כל שנייה מעבר ל-2 שניות מרגישה כמו נצח.

- **איך מודדים:** מדידה בצד הלקוח ובצד השרת.

4. **שימוש במידע (Context Usage):** האם המודל באמת השתמש במסמכים ששלפנו לו ב-RAG? או שהוא התעלם מהם וענה מהראש?

- **איך מודדים:** מדד RAGAS שנקרא "Faithfulness" או "Context Relevance".



**חיבור ל-Prometheus**

כדי לראות את זה בזמן אמת, אנחנו לא זורקים לוגים ל-Elasticsearch (יקר ואיטי), אלא חושפים מטריקות ל-Prometheus. הקוד שלנו נראה כך:

Python

from prometheus_client import Counter, Histogram

# Metric definitions

TOKENS_USED = Counter('llm_tokens_total', 'Total tokens consumed', ['model_name', 'type'])

LATENCY = Histogram('llm_request_duration_seconds', 'Request latency', ['model_name'])

COST = Counter('llm_cost_usd_total', 'Estimated cost in USD', ['model_name'])

def log_llm_call(model: str, prompt_tokens: int, completion_tokens: int, duration: float):

TOKENS_USED.labels(model_name=model, type='prompt').inc(prompt_tokens)

TOKENS_USED.labels(model_name=model, type='completion').inc(completion_tokens)

LATENCY.labels(model_name=model).observe(duration)



# Simple cost calculation (example rates)

rate_input = 0.03 if 'gpt-4' in model else 0.001

rate_output = 0.06 if 'gpt-4' in model else 0.002

cost = (prompt_tokens * rate_input + completion_tokens * rate_output) / 1000

COST.labels(model_name=model).inc(cost)

בזכות הקוד הזה, מנהל המוצר יכול לפתוח Grafana ולראות גרף: "בשעה 14:00 העברנו את הראוטר ל-GPT-5, והעלות קפצה פי 3, אבל ה-Latency עלה רק ב-20%". זו תובנה ששווה זהב.



**איור 5.4: דשבורד LLM Observability**

<img src="/Data-Engineering-for-AI-Systems/assets/image-21.png" alt="image-21.png" width="698" height="465" />


התרשים מציג מסך מחשב עם דשבורד Grafana המכיל 4 פאנלים (Panels):

1. **למעלה משמאל (גרף קווי):** עלות לשעה ($). קו אדום ותלול המטפס כלפי מעלה ומצביע על זינוק פתאומי בהוצאות הענן.

2. **למעלה מימין (גרף עמודות):** צריכת טוקנים לפי מודל. העמודות מציגות את החלוקה בין המודל היקר (GPT-5 בירוק) למודל הזול (Llama-3 בכחול).

3. **למטה משמאל (מפת חום):** זמני תגובה (Latency P99). הכתמים הכהים במפה התרמית חושפים את "צווארי הבקבוק" וההאטות בשעות העומס.

4. **למטה מימין (מד מחוג):** אחוז ההזיות (Hallucination Rate). המחוג מצביע על האזור הירוק והבטוח, מה שמעיד על אמינות גבוהה של המודל.



## מעבדה ותבניות (Lab & Templates)

במעבדה הזו נבנה Smart LLM Wrapper: מחלקה אחת שעוטפת את הקריאה למודל ומוסיפה לה באופן אוטומטי שתי יכולות על:

1. **Observability:** כל קריאה נרשמת ללוגים ולמטריקות (כמו שראינו ב-5.4).

2. **Routing:** בחירה דינמית של המודל לפי אורך הקלט והמורכבות.

**שלב 1: הכנת הסביבה** 
בטרמינל בתיקיית הפרויקט:

bash

mkdir -p chapter-05-llmops/src

cd chapter-05-llmops

touch requirements.txt src/llm_wrapper.py src/demo_routing.py

בקובץ requirements.txt:

text

openai>=1.12.0

prometheus-client>=0.19.0

python-dotenv>=1.0.0

(התקינו עם pip install -r requirements.txt).

**שלב 2: כתיבת המעטפת (The Wrapper)** 
במקום לקרוא ישירות ל-client.chat.completions.create בכל מקום בקוד, נשתמש במחלקה המרכזית הזו.

הוסף קובץ: src/llm_wrapper.py

python

import time

import logging

from typing import Optional

from prometheus_client import Counter, Histogram

# Observability Metrics

TOKENS = Counter('llm_tokens_total', 'Tokens used', ['model', 'type'])

LATENCY = Histogram('llm_latency_seconds', 'Call duration', ['model'])

class SmartLLM:

def __init__(self, api_key: str = "mock-key"):

self.api_key = api_key

# In a real app, initialize OpenAI client here



def _route_request(self, prompt: str) -> str:

"""

Simple Routing Logic:

- Long context (>500 chars) -> gpt-4-turbo

- Keywords 'plan/strategy' -> gpt-4-turbo

- Default -> gpt-3.5-turbo (Cheap)

"""

if len(prompt) > 500 or "plan" in prompt.lower():

return "gpt-4-turbo"

return "gpt-3.5-turbo"

def generate(self, prompt: str) -> str:

start_time = time.time()



# 1. Routing

model = self._route_request(prompt)



# 2. Mock API Call (Simulate Latency)

# In production: response = client.chat.completions.create(...)

time.sleep(0.5 if "gpt-3.5" in model else 1.5)



# 3. Calculate Metrics

duration = time.time() - start_time

prompt_tokens = len(prompt) // 4

completion_tokens = 50 # Mock output length



# 4. Observability Logging

LATENCY.labels(model=model).observe(duration)

TOKENS.labels(model=model, type="input").inc(prompt_tokens)

TOKENS.labels(model=model, type="output").inc(completion_tokens)



logging.info(f"LLM Call | Model: {model} | Cost: ${self._estimate_cost(model, prompt_tokens, completion_tokens):.4f}")



return f"Response from {model}"

def _estimate_cost(self, model, input_tok, output_tok):

# 2026 pricing estimation

rates = {

"gpt-4-turbo": {"in": 0.01, "out": 0.03},

"gpt-3.5-turbo": {"in": 0.0005, "out": 0.0015}

}

r = rates.get(model, rates["gpt-3.5-turbo"])

return (input_tok * r["in"] + output_tok * r["out"]) / 1000



שלב 3: הרצת הדגמה (Routing Demo) 
נכתוב סקריפט שבודק איך הראוטר מתנהג עם שאלות שונות.

נוסיף קובץ: src/demo_routing.py

Python

import logging

from llm_wrapper import SmartLLM

# Configure logging to see the output

logging.basicConfig(level=logging.INFO, format='%(message)s')

def run_demo():

llm = SmartLLM()



print("--- Test 1: Simple Query ---")

# Should route to cheap model

llm.generate("Hello, who are you?")



print("\n--- Test 2: Complex Planning ---")

# Should route to expensive model due to keyword 'plan'

llm.generate("Please plan a strategic route for 50 trucks across Europe.")



print("\n--- Test 3: Long Context ---")

# Should route to expensive model due to length

long_prompt = "Context: " + ("data " * 200) + " Question: Summary?"

llm.generate(long_prompt)

if __name__ == "__main__":

run_demo()

**הוראות הפעלה:**

bash

python src/demo_routing.py

בפלט תראו בבירור איך המערכת בוחרת מודלים שונים ומחשבת עלויות שונות לכל קריאה.

**תבנית: טבלת הערכה (Eval Dataset Template)**

כדי למדוד אם המודל שלנו משתפר או מתדרדר, אנחנו לא יכולים להסתמך על "תחושת בטן". אנחנו צריכים **Golden Dataset**: אוסף קבוע של שאלות ותשובות נכונות, שמשמש כסרגל המדידה שלנו.

הטבלה הזו (שיכולה להיות CSV, Excel, או טבלה ב-HuggingFace Dataset) היא המקור לאמת הארגונית.

**מבנה הטבלה והשימוש בה**

<div dir="rtl">

| **עמוד**ה | **הסבר** | **שימוש בבדיקה (Test)** |
| --- | --- | --- |
| **ID** | מזהה ייחודי | למעקב אחר באגים (למשל: "Test #42 נכשל"). |
| **Category** | סוג השאלה | מאפשר לנתח איפה המודל חלש (למשל: "הוא מעולה בעובדות, אבל גרוע בתכנון מסלול"). |
| **User Prompt** | הקלט למערכת | השאלה המדויקת שהמשתמש שואל. |
| **Context (RAG)** | המידע שנשלף | מה ה-Retriever הביא? (חשוב כדי לבודד אם הבעיה במודל או בחיפוש). |
| **Reference Answer** | התשובה הנכונה | למה אנחנו משווים את פלט המודל? ("תל אביב", "סרב לבקשה"). |
| **Metric** | איך לבדוק? | האלגוריתם שירוץ: האם מחפשים מילה מדויקת? או דמיון סמנטי? |

</div>

**איך מריצים את הבדיקה? (Eval Loop)**

הטבלה הזו היא הקלט לסקריפט הערכה שרץ ב-CI/CD. הנה הפסאודו-קוד של התהליך:

1. **טען:** קרא את קובץ ה-CSV.

2. **רוץ:** עבור כל שורה, שלח את ה-User Prompt למערכת ה-LLM שלך וקבל תשובה (Actual Output).

3. **השווה:** השתמש ב-Metric כדי להשוות בין ה-Actual Output ל-Reference Answer.

 - **Exact Match:** האם המחרוזת זהה? (1 או 0).

 - **Semantic Similarity:** השתמש ב-Embedding כדי למדוד קרבה וקטורית (ציון 0.0-1.0).

 - **LLM-as-a-Judge:** שלח את שתי התשובות ל-GPT-4 ובקש ממנו לתת ציון.

דוגמה ללוגיקה ב-Python:

Python

import pandas as pd

from sentence_transformers import SentenceTransformer, util

# Load a lightweight model for semantic similarity checks

eval_model = SentenceTransformer('all-MiniLM-L6-v2')

def evaluate_dataset(csv_path="golden_dataset.csv"):

df = pd.read_csv(csv_path)

results = []

for index, row in df.iterrows():

# 1. Run the system (Our LLM Wrapper)

# Note: 'my_llm_system' should be an instance of SmartLLM

actual_response = my_llm_system.generate(row['User Prompt'])



# 2. Calculate score based on the defined metric

score = 0

if row['Metric'] == 'Exact Match':

# Strict check: 1 if expected text is present, else 0

score = 1 if row['Expected Answer'] in actual_response else 0



elif row['Metric'] == 'Semantic Similarity':

# Soft check: Convert both texts to vectors and compute cosine similarity

embeddings = eval_model.encode([actual_response, row['Expected Answer']])

score = util.cos_sim(embeddings[0], embeddings[1]).item()



results.append({'id': row['ID'], 'score': score, 'actual': actual_response})

# Summary: Calculate average score across the dataset

avg_score = sum(r['score'] for r in results) / len(results)

print(f"Final Evaluation Score: {avg_score:.2f}")

כך אנחנו הופכים איכות למספר מדיד. אם הציון יורד מתחת ל-0.85, ה-Build נכשל ואנחנו יודעים שמשהו נשבר.

**זהו סוף פרק 5.** 
יש לנו מעטפת חכמה למודל. בפרק הבא, **פרק 6**, נצלול לעומק ה-RAG ונלמד איך לבנות מערכת אחזור מידע (Retrieval) שתזין את המודל הזה במידע איכותי.


