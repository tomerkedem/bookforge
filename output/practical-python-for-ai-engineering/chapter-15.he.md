# פרק 15 – אסינכרוניות בסיסית וממשקי רשת

## למה async חשוב בפרויקטי AI

עולם ה-AI בנוי על **תקשורת רשת**. כל קריאה למודל. בין אם זה OpenAI, Hugging Face או שירות פנימי היא קריאה **חיצונית**, ולכן איטית יחסית לפעולות CPU. כאשר אתה שולח עשרות או מאות בקשות במקביל (למודלי שפה, שירותי Embedding, APIs חיצוניים), הגישה הסינכרונית הקלאסית פשוט לא מספיקה. הלולאה הראשית נתקעת, וכל משימה מחכה לסיום הקודמת.

כאן נכנסת **אסינכרוניות (async/await)** - מנגנון שמאפשר לפייתון להריץ משימות במקביל לוגית (לא פיזית),

כלומר להמשיך לעבד משימה אחת בזמן שאחרת ממתינה לתגובה מהשרת.

התוצאה: שיפור מהירויות פי עשרות, בלי צורך בתהליכים נפרדים או תורים חיצוניים. במערכות AI אמיתיות, Async הוא כבר לא "אופטימיזציה", אלא **סטנדרט תשתיתי.**


## async/await: הבסיס

התחביר של אסינכרוניות בפייתון פשוט: מגדירים פונקציה אסינכרונית בעזרת async def, וממתינים לתוצאה של פעולה אסינכרונית בעזרת await.

```python
import asyncio
async def fetch_data():
 print("Starting data request")
 await asyncio.sleep(2) # Simulate network delay
 print("Data received")
 return {"status": "ok"}
async def main():
 result = await fetch_data()
 print(result)
asyncio.run(main())
# Output:
# Starting data request
# (2 second pause)
# Data received
# {'status': 'ok'}




await משחרר את השליטה ללולאת האירועים בזמן שהפונקציה "מחכה" כך תהליכים אחרים יכולים לרוץ במקביל. זהו ההבדל המהותי בין **ריבוי תהליכים (Threads) **ל-**אסינכרוניות**:
Async הוא **לא ריבוי מעבדים**, אלא ניהול חכם של זמני המתנה.

## לולאת האירועים: asyncio.run ו-gather

בכל תוכנית אסינכרונית קיימת **לולאת אירועים** (Event Loop)
שאחראית על תזמון והרצת המשימות. פייתון מספקת ממשק פשוט לניהול הלולאה הזו.

```python
import asyncio
async def task(n):
 await asyncio.sleep(1)
 return f"Task {n} done"
async def main():
 # asyncio.gather runs multiple coroutines concurrently
 results = await asyncio.gather(
 task(1),
 task(2),
 task(3)
 )
 print(results)
asyncio.run(main())
# Output:
# ['Task 1 done', 'Task 2 done', 'Task 3 done']
# (Total execution time: ~1 second, not 3 seconds)




()asyncio.gather מריץ כמה פונקציות אסינכרוניות במקביל ומחזיר את התוצאות ברגע שכולן הסתיימו.

בדוגמה שראינו שלוש המשימות רצות יחד, לא זו אחר זו.

**למה זה חשוב?**

• ב- pipelines– בפיתוח AI אתה שולח עשרות בקשות ל-API של מודל.

• בלי gather – כל קריאה תחכה לסיום הקודמת.

• עם gather – כולן נשלחות ונאספות במקביל.

**הגבלת מקביליות בעזרת asyncio.Semaphore**

כאשר משגרים עשרות בקשות במקביל יש צורך להגביל את מספר המשימות הפעילות כדי לא להציף שרתים או לעבור מגבלות קצב. asyncio.Semaphore קובע תקרה של משימות פעילות בו זמנית.

אם התקרה הושגה משימות נוספות ממתינות עד שאחת מסתיימת. כך שומרים על יציבות ובקרה תוך שמירה על רמת מקביליות גבוהה.

**דוגמה:**

