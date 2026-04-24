# דפוסים ארכיטקטוניים למערכות MCP

## למה שפה ארכיטקטונית חשובה: קוד עובד הוא לא מספיק

מערכת שעובדת ומערכת שבנויה נכון הן לא אותו דבר.

מערכת שעובדת מבצעת את המשימות שביקשת ממנה. מערכת שבנויה נכון עושה את זה, אבל גם ניתנת לתחזוקה כשהדרישות משתנות, ניתנת להרחבה כשהמערכת גדלה, ניתנת להבנה על ידי מתכנת שמצטרף לצוות חדש, ומאפשרת לזהות בעיות לפני שהן מגיעות לייצור.

ההבדל בין שתיהן הוא לא כמות הקוד. הוא המבנה.

שפה ארכיטקטונית היא אוסף של דפוסים מוכרים שמאפשרים לצוות לדבר על מבנה המערכת בצורה משותפת. כשמתכנת אומר "נשתמש כאן ב-Gateway", כל הצוות מבין מה זה אומר, מה היתרונות שלו, ומה הוא מחייב. בלי שפה משותפת, כל דיון ארכיטקטוני מתחיל מאפס.

הפרק הזה מציג את דפוסי התכנון הנפוצים במערכות MCP. הם לא המצאה חדשה, הם יישום של עקרונות הנדסיים מוכרים לעולם ה-MCP. ההיכרות איתם לא מבטיחה שתבנה מערכת נכונה, אבל היא מבטיחה שתדע לשאול את השאלות הנכונות לפני שמתחילים לכתוב קוד.

## Gateway Pattern: נקודת כניסה אחת, שליטה מרכזית

Gateway הוא דפוס שבו כל הבקשות שמגיעות מהמודל עוברות דרך נקודה אחת לפני שמגיעות לשרתים. ה-Gateway הוא לא שרת MCP בפני עצמו, הוא שכבה שיושבת בין ה-Host לבין שאר השרתים ומרכזת בה שליטה.

**מה Gateway עושה**

ה-Gateway מקבל את כל הקריאות, בודק הרשאות, מתעד, ומנתב לשרת המתאים. במקום שכל שרת יממש בדיקות הרשאות ולוגים בנפרד, הכל קורה במקום אחד.

```bash
Model
  │
  ▼
Gateway (auth, logging, routing)
  ├──► Documents Server
  ├──► Notifications Server
  └──► Orders Server
```

**מתי Gateway מתאים**

כשיש כמה שרתים שכולם צריכים את אותן בדיקות בסיסיות. כשרוצים מקום אחד לשנות מדיניות בלי לגעת בכל שרת בנפרד. כשצריך תיעוד מרכזי של כל הפעולות שהמודל מבצע.

**מה המחיר**

ה-Gateway הוא נקודת כשל יחידה. אם הוא נופל, כל המערכת נופלת. הוא גם יכול להפוך לצוואר בקבוק אם לא מתוכנן לעומס. ולעיתים הוא מסתיר מורכבות שעדיף לטפל בה בשרתים עצמם.

<img src="/Building-AI-Systems-with-MCP/assets/image-09.png" alt="image-09.png" width="394" height="287" />


## Broker Pattern: תיאום בין מספר שרתים

Broker הוא דפוס שבו רכיב אחד אחראי על תיאום בין כמה שרתים כדי לבצע פעולה שאף שרת אחד לא יכול לבצע לבדו. בניגוד ל-Gateway שמנתב בקשות, ה-Broker מרכיב תוצאות ממספר מקורות ומחזיר תשובה אחת מאוחדת.

**מה Broker עושה**

המודל שולח בקשה אחת ל-Broker. ה-Broker יודע שכדי לענות עליה צריך מידע ממספר שרתים. הוא קורא לכל אחד מהם, מאחד את התוצאות, ומחזיר תשובה אחת מסודרת למודל.

