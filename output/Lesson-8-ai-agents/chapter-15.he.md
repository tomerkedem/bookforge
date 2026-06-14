# תרגול מעשי מונחה והרחבות

בפרק זה נרחיב את הפרויקט בעזרת חמישה תרגילים מעשיים.

בכל תרגיל נוסיף יכולת אחת, נעדכן את הקבצים הדרושים, נריץ את הקוד, ונבדוק שהתוצאה עובדת.

התרגילים בפרק זה הם:

1. מעבר ל-Ollama

2. בדיקה אם מניה עלתה או ירדה בשנה האחרונה

3. הוספת כלי המלצות וחדשות

4. בניית UI עם FastAPI ו-Jinja2

5. בניית Workflow דו-שלבי

## פתרון תרגיל 1: מעבר ל-Ollama

בתרגיל הזה נוסיף לפרויקט אפשרות לבחור בין מודל ענן לבין מודל מקומי.

עד עכשיו הקבצים rag_chatbot.py ו-stock_agent.py השתמשו ישירות במודל של Anthropic. זה עובד, אבל זה יוצר תלות חזקה בספק אחד.

במקום שכל קובץ יחליט לבד איך ליצור את המודל, נרכז את יצירת המודל בקובץ אחד:

```bash
llm_factory.py
```

הקובץ הזה יהיה אחראי לבדוק את משתני הסביבה ולהחזיר את המודל המתאים.

אם נרצה לעבוד עם Anthropic, נגדיר:

```python
MODEL_PROVIDER=anthropic
```

אם נרצה לעבוד עם Ollama, נגדיר:

```python
MODEL_PROVIDER=ollama
```

כך שאר הקוד לא צריך להשתנות. rag_chatbot.py ו-stock_agent.py יקבלו אובייקט LLM מוכן, בלי לדעת אם הוא הגיע מהענן או ממודל מקומי.

הקבצים שנעדכן בתרגיל הזה הם:

- llm_factory.py קובץ חדש

- rag_chatbot.py עדכון קטן

- stock_agent.py עדכון קטן

- requirements.txt הוספת langchain-ollama

המטרה של התרגיל היא להגיע למצב שבו אפשר להריץ את אותו פרויקט בשתי צורות:

```bash
$env:MODEL_PROVIDER="anthropic"
python rag_chatbot.py
```

או:

```bash
$env:MODEL_PROVIDER="ollama"
python rag_chatbot.py
```

אותה אפליקציה, אותו קוד כמעט לגמרי, ספק מודל שונה.

ונעדכן את הקבצים שמשתמשים במודל:

```bash
rag_chatbot.py
stock_agent.py
requirements.txt
```

**עדכון requirements.txt**

נוסיף:

```bash
langchain-ollama
```

**תוכן מלא לקובץ llm_factory.py**

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

**עדכון rag_chatbot.py**

נוסיף import:

```python
from llm_factory import build_llm
```

ובתוך main() נשתמש ב:

```python
llm = build_llm()
```

במקום ליצור את ChatAnthropic ישירות בקובץ.

**עדכון stock_agent.py**

נוסיף import:

```python
from llm_factory import build_llm
```

ונעדכן את build_agent():

```python
def build_agent():
    model = build_llm()

    return create_agent(
        model=model,
        tools=[get_stock_info],
        system_prompt=SYSTEM_PROMPT,
    )
```

**הרצה עם Anthropic**

```bash
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_api_key_here"
python rag_chatbot.py
```

**הרצה עם Ollama**

```bash
ollama pull gemma3:1b

$env:MODEL_PROVIDER="ollama"
$env:OLLAMA_MODEL="gemma3:1b"
python rag_chatbot.py
```

**בדיקה**

בודקים שהצ’אטבוט עדיין עובד:

```bash
What is ChromaDB?
```

ובודקים שגם ה-Agent עדיין עובד:

```bash
What is the current price of MSFT?
```

בסיום התרגיל, יצירת המודל מרוכזת בקובץ אחד, ושאר הפרויקט יכול לעבוד עם Anthropic או Ollama בלי שינוי לוגיקה.



## פתרון תרגיל 2: בדיקה אם מניה עלתה או ירדה בשנה האחרונה

בתרגיל הזה נרחיב את stock_agent.py ונוסיף Tool חדש שבודק ביצועי מניה בשנה האחרונה.

