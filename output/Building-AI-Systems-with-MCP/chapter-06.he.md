# בניית שרת MCP ראשון

עד כאן עסקנו ברעיונות. למדנו מהו Resource, מהו Tool, ומהו Prompt, ומתי כל אחד מהם הוא הבחירה הנכונה. אבל הבנה מושגית לא בונה מערכת. בפרק הזה עוברים לקוד: שרת MCP שרץ בפועל, חושף יכולות, ומגיב לקריאות.

## בחירת שפת המימוש

הצעד הראשון לפני שכותבים שורת קוד אחת הוא לבחור באיזו שפה לכתוב את השרת. MCP תומך במספר שפות, אבל לא כולן באותה רמת בשלות.

**TypeScript ו-Python** הם ה- SDKs הבשלים ביותר כרגע. שניהם מתוחזקים באופן פעיל על ידי Anthropic, מתועדים היטב, ויש להם קהילה פעילה. רוב הדוגמאות והדרכות הקיימות כתובות בשתי השפות האלה. אם אין לך שיקול מיוחד, בחר אחת מהן.

**C#, Java ו-Kotlin** הם אפשרויות רשמיות שמתאימות לצוותים שעובדים בסביבות enterprise עם תשתית קיימת בשפות אלה. הם פחות בשלים מ-TypeScript ו-Python, אבל נתמכים רשמית ומתפתחים בקצב טוב.

הפרק הזה מציג קוד ב-TypeScript וב-Python במקביל. בחר את השפה שאתה עובד בה ועקוב אחרי הדוגמאות הרלוונטיות לך. אם אתה עובד ב-C#, Java, או Kotlin, המבנה הלוגי זהה והתחביר בלבד שונה.

## Transport ראשון: STDIO לפיתוח מקומי

לפני שמתחילים לכתוב קוד, חשוב להבין מהו Transport ולמה הבחירה בו משפיעה על כל מה שבא אחריה.

Transport הוא הערוץ שדרכו ה-Client וה-Server מתקשרים. בדיוק כמו שאפליקציית ווב יכולה לתקשר דרך HTTP או WebSocket, שרת MCP יכול לתקשר דרך כמה סוגי Transport שונים. הבחירה בין Transport אחד לשני משפיעה על איך מריצים את השרת, איך מחברים אליו Client, ומה נדרש מהתשתית שמסביב.

**למה STDIO לפיתוח מקומי?**

STDIO הוא הפשוט ביותר להקמה. ה-Server רץ כתהליך נפרד, וה-Client מתקשר איתו דרך stdin ו-stdout, כניסה ויציאה סטנדרטיות של התהליך. אין צורך בשרת HTTP, אין צורך בפורטים, אין צורך בהגדרות רשת. מריצים את השרת, מריצים את ה-Client, והם מדברים ישירות.

זה מה שהופך את STDIO לנקודת ההתחלה הנכונה: הוא מאפשר להתרכז בלוגיקה של המערכת בלי להתעסק בתשתית. כשהלוגיקה עובדת נכון, עוברים ל-Transport שמתאים לסביבת ייצור.

**מה משתמשים בו בסביבת ייצור?**

Streamable HTTP הוא ה-Transport המועדף לסביבות Production. הוא תומך בחיבורים מרובים, עומס גבוה, ופריסה בענן. נעסוק בו בפרק 12 כשנעבור מאב טיפוס למערכת אמיתית. בשלב הזה STDIO מספיק לחלוטין.



## הקמת סביבת עבודה והתקנת ה-SDK

בשלב זה תיקיית server/ בריפוזיטורי המלווה מוכנה לקוד האמיתי. כל הקבצים שנדונו בפרק זה נמצאים בה.

פתח טרמינל והיכנס לתיקיית הריפוזיטורי המקומי שלך.

הרץ את הפקודות הבאות:

```bash
cd server	
python -m venv venv
source venv/bin/activate
pip install mcp
pip freeze > requirements.txt
```

על Windows הפקודה להפעלת הסביבה הווירטואלית היא:

```bash
venv\Scripts\activate
```

לאחר ההתקנה, בדוק שהכל עובד:

```bash
python -c "import mcp; print(mcp.__version__)"
```

אם מודפסת גרסה, הסביבה מוכנה.

**עדכון** .gitignore

קובץ ה-.gitignore בריפוזיטורי המלווה מכיל את השורות הבאות:

```bash
server/venv/
server/__pycache__/
```

**מבנה התיקיות בריפוזיטורי אחרי השלב הזה:**

```bash
server/ 
├── venv/ ← Python virtual environment (not committed to git)
└── requirements.txt ← Python dependencies
```



## מבנה מינימלי של שרת

לפני שמוסיפים יכולות, צריך להבין מה חייב להיות בשרת כדי שיוכל לתקשר עם Client. שרת MCP מינימלי עושה שלושה דברים: מכריז על עצמו, מאזין לבקשות, ועונה עליהן בפורמט הנכון.