```bash
Model
│
▼
Broker
├──► Reads from: Customer Server
├──► Reads from: Orders Server
└──► Reads from: Inventory Server
│
▼
Unified Response to Model
```



**דוגמה מעשית**

מודל שמבקש "תן לי תמונה מלאה על לקוח 1042" צריך נתונים ממסד לקוחות, היסטוריית הזמנות, ומצב מלאי. במקום שהמודל יקרא לשלושה שרתים בנפרד וינסה לאחד את התוצאות, ה-Broker עושה את זה בצורה מסודרת ומחזיר תשובה אחת.

**מתי Broker מתאים**

כשיש פעולות שמחייבות מידע ממספר מקורות שונים. כשרוצים למנוע מהמודל לנהל את ריבוי הקריאות בעצמו. כשיש צורך לאחד נתונים ממקורות שונים לפורמט אחיד.

**מה המחיר**

ה-Broker מוסיף שכבת מורכבות. הוא צריך לדעת על כל השרתים שהוא מתאם ביניהם, מה שיוצר תלות. אם אחד השרתים נכשל, צריך להחליט אם ה-Broker מחזיר תשובה חלקית או שגיאה. וה-Broker עצמו הופך לרכיב שצריך לתחזק כשמוסיפים שרתים חדשים.

<img src="/Building-AI-Systems-with-MCP/assets/image-10.png" alt="image-10.png" width="349" height="305" />


## Tool Facade: מניפולציה של ממשק בלי לשנות את הליבה

Tool Facade הוא דפוס שבו חושפים ממשק פשוט ומנוהל למודל, בעוד שהלוגיקה האמיתית נשארת מאחורי הקלעים ללא שינוי. ה-Facade עומד בין המודל לבין המערכת הקיימת ומתרגם בין השניים.

**מה Tool Facade עושה**

במקום לחשוף את ה-API הפנימי של המערכת ישירות למודל, כותבים שכבה דקה שמקבלת קריאות פשוטות ומתרגמת אותן לפעולות המורכבות שהמערכת הקיימת מבינה.

Model

│

▼

Tool Facade (simple interface)

│

▼

Legacy System (complex internal API)

**דוגמה מעשית**

מערכת קיימת שמנהלת הזמנות חושפת API מורכב עם עשרות פרמטרים, חלקם טכניים ולא רלוונטיים למודל. במקום לחשוף את כל זה, כותבים Facade שמקבל פרמטרים פשוטים וברורים, ומבפנים מתרגם אותם לפורמט שהמערכת הקיימת מבינה.

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "create_order":
        # Simple interface for the model
        customer_id = arguments.get("customer_id")
        items = arguments.get("items")

        # Translation to complex legacy system format
        legacy_request = {
            "header": {
                "transaction_id": str(uuid.uuid4()),
                "source_system": "MCP",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "version": "2.1"
            },
            "body": {
                "cust_ref": customer_id,
                "order_lines": [
                    {
                        "sku": item["id"],
                        "qty": item["quantity"],
                        "unit_price": item.get("price", 0)
                    }
                    for item in items
                ],
                "flags": {
                    "auto_confirm": True,
                    "notify_customer": True
                }
            }
        }

        result = legacy_order_system.submit(legacy_request)

        # Translate response back to simple format
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "order_id": result["header"]["order_ref"],
                    "status": result["body"]["status_code"],
                    "estimated_delivery": result["body"]["delivery"]["eta"]
                }, indent=2)
            )
        ]
