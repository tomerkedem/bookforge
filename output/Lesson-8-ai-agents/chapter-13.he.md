# איך כותבים קוד כזה בעזרת סוכן קוד

אחרי שראינו איך בנויים build_rag_db.py, rag_chatbot.py ו-stock_agent.py, אפשר לשאול שאלה מעשית מאוד: איך כותבים קוד כזה בעזרת סוכן קוד?

הנקודה החשובה היא לא רק לדעת לבקש קוד. הנקודה היא לדעת לבקש קוד בצורה הדרגתית, ברורה, ומבוקרת.

כאשר עובדים עם סוכן קוד, קל מאוד להתפתות לכתוב בקשה גדולה מדי:

```bash
Build me a full RAG chatbot with agents, tools, memory, UI, API, error handling, and documentation.
```

בקשה כזאת אולי נשמעת יעילה, אבל בפועל היא עלולה ליצור קוד גדול, עמוס, קשה להבנה וקשה לתיקון.

במקום זה, עדיף לעבוד כמו מפתח שמפרק מערכת לשלבים קטנים:

```bash
1. Build the vector store.
2. Load the vector store.
3. Build the retriever.
4. Build the prompt.
5. Build the chain.
6. Add chat history.
7. Add error handling.
8. Test the flow.
```

כך אפשר לבדוק כל שלב בנפרד, להבין מה נוצר, ולתקן בעיות מוקדם.

המטרה של החלק הזה היא ללמוד איך לכתוב פרומפטים טובים לסוכן קוד, כדי שהוא יעזור לנו לבנות מערכת בצורה מסודרת, ולא ייצור עבורנו קופסה שחורה שקשה להבין.

## למה לא לבקש את הכול בבת אחת

כאשר מבקשים מסוכן קוד לבנות מערכת שלמה בבת אחת, מקבלים לעיתים קוד שנראה מרשים, אבל קשה לעבוד איתו.

הבעיה הראשונה היא שקשה להבין מה בדיוק נבנה. אם הסוכן יוצר כמה קבצים, הרבה פונקציות, קונפיגורציה, UI, קריאות API וטיפול בשגיאות בפעם אחת, קשה לדעת איפה להתחיל לבדוק.

הבעיה השנייה היא שקשה לאתר תקלות. אם הקוד לא רץ, לא תמיד ברור אם הבעיה נמצאת בהתקנות, ב-imports, במפתח API, במבנה התיקיות, בטעינת המסמכים, ב-vector store, או בקריאה למודל.

לדוגמה, נניח שביקשנו מסוכן קוד לבנות מערכת RAG מלאה, ואז קיבלנו שגיאה בהרצה:

```bash
Vector store not found.
```

עכשיו צריך להבין:

- האם תיקיית data לא קיימת?

- האם לא נוצרו chunks?

- האם ChromaDB לא נשמר?

- האם הנתיב שגוי?

- האם הצ’אטבוט רץ לפני בניית המאגר?

כאשר הכול נבנה בבת אחת, קשה לדעת.

הבעיה השלישית היא שהקוד עלול לכלול יותר מדי החלטות שלא ביקשנו במפורש. סוכן קוד עשוי לבחור ספריות, לשנות שמות קבצים, להוסיף שכבות מיותרות, ליצור מבנה תיקיות חדש, או לשנות חלקים קיימים בפרויקט בלי שהתכוונו לכך.

לכן עדיף לעבוד בשלבים קטנים וברורים.

במקום לבקש:

```bash
Build the entire RAG chatbot project.
```

עדיף לבקש:

```bash
Create only build_rag_db.py.
The file should:
- load .txt files from a data folder
- split them into chunks
- create embeddings
- save them into ChromaDB
- expose a load_vectorstore function

Do not create UI.
Do not create an API server.
Do not modify other files.
```

בקשה כזאת הרבה יותר טובה. היא מגדירה קובץ יעד, מגדירה תפקיד ברור, ומגבילה את הסוכן כדי שלא ייצור דברים שלא ביקשנו.

עבודה הדרגתית גם עוזרת לנו ללמוד. אם הסוכן כותב את כל המערכת בבת אחת, אנחנו עלולים להשתמש בקוד בלי להבין אותו. אבל אם בכל פעם בונים רכיב אחד, אפשר לקרוא את הקוד, להריץ אותו, לבדוק אותו, ורק אז להמשיך לשלב הבא.

במילים פשוטות:

סוכן קוד הוא כלי עבודה חזק, אבל הוא לא תחליף לחשיבה הנדסית.

