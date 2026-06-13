# בניית RAG Chatbot

אחרי שבנינו את בסיס ה-RAG ושמרנו את המסמכים בתוך Vector Store, אפשר לעבור לשלב הבא: להשתמש במאגר הזה כדי לענות לשאלות של משתמשים.

בשלב הזה המערכת כבר לא רק מכינה מידע מראש. היא מקבלת שאלה, מחפשת את הקטעים הרלוונטיים, מכניסה אותם ל-context, ושולחת אותם ל-LLM יחד עם השאלה. כך הצ’אטבוט יכול לענות על בסיס מידע שנשלף מהמסמכים, ולא רק לפי הידע הכללי של המודל.

הקובץ המרכזי בחלק הזה הוא:

```bash
rag_chatbot.py
```

## מה אנחנו בונים

אנחנו בונים צ’אטבוט RAG פשוט. המשתמש כותב שאלה, והמערכת מחפשת ב-Vector Store את ה-chunks שהכי רלוונטיים לשאלה הזאת. לאחר מכן היא מחברת את ה-chunks האלה ל-context, ושולחת ל-LLM גם את השאלה וגם את המידע שנשלף.

הזרימה הכללית נראית כך:

User question 
 ↓ 
Retrieve relevant chunks 
 ↓ 
Build context 
 ↓ 
Send context + question to LLM 
 ↓ 
Return answer

הנקודה החשובה היא שה-LLM לא מקבל רק שאלה. הוא מקבל גם חומר עזר מתוך המסמכים. זה מה שהופך את התשובה למבוססת יותר.

לדוגמה, אם המשתמש שואל:

```bash
What does the document say about ChromaDB?
```

המערכת לא אמורה לענות מהידע הכללי של המודל. היא צריכה קודם לחפש ב-Vector Store קטעים שמדברים על ChromaDB, ואז להעביר אותם ל-LLM.

אפשר לחשוב על זה כך:

```bash
Question:
What does the document say about ChromaDB?

Retrieved context:
ChromaDB is an open-source embedding database...

LLM task:
Answer the question using the retrieved context.
```

במערכת כזאת, ה-LLM עדיין עושה עבודה חשובה: הוא מנסח את התשובה, מסביר את המידע, ומחבר בין השאלה לבין ה-context. אבל מקור הידע המרכזי הוא לא הזיכרון הפנימי של המודל, אלא המידע שנשלף מהמאגר.

זה ההבדל המרכזי בין Chatbot רגיל לבין RAG Chatbot. Chatbot רגיל עונה בעיקר מתוך המודל. RAG Chatbot קודם מחפש מידע רלוונטי, ורק אחר כך נותן למודל לענות.

## טעינת ה-Vector Store

הצ’אטבוט לא בונה את מאגר ה-RAG מחדש בכל הרצה. זה חשוב, כי בניית המאגר היא שלב הכנה: טעינת מסמכים, חלוקה ל-chunks, יצירת embeddings ושמירה ב-ChromaDB. אין סיבה לבצע את כל זה שוב בכל פעם שהמשתמש רוצה לשאול שאלה.

במקום לבנות מחדש, הצ’אטבוט טוען את המאגר שכבר נשמר בדיסק.

ב-rag_chatbot.py זה נעשה כך:

```python
vectorstore = load_vectorstore()
```

הפונקציה load_vectorstore מגיעה מהקובץ שבו בנינו את בסיס ה-RAG:

```python
from build_rag_db import load_vectorstore
```

המשמעות היא שיש הפרדה ברורה בין שני שלבים:

```python
build_rag_db.py  →  builds and saves the vector store
rag_chatbot.py   →  loads and uses the vector store
```

זו הפרדה חשובה בתכנון. קובץ אחד אחראי על הכנת המאגר, וקובץ אחר אחראי על השימוש בו בזמן השיחה.

אם המאגר לא קיים, הצ’אטבוט לא יכול לשלוף מידע. לכן סדר העבודה הנכון הוא קודם להריץ:

```bash
python build_rag_db.py
```

ורק אחר כך:

```bash
python rag_chatbot.py
```

כך הצ’אטבוט מתחיל את העבודה שלו כאשר כבר יש לו זיכרון חיצוני מוכן. בשלב הבא הוא יעטוף את ה-Vector Store ב-retriever, כדי לאפשר חיפוש של chunks רלוונטיים לפי שאלת המשתמש.

## בניית Retriever

אחרי שטענו את ה-Vector Store, צריך להפוך אותו לרכיב שיודע לקבל שאלה ולהחזיר את ה-chunks הרלוונטיים ביותר. הרכיב הזה נקרא retriever.

