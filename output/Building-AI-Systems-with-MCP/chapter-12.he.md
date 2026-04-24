# מ-Prototype ל-Production

## מה מבדיל אב טיפוס ממערכת אמיתית

כל מערכת MCP מתחילה כאב טיפוס. קוד שרץ מקומית, כלי שמחזיר תוצאה, דגמה שעובדת בתנאים מבוקרים. האב טיפוס מוכיח שהרעיון אפשרי. אבל הדרך מאב טיפוס למערכת שאפשר להפעיל באמת היא לא המשך של אותה עבודה. היא עבודה שונה לחלוטין.

ההבדלים בין אב טיפוס למערכת אמיתית לא נמצאים בקוד עצמו. הם נמצאים בכל מה שמסביב לקוד.

**אב טיפוס מניח שהכל עובד**

מערכת אמיתית מתוכננת לכישלון. כל רכיב שיכול להיכשל ייכשל בשלב מסוים. חיבור למסד נתונים ינפול. שירות חיצוני לא יענה. קלט לא צפוי יגיע. אב טיפוס שלא מטפל בכישלונות הוא אב טיפוס שלא ישרוד מפגש עם משתמשים אמיתיים.

**אב טיפוס רץ על מחשב אחד**

מערכת אמיתית רצה על תשתית שמשתנה. שרתים שמתחלפים, עומסים שמשתנים, גרסאות שמתעדכנות. קוד שעבד בסביבה אחת לא מובטח שיעבוד בסביבה אחרת.

**אב טיפוס מטופל על ידי מי שכתב אותו**

מערכת אמיתית מטופלת על ידי אנשים שלא כתבו אותה, בשעות לא נוחות, תחת לחץ. בלי תיעוד, בלי לוגים מסודרים, ובלי כלי אבחון, תחזוקה הופכת לניחוש.

**אב טיפוס מוכיח שהרעיון עובד**

מערכת אמיתית מוכיחה שהמימוש עובד בצורה אמינה, עקבית, ובטוחה לאורך זמן.

הפרק הזה עוסק במה שצריך לשנות, להוסיף, ולתכנן מחדש כדי לעשות את המעבר הזה נכון.

## Production Readiness: רשימת השאלות שצריך לענות לפני פריסה

צוות שבנה מערכת MCP לניהול הזמנות החליט לעלות לייצור אחרי שהדמו עבד יפה. השרת רץ, הכלים הגיבו, והמודל החזיר תשובות סבירות. ביום הראשון בייצור התגלו שלוש בעיות בו זמנית: לוגים שהכילו מידע רגיש של לקוחות, כלי שמחק רשומות בלי אישור כי ה-Approval Gate לא הוגדר לסביבת הייצור, ו-Timeout שלא הוגדר גרם לבקשות להתקע דקות שלמות. כל אחת מהבעיות הייתה ניתנת למניעה. כולן נבעו מאותה סיבה: עלו לייצור בלי לענות על השאלות הנכונות לפני כן.

לפני שמערכת MCP עולה לייצור, יש שאלות שחייבים לענות עליהן. לא כי זו דרישה פורמלית, אלא כי כל שאלה שלא נענית לפני הפריסה תתגלה אחריה, בדרך כלל ברגע הכי לא נוח.

**אמינות**

1. האם כל Tool מטפל בכישלונות של שירותים חיצוניים?

2. האם יש Timeout מוגדר לכל קריאה לשירות חיצוני?

3. האם כשל של שרת אחד משפיע על שרתים אחרים, ואם כן, האם זה מקובל?

**אבטחה**

1. האם כל קריאה לכל Tool עוברת ולידציה ובדיקת הרשאות?

2. האם הלוגים לא מכילים מידע רגיש?

3. האם שרתים חיצוניים עברו בדיקה ויש Hash שנבדק בכל חיבור?

4. האם יש Tenant Isolation לכל נתון שמוחזר?

**תצפיתיות**

1. האם כל קריאה מתועדת עם Correlation ID?

2. האם יש Metrics שמצביעים על בעיות לפני שהמשתמש מדווח עליהן?

3. האם יש יכולת Replay לשחזור כשלים?

**תחזוקה**

1. האם יש תיעוד שמסביר איך מריצים, מעדכנים, ומאבחנים בעיות בשרת?

2. האם ה-Contract Tests רצים אוטומטית לפני כל פריסה?

3. האם יש תהליך ברור לעדכון שרתים חיצוניים?

**ביצועים**

1. האם נבדק כיצד המערכת מתנהגת תחת עומס?

2. האם יש הגדרות Rate Limiting?

3. האם ה-Timeouts מוגדרים בצורה שמאזנת בין זמן תגובה לבין יציבות?



**Transport בפרודקשן: למה STDIO לא מתאים ו-Streamable HTTP הוא הברירה**