ככל שהבקשה שלנו מדויקת יותר, כך הקוד שנקבל יהיה ברור, יציב וקל יותר לתחזוקה.

## עקרונות לכתיבת פרומפט טוב

כאשר עובדים עם סוכן קוד, איכות התוצאה תלויה מאוד באיכות הבקשה. ככל שהפרומפט ברור יותר, כך גדל הסיכוי לקבל קוד פשוט, מדויק וקל לבדיקה.

פרומפט טוב לא אומר רק “תכתוב לי קוד”. הוא מגדיר לסוכן הקוד מה לבנות, איפה לבנות, באילו ספריות להשתמש, מה לא לשנות, ואיך לבדוק שהתוצאה תקינה.

העיקרון הראשון הוא לציין קובץ יעד.

במקום לכתוב:

```bash
Build a RAG database.
```

עדיף לכתוב:

```bash
Create the implementation inside build_rag_db.py only.
```

כך סוכן הקוד יודע בדיוק איפה לעבוד. זה מקטין את הסיכוי שהוא ייצור קבצים חדשים, ישנה מבנה תיקיות, או יפזר קוד במקומות שלא התכוונו אליהם.

העיקרון השני הוא לציין ספריות נדרשות.

לדוגמה:

```bash
Use LangChain, ChromaDB, and HuggingFaceEmbeddings.
```

או:

```bash
Use yfinance for stock market data.
```

כאשר לא מציינים ספריות, הסוכן עלול לבחור פתרון אחר: ספרייה שלא מותקנת בפרויקט, API לא מתאים, או דרך מימוש מורכבת מדי. בפרויקט לימודי, חשוב שהקוד יתאים בדיוק לסביבה שאנחנו רוצים ללמד.

העיקרון השלישי הוא לציין פונקציות נדרשות.

לדוגמה:

```bash
The file must include:
- load_and_chunk_documents()
- get_embeddings()
- build_vectorstore()
- load_vectorstore()
- main()
```

זה עוזר לשמור על מבנה ברור. במקום לקבל קוד אחד ארוך בתוך main, אנחנו מקבלים פונקציות עם אחריות נפרדת. כך קל יותר לקרוא, לבדוק ולתקן.

העיקרון הרביעי הוא לציין מה לא לשנות.

זה אחד הדברים החשובים ביותר בעבודה עם סוכן קוד בתוך פרויקט קיים. אם לא מגבילים אותו, הוא עלול לשנות קבצים שלא ביקשנו, לעדכן שמות פונקציות, למחוק קוד קיים, או לשנות התנהגות של חלקים אחרים במערכת.

לדוגמה:

```bash
Do not modify requirements.txt.
Do not create a UI.
Do not change existing function names.
Do not edit files other than rag_chatbot.py.
```

הנחיות כאלה מגנות על הפרויקט. הן הופכות את העבודה של הסוכן לממוקדת יותר.

העיקרון החמישי הוא לבקש קוד פשוט וברור.

אפשר לכתוב:

```bash
Write simple, readable Python code.
Avoid unnecessary abstractions.
Use clear function names.
Add short comments only where they help understanding.
```

זו הנחיה חשובה במיוחד בלמידה. לפעמים סוכן קוד מנסה לכתוב פתרון “מקצועי מדי”: מחלקות, שכבות, קונפיגורציה, טיפוסים מורכבים ולוגיקה כללית מדי. אבל בשלב לימודי, עדיף קוד קטן, ישיר וברור.

העיקרון השישי הוא לבקש טיפול בשגיאות.

לדוגמה:

```bash
Add clear error handling for:
- missing data folder
- no .txt files
- missing API key
- missing vector store
- failed external API call
```

קוד שעובד רק במצב מושלם אינו מספיק טוב. מערכת אמיתית צריכה לדעת מה לעשות כאשר חסר קובץ, חסר מפתח API, אין נתונים, או שירות חיצוני נכשל.

העיקרון השביעי הוא לבקש הסבר קצר לאחר השינוי.

לדוגמה:

```bash
After making the change, explain briefly:
- what you changed
- which files were modified
- how to run the code
```

ההסבר הזה חשוב כי הוא עוזר לנו להבין מה הסוכן עשה. אנחנו לא רוצים רק לקבל קוד. אנחנו רוצים להבין את השינוי, לדעת איך להריץ אותו, ולוודא שהוא מתאים למה שביקשנו.

העיקרון השמיני הוא לבקש בדיקות הרצה.

לדוגמה:

```bash
Also provide the exact commands to test the implementation.
```

או:

```bash
Tell me how to verify that the vector store was created successfully.
```

כך מקבלים לא רק מימוש, אלא גם דרך לבדוק אותו. זה הופך את העבודה להרבה יותר בטוחה.

פרומפט טוב יכול להיראות כך:

```bash
Edit only rag_chatbot.py.

Build a simple RAG chatbot that:
- loads an existing ChromaDB vector store using load_vectorstore()
- creates a retriever with k=4
- builds a prompt with system instructions, context, chat history, and question
- calls the LLM
- returns a clear answer to the user

Use LangChain components already used in the project.
Do not rebuild the vector store in this file.
Do not create a UI.
Do not modify other files.

Add clear error handling for a missing API key and missing vector store.
Keep the code simple and readable.

After the change, explain:
- what you changed
- how to run it
- how to test it
```

זה פרומפט טוב כי הוא לא משאיר לסוכן מקום לנחש. הוא מגדיר קובץ, מטרה, גבולות, ספריות, התנהגות רצויה, טיפול בשגיאות ובדיקות.

במילים פשוטות, פרומפט טוב לסוכן קוד צריך להרגיש כמו משימה מדויקת למפתח בצוות. לא בקשה כללית, אלא הוראת עבודה ברורה שאפשר לבצע, לבדוק ולתחזק.



## פרומפט לבניית בסיס RAG

אחרי שהבנו את העקרונות לפרומפט טוב, נכתוב עכשיו פרומפט מלא שאפשר לתת לסוכן קוד כדי לבנות את הקובץ הראשון במערכת: build_rag_db.py.

המטרה של הקובץ הזה היא לא לבנות צ’אטבוט, לא לבנות UI, ולא להפעיל Agent. המטרה שלו היא אחת: לקחת מסמכים, לחלק אותם ל-chunks, ליצור embeddings, ולשמור אותם בתוך ChromaDB.

כלומר, זה קובץ ההכנה של בסיס ה-RAG.

הפרומפט צריך להיות מדויק, כדי שסוכן הקוד לא יתחיל לבנות מערכת שלמה לפני הזמן.

דוגמה לפרומפט טוב:

```bash
Create a Python file named build_rag_db.py.

Goal:
Build and persist a ChromaDB vector store from local text documents.

Requirements:
- Load all .txt files from a folder named data.
- Use UTF-8 encoding when loading files.
- Split the documents into chunks using RecursiveCharacterTextSplitter.
- Use chunk_size=400 and chunk_overlap=80.
- Create embeddings using HuggingFaceEmbeddings.
- Use the model sentence-transformers/all-MiniLM-L6-v2.
- Store the vector database in a local folder named chroma_db.
- Use the ChromaDB collection name rag_docs.

The file must include these functions:
- get_embeddings()
- load_and_chunk_documents(data_dir="data")
- build_vectorstore(chunks)
- load_vectorstore()
- main()

Behavior:
- If the data folder does not exist, raise a clear FileNotFoundError.
- If no .txt files are found, raise a clear FileNotFoundError.
- If the vector store folder does not exist when calling load_vectorstore(), raise a clear FileNotFoundError explaining that build_rag_db.py should be run first.
- Print clear progress messages while building the vector store.

Constraints:
- Do not create a chatbot in this file.
- Do not call an LLM in this file.
- Do not create a UI.
- Do not modify other files.
- Keep the code simple and readable.
- Use type hints where helpful.

After implementing, explain briefly:
- what the file does
- how to run it
- what folder should be created after a successful run
```

זה פרומפט טוב כי הוא מגדיר לסוכן הקוד גבולות ברורים. הוא לא אומר רק “תבנה RAG”, אלא מפרט בדיוק מה צריך להיות בקובץ ומה לא צריך להיות בו.

שימו לב במיוחד להנחיות האלה:

```bash
Do not create a chatbot in this file.
Do not call an LLM in this file.
Do not create a UI.
```

אלה הנחיות חשובות. בלי הגבלות כאלה, סוכן קוד עלול לנסות “לעזור יותר מדי” ולהוסיף דברים שלא ביקשנו. לפעמים הוא ייצור גם קובץ צ’אט, גם שרת FastAPI, גם דוגמת UI, וגם קונפיגורציה נוספת. זה אולי נראה שימושי, אבל זה מקשה על הלמידה ועל הבדיקה.

בשלב הזה אנחנו רוצים רק לבנות את המאגר.

אפשר לחשוב על המשימה כך:

