# פרק 8: From Single Calls to AI Workflows

מטרה: לעבור מ‑“Agent קסום” ל‑Workflows ברורים, נשלטים ומדידים.

## המהפכה השקטה: מ-Chatbot ל-Agent עובד

בשנתיים האחרונות, המונח "Agent" הפך למילת הקסם של עולם ה-AI, ובצדק. אבל השינוי הגדול הוא לא ברעש סביבו, אלא במה שקורה בשטח. עד לא מזמן, רוב השימושים ב-LLM היו פסיביים: שאלנו שאלה בצ׳ט, המודל חיפש במאגר הידע (RAG), וענה תשובה. זה מצוין כדי להבין מה קרה, אבל זה לא פותר את הבעיה. המשתמש עדיין היה צריך לקחת את התשובה, לפתוח מערכת אחרת, ולבצע את הפעולה ידנית.

המעבר ל-Agents מייצג שינוי תפיסתי עמוק: המודל מפסיק להיות רק "יועץ חכם" והופך להיות **עובד שמבצע פעולות**. 
במקום רק להגיד "המשלוח מתעכב", ה-Agent נכנס לתפקיד אקטיבי: הוא ניגש ל-API של חברת השילוח, מעדכן את הסטטוס במערכת התפעולית, ואם צריך - שולח הודעת SMS ללקוח. הכל קורה כחלק מאותו תהליך שיחה רציף.

**למה זה קורה דווקא עכשיו?** 
שלושה גורמים הבשילו במקביל והפכו את ה-Agents מניסוי מעבדה לפתרון Production אמין:

1. **יכולת תכנון (Reasoning):** המודלים החדשים יודעים לפרק משימה מורכבת ("טפל בעיכוב") לסדרת צעדים לוגיים ("בדוק סטטוס" ← "אם > 5 ימים, שלח הודעה" ← "עדכן CRM").

2. **קריאה לכלים (Tool Use / Function Calling):** המודלים למדו לדבר "שפת מכונה" - להוציא פלט JSON מדויק שמפעיל פונקציות בקוד, במקום רק לפלוט טקסט חופשי.

3. **מסגרות עבודה (Frameworks):** ספריות כמו LangGraph ו-AutoGen נותנות לנו היום תשתית לניהול ה-State (זיכרון) והזרימה של ה-Agent, מה שהופך את הפיתוח ליציב וניתן לתחזוקה.

**ב-LogiSmart:** 
התחלנו עם בוט פשוט שענה לנציגי שירות איפה נמצאת החבילה. 
היום, המערכת שלנו היא Workflow אוטונומי: כשהיא מזהה עיכוב, היא לא מחכה שנציג ישאל. היא יוזמת בדיקה מול הספק, מעדכנת את צפי ההגעה במערכת, ואם האיחור קריטי - היא אפילו מכינה טיוטת זיכוי לאישור המנהל. 
המעבר הזה - מ "LLM שעונה" ל "תהליך שמבצע" - הוא הליבה של פרק זה.



<img src="/Data-Engineering-for-AI-Systems/assets/image-29.png" alt="image-29.png" width="697" height="465" />

**איור 8.1: המעבר מ-Chatbot פסיבי ל-Agent אקטיבי**

האיור ממחיש את ההבדל הארכיטקטוני בין שני המצבים:

- **צד ימין (Passive Chatbot):** משתמש שואל "איפה החבילה?" ← המודל שולף מידע (Read Only) ← עונה "בחיפה". המעגל נסגר, שום דבר לא השתנה במערכות הארגון.

- **צד שמאל (Active Agent Workflow):** אירוע "עיכוב" מזוהה ← ה-Agent מתכנן צעדים ← מפעיל כלי Update_DB (Write) ← מפעיל כלי Send_SMS (Action) ← מדווח "טופל". החצים מראים השפעה דו-כיוונית על העולם החיצון.



## Workflows vs. Monolithic Agents

כמעט כל צוות פיתוח מתחיל באותו מקום: החלום על "Agent אחד סופר חכם" (Monolithic Agent).

הרעיון מפתה בפשטותו: ניקח מודל חזית (Frontier Model) מהדור החדש, בעל יכולות הסקה גבוהות (High Reasoning Capabilities), נחבר לו 20 כלים שונים (גישה ל DB, שליחת מייל, חיפוש ב Slack), וניתן לו פרומפט ענק: "אתה העוזר הלוגיסטי שלנו. תפתור כל בעיה שתגיע."

**למה זה נכשל ב-Production?** 
בתיאוריה, זה עובד. בפועל, גם המודלים החזקים ביותר ("SOTA Models") מתחילים להתפזר ככל שהמשימות מסתבכות:

1. **קוגניטיבית:** המודל מתבלבל בין כלים דומים (למשל update_customer מול update_order).

2. **לוגית:** הוא עלול לבצע פעולות בסדר לא הגיוני (לשלוח הודעת "טופל" לפני שבאמת עדכן את מסד הנתונים).

3. **תחזוקתית:** קשה מאוד לתקן באג. אם המודל טעה בשיקול דעת, אין "שורת קוד" לתקן, אלא רק לנסות לשפר את הפרומפט ולקוות לטוב.

**הפתרון: פירוק ל-Workflows (זרימות עבודה)** 
במקום Agent אחד שעושה הכל, ארגונים עוברים לארכיטקטורה של **Agentic Workflows**: תהליכים מובנים שבהם ה-AI הוא רק "מנוע החלטות" בצמתים ספציפיים. 
במקום להגיד למודל "תפתור את הבעיה", אנחנו מגדירים גרף זרימה (Graph):

