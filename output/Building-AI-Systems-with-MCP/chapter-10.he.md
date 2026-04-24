# אמינות, תצפיתיות ו-Debugging

## למה קשה לדבג מערכות MCP: הבעיה ההסתברותית

Debugging במערכות תוכנה רגילות מתבסס על עיקרון פשוט: אותו קלט מייצר תמיד אותו פלט. אם משהו נשבר, מריצים שוב עם אותם תנאים ומקבלים את אותה שגיאה. אפשר לשחזר, לבודד, ולתקן.

במערכות MCP העיקרון הזה לא תמיד מחזיק.

כשמערכת כוללת מודל שפה, חלק מההתנהגות שלה הסתברותית. אותה בקשה עם אותם כלים זמינים עלולה לייצר קריאות שונות לכלים שונים בהרצות שונות. מודל שקרא ל-Tool A אתמול עשוי לקרוא ל-Tool B היום על אותה בקשה. שגיאה שהתרחשה פעם אחת עשויה לא להתרחש שוב כשמנסים לשחזר אותה.

זה לא אומר שאי אפשר לדבג. זה אומר שהגישה צריכה להיות שונה.

במערכת דטרמיניסטית שואלים: "מה השגיאה?" ומחפשים את הקוד שגרם לה.

במערכת שכוללת מודל שואלים שאלות אחרות:

- "מה המודל ראה בזמן שהשגיאה קרתה?",

- "אילו כלים היו זמינים?",

- "מה הקלט שהמודל קיבל ומה הפלט שהוא החזיר?",

- "האם השגיאה נובעת מהמודל, מהכלי, מהחוזה ביניהם, או מהתשתית?"

בלי תשובות לשאלות האלה, Debugging במערכות MCP הוא ניחוש. עם תשובות, הוא תהליך מסודר.

לכן התצפיתיות, היכולת לראות מה המערכת עושה בזמן אמת ולשחזר מה היא עשתה בעבר, היא לא תוספת נוחה. היא תנאי בסיסי לתחזוקת מערכת MCP בסביבת ייצור.

**מהי תצפיתיות**

תצפיתיות היא היכולת להבין מה מערכת עושה בזמן אמת ולשחזר מה היא עשתה בעבר, על בסיס המידע שהיא עצמה מייצרת.

מערכת תצפיתית היא מערכת שכשמשהו משתבש בה, יש לך את הכלים להבין מה קרה, איפה קרה, ולמה. בלי תצפיתיות, Debugging הוא ניחוש. עם תצפיתיות, הוא תהליך מסודר.

**תצפיתיות מתבססת על שלושה סוגי מידע שמערכת מייצרת:**

1. **לוגים** מתעדים אירועים שהתרחשו. כל קריאה לכלי, כל שגיאה, כל החלטה שהתקבלה.

2. **Metrics** מודדים את המצב הכמותי של המערכת לאורך זמן. כמה קריאות בדקה, כמה זמן כל קריאה לוקחת, כמה שגיאות מתרחשות.

3. **Traces** מקשרים בין כל האירועים שהתרחשו במהלך בקשה אחת, גם כשהיא עברה דרך כמה רכיבים שונים. הם מאפשרים לראות את הבקשה כרצף שלם, מהרגע שנכנסה ועד לרגע שיצאה.

**מנהל מוצר שלח שאלה פשוטה:** "כמה הזמנות נפתחו השבוע?"

**המערכת החזירה תשובה:** המספר נראה סביר. רק יומיים אחר כך, כשמישהו בדק ידנית, התברר שהמודל קרא לכלי הלא נכון, קיבל תוצאה ממסד נתונים של סביבת הפיתוח ולא הייצור, והחזיר אותה בביטחון מלא. לא הייתה שגיאה. הכלי עבד. הנתונים היו נכונים לסביבה הלא נכונה. זה כשל הקשר, והוא אחד מארבעה סוגי כשלים שחוזרים שוב ושוב.

## ארבעת סוגי הכשלים: מודל, כלי, חוזה, תשתית

כשמשהו משתבש במערכת MCP, הצעד הראשון הוא לא לתקן, אלא לזהות איזה סוג כשל קרה. ארבעת סוגי הכשלים דורשים גישות שונות לחלוטין לאבחון ולתיקון, ובלבול ביניהם מוביל לחיפוש בכיוון הלא נכון.

1. **כשל מודל**

כשל מודל קורה כשהמודל מקבל החלטה שגויה. הוא קורא לכלי הלא נכון, שולח פרמטרים שגויים, מפרש תוצאה בצורה לא נכונה, או מייצר תשובה שלא מתאימה לבקשה. הכלים עצמם עובדים נכון. התשתית תקינה. הבעיה היא בשיפוט.

**סימני זיהוי:** הכלי רץ בהצלחה אבל התוצאה לא מה שהמשתמש ביקש. המודל קורא לכלים בסדר לא הגיוני. הפרמטרים שהמודל שלח לא תואמים לבקשה המקורית.

2. **כשל כלי**

