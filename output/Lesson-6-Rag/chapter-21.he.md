# תרגול בית: להפוך את הדוגמה ממערכת לימודית למערכת RAG גמישה יותר

אחרי שבנינו מערכת RAG בסיסית עם Python ו FAISS, מגיע השלב שבו מתחילים באמת להבין את החומר: משנים את המערכת בידיים.

זו נקודה חשובה מאוד.

RAG לא לומדים רק מקריאה על Embeddings, Chunks ו Vector Database. לומדים אותו כאשר משנים פרמטר קטן ורואים איך כל המערכת מתנהגת אחרת.

- משנים Chunk size, ופתאום מספר ה Chunks משתנה.

- משנים top_k, ופתאום ה Context שהמודל מקבל ארוך יותר.

- מחליפים FAISS ב ChromaDB, ופתאום מבינים את ההבדל בין ספרייה לבין מסד נתונים.

- מחליפים את ה Chunker הידני ב LangChain,

ופתאום רואים איך Framework עוזר לנו לכתוב פחות קוד תשתיתי.

לכן תרגול הבית אינו רק “משימות לשיעורי בית”. הוא שלב לימודי חשוב מאוד: הוא לוקח את הדוגמה שבנינו ומכריח אותנו לגעת בדיוק בנקודות שבהן RAG הופך ממנגנון פשוט למערכת שאפשר להתחיל להתאים לצרכים אמיתיים.

## פתרון תרגיל בית 1: החלפת ה Chunker ל LangChain RecursiveCharacterTextSplitter

בפרויקט המקורי כתבנו פונקציה בשם chunk_document. היא מחלקת מסמך למשפטים, בונה Chunks עד מגבלת מילים, ומוסיפה חפיפה בין Chunk אחד לבא אחריו.

זה מצוין ללמידה, כי כך ראינו איך Chunking עובד באמת. אבל במערכות רבות לא נרצה לכתוב את כל הלוגיקה הזאת בעצמנו. נרצה להשתמש בכלי מוכן, מוכר ובדוק יותר.

כאן נכנס RecursiveCharacterTextSplitter של LangChain.

הרעיון של הכלי הזה הוא לחלק טקסט בצורה הדרגתית וחכמה יחסית. הוא מנסה קודם לחתוך לפי גבולות טבעיים גדולים יותר, כמו פסקאות. אם זה לא מספיק, הוא יורד לרמה של שורות. אם עדיין צריך, הוא יורד לרמת משפטים או תווים. לכן קוראים לו Recursive: הוא מנסה כמה רמות חיתוך, מהטבעית ביותר ועד לרמה הקטנה יותר.

המטרה אינה רק “לחתוך טקסט”. המטרה היא לשמור כמה שיותר על יחידות משמעות.

במערכת RAG זה חשוב מאוד, כי Chunk הוא יחידת השליפה. אם ה Chunk טוב, ה Retrieval מקבל חומר טוב. אם ה Chunk נחתך רע, גם Embedding טוב וגם מודל חזק לא תמיד יצילו את התשובה.

במקום שהקוד שלנו ינהל לבד משפטים, ספירת מילים וחפיפה, אפשר להתחיל להעביר את האחריות הזאת ל LangChain.

דוגמה רעיונית לשינוי:

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

documents = load_documents(DATA_FILE)
    
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,
    chunk_overlap=300,
    separators=["\n\n", "\n", ". ", " ", ""],
)

chunks = []
for document in documents:
    chunks.extend(text_splitter.split_text(document))