Start → Retrieve Info → Analyze → Decide Action → Execute → Verify → End.

כל צומת בגרף הזה יכול להיות דטרמיניסטי (קוד רגיל) או אינטליגנטי (AI-driven), תלוי במה שנדרש.

השוואה:** Agent** מונוליטי מול **Workflow** מובנה

**השוואה: Agent מונוליטי מול Workflow מובנה**

<div dir="rtl">

| **מאפיין** | **Monolithic Agent** | **Agentic Workflow** |
| --- | --- | --- |
| **מבנה** | לולאה אחת גדולה (Loop) | גרף מודולרי של צעדים (Nodes & Edges) |
| **קבלת החלטות** | המודל מחליט על כל הצעדים לבד | המודל מחליט רק בצמתים מוגדרים ​ |
| **שליטה (Control)** | נמוכה (קופסה שחורה) ​ | גבוהה (אפשר לאכוף חוקים בכל צעד) ​ |
| **דיבוג (Debug)** | קשה (למה הוא בחר בכלי הזה?) | קל (רואים בדיוק באיזה צעד התהליך נכשל) ​ |
| **עלות** | גבוהה (קריאות LLM מיותרות) | אופטימלית (LLM רק כשצריך) |
| **צפיות (Predictability)** | משתנה בין הרצות ​ | עקבית וניתנת לבדיקה ​ |
| **שימוש ב-LogiSmart** | בוט כללי לשאלות ותשובות | תהליך טיפול באיחורים (SLA Breach) |

</div>

**דוגמה מעשית: טיפול בעיכוב משלוח ב-LogiSmart**

ב-LogiSmart, תהליך "טיפול בעיכוב משלוח" הוא לא שיחה פתוחה, אלא Workflow מוגדר עם נקודות בקרה ברורות:

1. **Retrieve (דטרמיניסטי):** אוסף נתונים על המשלוח דרך API calls סטנדרטיים, אין כאן מעורבות AI.

2. **Reason (AI-driven):** מודל ה-AI מנתח את הסיבה לעיכוב וממליץ על פעולה: "המשאית נתקעה במכס, צריך לתאם מחדש".

3. **Plan (AI-driven):** המודל בוחר את הכלי המתאים מתוך רשימה מוגדרת (reschedule_delivery).

4. **Verify (דטרמיניסטי):** קוד validation רגיל בודק שהתאריך החדש תקין ועומד בחוקי העסק.

5. **Act (דטרמיניסטי):** ביצוע הפעולה בפועל במסד הנתונים ושליחת התראות.

כל שלב כולל audit trail מלא, fallback mechanisms למקרה של כישלון,

ונקודות human-in-the-loop בתהליכים קריטיים.

**היתרון האמיתי: הכי טוב משני העולמות**

הגישה הזו מאפשרת לנו לרתום את הגמישות של ה-AI (הבנת שפה טבעית, הסקה הקשרית, קבלת החלטות) תוך שמירה על היציבות והצפיות של תוכנה מסורתית. ארכיטקטורות היברידיות אלו הפכו לסטנדרט בארגונים שמפעילים AI בסביבות production קריטיות.

**המסקנה:** Workflows לא מגבילים את ה-AI, הם משחררים אותו לעשות בדיוק את מה שהוא הכי טוב בו, במסגרת שמבטיחה אמינות.



## כלים וחוזים לביצוע פעולות (Tools & Contracts for Actions)

לפני שנצלול לקוד ולסכימות, בואו נדבר רגע על המושג הבסיסי הזה שכולם זורקים לאוויר: "כלי" (Tool).

תחשבו על המודל (ה-LLM) כמו על **מוח בצנצנת**. 
הוא סופר חכם, הוא קרא את כל האינטרנט, הוא יודע לכתוב שייקספיר ולפתור חידות היגיון. אבל הוא מנותק. הוא לא יודע מה השעה עכשיו, הוא לא יכול לראות מה קורה במסד הנתונים שלכם, והוא בטח לא יכול לשלוח מייל ללקוח. הוא נעול בתוך הבועה שלו.

**כלי (Tool)** הוא הדרך שלנו לתת למוח הזה **ידיים ועיניים.**

כשאנחנו נותנים ל-Agent "כלי", אנחנו בעצם מחברים אותו לפונקציה בקוד שלנו. אנחנו אומרים לו:

"שמע, אתה לא יכול לבדוק לבד איפה המשלוח, אבל בניתי לך כפתור קסם שנקרא get_delivery_status. אם תיתן לכפתור הזה מספר משלוח, אני אריץ את הבדיקה בשבילך ואחזיר לך את התשובה."

הקסם הגדול הוא שהמודל **מחליט לבד מתי ללחוץ על הכפתור**. 
אנחנו לא אומרים לו "עכשיו תפעיל את הכלי". אנחנו אומרים לו: "אתה עוזר לוגיסטי. הנה ארגז הכלים שלך. תשתמש במה שצריך כדי לפתור את הבעיה של הלקוח."

**אבל כאן מתחילה הבעיה...**

ברגע שנתתם ל"מוח בצנצנת" יכולת ללחוץ על כפתורים בעולם האמיתי, הדברים נהיים מסוכנים.

מה יקרה אם המודל יחליט (בגלל הזיה או סתם חוסר הבנה) ללחוץ על כפתור ה-refund ולזכות לקוח במיליון דולר? או למחוק משלוח פעיל?