כשל כלי קורה כשהכלי עצמו נכשל. הוא מקבל קלט תקין אבל מחזיר תוצאה שגויה, זורק שגיאה לא צפויה, או מתנהג בצורה שונה ממה שה-Schema מבטיח.

**סימני זיהוי:** שגיאה שמגיעה מתוך הכלי עצמו. תוצאה שלא תואמת לה-Schema שהוגדר. הכלי מצליח אבל הנתונים שהוא מחזיר שגויים.

3. **כשל חוזה**

כשל חוזה קורה כשיש אי התאמה בין מה שהמודל מצפה לקבל לבין מה שהכלי מספק. ה-Schema לא מעודכן, פרמטר שהיה אופציונלי הפך לחובה, או פורמט התוצאה השתנה בלי שהמודל ידע.

סימני זיהוי: שגיאות Validation שמופיעות לאחר שינוי בכלי. המודל שולח פרמטרים שנראים נכונים אבל הכלי דוחה אותם. הכלי מחזיר תוצאה בפורמט שהמודל לא מצליח לפרש.

4. **כשל תשתית**

כשל תשתית קורה כשהבעיה היא לא בלוגיקה אלא בסביבה. חיבור שנופל, Timeout שחולף, שירות חיצוני שלא זמין, או בעיית רשת שגורמת לבקשות להיכשל.

**סימני זיהוי:** שגיאות שמופיעות בצורה אקראית ולא עקבית. Timeouts שמתרחשים בתדירות גבוהה. שגיאות שנעלמות מעצמן כשמנסים שוב.

<img src="/Building-AI-Systems-with-MCP/assets/image-08.png" alt="image-08.png" width="687" height="612" />


## Tracing של זרימות ו-Correlation IDs

כשבקשה עוברת דרך מערכת MCP, היא עוברת דרך כמה רכיבים: ה-Host, ה-Client, כלי אחד או יותר, ואולי שירותים חיצוניים. כל רכיב רושם לוגים משלו. בלי דרך לקשר את הלוגים האלה יחד, אי אפשר לשחזר מה קרה בבקשה ספציפית.

זה בדיוק מה ש-Correlation ID פותר.

**מהו Correlation ID**

Correlation ID הוא מזהה ייחודי שנוצר בתחילת כל בקשה ועובר עם הבקשה לכל אורך הדרך. כל לוג שנכתב בהקשר של אותה בקשה כולל את ה-Correlation ID. כשמשהו משתבש, מחפשים את ה-Correlation ID של הבקשה הבעייתית ומקבלים את כל הלוגים הרלוונטיים בסדר כרונולוגי.

```python
import uuid
import datetime

def generate_correlation_id() -> str:
    """
    Generates a unique correlation ID for request tracing.
    Format: timestamp + random UUID for easy sorting.
    """
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}-{unique_id}"

class RequestContext:
    """
    Holds context for a single request, including correlation ID.
    Passed through all layers of the system.
    """
    def __init__(self, user_id: str, tenant_id: str, session_id: str):
        self.correlation_id = generate_correlation_id()
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.session_id = session_id
        self.started_at = datetime.datetime.utcnow().isoformat()
        self.tool_calls = []

    def record_tool_call(self, tool_name: str, arguments: dict, result: str, duration_ms: float):
        """Records a tool call as part of this request's trace."""
        self.tool_calls.append({
            "tool_name": tool_name,
            "arguments": sanitize_for_audit(arguments),
            "result_summary": result,
            "duration_ms": duration_ms,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
```

**כיצד משתמשים ב-Correlation ID בפועל**

הקובץ server/server.py בריפוזיטורי המלווה כולל Correlation ID בכל לוג:

```python
import logging
import time

logger = logging.getLogger("mcp_server")

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    correlation_id = arguments.get("_correlation_id", generate_correlation_id())
    start_time = time.time()

    logger.info(
        "Tool call started",
        extra={
            "correlation_id": correlation_id,
            "tool_name": name,
            "user_id": arguments.get("_user_id", "unknown"),
            "tenant_id": arguments.get("_tenant_id", "unknown")
        }
    )

    try:
        result = await execute_tool(name, arguments)
        duration_ms = (time.time() - start_time) * 1000

        logger.info(
            "Tool call completed",
            extra={
                "correlation_id": correlation_id,
                "tool_name": name,
                "duration_ms": round(duration_ms, 2),
                "success": True
            }
        )
        return result

    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000

        logger.error(
            "Tool call failed",
            extra={
                "correlation_id": correlation_id,
                "tool_name": name,
                "duration_ms": round(duration_ms, 2),
                "error": str(e),
                "success": False
            }
        )
        raise
```

**מה Trace מלא מראה** כשמסתכלים על לוגים מסודרים עם Correlation ID, אפשר לראות את כל הבקשה כרצף ברור:

