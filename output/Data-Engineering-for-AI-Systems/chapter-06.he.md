# פרק 6: מערכות RAG בפרודקשן (טקסט)

**המטרה:** להבין ש-RAG הוא לא קסם, אלא Pipeline הנדסי עם שלבים מוגדרים, וללמוד איך למנוע את הכשלים הנפוצים בכל שלב.

## צינור ה-RAG (The RAG Pipeline)

עד עכשיו דיברנו על ה-LLM כעל "מנוע". בפרק הזה נדבר על "מערכת הדלק". אם הדלק (הדאטה) מלוכלך, המנוע יקרטע.

צינור ה-RAG הקלאסי נראה פשוט על הנייר:

Document → Chunk → Embed → Store → Retrieve → Generate

אבל בפרודקשן, כל חץ בתרשים הזה הוא שדה מוקשים פוטנציאלי. ב-LogiSmart, המערכת נכשלה לא בגלל המודל, אלא בגלל שהיא שלפה את המסמך הלא נכון בזמן הלא נכון.

**נקודות הכשל הנפוצות (Failure Points)**

1) **Ingestion & Parsing (העיכול):** ה-PDF של נהלי הבטיחות נראה מעולה לעין אנושית, אבל למחשב הוא רצף של תווים שבורים. כותרות מתערבבות עם טקסט, וטבלאות הופכות לסלט.

- **הכשל:** המודל מקבל ג'יבריש במקום הקשר.

2) **Chunking (החיתוך):** איך מחלקים ספר של 500 עמודים? אם חותכים באמצע משפט, המשמעות הולכת לאיבוד.

- **הכשל:** המודל מקבל חצי משפט ("...אסור ללחוץ על הכפתור האדום אם...") ולא יודע מה ההמשך.

3) **Embedding (הייצוג):** המודל שהופך טקסט לווקטור. אם המודל אומן על ויקיפדיה באנגלית, הוא ייכשל בהבנת סלנג של נהגים בעברית.

- **הכשל:** חיפוש "תקלה במנוע" לא מוצא מסמך על "בעיות בעירה", כי הווקטורים רחוקים מדי.

4) **Retrieval (השליפה):** החלק הכי קריטי. להחזיר 3 מסמכים מתוך מיליון זה אתגר סטטיסטי.

- **הכשל:** Index Staleness. המערכת מחזירה את הנוהל משנה שעברה כי האינדקס לא התעדכן (זוכרים את פרק 4?).

<img src="/Data-Engineering-for-AI-Systems/assets/image-22.png" alt="image-22.png" width="698" height="464" />

ב-2026, אנחנו לא בונים RAG ליניארי ("שגר ושכח"). אנחנו בונים RAG מעגלי עם משוב: אם המודל לא מצא תשובה, הוא מאותת ל-Pipeline שיש בעיה ("Missing Context"), והמערכת לומדת מזה.

**איור 6.1: נקודות הכשל ב-RAG**

התרשים מציג פס ייצור (Conveyor Belt) שנע משמאל לימין.

1. **התחלה (Left):** מסמכים יפים ומסודרים נכנסים למכונה שכתוב עליה "Parser".

2. **באמצע (Middle):** המכונה פולטת חתיכות קרועות (Chunks). חלקן נופלות לרצפה (Lost Data).

3. **המשך:** רובוט (Embedder) מנסה לסדר את החתיכות בקופסאות (Vector Store), אבל שם חלק מהן בקופסה הלא נכונה.

4. **הסוף (Right):** יד מכנית (Retriever) שולפת חתיכה מקומטת ומגישה אותה ל-LLM, שנראה מבולבל.

5. **סימני אזהרה:** משולשים צהובים מעל כל שלב מסמנים את סוג הכשל (Parsing Error, Bad Chunking, Drift).

## אסטרטגיות חיתוך ואינדוקס (Chunking & Indexing Strategies)

הטעות הכי נפוצה של מתחילים היא להשתמש ב-CharacterTextSplitter של LangChain עם גודל קבוע של 1000 תווים. זה כמו לגזור ספר עם מספריים בעיניים עצומות: אתם תקבלו חצאי משפטים, פסקאות שבורות ומידע חסר הקשר.