```python
import asyncio
```
```python
# A semaphore limits the number of concurrent executions to 10


`sem = asyncio.Semaphore(10)


`async def guarded(coro):

` """

` Wraps a coroutine to ensure no more than 10 instances 

` of this block run simultaneously.

` """

` async with sem:

` return await coro





בדוגמה זו רק עשר משימות ירוצו במקביל. כאשר אחת מסתיימת משימה ממתינה נכנסת תחתיה.

## aiohttp: קריאות רשת אסינכרוניות

הספרייה **aiohttp** מספקת ממשק אסינכרוני לביצוע בקשות HTTP. היא מחליפה את requests בסביבות שבהן נדרשת ריבוי קריאות במקביל.

```python
import aiohttp
import asyncio
async def fetch(session, url):
 async with session.get(url) as response:
 return await response.text()
async def main():
 # ClientSession should be created within a coroutine
 async with aiohttp.ClientSession() as session:
 urls = ["https://example.com"] * 5
 # Create a list of coroutine objects
 tasks = [fetch(session, u) for u in urls]
 # Execute all tasks concurrently
 results = await asyncio.gather(*tasks)
 print(f"{len(results)} responses received")
asyncio.run(main())
# Output:
# 5 responses received




כך ניתן לבצע מאות קריאות רשת בו-זמנית תכונה קריטית בעבודה מול APIs של AI שבהם זמן תגובה ממוצע הוא שניות, לא מילישניות.

## Timeouts ו-Retry: הגנה על קריאות API

בעבודה עם APIs של AI, במיוחד כאלה שמבוזרים או חיצוניים 
אין דבר בטוח יותר מהבלתי צפוי. קריאה אחת עלולה לקחת שנייה, ואחרת, חמש. שרת עלול להחזיר שגיאת 429 (Rate Limit) או פשוט להפסיק להגיב. אם לא תנהל את זה נכון, תוכנית אסינכרונית יכולה **להיתקע לנצח**. לכן חובה להגדיר **Timeouts** ו-**Retry** חכמים לכל קריאה רשתית.

**Timeout – הגבלת זמן לכל בקשה **ב-aiohttp ניתן להגדיר Timeout ישירות על ה-session או על כל בקשה בנפרד:

```python
import aiohttp
import asyncio
async def fetch(url):
 timeout = aiohttp.ClientTimeout(total=3)
```
```python
 # The session should ideally be created outside the loop for performance,


` # but here it is used to demonstrate timeout scope.

```typescript
 async with aiohttp.ClientSession(timeout=timeout) as session:


` async with session.get(url) as resp:

```python
 # We must await the response text inside the context manager


` # or before the session/connection closes.

` return await resp.text()


`async def main():

` try:

```python
 # This will trigger a TimeoutError because the URL delays for 5 seconds


` # while our timeout limit is set to 3 seconds.

` result = await fetch("https://httpbin.org/delay/5")

` print(result)

 except (asyncio.TimeoutError, aiohttp.ClientConnectorError):

` print("Timeout: request stopped after 3 seconds")


`if __name__ == "__main__":

` asyncio.run(main())




פייתון תזרוק TimeoutError אם השרת לא הגיב בזמן,
וכך הלולאה ממשיכה לרוץ במקום להיתקע.

**Retry – ניסיון חוזר אוטומטי**

Timeout פותר תקיעות, אבל לא שגיאות חולפות.
לכן מוסיפים שכבת Retry, ניסיון נוסף לאחר כשל זמני.

```python
import aiohttp
import asyncio
async def fetch_with_retry(url, retries=3):
 for attempt in range(1, retries + 1):