לאורך הספר עבדנו עם STDIO כ-Transport. זו הייתה הבחירה הנכונה לפיתוח מקומי: פשוט להקמה, קל לדיבוג, ואין צורך בתשתית. אבל STDIO לא מתאים לסביבת ייצור, ויש לכך סיבות מעשיות.

**למה STDIO לא מתאים לייצור**

STDIO מניח שה-Client וה-Server רצים על אותו מחשב ומתקשרים דרך stdin ו-stdout. זה עובד מצוין כשמפתח אחד מריץ הכל מקומית. אבל בסביבת ייצור, ה-Client וה-Server לרוב רצים על מכונות שונות. STDIO לא תומך בתקשורת מעבר לרשת.

בנוסף, STDIO לא תומך בחיבורים מרובים במקביל. כל Session דורש תהליך נפרד. כשיש עשרות או מאות משתמשים בו זמנית, ניהול התהליכים הופך לבעיה תפעולית.

**למה Streamable HTTP הוא הברירה**

Streamable HTTP הוא ה-Transport הרשמי של MCP לסביבות ייצור. הוא מאפשר תקשורת מעבר לרשת, תומך בחיבורים מרובים במקביל, ומשתלב עם תשתיות ענן סטנדרטיות.

```python
# server/server_http.py
from mcp.server import Server
from mcp.server.streamable_http import StreamableHTTPServerTransport
from aiohttp import web

server = Server("mcp-engineering-lab")

# ... same tool and resource handlers as before ...

async def handle_mcp(request: web.Request) -> web.Response:
    """
    Handles incoming MCP requests over HTTP.
    Each request creates a new transport instance.
    """
    transport = StreamableHTTPServerTransport(request)
    await server.connect(transport)
    return transport.response

app = web.Application()
app.router.add_post("/mcp", handle_mcp)

if __name__ == "__main__":
    web.run_app(app, host="0.0.0.0", port=8080)
```



## בעיית ה-Scaling האמיתית: Stateful Sessions מול Load Balancers

כשמערכת MCP גדלה ויש צורך להריץ כמה instances של השרת במקביל, מתגלה אחת הבעיות המתועדות הנפוצות ביותר בסביבות ייצור: Sessions שמחזיקים State לא עובדים עם Load Balancer בצורה ישירה.

**מה הבעיה**

Load Balancer מפזר בקשות בין כמה instances של השרת.

בקשה ראשונה של Session מסוים עשויה להגיע ל-Instance A.

הבקשה השנייה של אותו Session עשויה להגיע ל-Instance B.

אם ה-State של ה-Session שמור ב-Instance A, ה-Instance B לא יודע עליו כלום.

```bash
Client 
│ 
▼ 
Load Balancer 
├──► Instance A (has Session 1 state) 
├──► Instance B (no state) 
└──► Instance C (no state) 
Request 1 of Session 1 → Instance A ✓ 
Request 2 of Session 1 → Instance B ✗ (state not found)
```

**הפתרונות הקיימים היום**

**Sticky Sessions:** ה-Load Balancer מוודא שכל הבקשות של Session מסוים תמיד מגיעות לאותו Instance. זה פותר את הבעיה אבל יוצר תלות: אם ה-Instance נופל, ה-Session אובד.

nginx

upstream mcp_servers {

ip_hash; # Sticky sessions based on client IP

server instance_a:8080;

server instance_b:8080;

server instance_c:8080;

}

**External State Store:** ה-State לא נשמר ב-Instance אלא בשכבת אחסון חיצונית כמו Redis. כל Instance יכול לגשת ל-State של כל Session.

```python
import redis
import json

redis_client = redis.Redis(host="redis", port=6379, db=0)

def get_session_state(session_id: str) -> dict:
    """Retrieves session state from Redis."""
    data = redis_client.get(f"session:{session_id}")
    if data:
        return json.loads(data)
    return {}

def set_session_state(session_id: str, state: dict, ttl: int = 3600):
    """Stores session state in Redis with TTL."""
    redis_client.setex(
        f"session:{session_id}",
        ttl,
        json.dumps(state)
    )

async def handle_mcp(request: web.Request) -> web.Response:
    session_id = request.headers.get(MCP_SESSION_ID_HEADER, str(uuid.uuid4()))

    # Load state from Redis, not from instance memory
    session_state = get_session_state(session_id)

    transport = StreamableHTTPServerTransport(
        request,
        session_id=session_id
    )
    await server.connect(transport)

    # Save updated state back to Redis
    set_session_state(session_id, session_state)

    return transport.response
```

**Stateless Design:** הפתרון הנקי ביותר לטווח ארוך הוא לתכנן את השרת כך שכל בקשה עצמאית ומכילה את כל המידע שהיא צריכה. אין State שנשמר בין בקשות, אין תלות ב-Instance ספציפי, וה-Load Balancer יכול לנתב בחופשיות.