ב-LogiSmart, התמודדנו עם נהלי עבודה (SOPs) מורכבים. מסמך אחד יכול להכיל סעיף משפטי יבש ואחריו טבלה טכנית של לחץ אוויר בצמיגים. חיתוך אקראי הרס את המשמעות.

**ארבעת האסטרטגיות המובילות (2026 Edition)**

1) **Fixed-Size (הנאיבית):** חיתוך כל X תווים עם חפיפה (Overlap).

- **מתי:** כשהטקסט הומוגני ואין מבנה (למשל, תמליל שיחה רציף).

- **הבעיה:** שוברת הקשר סמנטי.

2) **Recursive (ההיררכית):** מנסה לחתוך לפי פסקאות (\n\n), ואם זה גדול מדי - יורדת למשפטים (. ).

- **מתי:** ברירת המחדל הטובה ביותר לטקסט רגיל (מאמרים, בלוגים).

3) **Semantic (החכמה):** משתמשת במודל שפה קטן כדי לזהות מתי הנושא משתנה.

- **מתי:** כשיש מעברים חדים בין נושאים באותו מסמך.

- **החיסרון:** איטית ויקרה יותר (דורשת מודל).

4) **Adaptive / Structural (המבנית):** מנתחת את מבנה המסמך (Markdown Header, HTML Div).

- **מתי:** מסמכים טכניים, חוזים, או כל דבר עם כותרות מסודרות. זו האסטרטגיה שבחרנו ב-LogiSmart.

**טבלת השוואה: איזו אסטרטגיה מתאימה לי?**

<div dir="rtl">

| **אסטרטגי**ה | **מורכבות מימו**ש | **עלות חישו**ב | **מתאים ל...** | **לא מתאים ל...** |
| --- | --- | --- | --- | --- |
| **Fixed** | נמוכה מאוד | אפסית | טקסט גולמי ללא עיצוב | מסמכים משפטיים/טכניים |
| **Recursive** | בינונית | נמוכה | רוב הטקסטים (ברירת מחדל) | קוד, טבלאות מורכבות |
| **Semantic** | גבוהה | בינונית (Embedding) | פודקאסטים, שיחות ארוכות | מסמכים קצרים וממוקדים |
| **Structural** | גבוהה | נמוכה | SOPs, חוזים, Markdown | טקסט חסר מבנה (OCR גרוע) |

</div>

ב-LogiSmart, המעבר מ-Fixed ל-Structural Chunking הקפיץ את ה-Recall ב-30%. פתאום המודל ידע ש"סעיף 4.2" שייך ל"פרק בטיחות באש", כי ה-Chunk הכיל את הכותרת ההיררכית (Safety > Fire > Section 4.2).

<img src="/Data-Engineering-for-AI-Systems/assets/image-23.png" alt="image-23.png" width="698" height="464" />

**איור 6.2: השוואת שיטות Chunking**

התרשים מחולק לשני חלקים (Top vs Bottom):

1. **למעלה (Naive/Fixed):** מספריים גוזרים דף טקסט בקו ישר באמצע פסקה. התוצאה: שתי חתיכות שבהן המשפט "Don't press the red button" נחתך ל-"Don't press" ו-"the red button".

2. **למטה (Structural/Smart):** מספריים חכמים גוזרים מסביב לפסקאות ולכותרות (כמו Puzzle). כל חתיכה היא יחידה לוגית שלמה עם כותרת משלה.

3. **התוצאה:** החתיכות התחתונות נכנסות בצורה מושלמת לקופסאות ה-Vector Store, בעוד העליונות נראות קרועות.

## בסיסי נתונים וקטוריים וחיפוש היברידי (Vector Stores & Hybrid Search)

ב-2023, כולם רצו ל-Pinecone כי זה היה קל. ב-2026, השאלה היא לא "איפה לשים את הווקטורים", אלא "איך לשלוף אותם נכון". 
הווקטור הוא רק חצי מהסיפור. אם אני מחפש "מסעדה איטלקית זולה", המודל הסמנטי ימצא לי "פיצרייה עממית" (מעולה!), אבל הוא עלול לפספס מסעדה שקוראים לה "מילאנו" אם המילה "איטלקית" לא מופיעה בתיאור שלה.

