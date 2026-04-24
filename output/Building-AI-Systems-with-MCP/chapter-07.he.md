# איך מתכננים Tools למערכות אמיתיות

## מה הופך Tool לטוב: עקרון האחריות היחידה

Tool שעובד ו-Tool שטוב הם לא אותו דבר. Tool שעובד מחזיר תוצאה נכונה כשקוראים לו עם קלט תקין. Tool טוב עושה את זה, אבל גם נשאר נכון כשהמערכת גדלה, כשהדרישות משתנות, וכשמודל קורא לו בצורה שלא צפית מראש.

ההבדל בין השניים מתחיל בשאלה אחת: האם ה-Tool עושה דבר אחד בלבד?

עיקרון האחריות היחידה מוכר מעולם התכנות הכללי, אבל ב-MCP יש לו משמעות נוספת. Tool שעושה יותר מדבר אחד לא רק קשה לתחזוקה, הוא גם מסוכן. כשמודל קורא ל-Tool שמעדכן רשומה, שולח התראה, ומעדכן לוג בפעולה אחת, הוא לא יכול לשלוט על מה בדיוק יקרה. הוא לא יכול לבקש רק חלק מהפעולות. הוא לא יכול לדעת מראש אילו תופעות לוואי כרוכות בקריאה.

Tool שעושה דבר אחד בלבד נותן למודל שליטה אמיתית. המודל יכול לבחור אם לקרוא לו, מתי לקרוא לו, ועם אילו פרמטרים. הוא יכול לשלב כמה Tools בסדר שהוא מחליט עליו. ואם משהו משתבש, קל לזהות איזה Tool גרם לבעיה.

כשמגדירים Tool חדש, שאלה אחת מספיקה כדי לבדוק אם הוא מוגדר נכון: אם היית צריך לתת לו שם שמתאר במדויק מה הוא עושה, האם השם הזה פשוט וברור? אם השם מכיל "ו" או "גם", זה סימן שה-Tool עושה יותר מדי.

## איך בוחרים גבולות נכונים: מתי Tool צר מדי ומתי רחב מדי

אחרי שמבינים שכל Tool צריך לעשות דבר אחד בלבד, עולה שאלה מעשית: מה נחשב "דבר אחד"? איפה מסתיים Tool אחד ומתחיל השני?

אין תשובה אחת נכונה, אבל יש שני כשלים נפוצים שכדאי להכיר.

**Tool צר מדי**

Tool שמוגדר ברמת פירוט גבוהה מדי גורם לכך שמודל צריך לקרוא לעשרות Tools כדי לבצע פעולה פשוטה. לדוגמה, Tool שמעדכן רק את שם הלקוח, Tool אחר שמעדכן רק את הכתובת, ועוד Tool שמעדכן רק את מספר הטלפון. במקום שלושה Tools נפרדים, המבנה הנכון הוא Tool אחד שמעדכן את פרטי הלקוח ומקבל את השדות שרוצים לעדכן כפרמטרים אופציונליים.

כלל פשוט: אם שני Tools תמיד נקראים יחד ואף פעם לא בנפרד, הם כנראה צריכים להיות Tool אחד.

**Tool רחב מדי**

Tool שמוגדר ברמת הפשטה גבוהה מדי גורם לכך שפעולה אחת מסתירה בתוכה הרבה לוגיקה שהמודל לא מודע אליה. לדוגמה, Tool בשם process_order שמאמת הזמנה, מחייב את כרטיס האשראי, שולח אישור ללקוח, ומעדכן את המלאי. כשמשהו משתבש, אי אפשר לדעת באיזה שלב.

כלל פשוט: אם Tool יכול להיכשל בכמה סיבות שונות שדורשות טיפול שונה, הוא כנראה רחב מדי.

**איך מוצאים את האיזון**

תכנן את ה-Tool סביב כוונה אחת ברורה, לא סביב פעולה טכנית אחת. "עדכן פרטי לקוח" היא כוונה אחת גם אם מדובר בכמה שדות. "בצע הזמנה מקצה לקצה" היא כמה כוונות שצריכות להיות Tools נפרדים.