**מה ה-Roadmap הרשמי של MCP**

הצוות שמפתח את MCP מודע לבעיה ועובד על פתרון ברמת הפרוטוקול שיאפשר Stateless sessions בצורה מובנית. נכון לכתיבת שורות אלה הפתרון עדיין בפיתוח, והגישה המומלצת היא Sticky Sessions לטווח קצר ו-External State Store לטווח ארוך.



## ניהול סודות וניהול תצורה

מערכת MCP שרצה בייצור מתקשרת עם שירותים חיצוניים, מסדי נתונים, ו-APIs. כל אחד מאלה דורש פרטי התחברות: סיסמאות, טוקנים, מפתחות API. הדרך שבה מנהלים את הפרטים האלה היא אחת ההחלטות הראשונות שצריך לקבל לפני פריסה.

**מה אסור לעשות**

לעולם אל תכתוב סודות ישירות בקוד. קוד עולה לגיטהאב, גיטהאב נגיש לאנשים רבים, וסודות שנכתבו בקוד נשארים בהיסטוריה גם אחרי שמוחקים אותם.

```python
# WRONG: Never do this
DATABASE_PASSWORD = "my_secret_password_123"
API_KEY = "sk-abc123xyz"
```

לעולם אל תשמור סודות בקובץ .env שעולה לגיטהאב. צור קובץ.gitignore שמוודא שקבצי .env לא עולים.

**מה נכון לעשות**

**משתני סביבה** הם הגישה הבסיסית. הסודות מוגדרים בסביבת ההרצה ולא בקוד.

```python
import os

# Correct: Read from environment variables
DATABASE_PASSWORD = os.environ.get("DATABASE_PASSWORD")
API_KEY = os.environ.get("API_KEY")

if not DATABASE_PASSWORD:
    raise RuntimeError("DATABASE_PASSWORD environment variable is not set")

if not API_KEY:
    raise RuntimeError("API_KEY environment variable is not set")
```

**Secret Manager** הוא הגישה המועדפת בסביבות ענן. במקום לשמור סודות במשתני סביבה, שומרים אותם בשירות ייעודי כמו AWS Secrets Manager, Azure Key Vault, או HashiCorp Vault. הקוד שולף את הסודות בזמן ריצה.

```python
import boto3
import json

def get_secret(secret_name: str) -> dict:
    """
    Retrieves a secret from AWS Secrets Manager.
    In production: use IAM roles, not access keys.
    """
    client = boto3.client("secretsmanager", region_name="us-east-1")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

# Load secrets at startup
secrets = get_secret("mcp-engineering-lab/production")
DATABASE_PASSWORD = secrets["database_password"]
API_KEY = secrets["api_key"]
```

**ניהול תצורה**

מעבר לסודות, יש הגדרות שמשתנות בין סביבות אבל לא רגישות. Timeouts, מגבלות Rate Limiting, כתובות שירותים. גם אלה לא אמורים להיות קשיחים בקוד.

```python
import os

class Config:
    """
    Application configuration loaded from environment.
    Provides defaults for development, requires explicit values for production.
    """

    ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
    PORT = int(os.environ.get("PORT", 8080))
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

    # Timeouts
    DATABASE_TIMEOUT_SECONDS = float(os.environ.get("DATABASE_TIMEOUT_SECONDS", 5.0))
    EXTERNAL_API_TIMEOUT_SECONDS = float(os.environ.get("EXTERNAL_API_TIMEOUT_SECONDS", 10.0))

    # Rate limiting
    MAX_REQUESTS_PER_MINUTE = int(os.environ.get("MAX_REQUESTS_PER_MINUTE", 100))

    # Validation
    @classmethod
    def validate_production(cls):
        """Validates that all required production settings are configured."""
        if cls.ENVIRONMENT == "production":
            required = [
                "DATABASE_PASSWORD",
                "API_KEY",
                "REDIS_URL"
            ]
            missing = [var for var in required if not os.environ.get(var)]
            if missing:
                raise RuntimeError(
                    f"Missing required environment variables for production: {missing}"
                )

config = Config()
config.validate_production()
```

הקובץ server/server_http.py בריפוזיטורי המלווה משתמש ב-Config:

```python
if __name__ == "__main__":
    config.validate_production()
    web.run_app(app, host="0.0.0.0", port=config.PORT)
```



הקבצים המעודכנים נמצאים בריפוזיטורי המלווה. וודא שקובץ `.gitignore` מכיל:

.env

.env.*

*.pem

*.key

secrets/

## בדיקות לפני פריסה ו-CI/CD