לכן, הסטנדרט היום הוא חיפוש היברידי (Hybrid Search): שילוב של כוח המוח (Vector/Semantic) עם כוח השרירים הישן והטוב (Keyword/BM25).

**סקירת השוק (The Vector DB Landscape)**

1. **Chroma / LanceDB (לפיתוח מקומי):** קלי משקל, רצים בתוך התהליך (Embedded), מעולים ל-POC ולבדיקות. לא דורשים שרת נפרד.

2. **Qdrant / Weaviate (לפרודקשן ייעודי):** מפלצות ביצועים שנכתבו ב-Rust/Go. תומכים בסינון מטא-דאטה מורכב ("תביא לי מסמכים משנת 2025 בלבד").

3. **pgvector (הבחירה הפרגמטית):** אם כבר יש לכם Postgres (כמו ב-Stack שלנו), למה להוסיף עוד תשתית? pgvector מאפשר לשמור ווקטורים לצד הדאטה הרגיל באותה טרנזקציה. זה הפתרון שבחרנו ל-LogiSmart בגלל הפשטות התפעולית.

**הקסם של חיפוש היברידי**

במקום לסמוך רק על Cosine Similarity, אנחנו מריצים שאילתה משולבת:

1. **Vector Search:** מוצא את ההקשר הרעיוני ("תקלות מנוע").

2. **Keyword Search:** מוצא מילים מדויקות ("Error 503").

3. **Reciprocal Rank Fusion (RRF):** אלגוריתם שמשקלל את התוצאות משני המקורות ומדרג מחדש.

ב-LogiSmart, המעבר ל-Hybrid הקפיץ את הדיוק בחיפוש מק"טים (SKUs). מודל וקטורי גרוע במספרים סידוריים ("A-123" קרוב ל-"B-123"), אבל חיפוש טקסט רגיל הוא אלוף בזה.



<img src="/Data-Engineering-for-AI-Systems/assets/image-24.png" alt="image-24.png" width="698" height="464" />

**איור 6.3: מנוע החיפוש ההיברידי**

התרשים מציג משולש שווה צלעות, כאשר בכל קודקוד יש רכיב חיפוש אחר:

1. **קודקוד עליון:** Vector Search (Semantic) - אייקון של מוח/רשת נוירונים.

2. **קודקוד ימני:** Keyword Search (BM25) - אייקון של זכוכית מגדלת על טקסט.

3. **קודקוד שמאלי:** Metadata Filtering (SQL) - אייקון של טבלת מסד נתונים עם משפך.

4. כוכב זוהר שכתוב עליו "Hybrid Score (RRF)", הממזג את שלושתם לתוצאה אחת אופטימלית.





## סחף וקטורי וניטור RAG (Vector Drift & RAG Observability)

ב-2023, אם הטמעת מסמך ב-Vector DB, הוא נשאר שם לנצח. ב-2026, אנחנו מבינים שמערכת היא אורגניזם חי. דאטה משתנה (Drift), מודל ה-Embedding מתעדכן (ויחד איתו צריך לעדכן את כל האינדקס!), ואפילו השפה של המשתמשים מתפתחת ("קורונה" לא הייתה במילון ב-2019).

**מהו סחף וקטורי (Vector Drift)?**

סחף קורה כשהתפלגות השאילתות של המשתמשים מתחילה להתרחק מהתפלגות המסמכים באינדקס.

למשל, ב-LogiSmart, המודל אומן על נהלי חורף ("שרשראות שלג"), אבל בקיץ כולם שואלים על "מזגן לא עובד". אם אין מספיק מסמכים רלוונטיים לקיץ, ה-Recall יצנח, והמודל יתחיל להמציא תשובות ("שים קרח על המנוע").

**איך מודדים RAG? (RAGAS Metrics)**