```

בגרסה המקורית חילקנו כל מסמך ל Chunks בעזרת פונקציה שכתבנו בעצמנו. עכשיו אנחנו מחליפים את הפונקציה הזאת ב RecursiveCharacterTextSplitter, שהוא רכיב מוכן של LangChain שמנסה לחלק טקסט לפי גבולות טבעיים: קודם פסקאות, אחר כך שורות, אחר כך משפטים, אחר כך מילים, ורק בסוף תווים.

הסיבה שעוברים בלולאה על documents היא שכל איבר ברשימה הוא מסמך נפרד. אנחנו לא רוצים לשלוח את כל הרשימה ל split_text, אלא לחלק כל מסמך בפני עצמו, ואז לאחד את כל ה Chunks לרשימה אחת.

עוד נקודה חשובה: ב LangChain הערכים chunk_size ו chunk_overlap הם בדרך כלל לפי תווים, לא לפי מילים. לכן:

```python
chunk_size=1500
chunk_overlap=300
```

זה לא בדיוק “150 מילים ו 30 מילים חפיפה”. זו הערכה בתווים. אם רוצים להיצמד ממש לדרישה של 150 מילים ו 30 מילים, צריך Chunker שמודד מילים, או להישאר עם הפונקציה הידנית ולשנות בה את הערכים.

לתרגיל ראשון זה בסדר לכתוב כך, אבל כדאי לציין במפורש:

```python
In this version, LangChain splits by characters, not by words.
```

וגם צריך להוסיף ל requirements.txt:

```bash
langchain-text-splitters
```

בתרגיל הראשון אנחנו מחליפים את מנגנון ה Chunking הידני ב RecursiveCharacterTextSplitter. במקום שאנחנו ננהל בעצמנו פיצול למשפטים, ספירת מילים וחפיפה, אנחנו נותנים ל LangChain לחלק את הטקסט בצורה גמישה יותר. עם זאת, חשוב לדעת שהרכיב עובד בעיקר לפי מספר תווים, ולכן הערכים שנגדיר אינם שקולים אחד לאחד למספר מילים.

## פתרון תרגיל בית 2: החלפת FAISS ב ChromaDB

בתרגיל הראשון שינינו את מנגנון ה Chunking. עכשיו אנחנו מחליפים שכבה עמוקה יותר במערכת: את מנוע האחסון והשליפה הווקטורית.

בגרסה המקורית השתמשנו ב FAISS. FAISS הוא כלי מצוין ללמידה, כי הוא מראה בצורה ישירה מאוד איך מחזיקים Embeddings ומחפשים וקטורים קרובים. אבל FAISS הוא בעיקר ספרייה לחיפוש וקטורי, לא מסד נתונים מלא. לכן בקוד המקורי היינו צריכים לשמור בנפרד את האינדקס בקובץ index.faiss, ואת רשימת ה Chunks בקובץ metadata.json.

בתרגיל הזה אנחנו מחליפים את FAISS ב ChromaDB. ההבדל חשוב: ChromaDB מאפשר לשמור בתוך Collection אחת גם את הטקסטים, גם את ה Embeddings, גם מזהים וגם Metadata. לכן הוא מתאים יותר לחשיבה של מערכת RAG שמתפתחת מעבר לדוגמה לימודית פשוטה.

עדכון requirements.txt

במקום faiss-cpu, נוסיף chromadb.

אם ממשיכים גם עם התרגיל הראשון ועם Claude, הקובץ יכול להיראות כך:

הנקודה החשובה כאן היא שהחלפת Vector Store היא לא רק שינוי בקוד. גם סביבת ההרצה צריכה להתעדכן.

**build_rag.py עם ChromaDB**

במקום הפונקציה save_faiss_index, ניצור פונקציה חדשה בשם save_to_chroma.

```python
import shutil
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA_FILE = Path("data/starwars_ships_docs.txt")
CHROMA_DIR = Path("data/chroma_db")
COLLECTION_NAME = "starwars_docs"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"


def load_documents(file_path: Path) -> list[str]:
    text = file_path.read_text(encoding="utf-8")
    return [doc.strip() for doc in text.split("\n\n") if doc.strip()]


def chunk_documents(documents: list[str]) -> list[str]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=300,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for document in documents:
        chunks.extend(text_splitter.split_text(document))

    return chunks


def build_embeddings(chunks: list[str], model_name: str) -> list[list[float]]:
    model = SentenceTransformer(model_name)
    embeddings = model.encode(chunks, show_progress_bar=True)
    return embeddings.tolist()


def save_to_chroma(chunks: list[str], embeddings: list[list[float]]) -> None:
    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)

    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection(name=COLLECTION_NAME)

    ids = [f"chunk-{i}" for i in range(len(chunks))]
    metadatas = [{"chunk_index": i} for i in range(len(chunks))]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )


def main() -> None:
    documents = load_documents(DATA_FILE)
    chunks = chunk_documents(documents)
    embeddings = build_embeddings(chunks, EMBEDDING_MODEL)
    save_to_chroma(chunks, embeddings)

    print(f"Loaded {len(documents)} documents")
    print(f"Created {len(chunks)} chunks")
    print(f"Saved ChromaDB collection to {CHROMA_DIR}")


if __name__ == "__main__":
    main()