```

**מתי Tool Facade מתאים**

כשרוצים לחבר מודל למערכת קיימת בלי לשנות אותה. כשה-API הפנימי מורכב מדי או לא מתאים לחשיפה ישירה למודל. כשרוצים שהמודל יעבוד עם ממשק יציב גם אם המערכת הפנימית משתנה.

**מה המחיר**

ה-Facade מוסיף שכבת תרגום שצריך לתחזק. כשהמערכת הפנימית משתנה, ה-Facade צריך להתעדכן. ולעיתים ה-Facade מסתיר מידע שהמודל היה יכול להשתמש בו אם היה מקבל גישה ישירה.

## Read-Only Server: הפרדה מוחלטת בין קריאה לכתיבה

Read-Only Server הוא דפוס שבו שרת MCP נפרד מוקדש אך ורק לחשיפת מידע, בלי שום יכולת לשנות מצב. כל ה-Resources וכל הכלים שהשרת חושף הם לקריאה בלבד. אין בו Tool אחד שמבצע פעולה.

**מה ההיגיון מאחורי הדפוס**

כשמפרידים קריאה מכתיבה לשרתים נפרדים, ההרשאות הופכות לפשוטות יותר, ברורות יותר, וקשות יותר לפריצה. מודל שמחובר רק לשרת Read-Only לא יכול לשנות שום דבר במערכת, גם אם הוא מנסה, גם אם הוא קיבל הוראות זדוניות, וגם אם ה-Schema שלו מוגדרת בצורה לא מושלמת.

```bash
Model (analysis task) 
│ 
▼ 
Read-Only Server Action Server 
├── Resource: customers 
├── Tool: update_customer 
├── Resource: orders 
├── Tool: cancel_order 
└── Resource: inventory 
└── Tool: send_notification
```

**מתי Read-Only Server מתאים**

כשיש משימות שדורשות גישה למידע אבל לא לפעולות. לדוגמה, מודל שמנתח נתונים ומייצר דוחות לא צריך גישה לשום כלי שמשנה מצב. חיבורו לשרת Read-Only בלבד מבטיח שגם במקרה של כשל הוא לא יגרום לנזק.

כשרוצים לאפשר גישה למידע לגורמים חיצוניים בלי לחשוף יכולות פעולה. שותף עסקי שצריך גישה לנתוני מלאי יקבל חיבור לשרת Read-Only בלבד.

**מה המחיר**

מספר שרתים מגדיל את המורכבות התפעולית. צריך לתחזק שני שרתים במקום אחד, לוודא שהנתונים עקביים בין שניהם, ולנהל שני ערכות הרשאות נפרדות. זה מחיר שמשתלם כשהפרדת הגבולות חשובה, אבל מיותר כשהמערכת פשוטה ומוגבלת.

## Action Server מבודד: כלים הרסניים בסביבה נפרדת

Action Server מבודד הוא דפוס שבו כלים שמבצעים פעולות הרסניות או בלתי הפיכות רצים בשרת נפרד לחלוטין, עם הרשאות מוגבלות יותר, בקרה מחמירה יותר, ולעיתים אישור אנושי לפני כל פעולה.

**מה ההבדל בין Action Server ל-Read-Only Server**

Read-Only Server מבודד קריאה מכתיבה. Action Server מבודד כלים רגילים מכלים מסוכנים. ייתכן שרת שמכיל כלים לעדכון רשומות ושרת נפרד שמכיל כלים למחיקה, איפוס, או שליחת פעולות בלתי הפיכות.

```bash
Model
├──► Standard Server
│       ├── Tool: update_customer 
│       ├── Tool: add_note 
│       └── Tool: send_notification 
│
└──► Isolated Action Server (strict controls)
         ├── Tool: delete_customer ← requires approval 
   ├── Tool: reset_all_data ← requires approval 
   └── Tool: bulk_cancel_orders ← requires approval