כלי הזהב שלנו הוא RAGAS (Retrieval Augmented Generation Assessment). הוא נותן ציון לכל שלב בצינור:

1. **Context Precision:** כמה מהמסמכים ששלפנו באמת רלוונטיים לשאלה? (אם שלפנו 5 מסמכים ורק 1 מתאים -> דיוק 20%).

2. **Context Recall:** האם שלפנו את כל המסמכים הרלוונטיים, או שפספסנו משהו קריטי?

3. **Faithfulness:** האם התשובה שהמודל ניסח מבוססת אך ורק על המסמכים ששלפנו, או שהוא המציא מידע מהראש?

4. **Answer Relevance:** האם התשובה באמת עונה על השאלה של המשתמש?

**קוד: Pipeline לניטור תקופתי**

ב-LogiSmart, אנחנו מריצים סקריפט לילי שבודק את בריאות האינדקס:

python

from ragas import evaluate

from ragas.metrics import context_precision, context_recall, faithfulness

from datasets import Dataset

def run_rag_health_check(golden_dataset):

"""

Runs automated evaluation on the RAG system using RAGAS metrics.

"""

# 1. Prepare data for evaluation

eval_data = {

'question': golden_dataset['question'],

'contexts': golden_dataset['contexts'],  # What the retriever found

'answer': golden_dataset['generated_answer'], # What the LLM said

'ground_truth': golden_dataset['ground_truth'] # The correct answer

}

dataset = Dataset.from_dict(eval_data)

# 2. Run metrics

results = evaluate(

dataset=dataset,

metrics=[context_precision, context_recall, faithfulness]

)



# 3. Alert if scores drop below threshold

if results['context_recall'] < 0.7:

send_alert("RAG Recall Drop Detected! Re-indexing required.")



return results

הסקריפט הזה הוא ה"שומר בשער" של האינדקס. אם הציון יורד, אנחנו יודעים שצריך לעדכן את המסמכים או לשפר את ה-Chunking Strategy.



<img src="/Data-Engineering-for-AI-Systems/assets/image-25.png" alt="image-25.png" width="698" height="464" />

**איור 6.4: מדדי בריאות RAG**

התרשים מציג לוח מחוונים (Dashboard) עם 4 שעונים (Gauges):

1. **שמאל למעלה (Context Precision):** מדד שמראה כמה "זבל" נכנס להקשר. (ירוק = מעט זבל).

2. **ימין למעלה (Context Recall):** מדד שמראה כמה מידע פספסנו. (ירוק = לא פספסנו כלום).

3. **שמאל למטה (Faithfulness):** מדד שמראה האם המודל נצמד לעובדות. (ירוק = נאמן למקור).

4. **ימין למטה (Answer Relevance):** מדד שמראה האם ענינו לשאלה. (ירוק = רלוונטי).

5. **מרכז:** נורה אדומה מהבהבת שכתוב עליה "Drift Alert" אם אחד המדדים באדום.



## מעבדה: בניית מערכת RAG בסיסית (Lab: Build & Evaluate a RAG System)

במעבדה הזו נקים מערכת RAG מקצה לקצה בתוך הפרויקט שלנו. נשתמש ב-**ChromaDB** כ-Vector Store (כי הוא קל ורץ ללא שרת), וב-**OpenAI** ליצירת Embeddings. **המטרה:** לאנדקס מסמך טקסט פשוט ולשאול עליו שאלות.

**שלב 1: הכנת הסביבה** 
בטרמינל בתיקיית הפרויקט:

bash

mkdir -p chapter-06-rag/src

cd chapter-06-rag

touch requirements.txt src/simple_rag.py src/indexer.py data/sample_policy.txt

בקובץ requirements.txt:

text

chromadb>=0.4.0

openai>=1.12.0

python-dotenv>=1.0.0

(התקינו עם pip install -r requirements.txt).

**שלב 2: יצירת דאטה (The Document)** 
צרו קובץ טקסט פשוט שמדמה נוהל חברה ב-data/sample_policy.txt:

text

# LogiSmart Driver Policy 2026

## 1. Speed Limits

Drivers must not exceed 90 km/h on highways, regardless of local signs.