```

מה השתנה כאן?

במקום ליצור faiss.IndexFlatL2, אנחנו יוצרים:

```python
client = chromadb.PersistentClient(path=str(CHROMA_DIR))
collection = client.get_or_create_collection(name=COLLECTION_NAME)
```

כלומר, אנחנו עובדים מול מסד וקטורי מקומי שנשמר בתיקייה data/chroma_db.

ובמקום לשמור בנפרד אינדקס ומטא דאטה, אנחנו מכניסים ל Collection את כל הרכיבים יחד:

```python
collection.add(
    ids=ids,
    documents=chunks,
    embeddings=embeddings,
    metadatas=metadatas,
)
```

זה ההבדל המרכזי מול FAISS:

ב FAISS היינו צריכים לחבר לבד בין וקטור לבין הטקסט שלו.

ב ChromaDB החיבור הזה נשמר כחלק מה Collection.

**עדכון rag_client.py**

גם ה-Client צריך להשתנות. במקום לטעון index.faiss ו metadata.json, נטען Collection מתוך ChromaDB.

```python
import os
from pathlib import Path

import chromadb
from anthropic import Anthropic
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

CHROMA_DIR = Path("data/chroma_db")
COLLECTION_NAME = "starwars_docs"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
TOP_K = 10
LLM_MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = """You are a helpful assistant that answers questions using only the provided context chunks.
Rules:
- Answer only using information explicitly stated in the context.
- If the context does not contain enough information to answer, say you cannot answer from the provided context.
- Do not use outside knowledge or make assumptions beyond the context.
- Answer in a clear structure that fits the user's question.
"""


def load_collection():
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return client.get_collection(name=COLLECTION_NAME)


def search(question: str, collection, model: SentenceTransformer, top_k: int) -> list[dict]:
    query_embedding = model.encode(question).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "distances", "metadatas"],
    )

    retrieved = []
    for i in range(len(results["documents"][0])):
        retrieved.append(
            {
                "document": results["documents"][0][i],
                "distance": results["distances"][0][i],
                "metadata": results["metadatas"][0][i],
            }
        )

    return retrieved


def format_context(results: list[dict]) -> str:
    sections = []
    for rank, item in enumerate(results, start=1):
        sections.append(
            f"[Chunk {rank} | metadata: {item['metadata']}]\n{item['document']}"
        )
    return "\n\n".join(sections)


def answer_from_context(question: str, results: list[dict], client: Anthropic) -> str:
    context = format_context(results)

    response = client.messages.create(
        model=LLM_MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Context:\n{context}\n\n"
                    f"Question: {question}\n\n"
                    "Answer the question using only the context above."
                ),
            }
        ],
    )

    return response.content[0].text


def main() -> None:
    load_dotenv()

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise SystemExit("ANTHROPIC_API_KEY is not set. Add it to .env or your environment.")

    collection = load_collection()
    model = SentenceTransformer(EMBEDDING_MODEL)
    client = Anthropic(api_key=api_key)

    print("ChromaDB RAG client ready. Ask a question (empty line or 'quit' to exit).\n")

    while True:
        try:
            question = input("Question: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not question or question.lower() in {"quit", "exit", "q"}:
            break

        results = search(question, collection, model, TOP_K)
        answer = answer_from_context(question, results, client)

        print(f"\n=== Answer ===\n{answer}")

    print("Goodbye.")


if __name__ == "__main__":
    main()
```

החלק החשוב ביותר הוא זה:

```python
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=top_k,
    include=["documents", "distances", "metadatas"],
)
```

ב FAISS קיבלנו אינדקסים מספריים ואז היינו צריכים לשלוף לבד את הטקסטים מתוך metadata.json. כאן ChromaDB מחזיר לנו ישירות את ה Documents, המרחקים וה Metadata.

זו בדיוק הסיבה ש ChromaDB נוח יותר למערכת RAG: הוא לא רק מחפש וקטורים, אלא מנהל את הפריטים שנשלפים.

**איך לבדוק שהתרגיל הצליח**

מריצים קודם את הבנייה:

```bash
python build_rag.py
```

בודקים שנוצרה תיקייה:

```bash
data/chroma_db
```

אחר כך מריצים את ה-Client :

```bash
python rag_client.py
```

ושואלים לדוגמה:

```bash
What are the weaknesses of the TIE fighter?
```

או:

```bash
Which ships were used by the Rebel Alliance?
```

אם מתקבלת תשובה שמבוססת על המסמכים, והקוד כבר לא משתמש ב FAISS, התרגיל הצליח.

## פתרון תרגיל בית 3: הוספת מסמכים לאינדקס קיים

בתרגיל הקודם החלפנו את FAISS ב ChromaDB. זה הכין אותנו בדיוק לתרגיל הזה, כי עכשיו אנחנו רוצים לעשות משהו שמרגיש הרבה יותר כמו מערכת אמיתית: לא לבנות את המאגר מחדש בכל פעם, אלא לבדוק אם הוא כבר קיים, ואם צריך, להוסיף אליו מסמכים חדשים.

זו נקודה חשובה מאוד ב RAG.

במערכת לימודית אפשר למחוק את כל האינדקס בכל הרצה ולבנות אותו מחדש. זה פשוט, ברור ונוח. אבל במערכת אמיתית בסיס הידע חי. נוספים מסמכים חדשים, חלק מהמסמכים משתנים, לפעמים מוחקים מסמכים ישנים, ולפעמים רוצים להוסיף ידע בלי להתחיל הכול מאפס.

**המשימה בתרגיל הזה היא:**

לבדוק אם האינדקס קיים.

אם הוא לא קיים, ליצור אותו.

להוסיף 5 עד 10 מסמכים חדשים.

לוודא שמספר הווקטורים גדל.

ולבדוק ששאלות על המסמכים החדשים באמת מחזירות תשובות מתוך המידע החדש.

הדבר שחשוב ביותר להבין כאן הוא זה: אנחנו לא “מלמדים” את המודל את המסמכים החדשים. אנחנו מוסיפים את המסמכים החדשים למאגר ה Retrieval, כדי שבזמן שאלה המערכת תוכל לשלוף מהם Chunks ולהכניס אותם ל Context.

זו בדיוק ההבחנה בין RAG לבין Fine Tuning.

**מה נרצה לשנות בקוד**

בתרגיל הקודם כתבנו בתוך save_to_chroma קוד שמוחק את התיקייה הקיימת:

```python
if CHROMA_DIR.exists():
    shutil.rmtree(CHROMA_DIR)