המטרה היא לא רק להביא מחיר נוכחי, אלא להביא נתונים היסטוריים, לחשב שינוי, ולהחזיר תשובה ברורה.

נעדכן קובץ אחד:

```bash
stock_agent.py
```

נוסיף Tool חדש:

```python
get_stock_year_performance
```

**הקוד שנוסיף ל-stock_agent.py**

נוסיף את הפונקציה הבאה מתחת ל-get_stock_info:

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
            f"{symbol} went {direction} over the past year.\n"
            f"Start price: {start_price:.2f}\n"
            f"End price: {end_price:.2f}\n"
            f"Change: {change_percent:.2f}%"
        )

    except Exception:
        return f"Error: Could not fetch historical data for {symbol}."
```

**עדכון SYSTEM_PROMPT**

נעדכן את ההנחיות כך שה-Agent ידע מתי להשתמש בכלי החדש:

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
Do not provide financial advice or tell the user to buy or sell a stock.
"""
```

**עדכון רשימת הכלים**

בתוך build_agent() נעדכן את רשימת הכלים:

```python
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
```

**הרצה**

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

**בדיקה**

בודקים שהכלי הישן עדיין עובד:

```bash
What is the current price of MSFT?
```

בודקים את הכלי החדש:

```bash
Did MSFT go up or down in the last year?
```

אפשר לבדוק גם:

```bash
How did NVDA perform over the past 12 months?
```

תשובה תקינה אמורה לכלול כיוון שינוי, מחיר התחלה, מחיר סיום ואחוז שינוי.

**טעויות נפוצות**

הטעות הנפוצה ביותר היא להוסיף את הפונקציה אבל לשכוח להוסיף אותה לרשימת tools.

טעות נוספת היא לא לעדכן את SYSTEM_PROMPT, ואז ה-Agent לא תמיד יבין מתי להשתמש בכלי החדש.

חשוב גם לבדוק את history.empty, כי לא לכל סימול יהיו נתונים היסטוריים זמינים.

בסיום התרגיל, ה-Stock Agent יודע לענות גם על מחיר נוכחי וגם על ביצועים בשנה האחרונה.

## פתרון תרגיל 3: הוספת כלי המלצות וחדשות

בתרגיל הזה נרחיב את stock_agent.py בעוד שני Tools:

```python
get_stock_recommendations
get_stock_news
```

הראשון יחזיר המלצות אנליסטים כאשר הן זמינות.

השני יחזיר חדשות אחרונות על מניה.

נעדכן קובץ אחד:

```bash
stock_agent.py
```

**הקוד שנוסיף ל-stock_agent.py**

נוסיף את שתי הפונקציות הבאות מתחת ל-get_stock_year_performance.

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

**עדכון SYSTEM_PROMPT**

נעדכן את ההנחיות כך שה-Agent ידע לבחור בין ארבעת הכלים:

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

**עדכון רשימת הכלים**

בתוך build_agent() נעדכן את רשימת הכלים:

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

**הרצה**

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

**בדיקה**

בודקים מחיר נוכחי:

```bash
What is the current price of MSFT?
```

בודקים ביצועים בשנה האחרונה:

```bash
Did NVDA go up or down in the last year?
```

בודקים המלצות אנליסטים:

```bash
What are the analyst recommendations for AAPL?
```

בודקים חדשות:

```bash
Show me recent news about TSLA.
```

**טעויות נפוצות**

הטעות הנפוצה ביותר היא להוסיף את הפונקציות אבל לשכוח להוסיף אותן לרשימת tools.

טעות נוספת היא להשאיר SYSTEM_PROMPT כללי מדי. כאשר יש כמה כלים, צריך להסביר בבירור מתי להשתמש בכל כלי.

חשוב גם לזכור שלא לכל מניה יהיו חדשות או המלצות זמינות. במקרה כזה הכלי צריך להחזיר הודעה ברורה, ולא לגרום לתוכנית להיכשל.

בסיום התרגיל, ה-Stock Agent יודע להשתמש בארבעה כלים שונים: מחיר נוכחי, ביצועים שנתיים, המלצות אנליסטים וחדשות.



## פתרון תרגיל 4: בניית UI עם FastAPI ו-Jinja2

בתרגיל הזה נוסיף ל-Stock Agent ממשק Web פשוט.