```bash
2026-01-15T10:23:01Z [corr:20260115102301-a3f8] Tool call started: search_documents 
2026-01-15T10:23:01Z [corr:20260115102301-a3f8] Validation passed 
2026-01-15T10:23:01Z [corr:20260115102301-a3f8] Permission check passed 
2026-01-15T10:23:02Z [corr:20260115102301-a3f8] Database query executed: 150ms 
2026-01-15T10:23:02Z [corr:20260115102301-a3f8] Tool call completed: 210ms, 3 results
```

בלי Correlation ID, אותם לוגים מעורבבים עם לוגים של בקשות אחרות ואי אפשר להבין מה שייך למה.

הקובץ המעודכן server/server.py נמצא בריפוזיטורי המלווה.

## לוגים טובים ולוגים מסוכנים: מה לא לרשום

לוגים הם הכלי הבסיסי ביותר לתצפיתיות. אבל לוגים גרועים הם לא רק חסרי תועלת, הם גם מסוכנים. לוג שמכיל מידע רגיש הוא דליפת מידע שמתרחשת בכל פעם שמשהו משתבש.

**מה חובה לרשום**

כל קריאה לכלי עם Correlation ID, שם הכלי, מזהה המשתמש, מזהה ה-Tenant, זמן התחלה וסיום, והאם הצליחה. כל שגיאה עם סוגה, המקום שבו התרחשה, וה-Correlation ID של הבקשה שגרמה לה. כל החלטת הרשאה, הן מי אושר והן מי נחסם.

**מה אסור לרשום**

סיסמאות, טוקנים, ומפתחות API. מספרי כרטיסי אשראי ופרטי תשלום. מידע רפואי או אישי רגיש. תוכן מלא של מסמכים שהמודל קרא. תשובות מלאות שכוללות נתוני משתמשים.

```python
import logging
import json

class SafeLogger:	
    """
    Logger that automatically redacts sensitive fields
    before writing to log.
    """

    SENSITIVE_FIELDS = {
        "password", "token", "api_key", "secret",
        "card_number", "credentials", "authorization",
        "private_key", "access_token", "refresh_token"
    }

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def _redact(self, data: dict) -> dict:
        """Recursively redacts sensitive fields from a dict."""
        if not isinstance(data, dict):
            return data

        return {
            k: "[REDACTED]" if k.lower() in self.SENSITIVE_FIELDS
            else self._redact(v) if isinstance(v, dict)
            else v
            for k, v in data.items()
        }

    def _truncate(self, value: str, max_length: int = 200) -> str:
        """Truncates long strings to prevent log flooding."""
        if len(value) > max_length:
            return value[:max_length] + f"... [truncated, total length: {len(value)}]"
        return value

    def info(self, message: str, extra: dict = None):
        safe_extra = self._redact(extra or {})
        self.logger.info(message, extra={"data": json.dumps(safe_extra)})

    def error(self, message: str, extra: dict = None):
        safe_extra = self._redact(extra or {})
        self.logger.error(message, extra={"data": json.dumps(safe_extra)})

    def warning(self, message: str, extra: dict = None):
        safe_extra = self._redact(extra or {})
        self.logger.warning(message, extra={"data": json.dumps(safe_extra)})

safe_logger = SafeLogger("mcp_server")
```

**לוג טוב לעומת לוג גרוע**

לוג גרוע:

```python
logger.info(f"Tool called: {name} with args: {json.dumps(arguments)}")
```

זה רושם את כל הפרמטרים כולל מידע רגיש שעלול להיות בתוכם.

לוג טוב:

```python
safe_logger.info(
    "Tool call started",
    extra={
        "correlation_id": correlation_id,
        "tool_name": name,
        "user_id": arguments.get("_user_id", "unknown"),
        "tenant_id": arguments.get("_tenant_id", "unknown"),
        "argument_keys": list(arguments.keys())  # Log keys, not values
    }
)
```

זה רושם מה נדרש לאבחון בלי לחשוף מידע רגיש.

**כלל פשוט לפני שרושמים**

לפני כל שורת לוג, שאל: אם מישהו שאין לו הרשאה לנתונים האלה יראה את הלוג הזה, האם זו בעיה? אם כן, אל תרשום את הנתון הזה. הקובץ המעודכן server/server.py נמצא בריפוזיטורי המלווה.

## Metrics שימושיים למערכות לא דטרמיניסטיות

Metrics הם מדדים כמותיים שמצביעים על מצב המערכת לאורך זמן. במערכת דטרמיניסטית רגילה, Metrics כמו זמן תגובה ושיעור שגיאות מספיקים לרוב. במערכת שכוללת מודל, צריך למדוד גם דברים שלא קיימים במערכות רגילות.

**Metrics בסיסיים שכל מערכת MCP צריכה**