```

בתרגיל הזה לא נרצה למחוק אותה.

אם נמשיך למחוק את התיקייה בכל פעם, לעולם לא באמת “נוסיף” מידע. בכל הרצה נבנה מאגר חדש מהתחלה.

לכן בתרגיל הזה נוריד את המחיקה, ונעבוד עם:

```python
collection = client.get_or_create_collection(name=COLLECTION_NAME)
```

**המשמעות היא פשוטה:**

אם ה Collection קיימת, נקבל אותה.

אם היא לא קיימת, ChromaDB ייצור אותה.

זה בדיוק מה שאנחנו צריכים.

**בעיה קטנה שצריך לפתור: מזהים כפולים**

כאשר מוסיפים מסמכים ל ChromaDB, כל Chunk חייב לקבל id ייחודי.

בתרגיל הקודם יצרנו ids בצורה כזאת:

```python
ids = [f"chunk-{i}" for i in range(len(chunks))]
```

זה טוב כאשר בונים הכול מאפס.

אבל אם האינדקס כבר קיים, זו בעיה. למה?

כי אם כבר יש chunk-0, chunk-1, chunk-2, ובהרצה הבאה ננסה להוסיף שוב chunk-0, נקבל כפילות מזהים.

לכן צריך לדעת כמה פריטים כבר קיימים ב Collection, ולהתחיל את המספור משם.

ב ChromaDB אפשר לבדוק כמה פריטים קיימים בעזרת:

```python
existing_count = collection.count()
```

ואז ליצור ids חדשים כך:

```python
ids = [f"chunk-{existing_count + i}" for i in range(len(chunks))]
```

אם כבר יש 100 Chunks, המסמך החדש הראשון יקבל chunk-100, אחריו chunk-101, וכך הלאה.

זו בדיוק החשיבה הנכונה במערכת שמוסיפה ידע לאורך זמן.

**גרסה פשוטה של build_rag.py לתרגיל 3**

להלן דוגמה ממוקדת לפונקציה המעודכנת:

```python
def save_to_chroma(chunks: list[str], embeddings: list[list[float]]) -> None:
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection(name=COLLECTION_NAME)

    existing_count = collection.count()

    ids = [f"chunk-{existing_count + i}" for i in range(len(chunks))]
    metadatas = [
        {
            "chunk_index": existing_count + i,
            "source": DATA_FILE.name,
        }
        for i in range(len(chunks))
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    print(f"Collection had {existing_count} vectors before insert")
    print(f"Added {len(chunks)} new vectors")
    print(f"Collection now has {collection.count()} vectors")
```

עכשיו נפרק את זה.

```python
client = chromadb.PersistentClient(path=str(CHROMA_DIR))
```

פותח חיבור למסד המקומי של ChromaDB.

```python
collection = client.get_or_create_collection(name=COLLECTION_NAME)
```

מבקש את ה Collection. אם היא קיימת, משתמשים בה. אם לא, יוצרים אותה.

```python
existing_count = collection.count()
```

בודק כמה וקטורים כבר קיימים באוסף.

זו שורה חשובה מאוד, כי היא מאפשרת לנו להוסיף ids חדשים בלי לדרוס ids קיימים.

```python
ids = [f"chunk-{existing_count + i}" for i in range(len(chunks))]
```

יוצר מזהים חדשים שממשיכים מהמקום שבו האוסף נעצר.

```python
metadatas = [
    {
        "chunk_index": existing_count + i,
        "source": DATA_FILE.name,
    }
    for i in range(len(chunks))
]
```

כאן אנחנו מוסיפים metadata בסיסי. לכל Chunk אנחנו שומרים את המספר שלו ואת שם קובץ המקור.

זה עדיין פשוט, אבל כבר יותר טוב מהתרגיל הקודם. במערכת אמיתית אפשר להוסיף כאן גם כותרת, תאריך, גרסה, סוג מסמך והרשאות.

```python
collection.add(...)
```

מוסיף את ה Chunks, ה Embeddings, ה ids וה metadata ל ChromaDB.

ולבסוף:

```python
print(f"Collection had {existing_count} vectors before insert")
print(f"Added {len(chunks)} new vectors")
print(f"Collection now has {collection.count()} vectors")
```

ההדפסות האלה חשובות מאוד לתרגיל. הן מאפשרות לראות שהמספר באמת גדל.

**איך יוצרים 5 עד 10 מסמכים חדשים**

אפשר להתחיל בצורה פשוטה: להוסיף לקובץ starwars_ships_docs.txt עוד כמה מסמכים, כאשר כל מסמך מופרד מהבא אחריו באמצעות שורה ריקה.

לדוגמה, אפשר להוסיף מסמכים על:

```bash
Naboo N-1 Starfighter
Jedi Temple Archives
Imperial Probe Droids
Mon Calamari Shipyards
Kessel Run Navigation
Clone Trooper Gunships
```

העיקר שכל מסמך יהיה טקסט קצר או בינוני, ושיהיה מופרד משאר המסמכים בשורה ריקה.

לאחר שמוסיפים מסמכים, מריצים:

```python
python build_rag.py
```

ואז בודקים את ההדפסה.

אם לפני ההוספה היו למשל 120 וקטורים, ואחרי ההרצה יש 148, סימן שנוספו 28 Chunks חדשים.

חשוב להבין: מספר המסמכים החדשים אינו שווה בהכרח למספר הווקטורים החדשים. כל מסמך יכול להתפרק לכמה Chunks, ולכן 5 מסמכים יכולים להפוך ל 10, 20 או יותר וקטורים, תלוי באורך המסמכים ובגודל ה Chunk.

**בדיקת הצלחה אמיתית**

לא מספיק לבדוק שהמספר גדל. צריך גם לשאול שאלה על אחד המסמכים החדשים.

לדוגמה, אם הוספתם מסמך על Naboo N-1 Starfighter, אפשר לשאול:

```bash
What is the Naboo N-1 Starfighter known for?
```

אם ה Retrieval תקין, המערכת אמורה לשלוף Chunk מתוך המסמך החדש.

כאן כדאי מאוד להפעיל הדפסה של התוצאות שנשלפו, כדי לראות לא רק את התשובה של המודל אלא גם את ה Context שנכנס אליו.

במילים אחרות, בדיקה טובה כוללת שני דברים:

האם מספר הווקטורים גדל.

האם שאלה על המסמכים החדשים מחזירה Chunks מהמסמכים החדשים.

**הערה חשובה על כפילויות**

בגרסה הפשוטה הזאת, אם תריצו את build_rag.py שוב ושוב על אותו קובץ, אותם מסמכים יתווספו שוב ושוב. כלומר, מספר הווקטורים יגדל, אבל יהיו כפילויות.

זה טוב כדי להבין את רעיון ההוספה, אבל זה לא מספיק למערכת אמיתית.

במערכת אמיתית נרצה למנוע כפילויות באמצעות מזהה יציב למסמך או ל Chunk. למשל, אפשר לחשב hash לטקסט של ה Chunk, ולבדוק אם הוא כבר קיים לפני שמוסיפים אותו.

אבל לתרגיל הנוכחי אין צורך לסבך. המטרה כאן היא להבין איך מוסיפים וקטורים לאינדקס קיים, ואיך בודקים שהמספר גדל.



## פתרון תרגיל בית 4: שינוי גודל ה Chunk וה Overlap

בתרגיל הזה אנחנו לא מחליפים ספרייה ולא מחליפים Vector Database. אנחנו משנים שני פרמטרים קטנים לכאורה, אבל כאלה שמשפיעים מאוד על איכות מערכת RAG:

```python
chunk_size
chunk_overlap
```

המשימה היא לשנות את גודל ה Chunk ל 150 ואת ה overlap ל 30, ואז לבדוק איך זה משפיע על מספר ה Chunks באינדקס.

**מה המשמעות של השינוי**

בגרסה הקודמת השתמשנו בערכים כאלה:

```python
chunk_size=1500
chunk_overlap=300
```

אבל חשוב לזכור: ב RecursiveCharacterTextSplitter, הערכים האלה הם בדרך כלל לפי תווים, לא לפי מילים.

לכן אם תרגיל הבית אומר “150 מילים ו 30 מילים חפיפה”, יש כאן שתי אפשרויות:

אפשרות פשוטה ללמידה: לעבוד לפי תווים ולהגדיר ערכים קטנים יותר.

אפשרות מדויקת יותר: לבנות Chunker שמודד מילים, או להישאר עם הפונקציה הידנית מהתרגיל המקורי.

מכיוון שבתרגיל הראשון כבר עברנו ל LangChain, הפתרון הפשוט יהיה לשנות את הערכים כך:

```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=150,
    chunk_overlap=30,
    separators=["\n\n", "\n", ". ", " ", ""],
)
```

חשוב לדעת: זה לא בדיוק 150 מילים, אלא 150 תווים.

**השינוי בקוד**

בפונקציה chunk_documents, נעדכן רק את ההגדרות של ה splitter:

```python
def chunk_documents(documents: list[str]) -> list[str]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=150,
        chunk_overlap=30,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for document in documents:
        chunks.extend(text_splitter.split_text(document))

    return chunks