ב-2023, רובנו פשוט זרקנו לתוך ה-System Prompt רשימה של פונקציות, הוספנו תיאור קצר בטקסט חופשי ("This tool updates the order"), וקיווינו שהמודל יבין את הרמז. בפרודקשן, "לקוות" זו לא אסטרטגיה.

היום, הכלי הוא כבר לא סתם פונקציה. הוא **חוזה מחייב** (Contract).

**מה זה אומר "חוזה"? (The MCP Mindset)**

התעשייה התחילה להתיישר סביב רעיונות כמו MCP (Model Context Protocol), אבל עזבו רגע את הסטנדרט הטכני. המהות היא המעבר מתיאור לאכיפה.

חוזה של כלי מורכב משלוש שכבות הגנה שקורות לפני שהקוד העסקי שלכם בכלל מתחיל לרוץ:

1. **הסכימה (The Schema):** לא עוד טקסט חופשי. אנחנו מגדירים בדיוק מה נכנס. אם המודל מנסה להכניס מחרוזת איפה שצריך מספר - הקריאה נחסמת מיד.

2. **הלוגיקה (The Semantics):** המודל שלח תאריך תקין טכנית? יופי. אבל האם התאריך הזה הוא בעבר? האם הוא נופל על יום שבת כשהמחסן סגור? זה המקום שבו החוזה בודק היתכנות עסקית.

3. **ההרשאות (The Permissions):** האם ל-Agent הזה מותר בכלל לגעת בכלי הזה? האם הוא מוגבל בסכום?

**הכלים של LogiSmart: דוגמאות מהשטח**

כדי להבין איך זה נראה בקוד, בואו נסתכל על שלושת הכלים הכי "רגישים" במערכת שלנו, ואיך אנחנו נועלים אותם.

1. **update_route - לא לתת למודל לשלוח נהגים לעבר**

הבעיה הקלאסית: המודל מקבל בקשה מלקוח "תקדים לי את המשלוח לאתמול". במקום להגיד שאי אפשר, הוא מנסה לקרוא לכלי עם תאריך עבר.

הפתרון שלנו הוא **Semantic Validator** פשוט ב-Pydantic:

python

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

class UpdateRouteTool(BaseModel):

shipment_id: str = Field(pattern=r"^LS-\d{4}")

new_date: datetime



@field_validator("new_date")

def date_must_be_future(cls, v):

# The model cannot "convince" the code to accept a past date

if v < datetime.now():

raise ValueError("Time travel is not supported yet. Please choose a future date.")

return v

שימו לב להודעת השגיאה. היא לא נועדה למפתח, היא נועדה למודל. כשהוא יקבל את השגיאה הזו, הוא יבין מיד (בזכות ה-Reasoning שלו) שהוא צריך לבקש תאריך חדש מהמשתמש.

2. **send_notification - למנוע ספאם והדלפות**

כלי שמאפשר ל-Agent לשלוח SMS או מייל הוא פתח לצרות. ראינו מקרים שבהם מודל נכנס ללופ ושלח ללקוח 50 הודעות "אני בודק..." תוך דקה. סיוט.

כאן החוזה כולל **Rate Limiting** ו-**PII Guard**:

הכלי בודק אוטומטית שהתוכן לא כולל מספרי אשראי או מידע רגיש, ומוודא שה-Agent לא חרג ממכסת ההודעות לדקה. אם כן? הכלי זורק שגיאה וההודעה לא יוצאת.

3. **refund - הכסף הגדול**

זה הכלי הכי מסוכן. כאן אנחנו לא סומכים על המודל ב-100% אף פעם.

הגדרנו חוק פשוט בחוזה:

- זיכוי עד $50? אוטומטי.

- זיכוי מעל $50? דורש אישור.

בקוד זה נראה כך:

python

def execute_refund(amount: float):

if amount > 50:

# Stop execution and escalate to a human

raise HumanApprovalRequired(f"Refund of ${amount} requires manager approval")



# Actual refund logic...

payment_gateway.refund(amount)

**לסיכום: גדרות טובות עושות שכנים טובים**

אל תחשבו על ה-Contracts האלה כעל "בירוקרטיה". תחשבו עליהם כעל גדר ביטחון שמאפשרת לכם לישון בלילה. ברגע שהגדרתם את הסכימות והחוקים האלה, אתם יכולים לשחרר את ה-Agent שלכם להיות יצירתי וגמיש בשיחה, כי אתם יודעים שברגע האמת - כשהוא צריך לבצע פעולה - הוא לא יוכל לשבור את המערכת.



**8.3 The Tool Guardrails Funnel**

תארו לעצמכם משפך חכם עם שלוש מסננות מגן. בחלק העליון אנחנו שופכים פנימה את כל הבקשות שהמודל שלכם מייצר - חלקן מצוינות, אבל חלקן "מלוכלכות" (תאריכים מהעבר, פרמטרים שגויים, או ניסיונות לבצע פעולות אסורות).

המשפך מעביר כל בקשה דרך שלושה שלבי סינון קפדניים:

1. **מסננת ה-Schema (כחול):** בודקת שהנתונים הם מהסוג הנכון (מספר הוא מספר, תאריך הוא תאריך).

2. **מסננת ה-Logic (ירוק):** בודקת שהבקשה הגיונית עסקית (למשל, שתאריך המשלוח הוא בעתיד).