## Input Schema נכון: החוזה שהמודל לא יכול להתעלם ממנו

ה-Input Schema הוא לא תיעוד. הוא החוזה הפורמלי בין המודל לבין ה-Tool. כשה-Schema מוגדרת נכון, המודל מקבל תיאור מדויק של מה ה-Tool מצפה לקבל, ואין מקום לניחוש.

Schema גרועה נראית כך:

```python
inputSchema={
    "type": "object",
    "properties": {
        "data": {
            "type": "string",
            "description": "The data to process"
        }
    }
}
```

זה לא חוזה. זה תיאור עמום שמשאיר למודל לנחש מה "data" אמור להכיל, באיזה פורמט, ומה הגבולות שלו.

Schema טובה נראית כך:

```python
inputSchema={
    "type": "object",
    "properties": {
        "customer_id": {
            "type": "string",
            "description": "Unique customer identifier (format: CUST-XXXXXX)",
            "pattern": "^CUST-[0-9]{6}$"
        },
        "status": {
            "type": "string",
            "description": "New status for the customer account",
            "enum": ["active", "suspended", "closed"]
        },
        "reason": {
            "type": "string",
            "description": "Reason for the status change (required when status is suspended or closed)",
            "maxLength": 500
        }
    },
    "required": ["customer_id", "status"]
}
```

**ההבדל ברור:** כל פרמטר מוגדר עם סוג, תיאור ברור, גבולות, וערכים תקינים. המודל לא צריך לנחש. הוא עובד מול הגדרה מדויקת.

**מספר עקרונות ל-Schema טובה:**

**תאר את הפורמט במפורש**

אם פרמטר מצפה לתאריך, כתוב "format": "date" ותן דוגמה בתיאור. אם מצפה למזהה בפורמט מסוים, כתוב את הפורמט ב-pattern.

**הגדר ערכים תקינים**

אם פרמטר מקבל רק ערכים מסוימים, השתמש ב-enum. זה מונע מהמודל להמציא ערכים שנשמעים הגיוניים אבל לא קיימים.

**הגדר גבולות מפורשים**

אורך מקסימלי למחרוזות, ערכים מינימליים ומקסימליים למספרים. לא כי המודל יתעלם מהגבולות, אלא כי ה-Validation שיבוא אחר כך ישתמש בהגדרות האלה.

**הבדל בין חובה לאופציונלי**

פרמטרים חובה נרשמים ב-required. פרמטרים אופציונליים מקבלים ערך ברירת מחדל ב-default. אל תשאיר את זה לניחוש.

## Validation קשוח: מה לבדוק לפני שהפעולה מתחילה

Schema מגדירה את החוזה. Validation אוכף אותו.

ה-Schema שמגדירים ב-inputSchema הוא הצהרה שה-Client יכול להציג למודל. אבל הוא לא מבטיח שהקלט שמגיע לשרת אכן עומד בו. מודל יכול לשלוח ערכים שלא תואמים ל-Schema, ושרת שלא מבצע Validation יקבל אותם בשקט וימשיך.

זו הסיבה שValidation בתוך ה-Tool עצמו הוא לא אופציונלי.

הוסף את הפונקציה הבאה לקובץ server/server.py:

```python
def validate_search_input(arguments: dict) -> str | None:
    """
    Validates search_documents input.
    Returns error message if invalid, None if valid.
    """
    query = arguments.get("query")
    max_results = arguments.get("max_results", 10)

    if query is None:
        return "Missing required parameter: query"

    if not isinstance(query, str):
        return "Parameter 'query' must be a string"

    if len(query.strip()) == 0:
        return "Parameter 'query' cannot be empty"

    if len(query) > 200:
        return f"Parameter 'query' exceeds maximum length of 200 characters (got {len(query)})"

    if not isinstance(max_results, int):
        return "Parameter 'max_results' must be an integer"

    if max_results < 1 or max_results > 20:
        return f"Parameter 'max_results' must be between 1 and 20 (got {max_results})"

    return None
```