In urban areas, the limit is strictly 30 km/h.

## 2. Break Times

Every 4 hours of driving requires a mandatory 45-minute break.

Breaks must be logged in the app.

## 3. Emergency Protocol

In case of an accident, press the Red Button on the dashboard immediately.

Do not exit the vehicle until instructed by support.

**שלב 3: האינדקסר (The Indexer)** 
הסקריפט הזה קורא את הקובץ, חותך אותו (Chunking), יוצר Embeddings ושומר ב-Chroma.

קובץ: src/indexer.py

python

import os

import chromadb

from chromadb.utils import embedding_functions

# Initialize a persistent Chroma client.

# This will store the vector index on disk under ./chroma_db

client = chromadb.PersistentClient(path="./chroma_db")

# Use OpenAI Embedding Function (requires OPENAI_API_KEY env var)

# Or use default SentenceTransformer for free/local testing

# Try to read the OpenAI API key from environment variables

openai_key = os.getenv("OPENAI_API_KEY")

# Choose embedding function:

# - If OPENAI_API_KEY is set -> use OpenAI embeddings (higher quality, remote)

# - Otherwise -> fall back to a local/default embedding function (no external calls)

if openai_key:

emb_fn = embedding_functions.OpenAIEmbeddingFunction(api_key=openai_key)

else:

emb_fn = embedding_functions.DefaultEmbeddingFunction()

# Get or create a collection named "driver_policy".

# A collection is like a logical table for related documents and their embeddings.

collection = client.get_or_create_collection(

name="driver_policy",

embedding_function=emb_fn,

)

def index_document(file_path: str):

"""

Read a text file, split it into chunks, and index those chunks into ChromaDB.

"""

# Read the entire document from disk

with open(file_path, 'r', encoding='utf-8') as f:

text = f.read()



# Naive chunking strategy: split the text by double newlines (paragraph-level)

chunks = text.split('\n\n')



# Create unique IDs for each chunk

ids = [f"chunk_{i}" for i in range(len(chunks))]



# Attach simple metadata to each chunk (can be extended later)

metadatas = [{"source": "policy_v1", "chapter": "unknown"} for _ in chunks]



# Upsert = insert new chunks or update existing ones with the same IDs

collection.upsert(ids=ids, documents=chunks, metadatas=metadatas)



# Print a simple confirmation message

print(

f"Indexed {len(chunks)} chunks into ChromaDB using "

f"{'OpenAIEmbeddingFunction' if openai_key else 'DefaultEmbeddingFunction'}."

)

if __name__ == "__main__":

# Entry point for manual execution: index the sample policy file

index_document("data/sample_policy.txt")

**שלב 4: המערכת השלמה (The RAG Application)** 
הסקריפט הזה מבצע שליפה (Retrieve) ומייצר תשובה (Generate).

קובץ: src/simple_rag.py

python

import chromadb

from chromadb.utils import embedding_functions

from openai import OpenAI  # Assuming you have API key set

client = chromadb.PersistentClient(path="./chroma_db")

emb_fn = embedding_functions.DefaultEmbeddingFunction()

collection = client.get_collection(name="driver_policy", embedding_function=emb_fn)

llm_client = OpenAI()

def ask_rag(question):

print(f"\nUser Question: {question}")



# 1. Retrieve (Get top 2 most relevant chunks)

results = collection.query(query_texts=[question], n_results=2)

context_text = "\n\n".join(results['documents'][0])



print(f"--- Retrieved Context ---\n{context_text}\n-------------------------")



# 2. Augment (Create prompt)

prompt = f"""

You are a support agent. Answer the question based ONLY on the context below.



Context:

{context_text}



Question: {question}

"""



# 3. Generate

response = llm_client.chat.completions.create(

model="gpt-3.5-turbo",

messages=[{"role": "user", "content": prompt}]

)



print(f"Answer: {response.choices[0].message.content}")

if __name__ == "__main__":

ask_rag("What is the speed limit in the city?")

ask_rag("How long should I rest after driving?")

**הוראות הפעלה:**

1. הריצו python src/indexer.py (פעם אחת).