<img src="/Data-Engineering-for-AI-Systems/assets/image-30.png" alt="image-30.png" width="697" height="465" />

3. בודקת של-Agent יש בכלל סמכות לבצע את הפעולה הזו.

רק בקשות שעברו בהצלחה את כל שלושת השלבים יוצאות מהצד השני כ"פעולות מאושרות" ונקיות שנכנסות למערכת. כל השאר נחסמות ונזרקות הצידה עוד לפני שהספיקו לגרום נזק.



## תכנן-בצע-אמת והגורם האנושי (Plan-Execute-Verify & HITL)

בעבר, הגישה הרווחת ל-Agents הייתה "שגר ושכח" (Fire and Forget). המודל החליט לשלוח מייל, הוציא פקודה ל-API, ואנחנו הנחנו שזה קרה. 
היום, בארגונים כמו LogiSmart, "תקווה" היא לא אסטרטגיה לניהול Production.

הבעיה הגדולה היא שמודלים נוטים "להזות הצלחה" (Hallucinate Success). המודל עשוי לקבל הודעת שגיאה עמומה מה-API, לפרש אותה לא נכון, ולדווח למשתמש בחגיגיות: "המשלוח עודכן בהצלחה!", בזמן שהמשאית עדיין נוסעת ליעד הישן והלא נכון.

כדי למנוע את הפדיחות האלו, אנחנו עובדים לפי תבנית ברזל שנקראת **Plan-Execute-Verify**, ומוסיפים לה "מבוגר אחראי" (Human-in-the-Loop) בצמתים קריטיים.

**התבנית: כריך הבטיחות (The Safety Sandwich)**

כל פעולה (Action) של Agent ב-LogiSmart "עטופה" בשכבות הגנה משני הצדדים. זה עובד ככה:

1. **Plan (המוח):** המודל מחליט מה לעשות. הוא בוחר כלי (update_route) ומכין את הפרמטרים.

2. **Pre-Action Check (השומר):** לפני שהקוד רץ, אנחנו בודקים בטיחות. האם הנתונים עדכניים? (אולי המשלוח בוטל לפני דקה והמודל לא יודע?). האם הפעולה מסוכנת מדי?

3. **Execute (השריר):** הקריאה בפועל ל-API או ל-DB.

4. **Verify (המבקר):** השלב הקריטי שכולם שכחו ב-2023. אנחנו לא סומכים על ה-Return Code של ה-API. אנחנו מבצעים **קריאת מצב חדשה** (Re-fetch) מהדאטהבייס כדי לוודא שהמציאות באמת השתנתה כמו שרצינו.

**Human-in-the-Loop (HITL) כברירת מחדל**

ב-LogiSmart, אנחנו לא נותנים ל-Agent "כרטיס אשראי פתוח". הגדרנו סף סיכון (Risk Threshold) לכל פעולה.

- שליחת מייל אישור? **אוטומטי.**

- זיכוי כספי מעל $500? **עצור ותבקש אישור.**

זה לא שה-Agent "מחכה על הקו" בטלפון. טכנית, המערכת מקפיאה את ה-Workflow, שומרת את המצב (State) שלו, ושולחת התראה למנהל ב-Slack: "ה-Agent רוצה לזכות את לקוח X ב-$600. לאשר או לדחות?". ברגע שהמנהל לוחץ "אשר", ה-Workflow מתעורר לחיים וממשיך בדיוק מאיפה שעצר.

**איך זה נראה בקוד?**

להלן דוגמה לפונקציה שמבצעת זיכוי בצורה בטוחה, עם כל השכבות:

python

def safe_execute_refund(agent_state, amount, order_id):

# Step 1: Pre-Check (Freshness)

current_order = db.get_order(order_id)

if current_order.status == 'REFUNDED':

return "Error: Order already refunded. Do not proceed."

# Step 2: HITL Check (Governance)

if amount > 500:

# Trigger async approval flow

approval = trigger_hitl_flow(

reason=f"High value refund: ${amount}",

approver_role="finance_manager"

)

if approval.status == 'REJECTED':

return f"Action blocked by human: {approval.reason}"

# Step 3: Execute (The Action)

try:

payment_gateway.refund(order_id, amount)

except Exception as e:

return f"Execution Failed: {str(e)}"

# Step 4: Verify (The Truth)

# CRITICAL: Do not trust the payment gateway response blindly.

# Check internal ledger to confirm the money moved.

updated_ledger = db.get_financial_record(order_id)



if updated_ledger.refund_amount != amount:

alert_devops("Critical: Phantom Refund detected!")

return "Error: Refund sent but not recorded in ledger."

return "Success: Refund processed and verified."

**למה ה-Verify כל כך חשוב? (סיפור אמיתי)**

היה מקרה מפורסם ב-2025 שבו Agent של חברת תעופה "ביטל" טיסה ללקוח. ה-API החזיר 200 OK (כי הבקשה התקבלה בתור), אבל מערכת ה-Legacy מאחורה נכשלה בביצוע הביטול בפועל. הלקוח הגיע לשדה וגילה שהטיסה קיימת, אבל הכרטיס שלו לא.

אם ה-Agent היה מבצע צעד **Verify** - כלומר, שואל את המערכת "האם הכרטיס הזה בסטטוס 'מבוטל'?" מיד אחרי הפעולה - הוא היה מגלה את הפער ומתריע לנציג אנושי.

<img src="/Data-Engineering-for-AI-Systems/assets/image-31.png" alt="image-31.png" width="426" height="693" />