```
 try:
 async with aiohttp.ClientSession() as session:
 async with session.get(url) as resp:
 return await resp.text()
 except Exception as e:
 print(f"Attempt {attempt} failed: {e}")
 await asyncio.sleep(1)
 raise RuntimeError("Request failed after all attempts")
asyncio.run(fetch_with_retry("https://example.com"))



גישה זו מאפשרת יציבות: גם אם קריאה אחת נכשלה, המערכת לא קורסת אלא מנסה שוב, בדיוק כפי שמצופה ממערכת AI ב-production.



**שילוב שני המנגנונים**

בפרויקט אמיתי, מגדירים Timeout ו-Retry יחד כחלק משכבת תקשורת אחידה.
לדוגמה, מודול בשם api_client.py שדרכו כל השירותים מבצעים קריאות חיצוניות.
וכך כל קריאה לרשת נהנית מהגנה אוטומטית.

## Cancellation: ביטול משימות אסינכרוניות

אחד היתרונות המשמעותיים של אסינכרוניות הוא היכולת לשלוט במשימות בזמן אמת.
בעולם ה-AI, זה שימושי במיוחד: ייתכן שמודל מאט, שהמשתמש לחץ "ביטול", או שהגיע מידע חדש שמייתר את הבקשה הקודמת.

כדי למנוע בזבוז משאבים.

צריך לדעת **איך לעצור משימה שרצה בלולאת האירועים.**

**משימה בודדת**

ב-asyncio ניתן לבטל כל משימה (Task) באמצעות ()cancel.

```python
import asyncio
async def slow_task():
 print("Starting task")
```
 try:
 await asyncio.sleep(5)
 print("Task completed successfully")
 except asyncio.CancelledError:
 print("Task was cancelled")
async def main():
 task = asyncio.create_task(slow_task())
 await asyncio.sleep(2)
 task.cancel()
 await task
asyncio.run(main())



פלט:

```Plaintext

`Starting task

`Task was cancelled




הביטול לא "הורג" את המשימה מיידית, אלא מעלה חריגת CancelledError בתוך הפונקציה, מה שמאפשר ניקוי מסודר (cleanup) לפני סיום.



**ביטול קבוצת משימות**

כאשר מריצים כמה משימות במקביל (למשל בקשות ל-API),
ניתן לבטל את כולן בצורה מרוכזת.

```python
import asyncio
async def fetch(n):
```
 try:
 print(f"Starting{n}")
 await asyncio.sleep(3)
 print(f"Finished{n}")
 except asyncio.CancelledError:
 print(f"Cancelled{n}")
async def main():
```python
 tasks = [asyncio.create_task(fetch(i)) for i in range(3)]


` await asyncio.sleep(1)

` for t in tasks:

` t.cancel()

` await asyncio.gather(*tasks, return_exceptions=True)


`asyncio.run(main())


כך ניתן לעצור את כל המשימות כשהמערכת מגלה מצב חריג. למשל כשנפלה תקשורת עם שרת חיצוני או התקבל

stop signal ממנוע התזמון.

**שימוש בעולם ה-AI**

Cancellation חשוב במיוחד כשעובדים עם APIs יקרים או איטיים:

• המשתמש ביטל שאלה בממשק שיחה (Chat UI).

• אחת מבקשות ה-Embedding כבר לא נחוצה.

• קריאת RAG ארוכה מדי ומחליטים להחזיר תשובה חלקית.

במקום לחכות לסיום הקריאה, ניתן לעצור אותה מיידית ולשחרר משאבים.


## דוגמה מרכזית: שליחת בקשות רבות ל API במקביל

לאחר שהבנו כיצד להריץ משימות אסינכרוניות במקביל באמצעות asyncio.gather וכיצד להגביל את מספרן בעזרת Semaphore, נוכל לבנות דוגמה שלמה שמדגימה את כל עקרונות העבודה עם APIs בעולם ה-AI.

בפרויקטים אמיתיים לעיבוד שפה טבעית או לאימון מודלים, נדרשים לעיתים לשלוח עשרות ואף מאות בקשות למודל חיצוני

למשל, ליצירת Embeddings, לסיווג טקסטים או לשאילתות RAG.
כדי לעשות זאת בצורה יציבה נשתמש בארבעה עקרונות בסיסיים:

1. **מקביליות מבוקרת** – בעזרת Semaphore כדי למנוע הצפה של השרת.

2. **Timeout** הגבלת זמן תגובה לכל בקשה.

3. **Retry ** ניסיון חוזר במקרים של כשל זמני.