2. הריצו python src/simple_rag.py וראו איך המודל עונה במדויק על בסיס הנוהל שכתבתם.



## הבונוס ההנדסי: שדרוג ל-Production Grade Service

במעבדה הקודמת כתבנו את indexer.py - סקריפט פשוט שעושה את העבודה: קורא קובץ, חותך ושולח ל-ChromaDB. ל-POC זה מצוין. אבל כשרוצים לבנות מערכת **Production** אמיתית ב-**LogiSmart** שתחזיק שנים, סקריפט כזה לא יעבוד. הוא קשה לבדיקה (Untestable), קשה להרחבה (לא תומך בקלות במודלים חדשים), ואין בו טיפול שגיאות רציני.

במעבדה המתקדמת הזו, נעשה **Refactoring** לקוד. נהפוך את הסקריפט למחלקה מנוהלת (Service Class) שתהווה את התשתית לכל מה שנבנה בהמשך הספר - כולל המערכת המולטי-מודלית בפרק 7. המטרה: לבנות **Ingestion Pipeline** גנרי, מודולרי וחזק.

**שלב 0: סידור התיקיות (Project Structure)**

לפני שכותבים קוד, נסדר את הפרויקט במבנה של Python Package אמיתי. זה ימנע בעיות Import בעתיד. 
בתוך תיקיית chapter-06-rag, צור את המבנה הבא:

chapter-06-rag/

├── data/

│ └── sample_policy.txt

├── src/

│ ├── __init__.py (קובץ ריק)

│ ├── interfaces.py (ה"חוזה" שלנו)

│ ├── main_ingest.py (קובץ ההרצה)

│ ├── services/

│ │ ├── __init__.py (קובץ ריק)

│ │ └── text_ingestion.py (הלוגיקה העסקית)

│ └── infrastructure/

│ ├── __init__.py (קובץ ריק)

│ └── chroma_store.py (החיבור ל-DB)

└── .gitignore (חשוב!)

**טיפ חשוב:** ודא שאתה מוסיף את השורות הבאות לקובץ.gitignore שלך כדי לא להעלות קבצי זבל לגיט:

__pycache__/

*.pyc

.chromadb/

chromadb/



**שלב 1: הגדרת הממשק (Interface Definition)**

הצעד הראשון בהנדסת תוכנה נכונה הוא להגדיר "חוזה" (Interface). אנחנו רוצים שהקוד שלנו לא יהיה תלוי במימוש ספציפי של מסד נתונים (כמו Chroma). היום זה Chroma, מחר זה Pgvector או Pinecone.

ניצור קובץ src/interfaces.py. זהו החוזה שמגדיר איך נראה מסמך ואיך מתנהג מסד נתונים וקטורי.

Python

from abc import ABC, abstractmethod

from typing import List, Dict, Any, Optional

from dataclasses import dataclass

@dataclass

class IngestionDocument:

"""Standardized document object for our pipeline."""

content: str

metadata: Dict[str, Any]

doc_id: Optional[str] = None

class VectorStoreInterface(ABC):

"""Abstract Base Class for any Vector Database wrapper."""



@abstractmethod

def add_documents(self, documents: List[IngestionDocument]) -> bool:

"""Adds a batch of documents to the store."""

pass

@abstractmethod

def search(self, query_text: str, limit: int = 3) -> List[IngestionDocument]:

"""Performs semantic search."""

pass

**שלב 2: הלוגיקה העסקית (Service Layer)**

עכשיו נכתוב את המנוע עצמו ב-src/services/text_ingestion.py המחלקה TextIngestionService לא יודעת איך שומרים את הנתונים (את זה עושה ה-VectorStore), היא רק יודעת איך מעבדים טקסט: חותכים אותו (Chunking), מעשירים אותו במטא-דאטה, ומנהלים את התהליך.

**שימו לב ללוגיקה של ה-Chunking:**

במקום סתם לחתוך כל 1000 תווים, אנחנו מוסיפים **Overlap** (חפיפה) כדי לא לאבד הקשר בין משפטים שנחתכו באמצע.