**בשורה התחתונה:** סמוך על ה-AI, אבל תבדוק אותו בציציות. ואם הטעות עולה כסף אמיתי - שים בן אדם בלולאה. זו לא חולשה של המערכת, זה הפיצ'ר הכי חשוב שלה.

**8.4 The Safety Sandwich: Plan-Execute-Verify**

תחשבו על הפעולה של ה-Agent כמו על המבורגר. ה"בשר" הוא הביצוע עצמו (Execute), אבל הוא לא יכול להגיע לבד. הוא חייב להיות עטוף בשתי לחמניות עבות: מלמעלה, לחמניית ה-**Plan** והבדיקות המקדימות (האם מותר לי? האם זה בטוח?). מלמטה, לחמניית ה-**Verify** (האם זה באמת קרה?). בצד, יש "קיסם" שתוקע את הכל - זהו ה-HITL (הגורם האנושי) שמתערב רק כשהמנה "גדולה מדי" או מסוכנת.

## מעבדה מעשית: בניית סוכן אוטונומי עם מנגנון "ריפוי עצמי" (Self-Healing)

עד עכשיו דיברנו על תיאוריה: כלים, חוזים, בטיחות. עכשיו הגיע הזמן ללכלך את הידיים ולבנות את הדבר האמיתי. 
בפרק הזה, אנחנו לא נשתמש בפריימוורק כבד ו"קסום" (כמו LangChain או CrewAI) שמסתיר מכם את האמת. אנחנו נבנה מנוע Agent מאפס, בפייתון נקי, ונחבר אותו למוח אמיתי (LLM) בארכיטקטורה מודולרית.

**המשימה:** 
נבנה סוכן לוגיסטי חכם שיודע לנהל משברים בזמן אמת. 
אנחנו "נטריל" אותו בכוונה: נבקש ממנו לעדכן משלוח לתאריך עבר (פעולה אסורה). 
הסוכן יצטרך לעבור את "מסלול המכשולים" הבא:

1. **להבין (Reason):** את הבקשה שלנו בעזרת מודל שפה.

2. **לפעול (Act):** לנסות לבצע את הפעולה האסורה (כי ביקשנו).

3. **להיחסם (Fail Safe):** להיתקל בחוזה הבטיחות (Guardrail) שבנינו בקוד.

4. **לתקן (Self-Heal):** להבין את השגיאה, לחשוב מחדש, ולהציע פתרון חוקי.

**הכנת סביבת העבודה**

כדי לשמור על סדר, יצרנו תיקייה נפרדת למעבדה זו. אנחנו נבנה ארכיטקטורה של Micro-Kernel: הפרדה ברורה בין המוח (Runtime), הכלים (Tools), והמתאם למודל (Adapter).

bash

mkdir -p chapter-08-workflow/src

cd chapter-08-workflow/src

touch state.py tools.py model_adapter.py openai_adapter.py agent_runtime.py engine.py

וודאו שיש לכם מפתח API של OpenAI מוגדר בקובץ .env או בסביבה:

export OPENAI_API_KEY=sk-...



כעת, נעבור קובץ קובץ ונבנה את המנוע.

**שלב 1: הזיכרון (src/state.py)**

הדבר הראשון שכל Agent צריך זה זיכרון לטווח קצר. לא סתם רשימת טקסט, אלא מבנה נתונים שמחזיק את תמונת העולם שלו בכל רגע נתון.

העתיקו את הקוד לקובץ src/state.py:

python

# src/state.py

from typing import TypedDict, List, Optional

class AgentState(TypedDict):

"""

The brain's short-term memory.

Holds the conversation history and the structured facts we've gathered.

"""

messages: List[dict]         # The conversation log (role: user/assistant)

shipment_id: Optional[str]   # Extracted shipment ID

is_complete: bool            # Task completion flag

**שלב 2: הכלים המאובטחים (src/tools.py)**

כאן אנחנו מיישמים את "חגורת הבטיחות". נבנה כלי לעדכון מסלול (update_route), שכולל **שומר סף** (**Guardrail**) קריטי: מניעת עדכון לתאריכי עבר. זה הקוד שיגן על המערכת מפני הזיות של המודל. שימו לב לפונקציה is_error שעוזרת למנוע לזהות כישלונות.

העתיקו את הקוד לקובץ src/tools.py:

python 
# src/tools.py

from datetime import datetime

def tool_update_route(shipment_id: str, new_date: str) -> str:

"""

Safe tool with a guardrail.

Returns:

Success: ...  on success

Error: ...    on failure

"""

try:

dt = datetime.strptime(new_date, "%Y-%m-%d")

except ValueError:

return "Error: Invalid date format. Use YYYY-MM-DD."

if dt < datetime.now():

return f"Error: Date {new_date} is in the past! Time travel not allowed."

print(f"   [DB] Updating shipment {shipment_id} to {new_date}...")

return "Success: Route updated."

def registry() -> dict:

return {

"update_route": tool_update_route,

}

def is_error(result: str) -> bool:

return isinstance(result, str) and result.startswith("Error:")

**שלב 3: החיבור למודל (src/model_adapter.py ו-src/openai_adapter.py)**

במקום לקרוא ל-OpenAI ישירות מתוך המנוע (מה שינעל אותנו לספק אחד), נבנה **מתאם (Adapter).**

