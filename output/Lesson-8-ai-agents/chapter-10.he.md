# בניית בסיס RAG

אחרי שבחרנו את השלדים שנבנה בשיעור, אפשר להתחיל מהשלד המעשי הראשון: RAG Chatbot.

אבל לפני שבונים את הצ’אטבוט עצמו, צריך להכין לו בסיס ידע. הצ’אטבוט לא יכול לענות מתוך מסמכים אם המסמכים עדיין לא נטענו, לא חולקו לקטעים, לא הומרו ל-embeddings, ולא נשמרו במאגר שאפשר לחפש בו.

זה בדיוק התפקיד של פרק זה.

בפרק הזה נבנה את בסיס ה-RAG: ניקח קבצי טקסט רגילים, נחלק אותם ל-chunks, נהפוך כל chunk לייצוג מספרי שנקרא embedding, ונשמור את הכול בתוך ChromaDB.

במילים פשוטות, אנחנו בונים את הזיכרון החיצוני של המערכת.

הזרימה שנבנה היא:

```bash
Documents
   ↓
Chunks
   ↓
Embeddings
   ↓
ChromaDB Vector Store
   ↓
Saved on disk
```

חשוב להבין: בשלב הזה עדיין לא בונים צ’אטבוט. אין עדיין שאלות משתמש, אין עדיין retriever, ואין עדיין קריאה ל-LLM כדי לענות.

בשלב הזה אנחנו רק מכינים את המאגר.

הצ’אטבוט שיטען את המאגר וישתמש בו יגיע בפרק הבא.

## מה אנחנו בונים

אנחנו בונים קובץ Python שמכין בסיס RAG מקומי.

הקובץ יקרא: build_rag_db.py

התפקיד שלו הוא לבצע את כל שלבי ההכנה:

1. למצוא קבצי טקסט בתיקיית data

2. לטעון את הקבצים

3. לחלק את הטקסט ל-chunks

4. ליצור embeddings לכל chunk

5. לשמור את התוצאה ב-ChromaDB

6. לאפשר טעינה מחדש של המאגר בהמשך

בסיום הריצה תיווצר תיקייה בשם:

```bash
chroma_db/
```

זו התיקייה שבה ChromaDB ישמור את המאגר.

הקבצים שנוסיף או נשתמש בהם בחלק הזה הם:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  requirements.txt
  data/
    sample_docs.txt
```

לאחר הרצה מוצלחת, תתווסף גם התיקייה:

```bash
lesson-08-ai-agents/
  chroma_db/
```

היא לא נכתבת ידנית. היא נוצרת על ידי הקוד.

אפשר לחשוב על מבנה הפרויקט כך:

<div dir="rtl">

| **קובץ או תיקיי**ה | **תפקיד** |
| --- | --- |
| **requirements.txt** | רשימת הספריות הנדרשות |
| **data/sample_docs.txt** | מסמך טקסט לדוגמה |
| **build_rag_db.py** | בונה את בסיס ה-RAG |
| **chroma_db/** | המאגר שנשמר לדיסק לאחר ההרצה |

</div>

## הכנת הספריות וקובץ הדוגמה

לפני שנכתוב את build_rag_db.py, צריך להכין שני דברים בסיסיים בפרויקט:

1. קובץ requirements.txt

2. תיקיית data עם קובץ טקסט לדוגמה

הקוד של בסיס ה-RAG צריך לדעת מאיפה לטעון מסמכים, ובאילו ספריות להשתמש כדי לחלק טקסט, ליצור embeddings ולשמור אותם ב-ChromaDB.

המבנה שנרצה לקבל הוא:

```bash
lesson-08-ai-agents/
  requirements.txt
  data/
    sample_docs.txt