```bash
Input:
local .txt files

Process:
load → split → embed → store

Output:
persistent ChromaDB vector store
```

הקוד שנרצה לקבל צריך להיות פשוט להפעלה:

```bash
python build_rag_db.py
```

לאחר הרצה מוצלחת, אמורה להיווצר תיקייה בשם:

```bash
chroma_db
```

התיקייה הזאת היא התוצאה החשובה של השלב. היא מכילה את ה-Vector Store שנוכל לטעון בהמשך מתוך הצ’אטבוט.

חשוב גם לבקש מסוכן הקוד להוסיף פונקציה בשם load_vectorstore. לכאורה, זו פונקציה ששייכת יותר לשלב הצ’אטבוט, כי היא טוענת את המאגר הקיים. אבל בפועל נוח לשים אותה באותו קובץ שאחראי על בניית המאגר, ואז לייבא אותה מתוך rag_chatbot.py.

כך נשמרת הפרדה ברורה:

```bash
build_rag_db.py
   builds the vector store
   loads the vector store

rag_chatbot.py
   uses the vector store to answer questions
```

בפרומפט טוב, אנחנו לא רק מבקשים קוד. אנחנו מתכננים את אחריות הקובץ. זה ההבדל בין בקשה כללית לבין משימת פיתוח מסודרת.

## פרומפט לבניית RAG Chatbot

אחרי שבנינו את בסיס ה-RAG ושמרנו את ה-Vector Store בדיסק, השלב הבא הוא לבנות את הקובץ שמשתמש במאגר הזה כדי לענות לשאלות.

הקובץ הזה הוא:

```bash
rag_chatbot.py
```

המטרה של הקובץ אינה לבנות את המאגר מחדש. המאגר כבר נבנה בשלב הקודם. כאן אנחנו רוצים לטעון אותו, ליצור retriever, לשלוף context מתאים, לבנות prompt, לשלוח את הכול ל-LLM, ולהחזיר תשובה למשתמש.

לכן הפרומפט לסוכן הקוד צריך להדגיש הפרדה ברורה:

```bash
build_rag_db.py builds the vector store.
rag_chatbot.py uses the existing vector store.
```

דוגמה לפרומפט טוב:

```bash
Create a Python file named rag_chatbot.py.

Goal:
Build a simple command-line RAG chatbot that answers questions using an existing ChromaDB vector store.

Requirements:
- Import load_vectorstore from build_rag_db.py.
- Do not rebuild the vector store in this file.
- Load the existing vector store using load_vectorstore().
- Create a retriever from the vector store.
- Use search_kwargs={"k": 4}.
- Build a RAG chain that:
  1. receives a user question
  2. retrieves relevant chunks from the vector store
  3. joins the retrieved chunks into a context string
  4. builds a prompt with system instructions, context, chat history, and question
  5. sends the prompt to the LLM
  6. returns the final answer as a string

Prompt requirements:
- The system message should tell the assistant to answer based on the provided context.
- If the context does not contain relevant information, the assistant should say so.
- Keep answers concise.
- Include chat history so follow-up questions can be understood.

LLM requirements:
- Use ChatAnthropic.
- Read the API key from the environment.
- If ANTHROPIC_API_KEY is missing, raise a clear error message.
- Use temperature=0 for stable answers.

Command-line behavior:
- Start an interactive chat loop.
- Read user input from the terminal.
- If the user types quit or exit, stop the program.
- For each question, invoke the RAG chain.
- Print the assistant answer.
- Save the latest user question and assistant answer in chat history.
- Keep only the latest messages when sending history to the prompt.

Constraints:
- Do not create a UI.
- Do not create a FastAPI server.
- Do not modify build_rag_db.py.
- Do not modify requirements.txt.
- Keep the code simple and readable.
- Add clear error handling for missing API key and missing vector store.

The file should include:
- build_rag_chain(vectorstore, llm)
- main()

After implementing, explain briefly:
- what the file does
- how it connects to build_rag_db.py
- how to run it
- what command should be run before this file
```

הפרומפט הזה טוב כי הוא מגדיר לסוכן הקוד בדיוק מה התפקיד של rag_chatbot.py.

הוא לא משאיר מקום לניחוש. הסוכן יודע שהוא צריך להשתמש במאגר קיים, ולא ליצור אותו מחדש. הוא יודע שצריך להשתמש ב-load_vectorstore, שצריך לבנות retriever עם k=4, ושצריך לשלב context, שאלה והיסטוריית שיחה בתוך prompt אחד.