ב-src/services/text_ingestion.py, נכתוב את המנוע שמחלק את הטקסט ומכין אותו לשמירה.

שימו לב: הקטנו את chunk_size ל-50 מילים בלבד, כדי שגם טקסטים קצרים יחולקו למספיק chunks עבור המעבדה.

python 
import uuid

from typing import List

from src.interfaces import VectorStoreInterface, IngestionDocument

class TextIngestionService:

def __init__(self, vector_store: VectorStoreInterface, chunk_size: int = 50, chunk_overlap: int = 10):

self.vector_store = vector_store

self.chunk_size = chunk_size

self.chunk_overlap = chunk_overlap

def _create_chunks(self, text: str) -> List[str]:

"""

Simple overlapping chunker. In production, use LangChain's RecursiveCharacterTextSplitter.

"""

words = text.split()

chunks = []

for i in range(0, len(words), self.chunk_size - self.chunk_overlap):

chunk = " ".join(words[i:i + self.chunk_size])

chunks.append(chunk)

return chunks

def ingest_text(self, text: str, source_metadata: dict) -> int:

"""

Orchestrates the ingestion flow: Chunk -> Wrap -> Store.

Returns the number of chunks indexed.

"""

chunks = self._create_chunks(text)

docs_to_ingest = []



for idx, chunk_text in enumerate(chunks):

# Create a rich metadata object for traceability

meta = {

**source_metadata,**

"chunk_index": idx,

"total_chunks": len(chunks)

}



doc = IngestionDocument(

content=chunk_text,

metadata=meta,

doc_id=str(uuid.uuid4())

)

docs_to_ingest.append(doc)



# Delegate storage to the interface implementation

success = self.vector_store.add_documents(docs_to_ingest)

if not success:

raise RuntimeError("Failed to store documents in Vector DB.")



return len(docs_to_ingest)

**שלב 3: התשתית (Infrastructure Layer)**

כעת נממש את ה-Interface עבור ChromaDB. ניצור את src/infrastructure/chroma_store.py. מחלקה זו היא ה"מתורגמן" שמדבר עם Chroma, אבל מבחוץ היא נראית כמו סתם VectorStoreInterface.

Python

import chromadb

from src.interfaces import VectorStoreInterface, IngestionDocument

from typing import List

class ChromaVectorStore(VectorStoreInterface):

def __init__(self, collection_name: str, persist_path: str = "./.chromadb"):

self.client = chromadb.PersistentClient(path=persist_path)

self.collection = self.client.get_or_create_collection(name=collection_name)

def reset(self):

"""Clears all data in the collection."""

self.client.delete_collection(self.collection.name)

self.collection = self.client.get_or_create_collection(name=self.collection.name)

def add_documents(self, documents: List[IngestionDocument]) -> bool:

try:

ids = [doc.doc_id for doc in documents]

contents = [doc.content for doc in documents]

metadatas = [doc.metadata for doc in documents]



self.collection.upsert(

ids=ids,

documents=contents,

metadatas=metadatas

)

return True

except Exception as e:

print(f"ChromaDB Error: {e}")

return False

def search(self, query_text: str, limit: int = 3) -> List[IngestionDocument]:

results = self.collection.query(query_texts=[query_text], n_results=limit)

# Convert back to our standard IngestionDocument format

docs = []

if results['documents']:

for i in range(len(results['documents'][0])):

docs.append(IngestionDocument(

content=results['documents'][0][i],

metadata=results['metadatas'][0][i],

doc_id=results['ids'][0][i]

))

return docs



**שלב 4: הרצה ובדיקה (Main Execution)**

עכשיו, במקום להריץ סקריפט, נכתוב קוד "ראשי" נקי שמחבר את כל החלקים. צור קובץ src/main_ingest.py:

ב-src/main_ingest.py, נחבר את הכל. נשתמש בטקסט ארוך מספיק כדי לראות את ה-Chunking בפעולה.

python

from src.infrastructure.chroma_store import ChromaVectorStore

from src.services.text_ingestion import TextIngestionService

def run_production_ingestion():

# 1. Initialize Infrastructure (The 'Database')