```

**תוכן הקובץ requirements.txt**

ניצור קובץ בשם:

```bash
requirements.txt
```

ובתוכו נשים את הספריות הבאות:

```bash
langchain
langchain-chroma
langchain-community
chromadb
sentence-transformers
```

הקובץ הזה מגדיר את התלויות של הפרויקט.

langchain מספקת את רכיבי העבודה המרכזיים.

langchain-chroma מאפשרת לעבוד עם ChromaDB דרך LangChain.

langchain-community כוללת רכיבים שימושיים כמו document loaders ו-embeddings.

chromadb הוא ה-Vector Store שבו נשמור את ה-embeddings.

sentence-transformers היא הספרייה שתאפשר לנו ליצור embeddings מטקסט בעזרת מודל מקומי.

כדי להתקין את הספריות, נריץ:

```bash
pip install -r requirements.txt
```

בשלב הזה עדיין לא הרצנו RAG. רק הכנו את סביבת העבודה.

**יצירת תיקיית data**

עכשיו ניצור תיקייה בשם: data

ובתוכה קובץ בשם: sample_docs.txt

הקובץ הזה ישמש אותנו כמסמך הדגמה. ממנו נבנה את בסיס ה-RAG.

המבנה יהיה:

```bash
data/
  sample_docs.txt
```

**תוכן הקובץ data/sample_docs.txt**

נכניס לקובץ את הטקסט הבא:

```bash
LangChain is a framework for building applications with large language models.
It helps developers connect models to prompts, memory, tools, retrievers, and external data sources.

RAG stands for Retrieval-Augmented Generation.
A RAG system retrieves relevant information from external documents and gives that information to a language model as context.

ChromaDB is a vector database.
It can store embeddings and search for similar text based on meaning rather than exact keyword matching.

A typical RAG pipeline has several steps.
First, documents are loaded from files.
Then the documents are split into smaller chunks.
Each chunk is converted into an embedding.
The embeddings are stored in a vector database.
When a user asks a question, the system retrieves the most relevant chunks and sends them to the language model.

Embeddings are numerical representations of text.
Texts with similar meanings usually have embeddings that are close to each other in vector space.

A retriever is the component that searches the vector store.
It receives a user question and returns the most relevant chunks.

The context window is the amount of text a language model can process at once.
RAG helps keep the context focused by sending only the most relevant pieces of information.

A good RAG system depends on good documents, useful chunk sizes, high-quality embeddings, and clear prompts.
```

המסמך הזה קצר, אבל הוא מספיק טוב להדגמה. הוא כולל כמה מושגים שנשתמש בהם בהמשך:

```bash
LangChain
RAG
ChromaDB
embeddings
retriever
context window
```

כאשר נבנה את בסיס ה-RAG, הקוד יטען את הקובץ הזה, יחלק אותו ל-chunks, ייצור embeddings, וישמור אותם בתוך ChromaDB.

חשוב להבין שהקובץ sample_docs.txt הוא רק דוגמה. בפרויקט אמיתי, תיקיית data יכולה להכיל הרבה קבצי טקסט:

```bash
data/
  intro.txt
  product_docs.txt
  support_faq.txt
  internal_notes.txt
```

בשלב הזה אנחנו מתחילים מקובץ אחד כדי לשמור על הפשטות. אחרי שהכול עובד, אפשר להוסיף עוד מסמכים ולבנות את המאגר מחדש.

בסיום הסעיף הזה יש לנו סביבת עבודה בסיסית:

```bash
requirements.txt       → הספריות הדרושות
data/sample_docs.txt   → מסמך הדגמה לבניית המאגר
```

השלב הבא הוא לכתוב את הקובץ המרכזי של חלק זה: build_rag_db.py.

## כתיבת הקובץ build_rag_db.py

עכשיו נכתוב את הקובץ המרכזי של חלק זה: build_rag_db.py

הקובץ הזה אחראי על בניית בסיס ה-RAG. הוא לא מפעיל צ’אטבוט, לא מקבל שאלות מהמשתמש, ולא קורא ל-LLM כדי לנסח תשובה.

התפקיד שלו הוא להכין את מאגר הידע.

הזרימה בקובץ תהיה:

```bash
Load documents
   ↓