הנקודה החשובה ביותר כאן היא ההנחיה:

```bash
Do not rebuild the vector store in this file.
```

זו הנחיה קטנה, אבל היא מונעת ערבוב אחריות בין קבצים.

אם rag_chatbot.py גם יבנה את המאגר וגם יריץ את הצ’אט, הקוד יהפוך פחות ברור. בכל הרצה של הצ’אט נבצע פעולת הכנה כבדה ומיותרת. בנוסף, יהיה קשה יותר להבין איפה נגמר שלב ההכנה ואיפה מתחילה השיחה.

הזרימה שאנחנו רוצים לקבל היא:

User question 
 ↓ 
Retriever 
 ↓ 
Relevant chunks 
 ↓ 
Prompt with context 
 ↓ 
LLM 
 ↓ 
Answer

הפרומפט גם מבקש טיפול במצב שבו אין מידע רלוונטי:

```bash
If the context does not contain relevant information, the assistant should say so.
```

זו הנחיה חשובה מאוד במערכות RAG. המטרה היא לא לגרום למודל לענות בכל מחיר. המטרה היא לגרום לו לענות כאשר יש בסיס במסמכים, ולהגיד שאין מספיק מידע כאשר אין בסיס כזה.

בנוסף, הפרומפט מבקש לשלב היסטוריית שיחה. זה מאפשר למערכת להתמודד עם שאלות המשך.

לדוגמה:

```bash
User:
What does the document say about ChromaDB?

User:
How is it used in RAG?
```

השאלה השנייה לא מזכירה שוב את ChromaDB, אבל בעזרת היסטוריית השיחה המודל יכול להבין למה המשתמש מתכוון.

בסוף, חשוב לבקש מסוכן הקוד גם הוראות הרצה. קוד טוב אינו מספיק אם לא ברור איך לבדוק אותו.

סדר ההרצה צריך להיות:

```bash
python build_rag_db.py
python rag_chatbot.py
```

הפקודה הראשונה בונה את המאגר. 
הפקודה השנייה מפעילה את הצ’אטבוט שמשתמש במאגר.

כך אנחנו שומרים על תהליך עבודה ברור: קודם מכינים את הידע, אחר כך משתמשים בו כדי לענות לשאלות.



## פרומפט לבניית Stock Agent

אחרי שבנינו RAG Chatbot, אפשר לעבור לפרומפט שמבקש מסוכן הקוד לבנות Agent עם Tool.

כאן חשוב לדייק: אנחנו כבר לא בונים מערכת ששולפת מידע ממסמכים. אנחנו בונים מערכת שמקבלת שאלה, מחליטה אם צריך להפעיל כלי חיצוני, מפעילה אותו, ואז מחזירה תשובה למשתמש.

הקובץ המרכזי הוא:

```bash
stock_agent.py
```

המטרה של הקובץ היא לבנות Stock Agent פשוט, שמסוגל לענות על שאלות לגבי מניות בעזרת כלי שמביא נתונים דרך yfinance.

דוגמה לפרומפט טוב:

```bash
Create a Python file named stock_agent.py.

Goal:
Build a simple command-line stock agent that can answer stock price and market data questions by using a tool.

Requirements:
- Use LangChain's create_agent.
- Use init_chat_model to create the LLM.
- Use Anthropic as the model provider.
- Read ANTHROPIC_API_KEY from the environment.
- If ANTHROPIC_API_KEY is missing, raise a clear error message.
- Use temperature=0 for stable answers.
- Use yfinance to fetch stock market data.

Tool requirements:
- Create a tool named get_stock_info.
- Decorate it with @tool.
- The tool should accept one argument: symbol: str.
- The symbol represents a stock ticker, for example AAPL, MSFT, NVDA, or TSLA.
- Strip whitespace from the symbol.
- Convert the symbol to uppercase.
- If the symbol is empty, return a clear error message.
- Use yfinance.Ticker(symbol).info to fetch stock data.

The tool should return a clear text summary that includes available fields such as:
- company name
- current price
- currency
- day high
- day low
- volume

Handle missing fields safely:
- Use currentPrice if available.
- Otherwise use regularMarketPrice.
- Otherwise use previousClose.
- If no price is available, explain that price data could not be found.

Agent requirements:
- Create a SYSTEM_PROMPT that instructs the agent to use get_stock_info when the user asks about stock price, quote, or market data.
- The agent should summarize the tool result clearly for the user.
- The agent should not invent live market data.
- The agent should ask for a ticker symbol if the user did not provide enough information.

The file should include:
- get_stock_info(symbol: str)
- build_agent()
- query_agent(agent, user_input: str)
- main()

Command-line behavior:
- Start an interactive loop.
- Read user input from the terminal.
- If the user types quit or exit, stop the program.
- Otherwise, send the user input to the agent.
- Print the final answer.

Constraints:
- Do not create a RAG system in this file.
- Do not use ChromaDB in this file.
- Do not create a UI.
- Do not create a FastAPI server.
- Do not modify other files.
- Keep the code simple and readable.
- Add clear error handling for invalid ticker symbols, missing data, and failed API calls.

After implementing, explain briefly:
- what the file does
- how the tool works
- how the agent decides when to use the tool
- how to run the file
- how to test it with example questions
```