ה-handler בריפוזיטורי המלווה משתמש בפונקציית הולידציה call_tool:

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_documents":
        error = validate_search_input(arguments)
        if error:
            return [
                TextContent(type="text", text=f"Validation error: {error}")
            ], True

        query = arguments["query"].strip()
        max_results = arguments.get("max_results", 10)

        results = [
            {"id": "1", "title": "Sample Document", "score": 0.95}
        ][:max_results]

        return [
            TextContent(
                type="text",
                text=json.dumps(results, indent=2)
            )
        ]

    raise ValueError(f"Tool not found: {name}")
```

**מספר עקרונות ל-Validation נכון:**

**בדוק קיום לפני סוג**

אם פרמטר חובה חסר, זו השגיאה הראשונה שצריך לדווח עליה. אל תנסה לגשת לערך לפני שבדקת שהוא קיים.

**בדוק סוג לפני תוכן**

אם פרמטר צריך להיות מספר שלם, בדוק את זה לפני שבודקים את הטווח שלו.

**החזר שגיאה ברורה עם פרטים**

לא "invalid input" אלא "Parameter 'max_results' must be between 1 and 20 (got 25)". מודל שמקבל שגיאה ברורה יכול לתקן את הקריאה. מודל שמקבל שגיאה עמומה לא יודע מה לתקן.

**עצור בשגיאה הראשונה**

אל תנסה לאסוף את כל השגיאות ולהחזיר אותן יחד. החזר את הראשונה, תן למודל לתקן, ותן לו לנסות שוב.

הקובץ המעודכן server/server.py נמצא בריפוזיטורי המלווה.



## שגיאות צפויות ושגיאות לא צפויות: איך מחזירים כל אחת

לא כל השגיאות נולדות שוות. חלקן צפויות מראש, חלקן מפתיעות. הטיפול בכל אחת שונה, והבלבול ביניהן הוא אחד הגורמים הנפוצים למערכות שקשה לתחזק.

**שגיאות צפויות**

אלה שגיאות שידענו מראש שיכולות לקרות ותכננו אותן כחלק מהחוזה של ה-Tool. לדוגמה, רשומה שלא קיימת, ערך שמחוץ לטווח התקין, או פעולה שלא מותרת בהקשר הנוכחי. שגיאות כאלה מוחזרות כתוצאה עם isError=True, כי הן מידע שהמודל צריך כדי להחליט מה לעשות הלאה.

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_customer":
        customer_id = arguments.get("customer_id")
        customer = database.find_customer(customer_id)

        # Expected error: customer does not exist
        if not customer:
            return [
                TextContent(
                    type="text",
                    text=f"Customer not found: {customer_id}"
                )
            ], True

        return [
            TextContent(
                type="text",
                text=json.dumps(customer, indent=2)
            )
        ]
```

**שגיאות לא צפויות**

אלה שגיאות שלא תכננו אותן מראש. חיבור למסד הנתונים נפל, שירות חיצוני לא ענה, קובץ שצריך להיות קיים לא נמצא. שגיאות כאלה נזרקות כחריגה, כי הן מעידות על בעיה במערכת שצריך לטפל בה ברמת ה-Host, לא ברמת המודל.

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_customer":
        customer_id = arguments.get("customer_id")

        try:
            customer = database.find_customer(customer_id)
        except DatabaseConnectionError as e:
            # Unexpected error: infrastructure problem
            raise RuntimeError(f"Database unavailable: {str(e)}")

        if not customer:
            return [
                TextContent(
                    type="text",
                    text=f"Customer not found: {customer_id}"
                )
            ], True

        return [
            TextContent(
                type="text",
                text=json.dumps(customer, indent=2)
            )
        ]