Split into chunks
   ↓
Create embeddings
   ↓
Save to ChromaDB
   ↓
Load existing vector store when needed
```

ניצור קובץ בשם build_rag_db.py בתיקיית הפרויקט, ונכניס אליו את הקוד הבא.

**תוכן מלא לקובץ build_rag_db.py**

```python
from pathlib import Path

from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


CHROMA_PERSIST_DIR = Path(__file__).parent / "chroma_db"
COLLECTION_NAME = "rag_docs"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def get_embeddings() -> HuggingFaceEmbeddings:
    """
    Create the embedding model used by the RAG system.

    The same embedding model must be used when building the vector store
    and when loading it later for search.
    """
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
    )


def load_and_chunk_documents(data_dir: str = "data"):
    """
    Load all .txt files from the data folder and split them into chunks.
    """
    data_path = Path(__file__).parent / data_dir

    if not data_path.exists():
        raise FileNotFoundError(
            f"Data folder not found: {data_path}"
        )

    text_files = list(data_path.glob("*.txt"))

    if not text_files:
        raise FileNotFoundError(
            f"No .txt files found in: {data_path}"
        )

    documents = []

    for file_path in text_files:
        loader = TextLoader(
            str(file_path),
            encoding="utf-8",
        )
        documents.extend(loader.load())

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=80,
        length_function=len,
    )

    chunks = splitter.split_documents(documents)
    return chunks


def build_vectorstore(chunks) -> Chroma:
    """
    Build and persist a ChromaDB vector store from document chunks.
    """
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        persist_directory=str(CHROMA_PERSIST_DIR),
        collection_name=COLLECTION_NAME,
    )

    return vectorstore


def load_vectorstore() -> Chroma:
    """
    Load the persisted ChromaDB vector store.

    This function will be used later by the RAG chatbot.
    """
    if not CHROMA_PERSIST_DIR.exists():
        raise FileNotFoundError(
            f"Vector store not found at {CHROMA_PERSIST_DIR}. "
            "Run build_rag_db.py first."
        )

    return Chroma(
        persist_directory=str(CHROMA_PERSIST_DIR),
        embedding_function=get_embeddings(),
        collection_name=COLLECTION_NAME,
    )


def main():
    print("Building RAG vector store...")
    print(f"Data folder: {Path(__file__).parent / 'data'}")
    print(f"Persist directory: {CHROMA_PERSIST_DIR}")
    print(f"Collection name: {COLLECTION_NAME}")
    print(f"Embedding model: {EMBEDDING_MODEL}")

    chunks = load_and_chunk_documents()

    print(f"Loaded and created {len(chunks)} chunks.")

    build_vectorstore(chunks)

    print("Vector store was created successfully.")
    print(f"Saved to: {CHROMA_PERSIST_DIR}")


if __name__ == "__main__":
    main()