הפרומפט הזה טוב כי הוא מבהיר לסוכן הקוד שאנחנו בונים Agent עם כלי, ולא RAG Chatbot.

ההנחיה החשובה ביותר כאן היא:

```bash
The agent should not invent live market data.
```

זו נקודה קריטית. מחיר מניה הוא מידע משתנה. אם המודל לא מפעיל כלי, אין לו דרך לדעת את המחיר הנוכחי בצורה אמינה. לכן צריך להנחות אותו להשתמש ב-tool כאשר השאלה דורשת נתוני שוק.

גם כאן חשוב להגדיר מה לא לעשות:

```bash
Do not create a RAG system in this file.
Do not use ChromaDB in this file.
Do not create a UI.
```

בלי ההגבלות האלה, סוכן הקוד עלול לערבב בין הדוגמאות. הוא עלול להכניס Vector Store לקובץ של ה-Agent, או לבנות ממשק משתמש לפני שביקשנו. זה בדיוק מה שאנחנו מנסים למנוע בעבודה הדרגתית.

הזרימה שאנחנו רוצים לקבל היא:

User question 
 ↓ 
Agent 
 ↓ 
get_stock_info tool 
 ↓ 
yfinance 
 ↓ 
Tool result 
 ↓ 
Final answer

דוגמה לשאלת בדיקה טובה:

```bash
What is the current price of MSFT?
```

או:

```bash
Give me market data for NVDA.
```

שאלות כאלה אמורות לגרום ל-Agent להפעיל את get_stock_info.

לעומת זאת, שאלה כללית כמו:

```bash
What is a stock ticker?
```

לא בהכרח דורשת tool. זו שאלה מושגית, וה-Agent יכול לענות עליה ישירות.

בפרומפט טוב לסוכן קוד, אנחנו לא רק מבקשים “תבנה Agent”. אנחנו מגדירים את גבולות האחריות שלו: איזה כלי יש לו, מתי להשתמש בו, מה לעשות אם חסר מידע, ואיך להריץ את הקובץ.

כך מתקבל קוד שאפשר להבין, לבדוק ולהרחיב בהמשך.

## פרומפט להוספת Tool חדש

אחרי שיש לנו Stock Agent בסיסי, אפשר להרחיב אותו עם כלים נוספים. זו אחת הסיבות המרכזיות לכך ש-Agents הם מבנה גמיש: לא חייבים לבנות הכול מחדש. אפשר להוסיף יכולת חדשה כסוג של tool נוסף.

לדוגמה, נניח שאנחנו רוצים להוסיף כלי שמחזיר חדשות קשורות למניה.

במקום שה-Agent יענה רק על מחיר נוכחי או נתוני שוק בסיסיים, הוא יוכל גם לקבל שאלה כמו:

```bash
Show me recent news about NVDA.
```

או:

```bash
Are there any recent headlines about Microsoft stock?
```

במקרה כזה, הסוכן צריך להבין שהשאלה לא דורשת רק מחיר מניה, אלא חדשות. לכן הוא צריך tool אחר.

הפרומפט לסוכן הקוד צריך להיות ממוקד מאוד. אנחנו לא רוצים שיכתוב מחדש את כל stock_agent.py. אנחנו רוצים שיוסיף כלי חדש לקובץ הקיים, בלי לשבור את הכלי שכבר עובד.

דוגמה לפרומפט טוב:

```bash
Edit only stock_agent.py.

Goal:
Add a new tool that returns recent news related to a stock ticker.

Current behavior:
The file already contains:
- get_stock_info(symbol: str)
- build_agent()
- query_agent(agent, user_input: str)
- main()

New requirement:
Add a new tool named get_stock_news.

Tool requirements:
- Decorate the function with @tool.
- The function should accept one argument: symbol: str.
- Strip whitespace from the symbol.
- Convert the symbol to uppercase.
- If the symbol is empty, return a clear error message.
- Use yfinance to fetch news related to the ticker.
- Return a clear text summary of the top news items.
- Include the title and publisher when available.
- If no news is found, return a clear message saying that no recent news was found.
- Handle API failures with a clear error message.

Agent update:
- Add get_stock_news to the agent tools list.
- Update the SYSTEM_PROMPT so the agent uses:
  - get_stock_info for stock price, quote, or market data questions
  - get_stock_news for news or headline questions

Constraints:
- Do not remove or rewrite get_stock_info.
- Do not change the command-line loop unless necessary.
- Do not create a UI.
- Do not create a FastAPI server.
- Do not modify other files.
- Keep the code simple and readable.

After implementing, explain briefly:
- what you changed
- how the new tool works
- how the agent decides between get_stock_info and get_stock_news
- how to test the new tool with example questions
```

הפרומפט הזה טוב כי הוא מגדיר שינוי קטן וממוקד. הוא לא מבקש “שדרג את הסוכן”, אלא אומר בדיוק איזה tool להוסיף, איך לקרוא לו, מה הוא מקבל, מה הוא מחזיר, ואיך לחבר אותו ל-Agent.

שימו לב להנחיה הזאת:

```bash
Do not remove or rewrite get_stock_info.
```

זו הנחיה חשובה מאוד. כאשר עובדים עם סוכן קוד על קובץ קיים, צריך להגן על מה שכבר עובד. אחרת הסוכן עלול “לשפר” את הקוד הקיים ולשבור התנהגות שכבר בדקנו.

אחרי הוספת הכלי החדש, רשימת הכלים של ה-Agent יכולה להיראות כך:

```python
tools=[get_stock_info, get_stock_news]
```

ברגע שיש יותר מכלי אחד, ההנחיות הופכות לחשובות עוד יותר. הסוכן צריך לדעת מתי להשתמש בכל כלי.

לדוגמה:

```bash
User:
What is the current price of AAPL?

Expected tool:
get_stock_info
```

אבל בשאלה אחרת:

```bash
User:
Show me recent news about AAPL.

Expected tool:
get_stock_news
```

אם ההנחיות לא ברורות, הסוכן עלול לבחור כלי לא מתאים. למשל, הוא עלול להפעיל את כלי המחיר גם כששאלו על חדשות, או לענות תשובה כללית בלי לקרוא לאף כלי.

לכן כדאי לעדכן את ההנחיות בצורה מפורשת:

```bash
Use get_stock_info for stock price, quote, or market data.
Use get_stock_news for recent news, headlines, or company news.
```

הרחבת Agent בעזרת tool חדש היא דרך טובה לפתח מערכת בהדרגה. קודם בונים כלי אחד, בודקים שהוא עובד, ואז מוסיפים יכולת נוספת. כך אפשר להגדיל את המערכת בלי להפוך אותה לקשה להבנה.

במילים פשוטות, כל tool חדש הוא יכולת חדשה של הסוכן. אבל כל יכולת חדשה צריכה לבוא עם גבולות ברורים: מתי להשתמש בה, מה היא מחזירה, ומה לעשות כאשר היא נכשלת.

## פרומפט לבדיקת קוד

אחרי שסוכן הקוד כתב או שינה קוד, העבודה עדיין לא הסתיימה. צריך לבדוק את הקוד. זו טעות נפוצה לחשוב שאם הסוכן החזיר קוד שנראה טוב, אפשר מיד להמשיך הלאה.

בפועל, קוד צריך לעבור בדיקה כמו כל קוד אחר: האם הוא רץ, האם הוא ברור, האם יש טיפול בשגיאות, האם אין imports מיותרים, והאם יש דרך פשוטה להריץ אותו.

בשלב הזה לא מבקשים מסוכן הקוד להוסיף פיצ’רים חדשים. מבקשים ממנו לבדוק את מה שכבר קיים.

דוגמה לפרומפט טוב:

```bash
Review the current project code.

Goal:
Check whether the implementation is correct, simple, and ready to run.

Please review these files:
- build_rag_db.py
- rag_chatbot.py
- stock_agent.py
- requirements.txt

Check the following:
1. Does the code run without syntax errors?
2. Are all imports required?
3. Are there any unused imports?
4. Is error handling clear and useful?
5. Are function names clear and consistent?
6. Is there good separation between code, configuration, and secrets?
7. Are API keys read from environment variables and not hardcoded?
8. Are there clear instructions for running each file?
9. Does rag_chatbot.py load the existing vector store instead of rebuilding it?
10. Does stock_agent.py use tools only when needed?
11. Are there any places where the code might fail silently?
12. Are there any unnecessary abstractions that make the code harder to understand?

Do not rewrite the whole project.
Do not add new features.
Do not create a UI.
Do not modify files unless you find a clear issue.

Return your answer in this structure:
- Issues found
- Suggested fixes
- Files that should be changed
- Exact commands to run and test the project
```