```

**מתי Action Server מבודד מתאים**

כשיש כלים שהנזק שלהם אם יופעלו בטעות גדול מהתועלת של הנוחות. מחיקת נתונים, שליחת הודעות לכל הלקוחות, ביטול הזמנות בכמות גדולה. כלים כאלה ראויים לשרת נפרד עם שכבת הגנה נוספת.

כשרוצים שלוגים של פעולות מסוכנות יהיו נפרדים ומוגנים יותר. כשרוצים לאכוף מדיניות שונה, כמו דרישת אישור אנושי, רק על סוג מסוים של פעולות.

**מה המחיר**

כמו ב-Read-Only Server, ריבוי שרתים מגדיל מורכבות תפעולית. בנוסף, הגדרת מה נחשב "מסוכן מספיק" לבידוד היא החלטה שדורשת שיפוט ומשתנה בין מערכות. שרת מבודד שמכיל כלים שבעצם לא מסוכנים הוא מורכבות מיותרת. שרת לא מבודד שמכיל כלים שכן מסוכנים הוא סיכון.

**Policy Enforcement Layer: שכבת מדיניות מחוץ לשרת**

Policy Enforcement Layer הוא דפוס שבו מדיניות הארגון, מה מותר, מה אסור, ומה דורש אישור, מקודדת בשכבה נפרדת שעומדת בין ה-Host לבין השרתים. במקום שכל שרת יממש את המדיניות בעצמו, יש מקום אחד שאחראי על כך.

**מה ההבדל בין Policy Layer ל-Gateway**

Gateway מנתב בקשות ומרכז תקשורת. Policy Layer אוכף כללים עסקיים. לעיתים הם מיושמים יחד, אבל הם עושים דברים שונים. Gateway שואל "לאן הבקשה צריכה ללכת?" Policy Layer שואל "האם הבקשה הזו מותרת בכלל?"

```bash
Model
  │
  ▼
Policy Enforcement Layer
  ├── Is this action allowed for this user?
  ├── Is this action allowed in this environment?
  ├── Does this action require approval?
  └── Is this action within the rate limit?
  │
  ▼
MCP Server
```

מה Policy Layer כולל

```python
class PolicyEnforcementLayer:
    """
    Enforces organizational policies before any tool execution.
    Lives between the Host and MCP Servers.
    """

    def __init__(self):
        self.policies = []

    def add_policy(self, policy: dict):
        """Adds a policy to the enforcement layer."""
        self.policies.append(policy)

    def evaluate(
        self,
        tool_name: str,
        arguments: dict,
        user_context: dict
    ) -> tuple[bool, str]:
        """
        Evaluates all policies for a given tool call.
        Returns (allowed, reason).
        """
        for policy in self.policies:
            if policy["condition"](tool_name, arguments, user_context):
                if policy["action"] == "block":
                    return False, policy["message"]
                elif policy["action"] == "require_approval":
                    if not arguments.get("_approval_token"):
                        return False, f"Approval required: {policy['message']}"

        return True, "all policies passed"

# Define organizational policies
policy_layer = PolicyEnforcementLayer()

policy_layer.add_policy({
    "name": "no_destructive_actions_in_production",
    "condition": lambda tool, args, ctx: (
        tool in ["delete_customer", "reset_all_data"] and
        ctx.get("environment") == "production"
    ),
    "action": "block",
    "message": "Destructive actions are not permitted in production"
})

policy_layer.add_policy({
    "name": "bulk_operations_require_approval",
    "condition": lambda tool, args, ctx: (
        tool in ["bulk_cancel_orders", "send_bulk_notification"] and
        args.get("count", 0) > 100
    ),
    "action": "require_approval",
    "message": "Bulk operations affecting more than 100 records require manager approval"
})

