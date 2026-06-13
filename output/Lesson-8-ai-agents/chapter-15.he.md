# תרגול מעשי מונחה והרחבות

עד עכשיו למדנו את הרעיונות המרכזיים: איך בונים בסיס RAG, איך מרכיבים RAG Chatbot, איך יוצרים Agent שמפעיל tool, ואיך אפשר לעבור ממודל בענן למודל מקומי.

בחלק הזה נעבור מקריאה והבנה לבנייה בפועל.

המטרה היא לא רק לתת משימות, אלא לפתור אותן בצורה מסודרת. בכל תרגיל נראה מה צריך להוסיף לפרויקט, אילו קבצים משתנים, איך נראה הקוד, איך מריצים אותו, ואיך בודקים שהתוצאה באמת עובדת.

התרגול יכלול חמש הרחבות מעשיות:

1. מעבר ל-Ollama

2. בדיקה אם מניה עלתה או ירדה בשנה האחרונה

3. הוספת כלי המלצות וחדשות

4. בניית UI עם FastAPI ו-Jinja2

5. בניית Workflow דו-שלבי

העיקרון החשוב הוא לעבוד בהדרגה. לא משנים את הכול בבת אחת. בכל פעם מוסיפים יכולת אחת, מריצים, בודקים, ורק אז ממשיכים.



## פתרון תרגיל 1: מעבר ל-Ollama

**מטרה**

בתרגיל הזה נחליף את ספק המודל. במקום להשתמש רק במודל ענן דרך Anthropic, נוסיף אפשרות לעבוד עם מודל מקומי דרך Ollama.

המטרה היא להבין שהארכיטקטורה של האפליקציה לא אמורה להישבר רק בגלל שהחלפנו LLM.

כלומר, ה-RAG, ה-Agent, ה-tools וה-workflow יכולים להישאר באותו מבנה. מה שמשתנה הוא בעיקר הדרך שבה אנחנו יוצרים את אובייקט המודל.

**מה נוסיף לפרויקט**

נוסיף קובץ עזר חדש בשם:

```bash
llm_factory.py
```

הקובץ הזה יהיה אחראי ליצור את ה-LLM לפי הגדרות סביבה.

במקום שכל קובץ בפרויקט יחליט לבד אם להשתמש ב-Anthropic או ב-Ollama, נרכז את ההחלטה במקום אחד.

זה מבנה טוב יותר, כי בעתיד נוכל להחליף מודל בלי לערוך את כל הקבצים בפרויקט.

**קבצים שנעדכן או נוסיף**

בתרגיל הזה נוסיף קובץ חדש:

```bash
llm_factory.py
```

ונעדכן לפי הצורך את הקבצים שמשתמשים ב-LLM:

```bash
rag_chatbot.py
stock_agent.py
```

בשלב הראשון נתחיל מהוספת llm_factory.py.

**שלב 1: לוודא ש-Ollama מותקן**

לפני שמשנים קוד, צריך לוודא ש-Ollama עובד במחשב.

מריצים:

```bash
ollama list
```

אם מתקבלת רשימת מודלים, Ollama זמין.

אם אין עדיין מודל מתאים, אפשר להוריד מודל קטן לבדיקה:

```bash
ollama pull gemma3:1b
```

או מודל חזק יותר אם החומרה מתאימה:

```bash
ollama pull gemma3:4b
```

לאחר מכן אפשר לבדוק שהמודל עונה:

```bash
ollama run gemma3:1b
```

בתוך הצ’אט של Ollama אפשר לכתוב שאלה פשוטה:

```bash
Explain what a RAG chatbot is in one sentence.
```

אם מתקבלת תשובה, אפשר לעבור לקוד.

**שלב 2: להוסיף קובץ llm_factory.py**

ניצור קובץ חדש בשם:

```bash
llm_factory.py
```

הקובץ הזה יכיל פונקציה אחת מרכזית:

```python
build_llm()
```

הפונקציה תקרא משתנה סביבה בשם:

```python
MODEL_PROVIDER
```

אם הערך הוא ollama, נחזיר מודל מקומי.

אם הערך הוא anthropic, נחזיר מודל ענן.

**קוד מלא לקובץ llm_factory.py**

```python
import os

from langchain_anthropic import ChatAnthropic
from langchain_ollama import ChatOllama


def build_llm():
    """
    Build an LLM client based on environment configuration.

    Supported providers:
    - anthropic
    - ollama
    """
    provider = os.getenv("MODEL_PROVIDER", "anthropic").strip().lower()
    temperature = float(os.getenv("MODEL_TEMPERATURE", "0"))

    if provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")

        if not api_key:
            raise EnvironmentError(
                "ANTHROPIC_API_KEY is not set. "
                "Set it or use MODEL_PROVIDER=ollama."
            )

        model_name = os.getenv(
            "ANTHROPIC_MODEL",
            "claude-haiku-4-5-20251001",
        )

        return ChatAnthropic(
            model=model_name,
            temperature=temperature,
        )

    if provider == "ollama":
        model_name = os.getenv("OLLAMA_MODEL", "gemma3:1b")
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

        return ChatOllama(
            model=model_name,
            base_url=base_url,
            temperature=temperature,
        )

    raise ValueError(
        f"Unsupported MODEL_PROVIDER: {provider}. "
        "Use 'anthropic' or 'ollama'."
    )
```

**מה הקוד עושה**

הקוד בודק באיזה ספק מודל אנחנו רוצים להשתמש.

אם לא הגדרנו כלום, ברירת המחדל היא:

```python
anthropic
```

כלומר, הפרויקט ממשיך לעבוד כמו קודם.

אם נגדיר:

```python
MODEL_PROVIDER=ollama
```

הקוד ייצור מודל מקומי דרך Ollama.

כך אנחנו לא שוברים את הפרויקט הקיים, אלא מוסיפים לו אפשרות חדשה.

**שלב 3: לעדכן את rag_chatbot.py**

במקום ליצור את המודל ישירות בתוך rag_chatbot.py, נייבא את build_llm.

לפני השינוי, ייתכן שיש קוד בסגנון:

```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-haiku-4-5-20251001",
    temperature=0,
)
```

אחרי השינוי, נרצה להשתמש בזה:

```python
from llm_factory import build_llm

llm = build_llm()
```

לדוגמה, בתוך main():

```python
def main():
    vectorstore = load_vectorstore()
    llm = build_llm()

    rag_chain = build_rag_chain(vectorstore, llm)

    print("RAG Chatbot is ready.")
    print("Type 'quit' or 'exit' to stop.")

    chat_history: list = []

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() in {"quit", "exit"}:
            break

        if not user_input:
            print("Please enter a question.")
            continue

        messages_for_prompt = []

        for msg in chat_history[-10:]:
            if msg["role"] == "user":
                messages_for_prompt.append(HumanMessage(content=msg["content"]))
            else:
                messages_for_prompt.append(AIMessage(content=msg["content"]))

        answer = rag_chain.invoke(
            {
                "question": user_input,
                "chat_history": messages_for_prompt,
            }
        )

        print(f"\nAssistant: {answer}")

        chat_history.append({"role": "user", "content": user_input})
        chat_history.append({"role": "assistant", "content": answer})
```

החלק החשוב כאן הוא השורה:

```python
llm = build_llm()
```

עכשיו rag_chatbot.py לא צריך לדעת אם המודל מגיע מ-Anthropic או מ-Ollama. הוא פשוט מקבל LLM ומשתמש בו.

**שלב 4: לעדכן את stock_agent.py**

אותו רעיון אפשר ליישם גם ב-stock_agent.py.

לפני השינוי, ייתכן שיש קוד כזה:

```python
model = init_chat_model(
    "anthropic:claude-haiku-4-5-20251001",
    temperature=0,
)
```

במקום זה, נשתמש ב:

```python
from llm_factory import build_llm
ובתוך build_agent():
def build_agent():
    model = build_llm()

    agent = create_agent(
        model=model,
        tools=[get_stock_info],
        system_prompt=SYSTEM_PROMPT,
    )

    return agent
```

כך גם ה-Stock Agent יכול לעבוד עם מודל ענן או עם מודל מקומי.

**שלב 5: להריץ עם Anthropic**

כדי להריץ עם Anthropic, נגדיר:

```python
set MODEL_PROVIDER=anthropic
set ANTHROPIC_API_KEY=your_api_key_here
```

ב-PowerShell:

```bash
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_api_key_here"
```

ואז נריץ:

```bash
python rag_chatbot.py
```

או:

```bash
python stock_agent.py
```

**שלב 6: להריץ עם Ollama**

כדי להריץ עם Ollama, נגדיר:

```python
set MODEL_PROVIDER=ollama
set OLLAMA_MODEL=gemma3:1b
```

ב-PowerShell:

```bash
$env:MODEL_PROVIDER="ollama"
$env:OLLAMA_MODEL="gemma3:1b"
```

אם צריך, אפשר גם להגדיר:

```bash
$env:OLLAMA_BASE_URL="http://localhost:11434"
```

ואז נריץ:

```bash
python rag_chatbot.py
```

או:

```bash
python stock_agent.py
```

**מה לבדוק בסיום**

צריך לבדוק שלושה דברים.

ראשית, שהמודל המקומי עונה בכלל:

```python
from llm_factory import build_llm

llm = build_llm()
response = llm.invoke("Explain what an AI agent is in one sentence.")
print(response.content)
```

שנית, שה-RAG Chatbot עדיין עובד:

```bash
python build_rag_db.py
python rag_chatbot.py
```

ושלישית, שה-Stock Agent עדיין יודע להשתמש בכלים:

```bash
python stock_agent.py
```

שאלה לבדיקה:

```bash
What is the current price of MSFT?
```

**טעויות נפוצות**

טעות נפוצה ראשונה היא להשתמש בשם מודל שלא מותקן ב-Ollama.

אם הגדרנו:

```python
OLLAMA_MODEL=gemma3:4b
```

אבל המודל לא מופיע בפקודה:

```bash
ollama list
```

הקוד לא יצליח להריץ אותו.

טעות נפוצה שנייה היא לשכוח ש-Ollama צריך לרוץ ברקע. בדרך כלל Ollama מפעיל שרת מקומי, אבל אם החיבור נכשל, כדאי לבדוק שהכתובת נכונה:

```bash
http://localhost:11434
```

טעות נפוצה שלישית היא לצפות שמודל קטן יתנהג בדיוק כמו מודל ענן חזק. מודל קטן יכול להתקשות בבחירת tools, בהבנת instructions מורכבות או בעיבוד context ארוך.

טעות נפוצה רביעית היא לפזר את יצירת ה-LLM בכמה קבצים. אם בכל קובץ יוצרים מודל בצורה אחרת, יהיה קשה לתחזק את הפרויקט. לכן יצרנו llm_factory.py.

**למה הפתרון הזה טוב**

הפתרון הזה שומר על הפרדה נכונה.

הקבצים rag_chatbot.py ו-stock_agent.py לא צריכים לדעת יותר מדי על ספק המודל. הם צריכים רק לקבל אובייקט LLM ולהשתמש בו.

הקובץ llm_factory.py אחראי על בחירת המודל.

כך אפשר להחליף בין ענן למקומי בלי לשכתב את כל המערכת.

העיקרון החשוב הוא:

```bash
Model provider is configuration.
Application architecture should stay the same.
```

כלומר, ספק המודל הוא הגדרה. הוא לא אמור לשנות את המבנה של כל האפליקציה.

## פתרון תרגיל 2: בדיקה אם מניה עלתה או ירדה בשנה האחרונה

**מטרה**

בתרגיל הזה נרחיב את Stock Agent.

עד עכשיו הסוכן ידע להביא מידע בסיסי על מניה: מחיר נוכחי, שם חברה, טווח יומי, נפח מסחר ומטבע. זו התחלה טובה, אבל עדיין מדובר בעיקר בשליפה של נתון נוכחי.

כאן נוסיף יכולת חדשה: לבדוק האם מניה עלתה או ירדה במהלך השנה האחרונה.

המטרה היא להראות ש-Tool לא חייב רק “להביא מידע”. Tool יכול גם לבצע עיבוד קטן: להביא נתונים היסטוריים, לחשב שינוי, ולהחזיר תוצאה שה-Agent יכול להסביר למשתמש.

לדוגמה, המשתמש יוכל לשאול:

```bash
Did MSFT go up or down in the last year?
```

או:

```bash
How did NVDA perform over the past 12 months?
```

הזרימה שנרצה לבנות היא:

User question 
 ↓ 
Agent detects yearly performance question 
 ↓ 
Agent calls get_stock_year_performance 
 ↓ 
Tool fetches 1 year of historical prices 
 ↓ 
Tool compares first close price and last close price 
 ↓ 
Agent explains the result

**מה נוסיף לפרויקט**

נוסיף Tool חדש בשם:

```python
get_stock_year_performance
```

ה-tool יקבל סימול מניה, למשל MSFT, יביא היסטוריית מחירים של שנה אחת דרך yfinance, ישווה בין מחיר הסגירה הראשון למחיר הסגירה האחרון, ויחזיר תשובה טקסטואלית.

**קובץ שנעדכן**

בתרגיל הזה נעדכן רק את הקובץ:

```bash
stock_agent.py
```

לא צריך לשנות את קבצי ה-RAG, לא את build_rag_db.py, ולא את rag_chatbot.py.

**שלב 1: להבין את הנתונים שנצטרך**

כדי לדעת אם מניה עלתה או ירדה בשנה האחרונה, אי אפשר להסתפק במחיר הנוכחי.

צריך שני ערכים:

Start price → מחיר בתחילת התקופה

End price → מחיר בסוף התקופה

לאחר מכן מחשבים:

```python
Change = End price - Start price
Change percent = Change / Start price * 100
```

אם התוצאה חיובית, המניה עלתה. 
אם התוצאה שלילית, המניה ירדה. 
אם השינוי קרוב לאפס, אפשר לומר שהיא כמעט לא השתנתה.

**שלב 2: להוסיף Tool חדש**

נוסיף ל-stock_agent.py פונקציה חדשה עם @tool.

הקוד יכול להיראות כך:

```python
@tool
def get_stock_year_performance(symbol: str) -> str:
    """Check whether a stock went up or down over the past year."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period="1y")

        if history.empty:
            return f"Error: No historical price data found for {symbol}."

        start_price = history["Close"].iloc[0]
        end_price = history["Close"].iloc[-1]

        if start_price == 0:
            return f"Error: Invalid start price found for {symbol}."

        change = end_price - start_price
        change_percent = (change / start_price) * 100

        if change > 0:
            direction = "up"
        elif change < 0:
            direction = "down"
        else:
            direction = "flat"

        return (
            f"{symbol} went {direction} over the past year. "
            f"Start price: {start_price:.2f}. "
            f"End price: {end_price:.2f}. "
            f"Change: {change_percent:.2f}%."
        )

    except Exception:
        return f"Error: Could not fetch historical data for {symbol}."
```

**מה הקוד עושה**

החלק הראשון מנקה את הקלט:

```python
symbol = symbol.strip().upper()
```

כך גם אם המשתמש או ה-Agent שולחים ערך כמו:

```python
 msft 
```

ה-tool יעבוד עם:

```python
MSFT
```

לאחר מכן יש בדיקה שהסימול לא ריק:

```python
if not symbol:
    return "Error: Please provide a stock ticker symbol."
```

זו בדיקה חשובה. Tool טוב לא מניח שהקלט תמיד תקין.

לאחר מכן מביאים נתונים היסטוריים:

```python
ticker = yf.Ticker(symbol)
history = ticker.history(period="1y")
```

הקריאה הזאת מחזירה נתוני מסחר עבור השנה האחרונה.

אם אין נתונים, מחזירים הודעה ברורה:

```python
if history.empty:
    return f"Error: No historical price data found for {symbol}."
```

לאחר מכן לוקחים את מחיר הסגירה הראשון והאחרון:

```python
start_price = history["Close"].iloc[0]
end_price = history["Close"].iloc[-1]
```

העמודה Close מייצגת את מחיר הסגירה בכל יום מסחר.

לאחר מכן מחשבים את השינוי:

```python
change = end_price - start_price
change_percent = (change / start_price) * 100
```

בסוף מחזירים טקסט ברור שה-Agent יוכל להשתמש בו בתשובה הסופית.

