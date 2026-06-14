# בניית Stock Agent עם Tool

עד עכשיו בנינו שתי שכבות חשובות:

build_rag_db.py בונה בסיס RAG ושומר אותו לדיסק

rag_chatbot.py טוען את בסיס ה-RAG ועונה על שאלות לפי מסמכים

זו מערכת חשובה, אבל היא עדיין עובדת בעיקר עם מידע שכבר הכנו מראש.

בפרק זה נעבור לסוג אחר של יכולת:

**Agent שמפעיל כלי חיצוני בזמן אמת.**

במקום לחפש תשובה בתוך מסמכים, הסוכן יקבל שאלה על מניה, יבין שצריך נתון עדכני, יפעיל פונקציה שמביאה מידע פיננסי, ואז יחזיר תשובה מסודרת למשתמש.

הקובץ המרכזי שנבנה בחלק הזה הוא:

```bash
stock_agent.py
```

הרעיון המרכזי הוא:

```bash
User question
   ↓
Agent understands the request
   ↓
Agent chooses a tool
   ↓
Tool fetches external data
   ↓
Agent receives the result
   ↓
Agent returns a clear answer
```

זו קפיצה חשובה לעומת RAG Chatbot.

ב-RAG Chatbot מקור המידע הוא מסמכים שכבר נשמרו ב-Vector Store.

ב-Stock Agent מקור המידע הוא כלי חיצוני שמופעל בזמן הריצה.

לדוגמה, אם המשתמש שואל:

```bash
What is the current price of MSFT?
```

לא נרצה שהמודל ינחש מחיר. מחיר מניה הוא מידע משתנה. לכן המערכת צריכה להפעיל כלי שמביא את הנתון בזמן אמת.

במקרה שלנו, הכלי ישתמש בספרייה:

```python
yfinance
```

היא תאפשר לנו להביא נתוני מניה לפי ticker symbol כמו:

```bash
MSFT
AAPL
TSLA
NVDA
```

המשתמש לא צריך לדעת איך מפעילים את הכלי. הוא לא כותב:

```python
get_stock_info("MSFT")
```

הוא פשוט שואל בשפה טבעית:

```bash
What is the current price of Microsoft stock?
```

וה-Agent צריך להבין לבד שכנראה מדובר ב-MSFT, להפעיל את הכלי, לקבל נתונים, ולנסח תשובה.

זה בדיוק הרעיון של Agent עם Tools: המודל לא רק מחזיר טקסט, אלא מקבל יכולת להפעיל פעולות חיצוניות לפי הצורך. הטקסט הקיים שלך כבר מסביר את המעבר הזה מ-RAG למערכת שמפעילה כלי, אבל כאן נבנה אותו מחדש סביב קובץ מלא שאפשר להעלות ל-GitHub ולהריץ.

## מה אנחנו בונים

אנחנו בונים Stock Agent פשוט שרץ דרך שורת הפקודה.

ה-Agent יוכל לענות על שאלות כמו:

```bash
What is the current price of MSFT?
Give me market data for Apple stock.
What is the quote for NVDA?
```

המערכת תורכב משלושה רכיבים מרכזיים:

```bash
LLM
Tools
Instructions
```

ה-LLM אחראי להבין את השאלה ולנסח תשובה.

ה-Tools מאפשרים לסוכן להביא מידע מבחוץ.

ה-Instructions מגדירות לסוכן מתי להשתמש בכלי, איך להתנהג, ואיך להחזיר תשובה למשתמש.

במקרה שלנו נתחיל עם כלי אחד:

```python
get_stock_info
```

הכלי הזה יקבל ticker symbol, יביא נתוני מניה דרך yfinance, ויחזיר טקסט מסודר עם מידע בסיסי:

```bash
Company name
Current price
Currency
Day high
Day low
Volume
```

הזרימה המלאה תהיה:

```bash
User:
What is the current price of MSFT?

Agent:
This question requires live market data.

Tool call:
get_stock_info("MSFT")

Tool result:
Microsoft Corporation
Current price: ...
Day high: ...
Day low: ...
Volume: ...

Final answer:
The current market data for Microsoft is...
```

בסוף הפרק הזה יהיו לנו:

1. requirements.txt מעודכן

2. קובץ stock_agent.py מלא

3. Agent שרץ דרך command-line

4. Tool שמביא נתוני מניה

5. הוראות הרצה

6. שאלות בדיקה

7. טיפול בסיסי בשגיאות

השלב הבא הוא להגדיר את הקבצים שנשתמש בהם ולעדכן את requirements.txt.

## הקבצים שנשתמש בהם

לפני שנכתוב את stock_agent.py, נוודא שמבנה הפרויקט ברור.

בשלב הזה כבר יש לנו את הקבצים מהחלקים הקודמים:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  rag_chatbot.py
  requirements.txt
  data/
    sample_docs.txt
  chroma_db/
```

עכשיו נוסיף קובץ חדש:

```bash
stock_agent.py
```

לאחר ההוספה, מבנה הפרויקט יהיה:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  rag_chatbot.py
  stock_agent.py
  requirements.txt
  data/
    sample_docs.txt
  chroma_db/
```