תחילה נגדיר את הממשק (החוזה) שהמנוע שלנו מצפה לו ב-model_adapter.py, ואז נממש אותו עבור OpenAI ב-openai_adapter.py. זה יאפשר לנו בעתיד להחליף ל-Claude או Llama בלי לשנות שורת קוד אחת במנוע.

העתיקו את הקוד לקובץ src/model_adapter.py:

Python

# src/model_adapter.py

from __future__ import annotations

from typing import Protocol, List, Dict

Message = Dict[str, str]

class ModelAdapter(Protocol):

def complete(self, messages: List[Message]) -> str:

"""

Returns model text output.

Must not raise on normal model failures, return best effort text instead.

"""

...

העתיקו את הקוד לקובץ src/openai_adapter.py:

# src/openai_adapter.py

import os

from typing import List, Dict

from openai import OpenAI

# Each message is represented as {"role": "...", "content": "..."}.

Message = Dict[str, str]

class OpenAIAdapter:

"""Adapter that wraps OpenAI Chat Completions for the workflow runtime."""

def __init__(self, model: str = "gpt-4o", temperature: float = 0.1):

# Read API key from environment to match project-wide configuration.

self.api_key = (os.getenv("OPENAI_API_KEY") or "").strip()

# Only create a client when a non-empty key is available.

self.client = OpenAI(api_key=self.api_key) if self.api_key else None

self.model = model

self.temperature = temperature

def complete(self, messages: List[Message]) -> str:

# Fail fast with valid JSON when no API key is configured.

if not self.api_key or self.client is None:

# Return valid JSON so the agent runtime can finish gracefully.

return '{"action":"finish","response":"Error: OPENAI_API_KEY environment variable is not set."}'

try:

resp = self.client.chat.completions.create(

model=self.model,

messages=messages,

temperature=self.temperature,

response_format={"type": "json_object"},

)

# Return model output as plain text; runtime parses the JSON.

return resp.choices[0].message.content or ""

except Exception:

# Return valid JSON to avoid breaking the runtime on model failures.

return '{"action":"finish","response":"Error: model call failed. Check API key and connectivity."}'

**שלב 4: המוח (src/agent_runtime.py)**

זהו הלב הפועם של המערכת. הקובץ הזה מריץ את לולאת ה-ReAct (Reason + Act). 
הוא אחראי על:

1. שליחת ההיסטוריה למודל.

2. פענוח התשובה (Parsing) - כולל מנגנון תיקון עצמי אם המודל מחזיר JSON שבור.

3. הרצת הכלים.

4. הכי חשוב: ניהול הלוגים ([Thinking], [Tool Output]) כדי שנוכל לראות את המחשבות של הסוכן בטרמינל.

העתיקו את הקוד לקובץ src/agent_runtime.py:

python

# src/agent_runtime.py

from __future__ import annotations

import json

from typing import Any, Dict, List, Optional, Tuple

from state import AgentState

from tools import registry as tool_registry, is_error as tool_is_error

from model_adapter import ModelAdapter

Message = Dict[str, str]

SYSTEM_PROMPT = """

You are a LogiSmart Logistics Agent.

You MUST output exactly one valid JSON object and nothing else.

Schema:

{

"action": "call_tool" or "finish",

"tool_name": string, only if action is call_tool

"tool_args": object, only if action is call_tool

"response": string only if action is finish

}

Rules:

1. If the user provides a specific date, ALWAYS call update_route with that exact date first.

2. If update_route returns Error, do NOT try the same date again.

3. Instead, explain the error naturally to the user (e.g., "I tried to update... but...") and ask for a valid date.

"""

def _decoder_extract_first_object(text: str) -> Optional[Dict[str, Any]]:

"""

Safer than brace counting.

Finds first JSON object and parses it using JSONDecoder.raw_decode.

"""

decoder = json.JSONDecoder()

start = text.find("{")

while start != -1:

try:

obj, _end = decoder.raw_decode(text[start:])

if isinstance(obj, dict):

return obj

return None

except json.JSONDecodeError:

start = text.find("{", start + 1)

return None

def _validate_decision(obj: Dict[str, Any]) -> Tuple[bool, str]:

action = obj.get("action")

if action not in ("call_tool", "finish"):

return False, "Invalid action"



if action == "call_tool":

if not isinstance(obj.get("tool_name"), str) or not obj["tool_name"].strip():

return False, "Missing tool_name"

if not isinstance(obj.get("tool_args"), dict):

return False, "Missing tool_args"



if action == "finish":

if not isinstance(obj.get("response"), str):

return False, "Missing response"



return True, ""

def _repair_json_only(adapter: ModelAdapter, messages: List[Message], bad: str, reason: str) -> Optional[Dict[str, Any]]:

repair_msg = f"""

Your previous output was invalid.

Reason:

{reason}

Previous output:

{bad}

Return ONLY one valid JSON object matching the schema.

No markdown. No extra text.

"""

repaired = adapter.complete(messages + [{"role": "user", "content": repair_msg}])

return _decoder_extract_first_object(repaired)

def _as_messages(state: AgentState) -> List[Message]:

msgs: List[Message] = [{"role": "system", "content": SYSTEM_PROMPT}]

for m in state["messages"]:

if isinstance(m, dict) and "role" in m and "content" in m:

role = str(m["role"])

content = str(m["content"])

if role in {"system", "user", "assistant"}:

msgs.append({"role": role, "content": content})

else:

msgs.append({"role": "user", "content": f"[{role}] {content}"})

else:

msgs.append({"role": "user", "content": str(m)})