אפשר לחשוב על retriever כמו מנגנון חיפוש מעל ה-Vector Store. הוא לא מנסח תשובה, ולא מחליף את ה-LLM. התפקיד שלו הוא למצוא את קטעי הטקסט שהכי מתאימים לשאלה של המשתמש.

ב-rag_chatbot.py ה-retriever נבנה כך:

```bash
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
```

המשמעות של k=4 היא שבכל שאלה המערכת תחזיר עד ארבעה chunks רלוונטיים.

לדוגמה, אם המשתמש שואל:

```bash
What does the document say about ChromaDB?
```

ה-retriever יחפש ב-Vector Store את ארבעת הקטעים הקרובים ביותר במשמעות לשאלה הזאת.

למה לא להחזיר את כל המסמכים?

כי המטרה של RAG היא להביא למודל רק את המידע הרלוונטי. אם נשלח ל-LLM יותר מדי טקסט, הוא עלול להתבלבל, להתמקד בפרטים לא חשובים, או לבזבז מקום בחלון ההקשר.

מצד שני, אם נחזיר מעט מדי chunks, ייתכן שחסר מידע חשוב. לכן k הוא פרמטר שצריך לכוון לפי סוג המסמכים, אורך ה-chunks ואופי השאלות.

במערכת קטנה, k=4 הוא ערך סביר להתחלה. הוא נותן למודל כמה קטעים לעבוד איתם, בלי להציף אותו ביותר מדי context.

## בניית Prompt

אחרי שה-retriever מחזיר chunks רלוונטיים, צריך להעביר אותם ל-LLM בצורה מסודרת. כאן נכנס ה-Prompt.

ב-RAG Chatbot, ה-Prompt לא כולל רק את השאלה של המשתמש. הוא כולל כמה חלקים:

- הנחיות מערכת.

- context שנשלף מהמסמכים.

- היסטוריית שיחה.

- השאלה הנוכחית.

הרעיון הוא לתת למודל את כל מה שהוא צריך כדי לענות בצורה מבוססת.

דוגמה למבנה פשוט:

```python
System:
Answer based on the following context.
If the context does not contain relevant information, say so.

Context:
{context}

Chat history:
{chat_history}

User question:
{question}
```

החלק החשוב ביותר כאן הוא ה-context. זה המידע שה-retriever שלף מה-Vector Store. בלי ה-context, המודל עלול לענות מהידע הכללי שלו. עם context מתאים, אפשר לכוון אותו לענות לפי המסמכים.

גם ההנחיות חשובות. למשל, אם נגדיר:

```bash
If the context does not contain relevant information, say so.
```

אנחנו מלמדים את המערכת לא להמציא תשובה כאשר אין לה בסיס מספיק.

היסטוריית השיחה עוזרת בשאלות המשך. לדוגמה, אם המשתמש שאל קודם על ChromaDB, ואז שואל:

```bash
How is it used in RAG?
```

המילה it מתייחסת כנראה ל-ChromaDB. בלי היסטוריית שיחה, המודל עלול לא להבין למה המשתמש מתכוון.

Prompt טוב ב-RAG הוא לא Prompt ארוך ככל האפשר. הוא Prompt שמכניס למודל את המידע הנכון, בסדר נכון, עם הנחיות ברורות. המטרה היא לא להציף את המודל, אלא לתת לו בסיס מספיק כדי לענות בצורה מדויקת.

## שילוב היסטוריית שיחה

בצ’אטבוט רגיל, המשתמש לא תמיד שואל שאלה מלאה בכל פעם. הרבה פעמים הוא שואל שאלת המשך שמבוססת על מה שכבר נאמר.

לדוגמה:

```bash
What does the document say about ChromaDB?
```

ואחר כך:

```bash
How is it different from a regular database?
```

השאלה השנייה לא מזכירה במפורש את ChromaDB, אבל מתוך ההקשר ברור שהמשתמש עדיין מדבר עליו. כדי שהמערכת תבין את זה, צריך לשלב היסטוריית שיחה.

ב-rag_chatbot.py ההיסטוריה נשמרת ברשימה פשוטה:

```python
chat_history: list = []
```

בכל פעם שהמשתמש שואל שאלה ומתקבלת תשובה, הקוד מוסיף את שתיהן להיסטוריה:

```python
chat_history.append({"role": "user", "content": user_input})
chat_history.append({"role": "assistant", "content": answer})
```

לפני הקריאה למודל, הקוד לוקח רק את ההודעות האחרונות:

```python
for msg in chat_history[-10:]:
```

זו החלטה חשובה. לא תמיד כדאי לשלוח את כל השיחה למודל. אם השיחה ארוכה מדי, היא עלולה לתפוס יותר מדי מקום בחלון ההקשר ולהכניס מידע לא רלוונטי.

לאחר מכן ההודעות מומרות לפורמט שמתאים ל-LangChain:

```python
if msg["role"] == "user":
    messages_for_prompt.append(HumanMessage(content=msg["content"]))
else:
    messages_for_prompt.append(AIMessage(content=msg["content"]))
```

כך ה-LLM מקבל לא רק את השאלה הנוכחית, אלא גם חלק מהשיחה שקדמה לה.

היסטוריית שיחה היא שימושית, אבל צריך להשתמש בה בזהירות. היא עוזרת להבין שאלות המשך, אבל אם מכניסים יותר מדי היסטוריה, המודל עלול לקבל context עמוס ומבלבל. לכן בפרויקט הזה נשלחות רק ההודעות האחרונות, כדי לשמור על איזון בין רצף שיחה לבין בהירות.

## הרכבת Chain

אחרי שיש לנו retriever, prompt, היסטוריית שיחה ו-LLM, צריך לחבר את כל הרכיבים לזרימה אחת. ב-LangChain הזרימה הזאת נקראת chain.

המטרה של ה-chain היא לקחת קלט מהמשתמש ולהעביר אותו דרך כמה שלבים מסודרים:

question 
 ↓ 
retrieve context 
 ↓ 
build prompt 
 ↓ 
call LLM 
 ↓ 
parse output

כל שלב מקבל משהו, משנה אותו או מוסיף לו מידע, ומעביר אותו לשלב הבא.

ב-rag_chatbot.py יש פונקציה שבונה את ה-chain:

```python
def build_rag_chain(vectorstore, llm):
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
```

בתוך הפונקציה קודם יוצרים retriever מתוך ה-Vector Store. לאחר מכן מגדירים פונקציה פנימית שתפקידה לשלוף context לפי השאלה:

```python
def get_context(inputs):
    docs = retriever.invoke(inputs["question"])
    return "\n\n".join(doc.page_content for doc in docs)
```

הפונקציה get_context מקבלת את הקלט של המשתמש, שולחת את השאלה ל-retriever, מקבלת בחזרה מסמכים רלוונטיים, ומחברת את התוכן שלהם לטקסט אחד.

כלומר, אם ה-retriever החזיר ארבעה chunks, הם יהפכו ל-context אחד שהמודל יקבל בתוך ה-prompt.

לאחר מכן מרכיבים את ה-chain עצמו:

```python
chain = (
    RunnablePassthrough.assign(context=get_context)
    | prompt
    | llm
    | StrOutputParser()
)
```

השורה הזאת נראית קצרה, אבל היא מייצגת את כל תהליך ה-RAG.

RunnablePassthrough.assign(context=get_context) שומר את הקלט המקורי, ובמקביל מוסיף אליו שדה חדש בשם context. השדה הזה נוצר על ידי הפונקציה get_context.

לאחר מכן הקלט עובר אל ה-prompt. בשלב הזה השאלה, ה-context והיסטוריית השיחה נכנסים לתבנית אחת מסודרת.

אחר כך ה-prompt נשלח ל-llm, שמייצר תשובה.

בסוף, StrOutputParser מחלץ את הטקסט של התשובה ומחזיר אותו כמחרוזת רגילה.

אפשר לראות את זה כך:

```python
Input:
{
  question: "What is ChromaDB?",
  chat_history: [...]
}

After retrieval:
{
  question: "What is ChromaDB?",
  chat_history: [...],
  context: "Relevant chunks from the vector store..."
}

After LLM:
"ChromaDB is..."
```

היתרון של chain הוא שהוא הופך כמה פעולות נפרדות לתהליך אחד ברור. במקום לכתוב בכל פעם קוד שמחפש, בונה prompt, מפעיל מודל ומעבד תשובה, אנחנו מגדירים זרימה אחת שאפשר להפעיל שוב ושוב על כל שאלה חדשה.

## הרצת צ’אט בלולאה

אחרי שה-chain מוכן, צריך לאפשר למשתמש לדבר עם הצ’אטבוט בצורה רציפה. לשם כך משתמשים בלולאת command-line פשוטה: בכל סיבוב המשתמש כותב שאלה, המערכת מפעילה את ה-chain, מחזירה תשובה, ואז מחכה לשאלה הבאה.

הרעיון הכללי נראה כך:

wait for user input 
 ↓ 
check if user wants to exit 
 ↓ 
send question to chain 
 ↓ 
print answer 
 ↓ 
save question and answer in chat history 
 ↓ 
wait for next input

ב-rag_chatbot.py הלולאה מקבלת קלט מהמשתמש:

```python
user_input = input("\nYou: ").strip()
```

הקריאה ל-strip() מסירה רווחים מיותרים בתחילת ובסוף הקלט. זה שימושי כי לפעמים המשתמש לוחץ רווח בטעות, או שולח שורה כמעט ריקה.

לאחר מכן הקוד בודק אם המשתמש רוצה לצאת:

```python
if user_input.lower() in {"quit", "exit"}:
    break
```

זו דרך פשוטה לעצור את הצ’אט בלי לסגור בכוח את התוכנית. אם המשתמש מקליד quit או exit, הלולאה נעצרת.

אם המשתמש כתב שאלה רגילה, מפעילים את ה-chain:

```python
answer = rag_chain.invoke(
    {
        "question": user_input,
        "chat_history": messages_for_prompt,
    }
)
```

כאן נשלחים שני דברים חשובים:

question היא השאלה הנוכחית של המשתמש.

chat_history היא היסטוריית השיחה שהוכנה לפני הקריאה למודל, כדי שהמערכת תוכל להבין שאלות המשך.

אחרי שה-chain מחזיר תשובה, מדפיסים אותה למסך:

```python
print(f"\nAssistant: {answer}")
```

לבסוף, שומרים את השאלה והתשובה בהיסטוריה:

```python
chat_history.append({"role": "user", "content": user_input})
chat_history.append({"role": "assistant", "content": answer})
```

השמירה הזאת חשובה לשאלות הבאות. אם המשתמש ישאל בהמשך “ומה לגבי זה?”, המערכת תוכל להסתמך על חלק מהשיחה הקודמת כדי להבין למה הוא מתכוון.

לולאת הצ’אט היא פשוטה, אבל היא מחברת את כל הרכיבים למערכת שעובדת בפועל: המשתמש שואל, ה-retriever שולף context, ה-LLM מנסח תשובה, וההיסטוריה נשמרת להמשך השיחה.

## טעויות נפוצות

בבניית RAG Chatbot יש כמה טעויות שחוזרות הרבה. חלק מהטעויות הן טכניות, וחלק קשורות לציפיות לא נכונות מהמערכת.

טעות ראשונה היא לא להגדיר API key. במקרה שלנו, הצ’אטבוט משתמש במודל דרך Anthropic, ולכן הוא צריך למצוא את המשתנה:

```python
ANTHROPIC_API_KEY
```

אם המשתנה הזה לא מוגדר, אין למערכת דרך לקרוא ל-LLM. לכן בתחילת הריצה חשוב לבדוק שהמפתח קיים, ולהחזיר הודעה ברורה אם הוא חסר.

טעות שנייה היא להריץ את rag_chatbot.py לפני שבונים את המאגר. הצ’אטבוט לא יוצר את ה-Vector Store בעצמו. הוא מצפה למצוא מאגר קיים בתיקיית chroma_db.

הסדר הנכון הוא:

```bash
python build_rag_db.py
python rag_chatbot.py
```

אם מדלגים על השלב הראשון, ה-retriever לא יוכל לשלוף chunks, כי פשוט אין לו מאגר לחפש בו.

טעות שלישית היא לצפות ש-RAG יענה על כל שאלה. RAG לא הופך את המודל לכל-יודע. הוא רק מאפשר למודל לענות על בסיס מידע שנמצא במסמכים. אם המידע לא נמצא ב-context שנשלף, המערכת צריכה לומר שאין לה מספיק מידע, ולא להמציא תשובה.

לדוגמה, אם המסמכים עוסקים ב-ChromaDB והמשתמש שואל:

```bash
What is the weather in London today?
```

זו לא שאלה שמתאימה למאגר. במקרה כזה תשובה טובה תהיה להסביר שה-context הקיים לא מכיל מידע רלוונטי.

טעות רביעית היא להכניס יותר מדי context. לפעמים נראה שכדאי לשלוח למודל כמה שיותר chunks, כדי “שיהיה לו יותר מידע”. בפועל, יותר מדי מידע יכול לפגוע באיכות התשובה. המודל עלול לקבל טקסט ארוך, מעורבב ולא ממוקד, ולהתקשות להבין מה באמת חשוב.

לכן הפרמטר k חשוב. הוא קובע כמה chunks יוחזרו מה-retriever. בפרויקט שלנו הערך הוא:

```python
search_kwargs={"k": 4}
```

זה איזון טוב להתחלה: מספיק מידע כדי לענות, אבל לא יותר מדי.

טעות חמישית היא לא להסביר למשתמש כאשר אין מידע רלוונטי. אם המערכת לא מצאה context מתאים, עדיף לומר זאת בצורה ברורה. תשובה כמו “אין לי מספיק מידע במסמכים כדי לענות על זה” עדיפה בהרבה על תשובה שנשמעת בטוחה אבל אינה מבוססת.

במערכת RAG טובה, האיכות לא נמדדת רק לפי היכולת לענות. היא נמדדת גם לפי היכולת לדעת מתי לא לענות. זו נקודה חשובה במיוחד כשבונים מערכות שמיועדות לשימוש אמיתי.