אפשר לחשוב על שלושת קבצי ה-Python כך:

<div dir="rtl">

| **קובץ** | **תפקיד** |
| --- | --- |
| **build_rag_db.py** | בונה את בסיס ה-RAG ושומר אותו לדיסק |
| **rag_chatbot.py** | טוען את בסיס ה-RAG ועונה לפי מסמכים |
| **stock_agent.py** | מפעיל Agent עם tool שמביא נתוני מניה |

</div>

הקובץ stock_agent.py לא צריך את chroma_db.

זו נקודה חשובה.

ה-RAG Chatbot עובד מול מסמכים שנשמרו מראש.

ה-Stock Agent עובד מול כלי חיצוני שמביא מידע בזמן אמת.

לכן הזרימות שונות:

```bash
RAG Chatbot:
Question → Vector Store → Context → LLM → Answer

Stock Agent:
Question → Agent → Tool → External Data → LLM → Answer
```

בפרק זה נתמקד רק ב-Stock Agent.

**עדכון requirements.txt**

כדי לבנות את ה-Agent, נצטרך כמה ספריות נוספות.

נשתמש ב:

```python
langchain
langchain-anthropic
yfinance
python-dotenv
```

- langchain מאפשרת לנו לבנות Agent ולהגדיר tools.

- langchain-anthropic מאפשרת לעבוד עם מודל של Anthropic דרך LangChain.

- yfinance תביא את נתוני המניה.

- python-dotenv תאפשר בעתיד לטעון משתני סביבה מקובץ .env, למרות שבשלב הזה עדיין אפשר להגדיר אותם ישירות ב-PowerShell.

הקובץ requirements.txt בשלב הזה יכול להיראות כך:

```python
langchain
langchain-chroma
langchain-community
langchain-anthropic
chromadb
sentence-transformers
yfinance
python-dotenv
```

אם כבר יש לך requirements.txt מהחלקים הקודמים, פשוט מוסיפים אליו:

```python
yfinance
python-dotenv
```

לאחר העדכון נריץ:

```bash
pip install -r requirements.txt
```

**הגדרת API key**

גם כאן נשתמש ב-LLM, ולכן צריך להגדיר:

```python
ANTHROPIC_API_KEY
```

ב-PowerShell:

```bash
$env:ANTHROPIC_API_KEY="your_api_key_here"
```

חשוב לא להכניס את המפתח לתוך הקוד.

לא עושים כך:

```python
api_key = "my-real-api-key"
```

קוד כזה מסוכן להעלאה ל-GitHub.

במקום זה, הקוד יקרא את המפתח מתוך משתנה הסביבה.

**מה הקובץ stock_agent.py יכיל**

הקובץ שנכתוב יכלול את החלקים הבאים:

1. imports

2. הגדרת tool בשם get_stock_info

3. הגדרת SYSTEM_PROMPT

4. פונקציה build_agent

5. פונקציה query_agent

6. פונקציה main

7. לולאת command-line לשיחה עם המשתמש

החלוקה הזאת חשובה כי היא הופכת את הקובץ לקל לקריאה ולהרחבה.

במקום לכתוב את כל הקוד בתוך main, נחלק אותו לפונקציות:

<div dir="rtl">

| **פונקצי**ה | **תפקיד** |
| --- | --- |
| **get_stock_info** | מביאה נתוני מניה דרך yfinance |
| **build_agent** | יוצרת את ה-Agent ומחברת לו את הכלים |
| **query_agent** | שולחת שאלה ל-Agent ומחזירה תשובה |
| **main** | מפעילה את התוכנית דרך שורת הפקודה |

</div>

בסעיף הבא נכתוב את הקובץ המלא stock_agent.py, כך שאפשר יהיה להעתיק אותו ישירות לפרויקט ולהריץ.



## כתיבת הקובץ stock_agent.py

עכשיו נכתוב את הקובץ המרכזי של החלק הזה:

```bash
stock_agent.py
```

הקובץ הזה יבנה Agent פשוט שמסוגל לקבל שאלה על מניה, להפעיל tool שמביא נתונים דרך yfinance, ולהחזיר תשובה ברורה למשתמש.

ניצור קובץ בשם stock_agent.py בתיקיית הפרויקט, ונכניס אליו את הקוד הבא.

**תוכן מלא לקובץ stock_agent.py**