4. **ביטול משימות** עצירה נקייה של כל הקריאות במקרה של ביטול כולל.

בדוגמה הבאה נבנה מימוש קצר המדגים את כל אלה יחד

כך נראה שלד טיפוסי שבו משתמשים בפרויקטי AI המתבססים על מודלים חיצוניים כמו OpenAI או Gemini.

```python
import asyncio
import aiohttp
API_URL = "https://httpbin.org/delay/1"
# Simulates server delay
class ApiError(Exception):
```
 pass
```python
async def fetch_one(session: aiohttp.ClientSession, url: str, *, timeout_s: float) -> str:


` """Single request with timeout and error handling."""

` try:

```typescript
 async with session.get(url, timeout=timeout_s) as resp:



` if resp.status >= 400:


` raise ApiError(f"Bad status {resp.status}")


` return await resp.text()

` except asyncio.TimeoutError:

` raise ApiError("Timeout")

` except aiohttp.ClientError as e:

` raise ApiError(f"Network error {e}")


```python
async def fetch_with_retry(session, url, *, timeout_s: float, retries: int = 3, backoff_s: float = 0.5) -> str:


` """Retry logic for temporary failures."""

` for attempt in range(1, retries + 1):

` try:


```python
 return await fetch_one(session, url, timeout_s=timeout_s)


` except ApiError as e:


` if attempt == retries:


` raise


` await asyncio.sleep(backoff_s * attempt)


```python
async def fetch_many(urls: list[str], *, concurrency: int = 10, timeout_s: float = 3.0) -> list[str]:


 """Parallel requests with rate control using semaphore and smart cancellation."""

` sem = asyncio.Semaphore(concurrency)


` async with aiohttp.ClientSession() as session:

` async def guarded(url: str) -> str:


 async with sem: # Only a limited number of tasks run at the same time


```python
 return await fetch_with_retry(session, url, timeout_s=timeout_s)



```python
 tasks = [asyncio.create_task(guarded(u)) for u in urls]



` try:


```javascript
 results = await asyncio.gather(*tasks, return_exceptions=True)


` except asyncio.CancelledError:


` for t in tasks:


` t.cancel()


` raise


```python
 errors = [r for r in results if isinstance(r, Exception)]


` if errors:

```python
 raise ApiError(f"Failure in part of the requests {len(errors)} of {len(results)}")



` return results


`async def main():

` urls = [API_URL for _ in range(50)]

` try:

```javascript
 texts = await fetch_many(urls, concurrency=8, timeout_s=2.5)


` print(f"{len(texts)} successful responses received")

` except ApiError as e:

` print(f"Overall error {e}")


`if __name__ == "__main__":

` asyncio.run(main())




כך נראית מערכת אסינכרונית מלאה של- APIל-AI: הקריאות נשלחות במקביל אך בעומס מבוקר, כל אחת מוגנת ב-Timeout, וכשמתרחשת תקלה זמנית, מתבצע ניסיון חוזר אוטומטי.

במקרה של ביטול כולל (למשל, המשתמש עצר את הבקשה בממשק), כל המשימות נעצרות באופן נקי, מבלי להשאיר קריאות "יתומות" פתוחות.

גישה זו מבטיחה מערכת מהירה, יציבה וניתנת לניטור.

בדיוק מה שנדרש בעבודה עם שירותי AI חיצוניים בקנה מידה אמיתי.

## Best Practices: אסינכרוניות ל-I/O בלבד וטיפול חכם בשגיאות

אסינכרוניות נועדה לפעולות של קלט-פלט, רשת, קבצים, בסיסי נתונים.
היא לא מיועדת לחישוב כבד.


אם אתה צריך לעבד נתונים או להריץ אלגוריתם ארוך, הרץ אותו בתהליך נפרד בעזרת ProcessPoolExecutor או ספרייה ייעודית.
כך לולאת האירועים תישאר פנויה לניהול רשת ולא תיתקע על חישוב. כשעובדים מול שירותי AI, כדאי לרכז את כל הקריאות החיצוניות בקובץ אחד, לדוגמה api_client.py. זו “שכבת תקשורת” אחת שמנהלת Timeout, Retry ולוגים אחידים.

ברגע שכל הקריאות עוברות דרך אותו שער. הרבה יותר קל לנטר, לבדוק ולשפר.

**עוד כלל חשוב:** אל תפתח ClientSession חדש בכל בקשה.
במקום זה, פתח Session אחד בתחילת העבודה ומחזר אותו לכל הבקשות. פתיחה וסגירה חוזרת מייצרת overhead מיותר ולעיתים גם דליפות משאבים.

```python
import aiohttp
timeout = aiohttp.ClientTimeout(total=5)
connector = aiohttp.TCPConnector(limit=20)
 # Limit the number of open connections