**שלב 3: להוסיף את הכלי לרשימת הכלים**

הפונקציה לבדה לא מספיקה. כדי שה-Agent יוכל להשתמש בה, צריך להוסיף אותה לרשימת ה-tools.

אם קודם היה לנו:

```python
tools=[get_stock_info]
```

נעדכן ל:

```python
tools=[
    get_stock_info,
    get_stock_year_performance,
]
לדוגמה, בתוך build_agent():
def build_agent():
    model = build_llm()

    agent = create_agent(
        model=model,
        tools=[
            get_stock_info,
            get_stock_year_performance,
        ],
        system_prompt=SYSTEM_PROMPT,
    )

    return agent
```

עכשיו ה-Agent מכיר שני כלים:

```python
get_stock_info
get_stock_year_performance
```

אחד מתאים למחיר נוכחי ונתוני שוק. 
השני מתאים לביצועים בשנה האחרונה.

**שלב 4: לעדכן את ההנחיות של הסוכן**

כאשר מוסיפים Tool חדש, חייבים לעדכן גם את ההנחיות.

אם לא נעשה זאת, ה-Agent אולי יכיר את הכלי, אבל לא תמיד יבין מתי להשתמש בו.

נעדכן את SYSTEM_PROMPT כך:

```python
SYSTEM_PROMPT = """
You are a helpful stock assistant.

Use get_stock_info when the user asks about:
- current stock price
- quote
- current market data
- day high, day low, volume, or currency

Use get_stock_year_performance when the user asks about:
- whether a stock went up or down over the past year
- one-year performance
- 12-month performance
- how a stock performed during the last year

Do not invent live market data or historical performance.
If the user does not provide a ticker symbol, ask for one.
Summarize tool results clearly for the user.
"""
```

כאן אנחנו מגדירים בצורה מפורשת מתי להשתמש בכל כלי.

זו נקודה חשובה מאוד כאשר עובדים עם Agents. ככל שיש יותר tools, כך ההנחיות צריכות להיות ברורות יותר.

**שלב 5: קוד מלא מעודכן לחלקים המרכזיים ב-stock_agent.py**

להלן גרסה מרוכזת של החלקים הרלוונטיים שנוסיף או נעדכן:

```python
import os

import yfinance as yf
from langchain.tools import tool
from langchain.agents import create_agent

from llm_factory import build_llm


@tool
def get_stock_info(symbol: str) -> str:
    """Get current stock price and market data for a ticker symbol."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

        if not info:
            return f"Error: No stock data found for {symbol}."

        name = info.get("longName") or info.get("shortName") or symbol
        price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )
        day_high = info.get("dayHigh")
        day_low = info.get("dayLow")
        volume = info.get("volume")
        currency = info.get("currency", "")

        if price is None:
            return f"Error: No current price data found for {symbol}."

        return (
            f"Company: {name}\n"
            f"Symbol: {symbol}\n"
            f"Current price: {price} {currency}\n"
            f"Day high: {day_high}\n"
            f"Day low: {day_low}\n"
            f"Volume: {volume}"
        )

    except Exception:
        return f"Error: Could not fetch stock data for {symbol}."


@tool
def get_stock_year_performance(symbol: str) -> str:
    """Check whether a stock went up or down over the past year."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period="1y")

        if history.empty:
            return f"Error: No historical price data found for {symbol}."

        start_price = history["Close"].iloc[0]
        end_price = history["Close"].iloc[-1]

        if start_price == 0:
            return f"Error: Invalid start price found for {symbol}."

        change = end_price - start_price
        change_percent = (change / start_price) * 100

        if change > 0:
            direction = "up"
        elif change < 0:
            direction = "down"
        else:
            direction = "flat"

        return (
            f"{symbol} went {direction} over the past year.\n"
            f"Start price: {start_price:.2f}\n"
            f"End price: {end_price:.2f}\n"
            f"Change: {change_percent:.2f}%"
        )

    except Exception:
        return f"Error: Could not fetch historical data for {symbol}."


SYSTEM_PROMPT = """
You are a helpful stock assistant.

Use get_stock_info when the user asks about:
- current stock price
- quote
- current market data
- day high, day low, volume, or currency

Use get_stock_year_performance when the user asks about:
- whether a stock went up or down over the past year
- one-year performance
- 12-month performance
- how a stock performed during the last year

Do not invent live market data or historical performance.
If the user does not provide a ticker symbol, ask for one.
Summarize tool results clearly for the user.
"""


def build_agent():
    model = build_llm()

    return create_agent(
        model=model,
        tools=[
            get_stock_info,
            get_stock_year_performance,
        ],
        system_prompt=SYSTEM_PROMPT,
    )


def query_agent(agent, user_input: str) -> str:
    result = agent.invoke(
        {"messages": [{"role": "user", "content": user_input}]}
    )

    return result["messages"][-1].content


def main():
    agent = build_agent()

    print("Stock Agent is ready.")
    print("Type 'quit' or 'exit' to stop.")

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() in {"quit", "exit"}:
            break

        if not user_input:
            print("Please enter a question.")
            continue

        answer = query_agent(agent, user_input)
        print(f"\nAssistant: {answer}")


if __name__ == "__main__":
    main()
```

**שלב 6: איך להריץ**

אם עובדים עם Anthropic:

```bash
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_api_key_here"
python stock_agent.py
```

אם עובדים עם Ollama:

```bash
$env:MODEL_PROVIDER="ollama"
$env:OLLAMA_MODEL="gemma3:1b"
python stock_agent.py
```

**שלב 7: איך לבדוק**

נבדוק קודם שהכלי הישן עדיין עובד:

```bash
What is the current price of MSFT?
```

ה-Agent אמור להשתמש ב:

```python
get_stock_info
```

לאחר מכן נבדוק את הכלי החדש:

```bash
Did MSFT go up or down in the last year?
```

או:

```bash
How did NVDA perform over the past 12 months?
```

ה-Agent אמור להשתמש ב:

```python
get_stock_year_performance
```

אם שני סוגי השאלות עובדים, סימן שהצלחנו להרחיב את הסוכן בלי לשבור את היכולת הקיימת.

**טעויות נפוצות**

טעות ראשונה היא להוסיף את הפונקציה אבל לשכוח להוסיף אותה לרשימת ה-tools.

במקרה כזה, הקוד יכיל את הפונקציה, אבל ה-Agent לא יוכל להשתמש בה.

טעות שנייה היא לא לעדכן את SYSTEM_PROMPT.

אם ההנחיות לא מסבירות מתי להשתמש בכלי החדש, ה-Agent עלול להמשיך להשתמש רק ב-get_stock_info, גם כאשר השאלה עוסקת בביצועים בשנה האחרונה.

טעות שלישית היא לא לבדוק אם history.empty.

כאשר אין נתונים היסטוריים, הקוד צריך להחזיר הודעה ברורה ולא לקרוס.

טעות רביעית היא להציג את התוצאה כאילו היא ייעוץ השקעות. הכלי צריך להציג נתונים וחישוב פשוט, לא להמליץ לקנות או למכור.

**הרחבת רשות**

אפשר לשפר את הכלי כך שיחזיר גם סיווג מילולי של השינוי.

לדוגמה:

```bash
Change above 5%    → significant increase
Change between -5% and 5% → mostly flat
Change below -5%   → significant decrease
```

אפשר להוסיף את זה כך:

```python
if change_percent > 5:
    label = "significant increase"
elif change_percent < -5:
    label = "significant decrease"
else:
    label = "mostly flat"
```

ואז להחזיר:

```python
return (
    f"{symbol} went {direction} over the past year.\n"
    f"Start price: {start_price:.2f}\n"
    f"End price: {end_price:.2f}\n"
    f"Change: {change_percent:.2f}%\n"
    f"Interpretation: {label}"
)
```

זו הרחבה טובה כי היא מראה איך Tool יכול לעבור משליפת נתונים לעיבוד בסיסי. הוא לא רק מחזיר מחיר, אלא גם מסביר את המשמעות הפשוטה של השינוי.

## פתרון תרגיל 3: הוספת כלי המלצות וחדשות

**מטרה**

בתרגיל הקודם הוספנו ל-Stock Agent יכולת לבדוק ביצועים של מניה בשנה האחרונה. עכשיו נרחיב את הסוכן בעוד שתי יכולות חדשות:

1. הבאת המלצות אנליסטים

2. הבאת חדשות אחרונות על מניה

המטרה היא להבין איך Agent נעשה חזק יותר בעזרת tools נוספים.

המודל עצמו לא בהכרח יודע את החדשות האחרונות על מניה, והוא לא אמור להמציא המלצות אנליסטים. לכן, כאשר המשתמש שואל על חדשות או המלצות, הסוכן צריך להפעיל כלי מתאים שמביא את המידע ממקור חיצוני.

הזרימה שנרצה לבנות היא:

User question 
 ↓ 
Agent understands the request type 
 ↓ 
Agent chooses the correct tool 
 ↓ 
Tool fetches external data 
 ↓ 
Agent explains the result

**מה נוסיף לפרויקט**

נוסיף ל-stock_agent.py שני tools חדשים:

```python
get_stock_recommendations
get_stock_news
```

הכלי הראשון יביא המלצות אנליסטים כאשר הן זמינות.

הכלי השני יביא חדשות אחרונות הקשורות למניה.

בנוסף, נעדכן את רשימת הכלים של ה-Agent ואת ה-SYSTEM_PROMPT, כדי שהסוכן יידע מתי להשתמש בכל כלי.

**קובץ שנעדכן**

בתרגיל הזה נעדכן רק את הקובץ: stock_agent.py

לא צריך לשנות את קבצי ה-RAG, לא צריך לשנות את build_rag_db.py, ולא צריך לשנות את rag_chatbot.py.

**שלב 1: להוסיף Tool להמלצות אנליסטים**

נוסיף פונקציה חדשה בשם:

```python
get_stock_recommendations
```

הפונקציה תקבל ticker symbol, תביא המלצות דרך yfinance, ותחזיר סיכום קצר וברור.

```python
@tool
def get_stock_recommendations(symbol: str) -> str:
    """Get recent analyst recommendations for a stock ticker."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        recommendations = ticker.recommendations

        if recommendations is None or recommendations.empty:
            return f"No analyst recommendations found for {symbol}."

        latest = recommendations.tail(5)

        rows = []
        for _, row in latest.iterrows():
            firm = row.get("Firm", "Unknown firm")
            to_grade = row.get("To Grade", "Unknown rating")
            action = row.get("Action", "")

            if action:
                rows.append(f"- {firm}: {to_grade} ({action})")
            else:
                rows.append(f"- {firm}: {to_grade}")

        return (
            f"Recent analyst recommendations for {symbol}:\n"
            + "\n".join(rows)
        )

    except Exception:
        return f"Error: Could not fetch analyst recommendations for {symbol}."
```

**מה הקוד עושה**

קודם כל, כמו בכל tool טוב, אנחנו מנקים את הקלט:

```python
symbol = symbol.strip().upper()
```

לאחר מכן בודקים שהסימול לא ריק:

```python
if not symbol:
    return "Error: Please provide a stock ticker symbol."
```

אחר כך יוצרים אובייקט של המניה:

```python
ticker = yf.Ticker(symbol)
```

ומנסים להביא המלצות:

```python
recommendations = ticker.recommendations
```

חשוב לבדוק אם אין נתונים:

```python
if recommendations is None or recommendations.empty:
    return f"No analyst recommendations found for {symbol}."
```

לא לכל מניה יהיו המלצות זמינות. זה לא אומר שהקוד נכשל. זה אומר שאין מידע מתאים להציג.

בסוף, אנחנו לוקחים רק את חמש ההמלצות האחרונות:

```python
latest = recommendations.tail(5)
```

זו החלטה חשובה. לא כדאי להחזיר עשרות שורות ל-Agent. כלי טוב מחזיר מידע ממוקד שהמודל יכול להסביר בקלות.

**שלב 2: להוסיף Tool לחדשות**

עכשיו נוסיף כלי נוסף בשם:

```python
get_stock_news
```

המטרה של הכלי הזה היא להחזיר כותרות חדשות אחרונות הקשורות למניה.

```python
@tool
def get_stock_news(symbol: str) -> str:
    """Get recent news headlines for a stock ticker."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        news_items = ticker.news

        if not news_items:
            return f"No recent news found for {symbol}."

        top_items = news_items[:5]

        rows = []
        for item in top_items:
            title = item.get("title", "No title")
            publisher = item.get("publisher", "Unknown publisher")
            link = item.get("link")

            if link:
                rows.append(f"- {title} ({publisher})\n  {link}")
            else:
                rows.append(f"- {title} ({publisher})")

        return f"Recent news for {symbol}:\n" + "\n".join(rows)

    except Exception:
        return f"Error: Could not fetch news for {symbol}."
```

**מה הקוד עושה**

העיקרון דומה לכלי ההמלצות.

ה-tool מקבל סימול מניה, מנקה אותו, בודק שהוא לא ריק, ואז משתמש ב-yfinance כדי להביא חדשות:

```python
news_items = ticker.news
```

אם אין חדשות, מחזירים הודעה ברורה:

```python
if not news_items:
    return f"No recent news found for {symbol}."
```

אם יש חדשות, לוקחים רק את חמש הראשונות:

```python
top_items = news_items[:5]
```

גם כאן אנחנו לא רוצים להציף את ה-Agent ביותר מדי מידע. חמש כותרות מספיקות כדי לתת תמונה ראשונית.



**שלב 3: לעדכן את רשימת הכלים**

אחרי שהוספנו את הפונקציות, צריך לחבר אותן ל-Agent.

אם רשימת הכלים נראתה כך:

```python
tools=[
    get_stock_info,
    get_stock_year_performance,
]
```

נעדכן אותה כך:

```python
tools=[
    get_stock_info,
    get_stock_year_performance,
    get_stock_recommendations,
    get_stock_news,
]
```

לדוגמה, בתוך build_agent():

```python
def build_agent():
    model = build_llm()

    return create_agent(
        model=model,
        tools=[
            get_stock_info,
            get_stock_year_performance,
            get_stock_recommendations,
            get_stock_news,
        ],
        system_prompt=SYSTEM_PROMPT,
    )
```

זו נקודה קריטית. אם הפונקציה קיימת בקובץ אבל לא נמצאת ברשימת ה-tools, ה-Agent לא יוכל להפעיל אותה.

**שלב 4: לעדכן את SYSTEM_PROMPT**

ככל שיש יותר כלים, כך חשוב יותר להסביר לסוכן מתי להשתמש בכל כלי.

נעדכן את ההנחיות כך:

```python
SYSTEM_PROMPT = """
You are a helpful stock assistant.

Use get_stock_info when the user asks about:
- current stock price
- quote
- current market data
- day high, day low, volume, or currency

Use get_stock_year_performance when the user asks about:
- whether a stock went up or down over the past year
- one-year performance
- 12-month performance
- how a stock performed during the last year

Use get_stock_recommendations when the user asks about:
- analyst recommendations
- analyst ratings
- buy, hold, or sell opinions
- upgrades or downgrades

Use get_stock_news when the user asks about:
- recent news
- headlines
- company news
- latest events related to a stock

Do not invent live market data, historical performance, recommendations, or news.
If the user does not provide a ticker symbol, ask for one.
Summarize tool results clearly for the user.
Do not provide financial advice or tell the user to buy or sell a stock.
"""
```

ההנחיה האחרונה חשובה במיוחד:

```bash
Do not provide financial advice or tell the user to buy or sell a stock.
```

ה-Agent יכול להציג מידע, אבל הוא לא אמור לתת המלצת השקעה אישית.

**שלב 5: קוד מלא מעודכן לחלקים המרכזיים**

בשלב הזה stock_agent.py כבר כולל ארבעה כלים.

להלן הקוד המלא של החלקים המרכזיים:

```python
import yfinance as yf
from langchain.agents import create_agent
from langchain.tools import tool

from llm_factory import build_llm


@tool
def get_stock_info(symbol: str) -> str:
    """Get current stock price and market data for a ticker symbol."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

        if not info:
            return f"Error: No stock data found for {symbol}."

        name = info.get("longName") or info.get("shortName") or symbol
        price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )
        day_high = info.get("dayHigh")
        day_low = info.get("dayLow")
        volume = info.get("volume")
        currency = info.get("currency", "")

        if price is None:
            return f"Error: No current price data found for {symbol}."

        return (
            f"Company: {name}\n"
            f"Symbol: {symbol}\n"
            f"Current price: {price} {currency}\n"
            f"Day high: {day_high}\n"
            f"Day low: {day_low}\n"
            f"Volume: {volume}"
        )

    except Exception:
        return f"Error: Could not fetch stock data for {symbol}."


@tool
def get_stock_year_performance(symbol: str) -> str:
    """Check whether a stock went up or down over the past year."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period="1y")

        if history.empty:
            return f"Error: No historical price data found for {symbol}."

        start_price = history["Close"].iloc[0]
        end_price = history["Close"].iloc[-1]

        if start_price == 0:
            return f"Error: Invalid start price found for {symbol}."

        change = end_price - start_price
        change_percent = (change / start_price) * 100

        if change > 0:
            direction = "up"
        elif change < 0:
            direction = "down"
        else:
            direction = "flat"

        return (
            f"{symbol} went {direction} over the past year.\n"
            f"Start price: {start_price:.2f}\n"
            f"End price: {end_price:.2f}\n"
            f"Change: {change_percent:.2f}%"
        )

    except Exception:
        return f"Error: Could not fetch historical data for {symbol}."


@tool
def get_stock_recommendations(symbol: str) -> str:
    """Get recent analyst recommendations for a stock ticker."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        recommendations = ticker.recommendations

        if recommendations is None or recommendations.empty:
            return f"No analyst recommendations found for {symbol}."

        latest = recommendations.tail(5)

        rows = []
        for _, row in latest.iterrows():
            firm = row.get("Firm", "Unknown firm")
            to_grade = row.get("To Grade", "Unknown rating")
            action = row.get("Action", "")

            if action:
                rows.append(f"- {firm}: {to_grade} ({action})")
            else:
                rows.append(f"- {firm}: {to_grade}")

        return (
            f"Recent analyst recommendations for {symbol}:\n"
            + "\n".join(rows)
        )

    except Exception:
        return f"Error: Could not fetch analyst recommendations for {symbol}."


@tool
def get_stock_news(symbol: str) -> str:
    """Get recent news headlines for a stock ticker."""
    symbol = symbol.strip().upper()

    if not symbol:
        return "Error: Please provide a stock ticker symbol."

    try:
        ticker = yf.Ticker(symbol)
        news_items = ticker.news

        if not news_items:
            return f"No recent news found for {symbol}."

        top_items = news_items[:5]

        rows = []
        for item in top_items:
            title = item.get("title", "No title")
            publisher = item.get("publisher", "Unknown publisher")
            link = item.get("link")

            if link:
                rows.append(f"- {title} ({publisher})\n  {link}")
            else:
                rows.append(f"- {title} ({publisher})")

        return f"Recent news for {symbol}:\n" + "\n".join(rows)

    except Exception:
        return f"Error: Could not fetch news for {symbol}."


SYSTEM_PROMPT = """
You are a helpful stock assistant.

Use get_stock_info when the user asks about:
- current stock price
- quote
- current market data
- day high, day low, volume, or currency

Use get_stock_year_performance when the user asks about:
- whether a stock went up or down over the past year
- one-year performance
- 12-month performance
- how a stock performed during the last year

Use get_stock_recommendations when the user asks about:
- analyst recommendations
- analyst ratings
- buy, hold, or sell opinions
- upgrades or downgrades

Use get_stock_news when the user asks about:
- recent news
- headlines
- company news
- latest events related to a stock

Do not invent live market data, historical performance, recommendations, or news.
If the user does not provide a ticker symbol, ask for one.
Summarize tool results clearly for the user.
Do not provide financial advice or tell the user to buy or sell a stock.
"""


def build_agent():
    model = build_llm()

    return create_agent(
        model=model,
        tools=[
            get_stock_info,
            get_stock_year_performance,
            get_stock_recommendations,
            get_stock_news,
        ],
        system_prompt=SYSTEM_PROMPT,
    )


def query_agent(agent, user_input: str) -> str:
    result = agent.invoke(
        {"messages": [{"role": "user", "content": user_input}]}
    )

    return result["messages"][-1].content


def main():
    agent = build_agent()

    print("Stock Agent is ready.")
    print("Type 'quit' or 'exit' to stop.")

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() in {"quit", "exit"}:
            break

        if not user_input:
            print("Please enter a question.")
            continue

        answer = query_agent(agent, user_input)
        print(f"\nAssistant: {answer}")


if __name__ == "__main__":
    main()
```

**שלב 6: איך להריץ**

אם עובדים עם Ollama:

```bash
$env:MODEL_PROVIDER="ollama"
$env:OLLAMA_MODEL="gemma3:1b"
python stock_agent.py
```

אם עובדים עם Anthropic:

```bash
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_api_key_here"
python stock_agent.py
```



**שלב 7: איך לבדוק**

נבדוק כל סוג שאלה בנפרד.

מחיר נוכחי:

```bash
What is the current price of MSFT?
```

ביצועים בשנה האחרונה:

```bash
Did NVDA go up or down in the last year?
```

המלצות אנליסטים:

```bash
What are the analyst recommendations for AAPL?
```

חדשות:

```bash
Show me recent news about TSLA.
```

המטרה היא לוודא שה-Agent לא רק מפעיל כלי, אלא מפעיל את הכלי הנכון לפי סוג השאלה.

**טעויות נפוצות**

טעות ראשונה היא להוסיף את הפונקציות אבל לא להוסיף אותן לרשימת ה-tools.

במקרה כזה הקוד נראה כאילו הוא עודכן, אבל ה-Agent לא באמת מכיר את הכלים החדשים.

טעות שנייה היא לכתוב SYSTEM_PROMPT כללי מדי.

לדוגמה:

```bash
Use the tools when needed.
```

זו הנחיה חלשה מדי. עדיף להסביר בדיוק איזה כלי מתאים לאיזה סוג שאלה.

טעות שלישית היא להחזיר יותר מדי מידע מה-tool. אם הכלי מחזיר עשרים חדשות או עשרות המלצות, ה-Agent יקבל יותר מדי טקסט. עדיף להתחיל מחמש תוצאות בלבד.

טעות רביעית היא לא לטפל במצב שאין נתונים. לא לכל מניה יהיו חדשות או המלצות זמינות. במקרה כזה צריך להחזיר הודעה ברורה ולא לגרום לקוד להיכשל.

טעות חמישית היא להפוך את התשובה לייעוץ השקעות. גם אם יש המלצות אנליסטים, הסוכן צריך להציג מידע בלבד ולא להגיד למשתמש מה לעשות עם הכסף שלו.

**הרחבת רשות**

אפשר לשפר את שני הכלים החדשים כך שיקבלו פרמטר נוסף בשם limit.

לדוגמה:

```python
@tool
def get_stock_news(symbol: str, limit: int = 5) -> str:
```

ואז להגביל את מספר התוצאות לפי הערך שהמשתמש ביקש.

עם זאת, בשלב ראשון עדיף לשמור על כלי פשוט. ככל שיש יותר פרמטרים, כך גדל הסיכוי שה-Agent ישלח אותם בצורה לא מדויקת.

אפשרות נוספת היא להוסיף כלי שמחזיר מידע בסיסי על החברה עצמה:

```python
get_company_profile
```

הכלי יכול להחזיר תחום פעילות, מדינה, אתר, מספר עובדים ותיאור קצר, אם הנתונים זמינים.

העיקרון החשוב הוא שכל כלי צריך להיות קטן וברור.

- Tool אחד למחיר.

- Tool אחד לביצועים.

- Tool אחד להמלצות.

- Tool אחד לחדשות.

כך ה-Agent יכול לבחור ביניהם בצורה טובה יותר, והקוד נשאר פשוט לתחזוקה.



## פתרון תרגיל 4: בניית UI עם FastAPI ו-Jinja2

**מטרה**

עד עכשיו רוב העבודה שלנו הייתה דרך שורת הפקודה. המשתמש מריץ קובץ Python, מקליד שאלה ב-terminal, ומקבל תשובה מודפסת למסך.

זו דרך מצוינת לפיתוח ולבדיקה, אבל היא פחות נוחה למשתמש רגיל.