הקובץ server/server.py בריפוזיטורי המלווה מכיל את הקוד הבא:

```python
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server

server = Server("mcp-first-server")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

להרצת השרת:

```bash
cd server
source venv/bin/activate
python server.py
```

השרת יעלה וימתין לבקשות. הוא לא מדפיס כלום למסך כי כל התקשורת שלו מתבצעת דרך stdin ו-stdout. אם לא מופיעה שגיאה, השרת עובד. עצור את השרת עם `Ctrl+C` והתקדם לשלב הבא.

**מבנה התיקיות בריפוזיטורי אחרי השלב הזה:**

```bash
server/ 
├── server.py ← MCP server (main entry point) 
├── venv/ ← Python virtual environment (not committed to git) 
└── requirements.txt ← Python dependencies
```



## חשיפת Resource ראשון

**עכשיו נוסיף למערכת יכולת ראשונה:** Resource שמחזיר מסמך לפי מזהה. זה השלב שבו השרת מתחיל לחשוף מידע שהמודל יכול לקרוא.

שרת MCP דורש שני handlers לכל Resource: אחד שמחזיר את רשימת המשאבים הזמינים, ואחד שמחזיר את התוכן של משאב ספציפי לפי URI. ה-Client קורא לרשימה בשלב ה-Capability Negotiation, ולאחר מכן קורא לתוכן לפי הצורך.

פתח את server/server.py והוסף את הקוד הבא מתחת לשורת server = Server("mcp-first-server"):

```python
from mcp.types import Resource, TextContent

@server.list_resources()
async def list_resources():
    return [
        Resource(
            uri="document://1",
            name="Sample Document",
            description="A sample document for testing",
            mimeType="text/plain"
        )
    ]

@server.read_resource()
async def read_resource(uri: str):
    if uri == "document://1":
        return [
            TextContent(
                type="text",
                text="This is the content of document 1."
            )
        ]
    raise ValueError(f"Resource not found: {uri}")
```

להרצת השרת:

```bash
cd server
source venv/bin/activate
python server.py
```

עצור את השרת עם Ctrl+C. בשלב 6.8 נבדוק את ה-Resource בצורה מסודרת עם MCP Inspector.

הקובץ המעודכן server/server.py נמצא בריפוזיטורי המלווה.



## חשיפת Tool ראשון

**עכשיו נוסיף יכולת שנייה:** Tool שמחפש מסמכים לפי שאילתה. זה השלב שבו השרת מתחיל לחשוף פעולות שהמודל יכול להפעיל.

**שים לב להבדל מה-Resource:** Tool דורש גם רישום של ה-Schema המלאה של הקלט, כולל סוגי הפרמטרים, מה חובה ומה אופציונלי, ומה הטווח התקין של כל ערך. זה החוזה שדיברנו עליו בפרק 5.

פתח את server/server.py והוסף את הקוד הבא מתחת ל-handlers של ה-Resource:

```python
from mcp.types import Tool
import json

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_documents",
            description="Search documents by a text query",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query",
                        "maxLength": 200
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
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
    if name == "search_documents":
        query = arguments.get("query", "").strip()
        max_results = arguments.get("max_results", 10)

        if not query:
            return [
                TextContent(type="text", text="Error: query cannot be empty")
            ], True

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

להרצת השרת:

```bash
cd server
source venv/bin/activate
python server.py
```

עצור את השרת עם Ctrl+C.

הקובץ המעודכן server/server.py נמצא בריפוזיטורי המלווה.



## טיפול בשגיאות בסיסיות

שגיאות במערכת MCP הן לא רק אירועים טכניים. הן מידע שהמודל משתמש בו כדי להחליט מה לעשות הלאה. שגיאה ברורה מאפשרת למודל לנסות שוב עם פרמטרים אחרים. שגיאה עמומה גורמת למודל להמשיך כאילו הכל בסדר, וזה מסוכן.

יש שני סוגי שגיאות שצריך להכיר:

**שגיאת פרוטוקול** נזרקת כשמשהו בסיסי משתבש. לדוגמה, בקשה ל-Resource שלא קיים, או קריאה ל-Tool שלא מוגדר. זו שגיאה שה-Client מקבל ומעביר ל-Host. בקוד שכתבנו כבר יש דוגמאות לשגיאות מסוג זה:

```python
raise ValueError(f"Resource not found: {uri}")
raise ValueError(f"Tool not found: {name}")
```

**שגיאת תוצאה** נחזרת בתוך תוצאת ה-Tool כשהפעולה נכשלה מסיבה עסקית. המודל רואה אותה ויכול להגיב אליה. בקוד שכתבנו כבר יש דוגמה לשגיאה מסוג זה:

```python
return [
    TextContent(type="text", text="Error: query cannot be empty")
], True  # isError=True
```

