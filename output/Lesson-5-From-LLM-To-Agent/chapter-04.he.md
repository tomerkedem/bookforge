# Async אמיתי, כמה קריאות במקביל

אחרי שהצגנו קריאה אסינכרונית אחת מול Anthropic API, הגיע החלק שבו מתחילים לראות למה async באמת חשוב. הקובץ 6_anthropic_api_async.py הראה איך כותבים קריאה אחת עם await, אבל עדיין לא היה ברור מה היתרון הגדול. בשביל זה נעבור לקובץ הבא: 8_anthropic_api_async_multiple.py.

כאן מתחילים לראות את הרעיון האמיתי של async: לא רק לכתוב פונקציה אסינכרונית, אלא לאפשר לכמה פעולות להתקדם במקביל בזמן שהן ממתינות לתשובות מהרשת.

גם בפרק הזה נתחיל מהקובץ עצמו בשלמותו, ואז נפרק אותו בהדרגה.

```python
import os
import asyncio
from anthropic import AsyncAnthropic, DefaultAioHttpClient


PROMPTS = [
    "Give me one sentence about the ocean.",
    "Give me one sentence about space.",
    "Give me one sentence about music.",
    "Give me one sentence about AI.",
    "Give me one sentence about history.",
]


async def ask_model(client: AsyncAnthropic, prompt: str) -> str:
    response = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=128,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


async def main() -> None:
    async with AsyncAnthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        http_client=DefaultAioHttpClient(),
    ) as client:

        tasks = [ask_model(client, prompt) for prompt in PROMPTS]

        results = await asyncio.gather(*tasks)

        for prompt, result in zip(PROMPTS, results):
            print(f"Prompt: {prompt}")
            print(f"Response: {result}")
            print("-" * 40)


asyncio.run(main())
```

הקובץ הזה נראה במבט ראשון דומה לקובץ הקודם: גם כאן יש AsyncAnthropic, גם כאן יש await, וגם כאן שולחים prompts ל-Claude. אבל ההבדל המרכזי הוא שכאן לא שולחים בקשה אחת. יוצרים כאן כמה פעולות אסינכרוניות ומריצים אותן יחד.

## רשימת ה-prompts

הקובץ מתחיל ברשימה:

```python
PROMPTS = [
    "Give me one sentence about the ocean.",
    "Give me one sentence about space.",
    "Give me one sentence about music.",
    "Give me one sentence about AI.",
    "Give me one sentence about history.",
]
```

זו פשוט רשימת שאלות שנשלחות למודל. המטרה כאן אינה התוכן של השאלות, אלא העובדה שיש כמה מהן. במקום לשלוח בקשה אחת, רוצים לשלוח חמש בקשות שונות כמעט באותו זמן.

## הפונקציה ask_model

לאחר מכן מוגדרת פונקציה אסינכרונית:

```python
async def ask_model(client: AsyncAnthropic, prompt: str) -> str:
```

הפונקציה מקבלת שני פרמטרים:

1. **client** - אובייקט התקשורת מול Anthropic API.

2. **prompt** - הטקסט שאותו רוצים לשלוח למודל.

היא מחזירה str, כלומר מחרוזת עם תשובת המודל.

בתוך הפונקציה מתבצעת הקריאה עצמה:

```python
response = await client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=128,
    messages=[{"role": "user", "content": prompt}],
)
```

זו אותה קריאה בסיסית שכבר ראינו בפרק הקודם, רק שכאן הפונקציה בנויה בצורה כללית יותר:

במקום hardcoded prompt אחד, היא מקבלת prompt מבחוץ.

בסיום הפונקציה מוחזר הטקסט:

```python
return response.content[0].text
```

כלומר, ask_model היא wrapper קטן סביב הקריאה למודל: היא מקבלת prompt, שולחת אותו ל-Claude, ומחזירה את התשובה.

## יצירת ה-client

הפונקציה main מתחילה בצורה שכבר מוכרת לנו:

```python
async with AsyncAnthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
    http_client=DefaultAioHttpClient(),
) as client:
```

גם כאן יוצרים client אסינכרוני מול Anthropic API, עם HTTP client אסינכרוני.

עד כאן הכול דומה לפרק הקודם.

## יצירת ה-tasks

החלק החשוב באמת מתחיל כאן:

```python
tasks = [ask_model(client, prompt) for prompt in PROMPTS]
```

כאן הקוד עובר על כל ה prompts ויוצר עבור כל אחד פעולה אסינכרונית של ask_model, שאותה אפשר להריץ בהמשך במקביל לפעולות אחרות.

חשוב להבין: בשלב הזה עדיין לא מחכים לתשובות. אנחנו רק יוצרים את המשימות.

כל איבר ברשימה tasks מייצג פעולה אסינכרונית שאפשר להריץ.

## asyncio.gather - הלב של הדוגמה

השורה החשובה ביותר בקובץ היא:

```python
results = await asyncio.gather(*tasks)
```

כאן מתרחש הקסם של async.