```

זה כל השינוי המרכזי בתרגיל.

**מה צפוי לקרות אחרי השינוי**

כאשר מקטינים את chunk_size, כל מסמך מתפרק ליותר Chunks.

אם קודם Chunk אחד הכיל קטע גדול יחסית, עכשיו אותו טקסט יתפצל להרבה יחידות קטנות יותר. לכן אחרי הרצת build_rag.py, המספר שיודפס כאן צפוי לגדול:

```python
print(f"Created {len(chunks)} chunks")
```

לדוגמה, אם קודם נוצרו 80 Chunks, אחרי הקטנת ה Chunk size ייתכן שייווצרו 200 או יותר. המספר המדויק תלוי באורך המסמכים ובאופן שבו ה splitter מצליח לחתוך לפי separators.

**למה זה חשוב ל RAG**

גודל Chunk משפיע על איכות ה Retrieval.

Chunk קטן יותר יכול להיות ממוקד יותר. אם המשתמש שואל שאלה מאוד ספציפית, Chunk קטן יכול לעזור למערכת לשלוף קטע מדויק יותר.

אבל יש גם חיסרון. Chunk קטן מדי עלול לאבד הקשר. המודל יקבל משפט או קטע קצר מאוד, ולא תמיד יהיה לו מספיק מידע כדי להבין את התמונה המלאה.

גם ה overlap חשוב.

Overlap של 30 אומר שחלק קטן מסוף Chunk אחד יופיע גם בתחילת ה Chunk הבא. זה עוזר לשמור רצף בין קטעים, במיוחד כאשר רעיון נחתך בגבול בין שני Chunks.

**איך לבדוק את התרגיל**

אחרי השינוי מריצים שוב:

```bash
python build_rag.py
```

ובודקים את ההדפסה:

```bash
Loaded X documents
Created Y chunks
Saved ChromaDB collection to data/chroma_db
```

המספר החשוב הוא Created Y chunks.

כדאי להשוות אותו למספר שהיה לפני השינוי.

לפני השינוי, רשמו כמה Chunks נוצרו.

אחרי השינוי ל chunk_size=150 ו chunk_overlap=30, הריצו שוב את ה-build ורשמו את המספר החדש.

אם המספר גדל, זה סימן שהמסמכים התפצלו ליותר יחידות קטנות.

**בדיקה איכותית, לא רק מספרית**

המספר חשוב, אבל הוא לא מספיק.

אחרי ה-build , כדאי להריץ את ה Client ולשאול את אותן שאלות שבדקנו קודם:

```bash
What are the weaknesses of the TIE fighter?
Which ships were used by the Rebel Alliance?
What role did droids play in the war?
```

עכשיו צריך לבדוק:

האם התשובות נהיו מדויקות יותר.

האם התשובות איבדו הקשר.

האם המודל מקבל Chunks קצרים מדי.

האם יש יותר Chunks דומים שחוזרים בתוצאות.

זו הנקודה החשובה: שינוי Chunk size לא נמדד רק לפי כמה Chunks נוצרו, אלא לפי איכות התשובות שמתקבלות בסוף.

**הערה חשובה לתלמידים**

אם משתמשים ב ChromaDB ובתרגיל הקודם שינינו את הקוד כך שהוא מוסיף למסד קיים, צריך להיזהר.

בתרגיל הזה אנחנו רוצים להשוות בין אינדקס שנבנה עם Chunk size ישן לבין אינדקס שנבנה עם Chunk size חדש. לכן עדיף למחוק את המאגר הקיים או לבנות Collection חדשה, אחרת תערבבו Chunks ישנים וחדשים באותו מאגר.

למשל, אפשר לשנות את שם ה Collection:

```python
COLLECTION_NAME = "starwars_docs_chunk_150"
```

או למחוק את תיקיית ChromaDB לפני הרצה, אם רוצים בנייה נקייה.

**מה התרגיל הזה מלמד**

התרגיל הזה מלמד ש Chunking הוא לא פרט שולי.

אותו מאגר מסמכים יכול להפוך למספר שונה לגמרי של Chunks לפי ההגדרות שנבחר.

וכאשר מספר ה Chunks משתנה, גם החיפוש משתנה, גם ה Context משתנה, וגם התשובה של המודל יכולה להשתנות.

זו בדיוק הסיבה שבמערכת RAG אמיתית לא בוחרים chunk_size ו overlap לפי תחושת בטן בלבד. בוחרים ערכים, מריצים שאלות בדיקה, משווים תוצאות, ואז מכווננים.

## פתרון תרגיל בית 5: שינוי top_k ל 10 ובדיקת ההשפעה על ה Context

בתרגיל האחרון אנחנו משנים פרמטר קטן מאוד בקוד, אבל כזה שיש לו השפעה גדולה על התנהגות מערכת RAG.

הפרמטר הוא:

```python
TOP_K
```

המשמעות שלו פשוטה: כמה Chunks המערכת תחזיר משלב ה Retrieval ותכניס ל Context של המודל.

אם TOP_K = 3, המודל יקבל שלושה קטעים בלבד.

אם TOP_K = 10, המודל יקבל עשרה קטעים.

לכאורה, עשרה קטעים נשמע טוב יותר משלושה, כי המודל מקבל יותר מידע. אבל בעולם RAG זה לא תמיד נכון. יותר מידע יכול לעזור, אבל הוא גם יכול להכניס רעש, כפילויות, או קטעים שרק קשורים בעקיפין לשאלה.

זה בדיוק מה שהתרגיל הזה בא ללמד.

**השינוי בקוד**

בקובץ rag_client.py נחפש את ההגדרה:

```python
TOP_K = 3
```

ונשנה אותה ל:

```python
TOP_K = 10
```

אם בקוד שלכם כבר מופיע:

```python
TOP_K = 10
```

אז התרגיל כבר מיושם מבחינת הערך, אבל עדיין חשוב לבצע את הבדיקה הלימודית: להשוות בפועל בין 3 לבין 10.

הדרך הכי טובה היא להריץ פעם אחת עם:

```python
TOP_K = 3
```

ואחר כך להריץ שוב עם:

```python
TOP_K = 10
```

ולשאול בדיוק את אותן שאלות.

**למה top_k משפיע כל כך**

במערכת RAG, ה Retrieval לא מחזיר תשובה. הוא מחזיר חומר גלם.

החומר הזה נכנס ל Context Window, ורק אחר כך המודל מנסח תשובה. לכן כל שינוי ב top_k משנה את החומר שהמודל רואה.

כאשר top_k קטן מדי, ייתכן שהמודל יקבל מעט מדי מידע. למשל, הוא יקבל Chunk אחד שמדבר על TIE Fighters, אבל לא יקבל Chunk נוסף שמסביר את ההבדל בין TIE Fighter לבין TIE Interceptor.

כאשר top_k גדול מדי, ייתכן שהמודל יקבל יותר מדי מידע. חלק מהקטעים יהיו רלוונטיים, אבל חלקם יהיו רק קרובים סמנטית ולא באמת נחוצים. במצב כזה התשובה יכולה להיות ארוכה יותר, פחות ממוקדת, ולעיתים גם מעט מבולבלת.

כלומר, top_k שולט באיזון בין חוסר מידע לבין עודף מידע.

**איך לבדוק את ההבדל בצורה נכונה**

לא כדאי לבדוק את התרגיל עם שאלה אחת בלבד. עדיף לבחור כמה שאלות קבועות ולבדוק אותן בשתי הרצות.

לדוגמה:

```bash
What are the weaknesses of the TIE fighter?
Which ships were used by the Rebel Alliance?
What role did droids play in the Galactic Civil War?
How did the Millennium Falcon differ from a standard freighter?
```

מריצים את השאלות פעם אחת עם:

```python
TOP_K = 3
```

ואחר כך עם:

```python
TOP_K = 10
```

ובודקים את ההבדלים.

**מה כדאי לבדוק בתשובות**

בבדיקה עם TOP_K = 3, שימו לב האם התשובה קצרה יותר, ממוקדת יותר, אבל אולי חסר בה מידע חשוב.

בבדיקה עם TOP_K = 10, שימו לב האם התשובה עשירה יותר, אבל אולי כוללת מידע פחות קשור.

הקריטריונים החשובים הם:

האם התשובה עונה בדיוק על השאלה.

האם המודל השתמש במידע רלוונטי בלבד.

האם נכנסו פרטים מיותרים.

האם התשובה נהייתה ארוכה מדי.

האם יש ערבוב בין נושאים קרובים.

האם Context גדול יותר באמת שיפר את התוצאה.

זו נקודה חשובה מאוד: לא מודדים RAG לפי כמות המידע שנשלפה, אלא לפי איכות התשובה שנוצרה ממנו.

**מומלץ להדפיס את ה Chunks שנשלפו**

בשלב הזה כדאי מאוד להפעיל את הדפסת התוצאות שנשלפו.

אם עדיין קיימת פונקציה כמו:

```python
print_results(results)
```

אפשר להחזיר אותה לפעולה:

```python
results = search(question, collection, model, TOP_K)
print_results(results)
answer = answer_from_context(question, results, client)
```

אם עברתם ל ChromaDB והמבנה של results הוא רשימת dictionaries, אפשר להוסיף פונקציה פשוטה:

```python
def print_results(results: list[dict]) -> None:
    for rank, item in enumerate(results, start=1):
        print(f"\n--- Result {rank} ---")
        print(f"Distance: {item['distance']}")
        print(f"Metadata: {item['metadata']}")
        print(item["document"])