```

הקובץ הזה בנוי מכמה חלקים ברורים.

בתחילת הקובץ מוגדרים שלושה ערכים קבועים:

```python
CHROMA_PERSIST_DIR = Path(__file__).parent / "chroma_db"
COLLECTION_NAME = "rag_docs"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
```

CHROMA_PERSIST_DIR מגדיר איפה המאגר יישמר בדיסק.

COLLECTION_NAME מגדיר את שם האוסף בתוך ChromaDB.

EMBEDDING_MODEL מגדיר באיזה מודל נשתמש כדי להפוך טקסט ל-embeddings.

**הפונקציה הראשונה היא:**

```python
get_embeddings()
```

היא יוצרת את מודל ה-embeddings. חשוב להשתמש באותו מודל גם בזמן בניית המאגר וגם בזמן טעינת המאגר בהמשך. אם נבנה embeddings עם מודל אחד ונחפש עם מודל אחר, איכות החיפוש עלולה להיפגע.

**הפונקציה השנייה היא:**

```python
load_and_chunk_documents()
```

היא טוענת את קבצי הטקסט מתוך תיקיית data, ואז מחלקת אותם ל-chunks.

החלוקה מתבצעת כאן:

```python
splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=80,
    length_function=len,
)
```

המשמעות היא שכל chunk יהיה בערך עד 400 תווים, עם חפיפה של 80 תווים בין chunks סמוכים. החפיפה עוזרת לשמור על הקשר בין קטעים סמוכים בטקסט.

**הפונקציה השלישית היא:**

```python
build_vectorstore()
```

היא מקבלת chunks, יוצרת להם embeddings, ושומרת אותם בתוך ChromaDB.

החלק החשוב הוא:

```python
Chroma.from_documents(
    documents=chunks,
    embedding=get_embeddings(),
    persist_directory=str(CHROMA_PERSIST_DIR),
    collection_name=COLLECTION_NAME,
)
```

כאן מתבצעת הבנייה בפועל של ה-Vector Store.

**הפונקציה הרביעית היא:**

```python
load_vectorstore()
```

היא לא בונה את המאגר מחדש. היא רק טוענת מאגר שכבר נשמר בדיסק.

הפונקציה הזאת תהיה חשובה מאוד בחלק הבא, כאשר נבנה את rag_chatbot.py. הצ’אטבוט ישתמש בה כדי לטעון את בסיס ה-RAG הקיים.

לבסוף יש את:

```python
main()
```

זו נקודת הכניסה של הקובץ. כאשר נריץ:

```bash
python build_rag_db.py
```

הפונקציה main() תטען את המסמכים, תחלק אותם ל-chunks, תבנה את המאגר, ותשמור אותו לתיקיית chroma_db.

בסוף הפרק הזה יש לנו את הקובץ המרכזי של בסיס ה-RAG. השלב הבא הוא להריץ אותו ולבדוק שהתיקייה chroma_db באמת נוצרת.

## הרצת הקובץ ובדיקת התוצאה

אחרי שכתבנו את build_rag_db.py, אפשר להריץ אותו ולבדוק שהוא באמת בונה את בסיס ה-RAG.

בשלב הזה אנחנו מצפים שהקוד יבצע את כל שרשרת ההכנה:

```bash
Load documents
   ↓
Split into chunks
   ↓
Create embeddings
   ↓
Save to ChromaDB
```

לפני ההרצה, מבנה הפרויקט אמור להיראות כך:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  requirements.txt
  data/
    sample_docs.txt
```

כלומר, עדיין אין תיקיית chroma_db. היא תיווצר רק אחרי שהקוד ירוץ בהצלחה.

**שלב 1: התקנת הספריות**

מתוך תיקיית הפרויקט נריץ:

```bash
pip install -r requirements.txt
```

הפקודה הזאת מתקינה את הספריות שהגדרנו בקובץ requirements.txt.

אם עובדים בתוך virtual environment, חשוב לוודא שהוא מופעל לפני ההתקנה.

לדוגמה ב-PowerShell:

```bash
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

אם ההתקנה הסתיימה ללא שגיאות, אפשר לעבור להרצת הקובץ.

**שלב 2: הרצת build_rag_db.py**

נריץ:

```bash
python build_rag_db.py
```

בזמן ההרצה, הקובץ אמור להדפיס הודעות שמראות מה הוא עושה.

פלט אפשרי:

```bash
Building RAG vector store...
Data folder: C:\D\lesson-08-ai-agents\data
Persist directory: C:\D\lesson-08-ai-agents\chroma_db
Collection name: rag_docs
Embedding model: sentence-transformers/all-MiniLM-L6-v2
Loaded and created 5 chunks.
Vector store was created successfully.
Saved to: C:\D\lesson-08-ai-agents\chroma_db
```

מספר ה-chunks יכול להיות שונה לפי אורך המסמכים וגודל ה-chunk שהגדרנו. זה בסדר.

הדבר החשוב הוא שההרצה הסתיימה בלי שגיאה, ושנוצרה תיקיית chroma_db.

**שלב 3: בדיקת מבנה התיקיות לאחר ההרצה**

אחרי ההרצה, מבנה הפרויקט אמור להיראות בערך כך:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  requirements.txt
  data/
    sample_docs.txt
  chroma_db/
```

