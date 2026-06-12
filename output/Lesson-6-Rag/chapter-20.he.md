# החלק המעשי: בניית RAG אמיתי עם Python ו FAISS

עד עכשיו למדנו את RAG דרך הרעיונות שמרכיבים אותו: Context Window, Chunks, Embeddings, Similarity, Vector Database, Retrieval ו Generate. אלה מושגים חשובים, אבל בשלב מסוים חייבים לראות אותם יורדים לקרקע. כלומר, לא רק להבין שצריך “לשלוף מידע רלוונטי”, אלא לראות איך קובץ טקסט רגיל הופך למאגר שאפשר לשאול עליו שאלות.

החלק המעשי של השיעור עושה בדיוק את המעבר הזה. הוא לוקח קובץ מסמכים פשוט, בונה ממנו אינדקס וקטורי בעזרת FAISS, מאפשר למשתמש לשאול שאלה בשורת הפקודה, שולף את הקטעים הקרובים ביותר לשאלה, ואז מעביר את הקטעים האלה למודל שפה כדי שינסח תשובה על בסיסם בלבד.

זו מערכת קטנה, אבל היא מכילה את הלב של RAG אמיתי.

הקוד המקורי של התרגיל נמצא בתיקיית השיעור ב GitHub:



מומלץ לפתוח את התיקייה בזמן הקריאה. בפרק הזה נפרק את הקבצים המרכזיים, נסביר מה כל אחד מהם עושה, למה הוא קיים, ואיך אפשר לקחת את אותו דפוס ולהפעיל אותו אחר כך על מסמכים שלכם.