return msgs

def run_agent(

state: AgentState,

user_text: str,

adapter: ModelAdapter,

*,

max_steps: int = 8,

max_repairs_per_step: int = 2,

) -> Dict[str, Any]:

"""

Updates state in place.

Logs steps to console for visibility (Thinking -> Action -> Output).

"""

if not isinstance(state.get("messages"), list):

state["messages"] = []



state["messages"].append({"role": "user", "content": str(user_text)})



tools = tool_registry()

last_failed_date: Optional[str] = None

last_tool_error: Optional[str] = None

for _ in range(max_steps):

messages = _as_messages(state)

raw = adapter.complete(messages)

decision = _decoder_extract_first_object(raw)



# Repair logic

repairs_left = max_repairs_per_step

while decision is None and repairs_left > 0:

decision = _repair_json_only(adapter, messages, raw, "No valid JSON object found")

repairs_left -= 1



if decision is None:

final = {"action": "finish", "response": "Error: model returned no valid JSON"}

state["messages"].append({"role": "assistant", "content": final["response"]})

state["is_complete"] = True

return final

# Validate logic

ok, err = _validate_decision(decision)

while not ok and repairs_left > 0:

decision2 = _repair_json_only(adapter, messages, json.dumps(decision), err)

repairs_left -= 1

if decision2 is None:

break

decision = decision2

ok, err = _validate_decision(decision)

if not ok:

final = {"action": "finish", "response": f"Error: invalid decision schema: {err}"}

state["messages"].append({"role": "assistant", "content": final["response"]})

state["is_complete"] = True

return final

# --- EXECUTION LOGIC ---

if decision["action"] == "finish":

state["messages"].append({"role": "assistant", "content": decision["response"]})

state["is_complete"] = True

return decision

# It's a tool call

tool_name = decision["tool_name"]

tool_args = decision["tool_args"]

# LOGGING: The "Thinking" step

print(f"   [Thinking] I should call {tool_name} with {tool_args}...")

if tool_name not in tools:

final = {"action": "finish", "response": f"Error: unknown tool {tool_name}"}

state["messages"].append({"role": "assistant", "content": final["response"]})

state["is_complete"] = True

return final

# Normalizing args (hallucination fix)

if tool_name == "update_route":

if "new_date" not in tool_args:

for date_key in ("date", "newDate", "route_date"):

if date_key in tool_args:

tool_args["new_date"] = tool_args[date_key]

break

if "shipment_id" not in tool_args and isinstance(state.get("shipment_id"), str) and state["shipment_id"]:

tool_args["shipment_id"] = state["shipment_id"]



# Guardrail: Prevent infinite loop on same bad input

new_date = str(tool_args.get("new_date", "")).strip()

if last_failed_date and new_date == last_failed_date:

final = {"action": "finish", "response": f"{last_tool_error} Please provide a different valid date."}

state["messages"].append({"role": "assistant", "content": final["response"]})

state["is_complete"] = True

return final

# Execute Tool

try:

result = tools[tool_name](**tool_args)**

except Exception as e:

result = f"Error: Tool execution failed: {str(e)}"



# LOGGING: The "Output" step

print(f"   [Tool Output] {result}")

# Update state based on tool result

if tool_name == "update_route":

if tool_is_error(result):

last_failed_date = new_date

last_tool_error = result

else:

last_failed_date = None

last_tool_error = None



# Add tool output to history so the model sees it in the next loop!

state["messages"].append({"role": "tool", "content": f"{tool_name} result: {result}"})



# End of loop

final = {"action": "finish", "response": "Error: step limit reached"}

state["messages"].append({"role": "assistant", "content": final["response"]})

state["is_complete"] = True

return final

**שלב 5: ההנעה (src/engine.py)**

זהו המפתח (Ignition). הקובץ הזה מאתחל את המצב ההתחלתי, טוען את המתאמים, ומכניס את ה"רעל" למערכת - הבקשה הבלתי אפשרית לעדכן תאריך לשנת 2020.

**העתיקו את הקוד לקובץ:** src/engine.py

# src/engine.py

from state import AgentState

from openai_adapter import OpenAIAdapter

from agent_runtime import run_agent

if __name__ == "__main__":

print("--- Starting LogiSmart Autonomous Agent Lab ---")

state: AgentState = {

"messages": [],

"shipment_id": None,

"is_complete": False

}

adapter = OpenAIAdapter(model="gpt-4o", temperature=0.1)

run_agent(

state,

"Please move shipment LS-2026-X to yesterday (2020-01-01) because I forgot.",

adapter

)

if state["messages"]:

last_msg = state["messages"][-1]

# Support different formats: content, response, text

last = last_msg.get("content") or last_msg.get("response") or str(last_msg)

else:

last = ""

print(f"Agent: {last}")



**הרצת המעבדה: רגע האמת**

כעת, הריצו את הפקודה הבאה בטרמינל:

bash

python src/engine.py

מה תראו בטרמינל? (דרמה ב-3 מערכות):

1. **הניסיון:** המודל יחשוב בקול רם וינסה לציית לבקשתכם ולעדכן ל-2020-01-01.

[Thinking] I should call update_route with {'shipment_id': 'LS-2026-X', 'new_date': '2020-01-01'}...

2. **החסימה:** הקוד שלנו ב-tools.py יתפוס אותו על חם ויחזיר שגיאה.

[Tool Output] Error: Date 2020-01-01 is in the past! Time travel not allowed.