בתרגיל הזה נהפוך את ה-Stock Agent לאפליקציית Web פשוטה. במקום לעבוד מול command-line, המשתמש יפתח דפדפן, יקליד שאלה בטופס, ויקבל תשובה בעמוד.

המטרה היא להבין איך לוקחים לוגיקה קיימת ועוטפים אותה בממשק Web קטן.

הזרימה שנבנה היא:

Browser 
 ↓ 
FastAPI route 
 ↓ 
Stock Agent 
 ↓ 
Tool call if needed 
 ↓ 
Answer 
 ↓ 
HTML page

**מה נוסיף לפרויקט**

נוסיף שרת Web קטן עם FastAPI, ותבנית HTML עם Jinja2.

נוסיף קובץ Python חדש:

app.py

ונוסיף תיקיית templates עם קובץ HTML:

templates/index.html

השרת יציג עמוד עם טופס. המשתמש יכתוב שאלה, ילחץ על כפתור, והשרת יעביר את השאלה ל-Stock Agent שכבר בנינו.

חשוב להבין: אנחנו לא כותבים מחדש את הסוכן.

אנחנו רק מוסיפים לו שכבת UI.

**קבצים שנוסיף**

מבנה הפרויקט לאחר התרגיל ייראה בערך כך:

```bash
lesson-08-ai-agents/
  app.py
  stock_agent.py
  llm_factory.py
  requirements.txt
  templates/
    index.html
```

הקבצים החדשים הם:

```bash
app.py
templates/index.html
```

ייתכן שנצטרך לוודא שגם requirements.txt כולל את הספריות הנדרשות.

**שלב 1: לוודא שהספריות קיימות**

כדי לבנות UI עם FastAPI ו-Jinja2, נצטרך את הספריות הבאות:

```python
fastapi
uvicorn[standard]
jinja2
python-multipart
```

אם הן לא קיימות ב-requirements.txt, נוסיף אותן:

```python
fastapi
uvicorn[standard]
jinja2
python-multipart
```

הספרייה python-multipart חשובה במיוחד כאשר עובדים עם טפסים ב-FastAPI. בלי הספרייה הזאת, FastAPI עלול להיכשל כאשר הוא מנסה לקרוא נתונים שנשלחו דרך Form.

לאחר מכן נתקין:

```bash
pip install -r requirements.txt
```



**שלב 2: ליצור את app.py**

ניצור קובץ חדש בשם:

```bash
app.py
```

הקובץ הזה יהיה אחראי על שכבת ה-Web.

הוא לא יכיל את כל הלוגיקה של המניות. במקום זה, הוא יייבא את הפונקציות שכבר קיימות ב-stock_agent.py.

**קוד מלא לקובץ app.py**

```python
from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

from stock_agent import build_agent, query_agent


app = FastAPI(title="Stock Agent UI")
templates = Jinja2Templates(directory="templates")

agent = build_agent()


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "question": "",
            "answer": None,
            "error": None,
        },
    )


@app.post("/", response_class=HTMLResponse)
def ask(request: Request, question: str = Form(...)):
    question = question.strip()

    if not question:
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "question": "",
                "answer": None,
                "error": "Please enter a question.",
            },
        )

    try:
        answer = query_agent(agent, question)

        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "question": question,
                "answer": answer,
                "error": None,
            },
        )

    except Exception:
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "question": question,
                "answer": None,
                "error": "Something went wrong while processing your question.",
            },
        )
```

**מה הקוד עושה**

בתחילת הקובץ אנחנו מייבאים את הרכיבים של FastAPI:

```python
from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
```

לאחר מכן אנחנו מייבאים את הלוגיקה הקיימת של הסוכן:

```python
from stock_agent import build_agent, query_agent
```

זו נקודה חשובה. אנחנו לא מעתיקים את כל הקוד של stock_agent.py לתוך app.py. אנחנו משתמשים בו.

לאחר מכן יוצרים את האפליקציה:

```python
app = FastAPI(title="Stock Agent UI")
```

ומגדירים את תיקיית התבניות:

```python
templates = Jinja2Templates(directory="templates")
```

השורה הזאת אומרת ל-FastAPI לחפש קבצי HTML בתוך תיקייה בשם templates.

אחר כך בונים את ה-Agent פעם אחת:

```python
agent = build_agent()
```

חשוב לבנות אותו פעם אחת בתחילת הריצה, ולא בכל שאלה מחדש. אם נבנה את ה-Agent בכל בקשת POST, כל שאלה תהיה איטית יותר, והקוד יהיה פחות יעיל.

**שלב 3: להבין את שני ה-routes**

יש לנו route ראשון מסוג GET:

```python
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
```

ה-route הזה מציג את העמוד הראשי כאשר המשתמש נכנס ל:

```bash
http://localhost:8000 הוא מחזיר את index.html בלי תשובה עדיין.
יש לנו גם route שני מסוג POST:
```

הוא מחזיר את index.html בלי תשובה עדיין.

יש לנו גם route שני מסוג POST:

```python
@app.post("/", response_class=HTMLResponse)
def ask(request: Request, question: str = Form(...)):
```

ה-route הזה מופעל כאשר המשתמש שולח את הטופס.

הפרמטר:

```python
question: str = Form(...)
```

אומר ל-FastAPI לקחת את הערך של השדה question מתוך הטופס.

לאחר מכן אנחנו מנקים את הקלט:

```python
question = question.strip()
```

אם המשתמש שלח שאלה ריקה, נחזיר הודעת שגיאה:

```python
error = "Please enter a question."
```

אם יש שאלה, נפעיל את הסוכן:

```python
answer = query_agent(agent, question)
```

ואת התשובה נחזיר לעמוד.

**שלב 4: ליצור את תיקיית templates**

ניצור תיקייה בשם:

```bash
templates
```

ובתוכה קובץ:

```bash
index.html
```

המבנה יהיה:

```bash
templates/
  index.html
```

**קוד מלא לקובץ templates/index.html**

```python
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Stock Agent</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 760px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
        }

        h1 {
            margin-bottom: 8px;
        }

        .subtitle {
            color: #555;
            margin-bottom: 24px;
        }

        form {
            margin-bottom: 24px;
        }

        input[type="text"] {
            width: 100%;
            padding: 10px;
            font-size: 16px;
            box-sizing: border-box;
        }

        button {
            margin-top: 12px;
            padding: 10px 16px;
            font-size: 16px;
            cursor: pointer;
        }

        .box {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
            background: #fafafa;
            white-space: pre-wrap;
        }

        .error {
            border: 1px solid #e0a0a0;
            background: #fff5f5;
            color: #8a1f1f;
        }

        .question {
            color: #444;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <h1>Stock Agent</h1>
    <p class="subtitle">
        Ask about stock prices, market data, one-year performance, recommendations, or news.
    </p>

    <form method="post">
        <label for="question">Question</label><br>
        <input
            type="text"
            id="question"
            name="question"
            value="{{ question }}"
            placeholder="Example: What is the current price of MSFT?"
        >
        <button type="submit">Ask</button>
    </form>

    {% if error %}
        <div class="box error">
            {{ error }}
        </div>
    {% endif %}

    {% if answer %}
        <div class="box">
            <div class="question">
                <strong>You asked:</strong> {{ question }}
            </div>
            <strong>Answer:</strong>
            <br>
            {{ answer }}
        </div>
    {% endif %}
</body>
</html>
```

**מה קובץ ה-HTML עושה**

הקובץ מציג עמוד פשוט עם כותרת, טופס ותיבת תשובה.

השדה המרכזי הוא:

```python
<input
    type="text"
    id="question"
    name="question"
    value="{{ question }}"
    placeholder="Example: What is the current price of MSFT?"
>
```

השם של השדה הוא:

```python
question
```

וזה חייב להתאים לפרמטר ב-FastAPI:

```python
question: str = Form(...)
```

כאשר המשתמש שולח שאלה, FastAPI קורא את הערך מהטופס, מעביר אותו ל-Agent, ואז מחזיר את התשובה לתבנית.

החלק הזה מציג שגיאה אם יש:

```python
{% if error %}
    <div class="box error">
        {{ error }}
    </div>
{% endif %}
```

והחלק הזה מציג תשובה אם יש:

```python
{% if answer %}
    <div class="box">
        ...
        {{ answer }}
    </div>
{% endif %}
```