התיקייה chroma_db היא התוצאה החשובה של החלק הזה.

היא מכילה את ה-Vector Store שנשמר לדיסק. אנחנו לא צריכים לערוך אותה ידנית, ולא צריכים לכתוב אליה קבצים בעצמנו. ChromaDB מנהלת את התוכן שלה.

בפרק הבא, rag_chatbot.py יטען את התיקייה הזאת וישתמש בה כדי לחפש chunks רלוונטיים לפי שאלת המשתמש.

**שלב 4: בדיקה מהירה שהטעינה עובדת**

אפשר לבצע בדיקה קטנה מתוך Python כדי לוודא שהמאגר נטען.

נריץ:

python

ואז בתוך Python:

```python
from build_rag_db import load_vectorstore

vectorstore = load_vectorstore()
print("Vector store loaded successfully.")
```

אם מתקבלת ההודעה:

```bash
Vector store loaded successfully.
```

סימן שהמאגר קיים וניתן לטעינה.

אפשר לצאת מ-Python עם:

```bash
exit()
```

**מה בעצם בדקנו כאן**

בשלב הזה בדקנו שלושה דברים:

1. הספריות מותקנות

2. המסמכים נטענים ומתחלקים ל-chunks

3. ChromaDB שומר את המאגר לדיסק

זו בדיקה חשובה לפני שממשיכים לצ’אטבוט.

אם בסיס ה-RAG לא נבנה כמו שצריך, אין טעם להריץ את rag_chatbot.py. הצ’אטבוט תלוי בכך שהתיקייה chroma_db כבר קיימת וכוללת מאגר תקין.

העיקרון הוא:

קודם בונים את הזיכרון. 
אחר כך משתמשים בו.

לכן סדר העבודה נשאר:

python build_rag_db.py

ורק בחלק הבא:

python rag_chatbot.py

## טעויות נפוצות בבניית בסיס RAG

בבניית בסיס RAG יש כמה טעויות שחוזרות הרבה. חלק מהן נראות קטנות, אבל הן יכולות לגרום לכך שהצ’אטבוט בהמשך לא יצליח למצוא מידע או יחזיר תשובות חלשות.

**הטעות הראשונה** היא לשכוח ליצור את תיקיית data.

הקובץ build_rag_db.py מצפה למצוא תיקייה בשם: data

ובתוכה לפחות קובץ טקסט אחד עם סיומת: .txt

אם התיקייה לא קיימת, הקוד יחזיר שגיאה ברורה:

```bash
Data folder not found
```

זו שגיאה טובה, כי היא אומרת לנו בדיוק מה חסר.

מבנה תקין צריך להיראות כך:

```bash
lesson-08-ai-agents/
  build_rag_db.py
  data/
    sample_docs.txt
```

**הטעות השנייה** היא ליצור את תיקיית data, אבל לא לשים בתוכה קבצי טקסט.

במקרה כזה התיקייה קיימת, אבל אין לקוד מה לטעון.

לכן הקוד בודק גם את זה:

```python
text_files = list(data_path.glob("*.txt"))

if not text_files:
    raise FileNotFoundError(
        f"No .txt files found in: {data_path}"
    )
```

הבדיקה הזאת חשובה כי אחרת היינו עלולים לבנות Vector Store ריק, ואז בהמשך הצ’אטבוט לא היה מוצא שום context רלוונטי.

**הטעות השלישית** היא להריץ את הצ’אטבוט לפני שבונים את המאגר.

הסדר הנכון הוא:

```bash
python build_rag_db.py
python rag_chatbot.py
```