```python
import time
from collections import defaultdict
from datetime import datetime

class MCPMetrics:
    """
    Collects and reports metrics for an MCP server.
    In production, use a dedicated metrics system like Prometheus.
    """

    def __init__(self):
        self.tool_call_counts = defaultdict(int)
        self.tool_call_durations = defaultdict(list)
        self.tool_error_counts = defaultdict(int)
        self.validation_failure_counts = defaultdict(int)
        self.permission_denial_counts = defaultdict(int)

    def record_tool_call(self, tool_name: str, duration_ms: float, success: bool):
        """Records a tool call with its outcome."""
        self.tool_call_counts[tool_name] += 1
        self.tool_call_durations[tool_name].append(duration_ms)
        if not success:
            self.tool_error_counts[tool_name] += 1

    def record_validation_failure(self, tool_name: str):
        """Records a validation failure for a tool."""
        self.validation_failure_counts[tool_name] += 1

    def record_permission_denial(self, tool_name: str):
        """Records a permission denial for a tool."""
        self.permission_denial_counts[tool_name] += 1

    def get_average_duration(self, tool_name: str) -> float:
        """Returns average duration in ms for a tool."""
        durations = self.tool_call_durations.get(tool_name, [])
        if not durations:
            return 0.0
        return sum(durations) / len(durations)

    def get_error_rate(self, tool_name: str) -> float:
        """Returns error rate as a percentage for a tool."""
        total = self.tool_call_counts.get(tool_name, 0)
        errors = self.tool_error_counts.get(tool_name, 0)
        if total == 0:
            return 0.0
        return (errors / total) * 100

    def get_summary(self) -> dict:
        """Returns a summary of all metrics."""
        summary = {}
        for tool_name in self.tool_call_counts:
            summary[tool_name] = {
                "total_calls": self.tool_call_counts[tool_name],
                "error_count": self.tool_error_counts[tool_name],
                "error_rate_pct": round(self.get_error_rate(tool_name), 2),
                "avg_duration_ms": round(self.get_average_duration(tool_name), 2),
                "validation_failures": self.validation_failure_counts[tool_name],
                "permission_denials": self.permission_denial_counts[tool_name]
            }
        return summary

metrics = MCPMetrics()
```

**Metrics ייחודיים למערכות MCP**

מעבר למדדים הבסיסיים, יש מדדים שרלוונטיים במיוחד למערכות שכוללות מודל:

**שיעור קריאות חוזרות לאותו Tool:** אם המודל קורא לאותו Tool שוב ושוב ברצף קצר, זה עשוי להעיד על כשל חוזה שגורם למודל לנסות שוב.

**שיעור שגיאות Validation:** אם שיעור שגיאות הVolidation של Tool מסוים עולה, זה עשוי להעיד שה-Schema לא מתאר נכון מה המודל שולח.

**פיזור זמני תגובה:** מערכת שכוללת מודל תראה פיזור רחב יותר בזמני תגובה מאשר מערכת דטרמיניסטית. פיזור שגדל לאורך זמן עשוי להעיד על בעיית ביצועים מתפתחת.

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    correlation_id = arguments.get("_correlation_id", generate_correlation_id())
    start_time = time.time()

    try:
        # Validation
        error = validate_input(name, arguments)
        if error:
            metrics.record_validation_failure(name)
            return [TextContent(type="text", text=f"Validation error: {error}")], True

        # Permission check
        allowed, reason = check_permission(
            arguments.get("_user_id"),
            name,
            "tool",
            arguments
        )
        if not allowed:
            metrics.record_permission_denial(name)
            return [TextContent(type="text", text=f"Access denied: {reason}")], True

        # Execute
        result = await execute_tool(name, arguments)
        duration_ms = (time.time() - start_time) * 1000
        metrics.record_tool_call(name, duration_ms, success=True)
        return result

    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        metrics.record_tool_call(name, duration_ms, success=False)
        raise
```

**מתי לבדוק את ה-Metrics**

Metrics שלא נבדקים הם Metrics שלא קיימים. הוסף נקודת קצה פשוטה שמחזירה את סיכום ה-Metrics כדי שאפשר לבדוק אותם בכל זמן:

```python
@server.list_tools()
async def list_tools():
    return [
        # ... existing tools ...
        Tool(
            name="get_server_metrics",
            description="Returns current server metrics summary. For monitoring only.",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }	
        )
    ]

# Add to call_tool handler:
if name == "get_server_metrics":
    return [
        TextContent(
            type="text",
            text=json.dumps(metrics.get_summary(), indent=2)
        )
    ]