```python
import os

import yfinance as yf
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage
from langchain_core.tools import tool


MODEL_NAME = "anthropic:claude-haiku-4-5-20251001"


SYSTEM_PROMPT = """
You are a helpful stock market assistant.

When the user asks about a stock price, quote, or market data,
use the get_stock_info tool with the relevant ticker symbol.

Do not invent stock prices or live market data.

Do not provide financial advice.
Do not tell the user to buy, sell, or hold a stock.

Summarize the tool result clearly for the user.
"""


@tool
def get_stock_info(symbol: str) -> str:
    """
    Get basic stock market data for a ticker symbol.

    Args:
        symbol: Stock ticker symbol, for example MSFT, AAPL, TSLA, or NVDA.
    """
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

        if not info:
            return f"Error: No market data found for {symbol}."

        name = info.get("longName") or info.get("shortName") or symbol

        price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )

        currency = info.get("currency", "")
        day_high = info.get("dayHigh")
        day_low = info.get("dayLow")
        volume = info.get("volume")

        if price is None:
            return f"Error: Could not find a current price for {symbol}."

        lines = [
            f"Ticker: {symbol}",
            f"Company: {name}",
            f"Current price: {price} {currency}".strip(),
        ]

        if day_high is not None:
            lines.append(f"Day high: {day_high}")

        if day_low is not None:
            lines.append(f"Day low: {day_low}")

        if volume is not None:
            lines.append(f"Volume: {volume}")

        return "\n".join(lines)

    except Exception:
        return f"Error: Could not fetch stock data for {symbol}."


def build_agent():
    """
    Build the stock agent with one external tool.
    """
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise EnvironmentError(
            "ANTHROPIC_API_KEY is not set. "
            "Please set it before running stock_agent.py."
        )

    model = init_chat_model(
        MODEL_NAME,
        temperature=0,
    )

    agent = create_agent(
        model=model,
        tools=[get_stock_info],
        system_prompt=SYSTEM_PROMPT,
    )

    return agent


def query_agent(agent, user_input: str) -> str:
    """
    Send a user question to the agent and return the final answer.
    """
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_input,
                }
            ]
        }
    )

    last_message = result["messages"][-1]

    if isinstance(last_message, AIMessage):
        return last_message.content

    return str(last_message)


def main():
    print("Loading Stock Agent...")

    agent = build_agent()

    print("Stock Agent is ready.")
    print("Ask about stock prices, quotes, or market data.")
    print("Type 'quit' or 'exit' to stop.")

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() in {"quit", "exit"}:
            print("Goodbye.")
            break

        if not user_input:
            print("Please enter a question.")
            continue

        try:
            answer = query_agent(agent, user_input)
            print(f"\nAssistant: {answer}")

        except Exception as error:
            print(f"\nError: {error}")


if __name__ == "__main__":
    main()
```

זה קובץ מלא שאפשר להעלות ל-GitHub ולהריץ.

הוא כולל את כל החלקים הדרושים:

1. חיבור ל-LLM

2. הגדרת tool

3. שימוש ב-yfinance

4. הנחיות התנהגות ל-Agent

5. יצירת Agent

6. שליחת שאלות ל-Agent

7. לולאת command-line

8. טיפול בסיסי בשגיאות

החלק החשוב ביותר בקובץ הוא הכלי:

```python
@tool
def get_stock_info(symbol: str) -> str:
```

הסימון @tool אומר ל-LangChain שהפונקציה הזאת זמינה ל-Agent ככלי חיצוני.

כלומר, זו כבר לא רק פונקציית Python רגילה. זו פעולה שה-Agent יכול לבחור להפעיל כאשר הוא מבין שהמשתמש מבקש נתוני מניה.

לדוגמה, אם המשתמש שואל:

```bash
What is the current price of MSFT?
```

ה-Agent אמור להבין שצריך להשתמש בכלי, ולהפעיל אותו עם:

```bash
MSFT
```

הפונקציה עצמה משתמשת ב-yfinance:

```python
ticker = yf.Ticker(symbol)
info = ticker.info
```

לאחר מכן היא שולפת מתוך info כמה נתונים בסיסיים:

```bash
Company name
Current price
Currency
Day high
Day low
Volume
```

ולבסוף מחזירה טקסט מסודר שה-Agent יכול להשתמש בו כדי לענות למשתמש.

ה-SYSTEM_PROMPT מגדיר לסוכן איך להתנהג:

```python
SYSTEM_PROMPT = """
You are a helpful stock market assistant.

When the user asks about a stock price, quote, or market data,
use the get_stock_info tool with the relevant ticker symbol.

Do not invent stock prices or live market data.

Do not provide financial advice.
Do not tell the user to buy, sell, or hold a stock.

Summarize the tool result clearly for the user.
"""
```

ההנחיות האלה חשובות במיוחד כי מחיר מניה הוא מידע משתנה. אנחנו לא רוצים שהמודל ינחש. אם המשתמש מבקש נתון שוק, הסוכן צריך להשתמש בכלי.

בנוסף, הוספנו כלל בטיחות פשוט:

```python
Do not provide financial advice.
```

כלומר, הסוכן יכול להציג מידע, אבל לא להמליץ למשתמש לקנות או למכור מניה.

השלב הבא הוא להסביר בצורה מסודרת איך הקוד עובד, ואז נריץ אותו ונבדוק שאלות אמיתיות.



## הסבר על הקוד

אחרי שיש לנו את הקובץ המלא stock_agent.py, נעבור על המבנה שלו ונבין איך הוא עובד.

הקובץ בנוי סביב רעיון פשוט:

```bash
LLM + Tool + Instructions = Agent
```

כל רכיב נותן לסוכן יכולת אחרת.

- ה-LLM מבין את השאלה ומנסח תשובה.