vector_db = ChromaVectorStore(collection_name="logismart_policies")



# Reset DB to avoid duplicates in lab

vector_db.reset()

# 2. Initialize Service (The 'Logic')

ingestion_service = TextIngestionService(vector_store=vector_db)



# 3. Execute Business Logic

sample_policy = """

LogiSmart Driver Policy 2026 - Official Handbook

1. Speed Limits and Traffic Compliance

All LogiSmart drivers must strictly adhere to local speed limits at all times. In urban areas, the maximum speed limit is 30 km/h, regardless of signage indicating higher limits, to ensure pedestrian safety. On highways, the maximum speed is 90 km/h to optimize fuel efficiency and safety. Speeding violations recorded by telematics devices will result in an immediate review of the driver's contract. Drivers are also required to maintain a safe following distance of at least 3 seconds from the vehicle in front, increasing to 5 seconds in adverse weather conditions such as rain, snow, or fog.

2. Break Times and Fatigue Management

Fatigue is a major cause of accidents. Drivers must take a mandatory 45-minute break for every 4.5 hours of driving. This break cannot be split into periods shorter than 15 minutes. During breaks, drivers are encouraged to exit the vehicle and stretch. All breaks must be logged in the LogiSmart Driver App. Failure to log breaks or manipulating log data is a serious offense. Drivers are prohibited from operating the vehicle if they feel drowsy or fatigued, and must contact dispatch immediately to arrange for a replacement or rest period.

3. Vehicle Maintenance and Pre-Trip Inspection

Before starting any shift, drivers must perform a comprehensive pre-trip inspection. This includes checking tire pressure, oil levels, coolant, lights, and brakes. Any defects must be reported via the app before the vehicle is moved. The cargo area must be inspected for cleanliness and structural integrity. At the end of the shift, a post-trip inspection is required to identify any issues that may have arisen during operation. The vehicle must be kept clean and presentable at all times, as it represents the LogiSmart brand. Smoking is strictly prohibited inside the vehicle cabin.

4. Emergency Protocol and Accident Reporting

In the event of an accident, the driver's first priority is safety. Stop the vehicle immediately in a safe location and activate hazard lights. Check for injuries and call emergency services if necessary. Press the Red Panic Button on the dashboard to alert the LogiSmart Command Center. Do not admit liability or discuss the accident with anyone other than police or LogiSmart representatives. Take photos of the scene, including vehicle damage and road conditions, and upload them to the incident report form in the app.

"""

metadata = {"source": "policy_v2.pdf", "author": "HQ"}



count = ingestion_service.ingest_text(sample_policy, metadata)

print(f"✅ Successfully ingested {count} chunks into Production Service.")

# 4. Verify by Searching

print("\n--- Verifying Retrieval ---")

results = vector_db.search("What is the speed limit?")

for doc in results:

print(f"Found chunk: {doc.content[:50]}... (Source: {doc.metadata['source']})")

if __name__ == "__main__":

run_production_ingestion()

**איך מריצים? (Crucial Step)**

כדי שה-Imports יעבדו, חובה להריץ את הקוד מתוך תיקיית chapter-06-rag וכמודול:

bash

cd chapter-06-rag

python -m src.main_ingest

התוצאה הצפויה:

✅ Successfully ingested 9 chunks into Production Service.

--- Verifying Retrieval ---

Found chunk: ...max is 30 km/h...

אם קיבלתם את זה - מזל טוב! בניתם Ingestion Pipeline ארגוני לכל דבר. בפרק הבא נלמד אותו "לראות".

**למה זה חשוב?** 
מה שעשינו כאן זה **Decoupling** (צימוד רפוי). ה-Service לא יודע שהוא מדבר עם Chroma. מחר נוכל להחליף את ChromaVectorStore ב-PgVectorStore וכל הלוגיקה העסקית תמשיך לעבוד בלי לשנות שורת קוד אחת ב-TextIngestionService. זו בדיוק התשתית שעליה נבנה את המערכת המולטי-מודלית בפרק 7 - פשוט נרחיב את ה-Interface לתמוך גם בתמונות.