```

הקובץ המעודכן server/server.py נמצא בריפוזיטורי המלווה.



## MCP Inspector ככלי Debug ראשון בקו

כשמשהו משתבש במערכת MCP, הצעד הראשון לפני שנוגעים בלוגים או בקוד הוא לפתוח את MCP Inspector ולבדוק את השרת ישירות. MCP Inspector מאפשר לתקשר עם השרת בדיוק כמו שה-Client מתקשר איתו, אבל בצורה אינטראקטיבית שמאפשרת לבודד בעיות במהירות.

**מה MCP Inspector מאפשר לאבחן**

**בעיות Capability Negotiation:** אם הכלים לא מופיעים ברשימה כמו שצריך, הבעיה נמצאת בהגדרת ה-Tool או ב-Handler של list_tools. Inspector מציג בדיוק את מה השרת מכריז, ואפשר לראות מיד אם חסר כלי או אם ה-Schema שגויה.

**בעיות Validation:** קריאה לכלי עם קלט מכוון שגוי מראה אם הVolidation עובד נכון ואם השגיאה שחוזרת ברורה מספיק למודל.

**בעיות Schema:** אם ה-Schema לא מגדירה נכון את הפרמטרים, אפשר לראות את זה ישירות בממשק ה-Inspector לפני שהמודל מנסה להשתמש בכלי.

**בעיות תשובה:** אם הכלי מחזיר תוצאה בפורמט לא צפוי, אפשר לראות את התוצאה המדויקת שהמודל מקבל.

**תהליך Debug מסודר עם MCP Inspector**

כשמגיעה תלונה שכלי לא עובד, עקוב אחרי הצעדים הבאים בסדר:

**צעד 1:** הרץ את השרת עם Inspector ובדוק שהכלי מופיע ברשימה עם ה-Schema הנכון.

```bash
cd server
source venv/bin/activate
npx @modelcontextprotocol/inspector python server.py
```

**צעד 2:** קרא לכלי עם קלט תקין ובדוק שהתוצאה תואמת למה שציפית.

**צעד 3:** קרא לכלי עם קלט שגוי ובדוק שהשגיאה ברורה ומכילה מספיק מידע למודל לתקן את הקריאה.

**צעד 4:** קרא לכלי עם קלט גבולי, ערכים בדיוק בגבול המותר, וודא שהמערכת מתנהגת נכון במקרי קצה.

**מתי Inspector לא מספיק**

Inspector מאפשר לבדוק את השרת בבידוד. הוא לא מדמה מודל שפה שמחליט איך להשתמש בכלים. אם הבעיה היא בהחלטות של המודל ולא בכלי עצמו, Inspector לא יחשוף אותה. במקרה כזה צריך לעבור לבדיקה עם מודל אמיתי ולנתח את הלוגים.

## Contract Testing: בדיקה שה-Tool מקיים את ה-Schema שהבטיח

Schema מגדירה מה ה-Tool מבטיח לקבל ולהחזיר. Contract Testing בודק שה-Tool אכן מקיים את ההבטחה הזו בפועל. זו לא בדיקת לוגיקה עסקית, אלא בדיקה שהחוזה בין המודל לבין הכלי תקף.

**למה Contract Testing חשוב במיוחד ב-MCP**

כשכלי משתנה, המודל לא יודע על כך עד שהוא מנסה לקרוא לו ומקבל שגיאה. Contract Testing מגלה את הבעיה לפני שהמערכת עולה לייצור, ולפני שהמודל נתקל בה.

**מה בודקים ב-Contract Testing**

לכל Tool בודקים שלושה דברים: קלט תקין מחזיר תוצאה בפורמט הנכון, קלט שגוי מחזיר שגיאה ברורה, ומקרי קצה מטופלים בצורה עקבית.

```python
# server/tests/test_contracts.py

import pytest
import asyncio
import json
from server import call_tool, list_tools

class TestSearchDocumentsContract:
    """
    Contract tests for search_documents tool.
    Tests that the tool honors its Schema under all conditions.
    """

    @pytest.fixture
    def valid_arguments(self):
        return {
            "query": "sample query",
            "max_results": 5,
            "_user_id": "test_user",
            "_tenant_id": "test_tenant",
            "_correlation_id": "test-correlation-id"
        }

    def test_tool_is_registered(self):
        """Tool must appear in the tools list with correct schema."""
        tools = asyncio.run(list_tools())
        tool_names = [t.name for t in tools]
        assert "search_documents" in tool_names

    def test_schema_has_required_fields(self):
        """Schema must define required fields correctly."""
        tools = asyncio.run(list_tools())
        tool = next(t for t in tools if t.name == "search_documents")
        schema = tool.inputSchema

        assert "query" in schema["properties"]
        assert "query" in schema["required"]
        assert "max_results" not in schema.get("required", [])

    def test_valid_input_returns_list(self, valid_arguments):
        """Valid input must return a non-empty result in JSON format."""
        result, *rest = asyncio.run(call_tool("search_documents", valid_arguments))
        is_error = rest[0] if rest else False

        assert not is_error
        parsed = json.loads(result.text)
        assert isinstance(parsed, list)

    def test_result_items_have_required_fields(self, valid_arguments):
        """Each result item must contain id, title, and score."""
        result, *_ = asyncio.run(call_tool("search_documents", valid_arguments))
        parsed = json.loads(result.text)

        for item in parsed:
            assert "id" in item, "Result item missing 'id'"
            assert "title" in item, "Result item missing 'title'"
            assert "score" in item, "Result item missing 'score'"

    def test_score_is_between_zero_and_one(self, valid_arguments):
        """Score field must be a float between 0 and 1."""
        result, *_ = asyncio.run(call_tool("search_documents", valid_arguments))
        parsed = json.loads(result.text)

        for item in parsed:
            assert 0.0 <= item["score"] <= 1.0, f"Invalid score: {item['score']}"

    def test_max_results_is_respected(self, valid_arguments):
        """Result count must not exceed max_results."""
        valid_arguments["max_results"] = 2
        result, *_ = asyncio.run(call_tool("search_documents", valid_arguments))
        parsed = json.loads(result.text)

        assert len(parsed) <= 2

    def test_empty_query_returns_error(self, valid_arguments):
        """Empty query must return isError=True with clear message."""
        valid_arguments["query"] = ""
        result, is_error = asyncio.run(call_tool("search_documents", valid_arguments))

        assert is_error is True
        assert "empty" in result.text.lower()

    def test_missing_query_returns_error(self, valid_arguments):
        """Missing required field must return isError=True."""
        del valid_arguments["query"]
        result, is_error = asyncio.run(call_tool("search_documents", valid_arguments))

        assert is_error is True
        assert "query" in result.text.lower()

    def test_max_results_above_limit_returns_error(self, valid_arguments):
        """max_results above maximum must return isError=True."""
        valid_arguments["max_results"] = 100
        result, is_error = asyncio.run(call_tool("search_documents", valid_arguments))

        assert is_error is True
        assert "20" in result.text

    def test_query_at_max_length_is_accepted(self, valid_arguments):
        """Query exactly at max length must be accepted."""
        valid_arguments["query"] = "a" * 200
        result, *rest = asyncio.run(call_tool("search_documents", valid_arguments))
        is_error = rest[0] if rest else False

        assert not is_error

    def test_query_above_max_length_returns_error(self, valid_arguments):
        """Query above max length must return isError=True."""
        valid_arguments["query"] = "a" * 201
        result, is_error = asyncio.run(call_tool("search_documents", valid_arguments))

        assert is_error is True
        assert "200" in result.text