```

**הכלל המעשי**

שאל את עצמך: האם המודל יכול לעשות משהו שימושי עם השגיאה הזו? אם כן, החזר אותה כתוצאה עם isError=True. אם לא, זרוק חריגה ותן ל-Host לטפל בה.

רשומה שלא קיימת היא מידע. המודל יכול לדווח על זה למשתמש. חיבור שנפל הוא בעיה תשתיתית. המודל לא יכול לפתור אותה, ואין טעם להעמיס אותה עליו.



**Side Effects: מה קורה בעולם כשה-Tool רץ**

כל Tool שמשנה מצב במערכת מייצר Side Effects. זה לא בעיה, זו המטרה. אבל Side Effects שלא תוכננו ולא תועדו הם מקור לכשלים שקשה לאתר.

Side Effect הוא כל שינוי שה-Tool מבצע מעבר לתוצאה שהוא מחזיר. Tool שמעדכן רשומה במסד הנתונים ומחזיר אישור, ה-Side Effect שלו הוא עדכון הרשומה. Tool שמשלח הודעה ומחזיר מזהה הודעה, ה-Side Effect שלו הוא ההודעה שנשלחה. אלה Side Effects מתוכננים שהמודל מצפה להם.

הבעיה היא כשיש Side Effects שהמודל לא מודע אליהם.

**להלן מספר דוגמאות נפוצות:**

**Triggers במסד הנתונים:**

עדכון רשומה מפעיל Trigger שמעדכן טבלה אחרת. המודל לא יודע שהטבלה השנייה השתנתה ועלול לקבל החלטות על בסיס נתונים שאינם עדכניים.

**Cascading updates:**

מחיקת רשומה מחיקה גם רשומות תלויות. המודל ביקש למחוק לקוח אחד וקיבל מחיקה של כל ההזמנות שלו.

**קריאות לשירותים חיצוניים:**

Tool שמעדכן נתון גם מודיע לשירות חיצוני על השינוי. המודל לא יודע שיש צד שלישי שמושפע.

**איך מתכננים Tool עם Side Effects בצורה נכונה:**

ראשית, תעד כל Side Effect בתיאור ה-Tool. לא בתיעוד חיצוני, אלא בשדה description של ה-Tool עצמו. המודל קורא את התיאור כחלק מה-Capability Negotiation, וכך הוא מודע ל-Side Effects לפני שהוא מחליט לקרוא ל-Tool.

```python
Tool(
    name="suspend_customer",
    description="""Suspends a customer account.
    Side effects:
    - All active sessions for this customer are terminated immediately
    - A suspension notification is sent to the customer's email
    - All pending orders are placed on hold automatically""",
    inputSchema={...}
)
```

שנית, החזר בתוצאה מידע על ה-Side Effects שהתרחשו. לא רק "הצלחה", אלא "הרשומה עודכנה, שלוש הזמנות הועברו להמתנה, הודעה נשלחה".

```python
return [
    TextContent(
        type="text",
        text=json.dumps({
            "status": "suspended",
            "customer_id": customer_id,
            "side_effects": {
                "sessions_terminated": 2,
                "notification_sent": True,
                "orders_on_hold": 3
            }
        }, indent=2)
    )
]
```

כך המודל מקבל תמונה מלאה של מה שקרה, ויכול לדווח למשתמש בצורה מדויקת.

## Idempotency: למה חשוב שקריאה כפולה לא תשבור דבר

Idempotency היא התכונה שבה קריאה כפולה לאותו Tool עם אותם פרמטרים מייצרת את אותה תוצאה בלי לגרום לנזק נוסף. Tool שהוא Idempotent אפשר לקרוא לו פעמיים בטעות ולא יקרה שום דבר רע.

למה זה חשוב במערכות MCP?

מודלים לא תמיד מודעים לכך שהם כבר קראו לאותו Tool. ברצף פעולות ארוך, מודל עלול לקרוא ל-Tool פעם שנייה כי הוא לא זכר שכבר קרא לו, כי הוא לא קיבל תוצאה ברורה בפעם הראשונה, או כי ה-Host ניסה שוב אחרי כשל תקשורת. בלי Idempotency, קריאה כפולה יכולה לגרום לשליחת שתי הודעות, יצירת שתי רשומות זהות, או חיוב כפול.

**כיצד מממשים Idempotency:**

הדרך הנפוצה ביותר היא שימוש ב-Idempotency Key. המודל שולח מזהה ייחודי עם כל קריאה, והשרת בודק אם כבר טיפל בקריאה עם אותו מזהה.

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "send_notification":
        idempotency_key = arguments.get("idempotency_key")
        customer_id = arguments.get("customer_id")
        message = arguments.get("message")

        # Check if this request was already processed
        if idempotency_key:
            existing = cache.get(f"notification:{idempotency_key}")
            if existing:
                return [
                    TextContent(
                        type="text",
                        text=json.dumps({
                            "status": "already_sent",
                            "notification_id": existing["notification_id"],
                            "idempotency_key": idempotency_key
                        }, indent=2)
                    )
                ]

        # Send the notification
        notification_id = notification_service.send(customer_id, message)

        # Store the result for future duplicate requests
        if idempotency_key:
            cache.set(
                f"notification:{idempotency_key}",
                {"notification_id": notification_id},
                ttl=86400  # 24 hours
            )

        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "sent",
                    "notification_id": notification_id
                }, indent=2)
            )
        ]
```