בדיקות שרצות רק כשמתכנת זוכר להריץ אותן הן בדיקות שלא עובדות. בסביבת ייצור, הבדיקות צריכות לרוץ אוטומטית בכל פעם שקוד חדש מועלה, לפני שהוא מגיע למשתמשים.

**מה CI/CD אומר בהקשר של MCP**

**CI**, Continuous Integration, הוא התהליך שמריץ בדיקות אוטומטית בכל פעם שקוד חדש מועלה לגיטהאב.

**CD**, Continuous Deployment, הוא התהליך שפורס את הקוד לסביבת ייצור אוטומטית אחרי שהבדיקות עברו.

בפרויקט MCP, Pipeline בסיסי נראה כך:

```yaml
# .github/workflows/ci.yml
name: MCP Server CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          cd server
          pip install -r requirements.txt
          pip install pytest pytest-asyncio

      - name: Run contract tests
        run: |
          cd server
          pytest tests/test_contracts.py -v

      - name: Run security tests
        run: |
          cd server
          pytest tests/test_security.py -v

      - name: Run integration tests
        run: |
          cd server
          pytest tests/test_integration.py -v

      - name: Validate capabilities hash
        run: |
          cd server
          python scripts/validate_capabilities.py

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          echo "Deploy step configured per your infrastructure"
```

**סדר הבדיקות חשוב**

Contract Tests רצים ראשונים כי הם המהירים ביותר ומגלים בעיות בסיסיות. אם Contract Test נכשל, אין טעם להמשיך לבדיקות מורכבות יותר.

Security Tests רצים שניים כי כשל אבטחה הוא בלוקר שמונע פריסה בכל מקרה.

Integration Tests רצים אחרונים כי הם האיטיים ביותר ודורשים לעיתים שירותים חיצוניים.

**בדיקת Hash של שרתים חיצוניים**

הוסף סקריפט שרץ ב-CI ומוודא שה-Hash של שרתים חיצוניים לא השתנה:

```python
# server/scripts/validate_capabilities.py

import asyncio
import json
import sys
from server import compute_capabilities_hash, APPROVED_SERVER_HASHES

async def validate_all_servers():
    """
    Validates that all external servers match their approved hashes.
    Fails the CI pipeline if any server has changed.
    """
    all_valid = True

    for server_name, approved_hash in APPROVED_SERVER_HASHES.items():
        try:
            current_tools = await fetch_server_tools(server_name)
            unchanged, reason = verify_capabilities_unchanged(
                server_name, current_tools, approved_hash
            )

            if unchanged:
                print(f"✓ {server_name}: capabilities unchanged")
            else:
                print(f"✗ {server_name}: {reason}")
                all_valid = False

        except Exception as e:
            print(f"✗ {server_name}: failed to connect - {str(e)}")
            all_valid = False

    return all_valid

if __name__ == "__main__":
    valid = asyncio.run(validate_all_servers())
    sys.exit(0 if valid else 1)
```

## Concurrency: כמה Sessions שרת אחד יכול לשאת ומתי צריך יותר

שרת MCP שרץ בייצור מטפל במספר בקשות במקביל. השאלה היא כמה הוא יכול לשאת לפני שהביצועים מתדרדרים, ומתי הגיע הזמן להוסיף instances נוספים.

**מה משפיע על יכולת ה-Concurrency**

שרת Python שמשתמש ב-asyncio יכול לטפל בהרבה בקשות במקביל, כל עוד הבקשות הן I/O-bound, כלומר מחכות לתשובות מרשת או ממסד נתונים. בזמן ההמתנה, asyncio מעביר שליטה לבקשה אחרת.

אבל אם יש פעולות שהן CPU-bound, כמו עיבוד כבד של נתונים, הן חוסמות את ה-Event Loop ומאטות את כל הבקשות האחרות.

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "process_large_document":
        document = arguments.get("content")

        # Run CPU-bound processing in a thread pool
        # to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            heavy_processing_function,
            document
        )

        return [
            TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )
        ]
```

איך מגדירים מגבלות Concurrency

```python
import asyncio

class ConcurrencyLimiter:
    """
    Limits the number of concurrent tool executions.
    Prevents resource exhaustion under heavy load.
    """

    def __init__(self, max_concurrent: int = 50):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.current_count = 0
        self.max_concurrent = max_concurrent

    async def acquire(self):
        await self.semaphore.acquire()
        self.current_count += 1

    def release(self):
        self.current_count -= 1
        self.semaphore.release()

    @property
    def utilization(self) -> float:
        """Returns current utilization as a percentage."""
        return (self.current_count / self.max_concurrent) * 100

limiter = ConcurrencyLimiter(max_concurrent=50)

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    try:
        await limiter.acquire()
        metrics.record_concurrency(limiter.current_count)
        return await execute_tool(name, arguments)
    finally:
        limiter.release()