policy_layer.add_policy({
    "name": "rate_limit_per_user",
    "condition": lambda tool, args, ctx: (
        rate_limiter.is_exceeded(ctx.get("user_id"), tool)
    ),
    "action": "block",
    "message": "Rate limit exceeded. Please wait before retrying."
})
```

**מתי Policy Layer מתאים**

כשיש מדיניות ארגונית שחלה על כמה שרתים שונים. כשרוצים שמדיניות תהיה מרוכזת ונגישה לשינוי בלי לגעת בקוד של כל שרת. כשיש דרישות תאימות שצריכות להיות מאוכפות בצורה עקבית בכל המערכת.

**מה המחיר**

Policy Layer שגדל ללא שליטה הופך לבעיה בפני עצמו. כשיש עשרות מדיניות, קשה להבין מה מותר ומה אסור, ושינוי מדיניות אחת עלול להשפיע על אחרות בצורה לא צפויה. Policy Layer טוב הוא Policy Layer שכל מדיניות בו פשוטה, ברורה, ובדוקה.



## Human in the Loop ו-Approval Gate: מתי המודל לא מחליט לבד

Human in the Loop הוא דפוס שבו פעולות מסוימות לא מתבצעות אוטומטית, אלא עוצרות ומחכות לאישור אנושי לפני שממשיכות. ה-Approval Gate הוא נקודת העצירה הזו.

זה לא דפוס של חוסר אמון במודל. זה דפוס של הנדסה אחראית. יש פעולות שהנזק הפוטנציאלי שלהן גדול מדי מכדי להסתמך על שיפוט אוטומטי בלבד, גם כשהמודל מתנהג נכון.

**מתי עוצרים לאישור**

לא כל פעולה צריכה אישור. הוספת אישור לכל פעולה הופכת את המערכת לבלתי שמישה. הכלל הוא לעצור רק כשמתקיים לפחות אחד מהתנאים הבאים:

הפעולה בלתי הפיכה. מחיקת נתונים, שליחת הודעות, ביטול הזמנות. פעולות שאפשר לבטל בקלות לא דורשות אישור.

הפעולה משפיעה על מספר גדול של רשומות. עדכון לקוח אחד לא דורש אישור. עדכון אלף לקוחות דורש.

הפעולה חורגת מהתחום הרגיל. פעולה שלא מתרחשת בדרך כלל, או שמתרחשת בשעה לא רגילה, או עם פרמטרים חריגים.

**כיצד מממשים Approval Gate**

```python
class ApprovalGate:
    """
    Manages approval requests for sensitive operations.
    In production: integrate with your team's communication tools.
    """

    def __init__(self):
        self.pending_approvals = {}

    def request_approval(
        self,
        tool_name: str,
        arguments: dict,
        user_id: str,
        reason: str
    ) -> str:
        """
        Creates an approval request and returns a request ID.
        The operation is paused until the request is approved or rejected.
        """
        request_id = str(uuid.uuid4())
        self.pending_approvals[request_id] = {
            "tool_name": tool_name,
            "arguments": sanitize_for_audit(arguments),
            "requested_by": user_id,
            "reason": reason,
            "status": "pending",
            "created_at": datetime.datetime.utcnow().isoformat()
        }

        # Notify approver (in production: send to Slack, email, etc.)
        self._notify_approver(request_id, tool_name, user_id, reason)

        return request_id

    def check_approval(self, request_id: str) -> tuple[bool, str]:
        """
        Checks the status of an approval request.
        Returns (approved, reason).
        """
        request = self.pending_approvals.get(request_id)

        if not request:
            return False, "Approval request not found"

        if request["status"] == "approved":
            return True, "Approved"

        if request["status"] == "rejected":
            return False, f"Rejected: {request.get('rejection_reason', 'No reason provided')}"

        return False, "Pending approval"

    def _notify_approver(
        self,
        request_id: str,
        tool_name: str,
        user_id: str,
        reason: str
    ):
        """Sends notification to the approver."""
        print(
            f"APPROVAL REQUIRED\n"
            f"Request ID: {request_id}\n"
            f"Tool: {tool_name}\n"
            f"Requested by: {user_id}\n"
            f"Reason: {reason}\n"
            f"Approve at: /approvals/{request_id}"
        )