**שלב 5: להריץ את האפליקציה**

כדי להריץ את שרת ה-Web, נשתמש ב-uvicorn.

אם עובדים עם Ollama:

```bash
$env:MODEL_PROVIDER="ollama"
$env:OLLAMA_MODEL="gemma3:1b"
uvicorn app:app --reload
```

אם עובדים עם Anthropic:

```bash
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_api_key_here"
uvicorn app:app --reload
```

לאחר ההרצה, פותחים בדפדפן:

http://localhost:8000

**שלב 6: איך לבדוק**

נבדוק קודם שעמוד הבית עולה.

לאחר מכן נשלח שאלה פשוטה:

```bash
What is the current price of MSFT?
```

אחר כך נבדוק כלי אחר:

```bash
Did NVDA go up or down in the last year?
```

ואז נבדוק חדשות:

```bash
Show me recent news about TSLA.
```

המטרה היא לוודא שה-UI לא שבר את ה-Agent. אותה לוגיקה שעבדה דרך command-line אמורה לעבוד גם דרך הדפדפן.

**טעויות נפוצות**

טעות נפוצה ראשונה היא לשכוח להתקין את python-multipart.

אם מקבלים שגיאה שקשורה ל-Form או ל-multipart, כדאי לבדוק ש-requirements.txt כולל:

```bash
python-multipart
```

טעות נפוצה שנייה היא לשים את index.html במקום לא נכון.

FastAPI מחפש את הקובץ כאן:

```python
templates/index.html
```

אם הקובץ נמצא במקום אחר, תתקבל שגיאה שהתבנית לא נמצאה.

טעות נפוצה שלישית היא לבנות את ה-Agent בתוך ה-route.

לא כדאי לעשות כך:

```python
@app.post("/")
def ask(...):
    agent = build_agent()
    answer = query_agent(agent, question)
```

במקרה כזה ה-Agent ייבנה מחדש בכל בקשה. עדיף לבנות אותו פעם אחת בתחילת הקובץ:

```python
agent = build_agent()
```

טעות נפוצה רביעית היא להעתיק את כל קוד הסוכן לתוך app.py.

app.py אמור להיות שכבת Web דקה. הלוגיקה נשארת ב-stock_agent.py.

זו הפרדה נכונה:

```bash
stock_agent.py → agent logic
app.py         → web interface
index.html     → page template
```

**הרחבת רשות**

אפשר לשפר את ה-UI כך שישמור היסטוריית שאלות ותשובות.

לדוגמה, במקום להציג רק תשובה אחת, אפשר להציג רשימה:

```bash
Question 1
Answer 1

Question 2
Answer 2

Question 3
Answer 3
```

אפשרות נוספת היא להוסיף בחירה בין כמה מצבים:

```bash
Stock Agent
RAG Chatbot
Recipe Workflow
```

אבל בשלב הראשון עדיף לא להעמיס. המטרה של התרגיל היא להבין איך מחברים סקריפט קיים ל-Web UI.

לאחר שהחיבור הבסיסי עובד, אפשר להמשיך בהדרגה לעיצוב, היסטוריה, הפרדת routes, או ממשק מתקדם יותר.



## פתרון תרגיל 5: Workflow דו-שלבי

**מטרה**

בתרגילים הקודמים בנינו Agent שמפעיל כלים, והוספנו לו ממשק Web. עכשיו נעבור לדפוס עבודה אחר: Workflow מובנה.

המטרה היא להבין מתי לא חייבים Agent חופשי.

לפעמים אין צורך שהמודל יחליט לבד מה לעשות. לפעמים אנחנו יודעים מראש מה סדר הפעולות הרצוי, וכל מה שצריך הוא להריץ כמה שלבים קבועים אחד אחרי השני.

בתרגיל הזה נבנה Workflow פשוט:

```bash
ingredients → recipe name → cooking instructions
```

המשתמש יכניס רשימת מרכיבים. 
השלב הראשון ייצור שם למתכון. 
השלב השני יקבל את שם המתכון ואת המרכיבים, ויכתוב הוראות הכנה.

הזרימה שנבנה היא:

User ingredients 
 ↓ 
Step 1: generate recipe name 
 ↓ 
Step 2: write cooking instructions 
 ↓ 
Final recipe

זה נקרא Prompt Chaining, כי אנחנו מחברים כמה קריאות למודל בשרשרת. הפלט של שלב אחד הופך לקלט של השלב הבא.

**מה נוסיף לפרויקט**

נוסיף קובץ חדש בשם:

```bash
recipe_workflow.py
```

הקובץ הזה יכיל Workflow דו-שלבי פשוט.

הוא ישתמש באותו מנגנון יצירת מודל שכבר בנינו:

```python
from llm_factory import build_llm
```

כך גם ה-workflow יוכל לעבוד עם Anthropic או עם Ollama, לפי משתני הסביבה.

**קובץ שנוסיף**

מבנה הפרויקט לאחר התרגיל:

```bash
lesson-08-ai-agents/
  llm_factory.py
  stock_agent.py
  rag_chatbot.py
  build_rag_db.py
  app.py
  recipe_workflow.py
  templates/
    index.html
```

הקובץ החדש הוא:

```bash
recipe_workflow.py
```

**שלב 1: להבין את ההבדל בין Agent לבין Workflow**

לפני שנכתוב קוד, חשוב להבין מה אנחנו בונים.

ב-Agent, המודל מקבל יותר חופש. הוא יכול להחליט אם להשתמש בכלי, באיזה כלי להשתמש, ואיך להמשיך לפי התוצאה.

ב-Workflow, הסדר מוגדר מראש.

לדוגמה:

```bash
Agent:
The model decides what to do next.

Workflow:
The developer defines the steps in advance.
```

בתרגיל שלנו אין צורך שהמודל יחליט מה השלב הבא. אנחנו יודעים שהשלב הראשון הוא יצירת שם, והשלב השני הוא כתיבת הוראות.

לכן Workflow מתאים כאן יותר מ-Agent.



**שלב 2: ליצור פונקציה לשלב הראשון**

ניצור פונקציה בשם:

```python
generate_recipe_name
```

הפונקציה תקבל את המודל ואת רשימת המרכיבים, ותחזיר שם קצר למתכון.

```python
def generate_recipe_name(llm, ingredients: str) -> str:
    prompt = f"""
You are a creative recipe naming assistant.

Create one short recipe name based on these ingredients:
{ingredients}

Rules:
- Return only the recipe name.
- Do not include explanations.
- Do not include cooking instructions.
"""

    response = llm.invoke(prompt)
    return response.content.strip()
```

ההנחיה החשובה כאן היא:

```python
Return only the recipe name.
```

למה זה חשוב?

כי הפלט של השלב הראשון נכנס לשלב השני. אם השלב הראשון יחזיר גם הסבר, גם רעיונות, גם הערות וגם שם מתכון, יהיה קשה להשתמש בו בצורה נקייה.

ב-Workflow טוב, כל שלב צריך להחזיר פלט ברור.

**שלב 3: ליצור פונקציה לשלב השני**

עכשיו ניצור פונקציה בשם:

```python
write_cooking_instructions
```

הפונקציה תקבל את המודל, את רשימת המרכיבים ואת שם המתכון שנוצר בשלב הראשון.

```python
def write_cooking_instructions(
    llm,
    ingredients: str,
    recipe_name: str,
) -> str:
    prompt = f"""
You are a practical cooking assistant.

Recipe name:
{recipe_name}

Ingredients:
{ingredients}

Write simple cooking instructions for this recipe.

Rules:
- Keep the instructions beginner-friendly.
- Use numbered steps.
- Do not add ingredients that were not provided unless absolutely necessary.
- Keep the answer concise.
"""

    response = llm.invoke(prompt)
    return response.content.strip()
```

כאן רואים את השרשור:

```python
recipe_name
```

נוצר בשלב הראשון, ונכנס לתוך ה-prompt של השלב השני.

זה ההבדל בין שתי קריאות נפרדות שאין ביניהן קשר, לבין Workflow אמיתי.

**שלב 4: לחבר את שני השלבים**

עכשיו ניצור פונקציה שמריצה את כל ה-workflow:

```python
def run_recipe_workflow(llm, ingredients: str) -> str:
    recipe_name = generate_recipe_name(llm, ingredients)
    instructions = write_cooking_instructions(
        llm=llm,
        ingredients=ingredients,
        recipe_name=recipe_name,
    )

    return (
        f"Recipe name: {recipe_name}\n\n"
        f"Cooking instructions:\n{instructions}"
    )
```

הפונקציה הזאת היא הלב של ה-workflow.

היא לא מבקשת מהמודל לעשות הכול בבת אחת.

היא מריצה שלב ראשון, שומרת את התוצאה, ואז מעבירה אותה לשלב השני.

הזרימה בקוד היא:

ingredients 
 ↓ 
generate_recipe_name() 
 ↓ 
recipe_name 
 ↓ 
write_cooking_instructions() 
 ↓ 
instructions 
 ↓ 
final result

**שלב 5: להוסיף בדיקת קלט**

לפני שמריצים את ה-workflow, כדאי לוודא שהמשתמש הכניס מרכיבים.

נוסיף פונקציה קטנה:

```python
def validate_ingredients(ingredients: str) -> str:
    ingredients = ingredients.strip()

    if not ingredients:
        raise ValueError("Please provide at least one ingredient.")

    return ingredients
```

זו לא חובה, אבל זו הרגל טוב. במקום לתת למודל קלט ריק, אנחנו מחזירים שגיאה ברורה.

**שלב 6: קוד מלא לקובץ recipe_workflow.py**

```python
from llm_factory import build_llm


def validate_ingredients(ingredients: str) -> str:
    ingredients = ingredients.strip()

    if not ingredients:
        raise ValueError("Please provide at least one ingredient.")

    return ingredients


def generate_recipe_name(llm, ingredients: str) -> str:
    prompt = f"""
You are a creative recipe naming assistant.

Create one short recipe name based on these ingredients:
{ingredients}

Rules:
- Return only the recipe name.
- Do not include explanations.
- Do not include cooking instructions.
"""

    response = llm.invoke(prompt)
    return response.content.strip()


def write_cooking_instructions(
    llm,
    ingredients: str,
    recipe_name: str,
) -> str:
    prompt = f"""
You are a practical cooking assistant.

Recipe name:
{recipe_name}

Ingredients:
{ingredients}

Write simple cooking instructions for this recipe.

Rules:
- Keep the instructions beginner-friendly.
- Use numbered steps.
- Do not add ingredients that were not provided unless absolutely necessary.
- Keep the answer concise.
"""

    response = llm.invoke(prompt)
    return response.content.strip()


def run_recipe_workflow(llm, ingredients: str) -> str:
    ingredients = validate_ingredients(ingredients)

    recipe_name = generate_recipe_name(llm, ingredients)
    instructions = write_cooking_instructions(
        llm=llm,
        ingredients=ingredients,
        recipe_name=recipe_name,
    )

    return (
        f"Recipe name: {recipe_name}\n\n"
        f"Cooking instructions:\n{instructions}"
    )


def main():
    llm = build_llm()

    print("Recipe Workflow is ready.")
    print("Enter ingredients, or type 'quit' / 'exit' to stop.")

    while True:
        ingredients = input("\nIngredients: ").strip()

        if ingredients.lower() in {"quit", "exit"}:
            break

        try:
            result = run_recipe_workflow(llm, ingredients)
            print(f"\n{result}")

        except ValueError as error:
            print(f"\nError: {error}")

        except Exception:
            print("\nError: Something went wrong while running the workflow.")


if __name__ == "__main__":
    main()
```

**שלב 7: איך להריץ**

אם עובדים עם Ollama:

```bash
$env:MODEL_PROVIDER="ollama"
$env:OLLAMA_MODEL="gemma3:1b"
python recipe_workflow.py
```

אם עובדים עם Anthropic:

```bash
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_api_key_here"
python recipe_workflow.py
```

לאחר ההרצה, נכניס מרכיבים לדוגמה:

```bash
tomatoes, pasta, garlic, olive oil, basil
```

פלט אפשרי:

```bash
Recipe name: Garlic Basil Tomato Pasta

Cooking instructions:
1. Cook the pasta according to the package instructions.
2. Heat olive oil in a pan and add chopped garlic.
3. Add tomatoes and cook until softened.
4. Mix in the cooked pasta.
5. Add basil before serving.
```

התוצאה המדויקת יכולה להשתנות לפי המודל, אבל המבנה צריך להיות ברור: שם מתכון ואז הוראות הכנה.

**שלב 8: איך לבדוק**

נבדוק כמה סוגי קלט.

קלט רגיל:

```bash
chicken, rice, lemon, garlic
```

קלט קצר:

```bash
eggs, cheese
```

קלט ארוך יותר:

```bash
potatoes, onion, carrots, olive oil, salt, pepper, paprika
```

וקלט ריק:

במקרה של קלט ריק, המערכת צריכה להחזיר הודעה ברורה:

```bash
Error: Please provide at least one ingredient.
```

**שלב 9: למה לא לבקש את ההכול בקריאה אחת**

אפשר היה לכתוב prompt אחד גדול:

```bash
Create a recipe name and cooking instructions from these ingredients.
```

וזה יכול לעבוד. אבל אז קשה יותר לשלוט בתהליך.

כאשר מפרקים את המשימה לשני שלבים, אפשר לבדוק כל שלב בנפרד.

לדוגמה, אפשר לבדוק רק את יצירת השם:

```python
llm = build_llm()
name = generate_recipe_name(llm, "tomatoes, pasta, garlic")
print(name)
```

ואפשר לבדוק רק את שלב ההוראות עם שם קבוע:

```bash
llm = build_llm()
instructions = write_cooking_instructions(
    llm=llm,
    ingredients="tomatoes, pasta, garlic",
    recipe_name="Garlic Tomato Pasta",
)
print(instructions)
```

זה עוזר מאוד בדיבוג. אם התוצאה הסופית לא טובה, אפשר לדעת באיזה שלב הבעיה.

**טעויות נפוצות**

טעות ראשונה היא לא להעביר את הפלט של השלב הראשון לשלב השני.

אם יוצרים שם מתכון אבל לא משתמשים בו בהמשך, אין באמת Workflow דו-שלבי.

טעות שנייה היא לתת לשלב הראשון להחזיר יותר מדי טקסט.

אם השלב הראשון מחזיר:

```bash
Here are three possible names...
```

יהיה קשה להשתמש בזה בשלב השני. לכן ביקשנו ממנו להחזיר רק שם אחד.

טעות שלישית היא לערבב Agent עם Workflow בלי צורך.

בתרגיל הזה אין tools, אין בחירת פעולה ואין צורך בהחלטה דינמית. לכן Workflow פשוט מתאים יותר.

טעות רביעית היא לא לבדוק קלט ריק. אם המשתמש לא מכניס מרכיבים, אין למודל בסיס ליצירת מתכון.

**הרחבת רשות**

אפשר להוסיף שלב שלישי ל-workflow:

```bash
ingredients → recipe name → cooking instructions → review and improve
```

השלב השלישי יקבל את ההוראות ויבדוק אם הן ברורות למתחילים.

לדוגמה:

```python
def review_recipe(llm, recipe_text: str) -> str:
    prompt = f"""
You are a recipe reviewer.

Review the following recipe and improve it if needed:
{recipe_text}

Rules:
- Keep it concise.
- Make unclear steps clearer.
- Do not add complex techniques.
"""

    response = llm.invoke(prompt)
    return response.content.strip()
```

ואז אפשר לעדכן את ה-workflow:

```python
def run_recipe_workflow(llm, ingredients: str) -> str:
    ingredients = validate_ingredients(ingredients)

    recipe_name = generate_recipe_name(llm, ingredients)
    instructions = write_cooking_instructions(
        llm=llm,
        ingredients=ingredients,
        recipe_name=recipe_name,
    )

    draft = (
        f"Recipe name: {recipe_name}\n\n"
        f"Cooking instructions:\n{instructions}"
    )

    improved_recipe = review_recipe(llm, draft)
    return improved_recipe
```

זו הרחבה טובה כי היא מראה איך אפשר לבנות Workflow ארוך יותר בהדרגה.

העיקרון נשאר אותו עיקרון: כל שלב עושה פעולה אחת ברורה, והפלט שלו עובר לשלב הבא.