```

הרץ את הבדיקות:

```bash
cd server
source venv/bin/activate
pytest tests/test_contracts.py -v
```

**מתי להריץ Contract Tests**

Contract Tests צריכים לרוץ בכל פעם שמשהו משתנה בשרת. לפני כל עדכון שעולה לייצור, לפני שמשנים Schema של כלי קיים, ואחרי שמשדרגים גרסת SDK. Contract Test שנכשל הוא סימן שהחוזה נשבר וצריך לטפל בזה לפני שהמודל נתקל בבעיה.

הקובץ server/tests/test_contracts.py נמצא בריפוזיטורי המלווה.



## בדיקות רצף פעולות ותרחישי כשל (Integration Testing ו-Synthetic Scenarios)

Contract Testing בודק שכל Tool מקיים את החוזה שלו בבידוד. Integration Testing בודק שהרכיבים עובדים נכון יחד. Synthetic Scenarios הם תרחישים מלאכותיים שמדמים בקשות אמיתיות כדי לוודא שהמערכת כולה מתנהגת כצפוי.

**ההבדל בין Contract Testing ל-Integration Testing**

- **Contract Test שואל:** "האם ה-Tool הזה מחזיר את מה שהוא הבטיח?"

- **Integration Test שואל:** "האם רצף הפעולות הזה מייצר את התוצאה הנכונה?"

- **Contract Test** רץ על כלי בודד.

- **Integration Test** רץ על זרימה שלמה.

**מה בודקים ב-Integration Testing**

```python
# server/tests/test_integration.py

import pytest
import asyncio
import json
from server import call_tool

class TestOrderWorkflowIntegration:
    """
    Integration tests for complete workflows.
    Tests that sequences of tool calls produce correct results.
    """

    @pytest.fixture
    def user_context(self):
        return {
            "_user_id": "test_user",
            "_tenant_id": "tenant_123",
            "_correlation_id": "integration-test-001",
            "_environment": "test"
        }

    def test_search_then_read_workflow(self, user_context):
        """
        Tests that search results can be used to read documents.
        Simulates: user searches for a document, then reads it.
        """
        # Step 1: Search for documents
        search_result, *_ = asyncio.run(call_tool(
            "search_documents",
            {**user_context, "query": "sample", "max_results": 3}
        ))
        search_data = json.loads(search_result.text)
        assert len(search_data) > 0, "Search returned no results"

        # Step 2: Read the first result
        document_id = search_data[0]["id"]
        read_result, *rest = asyncio.run(call_tool(
            "read_document",
            {**user_context, "document_id": document_id}
        ))
        is_error = rest[0] if rest else False

        assert not is_error, f"Failed to read document: {read_result.text}"
        document = json.loads(read_result.text)
        assert "content" in document, "Document missing content field"

    def test_permission_blocks_restricted_tool(self, user_context):
        """
        Tests that a regular user cannot access admin tools.
        """
        result, is_error = asyncio.run(call_tool(
            "delete_all_documents",
            {**user_context, "_user_roles": ["viewer"]}
        ))

        assert is_error is True
        assert "denied" in result.text.lower()

    def test_tenant_isolation_in_workflow(self):
        """
        Tests that tenant A cannot access tenant B's data
        through a sequence of tool calls.
        """
        tenant_a_context = {
            "_user_id": "user_a",
            "_tenant_id": "tenant_a",
            "_correlation_id": "isolation-test-001"
        }

        tenant_b_context = {
            "_user_id": "user_b",
            "_tenant_id": "tenant_b",
            "_correlation_id": "isolation-test-002"
        }

        # Tenant A searches and gets their documents
        result_a, *_ = asyncio.run(call_tool(
            "search_documents",
            {**tenant_a_context, "query": "report"}
        ))
        documents_a = json.loads(result_a.text)

        # Tenant B searches and gets their documents
        result_b, *_ = asyncio.run(call_tool(
            "search_documents",
            {**tenant_b_context, "query": "report"}
        ))
        documents_b = json.loads(result_b.text)

        # Ensure no document IDs overlap
        ids_a = {doc["id"] for doc in documents_a}
        ids_b = {doc["id"] for doc in documents_b}
        assert ids_a.isdisjoint(ids_b), "Tenant isolation breach detected"