approval_gate = ApprovalGate()
```

שלב ה-Approval Gate בתוך ה-Tool:

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "bulk_cancel_orders":
        order_count = arguments.get("order_count", 0)
        user_id = arguments.get("_user_id")
        approval_token = arguments.get("_approval_token")

        # Check if approval is required
        if order_count > 100:
            if not approval_token:
                # Request approval and pause
                request_id = approval_gate.request_approval(
                    tool_name=name,
                    arguments=arguments,
                    user_id=user_id,
                    reason=f"Bulk cancel of {order_count} orders"
                )
                return [
                    TextContent(
                        type="text",
                        text=json.dumps({
                            "status": "pending_approval",
                            "approval_request_id": request_id,
                            "message": f"Cancelling {order_count} orders requires approval. "
                                      f"Request ID: {request_id}"
                        }, indent=2)
                    )
                ]

            # Verify the approval token
            approved, reason = approval_gate.check_approval(approval_token)
            if not approved:
                return [
                    TextContent(
                        type="text",
                        text=f"Operation not approved: {reason}"
                    )
                ], True

        # Proceed with the operation
        result = order_service.bulk_cancel(arguments.get("order_ids", []))
        return [
            TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )
        ]
```

**מתי Human in the Loop מתאים**

כשהמערכת פועלת בתחום שבו טעות אחת יכולה לגרום לנזק כספי, משפטי, או תדמיתי משמעותי. כשהארגון דורש מדיניות של "עין אנושית" על פעולות מסוימות מטעמי תאימות. כשרוצים לבנות אמון הדרגתי במערכת לפני שמרחיבים את האוטונומיה שלה.

**מה המחיר**

אישור אנושי מוסיף Latency לתהליך. אם האישור לא מגיע בזמן, הפעולה תקועה. צריך לתכנן מה קורה כשאישור לא מגיע, האם הפעולה נדחית אוטומטית אחרי זמן מסוים, ומי אחראי לנהל את תור הבקשות הממתינות.



## Deterministic Core with Probabilistic Edge: ליבה יציבה, קצה הסתברותי

זהו אחד הדפוסים החשובים ביותר בהנדסת מערכות MCP, ואחד הפחות מדוברים. הרעיון פשוט: מפרידים בין החלקים שחייבים להיות דטרמיניסטיים לבין החלקים שיכולים להיות הסתברותיים.

**מה ההבדל בין ליבה לקצה**

הליבה הדטרמיניסטית היא כל מה שחייב לעבוד אותו דבר בכל פעם. ולידציה, הרשאות, כתיבה למסד נתונים, שליחת הודעות, תיעוד. אלה תהליכים שאי אפשר לסמוך על מודל לנהל אותם, כי הם דורשים עקביות מוחלטת.

הקצה ההסתברותי הוא כל מה שהמודל עושה טוב יותר מקוד קשיח: הבנת כוונה, פרשנות שפה טבעית, החלטה על מה לעשות הלאה, ויצירת תשובות. אלה הדברים שהמודל מביא לשולחן.

```bash
User Request
     │
     ▼
Probabilistic Edge (Model)
  - Understands intent
  - Decides which tools to call
  - Interprets results
  - Generates response
     │
     ▼
Deterministic Core (System)
  - Validates input
  - Checks permissions
  - Executes actions
  - Logs everything
 - Enforces policies
```

**למה ההפרדה חשובה**

מערכת שמנסה לגרום למודל לנהל גם את ההחלטות וגם את הביצוע הדטרמיניסטי היא מערכת שתתנהג בצורה לא עקבית. המודל יכול להחליט בצורה שונה בכל הרצה. אם ההחלטות האלה כוללות גם ולידציה, גם הרשאות, וגם לוגיקה עסקית, הכל הופך לבלתי ניתן לחיזוי.

מערכת שמפרידה נכון בין ליבה לקצה מאפשרת למודל לעשות את מה שהוא עושה טוב, בעוד שהמערכת שומרת על עקביות בכל השאר.

**דוגמה מעשית**

מודל שמקבל בקשה בשפה טבעית "בטל את ההזמנות שלא שולמו מהחודש שעבר" עושה את העבודה ההסתברותית: מבין את הכוונה, מחליט לקרוא ל-Tool המתאים, ומנסח פרמטרים. הליבה הדטרמיניסטית עושה את השאר: מאמתת שהפרמטרים תקינים, בודקת שהמשתמש מורשה, מבצעת את הביטול, ומתעדת.

