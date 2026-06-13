# בניית RAG Chatbot

אחרי שבנינו את בסיס ה-RAG בחלק הקודם, יש לנו עכשיו מאגר ידע מקומי שנשמר בתוך תיקיית chroma_db.

בחלק הזה נבנה את השלב הבא: צ’אטבוט שמסוגל להשתמש במאגר הזה כדי לענות על שאלות.

חשוב לזכור את ההפרדה:

<div dir="rtl">

| **קובץ** | **תפקיד** |
| --- | --- |
| **build_rag_db.py** | בונה את בסיס ה-RAG ושומר אותו לדיסק |
| **rag_chatbot.py** | טוען את בסיס ה-RAG ומשתמש בו כדי לענות לשאלות |

</div>

כלומר, rag_chatbot.py לא אמור לטעון מסמכים מחדש, לא לחלק אותם ל-chunks, ולא לבנות embeddings מחדש. את כל זה כבר עשינו בפרק הקודם.

הקובץ החדש רק משתמש במאגר הקיים.

## מה אנחנו בונים

אנחנו בונים RAG Chatbot פשוט שעובד דרך שורת הפקודה.

המשתמש יכתוב שאלה, והמערכת תבצע את השלבים הבאים:

```bash
User question
   ↓
Load existing Vector Store
   ↓
Retrieve relevant chunks
   ↓
Build context
   ↓
Send context + question to LLM
   ↓
Return answer
```

ההבדל המרכזי בין צ’אטבוט רגיל לבין RAG Chatbot הוא מקור הידע.

צ’אטבוט רגיל מקבל שאלה ומנסה לענות מתוך הידע של המודל.

RAG Chatbot קודם מחפש מידע רלוונטי במסמכים, ורק אחר כך שולח את המידע הזה למודל.

לדוגמה, אם המשתמש שואל:

```bash
What does the document say about ChromaDB?
```

המערכת לא אמורה לענות רק מהידע הכללי של ה-LLM. היא צריכה קודם לחפש בתוך ה-Vector Store קטעים שמדברים על ChromaDB.

לאחר מכן היא בונה context:

```bash
ChromaDB is a vector database.
It can store embeddings and search for similar text based on meaning.
```

ורק אז שולחת למודל את השאלה יחד עם ה-context.

אפשר לחשוב על זה כך:

```bash
Question:
What does the document say about ChromaDB?

Retrieved context:
Relevant chunks from the vector store

LLM task:
Answer the question using only the provided context
```

זו נקודה חשובה מאוד: ה-LLM עדיין מנסח את התשובה, אבל הוא לא אמור להמציא מקור ידע. הוא אמור להסתמך על ה-context שנשלף מתוך המסמכים.

בפרק הזה נבנה קובץ מלא בשם:

```bash
rag_chatbot.py
```

הקובץ הזה יכלול:

1. טעינת ה-Vector Store הקיים

2. יצירת retriever

3. בניית prompt עם context, history ושאלה

4. הרכבת chain

5. הרצת לולאת צ’אט ב-command-line

6. שמירת היסטוריית שיחה קצרה

7. טיפול בסיסי בשגיאות

בסוף הפרק נוכל להריץ:

```bash
python rag_chatbot.py
```

ולשאול שאלות על התוכן שנמצא ב-data/sample_docs.txt.

לפני שנכתוב את הקוד המלא, נוודא שהפרויקט שלנו כולל את הקבצים הדרושים.

## הקבצים שנשתמש בהם

לפני שנכתוב את rag_chatbot.py, נוודא שמבנה הפרויקט ברור.

בסיום חלק 11 כבר אמורים להיות לנו הקבצים והתיקיות הבאים:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  requirements.txt
  data/
    sample_docs.txt
  chroma_db/
```

הקובץ build_rag_db.py בנה את המאגר.

התיקייה data מכילה את מסמכי המקור.

התיקייה chroma_db מכילה את ה-Vector Store שנשמר לדיסק.

עכשיו נוסיף קובץ חדש:

```bash
rag_chatbot.py
```

לאחר ההוספה, מבנה הפרויקט יהיה:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  rag_chatbot.py
  requirements.txt
  data/
    sample_docs.txt
  chroma_db/
```