```

**Synthetic Scenarios**

Synthetic Scenarios הם בדיקות שמדמות תרחישים שקשה לשחזר בסביבה אמיתית. כשל של שירות חיצוני, Timeout שחולף, קלט בפורמט לא צפוי שמודל עלול לשלוח.

```python
class TestSyntheticFailureScenarios:
    """
    Tests system behavior under failure conditions.
    """

    @pytest.fixture
    def user_context(self):
        return {
            "_user_id": "test_user",
            "_tenant_id": "tenant_123",
            "_correlation_id": "synthetic-test-001"
        }

    def test_tool_handles_database_timeout(self, user_context, monkeypatch):
        """
        Simulates database timeout and verifies the tool
        returns a clear error instead of hanging.
        """
        import asyncio

        async def slow_query(*args, **kwargs):
            await asyncio.sleep(10)  # Simulate timeout

        monkeypatch.setattr("server.database.find", slow_query)

        result, is_error = asyncio.run(call_tool(
            "search_documents",
            {**user_context, "query": "test"}
        ))

        assert is_error is True
        assert "timeout" in result.text.lower() or "unavailable" in result.text.lower()

    def test_tool_handles_malformed_model_input(self, user_context):
        """
        Simulates a model sending unexpected input types.
        Verifies validation catches type mismatches.
        """
        result, is_error = asyncio.run(call_tool(
            "search_documents",
            {**user_context, "query": 12345, "max_results": "ten"}
        ))

        assert is_error is True
        assert "string" in result.text.lower() or "type" in result.text.lower()

    def test_tool_handles_concurrent_calls(self, user_context):
        """
        Simulates multiple concurrent calls to verify
        the tool handles concurrency correctly.
        """
        async def run_concurrent():
            tasks = [
                call_tool("search_documents", {**user_context, "query": f"query_{i}"})
                for i in range(10)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            return results

        results = asyncio.run(run_concurrent())
        errors = [r for r in results if isinstance(r, Exception)]
        assert len(errors) == 0, f"Concurrent calls produced {len(errors)} errors"
```

הרץ את הבדיקות:

```bash
cd server
source venv/bin/activate
pytest tests/test_integration.py -v
```

הקובץ server/tests/test_integration.py נמצא בריפוזיטורי המלווה בשלב זה.

## שחזור תרחיש שנכשל (Replay)

אחת הבעיות הקשות ביותר בתחזוקת מערכות MCP היא שכשל שקרה בייצור לא תמיד ניתן לשחזר בסביבת פיתוח. התנאים שגרמו לו, הקלט המדויק שהמודל שלח, ומצב המערכת באותו רגע, כל אלה לרוב לא נשמרים בצורה שמאפשרת שחזור מדויק.

Replay הוא הפתרון לבעיה הזו. במקום לנסות לשחזר את התנאים שגרמו לכשל, שומרים את הבקשות המדויקות שהגיעו לשרת ומריצים אותן מחדש.

**מה צריך לשמור כדי לאפשר Replay**

כדי לשחזר בקשה בדיוק כפי שהתרחשה, צריך לשמור את כל המידע שהיה קיים בזמן הביצוע המקורי. זה כולל את שם הכלי שנקרא, הפרמטרים המדויקים שנשלחו, התוצאה שחזרה, האם הייתה שגיאה, ה-Correlation ID שמאפשר לקשר את הקריאה לבקשה המקורית, והזמן שבו התרחשה.

**חשוב לשים לב לשני דברים:**

ראשית, הפרמטרים עוברים ניקוי לפני האחסון. ניקוי בהקשר זה אומר הסרה או הסתרה של שדות רגישים כגון: סיסמאות, טוקנים ומפתחות API. כלי זה הוא sanitize_for_audit שכתבנו בפרק 10.4. בלי ניקוי, ה-Replay Store הופך למאגר של מידע רגיש שלא צריך להישמר.

שנית, התוצאה נשמרת כסיכום קצר ולא במלואה. שמירת תוצאות מלאות יכולה לצבור נתוני משתמשים בכמויות גדולות שאין צורך לשמור לצורך שחזור.

```python
import json
import datetime
import uuid

class ReplayStore:
    """
    Records tool calls in a format that allows exact replay.
    In production: use persistent storage, not in-memory.
    """

    def __init__(self):
        self.recordings = []

    def record(
        self,
        tool_name: str,
        arguments: dict,
        result: str,
        is_error: bool,
        correlation_id: str
    ):
        """Records a tool call for potential replay."""
        self.recordings.append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "correlation_id": correlation_id,
            "tool_name": tool_name,
            "arguments": sanitize_for_audit(arguments),
            "result_summary": result[:200] if result else "",
            "is_error": is_error
        })

    def get_by_correlation_id(self, correlation_id: str) -> list:
        """Returns all tool calls for a specific request."""
        return [
            r for r in self.recordings
            if r["correlation_id"] == correlation_id
        ]

    def export_for_replay(self, correlation_id: str) -> str:
        """
        Exports a request as JSON for replay in development.
        Use this to reproduce production failures locally.
        """
        calls = self.get_by_correlation_id(correlation_id)
        return json.dumps({
            "correlation_id": correlation_id,
            "exported_at": datetime.datetime.utcnow().isoformat(),
            "tool_calls": calls
        }, indent=2)