הפרומפט הזה טוב כי הוא מגדיר לסוכן הקוד תפקיד אחר: לא “בונה”, אלא “בודק”.

זו הבחנה חשובה. כאשר אנחנו מבקשים מסוכן קוד לבדוק, אנחנו לא רוצים שהוא יתחיל לכתוב מערכת חדשה. אנחנו רוצים שהוא יעבור על הקוד הקיים, ימצא בעיות, ויסביר מה כדאי לתקן.

אחד הדברים החשובים בבדיקה הוא לוודא שהקוד באמת רץ. לפעמים הקוד נראה נכון, אבל חסר import קטן, שם פונקציה לא תואם, או ספרייה שלא קיימת ב-requirements.txt.

לכן כדאי לבקש גם פקודות הרצה:

```bash
Provide the exact commands to test the project.
```

לדוגמה, בפרויקט שלנו סדר בדיקה בסיסי יכול להיות:

```bash
pip install -r requirements.txt
python build_rag_db.py
python rag_chatbot.py
python stock_agent.py
```

בדיקה נוספת היא לוודא שאין secrets בתוך הקוד. מפתחות API לא אמורים להופיע בקבצי Python. הם צריכים להגיע ממשתני סביבה.

לדוגמה, זה לא טוב:

```python
api_key = "sk-..."
```

לעומת זאת, זה נכון יותר:

```python
os.getenv("ANTHROPIC_API_KEY")
```

כך הקוד בטוח יותר, נייד יותר, ומתאים יותר לעבודה אמיתית.

חשוב גם לבדוק שאין ערבוב אחריות בין קבצים.

build_rag_db.py אמור לבנות ולטעון את ה-Vector Store.

rag_chatbot.py אמור להשתמש ב-Vector Store קיים כדי לענות לשאלות.

stock_agent.py אמור להפעיל tools חיצוניים, ולא להתעסק עם ChromaDB או מסמכים.

אם סוכן הקוד הכניס לוגיקה של RAG לתוך stock_agent.py, או בנה מחדש את המאגר מתוך rag_chatbot.py, זו בעיה תכנונית שכדאי לתקן.

אפשר לבקש בדיקה ממוקדת יותר כך:

```bash
Check specifically that each file has a single clear responsibility:
- build_rag_db.py prepares the vector store
- rag_chatbot.py answers using the vector store
- stock_agent.py answers using external tools

If any file mixes responsibilities, explain where and suggest a minimal fix.
```

בדיקה טובה צריכה להתייחס גם לטיפול בשגיאות. למשל:

```bash
Check that the code handles:
- missing data folder
- no text files
- missing chroma_db folder
- missing ANTHROPIC_API_KEY
- invalid stock ticker
- failed yfinance request
```

אלה לא מקרי קצה נדירים. אלה דברים שקורים הרבה בזמן פיתוח והרצה. אם הקוד מטפל בהם בצורה ברורה, הרבה יותר קל לעבוד איתו.

בסוף הבדיקה, חשוב לבקש מסוכן הקוד לא רק לומר מה לא טוב, אלא גם להציע תיקון מינימלי.

```bash
For each issue, suggest the smallest safe fix.
Do not refactor unrelated code.
```

זו הנחיה חשובה. לפעמים סוכן קוד מזהה בעיה קטנה, ואז מציע לשכתב חצי פרויקט. זה לא מה שאנחנו רוצים. אנחנו רוצים תיקון קטן, בטוח וממוקד.

במילים פשוטות, סוכן קוד טוב לא משמש רק לכתיבת קוד. אפשר להשתמש בו גם כבודק קוד, כעוזר דיבוג, וכמי שמוודא שהפרויקט נשאר פשוט וברור.

אבל גם כאן, האחריות נשארת אצלנו. אנחנו צריכים להגדיר לו מה לבדוק, מה לא לשנות, ואיך להציג את הממצאים. כאשר הבדיקה נעשית בצורה מסודרת, קל יותר להגיע לקוד שאפשר להבין, להריץ ולהמשיך לפתח.