הפרמטר True השני הוא isError. הוא מסמן למודל שהתוצאה היא שגיאה עסקית, לא תוצאה תקינה. מודל שמקבל isError=True יודע שצריך לטפל בבעיה, לא להמשיך כאילו הפעולה הצליחה.

כלל פשוט לבחירה בין שני הסוגים: אם הבעיה היא בפרוטוקול או בקלט לא תקין ברמה הבסיסית, זרוק שגיאה. אם הבעיה היא בלוגיקה העסקית, החזר תוצאה עם isError=True.

אין צורך לשנות קוד בשלב הזה. הטיפול בשגיאות כבר קיים בקוד שכתבנו ב-6.5 וב-6.6. הפרק הזה נועד להבהיר את ההיגיון מאחורי הבחירות שעשינו.



## בדיקה ידנית עם MCP Inspector

עד עכשיו הרצנו את השרת ובדקנו שהוא עולה בלי שגיאות. אבל לא בדקנו שהיכולות שחשפנו באמת עובדות כמו שצריך. זה מה שMCP Inspector נועד לעשות.

MCP Inspector הוא כלי פיתוח שמאפשר לתקשר עם שרת MCP ישירות מהדפדפן, בלי צורך בחיבור למודל. הוא מציג את הכלים והמשאבים שהשרת חושף, מאפשר לקרוא אליהם עם פרמטרים שאתה בוחר, ומציג את התוצאות שחוזרות.

**הרצת השרת עם MCP Inspector:**

ודא שהסביבה הווירטואלית פעילה, ואז הרץ:

```bash
cd server
source venv/bin/activate
npx @modelcontextprotocol/inspector python server.py
```

ה-Inspector יציג בטרמינל כתובת URL. פתח אותה בדפדפן. **מה לבדוק**

**בדיקה 1: רשימת יכולות**

בפאנל השמאלי תראה את הכלים והמשאבים שהשרת חושף. ודא שמופיעים:

```bash
- Resource: `document://1`
- Tool: `search_documents`
```

אם אחד מהם לא מופיע, יש בעיה ברישום ה-Handler.

**בדיקה 2: קריאה ל-Resource**

לחץ על `document://1` ובדוק שהתוכן שחוזר הוא:

```bash
This is the content of document 1.
```

**בדיקה 3: קריאה ל-Tool עם קלט תקין**

לחץ על `search_documents`, הכנס ערך תקין בשדה `query`, ולחץ Run.

ודא שחוזרת רשימה של תוצאות בפורמט JSON.

**בדיקה 4: קריאה ל-Tool עם קלט שגוי**

קרא ל-`search_documents` עם `query` ריק. ודא שחוזרת שגיאה ברורה:

```bash
Error: query cannot be empty
```

אם כל ארבע הבדיקות עברו בהצלחה, השרת עובד נכון ומוכן לשלב הבא.



<img src="/Building-AI-Systems-with-MCP/assets/image-07.png" alt="image-07.png" width="685" height="331" />




## תרגול

הגעת לנקודה שבה יש לך שרת MCP שעובד עם Resource אחד ו-Tool אחד. התרגול הזה מבקש ממך להרחיב אותו עם יכולות שרלוונטיות לתחום שאתה עובד בו.

**חלק א: הוסף Resource נוסף**

הגדר Resource שמחזיר מידע שרלוונטי למערכת שאתה מכיר. זה יכול להיות פרטי לקוח, מוצר, הזמנה, או כל ישות אחרת.

**ה-Resource צריך לעמוד בשלושה תנאים:**

1. URI ברור שמתאר את מה שהוא מחזיר.

2. תוכן שמוחזר בפורמט מובנה.

3. שגיאה ברורה כשה-URI לא קיים.

**חלק ב: הוסף Tool נוסף**

הגדר Tool שמבצע פעולה פשוטה. אין צורך בחיבור למסד נתונים אמיתי. מספיק שהכלי עומד בארבעה תנאים:

1. Schema מוגדר עם לפחות פרמטר אחד חובה ואחד אופציונלי.

2. ולידציה של הקלט לפני כל לוגיקה.

3. תוצאה תקינה לקלט תקין.

4. שגיאה ברורה עם isError=True לקלט שגוי.

**חלק ג: בדוק עם MCP Inspector**

לאחר שהוספת את היכולות החדשות, פתח את MCP Inspector ובדוק:

1. שכל הכלים והמשאבים מופיעים ברשימה.

2. שכל Resource מחזיר את התוכן הנכון.

3. שכל Tool מחזיר תוצאה תקינה לקלט תקין.

4. שכל Tool מחזיר שגיאה ברורה לקלט שגוי.

**מצב הריפוזיטורי בשלב זה**

הקבצים הבאים נמצאים בריפוזיטורי המלווה בשלב זה.

```bash
server/server.py                     ← updated MCP server 
server/requirements.txt     ← Python dependencies 
server/README.md             ← setup and run instructions
```