- ה-Tool מביא מידע חיצוני בזמן אמת.

- ה-Instructions מגדירות מתי להשתמש בכלי ואיך לענות למשתמש.

**הגדרת המודל**

בתחילת הקובץ הגדרנו את שם המודל:

```python
MODEL_NAME = "anthropic:claude-haiku-4-5-20251001"
```

המודל הוא מנוע השפה של הסוכן. הוא זה שמקבל את שאלת המשתמש, מבין מה המשתמש רוצה, ומחליט אם צריך להשתמש בכלי.

כאשר יוצרים את המודל בפועל, משתמשים ב:

```python
model = init_chat_model(
    MODEL_NAME,
    temperature=0,
)
```

הערך:

```python
temperature=0
```

גורם למודל להיות יציב יותר ופחות יצירתי.

במקרה של Stock Agent זו בחירה נכונה, כי אנחנו לא רוצים תשובות דמיוניות או ניסוחים חופשיים מדי. אנחנו רוצים שהסוכן יפעל בצורה עקבית: אם המשתמש מבקש נתוני מניה, הוא ישתמש בכלי.

**הגדרת ההנחיות**

ההנחיות מוגדרות בתוך:

```python
SYSTEM_PROMPT
```

זה החלק שמגדיר לסוכן את כללי ההתנהגות:

```python
SYSTEM_PROMPT = """
You are a helpful stock market assistant.

When the user asks about a stock price, quote, or market data,
use the get_stock_info tool with the relevant ticker symbol.

Do not invent stock prices or live market data.

Do not provide financial advice.
Do not tell the user to buy, sell, or hold a stock.

Summarize the tool result clearly for the user.
"""
```

ההנחיה החשובה ביותר כאן היא:

```python
Do not invent stock prices or live market data.
```

מחיר מניה הוא מידע שמשתנה כל הזמן. לכן לא נכון לבקש מהמודל “לזכור” אותו. במקום זה, הסוכן צריך להשתמש בכלי שמביא מידע עדכני.

ההנחיה השנייה שחשובה מאוד היא:

```python
Do not provide financial advice.
```

הסוכן יכול להציג נתוני שוק, אבל הוא לא אמור לומר למשתמש לקנות, למכור או להחזיק מניה.

זו הפרדה חשובה:

מותר: 
להציג מידע 
 
אסור: 
לתת המלצת השקעה

**הגדרת ה-Tool**

הכלי מוגדר כך:

```python
@tool
def get_stock_info(symbol: str) -> str:
```

הסימון @tool הופך את הפונקציה לפעולה שה-Agent יכול להפעיל.

כלומר, זו לא רק פונקציה שאנחנו יכולים לקרוא לה ידנית. זו פונקציה שהסוכן יכול לבחור להפעיל כחלק מהתהליך שלו.

הפונקציה מקבלת פרמטר אחד:

```python
symbol: str
```

זהו ticker symbol של מניה.

לדוגמה:

```python
MSFT
AAPL
TSLA
NVDA
```

כאשר המשתמש שואל:

```bash
What is the current price of Microsoft stock?
```

הסוכן צריך להבין שהכוונה היא כנראה ל:

```bash
MSFT
```

ואז להפעיל את הכלי עם אותו סימול.

**ניקוי ובדיקת הקלט**

בתחילת הכלי מופיעה השורה:

```python
symbol = symbol.strip().upper()
```

השורה הזאת עושה שני דברים:

1. strip מסיר רווחים מיותרים

2. upper הופך את הסימול לאותיות גדולות

כך גם אם מתקבל קלט כמו:

```bash
 msft 
```

הוא יהפוך ל:

```bash
MSFT
```

לאחר מכן יש בדיקה:

```python
if not symbol:
    return "Error: Please provide a stock ticker symbol."
```

אם לא התקבל סימול, הכלי מחזיר הודעת שגיאה ברורה.

זו נקודה חשובה בבניית tools: לא מניחים שהקלט תמיד תקין. כלי טוב בודק את הקלט ומחזיר הודעה מובנת במקרה של בעיה.

**שימוש ב-yfinance**

בתוך הכלי אנחנו משתמשים ב-yfinance:

```python
ticker = yf.Ticker(symbol)
info = ticker.info
```

הקריאה הזאת מביאה מידע על מניה לפי הסימול שלה.

לדוגמה, אם הסימול הוא:

```python
MSFT
```

אז yfinance תנסה להביא מידע על Microsoft.

המידע שחוזר נמצא בתוך משתנה בשם:

```python
info
```

זה מילון גדול שמכיל הרבה שדות. אנחנו לא צריכים את כולם, לכן אנחנו שולפים רק את הנתונים החשובים להדגמה.

**שליפת מחיר ונתונים בסיסיים**

שם החברה נשלף כך:

```python
name = info.get("longName") or info.get("shortName") or symbol
```

השורה הזאת אומרת:

נסה לקחת longName

אם אין, נסה shortName

אם גם אין, השתמש בסימול עצמו

המחיר נשלף כך:

```python
price = (
    info.get("currentPrice")
    or info.get("regularMarketPrice")
    or info.get("previousClose")
)
```

גם כאן יש ניסיון להשתמש בכמה שדות אפשריים.

זה חשוב כי לא תמיד כל שדה קיים עבור כל מניה או בכל זמן. לפעמים יהיה currentPrice, לפעמים regularMarketPrice, ולפעמים נצטרך להשתמש ב-previousClose.

נתונים נוספים נשלפים כך:

```python
currency = info.get("currency", "")
day_high = info.get("dayHigh")
day_low = info.get("dayLow")
volume = info.get("volume")
```

אלה נתוני עזר שמאפשרים להחזיר תשובה עשירה יותר, ולא רק מחיר יחיד.

**בניית תשובת הכלי**

הכלי בונה רשימת שורות:

```python
lines = [
    f"Ticker: {symbol}",
    f"Company: {name}",
    f"Current price: {price} {currency}".strip(),
]
```

לאחר מכן הוא מוסיף שורות רק אם הנתונים קיימים:

```python
if day_high is not None:
    lines.append(f"Day high: {day_high}")

if day_low is not None:
    lines.append(f"Day low: {day_low}")

if volume is not None:
    lines.append(f"Volume: {volume}")
```

בסוף הוא מחזיר טקסט אחד:

```python
return "\n".join(lines)
```

כלומר, הכלי מחזיר תוצאה בסגנון:

```bash
Ticker: MSFT
Company: Microsoft Corporation
Current price: 430 USD
Day high: 432
Day low: 425
Volume: 21000000
```

התוצאה הזאת חוזרת ל-Agent. לאחר מכן ה-Agent משתמש בה כדי לנסח תשובה ברורה למשתמש.

**טיפול בשגיאות בתוך הכלי**

הקריאה ל-yfinance עטופה ב:

```python
try:
    ...
except Exception:
    return f"Error: Could not fetch stock data for {symbol}."
```

זה חשוב כי כלי חיצוני יכול להיכשל.

לדוגמה:

- אין חיבור אינטרנט

- הסימול לא תקין

- השירות החיצוני לא מחזיר נתונים

- חלק מהשדות חסרים

במקום שהתוכנית תקרוס, הכלי מחזיר הודעת שגיאה שה-Agent יכול להציג למשתמש.

Agent טוב לא חייב להצליח תמיד. אבל הוא צריך להיכשל בצורה ברורה ומבוקרת.

**יצירת ה-Agent**

ה-Agent נוצר בפונקציה:

```python
def build_agent():
```

בתחילת הפונקציה בודקים שיש API key:

```python
if not os.getenv("ANTHROPIC_API_KEY"):
    raise EnvironmentError(
        "ANTHROPIC_API_KEY is not set. "
        "Please set it before running stock_agent.py."
    )
```

אם אין מפתח, אין טעם להמשיך. לכן הקוד עוצר עם הודעה ברורה.

לאחר מכן יוצרים את המודל:

```python
model = init_chat_model(
    MODEL_NAME,
    temperature=0,
)
```

ואז יוצרים את ה-Agent:

```python
agent = create_agent(
    model=model,
    tools=[get_stock_info],
    system_prompt=SYSTEM_PROMPT,
)
```

זו השורה שמחברת את כל הרכיבים:

```bash
model         היכולת להבין ולנסח
tools         הפעולות שהסוכן יכול לבצע
system_prompt כללי ההתנהגות של הסוכן
```

גם אם יש כרגע רק כלי אחד, אנחנו מעבירים אותו כרשימה:

```python
tools=[get_stock_info]
```

כי בהמשך אפשר להוסיף כלים נוספים.

לדוגמה:

```python
tools=[
    get_stock_info,
    get_stock_news,
    get_stock_recommendations,
]
```

כך Agent יכול להפוך בהדרגה ממערכת קטנה עם כלי אחד למערכת עשירה יותר עם כמה יכולות.

**שליחת שאלה ל-Agent**

הפונקציה ששולחת שאלה היא:

```python
def query_agent(agent, user_input: str) -> str:
```

בתוכה אנחנו מפעילים את הסוכן:

```python
result = agent.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": user_input,
            }
        ]
    }
)
```

המשתמש שולח שאלה רגילה:

```bash
What is the current price of MSFT?
```

וה-Agent מחליט לבד אם צריך להפעיל tool.

אם הוא מפעיל את get_stock_info, הזרימה היא בערך:

```bash
User question
   ↓
Agent decides to use tool
   ↓
get_stock_info("MSFT")
   ↓
Tool returns market data
   ↓
Agent writes final answer
```

בסוף אנחנו לוקחים את ההודעה האחרונה:

```python
last_message = result["messages"][-1]
```

אם זו הודעת AI, מחזירים את התוכן שלה:

```python
if isinstance(last_message, AIMessage):
    return last_message.content
```

וזו התשובה שמודפסת למשתמש.

**לולאת השיחה**

בסוף הקובץ יש את main().

היא בונה את ה-Agent:

```python
agent = build_agent()
```

ואז נכנסת ללולאה:

```python
while True:
    user_input = input("\nYou: ").strip()
```

אם המשתמש כותב:

```bash
quit
```

או:

```bash
exit
```

התוכנית נעצרת.

אם המשתמש כותב שאלה רגילה, היא נשלחת ל-Agent:

```python
answer = query_agent(agent, user_input)
print(f"\nAssistant: {answer}")
```

מבחינת המשתמש, זו נראית כמו שיחת צ’אט פשוטה.

אבל מאחורי הקלעים, המערכת יודעת להפעיל כלי חיצוני, להביא מידע, ולהחזיר תשובה מבוססת יותר.

זה ההבדל המרכזי בין צ’אטבוט רגיל לבין Agent עם Tool.



## הרצה ובדיקת ה-Agent

אחרי שכתבנו את stock_agent.py, אפשר להריץ אותו ולבדוק שה-Agent באמת יודע להשתמש בכלי.

לפני ההרצה, מבנה הפרויקט אמור להיראות כך:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  rag_chatbot.py
  stock_agent.py
  requirements.txt
  data/
    sample_docs.txt
  chroma_db/
```

שימו לב: stock_agent.py לא תלוי ב-chroma_db.

הוא לא משתמש ב-RAG, לא מחפש במסמכים, ולא טוען Vector Store.

הוא משתמש ב-LLM וב-tool שמביא נתוני מניה דרך yfinance.

**שלב 1: התקנת הספריות**

מתוך תיקיית הפרויקט נריץ:

```bash
pip install -r requirements.txt
```

אם עובדים בתוך virtual environment, נפעיל אותו קודם.

ב-PowerShell:

```bash
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

אם ההתקנה הסתיימה בלי שגיאות, אפשר להמשיך.

**שלב 2: הגדרת API key**

ה-Agent משתמש במודל של Anthropic, ולכן צריך להגדיר משתנה סביבה:

```python
ANTHROPIC_API_KEY
```

ב-PowerShell:

```bash
$env:ANTHROPIC_API_KEY="your_api_key_here"
```

במקום your_api_key_here נשים את המפתח האמיתי.

חשוב לא להכניס את המפתח לתוך stock_agent.py, ולא להעלות אותו ל-GitHub.

**שלב 3: הרצת ה-Agent**

עכשיו נריץ:

```bash
python stock_agent.py
```

פלט אפשרי:

```bash
Loading Stock Agent...
Stock Agent is ready.
Ask about stock prices, quotes, or market data.
Type 'quit' or 'exit' to stop.

You:
```

בשלב הזה ה-Agent ממתין לשאלה.

**בדיקה ראשונה: מחיר מניה לפי סימול**

נשאל:

```bash
What is the current price of MSFT?
```

ה-Agent אמור להבין שזו שאלה על נתוני שוק, לבחור את הכלי get_stock_info, להעביר אליו את הסימול MSFT, ואז להחזיר תשובה מסודרת.

תשובה אפשרית:

```bash
Assistant: Microsoft Corporation is currently trading at 430.12 USD.
The day's high is 432.50, the day's low is 425.80, and the volume is 21000000.
```

המספרים בפועל יהיו שונים, כי הם מגיעים ממקור מידע חיצוני בזמן הריצה.

הנקודה החשובה היא לא המחיר עצמו, אלא זה שה-Agent הפעיל כלי ולא המציא תשובה.

**בדיקה שנייה: שאלה עם שם חברה**

ננסה שאלה פחות טכנית:

```bash
What is the current price of Apple stock?
```

כאן המשתמש לא כתב AAPL, אלא כתב Apple stock.

ה-Agent צריך לנסות להבין שהכוונה היא ל-Apple, ולהשתמש בסימול המתאים:

```python
AAPL
```

תשובה אפשרית:

```bash
Assistant: Apple Inc. is currently trading at 195.40 USD.
The day's high is 197.10, the day's low is 193.80, and the volume is 52000000.
```

אם המודל לא מצליח לזהות את הסימול, אפשר לשאול בצורה מפורשת יותר:

```bash
What is the current price of AAPL?
```

במערכת אמיתית אפשר להוסיף tool נוסף שממיר שם חברה ל-ticker symbol בצורה אמינה יותר.

**בדיקה שלישית: נתוני שוק כלליים**

נשאל:

```bash
Give me market data for NVDA.
```

תשובה אפשרית:

```bash
Assistant: Here is the current market data for NVIDIA Corporation:
Ticker: NVDA
Current price: ...
Day high: ...
Day low: ...
Volume: ...
```

זו בדיקה טובה כי היא מוודאת שה-Agent לא מחפש רק את הביטוי “current price”, אלא מבין שגם “market data” דורש שימוש בכלי.

**בדיקה רביעית: שאלה שלא דורשת Tool**

נשאל:

```bash
What is a stock?
```

זו שאלה מושגית. היא לא דורשת מחיר חי, quote או נתוני שוק.

במקרה כזה ה-Agent יכול לענות בלי להפעיל את get_stock_info.

תשובה אפשרית:

```bash
Assistant: A stock represents a share of ownership in a company. When someone owns a stock, they own a small part of that company.
```