replay_store = ReplayStore()
```

הקובץ server/server.py בריפוזיטורי המלווה מעדכן כל קריאה לכלי כך שתירשם ב-replay_store:

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    correlation_id = arguments.get("_correlation_id", generate_correlation_id())
    start_time = time.time()
    result_text = ""
    is_error = False

    try:
        result, *rest = await execute_tool(name, arguments)	
        is_error = rest[0] if rest else False
        result_text = result.text
        return result, *rest

    except Exception as e:
        is_error = True
        result_text = str(e)
        raise

    finally:
        replay_store.record(
            tool_name=name,
            arguments=arguments,
            result=result_text,
            is_error=is_error,
            correlation_id=correlation_id
        )
        metrics.record_tool_call(name, (time.time() - start_time) * 1000, not is_error)

replay_store = ReplayStore()
```

הקובץ המעודכן server/server.py נמצא בריפוזיטורי המלווה.

## תרגול: לנתח אירוע תקלה ולזהות מה חסר בלוגים

לפניך תיאור של אירוע תקלה שהתרחש במערכת MCP אמיתית. הלוגים שנאספו חלקיים, וחלק מהמידע חסר.

**תיאור האירוע**

משתמש ביקש מהמערכת לחפש מסמכים ולסכם את הממצאים. המערכת החזירה סיכום שנראה תקין, אבל המשתמש שם לב לאחר מכן שחלק מהמסמכים לא נכללו בסיכום. לא הייתה שגיאה גלויה. המערכת דיווחה על הצלחה.

**הלוגים שנאספו**

```bash
10:15:23 [corr:20260115101523-a3f8] Tool call started: search_documents
10:15:24 [corr:20260115101523-a3f8] Tool call completed: 210ms, success=True
10:15:24 [corr:20260115101523-a3f8] Tool call started: summarize_results
10:15:26 [corr:20260115101523-a3f8] Tool call completed: 1850ms, success=True
```

**חלק א: זיהוי סוג הכשל**

על בסיס המידע הקיים, ענה:

1. מאיזה מהארבעה סוגי כשלים מדובר כאן: מודל, כלי, חוזה, או תשתית?

2. מה מוביל אותך למסקנה הזו?

3. האם יש מספיק מידע בלוגים כדי לאמת את המסקנה? אם לא, מה חסר?

**חלק ב: זיהוי מה חסר בלוגים**

בדוק את הלוגים שלמעלה וענה:

1. אילו נתונים חסרים שהיו מאפשרים לאבחן את הבעיה מיד?

2. האם ה-Correlation ID קיים? האם הוא מספיק?

3. מה צריך היה להיות מתועד בקריאה ל-search_documents שלא מופיע?

4. מה צריך היה להיות מתועד בקריאה ל-summarize_results שלא מופיע?



**חלק ג: שיפור הלוגים**

על בסיס הניתוח שלך, כתוב רשימה של שינויים שיש לבצע בלוגים של המערכת כדי שתקלה דומה תהיה ניתנת לאבחון מיידי בפעם הבאה. לכל שינוי ציין:

1. מה מוסיפים ללוג.

2. באיזה שלב מוסיפים אותו.

3. למה זה היה עוזר לאבחן את הבעיה.

**התקדמות בפרויקט המלווה**

בשלב זה הריפוזיטורי המלווה מכיל את הקבצים הבאים:

- server/server.py עם שכבת התצפיתיות המלאה

- server/tests/test_contracts.py

- server/tests/test_integration.py

- server/tests/test_security.py

- server/tests/test_replay.py

הרץ את כל הבדיקות יחד:

```bash
cd server
source venv/bin/activate
pytest tests/ -v
```