```

**מתי מוסיפים instances**

כמה סימנים שמעידים שצריך יותר מ-instance אחד:

זמן התגובה הממוצע עולה בצורה עקבית. Concurrency Utilization נשאר מעל 80% לאורך זמן. יש בקשות שמקבלות Timeout בגלל עומס ולא בגלל בעיה בלוגיקה.

**הכלל הפשוט:**

- מדוד לפני שתחליט.

- שרת שנראה עמוס עלול להיות בסדר גמור.

- שרת שנראה בסדר עלול להיות קרוב לקצה.

רק Metrics אמיתיים מספרים את הסיפור הנכון.

## Monitoring ו-Incident Response

מערכת שרצה בייצור בלי Monitoring היא מערכת שמגלה בעיות מהמשתמשים, לא מהכלים שלה. Monitoring טוב מגלה בעיות לפני שהמשתמשים מרגישים בהן, ו-Incident Response מגדיר מה עושים כשמשהו משתבש.

**מה צריך לנטר**

**זמינות:** האם השרת עונה לבקשות? בדיקת זמינות בסיסית שרצה כל דקה מספיקה לגלות שהשרת נפל.

```python
# server/scripts/healthcheck.py

import aiohttp
import asyncio
import sys

async def check_health(url: str) -> bool:
    """
    Basic health check for the MCP server.
    Returns True if the server is responding.
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{url}/health",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                return response.status == 200
    except Exception:
        return False

# Add health endpoint to server
async def handle_health(request):
    """Health check endpoint for monitoring systems."""
    return web.json_response({
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metrics": metrics.get_summary()
    })

app.router.add_get("/health", handle_health)
```

**ביצועים:** זמן תגובה ממוצע, שיעור שגיאות, ו-Concurrency Utilization. כשאחד מהם חורג מהסף הרגיל, זה סימן שמשהו משתנה.

**התראות:** התראה טובה מגיעה כשיש עוד זמן לטפל בבעיה לפני שהיא משפיעה על משתמשים.

```python
class AlertingSystem:
    """
    Sends alerts when metrics exceed defined thresholds.
    In production: integrate with PagerDuty, Slack, or similar.
    """

    THRESHOLDS = {
        "error_rate_pct": 5.0,        # Alert if error rate > 5%
        "avg_duration_ms": 2000.0,    # Alert if avg response > 2 seconds
        "concurrency_utilization": 80.0  # Alert if utilization > 80%
    }

    def check_and_alert(self, tool_name: str):
        """Checks metrics and sends alerts if thresholds are exceeded."""
        summary = metrics.get_summary().get(tool_name, {})

        if summary.get("error_rate_pct", 0) > self.THRESHOLDS["error_rate_pct"]:
            self._send_alert(
                level="warning",
                message=f"High error rate for {tool_name}: "
                       f"{summary['error_rate_pct']}%"
            )

        if summary.get("avg_duration_ms", 0) > self.THRESHOLDS["avg_duration_ms"]:
            self._send_alert(
                level="warning",
                message=f"Slow response time for {tool_name}: "
                       f"{summary['avg_duration_ms']}ms"
            )

    def _send_alert(self, level: str, message: str):
        """Sends alert to configured channel."""
        print(f"ALERT [{level.upper()}]: {message}")
        # In production: send to Slack, PagerDuty, email, etc.

alerting = AlertingSystem()
```

**Incident Response**

כשמשהו משתבש בייצור, חשוב שתהיה תשובה ברורה לשאלה "מה עושים עכשיו?" בלי תכנית, כל אירוע הופך לכאוס.

תכנית בסיסית לאירוע:

**שלב 1: זיהוי** האם הבעיה אמיתית או אזעקת שווא? בדוק את ה-Health Check, הלוגים, וה-Metrics לפני שמגייסים את כל הצוות.

**שלב 2: בידוד** האם הבעיה משפיעה על כל המשתמשים או חלקם? האם היא קשורה לשרת ספציפי או לכולם?

**שלב 3: הפחתת נזק** האם יש דרך לעצור את הנזק לפני שמבינים את הסיבה? Rollback לגרסה קודמת, ניתוק שרת בעייתי, או הגבלת גישה זמנית.

**שלב 4: אבחון** השתמש ב-Correlation IDs ו-Replay לשחזור הבעיה. זהה את סוג הכשל לפי ארבעת הקטגוריות מפרק 10.

**שלב 5: תיקון ואימות** תקן, פרוס, ובדוק שהבעיה נפתרה לפני שמסיימים את האירוע.



## Versioning: שמירה על חוזה יציב כשה-Server משתנה

שרת MCP שרץ בייצור הוא שרת שמודלים ו-Clients סומכים עליו. כשמשנים את ה-Schema של Tool, מוסיפים פרמטר חובה, או משנים את פורמט התוצאה, קוד שעבד אתמול עלול להיכשל היום. Versioning הוא האופן שבו מנהלים שינויים בלי לשבור את מי שמשתמש בשרת.

**שני סוגי שינויים**

כפי שדיברנו בפרק 7, יש שינויים שוברים ושינויים שאינם שוברים.

1. **שינויים שאינם שוברים ניתן לפרוס מיד:** הוספת פרמטר אופציונלי חדש, הוספת שדה חדש לתוצאה, שיפור תיאור קיים. מי שמשתמש בגרסה הישנה ממשיך לעבוד.

2. **שינויים שוברים דורשים תכנון:** הסרת פרמטר, שינוי סוג פרמטר קיים, שינוי פורמט התוצאה. מי שמשתמש בגרסה הישנה יקבל שגיאות.

**איך מנהלים שינויים שוברים**

הגישה הנפוצה היא לשמור על שתי גרסאות במקביל לתקופת מעבר.

```python
@server.list_tools()
async def list_tools():
    return [
        # Current version
        Tool(
            name="search_documents",
            description="""Search documents by query. Current version: v2.
            Changes from v1: 'filters' parameter added for advanced filtering.
            v1 (search_documents_v1) available until 2026-06-01.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "maxLength": 200
                    },
                    "max_results": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 20,
                        "default": 10
                    },
                    "filters": {
                        "type": "object",
                        "description": "Optional filters (added in v2)",
                        "properties": {
                            "category": {"type": "string"},
                            "date_from": {
                                "type": "string",
                                "format": "date"
                            }
                        }
                    }
                },
                "required": ["query"]
            }
        ),

        # Deprecated version kept for backward compatibility
        Tool(
            name="search_documents_v1",
            description="""DEPRECATED. Use search_documents instead.
            Will be removed on 2026-06-01.
            Migrate by adding 'filters' support to your integration.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "maxLength": 200
                    },
                    "max_results": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 20,
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_documents_v1":
        # Log deprecation warning
        safe_logger.warning(
            "Deprecated tool called",
            extra={
                "tool": "search_documents_v1",
                "user_id": arguments.get("_user_id"),
                "migration_deadline": "2026-06-01"
            }
        )
        # Delegate to current version without filters
        return await execute_search(
            query=arguments.get("query"),
            max_results=arguments.get("max_results", 10),
            filters=None
        )

    if name == "search_documents":
        return await execute_search(
            query=arguments.get("query"),
            max_results=arguments.get("max_results", 10),
            filters=arguments.get("filters")
        )
```



**ניהול מחזור חיים של גרסאות**

כל גרסה שמסומנת כ-Deprecated צריכה תאריך הסרה ברור. לפני תאריך ההסרה, שלח התראות למי שעדיין משתמש בגרסה הישנה דרך הלוגים. ביום ההסרה, הסר את ה-Tool מהרשימה ואל תיתן לו להופיע ב-Capability Negotiation.

```python
import datetime

DEPRECATED_TOOLS = {
    "search_documents_v1": datetime.date(2026, 6, 1)
}

@server.list_tools()
async def list_tools():
    today = datetime.date.today()
    tools = get_all_tools()

    # Filter out tools past their removal date
    active_tools = []
    for tool in tools:
        removal_date = DEPRECATED_TOOLS.get(tool.name)
        if removal_date and today >= removal_date:
            safe_logger.info(
                "Deprecated tool removed from capabilities",
                extra={"tool": tool.name, "removal_date": str(removal_date)}
            )
            continue
        active_tools.append(tool)

    return active_tools
```



## MCP Server Cards: הכרזת יכולות דרך .well-known לצורך Discovery

כשמספר מערכות וכלים צריכים לגלות מה שרת MCP מציע בלי שמישהו יגדיר את זה ידנית, יש מנגנון סטנדרטי לכך: MCP Server Card.

**מה זה MCP Server Card**

MCP Server Card הוא קובץ JSON שחי בנתיב קבוע בשרת ומתאר את היכולות שלו. כל מי שרוצה לדעת מה השרת מציע יכול לגשת לנתיב הזה ולקבל תיאור מובנה, בלי צורך בחיבור MCP מלא.

הנתיב הסטנדרטי הוא:

GET /.well-known/mcp-server-card.json

**מה Server Card כולל**

json

{

"name": "mcp-engineering-lab",

"version": "1.0.0",

"description": "MCP server for the book MCP Systems Engineering",

"transport": {

"type": "streamable-http",

"endpoint": "/mcp"

},

"capabilities": {

"tools": true,

"resources": true,

"prompts": false

},

"tools": [

{

"name": "search_documents",

"description": "Search documents by a text query",

"version": "2"

},

{

"name": "get_server_metrics",

"description": "Returns server metrics summary"

}

],

"resources": [

{

"uri_prefix": "document://",

"description": "Read documents by ID"

}

],

"contact": {

"name": "Tomer Kedem",

"url": "https://github.com/tomerkedem/mcp-engineering-lab"

}

}



**כיצד מוסיפים Server Card לשרת**

הוסף את ה-Handler ל- server/discovery.py:

```python
from aiohttp import web


# Static Server Card document describing this server's capabilities.
# Update this document whenever tools or resources are added or removed.
# The card is served at /.well-known/mcp-server-card.json following
# the .well-known URI convention defined in RFC 8615.
SERVER_CARD = {
    "name": "mcp-engineering-lab",
    "version": "1.0.0",
    "description": (
        "MCP server companion for the book "
        "MCP Systems Engineering by Tomer Kedem"
    ),
    "transport": {
        "type": "streamable-http",
        "endpoint": "/mcp"
    },
    "capabilities": {
        "tools": True,
        "resources": True,
        "prompts": False
    },
    "tools": [
        {
            "name": "search_documents",
            "description": "Search documents by a text query",
            "version": "2"
        },
        {
            "name": "get_server_metrics",
            "description": "Returns server metrics summary"
        }
    ],
    "resources": [
        {
            "uri_prefix": "document://",
            "description": "Read documents by ID"
        }
    ],
    "contact": {
        "name": "Tomer Kedem",
        "url": "https://github.com/tomerkedem/mcp-engineering-lab"
    }
}


async def handle_server_card(request: web.Request) -> web.Response:
    """
    Returns the MCP Server Card for this server.

    The Server Card is a static JSON document that describes the server's
    capabilities, transport, and contact information.

    Used by discovery tools and host applications to learn about
    this server's capabilities without establishing a full MCP connection.
    """
    return web.json_response(SERVER_CARD)
```

הפונקציה ()create_app ב-server_http.py מייבאת ממנו:

```python
from server.discovery import handle_server_card

def create_app() -> web.Application:
    app = web.Application()

    app.router.add_post("/mcp", handle_mcp)
    app.router.add_get("/health", handle_health)
    app.router.add_get(
        "/.well-known/mcp-server-card.json",
        handle_server_card
    )
    app.router.add_post(
        "/approvals/{request_id}/approve",
        handle_approve
    )
    app.router.add_post(
        "/approvals/{request_id}/reject",
        handle_reject
    )

    return app
```



**Governance ותיעוד לצוותים אחרים**

מערכת MCP שרצה בייצור לא שייכת רק למי שכתב אותה. היא משרתת צוותים אחרים, מודלים אחרים, ולעיתים ארגונים אחרים. Governance הוא האופן שבו מבטיחים שכולם יודעים מה השרת עושה, מה מותר, מה אסור, ומי אחראי על מה.

**מה Governance כולל**

Governance במערכת MCP מתפרש על שלושה תחומים:

1. **תיעוד יכולות:** מה השרת מציע, מה כל Tool עושה, מהי ה-Schema המדויקת, ומה הגבולות. תיעוד שחי בקוד, לא במסמך נפרד שמתיישן.

2. **מדיניות שימוש:** מי יכול להתחבר לשרת, אילו כלים דורשים אישור מיוחד, ומה קורה כשמישהו חורג מהשימוש המוגדר.

3. **בעלות ואחריות:** מי הצוות שאחראי על השרת, איך יוצרים איתם קשר, ומה תהליך הדיווח על בעיות.

**כיצד מממשים Governance בפועל**

הכלי הטוב ביותר ל-Governance הוא קוד שמתעד את עצמו. Tool שה-Schema שלו מדויק, התיאור שלו ברור, וה-Side Effects שלו מתועדים הוא Tool שצוות אחר יכול להשתמש בו בלי לשאול שאלות.

מעבר לקוד, הריפוזיטורי המלווה מכיל קובץ GOVERNANCE.md בשורש:

```markdown
# Governance

## Ownership

This server is owned and maintained by [team name].
For questions or issues, open a GitHub issue or contact [contact].

## Who Can Connect

Any host application that has been approved by the owning team.
To request access, open an issue with the label "access-request".

## Usage Policy

- Tools may be called up to 100 times per user per minute
- Bulk operations affecting more than 100 records require approval
- Destructive operations are blocked in production
- All tool calls are logged and audited

## Change Policy

- Non-breaking changes (new optional parameters, new fields in results)
  are deployed without prior notice
- Breaking changes require a minimum of 30 days notice
- Deprecated tools are announced in the changelog and removed
  after the stated removal date

## Versioning

This server follows semantic versioning.
The current version is available at /.well-known/mcp-server-card.json

## Security

To report a security issue, contact [security contact] directly.
Do not open a public GitHub issue for security vulnerabilities.

## SLA

This server targets 99.9% availability during business hours.
No SLA applies outside business hours unless explicitly agreed.
```

מה חשוב לתעד לצוותים אחרים

צוות שרוצה להשתמש בשרת צריך לדעת שלושה דברים בלי לקרוא את הקוד: מה השרת עושה, איך מתחברים אליו, ומה קורה כשמשהו משתבש. כל מידע שחסר משלושת הדברים האלה הוא מידע שצוות אחר יצטרך לשאול עליו.

הקובץ GOVERNANCE.md נמצא בשורש הריפוזיטורי המלווה.

## תרגול: להכין Checklist מלא לעלייה לייצור

התרגול הזה מסכם את כל פרק 12. הוא מבקש ממך לקחת את המערכת שבנית לאורך הספר ולהכין עבורה Checklist מלא לפני עלייה לייצור.

**חלק א: בדיקת קוד**

עבור על כל Tool ו-Resource שבנית וענה:

1. האם כל Tool מגדיר Schema מלאה עם סוגים, טווחים, ותיאורים ברורים?

2. האם כל Tool מבצע Validation לפני כל לוגיקה?

3. האם כל Tool מחזיר שגיאה ברורה עם isError=True לקלט שגוי?

4. האם כל Resource עטוף ב-wrap_content כדי להגן מפני Prompt Injection?

5. האם כל Tool שמבצע פעולה הרסנית מוגדר ב-RESTRICTED_IN_PRODUCTION או דורש אישור ב-ApprovalGate?

**חלק ב: בדיקת אבטחה**

1. האם כל קריאה לכל Tool עוברת check_permission?

2. האם כל שאילתה לנתונים מיישמת get_tenant_filter?

3. האם הלוגים לא מכילים מידע רגיש?

4. האם קובץ .gitignore מכיל את כל קבצי הסודות?

5. האם APPROVED_SERVER_HASHES מוגדר לכל שרת חיצוני?

**חלק ג: בדיקת תצפיתיות**

1. האם כל קריאה מתועדת עם Correlation ID?

2. האם ה-Metrics מוגדרים ורצים?

3. האם ה-Replay Store מתעד בצורה מסודרת?

4. האם נקודת הקצה /health מחזירה מידע שימושי?

5. האם ה-CI Pipeline מריץ את כל הבדיקות לפני כל פריסה?

**חלק ד: בדיקת תשתית**

1. האם ()config.validate_production נקרא בהפעלת השרת?

2. האם כל המשתני סביבה הנדרשים מוגדרים?

3. האם ה-Transport מוגדר ל-Streamable HTTP ולא STDIO?

4. האם יש מדיניות ברורה לניהול Sessions תחת Load Balancer?

5. האם ה-Server Card מוגדר ומעודכן?

**חלק ה: תיעוד**

1. האם server/README.md מכיל הוראות הרצה מלאות?

2. האם GOVERNANCE.md מגדיר בעלות, מדיניות שימוש, ותהליך דיווח?

3. האם כל Tool ו-Resource מתועדים בתיאורים ברורים בקוד?

4. האם design/architecture-patterns.md מתאר את הדפוסים הארכיטקטוניים שנבחרו?

5. האם design/capabilities.md מעודכן עם כל היכולות הנוכחיות?

**התקדמות בפרויקט המלווה**

הריפוזיטורי המלווה מכיל את הקובץ הבא בשלב זה.

docs/production-checklist.md

```markdown
# Production Readiness Checklist

## Code

- [ ] All Tools define complete Schema with types, ranges, and descriptions
- [ ] All Tools validate input before any business logic
- [ ] All Tools return clear errors with isError=True for invalid input
- [ ] All Resources wrap content to defend against Prompt Injection
- [ ] Destructive Tools are restricted or require approval

## Security

- [ ] All Tool calls pass through check_permission
- [ ] All data queries apply get_tenant_filter
- [ ] Logs contain no sensitive data
- [ ] .gitignore covers all secret files
- [ ] APPROVED_SERVER_HASHES defined for all external servers

## Observability

- [ ] All requests logged with Correlation ID
- [ ] Metrics configured and running
- [ ] Replay Store recording correctly
- [ ] /health endpoint returns useful information
- [ ] CI Pipeline runs all tests before every deployment

## Infrastructure

- [ ] config.validate_production() called at startup
- [ ] All required environment variables defined
- [ ] Transport set to Streamable HTTP
- [ ] Session management policy defined for Load Balancer
- [ ] Server Card configured and up to date

## Documentation

- [ ] server/README.md contains complete setup instructions
- [ ] GOVERNANCE.md defines ownership and usage policy
- [ ] All Tools and Resources documented in code
- [ ] design/architecture-patterns.md up to date
- [ ] design/capabilities.md up to date
```

הקובץ נמצא בריפוזיטורי המלווה.