במקום להריץ את הסוכן רק דרך שורת הפקודה, נוכל לפתוח דפדפן, להקליד שאלה בטופס, ולקבל תשובה בעמוד.

נוסיף שני קבצים:

```bash
app.py
templates/index.html
```

ונעדכן את:

```bash
requirements.txt
```

**עדכון requirements.txt**

נוסיף את הספריות הבאות:

```python
fastapi
uvicorn[standard]
jinja2
python-multipart
```

הקובץ המלא יכול להיראות כך:

```python
langchain
langchain-chroma
langchain-community
langchain-anthropic
langchain-ollama
chromadb
sentence-transformers
yfinance
python-dotenv
fastapi
uvicorn[standard]
jinja2
python-multipart
```

לאחר העדכון נריץ:

```bash
pip install -r requirements.txt
```

**תוכן הקובץ app.py**

ניצור קובץ חדש בשם app.py:

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

הקובץ app.py לא מכיל את הלוגיקה של הסוכן עצמו. הוא רק שכבת Web דקה שמייבאת את:

```python
from stock_agent import build_agent, query_agent
```

**תוכן הקובץ templates/index.html**

ניצור תיקייה בשם:

```bash
templates
```

ובתוכה קובץ:

```bash
index.html
```

תוכן הקובץ:

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

**הרצה**

אם עובדים עם Anthropic:

```bash
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_api_key_here"
uvicorn app:app --reload
```

אם עובדים עם Ollama:

```bash
$env:MODEL_PROVIDER="ollama"
$env:OLLAMA_MODEL="gemma3:1b"
uvicorn app:app --reload
```

לאחר ההרצה נפתח בדפדפן:

```bash
http://localhost:8000
```

**בדיקה**

נבדוק שהעמוד עולה, ואז נשלח שאלות:

```bash
What is the current price of MSFT?
Did NVDA go up or down in the last year?
Show me recent news about TSLA.
```

אם מתקבלת תשובה בדפדפן, סימן שה-UI מחובר בהצלחה ל-Stock Agent.

**טעויות נפוצות**

אם מתקבלת שגיאה שקשורה ל-Form, בדרך כלל חסרה הספרייה:

python-multipart

אם מתקבלת שגיאה שהתבנית לא נמצאה, צריך לוודא שהקובץ נמצא בדיוק כאן:

templates/index.html

אם השרת נפתח אבל השאלה נכשלת, כדאי לבדוק קודם שה-Agent עובד לבד:

python stock_agent.py

בסיום התרגיל, יש לפרויקט גם ממשק Web פשוט שמפעיל את אותו Stock Agent שכבר בנינו.

## פתרון תרגיל 5: Workflow דו-שלבי

בתרגיל הזה נוסיף לפרויקט Workflow פשוט.

המטרה היא להראות שלא כל מערכת צריכה להיות Agent חופשי. לפעמים סדר הפעולות ידוע מראש, ואז עדיף לבנות Workflow ברור.

נוסיף קובץ חדש:

```bash
recipe_workflow.py
```

הזרימה תהיה:

```bash
User ingredients
   ↓
Generate recipe name
   ↓
Write cooking instructions
   ↓
Final recipe
```

**תוכן הקובץ recipe_workflow.py**

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
            print("Goodbye.")
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

**הרצה**

אם עובדים עם Anthropic:

```bash
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_api_key_here"
python recipe_workflow.py
```

אם עובדים עם Ollama:

```bash
$env:MODEL_PROVIDER="ollama"
$env:OLLAMA_MODEL="gemma3:1b"
python recipe_workflow.py
```

**בדיקה**

נכניס מרכיבים לדוגמה:

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

נבדוק גם קלט קצר:

```bash
eggs, cheese
```

ונבדוק קלט ריק. במקרה כזה אמורה להופיע הודעה:

```bash
Error: Please provide at least one ingredient.
```

**למה זה Workflow ולא Agent**

כאן אין צורך שהמודל יחליט מה לעשות.

הסדר קבוע מראש:

שלב 1: ליצור שם למתכון

שלב 2: לכתוב הוראות הכנה

לכן Workflow מתאים יותר מ-Agent.

בסיום התרגיל, נוסף לפרויקט קובץ שמדגים Prompt Chaining פשוט: פלט של שלב אחד נכנס כקלט לשלב הבא.