לא כל Tool חייב להיות Idempotent, אבל כל Tool שמבצע פעולה שעלולה לגרום לנזק אם תתבצע פעמיים צריך להיות. שליחת הודעות, חיובים, יצירת רשומות, והפעלת תהליכים הם המועמדים הברורים.

כלל פשוט: אם ה-Tool הוא Idempotent, כתוב את זה במפורש בתיאור שלו. אם הוא לא, כתוב גם את זה. המודל שקורא ל-Tool צריך לדעת מה הסיכון בקריאה כפולה.

## Timeouts ו-Retries: על מה ה-Tool אחראי ועל מה לא

כש-Tool לוקח יותר זמן ממצופה, או כשהוא נכשל באמצע, עולות שתי שאלות: מי מחכה, ומי מנסה שוב? התשובה לשתיהן משפיעה על יציבות המערכת כולה.

**על מה ה-Tool אחראי**

ה-Tool אחראי על Timeout מול השירותים שהוא עצמו קורא להם. אם ה-Tool קורא למסד נתונים או ל-API חיצוני, הוא צריך להגדיר מסגרת זמן מקסימלית לקריאה הזו ולטפל בכישלון אם חלפה.

```python
import asyncio

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "fetch_report":
        report_id = arguments.get("report_id")

        try:
            # Timeout after 5 seconds
            result = await asyncio.wait_for(
                report_service.fetch(report_id),
                timeout=5.0
            )
            return [
                TextContent(
                    type="text",
                    text=json.dumps(result, indent=2)
                )
            ]
        except asyncio.TimeoutError:
            return [
                TextContent(
                    type="text",
                    text=f"Report service did not respond within 5 seconds. Try again later."
                )
            ], True
        except Exception as e:
            raise RuntimeError(f"Unexpected error fetching report: {str(e)}")
```

**על מה ה-Tool לא אחראי**

ה-Tool לא אחראי על Retry של הקריאה אליו עצמו. זו אחריות ה-Host. אם ה-Host החליט לנסות שוב אחרי כשל, ה-Tool צריך לטפל בקריאה החדשה כאילו היא קריאה רגילה, בלי לדעת שזו ניסיון חוזר. זו עוד סיבה שIdempotency חשוב: אם ה-Host מנסה שוב, ה-Tool צריך להיות מסוגל לטפל בזה בבטחה.

**מה לתעד**

כל Tool שקורא לשירות חיצוני צריך לציין בתיאור שלו את ה-Timeout שהוא מגדיר ומה קורה כשהוא חולף. המודל שמקבל שגיאת Timeout צריך לדעת אם כדאי לנסות שוב, להמתין, או לדווח למשתמש שהשירות לא זמין.

```python
Tool(
    name="fetch_report",
    description="""Fetches a report by ID from the reporting service.
    Timeout: 5 seconds.
    If the service does not respond within 5 seconds, returns an error.
    Safe to retry after 30 seconds.""",
    inputSchema={...}
)
```

## Versioning: איך שומרים על חוזה יציב כשה-Tool משתנה

כל Tool שנכתב היום ישתנה בעתיד. דרישות משתנות, שירותים מתעדכנים, והבנה של הבעיה מעמיקה עם הזמן. השאלה היא לא אם ה-Tool ישתנה, אלא איך משנים אותו בלי לשבור את מי שכבר משתמש בו.