זו בדיקה חשובה, כי Agent טוב לא אמור להשתמש בכלי בכל שאלה. הוא צריך לדעת מתי להשתמש בכלי ומתי לענות רגיל.

**בדיקה חמישית: סימול לא תקין**

ננסה:

```bash
What is the current price of ABCXYZ123?
```

במקרה כזה ייתכן ש-yfinance לא יחזיר נתונים שימושיים.

תשובה טובה תהיה בסגנון:

```bash
Assistant: I could not find valid market data for ABCXYZ123.
```

או:

```bash
Assistant: The tool could not fetch stock data for ABCXYZ123.
```

המטרה היא לוודא שהמערכת לא קורסת ולא מחזירה תשובה מומצאת.

**יציאה מהתוכנית**

כדי לצאת מה-Agent, מקלידים:

```bash
quit
```

או:

```bash
exit
```

ואז נקבל:

```bash
Goodbye.
```

**מה בדקנו כאן**

בשלב הזה בדקנו שהמערכת עובדת מקצה לקצה:

1. ה-Agent נטען

2. ה-LLM מחובר

3. הכלי get_stock_info זמין ל-Agent

4. המשתמש יכול לשאול בשפה טבעית

5. ה-Agent יודע מתי להשתמש בכלי

6. הכלי מביא נתונים דרך yfinance

7. ה-Agent מחזיר תשובה ברורה

8. התוכנית יודעת לעצור בצורה מסודרת

זהו Agent פשוט, אבל הוא כבר מדגים את אחד הרעיונות החשובים ביותר בבניית סוכנים: המודל לא חייב לדעת הכול בעצמו. הוא יכול להשתמש בכלים כדי להביא מידע או לבצע פעולה בזמן אמת.

ראש הטופס

## טעויות נפוצות בבניית Stock Agent

אחרי שה-Agent עובד, חשוב להבין איפה הוא עלול להיכשל.

ב-Stock Agent יש תלות בכמה דברים יחד:

```bash
LLM
Instructions
Tool
yfinance
Ticker symbol
External data
```

אם אחד מהם לא עובד נכון, התשובה עלולה להיות שגויה, חסרה או לא ברורה.

**טעות 1: לצפות מהמודל לדעת מחיר מניה**

מחיר מניה הוא מידע משתנה.

לכן לא נכון לצפות מה-LLM לענות עליו מתוך הזיכרון הפנימי שלו.

לדוגמה, שאלה כזאת:

```bash
What is the current price of MSFT?
```

דורשת מידע עדכני.

אם המודל עונה בלי להשתמש בכלי, זו בעיה.

זו בדיוק הסיבה שהוספנו ל-SYSTEM_PROMPT את ההנחיה:

```bash
Do not invent stock prices or live market data.
```

הסוכן צריך להבין:

שאלה על מחיר חי 
 ↓ 
צריך להשתמש בכלי

ולא:

שאלה על מחיר חי 
 ↓ 
לנסות לנחש תשובה

**טעות 2: לא להגדיר API key**

ה-Agent צריך LLM כדי להבין את השאלה ולהחליט אם להשתמש בכלי.

לכן צריך להגדיר:

```python
ANTHROPIC_API_KEY
```

אם המשתנה לא מוגדר, הקוד יעצור כאן:

```python
if not os.getenv("ANTHROPIC_API_KEY"):
    raise EnvironmentError(
        "ANTHROPIC_API_KEY is not set. "
        "Please set it before running stock_agent.py."
    )
```

ב-PowerShell מגדירים אותו כך:

```bash
$env:ANTHROPIC_API_KEY="your_api_key_here"
```

חשוב לא לשים את המפתח בתוך הקוד ולא להעלות אותו ל-GitHub.

**טעות 3: לסמוך על שם חברה במקום על ticker symbol**

הכלי שלנו מקבל ticker symbol.

לדוגמה:

```bash
MSFT
AAPL
NVDA
TSLA
```

כאשר המשתמש שואל:

```bash
What is the current price of Apple stock?
```

ה-Agent צריך להבין שהכוונה היא כנראה:

```bash
AAPL
```

אבל זה לא תמיד מובטח.

לכן בבדיקות כדאי לשאול גם עם שם חברה וגם עם ticker:

```bash
What is the current price of Apple stock?
What is the current price of AAPL?
```

אם השאלה עם שם החברה לא עובדת טוב, זה לא אומר שה-tool נכשל. יכול להיות שהמודל לא המיר את שם החברה לסימול הנכון.

במערכת מתקדמת יותר אפשר להוסיף tool נפרד שמחפש ticker לפי שם חברה.

**טעות 4: לא לטפל ב-ticker לא תקין**

משתמש יכול להקליד סימול שלא קיים:

```bash
ABCXYZ123
```

או שאלה לא ברורה:

```bash
What is the current stock price?
```

אם אין סימול ברור, הכלי לא צריך לקרוס.

לכן בתחילת get_stock_info יש בדיקה:

```python
symbol = symbol.strip().upper()

if not symbol:
    return "Error: Please provide a stock ticker symbol."
```