3. **ההתאוששות:** המודל יקבל את השגיאה, יבין שהוא לא יכול לעשות את מה שביקשתם, ויחזור אליכם עם תשובה חכמה למשתמש.

Agent: I tried to update the shipment LS-2026-X to 2020-01-01, but the system rejected it... Please provide a valid future date.

**וזה הקסם.** 
בלי שום התערבות ידנית, הסוכן ניסה, נכשל, הבין למה הוא נכשל, והגיב בהתאם. זה הכוח של **Resilient Agent** אמיתי.

כעת, הריצו את הפקודה הבאה בטרמינל:

bash

python engine.py

**מה תראו בטרמינל?** (הפלט עשוי להשתנות מעט כי זה מודל חי)

1. **הניסיון:** המודל ינסה לציית לבקשתכם ולעדכן ל-2020-01-01.

[Thinking] I should call update_route with {'shipment_id': 'LS-2026-X', 'new_date': '2020-01-01'}...

2. **החסימה:** הכלי המאובטח שלנו יחסום אותו.

[Tool Output] Error: Date 2020-01-01 is in the past! Time travel not allowed.

3. **ההתאוששות:** המודל יקבל את השגיאה, יבין שהוא לא יכול לעשות את מה שביקשתם, ויחזור אליכם עם תשובה חכמה.

Agent: I cannot update the shipment to a past date. Please provide a valid future date.

**וזה הקסם.** 
בלי שום התערבות שלכם בקוד, הסוכן ניסה, נכשל, הבין למה נכשל, והגיב בהתאם.

זה הכוח של **Resilient Agent** אמיתי.



## הפרומפט המערכתי כשכבת ארכיטקטורה (The System Prompt Architecture)

לפני שנסגור את הפרק, אנחנו חייבים להתעכב על רכיב אחד קריטי שקל לפספס בקוד של המעבדה: ה-SYSTEM_PROMPT.

במשך שנים, "הנדסת פרומפטים" (Prompt Engineering) נחשבה למשהו ששייך לאנשי מוצר או למעצבים. היית כותב "You are a helpful assistant", מוסיף כמה דוגמאות, ומקווה לטוב. 
אבל כשאנחנו בונים **Agent אוטונומי**, הפרומפט הוא לא סתם טקסט. הוא **החוזה הלוגי** (Logic Contract) שמחזיק את כל המערכת באוויר.

אם תסתכלו שוב על agent_runtime.py, תראו שהפרומפט שלנו בנוי בצורה הנדסית מאוד, שמזכירה כתיבת קוד יותר מאשר כתיבת פרוזה. בואו נפרק אותו לארבעת המרכיבים ההכרחיים לכל System Prompt יציב.

1. **הגדרת זהות ומטרה (Identity & Goal)**

You are a LogiSmart Logistics Agent.

זה נשמע בסיסי, אבל זה ה-Context Priming. זה אומר למודל אילו מילים סביר שיבואו בהמשך (Shipment, Route, Date) ומצמצם את מרחב הטעות שלו.

2. **אכיפת פרוטוקול הפלט (Strict Output Protocol)**

You MUST output exactly one valid JSON object and nothing else.

Schema: { ... }

זה החלק החשוב ביותר. המנוע שלנו (_decoder_extract_first_object) הוא טיפש. הוא מצפה ל-JSON. אם המודל יחליט להיות נחמד ויכתוב: "Here is your JSON:", הקוד יישבר.

אנחנו משתמשים במילים כמו **MUST** ו-**exactly** כדי לכפות על המודל ציות מלא.

במודלים חדשים (GPT-4o), יש גם פרמטר json_object ב-API, אבל ה-System Prompt הוא קו ההגנה הראשון.

3. **הגדרת הכלים (Tool Definitions)**

במעבדה שלנו, לא השתמשנו ב-Function Calling המובנה של OpenAI (כדי ללמוד איך זה עובד "מתחת למכסה המנוע"), אלא הגדרנו את הכלים בטקסט:

"action": "call_tool", "tool_name": "update_route"

המודל צריך לדעת לא רק שיש כלי, אלא איך המבנה שלו נראה בתוך ה-JSON.



4. **חוקי הברזל (Operational Rules & Guardrails)**

Rules:

1. If the user provides a specific date, ALWAYS call update_route...

2. If update_route returns Error, do NOT try the same date again.

שימו לב לחוק מספר 2. זהו **מנגנון למניעת לולאות אינסופיות** (Infinite Loop Prevention). 
ללא השורה הזו, המודל היה מקבל שגיאה ("Time travel not allowed"), חושב שזו טעות רגעית, ומנסה שוב. ושוב. ושוב. 
על ידי קידוד הלוגיקה ("do NOT try again") ישירות לתוך הפרומפט, אנחנו חוסכים כתיבת קוד Python מורכב לניהול מצבים.

**לסיכום: הפרומפט הוא הקוד**

כשאתם כותבים Agent, אל תתייחסו לפרומפט כאל "המלצה". תתייחסו אליו כאל קוד ב-Production:

- השתמשו בגרסאות (Version Control) לפרומפטים.

- בדקו שינויים בזהירות (שינוי מילה אחת יכול להרוס את הפלט).

- היו ברורים, קצרים וחד-משמעיים.

עכשיו, כשיש לנו מנוע (Python) ודלק (System Prompt), אנחנו מוכנים לדבר על הדבר האמיתי: איך לוקחים את כל זה ל-Production.