```

כך אפשר לראות בדיוק מה נכנס ל Context.

זה חשוב, כי בלי לראות את ה Chunks, קשה להבין למה המודל ענה כפי שענה. לפעמים התשובה לא טובה לא בגלל המודל, אלא בגלל שה Retrieval הכניס לו Context חלש או רועש.

**מה התרגיל הזה מלמד**

התרגיל הזה מלמד עיקרון מרכזי ב RAG:

יותר Context אינו בהכרח Context טוב יותר.

המטרה אינה להכניס למודל כמה שיותר מידע. המטרה היא להכניס את המידע הנכון.

TOP_K = 3 יכול להיות מצוין לשאלות ממוקדות.

TOP_K = 10 יכול להיות טוב לשאלות רחבות יותר, שדורשות כמה מקורות או כמה זוויות.

אבל אם השאלה פשוטה, עשרה Chunks עלולים להכביד על התשובה.

לכן במערכת אמיתית לא בוחרים top_k פעם אחת ושוכחים ממנו. בודקים אותו מול שאלות אמיתיות, משווים תוצאות, ולעיתים אפילו משנים אותו דינמית לפי סוג השאלה.

לדוגמה:

שאלה פשוטה יכולה להשתמש ב top_k = 3.

שאלה רחבה יכולה להשתמש ב top_k = 10.

שאלה רגישה או מורכבת יכולה להשתמש ב Retrieval רחב ואז Re Ranking.

זו כבר חשיבה מתקדמת יותר של AI Engineering.