```
session = aiohttp.ClientSession(timeout=timeout, connector=connector)

`# Work with session here

`# await session.close()




כאשר מריצים משימות רבות במקביל, מומלץ להשתמש ב-asyncio.gather(..., return_exceptions=True).

כך גם אם חלק מהמשימות נכשלות, תקבל את כל התוצאות התקינות

ותוכל להחליט מה לעשות הלאה.

**לדוגמה**, לנסות שוב רק את אלו שנכשלו.

גם ביטול משימות צריך להיות נקי. ביטול מעלה את החריגה CancelledError, ולכן כדאי לעטוף את הקוד הקריטי ב-try ולוודא שסוגרים חיבורים או קבצים לפני שהפונקציה האסינכרונית מסתיימת.

מדיניות Timeout ו-Retry צריכה להיות שמרנית. קבע זמן תגובה קצר יחסית, מספר ניסיונות מוגבל, והמתנה מעט ארוכה יותר בכל ניסיון. כבד את כותרות ה-Rate Limit של ה-API והשהה בהתאם,
כדי למנוע חסימה או ענישה מהשרת.

בנוסף, חשוב לתעד כל בקשה בלוגים: מזהה, זמן תגובה, סטטוס, סיבת כשל.
במערכות AI מרובות קריאות, הלוגים הם כלי אבחון קריטי למציאת צווארי בקבוק.

לבסוף, הקפד לסגור את הכול.
סגור את ה-Session, בטל משימות תלויות, נקה חיבורים.
סגירה מסודרת היא לא המלצה.

זו הדרך היחידה לשמור על יציבות לאורך זמן.


## סיכום: למה async ו-aiohttp הם חובה בפרויקטי AI

בעולם של מערכות AI, כמעט כל שלב כולל **תקשורת רשת**

בקשות למודל שפה, שאילתות למנוע Embeddings, גישה ל-API של חיפוש או שירות אחזור. כל בקשה כזו אורכת שניות, לא מילישניות, וכשיש עשרות מהן בכל שלב, ביצוע סינכרוני פשוט לא עומד בקצב. כאן נכנס async.
במקום לחכות לכל בקשה שתסתיים, המערכת שולחת את כולן במקביל וממשיכה לעבוד בזמן שהתגובות חוזרות. וזהו ההבדל בין קוד איטי שחוסם את עצמו לבין מערכת יעילה שמנצלת כל רגע המתנה.

הספרייה aiohttp הופכת עיקרון זה לפרקטיקה:
היא מאפשרת לנהל אלפי חיבורים פתוחים בצורה קלה, לטפל ב-Timeout, לנסות שוב בקריסה זמנית, ולשמור על שליטה מלאה עם Cancellation ו-Semaphore.

השילוב של **async, gather, Semaphore**, ו-**Retry **הוא לא טריק של מתכנתים מתקדמים. זהו הסטנדרט. 
כל מערכת AI אמיתית. בין אם היא מנהלת קריאות ל-OpenAI, ל-Gemini או למנוע אחזור פנימי. חייבת להיות אסינכרונית כדי להישאר יציבה, מהירה ויעילה.

במילים פשוטות: בלי async, כל מערכת AI תהפוך לצוואר בקבוק.
עם async, היא הופכת לרשת חכמה של משימות שמדברות זו עם זו במקביל, חוסכות זמן, ומפיקות יותר תובנות בפחות משאבים.