אם מריצים קודם את rag_chatbot.py, הוא ינסה לטעון את chroma_db, אבל התיקייה עדיין לא קיימת.

לכן הפונקציה load_vectorstore() בודקת את זה:

```python
if not CHROMA_PERSIST_DIR.exists():
    raise FileNotFoundError(
        f"Vector store not found at {CHROMA_PERSIST_DIR}. "
        "Run build_rag_db.py first."
    )
```

זו הודעת שגיאה חשובה מאוד. היא מסבירה למשתמש לא רק מה הבעיה, אלא גם מה צריך לעשות כדי לפתור אותה.

**הטעות הרביעית** היא להשתמש במודל embeddings אחד בזמן הבנייה, ובמודל אחר בזמן החיפוש.

כאשר בונים את המאגר, כל chunk הופך ל-embedding. כאשר המשתמש שואל שאלה, גם השאלה הופכת ל-embedding. כדי שהחיפוש יעבוד בצורה עקבית, צריך להשתמש באותו מודל embeddings בשני השלבים.

לכן הגדרנו את שם המודל כקבוע:

```python
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
```

והשתמשנו בו דרך פונקציה אחת:

```python
def get_embeddings() -> HuggingFaceEmbeddings:
```

כך גם הבנייה וגם הטעינה משתמשות באותה פונקציה.

**הטעות החמישית** היא לבחור chunks גדולים מדי או קטנים מדי בלי לבדוק.

בפרויקט שלנו התחלנו עם:

```python
chunk_size=400
chunk_overlap=80
```

אלה ערכים טובים להדגמה, אבל הם לא תמיד יהיו מושלמים לכל פרויקט.

אם ה-chunks גדולים מדי, כל chunk עלול להכיל כמה נושאים שונים, ואז החיפוש יחזיר context עמוס ולא ממוקד.

אם ה-chunks קטנים מדי, כל chunk עלול לאבד הקשר, ואז המודל יקבל משפטים מנותקים שקשה להבין מהם תשובה מלאה.

לכן chunking הוא לא רק פעולה טכנית. זו החלטה שמשפיעה ישירות על איכות ה-RAG.

**הטעות השישית** היא לחשוב ש-Vector Store הוא LLM.

ChromaDB לא מנסח תשובות. הוא לא “מבין” כמו מודל שפה, ולא מחליף את ה-LLM.

התפקיד שלו הוא אחר:

- לקבל שאלה

- לחפש chunks דומים במשמעות

- להחזיר את הקטעים הרלוונטיים ביותר

את התשובה הסופית ינסח ה-LLM בחלק הבא, אחרי שנעביר לו את ה-context שנשלף.

**הטעות השביעית** היא לשנות את המסמכים אבל לא לבנות מחדש את המאגר.

אם מוסיפים קובץ חדש לתיקיית data, או משנים את sample_docs.txt, המאגר הקיים ב-chroma_db לא בהכרח יתעדכן לבד.

בפרויקט פשוט כזה, הדרך הברורה היא לבנות מחדש:

```bash
python build_rag_db.py
```

במערכת אמיתית אפשר לבנות מנגנון עדכון חכם יותר, אבל בשיעור הזה נשמור על דרך פשוטה וברורה: כאשר משנים את המסמכים, בונים מחדש את בסיס ה-RAG.

בסוף הפרק הזה צריך לזכור את העיקרון המרכזי:

איכות הצ’אטבוט מתחילה באיכות בסיס ה-RAG.

אם המסמכים לא טובים, ה-chunks לא טובים, או ה-embeddings לא עקביים, גם מודל חזק לא תמיד יצליח לתת תשובה טובה.

לכן לפני שעוברים ל-rag_chatbot.py, חשוב לוודא שהשלב הזה עובד היטב: המסמכים נטענים, ה-chunks נוצרים, וה-Vector Store נשמר בהצלחה לתיקיית chroma_db.