המודל לא יודע אם הולידציה עברה. הוא לא יודע אם ההרשאה אושרה. הוא מקבל תוצאה, ועובד איתה. כל הלוגיקה הקריטית נשארת בקוד שניתן לבדוק, לנטר, ולסמוך עליו.

## Capability Partitioning ו-Multiple MCP Servers: מתי לפצל

Capability Partitioning הוא החלטה לפצל את יכולות המערכת בין מספר שרתי MCP נפרדים במקום לרכז את כולן בשרת אחד. זו לא החלטה טכנית בלבד, היא החלטה ארגונית שמשפיעה על איך הצוות עובד, על אבטחה, ועל יכולת ההרחבה.

**מתי נכון לפצל**

**גבולות אחריות ברורים:** כשחלקים שונים של המערכת מנוהלים על ידי צוותים שונים, הגיוני שכל צוות יחזיק את השרת שלו. צוות הלקוחות מחזיק את Customer Server, צוות ההזמנות מחזיק את Orders Server. כך כל צוות אחראי על ה-Schema, הולידציה, וה-Deployment של השרת שלו.

**רמות אבטחה שונות:** כשיש יכולות שדורשות רמת הגנה גבוהה יותר מאחרות. שרת שמכיל כלים פיננסיים צריך בקרות שונות משרת שמכיל כלים לקריאת מסמכים.

**קצבי שינוי שונים:** כשחלקים שונים של המערכת משתנים בתדירות שונה. שרת שמשתנה כל יום לא אמור להשפיע על שרת יציב שמשתנה פעם בחודש.

**עומסים שונים:** כשיכולות שונות דורשות משאבים שונים. שרת שמבצע חישובים כבדים יכול להתרחב באופן עצמאי בלי להשפיע על שרתים קלים יותר.

**מתי לא לפצל**

פיצול מיותר יוצר מורכבות ללא תועלת. שרת שמכיל שלושה כלים פשוטים לא צריך להיות מפוצל לשלושה שרתים. הכלל הפשוט: פצל כשיש סיבה ברורה, לא כדי להיראות ארכיטקטוני יותר.

<img src="/Building-AI-Systems-with-MCP/assets/image-11.png" alt="image-11.png" width="551" height="307" />


## Anti-Patterns: המבנים השגויים שחוזרים שוב ושוב

Anti-Pattern הוא מבנה שנראה הגיוני בהתחלה, מיושם בקלות, ומתגלה כבעייתי רק כשהמערכת גדלה או כשמשהו משתבש. ההיכרות עם Anti-Patterns חשובה לא פחות מההיכרות עם הדפוסים הנכונים.

**Anti-Pattern 1: השרת שעושה הכל**

השרת הנפוץ ביותר ב-MCP הוא שרת אחד שמכיל את כל יכולות המערכת. קריאת מסמכים, עדכון לקוחות, שליחת הודעות, מחיקת נתונים, כל זה בשרת אחד. בהתחלה זה נראה פשוט ונוח. עם הזמן זה הופך למפלצת שאי אפשר לתחזק.

הבעיות: אי אפשר להגדיר הרשאות מדויקות כי הכל באותו שרת. שינוי קטן בחלק אחד עלול לשבור חלק אחר. קשה לבדוק כי כל דבר תלוי בכל דבר. וקשה לאבטח כי משטח התקיפה הוא כל השרת.

**Anti-Pattern 2: הפרומפט כקו הגנה**

מתכנת שמוסיף לפרומפט "אל תמחק יותר מעשר רשומות" או "תוודא שהמשתמש מאשר לפני כל פעולה". כפי שדיברנו בפרק 9, פרומפט הוא הנחיה, לא אכיפה. הגבולות חייבים להיות בקוד, לא בטקסט.