**]Practical RAG Pipeline in Python[**

<img src="/Lesson-6-Rag/assets/image-16.png" alt="image-16.png" width="709" height="399" />

.

## מה הפרויקט הזה בונה

הפרויקט בנוי משני חלקים גדולים.

החלק הראשון נקרא שלב הבנייה. זהו שלב ה Index. בשלב הזה המערכת קוראת את המסמכים, מחלקת אותם ל Chunks, מייצרת Embeddings לכל Chunk, ושומרת את הווקטורים באינדקס FAISS.

החלק השני נקרא שלב השימוש. זהו שלב ה Retrieve וה Generate. בשלב הזה המשתמש שואל שאלה, המערכת הופכת את השאלה לווקטור, מחפשת באינדקס את ה Chunks הקרובים ביותר, בונה מהם Context, ושולחת את ה Context למודל שפה כדי לקבל תשובה.

במונחים של RAG, הפרויקט מממש את השרשרת הזאת:

**Index**: הכנת המסמכים ושמירתם כאינדקס וקטורי.

**Retrieve**: שליפת הקטעים הרלוונטיים ביותר לשאלה.

**Generate**: יצירת תשובה על בסיס הקטעים שנשלפו.

זו בדיוק הנקודה שבה RAG מפסיק להיות תרשים והופך למערכת שאפשר להריץ.

## קובץ ההנחיות: מה התרגיל ביקש לבנות

לפני שנכנסים לקוד, כדאי להתחיל מהדרישה. בקובץ prompts.docx מופיעות שלוש משימות מרכזיות.

**הראשונה** היא לבנות תוכנית Python שקוראת את starwars_ships_docs.txt, שבו המסמכים מופרדים באמצעות שורה ריקה, ובונה מהם אינדקס FAISS. הדרישה כוללת שימוש במודל all-MiniLM-L6-v2, חלוקה ל Chunks של עד 400 מילים, חפיפה של 50 מילים, ושמירה על משפטים שלמים בלי לחתוך משפט באמצע.

**המשימה השנייה** היא לבנות Client RAG שמקבל שאלה מהמשתמש דרך שורת הפקודה ומדפיס את שלושת ה Chunks הקרובים ביותר.

**המשימה השלישית** היא להוסיף ל-Client קריאה למודל Claude Haiku 4.5, כדי שהמודל ינסח תשובה יפה לאחר שהמידע הרלוונטי נשלף.

כבר בדרישה אפשר לראות את מבנה המערכת:

- יש מקור ידע.

- יש Builder שבונה אינדקס.

- יש Client ששואל את האינדקס.

- יש LLM שמנסח תשובה.

זה בדיוק RAG.

## קובץ הנתונים: starwars_ships_docs.txt

הקובץ starwars_ships_docs.txt הוא בסיס הידע של התרגיל. הוא מכיל הרבה מסמכים טקסטואליים בנושאים מעולם Star Wars: ספינות, קרבות, דמויות, Jedi, Sith, Droids, Smugglers, Bounty Hunters ועוד. מבחינת הלמידה, לא חשוב שהתוכן הוא Star Wars. מה שחשוב הוא שהקובץ מתנהג כמו מאגר ידע טקסטואלי. במערכת אמיתית, במקום הקובץ הזה היו יכולים להיות נהלי חברה, מסמכי תמיכה, תיעוד API, מסמכי אפיון או חומרי קורס.

לדוגמה, אחד המסמכים מתאר את ה TIE Fighter, כולל הפילוסופיה האימפריאלית של ייצור בכמויות גדולות, ויתור על שרידות הטייס, ותלות בבסיסים או נושאות קרב. מסמך אחר מתאר את X Wing, Y Wing, A Wing ו B Wing ואת ההבדל בין פילוסופיית הקרב של המורדים לבין האימפריה.

למה זה מעניין עבור RAG?

כי שאלות אמיתיות לא תמיד ישתמשו באותן מילים שמופיעות במסמך. משתמש יכול לשאול על “fast Rebel fighters”, והמידע הרלוונטי אולי נמצא במסמך שמשתמש במונחים כמו “RZ 1 A wing interceptors” או “starfighter doctrine”. לכן צריך Embeddings וחיפוש סמנטי. לא מספיק חיפוש מילות מפתח פשוט.

## requirements.txt: התלויות של הפרויקט

קובץ requirements.txt שמצורף לתרגיל כולל את התלויות הבאות:

- sentence-transformers

- faiss-cpu

- numpy

אלה שלוש ספריות חשובות מאוד.

**sentence-transformers** משמשת ליצירת Embeddings. היא מאפשרת לקחת טקסט, למשל Chunk מתוך מסמך או שאלה של משתמש, ולהמיר אותו לווקטור מספרי.

**faiss-cpu** היא גרסת CPU של FAISS. היא משמשת לבניית אינדקס וקטורי ולחיפוש וקטורים קרובים.

**numpy** משמשת לעבודה עם מערכים מספריים. מכיוון ש Embeddings הם מערכים של מספרים, כמעט כל עבודה רצינית איתם תעבור דרך ספרייה כמו numpy.

אבל יש כאן נקודה חשובה. הקובץ rag_client.py משתמש גם בספריות anthropic ו dotenv, כלומר כדי להריץ את כל הפרויקט כפי שהוא כתוב, לא רק את בניית האינדקס, צריך להוסיף גם אותן. בקוד רואים שימוש ב Anthropic וב load_dotenv, ולכן requirements.txt המלא יותר צריך לכלול גם את anthropic ואת python-dotenv.

**גרסה מלאה יותר של הקובץ תהיה:**

sentence-transformers

faiss-cpu

numpy

anthropic

python-dotenv

זו דוגמה קטנה אבל חשובה לחשיבה של מפתח. לא מספיק לשאול אם הקוד נכון לוגית. צריך לוודא שגם סביבת ההרצה כוללת את כל מה שהקוד באמת צריך.

## build_rag.py: בניית בסיס הידע הווקטורי

הקובץ build_rag.py הוא הקובץ שבונה את המאגר. הוא לא שואל שאלות, לא קורא למודל שפה, ולא מחזיר תשובות למשתמש. הוא מכין את הקרקע. הוא לוקח טקסטים ומייצר מהם אינדקס וקטורי שאפשר יהיה לחפש בו אחר כך.

להלן הקובץ במלואו:

```python
"""Build a FAISS index from Star Wars ship documents."""

import json
import re
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

DATA_FILE = Path("data/starwars_ships_docs.txt")
INDEX_DIR = Path("data/faiss_index")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
MAX_WORDS = 300
OVERLAP_WORDS = 50


def load_documents(file_path: Path) -> list[str]:
    """Load documents separated by blank lines."""
    text = file_path.read_text(encoding="utf-8")
    documents = [doc.strip() for doc in text.split("\n\n") if doc.strip()]
    return documents


def split_into_sentences(text: str) -> list[str]:
    """Split text into sentences without breaking them apart later."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [sentence for sentence in sentences if sentence]


def count_words(text: str) -> int:
    return len(text.split())


def chunk_document(text: str, max_words: int, overlap_words: int) -> list[str]:
    """Chunk one document into overlapping sentence-based pieces."""
    sentences = split_into_sentences(text)
    if not sentences:
        return []

    chunks = []
    start_idx = 0

    while start_idx < len(sentences):
        chunk_sentences = []
        word_count = 0
        end_idx = start_idx

        while end_idx < len(sentences):
            sentence = sentences[end_idx]
            sentence_words = count_words(sentence)

            if chunk_sentences and word_count + sentence_words > max_words:
                break

            chunk_sentences.append(sentence)
            word_count += sentence_words
            end_idx += 1

        chunks.append(" ".join(chunk_sentences))

        if end_idx >= len(sentences):
            break

        overlap_count = 0
        next_start = end_idx
        for idx in range(end_idx - 1, start_idx - 1, -1):
            overlap_count += count_words(sentences[idx])
            next_start = idx
            if overlap_count >= overlap_words:
                break

        if next_start <= start_idx:
            next_start = start_idx + 1

        start_idx = next_start

    return chunks


def chunk_documents(documents: list[str], max_words: int, overlap_words: int) -> list[str]:
    """Chunk all documents and return a flat list of text chunks."""
    all_chunks = []
    for document in documents:
        all_chunks.extend(chunk_document(document, max_words, overlap_words))
    return all_chunks


def build_embeddings(chunks: list[str], model_name: str) -> np.ndarray:
    """Embed text chunks with the given sentence-transformers model."""
    model = SentenceTransformer(model_name)
    embeddings = model.encode(chunks, show_progress_bar=True)
    return np.array(embeddings, dtype="float32")


def save_faiss_index(embeddings: np.ndarray, chunks: list[str], output_dir: Path) -> None:
    """Save the FAISS index and chunk metadata to disk."""
    output_dir.mkdir(parents=True, exist_ok=True)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    faiss.write_index(index, str(output_dir / "index.faiss"))

    metadata = {"model": EMBEDDING_MODEL, "chunks": chunks}
    (output_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    documents = load_documents(DATA_FILE)
    chunks = chunk_documents(documents, MAX_WORDS, OVERLAP_WORDS)
    embeddings = build_embeddings(chunks, EMBEDDING_MODEL)
    save_faiss_index(embeddings, chunks, INDEX_DIR)

    print(f"Loaded {len(documents)} documents")
    print(f"Created {len(chunks)} chunks")
    print(f"Saved FAISS index to {INDEX_DIR}")


if __name__ == "__main__":
    main()
```

## מה קורה בתחילת build_rag.py

הקובץ מתחיל במשפט תיעוד קצר:

```python
"""Build a FAISS index from Star Wars ship documents."""
```

זה נראה כמו הערה קטנה, אבל היא חשובה. היא אומרת לנו מה תפקיד הקובץ: לא לענות למשתמש, אלא לבנות אינדקס FAISS מתוך מסמכים.

אחר כך מגיעים ה import:

```python
import json
import re
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
```

כל import מייצג צורך אחר במערכת.

**json** נדרש כדי לשמור מידע נלווה לקובץ. במקרה שלנו, נשמור את רשימת ה Chunks ואת שם מודל ה Embedding בקובץ metadata.json.

**re** נדרש כדי לפצל טקסט למשפטים בעזרת ביטוי רגולרי.

**Path** מאפשר לעבוד עם נתיבי קבצים בצורה נקייה.

**faiss** הוא מנוע החיפוש הווקטורי.

**numpy** נדרש כי FAISS מצפה לקבל מערכים מספריים.

**SentenceTransformer** הוא הכלי שטוען את מודל ה Embedding וממיר טקסט לווקטור.

כבר בחלק הזה אפשר לראות את כל הסיפור של RAG: יש טקסט, יש עיבוד טקסט, יש וקטורים, יש אינדקס, ויש מטא דאטה.

**ההגדרות הקבועות**

```python
DATA_FILE = Path("data/starwars_ships_docs.txt")
INDEX_DIR = Path("data/faiss_index")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
MAX_WORDS = 300
OVERLAP_WORDS = 50
```

אלה הקבועים שמגדירים איך הפרויקט עובד.

- **DATA_FILE** הוא הנתיב לקובץ המסמכים.

- **INDEX_DIR** הוא הנתיב שאליו יישמרו האינדקס והמטא דאטה.

- **EMBEDDING_MODEL** הוא שם מודל ה Embedding.

- **MAX_WORDS** הוא מספר המילים המרבי בכל Chunk.

- **OVERLAP_WORDS** הוא מספר המילים שיחפפו בין Chunk אחד לבא אחריו.

**יש נקודה כאן שכדאי לשים לב אליה:** בהנחיות המקוריות נכתב שגודל Chunk יהיה עד 400 מילים, אבל בקוד בפועל מוגדר MAX_WORDS = 300. זה לא בהכרח שגוי, אבל זו אי התאמה בין הדרישה לבין המימוש. כשרוצים להפוך תרגיל לקוד מסודר, צריך להחליט מה הערך הנכון ולעדכן את הקוד או את ההנחיה בהתאם.

זו לא רק הערה טכנית. היא מלמדת עיקרון חשוב: במערכות AI, פרטים קטנים כמו גודל Chunk יכולים לשנות את איכות התוצאה.



**load_documents: להפוך קובץ אחד לרשימת מסמכים**

```python
def load_documents(file_path: Path) -> list[str]:
    """Load documents separated by blank lines."""
    text = file_path.read_text(encoding="utf-8")
    documents = [doc.strip() for doc in text.split("\n\n") if doc.strip()]
    return documents
```

הפונקציה הזאת עושה את הצעד הראשון במערכת: היא טוענת את הידע.

היא מקבלת נתיב לקובץ, קוראת את כל הקובץ כטקסט, ואז מפצלת אותו לפי \n\n, כלומר לפי שורה ריקה. כך כל פסקה גדולה או מקטע שמופרד בשורה ריקה הופך למסמך בפני עצמו.

השורה הזאת היא לב הפונקציה:

```python
documents = [doc.strip() for doc in text.split("\n\n") if doc.strip()]
```

**היא עושה שלושה דברים בבת אחת.**

1. היא מפצלת את הטקסט למסמכים.

2. היא מנקה רווחים מיותרים מכל מסמך.

3. היא מסננת מקטעים ריקים.

**למה זה חשוב?**

כי RAG מתחיל מהאופן שבו טוענים את הידע. אם הטעינה לא נכונה, כל השלבים הבאים ייבנו על בסיס שגוי. אם למשל המסמכים לא היו מופרדים נכון, המערכת הייתה עלולה לחשוב שכל הקובץ הוא מסמך אחד ענק, ואז ה Chunking וה Retrieval היו פחות מדויקים.



**split_into_sentences: למה אסור לחתוך משפט באמצע**

```python
def split_into_sentences(text: str) -> list[str]:
    """Split text into sentences without breaking them apart later."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [sentence for sentence in sentences if sentence]
```

הפונקציה הזאת מחלקת טקסט למשפטים.

הביטוי הרגולרי:

```python
r"(?<=[.!?])\s+"
```

מחפש רווח שמופיע אחרי נקודה, סימן קריאה או סימן שאלה. כלומר, הוא מנסה למצוא גבולות טבעיים בין משפטים.

הסיבה שזה חשוב היא שהדרישה המקורית אמרה במפורש לא לחתוך משפטים באמצע.

ב RAG, חיתוך משפט באמצע יכול לפגוע מאוד בהבנה. אם Chunk מכיל רק חצי משפט, המודל יקבל טקסט שנראה לא שלם. ואם הטקסט לא שלם, גם התשובה עלולה להיות לא שלמה.

Chunk טוב צריך להיות לא רק בגודל מתאים, אלא גם בעל משמעות. משפט שלם הוא יחידת משמעות בסיסית. לכן הקוד קודם מחלק למשפטים, ורק אחר כך בונה מהם Chunks.

## count_words: פונקציה קטנה שמאפשרת שליטה בגודל

```python
def count_words(text: str) -> int:
    return len(text.split())
```

זו פונקציה קטנה מאוד, אבל היא חשובה. היא סופרת מילים.

למה צריך אותה?

כי אנחנו לא רוצים ש Chunk יהיה גדול מדי. אם Chunk גדול מדי, הוא יכיל יותר מדי רעיונות שונים, וה Embedding שלו יהיה פחות ממוקד. אם Chunk קטן מדי, הוא עלול לאבד הקשר.

לכן צריך לספור מילים ולבנות Chunks בצורה מבוקרת.



**chunk_document: הפונקציה החשובה ביותר בשלב ההכנה**

```python
def chunk_document(text: str, max_words: int, overlap_words: int) -> list[str]:
    """Chunk one document into overlapping sentence-based pieces."""
```

זו אחת הפונקציות החשובות ביותר בכל הפרויקט.

היא מקבלת מסמך אחד ומחזירה רשימת Chunks.

היא מתחילה כך:

```python
sentences = split_into_sentences(text)
if not sentences:
    return []
```

קודם היא מחלקת את המסמך למשפטים. אם אין משפטים, אין מה לעבד, ולכן היא מחזירה רשימה ריקה.

אחר כך:

```python
chunks = []
start_idx = 0
```

**chunks** היא הרשימה שבה נשמור את כל ה Chunks שניצור.

**start_idx** מסמן מאיזה משפט מתחילים לבנות את ה Chunk הבא.

הלולאה הראשית היא:

```python
while start_idx < len(sentences):
```

כל עוד יש משפטים שלא עובדו, נמשיך ליצור Chunks.

בתוך הלולאה נוצרים משתנים חדשים עבור ה Chunk הנוכחי:

```python
chunk_sentences = []
word_count = 0
end_idx = start_idx
```

chunk_sentences יחזיק את המשפטים של ה Chunk.

word_count יספור כמה מילים כבר הכנסנו.

end_idx יתקדם קדימה בתוך רשימת המשפטים.

החלק הבא בונה את ה Chunk בפועל:

```python
while end_idx < len(sentences):
    sentence = sentences[end_idx]
    sentence_words = count_words(sentence)

    if chunk_sentences and word_count + sentence_words > max_words:
        break

    chunk_sentences.append(sentence)
    word_count += sentence_words
    end_idx += 1
```

הקוד לוקח משפטים אחד אחרי השני ומכניס אותם ל Chunk, כל עוד לא עוברים את מגבלת המילים.

התנאי:

```python
if chunk_sentences and word_count + sentence_words > max_words:
    break
```

הקוד אומר: אם כבר יש משפט אחד לפחות בתוך ה Chunk, והוספת המשפט הבא תעבור את מגבלת המילים, עוצרים.

למה יש כאן בדיקה של chunk_sentences?

כדי לא להיתקע במקרה שבו משפט אחד ארוך יותר מהמגבלה. אם ה Chunk עדיין ריק, הקוד יאפשר להכניס את המשפט, גם אם הוא ארוך. אחרת יכול להיווצר מצב שבו הקוד לא מוסיף כלום ולא מתקדם.

אחרי שה Chunk מוכן, הוא נשמר:

```python
chunks.append(" ".join(chunk_sentences))
```

כל המשפטים שנאספו מחוברים לטקסט אחד.

**למה יש overlap בין Chunks**

אחרי שנבנה Chunk, הקוד בודק אם הגענו לסוף:

```python
if end_idx >= len(sentences):
    break
```

אם לא הגענו לסוף, צריך להחליט מאיפה יתחיל ה Chunk הבא.

כאן נכנס ה overlap:

```python
overlap_count = 0
next_start = end_idx
for idx in range(end_idx - 1, start_idx - 1, -1):
    overlap_count += count_words(sentences[idx])
    next_start = idx
    if overlap_count >= overlap_words:
        break
```

הקוד הולך אחורה מסוף ה Chunk הנוכחי, ואוסף בערך 50 מילים. המשפטים האלה יופיעו גם בתחילת ה Chunk הבא.

למה עושים את זה?

כי לפעמים רעיון חשוב יושב בדיוק על הגבול בין שני Chunks. אם אין חפיפה, ההקשר עלול להיחתך. עם חפיפה, יש סיכוי גבוה יותר שה Chunk הבא עדיין יכיל את סוף הרעיון הקודם.

זו נקודה חשובה מאוד ב RAG. Overlap אינו בזבוז. הוא מנגנון שמגן על ההקשר.

בסוף הפונקציה יש הגנה קטנה:

```python
if next_start <= start_idx:
    next_start = start_idx + 1
```

היא מבטיחה שהפונקציה תמיד תתקדם קדימה ולא תיכנס ללולאה אינסופית.

ואז:

```python
start_idx = next_start
```

ה Chunk הבא יתחיל מהמקום החדש.

**chunk_documents: להריץ Chunking על כל המסמכים**

```python
def chunk_documents(documents: list[str], max_words: int, overlap_words: int) -> list[str]:
    """Chunk all documents and return a flat list of text chunks."""
    all_chunks = []
    for document in documents:
        all_chunks.extend(chunk_document(document, max_words, overlap_words))
    return all_chunks
```

הפונקציה הזאת מקבלת רשימת מסמכים ומפעילה **chunk_document** על כל אחד מהם.

בסוף היא מחזירה רשימה אחת שטוחה של כל ה Chunks מכל המסמכים.

זו בחירה פשוטה וטובה לתרגיל. במערכת אמיתית, כדאי לשמור גם metadata לכל Chunk, למשל שם המסמך, כותרת, תאריך, גרסה וסוג מקור. כאן נשמר רק הטקסט של ה Chunk, וזה מספיק כדי להבין את המנגנון.

**build_embeddings: להפוך טקסט לווקטורים**

```python
def build_embeddings(chunks: list[str], model_name: str) -> np.ndarray:
    """Embed text chunks with the given sentence-transformers model."""
    model = SentenceTransformer(model_name)
    embeddings = model.encode(chunks, show_progress_bar=True)
    return np.array(embeddings, dtype="float32")
```

זו הפונקציה שמממשת את שלב ה Embedding.

היא טוענת את מודל ה Embedding:

```python
model = SentenceTransformer(model_name)
```

ואז ממירה את כל ה Chunks לווקטורים:

```python
embeddings = model.encode(chunks, show_progress_bar=True)
```

כל Chunk שהיה טקסט הופך עכשיו למערך של מספרים.

למה צריך את זה?

כי FAISS לא מחפש טקסט. FAISS מחפש וקטורים. כדי שאפשר יהיה למצוא Chunks דומים לשאלה של המשתמש, גם ה Chunks וגם השאלה צריכים להיות מיוצגים כווקטורים.

בסוף הפונקציה מחזירה numpy array מסוג float32:

```python
return np.array(embeddings, dtype="float32")
```

הסוג float32 נפוץ מאוד בעבודה עם Embeddings, כי הוא יעיל בזיכרון ומתאים ל FAISS.

**save_faiss_index: לשמור את האינדקס ואת הטקסט המקורי**

```python
def save_faiss_index(embeddings: np.ndarray, chunks: list[str], output_dir: Path) -> None:
    """Save the FAISS index and chunk metadata to disk."""
    output_dir.mkdir(parents=True, exist_ok=True)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    faiss.write_index(index, str(output_dir / "index.faiss"))

    metadata = {"model": EMBEDDING_MODEL, "chunks": chunks}
    (output_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )
```

הפונקציה הזאת שומרת את תוצרי הבנייה.

קודם היא יוצרת את תיקיית הפלט:

```python
output_dir.mkdir(parents=True, exist_ok=True)
```

אחר כך היא מחשבת את מספר הממדים של הווקטורים:

```python
dimension = embeddings.shape[1]
```

אם כל Embedding הוא וקטור באורך 384, אז dimension יהיה 384.

עכשיו נוצר אינדקס FAISS:

```python
index = faiss.IndexFlatL2(dimension)
```

IndexFlatL2 הוא אינדקס פשוט שמחשב מרחק L2. המילה Flat אומרת שהוא לא משתמש באלגוריתם ANN מתוחכם. הוא שומר את כל הווקטורים ובחיפוש משווה מול כולם.

זה מצוין ללמידה, כי זה פשוט ומדויק. במערכות גדולות מאוד, ייתכן שנרצה אינדקס מתקדם יותר.

אחר כך מוסיפים את ה Embeddings:

```python
index.add(embeddings)
```

ושומרים את האינדקס לקובץ:

```python
faiss.write_index(index, str(output_dir / "index.faiss"))
```

אבל כאן מגיעה נקודה קריטית.

FAISS שומר וקטורים. הוא לא יודע לבד מה הטקסט המקורי של כל וקטור. לכן שומרים קובץ נוסף:

```python
metadata = {"model": EMBEDDING_MODEL, "chunks": chunks}
```

הקובץ metadata.json שומר את שם מודל ה Embedding ואת רשימת ה Chunks.

כאשר נחפש באינדקס, FAISS יחזיר לנו אינדקסים מספריים, למשל Chunk מספר 17 או 42. בעזרת metadata.json נוכל להפוך את המספר הזה בחזרה לטקסט המקורי.

זו נקודה עמוקה מאוד: וקטורים טובים לחיפוש, אבל ה LLM צריך טקסט. לכן חייבים לשמור גם את הטקסט המקורי.

**main: כל שלב ה Index במקום אחד**

```python
def main() -> None:
    documents = load_documents(DATA_FILE)
    chunks = chunk_documents(documents, MAX_WORDS, OVERLAP_WORDS)
    embeddings = build_embeddings(chunks, EMBEDDING_MODEL)
    save_faiss_index(embeddings, chunks, INDEX_DIR)

    print(f"Loaded {len(documents)} documents")
    print(f"Created {len(chunks)} chunks")
    print(f"Saved FAISS index to {INDEX_DIR}")
```

זו הפונקציה שמחברת את הכול.

היא טוענת מסמכים.

מחלקת אותם ל Chunks.

יוצרת Embeddings.

שומרת אינדקס ומטא דאטה.

בסוף היא מדפיסה כמה מסמכים נטענו, כמה Chunks נוצרו, ולאן נשמר האינדקס.

השורה האחרונה:

```python
if __name__ == "__main__":
    main()
```

אומרת שאם מריצים את הקובץ ישירות, main תופעל.

כלומר, כאשר מריצים:

```bash
python build_rag.py
```

נבנה האינדקס.

אחרי ההרצה אמורה להיווצר תיקייה:

```bash
data/faiss_index
```

ובתוכה שני קבצים חשובים:

```bash
index.faiss
metadata.json
```



## rag_client.py: לשאול שאלה ולקבל תשובה

אחרי שבנינו את האינדקס, צריך להשתמש בו. זה התפקיד של rag_client.py.

הקובץ הזה מממש את החלק השני של RAG: הוא מקבל שאלה, מחפש Chunks רלוונטיים, בונה Context, ושולח את ה Context למודל שפה.

להלן הקובץ במלואו:

```python
"""Interactive RAG client: retrieve chunks and answer with Claude Haiku 4.5."""

import json
import os
from pathlib import Path

import faiss
import numpy as np
from anthropic import Anthropic
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

INDEX_DIR = Path("data/faiss_index")
TOP_K = 10
LLM_MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = """You are a helpful assistant that answers questions using only the provided context chunks.
Rules:
- Answer only using information explicitly stated in the context.
- If the context does not contain enough information to answer, say you cannot answer from the provided context.
- Do not use outside knowledge or make assumptions beyond the context.
- always answer in this format: 1. person - description\n2. person - description\n3. person - description\n..."""


def load_index_and_chunks(index_dir: Path) -> tuple[faiss.Index, list[str], str]:
    """Load FAISS index, chunk texts, and embedding model name from disk."""
    metadata = json.loads((index_dir / "metadata.json").read_text(encoding="utf-8"))
    index = faiss.read_index(str(index_dir / "index.faiss"))
    return index, metadata["chunks"], metadata["model"]


def search(
    question: str,
    index: faiss.Index,
    chunks: list[str],
    model: SentenceTransformer,
    top_k: int,
) -> list[tuple[int, float, str]]:
    """Return top_k chunks as (index, L2 distance, text)."""
    query = np.array([model.encode(question)], dtype="float32")
    distances, indices = index.search(query, top_k)
    results = []
    for rank in range(top_k):
        chunk_idx = int(indices[0][rank])
        distance = float(distances[0][rank])
        results.append((chunk_idx, distance, chunks[chunk_idx]))
    return results


def print_results(results: list[tuple[int, float, str]]) -> None:
    for rank, (chunk_idx, distance, text) in enumerate(results, start=1):
        print(f"\n--- Result {rank} (chunk {chunk_idx}, distance {distance:.4f}) ---")
        print(text)


def format_context(results: list[tuple[int, float, str]]) -> str:
    sections = []
    for rank, (chunk_idx, _distance, text) in enumerate(results, start=1):
        sections.append(f"[Chunk {rank} | index {chunk_idx}]\n{text}")
    return "\n\n".join(sections)


def answer_from_context(
    question: str,
    results: list[tuple[int, float, str]],
    client: Anthropic,
) -> str:
    """Ask Claude Haiku 4.5 to answer using only the retrieved chunks."""
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

    index, chunks, model_name = load_index_and_chunks(INDEX_DIR)
    model = SentenceTransformer(model_name)
    client = Anthropic(api_key=api_key)

    print("RAG client ready. Ask a question (empty line or 'quit' to exit).\n")

    while True:
        try:
            question = input("Question: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not question or question.lower() in {"quit", "exit", "q"}:
            break

        results = search(question, index, chunks, model, TOP_K)
        # print_results(results)

        answer = answer_from_context(question, results, client)
        print(f"\n=== Answer ===\n{answer}")

    print("Goodbye.")


if __name__ == "__main__":
    main()
```

**ההגדרות של rag_client.py**

```python
INDEX_DIR = Path("data/faiss_index")
TOP_K = 10
LLM_MODEL = "claude-haiku-4-5-20251001"
```

**INDEX_DIR** מצביע על התיקייה שבה build_rag.py שמר את האינדקס.

**TOP_K = 10** אומר שהמערכת תחזיר עשרה Chunks קרובים.

יש כאן אי התאמה מול ההנחיה המקורית, שבה נכתב להדפיס את שלושת ה Chunks הקרובים ביותר. בפועל הקוד מחפש עשרה, וגם לא מדפיס אותם כי print_results מושבתת. זו נקודה טובה לדיון: לפעמים במהלך פיתוח משנים התנהגות, אבל חשוב שהדרישות והקוד יהיו מסונכרנים.

**LLM_MODEL** מגדיר את מודל השפה שאליו נשלח את ה Context.

**SYSTEM_PROMPT: הגבולות של המודל**

```python
SYSTEM_PROMPT = """You are a helpful assistant that answers questions using only the provided context chunks.
Rules:
- Answer only using information explicitly stated in the context.
- If the context does not contain enough information to answer, say you cannot answer from the provided context.
- Do not use outside knowledge or make assumptions beyond the context.
- always answer in this format: 1. person - description\n2. person - description\n3. person - description\n..."""
```

זה אחד החלקים החשובים ביותר במערכת.

המודל מקבל הוראות ברורות:

ענה רק לפי ה Context.

אם אין מספיק מידע, אמור שאי אפשר לענות.

אל תשתמש בידע חיצוני.

אלה הוראות מצוינות ל RAG, כי הן מנסות למנוע מהמודל להמציא תשובות.

אבל השורה האחרונה בעייתית:

```python
always answer in this format: 1. person - description
```

היא מכריחה את המודל לענות תמיד בפורמט שמתאים לרשימת אנשים. אבל בסיס הידע כולל לא רק אנשים, אלא גם ספינות, ארגונים, תהליכים, קרבות, מושגים ומקומות. לכן הפורמט הזה עלול לפגוע בתשובה.

זו נקודה מעולה ללמידה: גם אם ה Retrieval טוב, Prompt לא מתאים יכול לפגוע ב Generate.

גרסה טובה יותר יכולה להיות:

```python
Answer in a clear structure that fits the user's question.
Use numbered points only when a list is appropriate.
```

כך המודל שומר על בהירות, אבל לא נכלא בפורמט לא מתאים.

**load_index_and_chunks: לטעון את מה שבנינו**

```python
def load_index_and_chunks(index_dir: Path) -> tuple[faiss.Index, list[str], str]:
    """Load FAISS index, chunk texts, and embedding model name from disk."""
    metadata = json.loads((index_dir / "metadata.json").read_text(encoding="utf-8"))
    index = faiss.read_index(str(index_dir / "index.faiss"))
    return index, metadata["chunks"], metadata["model"]
```

הפונקציה הזאת טוענת את שני הקבצים שנוצרו בשלב הבנייה.

היא קוראת את metadata.json כדי לקבל את ה Chunks ואת שם מודל ה Embedding.

היא קוראת את index.faiss כדי לקבל את אינדקס הווקטורים.

בסוף היא מחזירה:

את האינדקס.

את רשימת ה Chunks.

את שם מודל ה Embedding.

למה חשוב להחזיר את שם המודל?

כי בזמן Query חייבים להשתמש באותו מודל Embedding שבו השתמשנו בזמן Index. אם נבנה את האינדקס עם מודל אחד, אבל נהפוך את שאלת המשתמש לווקטור עם מודל אחר, הווקטורים לא יהיו בהכרח באותו מרחב. התוצאות יכולות להיות גרועות או חסרות משמעות.

זה כלל חשוב מאוד:

אותו Embedding Model חייב לשמש גם לבניית האינדקס וגם לשאלות.

**search: כאן מתרחש ה Retrieval**

```python
def search(
    question: str,
    index: faiss.Index,
    chunks: list[str],
    model: SentenceTransformer,
    top_k: int,
) -> list[tuple[int, float, str]]:
    """Return top_k chunks as (index, L2 distance, text)."""
    query = np.array([model.encode(question)], dtype="float32")
    distances, indices = index.search(query, top_k)
    results = []
    for rank in range(top_k):
        chunk_idx = int(indices[0][rank])
        distance = float(distances[0][rank])
        results.append((chunk_idx, distance, chunks[chunk_idx]))
    return results
```

זו הפונקציה שבה RAG מתחיל לעבוד בזמן אמת.

המשתמש שואל שאלה.

השאלה הופכת לווקטור.

הווקטור נשלח ל FAISS.

FAISS מחזיר את ה Chunks הקרובים ביותר.

השורה הזאת יוצרת Embedding לשאלה:

```python
query = np.array([model.encode(question)], dtype="float32")
```

שימו לב שהשאלה נכנסת לתוך רשימה:

```python
[model.encode(question)]
```

למה? כי FAISS מצפה לקבל מטריצה של שאילתות, גם אם יש רק שאלה אחת. לכן יוצרים מערך דו ממדי: שאלה אחת, וקטור אחד.

אחר כך:

```python
distances, indices = index.search(query, top_k)
```

זו שורת החיפוש המרכזית.

distances הם המרחקים בין וקטור השאלה לבין הווקטורים שנמצאו.

indices הם מספרי ה Chunks שנמצאו.

כיוון שהאינדקס הוא IndexFlatL2, מרחק קטן יותר אומר תוצאה קרובה יותר.

אחר כך הקוד בונה רשימת תוצאות:

```python
results.append((chunk_idx, distance, chunks[chunk_idx]))
```

כל תוצאה כוללת:

מזהה Chunk.

מרחק.

הטקסט המקורי של ה Chunk.

זו נקודה קריטית. FAISS מחזיר מספרים. האפליקציה מחברת אותם בחזרה לטקסט. רק הטקסט הזה יכול להיכנס ל Context של ה LLM.

**print_results: הכלי הכי חשוב לדיבוג RAG**

```python
def print_results(results: list[tuple[int, float, str]]) -> None:
    for rank, (chunk_idx, distance, text) in enumerate(results, start=1):
        print(f"\n--- Result {rank} (chunk {chunk_idx}, distance {distance:.4f}) ---")
        print(text)
```

הפונקציה הזאת מדפיסה את ה Chunks שנשלפו.

מבחינת למידה, זו פונקציה חשובה מאוד. כאשר RAG מחזיר תשובה לא טובה, הדבר הראשון שצריך לבדוק הוא לא המודל, אלא ה Context שהוא קיבל.

כלומר, צריך לשאול:

האם ה Chunks שנשלפו באמת קשורים לשאלה?

האם הם מספיקים כדי לענות?

האם הם ארוכים מדי?

האם הם לא רלוונטיים?

האם חסר Chunk חשוב?

בקוד הנוכחי, הקריאה לפונקציה הזאת מושבתת:

```python
# print_results(results)
```

בזמן למידה, כדאי להפעיל אותה. כך אפשר לראות בעיניים את ה Retrieval ולא להתייחס אליו כקופסה שחורה.

**format_context: להפוך Chunks ל Prompt**

```python
def format_context(results: list[tuple[int, float, str]]) -> str:
    sections = []
    for rank, (chunk_idx, _distance, text) in enumerate(results, start=1):
        sections.append(f"[Chunk {rank} | index {chunk_idx}]\n{text}")
    return "\n\n".join(sections)
```

הפונקציה הזאת לוקחת את תוצאות החיפוש והופכת אותן לטקסט אחד מסודר.

המודל לא מקבל אובייקטים של Python. הוא מקבל טקסט. לכן צריך לקחת את ה Chunks, לסדר אותם, ולבנות מהם Context.

כל Chunk מקבל כותרת:

```python
[Chunk 1 | index 17]
```

ואחריה הטקסט שלו.

במערכת אמיתית אפשר לשפר את זה ולהוסיף גם:

שם מסמך.

כותרת סעיף.

תאריך.

גרסה.

מקור.

הרשאה.

אבל גם הגרסה הפשוטה כאן מספיקה כדי להבין את העיקרון: Retrieved Chunks הופכים ל Context.

**answer_from_context: כאן מתרחש ה Generate**

```python
def answer_from_context(
    question: str,
    results: list[tuple[int, float, str]],
    client: Anthropic,
) -> str:
    """Ask Claude Haiku 4.5 to answer using only the retrieved chunks."""
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
```

זו הפונקציה שמחברת את RAG למודל שפה.

קודם היא בונה Context:

```python
context = format_context(results)
```

אחר כך היא שולחת למודל הודעה שמכילה:

```python
Context.
Question.
```

הוראה לענות רק לפי ה Context.

החלק הזה הוא ממש הלב של Generate:

```python
response = client.messages.create(...)
```

המודל מקבל את המידע שנשלף ומנסח תשובה למשתמש.

חשוב להבין: המודל לא מחפש במסמכים בעצמו. החיפוש כבר נעשה קודם ב FAISS. המודל מקבל רק את הקטעים שנבחרו עבורו.

זו בדיוק ההפרדה בין Retrieve לבין Generate.

Retrieve מוצא את חומר הגלם.

Generate מנסח תשובה מחומר הגלם.

**main: הלולאה האינטראקטיבית**

```python
def main() -> None:
    load_dotenv()
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise SystemExit("ANTHROPIC_API_KEY is not set. Add it to .env or your environment.")

    index, chunks, model_name = load_index_and_chunks(INDEX_DIR)
    model = SentenceTransformer(model_name)
    client = Anthropic(api_key=api_key)

    print("RAG client ready. Ask a question (empty line or 'quit' to exit).\n")
```

הקוד טוען את קובץ .env, מחפש את ANTHROPIC_API_KEY, ואם הוא לא קיים, עוצר עם הודעה ברורה.

זו צורת עבודה נכונה. לא שמים API Key בתוך הקוד. שומרים אותו במשתנה סביבה.

אחר כך הקוד טוען את האינדקס וה Chunks:

```python
index, chunks, model_name = load_index_and_chunks(INDEX_DIR)
```

טוען את מודל ה Embedding:

```python
model = SentenceTransformer(model_name)
```

ויוצר Client Anthropic:

```python
client = Anthropic(api_key=api_key)
```

אחר כך מתחילה לולאה:

```python
while True:
    try:
        question = input("Question: ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        break
```

המערכת מחכה לשאלה מהמשתמש.

אם המשתמש לא כותב כלום או כותב quit, exit או q, התוכנית מסתיימת:

```python
if not question or question.lower() in {"quit", "exit", "q"}:
    break
```

אם יש שאלה, מתבצע Retrieval:

```python
results = search(question, index, chunks, model, TOP_K)
```

ואז Generate:

```python
answer = answer_from_context(question, results, client)
print(f"\n=== Answer ===\n{answer}")
```

כל שאלה שהמשתמש שואל מפעילה מחדש את כל שרשרת RAG של זמן הריצה:

```python
User Question.
Query Embedding.
Search FAISS.
Top K Chunks.
Build Context.
Call LLM.
Answer.
```

## איך מריצים את הפרויקט

בפעם הראשונה מתקינים תלויות:

```bash
pip install -r requirements.txt
```

אם עובדים עם הגרסה המלאה של ה-Client, צריך לוודא שבקובץ הדרישות קיימות גם:

```bash
anthropic
python-dotenv
```

אחר כך יוצרים קובץ env.:

```bash
ANTHROPIC_API_KEY=your_key_here
```

לאחר מכן בונים את האינדקס:

```bash
python build_rag.py
```

הפקודה הזאת קוראת את המסמכים, מחלקת אותם ל Chunks, מייצרת Embeddings, ושומרת את האינדקס.

אחר כך מריצים את ה - Client:

```bash
python rag_client.py
```

עכשיו אפשר לשאול שאלות על המסמכים.

## איך מיישמים את אותו רעיון על מסמכים שלכם

כדי להשתמש בפרויקט הזה על מסמכים שלכם, לא צריך לשנות את כל המערכת.

בשלב הכי פשוט, מחליפים את התוכן של:

```bash
data/starwars_ships_docs.txt
```

בתוכן שלכם.

חשוב שכל מסמך יהיה מופרד מהבא אחריו באמצעות שורה ריקה, כי כך load_documents יודעת להפריד מסמכים.

אפשר להכניס לשם:

- נהלים.

- תיעוד API.

- מסמכי אפיון.

- שאלות ותשובות.

- מאמרים.

- מסמכי קורס.

אחר כך מריצים שוב:

```bash
python build_rag.py
```

זה חשוב מאוד: אם המסמכים משתנים, צריך לבנות את האינדקס מחדש.

ואז מריצים:

```bash
python rag_client.py
```

ושואלים שאלות על המסמכים החדשים.

אם משנים את מודל ה Embedding, גם אז חייבים לבנות את האינדקס מחדש. אי אפשר לערבב Embeddings שנוצרו ממודל אחד עם Query Embeddings שנוצרו ממודל אחר.



## מה הפרויקט הזה עדיין לא עושה

הפרויקט מצוין ללמידה, אבל הוא עדיין בסיסי. חשוב להבין מה חסר בו כדי לא לחשוב שזה כבר פתרון Production מלא.

- הוא לא שומר metadata עשיר לכל Chunk.

- הוא לא שומר שם מסמך לכל Chunk.

- הוא לא מנהל הרשאות.

- הוא לא תומך בתיקיית קבצים שלמה.

- הוא לא מטפל ב PDF או Word ישירות.

- הוא לא בודק אם מסמך השתנה.

- הוא לא מבצע Hybrid Search.

- הוא לא מבצע Re Ranking.

- הוא לא מציג מקורות למשתמש.

- הוא לא מודד איכות Retrieval.

וזה בסדר. זו מערכת לימודית. המטרה שלה היא ללמד את השרשרת.

אחרי שמבינים אותה, אפשר להרחיב אותה.

**מה כדאי לשפר כתרגיל המשך**

**השיפור הראשון** הוא להוסיף metadata לכל Chunk. במקום לשמור רק טקסט, כדאי לשמור גם:

- שם מסמך.

- מספר Chunk.

- כותרת.

- סוג מקור.

- תאריך.

- גרסה.

כך התשובה תוכל לכלול גם מקור, לא רק טקסט.

**השיפור השני** הוא להפעיל את print_results בזמן Debug. כך אפשר לראות אילו Chunks באמת נשלפים.

**השיפור השלישי** הוא לשפר את ה System Prompt כך שלא יכריח פורמט של אנשים ותיאורים.

**השיפור הרביעי** הוא לאפשר טעינה מתיקייה שלמה, ולא רק מקובץ אחד.

**השיפור החמישי** הוא לשנות את TOP_K ולבדוק איך זה משפיע על איכות התשובה. לפעמים 3 תוצאות מספיקות. לפעמים צריך 10. לפעמים 10 מכניס יותר מדי רעש.

**השיפור השישי** הוא להוסיף מקור לכל תשובה, כדי שהמשתמש יוכל לבדוק מאיפה המידע הגיע.

**למה הפרויקט הזה חשוב להבנה אמיתית של RAG**

הפרויקט הזה חשוב כי הוא מראה ש RAG אינו קסם.

הוא Pipeline.

יש שלב שבו מכינים את הידע.

יש שלב שבו שואלים את הידע.

יש שלב שבו המודל מנסח תשובה.

כל אחד מהשלבים האלה הוא החלטה הנדסית.

- איך מחלקים מסמכים.

- כמה גדול כל Chunk.

- כמה overlap צריך.

- איזה Embedding Model בוחרים.

- איזה אינדקס FAISS משתמשים.

- כמה תוצאות שולפים.

- איך בונים Context.

- איך מגדירים למודל לא להמציא.

- איך בודקים מה נשלף.

- איך מציגים תשובה למשתמש.

כשלומדים את הפרויקט הזה לעומק, מבינים איך לקחת מסמכים רגילים ולהפוך אותם למערכת שאפשר לשאול אותה שאלות.

וזה בדיוק הכוח של RAG.

המודל לא צריך להכיר מראש את כל המסמכים.

המערכת מביאה לו את החלקים הנכונים בזמן השאלה.

המודל משתמש בהם כדי לנסח תשובה.

והמשתמש מקבל תשובה שמבוססת על מקור, לא רק על ידע כללי.

זו הנקודה שבה AI Engineering מתחיל להיות ממשי.