אפשר לחשוב על הפרויקט כך:

<div dir="rtl">

| **קובץ או תיקיי**ה | **תפקיד** |
| --- | --- |
| **requirements.txt** | הספריות שהפרויקט צריך |
| **data/sample_docs.txt** | מסמך הדוגמה שממנו נבנה המאגר |
| **build_rag_db.py** | בונה ושומר את בסיס ה-RAG |
| **chroma_db/** | המאגר המקומי שנוצר אחרי ההרצה |
| **rag_chatbot.py** | צ’אטבוט שטוען את המאגר ועונה על שאלות |

</div>

הנקודה החשובה היא שהקובץ החדש לא מתחיל מאפס.

הוא משתמש בפונקציה שכבר כתבנו בחלק הקודם:

```python
from build_rag_db import load_vectorstore
```

הפונקציה הזאת מחזירה לנו את ה-Vector Store הקיים מתוך chroma_db.

כלומר, במקום לכתוב שוב קוד שטוען מסמכים, מחלק ל-chunks ויוצר embeddings, אנחנו משתמשים בקוד שכבר בנינו.

זו הפרדה מקצועית יותר:

build_rag_db.py אחראי על הכנה ובנייה של המאגר 
 
rag_chatbot.py אחראי על שימוש במאגר בזמן שיחה

בפרויקטים אמיתיים ההפרדה הזאת חשובה מאוד. היא מאפשרת לנו לבנות את המאגר פעם אחת, ואז להשתמש בו שוב ושוב בלי לשלם בכל הרצה את מחיר הבנייה מחדש.

**עדכון requirements.txt**

כדי להפעיל את הצ’אטבוט, אנחנו צריכים גם ספרייה שמאפשרת לנו לקרוא ל-LLM.

בגרסה הזאת נשתמש ב-Anthropic דרך LangChain.

לכן הקובץ requirements.txt צריך לכלול גם:

```python
langchain-anthropic
```

הגרסה המלאה של requirements.txt בשלב הזה תהיה:

```python
langchain
langchain-chroma
langchain-community
langchain-anthropic
chromadb
sentence-transformers
```

אם הקובץ כבר קיים, פשוט נוסיף אליו את langchain-anthropic.

לאחר העדכון נריץ שוב:

```bash
pip install -r requirements.txt
```

גם אם חלק מהספריות כבר מותקנות, זה בסדר. pip ישלים את מה שחסר.

**משתנה סביבה עבור API key**

כדי שהצ’אטבוט יוכל לקרוא למודל של Anthropic, צריך להגדיר משתנה סביבה בשם:

```python
ANTHROPIC_API_KEY
```

ב-PowerShell אפשר להגדיר אותו כך:

```bash
$env:ANTHROPIC_API_KEY="your_api_key_here"
```

במקום your_api_key_here נשים את המפתח האמיתי.

חשוב לא להכניס API key ישירות לקובץ Python, ולא להעלות אותו ל-GitHub.

כלומר, לא עושים כך:

```python
api_key = "my-real-api-key"
```

במקום זה, הקוד יקרא את המפתח מתוך משתנה הסביבה.

כך הקוד נשאר בטוח יותר ומתאים להעלאה ל-GitHub.

בשלב הזה יש לנו:

1. בסיס RAG קיים בתיקיית chroma_db

2. requirements.txt מעודכן

3. API key שמוגדר כמשתנה סביבה

4. מקום מוכן לקובץ rag_chatbot.py

השלב הבא הוא לכתוב את הקובץ המלא rag_chatbot.py.

## כתיבת הקובץ rag_chatbot.py

עכשיו נכתוב את הקובץ המרכזי של החלק הזה: rag_chatbot.py

הקובץ הזה טוען את ה-Vector Store הקיים, בונה retriever, מחבר prompt ל-LLM, ומפעיל צ’אט פשוט דרך שורת הפקודה.

ניצור קובץ בשם rag_chatbot.py בתיקיית הפרויקט, ונכניס אליו את הקוד הבא.

**תוכן מלא לקובץ rag_chatbot.py**

```python
import os

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough

from build_rag_db import load_vectorstore


MODEL_NAME = "claude-haiku-4-5-20251001"
RETRIEVER_K = 4
MAX_HISTORY_MESSAGES = 10


def build_llm() -> ChatAnthropic:
    """
    Build the LLM client.

    The API key is read from the ANTHROPIC_API_KEY environment variable.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise EnvironmentError(
            "ANTHROPIC_API_KEY is not set. "
            "Please set it before running rag_chatbot.py."
        )

    return ChatAnthropic(
        model=MODEL_NAME,
        temperature=0,
    )


def build_rag_chain(vectorstore, llm):
    """
    Build a RAG chain that retrieves relevant context
    and sends it to the language model.
    """
    retriever = vectorstore.as_retriever(
        search_kwargs={"k": RETRIEVER_K}
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are a helpful assistant.

Answer the user's question based only on the following context.

If the context does not contain relevant information,
say that you do not have enough information in the provided documents.

Keep the answer concise and clear.

Context:
{context}
""",
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}"),
        ]
    )

    def get_context(inputs):
        docs = retriever.invoke(inputs["question"])
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        RunnablePassthrough.assign(context=get_context)
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain


def convert_history_to_messages(chat_history: list[dict]):
    """
    Convert a simple list of dictionaries into LangChain message objects.
    """
    messages = []

    for message in chat_history[-MAX_HISTORY_MESSAGES:]:
        role = message["role"]
        content = message["content"]

        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    return messages


def main():
    print("Loading RAG chatbot...")

    llm = build_llm()
    vectorstore = load_vectorstore()
    rag_chain = build_rag_chain(vectorstore, llm)

    chat_history = []

    print("RAG chatbot is ready.")
    print("Ask a question about the documents.")
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
            messages_for_prompt = convert_history_to_messages(chat_history)

            answer = rag_chain.invoke(
                {
                    "question": user_input,
                    "chat_history": messages_for_prompt,
                }
            )

            print(f"\nAssistant: {answer}")

            chat_history.append(
                {
                    "role": "user",
                    "content": user_input,
                }
            )
            chat_history.append(
                {
                    "role": "assistant",
                    "content": answer,
                }
            )

        except Exception as error:
            print(f"\nError: {error}")


if __name__ == "__main__":
    main()
```

זהו קובץ מלא שאפשר להעלות ל-GitHub ולהריץ.

הוא בנוי כך שהקוד יהיה ברור, מחולק לפונקציות, וקל להרחבה בהמשך.

הקובץ כולל כמה חלקים מרכזיים:

```bash
1. build_llm
2. build_rag_chain
3. convert_history_to_messages
4. main
```

הפונקציה build_llm יוצרת את החיבור למודל.

הפונקציה build_rag_chain בונה את שרשרת ה-RAG: שליפה, prompt, מודל ופלט.

הפונקציה convert_history_to_messages הופכת את היסטוריית השיחה לפורמט שמתאים ל-LangChain.

הפונקציה main מפעילה את הצ’אט בפועל דרך שורת הפקודה.

הדבר החשוב ביותר בקובץ הזה הוא שהוא לא בונה את בסיס ה-RAG מחדש.

הוא משתמש בשורה הזאת:

```python
from build_rag_db import load_vectorstore
```

ובהמשך:

```python
vectorstore = load_vectorstore()
```

כלומר, הקובץ הזה מניח שכבר הרצנו קודם:

```bash
python build_rag_db.py
```

ורק אחרי שיש לנו chroma_db, אפשר להריץ:

```bash
python rag_chatbot.py
```

זו הפרדה נקייה בין שלב הבנייה לבין שלב השימוש.

## הסבר על הקוד

אחרי שיש לנו את הקובץ המלא rag_chatbot.py, כדאי לעבור על החלקים המרכזיים שלו ולהבין מה כל חלק עושה.

המטרה כאן היא לא לזכור כל שורה בעל פה, אלא להבין את המבנה המקצועי של הקובץ.

הקובץ בנוי סביב ארבעה רכיבים:

```bash
LLM
Vector Store
Retriever
Prompt + Chain
```

כל אחד מהם אחראי על שלב אחר בתהליך.

**יצירת ה-LLM**

**החלק הראשון** הוא יצירת החיבור למודל:

```python
def build_llm() -> ChatAnthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise EnvironmentError(
            "ANTHROPIC_API_KEY is not set. "
            "Please set it before running rag_chatbot.py."
        )

    return ChatAnthropic(
        model=MODEL_NAME,
        temperature=0,
    )
```

הפונקציה הזאת בודקת אם קיים משתנה סביבה בשם:

```python
ANTHROPIC_API_KEY
```

אם המפתח לא קיים, הקוד עוצר עם הודעה ברורה.

זו התנהגות חשובה, כי בלי API key אין לצ’אטבוט דרך לקרוא למודל.

שימו לב שהמפתח לא כתוב בתוך הקוד. זה חשוב במיוחד כאשר מעלים פרויקט ל-GitHub.

במקום לכתוב מפתח בקובץ Python, אנחנו קוראים אותו מהסביבה:

```python
os.getenv("ANTHROPIC_API_KEY")
```

כך הקוד נשאר נקי ובטוח יותר.

**טעינת ה-Vector Store**

בתוך main() מופיעה השורה:

```python
vectorstore = load_vectorstore()
```

הפונקציה הזאת מגיעה מהקובץ הקודם:

```python
from build_rag_db import load_vectorstore
```

זו נקודה חשובה מאוד.

rag_chatbot.py לא בונה את המאגר מחדש. הוא רק טוען מאגר שכבר נוצר קודם בתוך chroma_db.

אם התיקייה chroma_db לא קיימת, הפונקציה load_vectorstore() תחזיר שגיאה ותזכיר להריץ קודם:

```bash
python build_rag_db.py
```

ההפרדה הזאת הופכת את הפרויקט למסודר יותר: build_rag_db.py מכין את המאגר rag_chatbot.py משתמש במאגר

**יצירת Retriever**

בתוך build_rag_chain אנחנו יוצרים retriever:

```python
retriever = vectorstore.as_retriever(
    search_kwargs={"k": RETRIEVER_K}
)
```

ה-retriever הוא רכיב החיפוש של המערכת.

הוא מקבל שאלה, מחפש ב-Vector Store, ומחזיר את ה-chunks הכי רלוונטיים.

הערך RETRIEVER_K מוגדר בתחילת הקובץ:

RETRIEVER_K = 4

המשמעות היא שבכל שאלה נחזיר עד ארבעה chunks.

למה לא להחזיר את כל המסמכים?

כי המטרה של RAG היא לשלוח למודל רק את המידע הרלוונטי ביותר. יותר מדי context עלול להעמיס על המודל ולפגוע באיכות התשובה.

**בניית ה-Prompt**

ה-Prompt מוגדר כך:

```python
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a helpful assistant.

Answer the user's question based only on the following context.

If the context does not contain relevant information,
say that you do not have enough information in the provided documents.

Keep the answer concise and clear.

Context:
{context}
""",
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{question}"),
    ]
)
```

ה-Prompt מכיל שלושה חלקים:

<div dir="rtl">

| **חלק** | **תפקיד** |
| --- | --- |
| **system** | מגדיר למודל איך להתנהג |
| **chat_history** | מוסיף חלק מהשיחה הקודמת |
| **question** | השאלה הנוכחית של המשתמש |

</div>

החלק החשוב ביותר הוא ההנחיה:

```bash
Answer the user's question based only on the following context.
```

המשמעות היא שהמודל מתבקש לענות לפי ה-context שנשלף מהמסמכים, ולא לפי ידע כללי בלבד.

גם ההנחיה הזאת חשובה:

```bash
If the context does not contain relevant information,
say that you do not have enough information in the provided documents.
```

זו דרך פשוטה להקטין תשובות מומצאות. אם המידע לא נמצא במסמכים, עדיף שהמערכת תגיד שאין לה מספיק מידע.

**שליפת ה-context**

בתוך build_rag_chain יש פונקציה פנימית בשם get_context:

```python
def get_context(inputs):
    docs = retriever.invoke(inputs["question"])
    return "\n\n".join(doc.page_content for doc in docs)
```

הפונקציה הזאת מקבלת את השאלה, שולחת אותה ל-retriever, ומחזירה טקסט אחד שמורכב מכל ה-chunks שנמצאו.

לדוגמה, אם ה-retriever מצא ארבעה chunks, הפונקציה תחבר אותם כך:

```bash
chunk 1

chunk 2

chunk 3

chunk 4
```

התוצאה הזאת נכנסת לתוך {context} ב-Prompt.

**הרכבת ה-Chain**

החלק שמחבר את הכול הוא:

```python
chain = (
    RunnablePassthrough.assign(context=get_context)
    | prompt
    | llm
    | StrOutputParser()
)
```

אפשר לקרוא את זה כזרימה:

```bash
Input
   ↓
Add retrieved context
   ↓
Build prompt
   ↓
Call LLM
   ↓
Return text answer
```

**השלב הראשון:**

```python
RunnablePassthrough.assign(context=get_context)
```

משאיר את הקלט המקורי, ובמקביל מוסיף לו שדה חדש בשם context.

כלומר, אם הקלט המקורי היה:

```python
{
    "question": "What is ChromaDB?",
    "chat_history": []
}
```

אחרי השליפה הוא הופך בערך ל:

```python
{
    "question": "What is ChromaDB?",
    "chat_history": [],
    "context": "Relevant chunks from the vector store..."
}
```

לאחר מכן ה-Prompt מקבל את הנתונים, ה-LLM מייצר תשובה, ו-StrOutputParser מחזיר את התשובה כמחרוזת רגילה.

**שמירת היסטוריית שיחה**

היסטוריית השיחה נשמרת ברשימה פשוטה:

```python
chat_history = []
```

אחרי כל תשובה, מוסיפים אליה את שאלת המשתמש ואת תשובת הצ’אטבוט:

```python
chat_history.append(
    {
        "role": "user",
        "content": user_input,
    }
)
chat_history.append(
    {
        "role": "assistant",
        "content": answer,
    }
)
```

לפני שליחת השאלה הבאה למודל, ההיסטוריה מומרת לאובייקטים של LangChain:

```python
messages_for_prompt = convert_history_to_messages(chat_history)
```

בתוך הפונקציה הזאת אנחנו לוקחים רק את ההודעות האחרונות:

```python
for message in chat_history[-MAX_HISTORY_MESSAGES:]:
```

הערך מוגדר בתחילת הקובץ:

```python
MAX_HISTORY_MESSAGES = 10
```

כלומר, לא שולחים למודל את כל השיחה מאז תחילת הריצה, אלא רק את ההודעות האחרונות.

זה שומר על context קצר וממוקד יותר.

**לולאת הצ’אט**

בסוף הקובץ יש לולאה שמפעילה את הצ’אט:

```python
while True:
    user_input = input("\nYou: ").strip()
```

בכל סיבוב המשתמש כותב שאלה.

אם הוא כותב:

```bash
quit
```

או:

```bash
exit
```

התוכנית נעצרת.

אם הוא כותב שאלה רגילה, הקוד מפעיל את ה-chain:

```python
answer = rag_chain.invoke(
    {
        "question": user_input,
        "chat_history": messages_for_prompt,
    }
)
```

ואז מדפיס את התשובה:

```python
print(f"\nAssistant: {answer}")
```

בשלב הזה כבר יש לנו צ’אטבוט RAG עובד: הוא מקבל שאלה, שולף context מתוך המאגר, שולח אותו למודל, ומחזיר תשובה למשתמש.

## הרצה ובדיקת הצ’אטבוט

אחרי שכתבנו את rag_chatbot.py, אפשר להריץ את הצ’אטבוט ולבדוק שהוא באמת משתמש במאגר שבנינו בחלק הקודם.

לפני ההרצה, מבנה הפרויקט אמור להיראות כך:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  rag_chatbot.py
  requirements.txt
  data/
    sample_docs.txt
  chroma_db/
```

אם תיקיית chroma_db עדיין לא קיימת, צריך קודם להריץ:

```bash
python build_rag_db.py
```

רק אחרי שהמאגר נבנה ונשמר לדיסק, אפשר להריץ את הצ’אטבוט.

**שלב 1: התקנת הספריות**

אם עדיין לא התקנו את הספריות, נריץ:

```bash
pip install -r requirements.txt
```

אם עובדים בתוך virtual environment, נוודא שהוא פעיל.

ב-PowerShell:

```bash
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**שלב 2: הגדרת API key**

הצ’אטבוט משתמש ב-Anthropic, לכן צריך להגדיר את המשתנה:

```python
ANTHROPIC_API_KEY
```

ב-PowerShell:

```bash
$env:ANTHROPIC_API_KEY="your_api_key_here"
```

חשוב לא לכתוב את המפתח האמיתי בתוך הקוד, ולא להעלות אותו ל-GitHub.

**שלב 3: בניית בסיס ה-RAG**

נריץ:

```bash
python build_rag_db.py
```

אם הכול תקין, נקבל פלט בסגנון:

```bash
Building RAG vector store...
Loaded and created 5 chunks.
Vector store was created successfully.
Saved to: ...\chroma_db
```

מספר ה-chunks יכול להיות שונה. זה תלוי באורך המסמכים ובגודל ה-chunk שהגדרנו.

**שלב 4: הרצת הצ’אטבוט**

עכשיו נריץ:

```bash
python rag_chatbot.py
```

פלט אפשרי:

```bash
Loading RAG chatbot...
RAG chatbot is ready.
Ask a question about the documents.
Type 'quit' or 'exit' to stop.

You:
```

בשלב הזה הצ’אטבוט מחכה לשאלה.

**שאלות בדיקה**

אפשר להתחיל עם שאלה שנמצאת בבירור בתוך sample_docs.txt:

```bash
What is ChromaDB?
```

תשובה אפשרית:

```bash
ChromaDB is a vector database. It stores embeddings and can search for similar text based on meaning rather than exact keyword matching.
```

ננסה שאלה נוספת:

```bash
What does RAG stand for?
```

תשובה אפשרית:

```bash
RAG stands for Retrieval-Augmented Generation.
```

ננסה גם שאלה על תהליך העבודה:

```bash
What are the steps in a typical RAG pipeline?
```

תשובה אפשרית:

```bash
A typical RAG pipeline loads documents, splits them into chunks, converts each chunk into an embedding, stores the embeddings in a vector database, retrieves relevant chunks for a user question, and sends them to the language model as context.
```

**בדיקת שאלה שאין עליה מידע במסמכים**

חשוב לבדוק גם מה קורה כאשר המשתמש שואל שאלה שלא קשורה למסמכים.

לדוגמה:

```bash
What is the weather in London today?
```

תשובה טובה תהיה בסגנון:

```bash
I do not have enough information in the provided documents to answer that question.
```

זו בדיקה חשובה מאוד.

מערכת RAG טובה לא אמורה להמציא תשובות כאשר אין לה context מתאים. אם המידע לא נמצא במסמכים, עדיף שהצ’אטבוט יאמר זאת בצורה ברורה.

**בדיקת שאלת המשך**

עכשיו נבדוק אם היסטוריית השיחה עוזרת.

נשאל קודם:

```bash
What is ChromaDB?
```

ואחר כך:

```bash
How is it used in RAG?
```

המילה it מתייחסת ל-ChromaDB. בגלל שהצ’אטבוט שומר חלק מהיסטוריית השיחה, יש לו סיכוי טוב יותר להבין למה המשתמש מתכוון.

תשובה אפשרית:

```bash
ChromaDB is used in RAG as the vector database that stores embeddings and helps retrieve relevant chunks based on the user's question.
```

**יציאה מהצ’אט**

כדי לצאת, מקלידים:

```bash
quit
```

או:

```bash
exit
```

ואז התוכנית תדפיס:

```bash
Goodbye.
```

**מה בדקנו כאן**

בשלב הזה בדקנו שהמערכת באמת עובדת מקצה לקצה:

1. הצ’אטבוט נטען

2. ה-Vector Store נטען מתוך chroma_db

3. השאלה נשלחת ל-retriever

4. chunks רלוונטיים נשלפים

5. ה-context נכנס ל-prompt

6. ה-LLM מחזיר תשובה

7. היסטוריית השיחה נשמרת לשאלות המשך

זה כבר RAG Chatbot עובד.

הוא עדיין פשוט, אבל הוא כולל את כל הרכיבים המרכזיים של מערכת RAG אמיתית: מאגר וקטורי, retriever, prompt, מודל שפה, context, והיסטוריית שיחה קצרה.

**טעויות נפוצות בבניית RAG Chatbot**

אחרי שהצ’אטבוט עובד, חשוב להבין אילו טעויות יכולות לגרום לו להיכשל או להחזיר תשובות לא טובות.

במערכת RAG יש הרבה חלקים קטנים שמתחברים יחד: Vector Store, retriever, prompt, LLM, היסטוריית שיחה וטעינת קבצים. אם אחד מהם לא מוגדר נכון, כל המערכת יכולה להיראות כאילו היא עובדת, אבל בפועל להחזיר תשובות חלשות.

**טעות 1: להריץ את rag_chatbot.py לפני build_rag_db.py**

זו הטעות הנפוצה ביותר.

הקובץ rag_chatbot.py לא בונה את המאגר. הוא רק טוען מאגר קיים.

לכן הסדר הנכון הוא:

```bash
python build_rag_db.py
python rag_chatbot.py
```

אם מריצים קודם את rag_chatbot.py, הקוד ינסה לטעון את התיקייה:

```bash
chroma_db/
```

אבל אם היא עדיין לא קיימת, נקבל שגיאה.

זו בדיוק הסיבה שבנינו את הפונקציה load_vectorstore() עם בדיקה ברורה:

```python
if not CHROMA_PERSIST_DIR.exists():
    raise FileNotFoundError(
        f"Vector store not found at {CHROMA_PERSIST_DIR}. "
        "Run build_rag_db.py first."
    )
```

הודעת שגיאה טובה לא רק אומרת שיש בעיה. היא גם אומרת מה צריך לעשות כדי לפתור אותה.

**טעות 2: לא להגדיר ANTHROPIC_API_KEY**

הצ’אטבוט צריך לקרוא ל-LLM. במקרה שלנו, הוא משתמש ב-Anthropic.

לכן חייב להיות מוגדר משתנה סביבה בשם:

```python
ANTHROPIC_API_KEY
```

אם המשתנה לא מוגדר, הפונקציה build_llm() תעצור את הריצה:

```python
api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    raise EnvironmentError(
        "ANTHROPIC_API_KEY is not set. "
        "Please set it before running rag_chatbot.py."
    )
```

ב-PowerShell מגדירים את המפתח כך:

```bash
$env:ANTHROPIC_API_KEY="your_api_key_here"
```

חשוב מאוד לא לשמור את המפתח בתוך הקוד.

לא כך:

```python
api_key = "my-real-api-key"
```

קוד כזה מסוכן להעלאה ל-GitHub, כי הוא עלול לחשוף מפתח אמיתי.

**טעות 3: לחשוב ש-RAG יודע לענות על כל דבר**

RAG לא הופך את הצ’אטבוט לכל-יודע.

הוא רק מוסיף לו יכולת לענות על בסיס מסמכים חיצוניים.

אם המסמכים מדברים על LangChain, ChromaDB ו-RAG, ואז המשתמש שואל:

```bash
Who won the NBA championship this year?
```

אין למערכת מידע מתאים בתוך המסמכים.

במקרה כזה, התשובה הנכונה היא לא להמציא.

התשובה הנכונה היא משהו בסגנון:

```bash
I do not have enough information in the provided documents to answer that question.
```

זו לא חולשה של המערכת. זו התנהגות נכונה.

מערכת RAG טובה נמדדת לא רק לפי היכולת שלה לענות, אלא גם לפי היכולת שלה לעצור כאשר אין לה בסיס מספיק.

**טעות 4: לשלוח יותר מדי context למודל**

לפעמים נראה שכדאי להחזיר הרבה chunks, כדי שהמודל יקבל כמה שיותר מידע.

אבל זה לא תמיד נכון.

אם נחזיר יותר מדי chunks, ה-context עלול להיות ארוך, עמוס ולא ממוקד. המודל עלול להתבלבל, להתייחס לפרטים לא חשובים, או לפספס את הנקודה המרכזית.

לכן הגדרנו:

```python
RETRIEVER_K = 4
```

המשמעות היא שה-retriever מחזיר עד ארבעה chunks לכל שאלה.

זה ערך טוב להתחלה, אבל לא ערך קדוש.

בפרויקט אמיתי אפשר לבדוק ערכים שונים:

```python
k = 2
k = 4
k = 6
k = 8
```

ולראות באיזה ערך התשובות הכי טובות.

הכלל הוא פשוט:

יותר context לא תמיד אומר תשובה טובה יותר.

המטרה היא להביא למודל את המידע הכי רלוונטי, לא את כמות המידע הכי גדולה.

**טעות 5: לא לשמור על Prompt ברור**

ה-Prompt הוא המקום שבו אנחנו מגדירים למודל איך להשתמש ב-context.

אם ה-Prompt לא ברור, המודל עלול לענות מתוך ידע כללי, גם כאשר רצינו שהוא יענה רק מתוך המסמכים.

לכן כתבנו:

```bash
Answer the user's question based only on the following context.
```

וגם:

```bash
If the context does not contain relevant information,
say that you do not have enough information in the provided documents.
```

שתי ההנחיות האלה חשובות.

הראשונה מכוונת את המודל להשתמש ב-context.

השנייה מכוונת אותו לא להמציא תשובה כאשר אין מספיק מידע.

במערכת אמיתית אפשר לשפר את ה-Prompt עוד יותר, אבל כבר כאן יש לנו בסיס נכון.

**טעות 6: לשמור יותר מדי היסטוריית שיחה**

היסטוריית שיחה עוזרת בשאלות המשך.

לדוגמה:

```bash
What is ChromaDB?
```

ואחר כך:

```bash
How is it used in RAG?
```

אבל אם שולחים למודל את כל השיחה מתחילת הריצה, ה-context עלול להיות עמוס מדי.

לכן הגדרנו:

```python
MAX_HISTORY_MESSAGES = 10
```

המשמעות היא שהמערכת שומרת את כל ההיסטוריה בזיכרון המקומי של התוכנית, אבל שולחת למודל רק את ההודעות האחרונות.

זה איזון טוב להתחלה.

אם רוצים מערכת מתקדמת יותר, אפשר בעתיד לנהל היסטוריה בצורה חכמה יותר: לסכם שיחות ישנות, לשמור זיכרון חיצוני, או להפריד בין context של מסמכים לבין context של שיחה.

**טעות 7: לא לבדוק שאלות מחוץ למסמכים**

הרבה מפתחים בודקים רק שאלות שקל למערכת לענות עליהן.

לדוגמה:

```bash
What is RAG?
What is ChromaDB?
What are embeddings?
```

אלה שאלות טובות לבדיקה ראשונה, אבל הן לא מספיקות.

חייבים לבדוק גם שאלות שאין עליהן תשובה במסמכים:

```bash
What is the weather in London today?
Who is the CEO of Microsoft?
How do I cook pasta?
```

המטרה היא לוודא שהמערכת לא ממציאה תשובות.

אם הצ’אטבוט עונה בביטחון על שאלות שלא קיימות במסמכים, צריך לשפר את ה-Prompt, את בדיקת ה-context, או את הלוגיקה של השליפה.

**טעות 8: לא להבין את ההבדל בין retrieval לבין generation**

ב-RAG יש שני שלבים שונים:

```bash
retrieval   → מציאת מידע רלוונטי
generation  → ניסוח תשובה בעזרת LLM
```

ה-retriever לא כותב תשובה.

ה-LLM לא מחפש לבד במסמכים.

כל רכיב עושה תפקיד אחר.

אם ה-retriever מחזיר context לא טוב, גם LLM חזק עלול לתת תשובה חלשה.

אם ה-context טוב אבל ה-Prompt לא ברור, המודל עלול להשתמש בו בצורה לא מדויקת.

לכן כשיש בעיה בתשובה, צריך לשאול:

- האם נשלפו chunks רלוונטיים?

- האם ה-context שנשלח למודל ברור?

- האם ה-Prompt מגדיר נכון את ההתנהגות?

- האם השאלה בכלל מתאימה למסמכים?

זו דרך מקצועית יותר לדבג מערכת RAG.