**Anti-Pattern 3: Schema שמקבל הכל**

Tool שה-Schema שלו מגדיר פרמטר אחד מסוג object שמקבל "כל מה שצריך". זה נראה גמיש, אבל בפועל זה אומר שאין חוזה. המודל מנחש, הולידציה לא אפשרית, והשרת מקבל כל קלט בלי יכולת לבדוק שהוא תקין.

**Anti-Pattern 4: State גלובלי בשרת**

שרת שמאחסן State ברמה הגלובלית שמשותף בין כל ה-Sessions. משתמש A מבצע פעולה שמשפיעה על ה-State שמשתמש B רואה. זה מקור לבאגים שקשה מאוד לאתר, ולדליפת מידע בין משתמשים.

**Anti-Pattern 5: Tool שמסתיר כשלים**

Tool שמחזיר "הצלחה" גם כשמשהו השתבש, כי המתכנת רצה למנוע הודעות שגיאה מהמשתמש. המודל ממשיך הלאה כאילו הכל עבד, ומקבל החלטות על בסיס מידע שגוי. כשל שמוסתר הוא כשל שמתרחב.

**Anti-Pattern 6: חיבור שרתים חיצוניים ללא בדיקה**

מתכנת שמחבר שרת MCP חיצוני כי הוא נראה שימושי, בלי לבדוק את התיאורים, בלי Hash, ובלי הגבלת הרשאות. כפי שראינו בפרק 9, שרת חיצוני שלא נבדק הוא וקטור תקיפה.

**Anti-Pattern 7: Debugging בייצור**

מתכנת שמוסיף לוגים מפורטים לייצור כדי לאבחן בעיה, ושוכח להסיר אותם. הלוגים מכילים מידע רגיש, נגישים לאנשים רבים, ונשמרים זמן רב. Debugging בייצור צריך להיות מתוכנן מראש דרך כלים כמו Correlation IDs ו-Replay, לא דרך הוספת לוגים זמניים.

## תרגול: לבחור שני דפוסים ולהסביר מתי כל אחד מתאים

התרגול הזה לא מבקש ממך לכתוב קוד. הוא מבקש ממך לחשוב ארכיטקטונית.

**חלק א: בחירת דפוסים**

בחר שני דפוסים מתוך הרשימה הבאה:

1. Gateway Pattern

2. Broker Pattern

3. Tool Facade

4. Read-Only Server

5. Action Server מבודד

6. Policy Enforcement Layer

7. Human in the Loop

8. Deterministic Core with Probabilistic Edge

9. Capability Partitioning

לכל דפוס שבחרת, ענה על השאלות הבאות:

**תיאור המערכת:** תאר מערכת קונקרטית שאתה מכיר או מתכנן שבה הדפוס הזה מתאים. לא מערכת כללית, אלא מערכת ספציפית עם שם, תחום, ומשתמשים אמיתיים.

**למה הדפוס מתאים:** מה בדיוק בצרכים של המערכת הזו גורם לדפוס הזה להיות הבחירה הנכונה? ענה בצורה ספציפית, לא "כי זה נכון ארכיטקטונית".

**מה המחיר:** מה הדפוס הזה מוסיף מבחינת מורכבות, תחזוקה, או מגבלות? האם המחיר מוצדק בהקשר של המערכת שתיארת?

**מתי הדפוס לא היה מתאים:** תאר מערכת שונה שבה אותו דפוס היה בחירה שגויה ולמה.

**חלק ב: השוואה בין שני הדפוסים**

אחרי שניתחת כל דפוס בנפרד, ענה:

1. האם שני הדפוסים שבחרת יכולים לדור יחד באותה מערכת? אם כן, כיצד הם משלימים זה את זה? אם לא, מדוע הם סותרים?

2. אם היית צריך לבחור רק אחד מהשניים למערכת שאתה עובד עליה כרגע, מה היית בוחר ולמה?