בנוסף, אם yfinance לא מחזיר נתונים, הכלי מחזיר שגיאה ברורה:

```python
if not info:
    return f"Error: No market data found for {symbol}."
```

המטרה היא שה-Agent יקבל תוצאה מובנת, גם כאשר הכלי לא הצליח.

**טעות 5: להחזיר למשתמש שגיאה טכנית מדי**

במערכת לימודית זה בסדר להחזיר הודעה כמו:

```bash
Error: Could not fetch stock data for MSFT.
```

אבל במערכת אמיתית עדיף להחזיר ניסוח ידידותי יותר:

```bash
I could not fetch market data for MSFT right now.
Please try again later or check the ticker symbol.
```

העיקרון הוא:

- לוגים טכניים למפתח

- הודעה ברורה למשתמש

לא כדאי לחשוף למשתמש stack trace, פרטים פנימיים או הודעות שגיאה ארוכות מדי.

**טעות 6: לתת ייעוץ השקעות**

ה-Agent שלנו מציג מידע.

הוא לא אמור להמליץ למשתמש לקנות, למכור או להחזיק מניה.

לכן ב-SYSTEM_PROMPT כתבנו:

```python
Do not provide financial advice.
Do not tell the user to buy, sell, or hold a stock.
```

לדוגמה, אם המשתמש שואל:

```bash
Should I buy NVDA?
```

תשובה טובה לא תהיה:

```bash
Yes, you should buy it.
```

תשובה טובה יותר תהיה:

```bash
I can provide market data, but I cannot give financial advice.
You may want to review the company's financials and consult a qualified professional.
```

בפרויקט שלנו הדגש הוא טכני: איך Agent משתמש בכלי. לא איך לקבל החלטות השקעה.

**טעות 7: לחשוב ש-yfinance הוא ה-Agent**

yfinance הוא לא הסוכן.

הוא רק מקור הנתונים.

חלוקת התפקידים היא:

- yfinance מביא נתונים גולמיים

- get_stock_info עוטף את yfinance ומחזיר טקסט מסודר

- Agent מחליט מתי להפעיל את הכלי ואיך להסביר את התוצאה

זו נקודה חשובה.

Agent הוא לא API.

Agent הוא שכבה שמחברת בין שפה טבעית, כלי חיצוני, הנחיות והתנהגות.

**טעות 8: לא לבדוק אם ה-Agent באמת השתמש בכלי**

לפעמים התשובה נראית טובה, אבל לא בטוח שה-Agent הפעיל את הכלי.

בשלב לימודי אפשר להוסיף הדפסה זמנית בתוך הכלי:

```python
print(f"Calling get_stock_info with symbol: {symbol}")
```

כך בזמן הרצה אפשר לראות אם הפונקציה באמת הופעלה.

אחרי שמסיימים לבדוק, אפשר להסיר את ההדפסה הזאת או להחליף אותה בלוג מסודר.

בדיקה כזאת עוזרת להבין את ההבדל בין:

המודל ענה לבד

לבין:

המודל הפעיל כלי וקיבל תוצאה

**טעות 9: להעמיס יותר מדי אחריות על Tool אחד**

בשלב הראשון בנינו tool אחד:

```python
get_stock_info
```

הוא מביא מחיר, טווח יומי ונפח מסחר.

לא כדאי להפוך אותו לכלי ענק שמטפל בכל דבר: חדשות, המלצות אנליסטים, ביצועים היסטוריים, דוחות כספיים ועוד.

בדרך כלל עדיף לבנות כמה כלים קטנים וברורים:

```python
get_stock_info
get_stock_news
get_stock_recommendations
get_stock_year_performance
```

כך כל tool עושה פעולה אחת ברורה, וה-Agent יכול לבחור את הכלי המתאים לפי שאלת המשתמש.

**טעות 10: לא להפריד בין מידע חי לבין מידע שמור**

RAG מתאים כאשר מקור הידע הוא מסמכים קיימים.

Stock Agent מתאים כאשר צריך להביא מידע בזמן אמת.

לכן לא נכון לשמור מחיר מניה במסמך ולהשתמש ב-RAG כדי לענות עליו לאורך זמן. המחיר יתיישן מהר מאוד.

הכלל הוא:

מידע יציב יחסית - מתאים ל-RAG

מידע משתנה בזמן אמת - מתאים ל-Tool

לדוגמה:

<div dir="rtl">

| **שאל**ה | **פתרון מתאים** |
| --- | --- |
| **What does the document say about ChromaDB?** | RAG |
| **What is the current price of MSFT?** | Tool |
| **What is the company policy about refunds?** | RAG |
| **What is the current status of order 123?** | Tool |
| **What are the latest headlines about AAPL?** | Tool |

</div>

ההבדל הזה הוא בסיס חשוב בתכנון מערכות Agentic.

בסוף הפרק הזה, ה-Agent שלנו כבר לא רק עובד. אנחנו גם מבינים מה עלול להשתבש, איך לבדוק אותו, ואיך לשפר אותו בהמשך.

תחתית הטופס