**מה נחשב שינוי שובר**

שינוי שובר הוא כל שינוי שגורם לקריאה שעבדה אתמול להיכשל היום. הסרת פרמטר, שינוי סוג של פרמטר קיים, שינוי שם של פרמטר, ושינוי פורמט התוצאה הם כולם שינויים שוברים. מודל שבנה קריאה לפי ה-Schema הישן יקבל שגיאה או תוצאה לא צפויה.

**מה לא נחשב שינוי שובר**

הוספת פרמטר אופציונלי חדש היא לא שינוי שובר. קריאה ישנה שלא כוללת את הפרמטר החדש תמשיך לעבוד עם ערך ברירת המחדל. הוספת שדה חדש לתוצאה היא גם לא שינוי שובר, כל עוד השדות הקיימים נשארים.

**איך מנהלים שינויים שוברים**

כשאין ברירה אלא לבצע שינוי שובר, הגישה הנכונה היא לשמור את שתי הגרסאות במקביל לתקופת מעבר.

```python
@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_documents",
            description="""Search documents by query.
            Current version: v2.
            Changes from v1: added 'filters' parameter for advanced filtering.""",
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
                            "date_from": {"type": "string", "format": "date"}
                        }
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="search_documents_v1",
            description="""Deprecated. Use search_documents instead.
            Will be removed after 2025-12-31.""",
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
```

**כללי אצבע לVersioning:**

הוסף תמיד פרמטרים חדשים כאופציונליים עם ערך ברירת מחדל. אל תשנה שם של פרמטר קיים, הוסף פרמטר חדש עם השם החדש ותמשיך לתמוך בישן. כשמסיימים תמיכה בגרסה ישנה, ציין תאריך הסרה ברור בתיאור ה-Tool. ושמור על עקביות פורמט התוצאה גם כשמוסיפים שדות חדשים.



## תרגול: לקחת Tool רחב ולפרק אותו לכלים נקיים יותר

לפניך Tool שנכתב בצורה לא נכונה. הוא עושה יותר מדי, ה-Schema שלו עמומה, והוא לא מטפל בשגיאות בצורה מסודרת.

```python
Tool(
    name="manage_order",
    description="Manages an order",
    inputSchema={
        "type": "object",
        "properties": {
            "order_id": {"type": "string"},
            "action": {"type": "string"},
            "data": {"type": "object"}
        },
        "required": ["order_id", "action"]
    }
)
```

ה-Tool הזה מקבל `action` שיכול להיות "cancel", "update", "refund", או "notify". הלוגיקה בתוכו היא בלוק ענק של `if/elif` שמטפל בכל אחד מהמקרים האלה בנפרד.

**חלק א: זיהוי הבעיות**

**לפני שמפרקים, ענה על השאלות הבאות:**

1. כמה כוונות שונות מסתתרות בתוך ה-Tool הזה?

2. אילו Side Effects יכולים לקרות ולא מתועדים בתיאור?

3. מה קורה כשמודל שולח `action` שלא קיים?

4. איך מודל אמור לדעת מה להכניס ב-`data` לכל `action` שונה?

**חלק ב: פירוק ל-Tools נקיים**

**פרק את ה-Tool לכלים נפרדים. לכל Tool חדש הגדר:**

1. שם ברור שמתאר כוונה אחת.

2. תיאור שכולל Side Effects ידועים.

3. Schema מדויקת עם פרמטרים ברורים.

4. Validation מפורש לפני כל לוגיקה.

5. שגיאות ברורות לכל מקרה כשל.

**חלק ג: עדכון הפרויקט**

**הקובץ server/server.py בריפוזיטורי המלווה מכיל את ה-Tools המעודכנים.**

**לאחר מכן פתח את MCP Inspector ובדוק:**

1. שכל Tool מופיע עם תיאור ברור.

2. שה-Schema של כל Tool מוגדר במדויק.

3. שקריאה לכל Tool עם קלט תקין מחזירה תוצאה נכונה.

4. שקריאה עם קלט שגוי מחזירה שגיאה ברורה.