asyncio.gather מקבל כמה פעולות async ומריץ אותן יחד. במקום להמתין שכל בקשת API תסתיים לפני ששולחים את הבאה, המערכת שולחת את כל הבקשות כמעט באותו זמן ומנהלת את ההמתנה לכולן במקביל.

ה-event loop מנהל את כולן במקביל.

החוכמה ב-async היא לא רק להוסיף async ו-await לקוד. החוכמה היא לאפשר לכמה פעולות להתקדם במקביל בזמן שהן ממתינות לתשובות מהרשת.

## השאלה שעלתה בשיעור: אם יש await, למה זה async?

זו אחת השאלות הכי טבעיות כשפוגשים async בפעם הראשונה.

אם כתוב:

```python
await asyncio.gather(*tasks)
```

נראה כאילו הקוד “עוצר” ומחכה. אז איך אומרים שזה async (מקביל)?

ההסבר הוא ש-await לא אומר שכל התוכנית נעצרת. הוא אומר שהפעולה האסינכרונית הנוכחית ממתינה לתוצאה, ובזמן הזה מנגנון ה-async של Python יכול להמשיך לקדם פעולות אחרות.

בזמן שהפעולה האסינכרונית הזו ממתינה, ה-event loop יכול להמשיך להריץ פעולות async אחרות שמוכנות להתקדם.

במקרה שלנו:

בקשה אחת מחכה לתגובה מ-Claude.

בינתיים בקשה שנייה יכולה להישלח.

בקשה שלישית יכולה לחזור.

בקשה רביעית יכולה להמתין.

ה-event loop כל הזמן עובר בין הפעולות השונות לפי מי שממתינה ומי שמוכנה להמשיך.



אפשר לחשוב על זה כך:

<img src="/Lesson-5-From-LLM-To-Agent/assets/image-02.png" alt="image-02.png" width="636" height="393" />


כלומר, אין כאן כמה threads שרצים במקביל בצורה קלאסית. יש event loop שמנהל הרבה פעולות ממתינות בצורה יעילה.

**איך זה נראה בפועל**

אם היינו שולחים את חמש הקריאות בצורה סינכרונית, התהליך היה נראה כך:

<img src="/Lesson-5-From-LLM-To-Agent/assets/image-03.png" alt="image-03.png" width="475" height="301" />


כל בקשה הייתה מחכה לסיום של הקודמת.

אבל עם asyncio.gather, זה נראה יותר כך:

<img src="/Lesson-5-From-LLM-To-Agent/assets/image-04.png" alt="image-04.png" width="549" height="352" />


חמש קריאות שיוצאות כמעט יחד, ומחזירות תשובות בזמנים שונים.

## למה זה חשוב במערכות AI אמיתיות

בדוגמה שלנו יש רק חמש שאלות קצרות. אבל במערכות אמיתיות async הופך להיות קריטי.

למשל:

Agent יכול לקרוא לכמה APIs במקביל.

מערכת יכולה לשלוח כמה prompts שונים למודל.

שרת FastAPI יכול לטפל בכמה משתמשים בו זמנית.

אפשר להריץ summarization, classification ו-extraction יחד.

או לבצע כמה צעדים במקביל במקום אחד אחרי השני.

במערכות כאלה, אם כל פעולה תחכה לסיום הפעולה הקודמת, המערכת תהיה איטית מאוד.

לכן async הוא לא “טריק של Python”, אלא כלי חשוב לבניית מערכות AI יעילות.



## הדפסת התוצאות

בסוף הקובץ מופיע:

```python
for prompt, result in zip(PROMPTS, results):
    print(f"Prompt: {prompt}")
    print(f"Response: {result}")
    print("-" * 40)
```

אחרי שכל הקריאות הסתיימו, results מכיל את כל התשובות.

zip מחבר בין כל prompt לבין התוצאה המתאימה לו, והקוד מדפיס אותן בצורה מסודרת.

חשוב להבין: למרות שהתשובות חזרו בזמנים שונים, asyncio.gather שומר על סדר התוצאות לפי סדר המשימות שנשלחו.

**מה הפרק הזה מוסיף לשיעור**

בפרק הקודם ראינו איך לבצע קריאה אסינכרונית אחת למודל.

בפרק הזה מתחילים לראות את היתרון האמיתי של async: לא רק “להמתין בצורה אחרת”, אלא לאפשר להרבה פעולות להתקדם במקביל.

זהו שלב חשוב בדרך ל-Agents ולמערכות מורכבות יותר. ברגע שמערכת מתחילה לעבוד מול כמה מודלים, כמה שירותים או כמה משתמשים, async הופך להיות כמעט הכרחי.

והנקודה החשובה ביותר היא ש-async אינו רק תחביר. הוא דרך לחשוב על מערכות שמבלות חלק גדול מהזמן שלהן בהמתנה לשירותים חיצוניים. במקום לבזבז את זמן ההמתנה הזה, אפשר לנצל אותו כדי לקדם פעולות אחרות.

במילים אחרות: async מאפשר למערכת להישאר פעילה גם בזמן שהיא מחכה.


