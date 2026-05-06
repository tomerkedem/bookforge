# פרק 7: Multimodal RAG & Documents

**מטרה:** להרחיב את צורת החשיבה מעבר לטקסט בלבד, בלי להפוך את הפרק לקורס Computer Vision.

## עדכונים ב 2026: Multimodal כבר ברירת מחדל

ב‑2023 עוד היה לגיטימי לחשוב על "מערכת RAG על מסמכים" במונחים פשוטים: לקחת קובץ PDF, לחלץ ממנו את הטקסט, לחלק אותו לחתיכות קטנות (Chunks) ולדחוף הכל למסד נתונים וקטורי.

ב‑2026, הגישה הזו כבר נחשבת למיושנת ולא מספקת. המציאות העסקית היום היא מולטי‑מודלית כברירת מחדל - רוב המערכות הפרודוקטיביות עובדות מול "תיק מידע" מורכב, שמכיל תמהיל של טקסט, תמונות, סריקות, ולעיתים גם וידאו ואודיו.

מודלים מתקדמים ממשפחת Gemini‑class ואחרים שינו את כללי המשחק. הם יודעים לקבל קלט מולטי‑מודלי אחד ומאוחד: למשל, PDF סרוק, כמה תמונות מהשטח וטרנסקריפט של שיחה מוקלטת, ולענות על שאלה אחת שמחברת את כל המקורות יחד. עבור הארכיטקט וה‑Data Engineer, המשמעות היא שה‑"Document" של פעם הופך ל‑"Case File" - אובייקט לוגי עשיר שמאגד אוסף של ארטיפקטים שונים, וצריך ליישר את כולם על אותו ציר זמן ואותה ישות עסקית (כמו משלוח, לקוח או אירוע).

בעולמות לוגיסטיקה זה נראה מאוד מוחשי:

- OCR על מסמכי משלוח סרוקים - זיהוי שטרי מטען, תוויות, חתימות וחותמות.

- תמונות נזק - זיהוי ארגז מעוך, משטח רטוב, דלת משאית מכופפת.

- מפות ואירועי GPS - מתעדים בדיוק איפה המשאית הייתה, מתי נעצרה, איפה היו איחורים.

ב‑LogiSmart, המערכת שלנו, המושג "משלוח" כבר מזמן אינו רק שורה בודדת בטבלת shipments. היום זהו "תיק משלוח" - חבילה של ארטיפקטים הכוללת:

- קובץ PDF סרוק של מסמך המשלוח.

- טקסט שחולץ ב OCR (כולל confidence).

- סדרה של תמונות נזק מהשטח.

- רצף אירועי GPS לאורך המסלול.

Multimodal RAG הוא השכבה שיושבת מעל החבילה העשירה הזו ומאפשרת למשתמש לשאול שאלות הרבה יותר מורכבות. במקום להסתפק ב‑"מה כתוב במסמך?", המערכת יכולה עכשיו לענות על שאלות כמו: "איפה בדיוק קרה הנזק למשלוח הזה, ומה היו הסימנים המקדימים לכך בתמונות?". כדי שהקסם הזה יעבוד, ה‑Data Engineering חייב לדעת איך לחלץ טקסט מתמונה, איך לייצר Embeddings שמשלבים גם טקסט וגם תמונה באותו מרחב וקטורי, ואיך להגדיר סכימה עקבית ואחידה לתיק אירוע מולטי‑מודלי. זה בדיוק האתגר ההנדסי שנצלול אליו בהמשך הפרק.

<img src="/Data-Engineering-for-AI-Systems/assets/image-26.png" alt="image-26.png" width="728" height="465" />

**איור 7.1 מציג “תיק משלוח” אחד כמסך מחולק לארבעה ארטיפקטים:**

1. בפינה העליונה - מסמך משלוח סרוק (PDF) עם חץ ל OCR Text.

2. בפינה השנייה - תמונת נזק של ארגז מעוך עם חץ ל Image Embedding.

3. בפינה השלישית - מקטע מפה עם מסלול מסומן ונקודות GPS.

4. בפינה הרביעית - טבלה קטנה של Metadata (מספר משלוח, תאריך, סטטוס).

כל ארבעת הרכיבים מתכנסים באמצעות חצים לקופסה מרכזית גדולה בשם "Shipment Case File". ממנה יוצא חץ למודול "Multimodal RAG Retriever", ומשם למודול הסופי "LogiSmart Agent Answer".



## Data Engineering למולטי מודל

ברגע שעוברים מ RAG טקסטואלי קלאסי ל Multimodal RAG, זווית הראייה ההנדסית משתנה לחלוטין. השאלה כבר איננה "איך אני מחפש בתוך מסמך?", אלא "איך אני בונה **ייצוג אחיד** לאירוע שמפוזר על פני טקסט, תמונות, סריקות ונתוני GPS?". ה LLM בסוף התהליך רואה Context רציף אחד. מי שאחראי לקחת את ערימת הקבצים המבולגנת ולהפוך אותה לסיפור עקבי הוא ה Data Engineer.

מהי יחידת המידע: Document vs. Case 
במערכת טקסטואלית רגילה, אבן הבניין היא "מסמך". אתה קולט PDF, מחלץ טקסט, חותך ל Chunks, מייצר Embeddings ושואל "איזה מסמך הכי רלוונטי לשאילתה?". ב Multimodal RAG הגישה הזו נשברת מיסודו: מסמך המשלוח הוא בכלל PDF סרוק, הראיה לנזק נמצאת בפיקסלים של תמונה, וציר הזמן האמיתי (מתי קרה הנזק) מסתתר בנתוני טלמטריה (GPS). אם נמשיך להתייחס לכל אחד מהם בנפרד, נקבל תשובות חלקיות. לכן, יחידת המידע החדשה היא **תיק אירוע** (Case File). זה יכול להיות משלוח, תביעת ביטוח או דוח בקרת איכות - ישות לוגית אחת שמאגדת תחתיה את המסמך, התמונות, הטיימליין והמטא דאטה. התפקיד הקריטי של ה Pipeline הוא לוודא שכל הארטיפקטים האלו "ננעלים" על אותו מזהה (כגון shipment_id) ועל אותו ציר זמן, אחרת ה RAG ינסה להרכיב תשובה מתוך שברי סיפורים סותרים.

**ארבע שכבות ה Pipeline למולטי מודל** 
כדי לתמוך בשינוי הזה, ה Pipeline הופך למורכב יותר ואפשר לחלק אותו לארבע שכבות ברורות:

- **הראשונה היא Ingestion & Normalization.**

לכאן נכנסים ה-Inputs הגולמיים: קבצי PDF, תמונות מהשטח, וזרם נתונים רציף (Streaming) של GPS או חיישנים. בשלב הזה אנחנו מנרמלים פורמטים (ממירים הכל לסטנדרט אחיד) ומזריקים מטא דאטה בסיסי כמו shipment_id וזמן קליטה (captured_at).

- **השכבה השנייה היא Extraction & Structuring**

שבה הופכים מידע בינארי ל Data שימושי. כאן רץ מנוע ה OCR על הסריקות והתמונות כדי לחלץ טקסט גולמי, מזהה Bounding Boxes של אזורים חשובים (כמו חתימות), ומבצע חילוץ שדות עסקיים (Field Extraction) כמו מספר הזמנה או קוד נזק. התוצר הוא מבנה נתונים מסודר (למשל JSON) שמחזיק גם את הטקסט וגם את ההקשר הויזואלי שלו.

- **בשכבה השלישית, Representations & Embeddings**

אנחנו מחליטים מה נכנס לחיפוש הסמנטי. אנחנו מייצרים Embeddings לטקסט (סיכומים, תיאורים חופשיים) ובנפרד Embeddings לתמונות (תמונות נזק, תמונות אריזה). הדגש כאן הוא על הקשר: לכל וקטור מוצמד קישור למקור שלו - וקטור טקסט מצביע לעמוד ולפסקה ספציפיים, ווקטור תמונה מצביע לקובץ המקורי ולקונטקסט העסקי (למשל "צולם לפני הפריקה").

- **השכבה הרביעית והאחרונה היא Alignment & Indexing.**

זהו רגע האמת שבו הכל מתחבר ל-Case File. אנחנו מיישרים את כל המידע לפי מזהים ולפי ציר זמן אחיד (מסנכרנים בין שעון הטלפון של הנהג לשעון השרת), ויוצרים ישות לוגית אחת שניתן לשלוף ממנה. האינדקסים כאן צריכים לאפשר שליפה גמישה: גם "תביא לי את תיק משלוח X" וגם "תביא לי את כל תמונות הנזק מסוג שבר".

**דוגמה מהשטח: בניית תיק משלוח ב LogiSmart** 
בואו נראה איך זה נראה ב LogiSmart. כשנוצר משלוח, נפתחת רשומה בטבלת shipments. מכאן מתחילה זרימה של מידע: המשרד מעלה שטר מטען סרוק, הנהג מצלם את המשטח, והמשאית משדרת מיקום. ה-Data Engineering מנתב את כל אלה ליעדים ספציפיים

(shipment_documents, shipment_images, shipment_events) אבל בסוף עוטף אותם ב-View אחד. כששואלים את המערכת שאלה, הרטריבר לא מחפש סתם "מסמכים", אלא שולף את כל ה-Case המקושר ל-ID הרלוונטי, בפורמט שהמודל המולטי-מודלי יודע לעכל.

**בורות אופייניים ואיך לא ליפול בהם** 
המעבר למולטי-מודל חושף אותנו לבעיות חדשות. הבעיה הקלאסית היא "OCR כאמת יחידה". מנועי OCR נוטים לטעויות (למשל להפוך DELIVERY ל-DEL1VERY או לפספס ספרה במספר משלוח). הפתרון הוא לא לסמוך עליהם בעיניים עצומות, אלא להצליב מידע עם חוקים לוגיים ומסדי נתונים קיימים.

בעיה שנייה היא חוסר עקביות במיפוי שדות. כשבמסמך כתוב Order ID, במערכת התפעולית order_num, ועל המדבקה בתמונה ORD-123, נוצר בלאגן. הפתרון הוא Data Contract קשוח ל-Case File שמכריח את כל המקורות "לדבר" באותה שפה. ולבסוף, יש את עניין סנכרון הזמנים (Time Drift). שעון הנהג יכול להיות לא מכוון, והתמונה תקבל חותמת זמן שגויה שיוצרת אנומליה לוגית (כאילו הנזק קרה לפני היציאה). כאן חובה לקבוע "מקור זמן אמת" (בדרך כלל השרת) ולבצע תהליכי תיקון וניקוי נתונים לפני שהם מגיעים למודל.

המטרה של כל המאמץ ההנדסי הזה היא פשוטה: כש LLM מקבל את הקונטקסט, הוא לא צריך לנחש. כל פיסת מידע מגיעה עם תעודת זהות - מה המקור שלה, מתי נוצרה, ומה רמת האמינות שלה. רק ככה אפשר לבנות מערכת שנותנת תשובות אמינות ולא הזיות יצירתיות.

<img src="/Data-Engineering-for-AI-Systems/assets/image-27.png" alt="image-27.png" width="697" height="465" />

**איור 7.2: צנרת הנתונים המולטי-מודלית (Multimodal Data Pipeline)**

תרשים זרימה נקי ומודרני המציג את הפיכת המידע הגולמי לתיק אירוע חכם.

1. **צד שמאל (Inputs):** שלוש תיבות המייצגות את המקורות: "Scanned PDF", "Damage Photos", ו-"GPS Stream".

2. **מרכז (Processing):** שכבת עיבוד המכילה שלושה רכיבים: "OCR & Field Extraction", "Image Embeddings", ו-"Time & ID Alignment".

3. **צד ימין (Output):** תיבה גדולה ומסכמת בשם "Shipment Case File" המאגדת את התוצרים. ממנה יוצא חץ ל-"Multimodal RAG Retriever".



## Multimodal RAG Pattern

אחרי שבנינו בפרק הקודם את ה-Pipeline שמייצר "תיק אירוע" (Case File), אנחנו מגיעים ללב העניין: איך שולפים את המידע הזה בזמן אמת? RAG

מולטימודלי הוא לא סתם "חיפוש וקטורי על סטרואידים". הוא דורש שינוי תפיסתי באופן שבו אנחנו מאחזרים מידע (Retrieval) ובאופן שבו אנחנו מגישים אותו למודל (Generation). האתגר הגדול כאן הוא לאזן בין עושר המידע לבין הרעש שהתמונות והסריקות עלולות להכניס.

**השינוי ברטריבר: מחיפוש מסמכים לחיפוש עדויות** 
ב RAG טקסטואלי רגיל, הרטריבר מחזיר פיסקאות טקסט (Chunks). ב-Multimodal RAG, הרטריבר צריך להחזיר **עדויות**. כשאנחנו שואלים "האם האריזה הייתה תקינה?", התשובה לא נמצאת רק בטקסט של תעודת המשלוח ("Package: OK"), אלא בפיקסלים של תמונת ההעמסה.

לכן, הרטריבר שלנו ב-LogiSmart עובד בשיטת "Multi-Vector Retrieval": לכל Case File יש כמה וקטורים שמייצגים אותו - וקטור לטקסט המסמך, וקטור לכל תמונה, וקטור לתיאור הנזק.

השאילתה של המשתמש ("הראה לי נזקי רטיבות מהחודש האחרון") עוברת המרה כפולה: גם לטקסט (לחיפוש במסמכים) וגם לתמונה (לחיפוש ויזואלי של "רטיבות" או "כתמים"). הרטריבר מבצע חיפוש במקביל, ומחזיר את ה- Case Filesשבהם נמצאה התאמה חזקה באחד מהערוצים. זה מאפשר למערכת למצוא משלוח שבו המילה "רטיבות" לא כתובה בשום מקום, אבל התמונה זועקת "מים".

**השינוי בג'נרציה: להאכיל את המודל ב"קולאז'"** 
ברגע שהרטריבר החזיר את המידע, אנחנו לא סתם מדביקים טקסט לפרומפט. אנחנו צריכים להרכיב למודל (כגון .Gemini) תמונת מצב מלאה. ב LogiSmart, הפרומפט למודל נראה כמו תיק חקירה מסודר:

1. **קונטקסט טקסטואלי:** סיכום נתוני ה JSON של המשלוח (ID, תאריכים, לקוח).

2. **עדויות ויזואליות:** התמונות הרלוונטיות ביותר שנשלפו (לא כל ה 50 שצולמו, אלא ה 3 שמראות נזק), מקודדות כ-Tokens או כ-Base64.

3. **עדויות OCR:** הטקסט הגולמי שחולץ מהמסמך הסרוק, כדי שהמודל יוכל "לקרוא" את האותיות הקטנות ולזהות סתירות מול התמונות.

המודל מתבקש לבצע "Cross-Modal Reasoning": להסתכל על התמונה, לקרוא את המסמך, ולהגיד האם יש התאמה. למשל: "במסמך כתוב 'שביר', אבל בתמונה רואים שהארגזים מונחים ללא ריפוד". זהו הערך האמיתי של המערכת - היכולת להצליב מקורות.



**מתי לא כדאי להשתמש במולטי מודל (Cost, Latency, Privacy)** 
עם כל ההתלהבות מיכולת המערכת "לראות", מהנדס נתונים מנוסה צריך לדעת מתי ללחוץ על הבלמים. פתרון Multimodal הוא יקר, כבד ומורכב משמעותית מפתרון טקסטואלי. ב-LogiSmart, אנחנו לא שולחים כל תמונה למודל באופן אוטומטי, אלא עובדים לפי עקרונות ברורים של עלות, ביצועים ופרטיות.

**1. Cost & Latency: עקרון ה-"Text First"**

שליחת תמונה למודל (כמו GPT-5 או Gemini 3 Pro) עולה פי כמה משליחת טקסט רגיל (במונחי טוקנים), ומוסיפה שיהוי (Latency) משמעותי לתשובה. אם המשתמש שאל "מתי המשלוח הגיע?", אין שום סיבה טכנית לנתח את תמונת האריזה.

**כלל האצבע ב-LogiSmart:** Text First, Image on Demand. 
מנגנון האחזור (Retrieval System) מנסה קודם כל לענות על בסיס הטקסט והמטא-דאטה שנאספו. רק אם המודל מזהה שהשאלה דורשת "ראייה" (למשל: "האם יש חלודה על המיכל?" או "מה צבע האריזה?"), או אם רמת הביטחון (Confidence) של התשובה הטקסטואלית נמוכה, המערכת מבצעת **אחזור מחדש** (Re-ranking / Refetch) ושולפת את התמונות הרלוונטיות לעיבוד נוסף.

**2. Privacy & PII: הסכנות הסמויות בתמונה**

בניגוד לטקסט מובנה שניתן לסנן בקלות, תמונות מכילות מידע רגיש שלא תמיד התכוונו לשתף:

- פנים של עובדים: מלגזן שעבר במקרה ברקע.

- מידע סודי: מסמכים רגישים שהיו מונחים על השולחן ליד החבילה.

- לוחיות רישוי: של משאיות צד ג' ברציף הטעינה.

לפני ששולחים תמונה למודל חיצוני (Public LLM), חייבים להריץ עליה תהליך של PII Redaction (טשטוש פנים וטקסט רגיש) בתוך ה-Pipeline הפנימי שלנו. זהו שלב קריטי ב-Data Engineering של תמונות שרבים שוכחים, והוא הכרחי לעמידה בתקני פרטיות כמו GDPR.

**טבלת החלטה: מתי להפעיל Multimodal?**

<div dir="rtl">

| **השיקו**ל | **Text-Only RAG** | **Multimodal RAG** |
| --- | --- | --- |
| **עלות (Cost)** | זול מאוד (אלפיות הסנט) | יקר (פי 10-50 לכל שאילתה) |
| **זמן תגובה (Latency)** | מהיר (< 1 שניה) | איטי (2-5 שניות לעיבוד תמונה) |
| **דיוק (Accuracy)** | גבוה לעובדות ומספרים | חיוני לתיאור מצב פיזי ונזקים |
| **פרטיות (Privacy)** | קל לסינון (Regex/NLP) | קשה לסינון (דורש Computer Vision לטשטוש) |
| **Use Case ב-LogiSmart** | סטטוס משלוח, תאריכים, כתובות | זיהוי נזק, אימות תכולה, חתימות |

</div>

**סיכום התבנית**

**Multimodal RAG Pattern** הוא לא רק "להוסיף תמונות".

הוא ארכיטקטורה שלמה של אחזור כפול (טקסט+תמונה), הרכבת פרומפט מובנה (Structured Prompting) שמציג עדויות ולא סתם מידע, ומנגנון שליטה (Router) שמחליט מתי "לשלם" את המחיר של עיבוד תמונה ומתי להסתפק בטקסט.

בראש פרק הבא, ב-Mini-Lab, נראה בדיוק איך בונים את זה בקוד: מאינדוקס ה PDF ועד לשאילתה המשלבת ראייה וקריאה.



**איור 7.3: תבנית RAG מולטי מודלי (The Multimodal RAG Flow)**

<img src="/Data-Engineering-for-AI-Systems/assets/image-28.png" alt="image-28.png" width="697" height="465" />

האיור מציג את זרימת המידע מהשאלה ועד לתשובה:

1. **בצד שמאל:** המשתמש שואל שאלה ("הראה לי נזק למשלוח X").

2. **במרכז (Router & Retriever):** רכיב "Query Router" מפצל את השאלה לשני נתיבים:

 - נתיב עליון (Text Search) שמחפש במטא-דאטה וטקסט OCR.

 - נתיב תחתון (Visual Search) שמחפש ב Image Embeddings (מופעל רק לפי הצורך).

3. **מימין למרכז (Context Assembly):** התוצאות משני הנתיבים מתאחדות לתוך "Context Window" המצויר כקולאז': תמונה + טקסט OCR + נתוני JSON.

4. **בצד ימין (Generation):** המודל (LLM) מקבל את הקולאז' ומוציא תשובה סופית ("יש נזק רטיבות, בניגוד למה שכתוב בתעודה").



## Mini Lab: בניית מנוע מולטי-מודאלי אמיתי (Real Binary Ingestion)

**בניית מנוע מולטי-מודאלי אמיתי (Real Binary Ingestion)**

עד עכשיו עסקנו במחרוזות (Strings). בעולם האמיתי, הלקוחות של LogiSmart מעלים קבצים: תמונות של נזק (JPG/PNG) ומסמכי שילוח (Text/PDF).

במעבדה זו נהפוך את המערכת שלנו למערכת Multimodal אמיתית שיודעת לקרוא קבצים מהדיסק הקשיח, לחלץ מהם מידע טכני, ולשמור אותו.

**שלב 0: הכנת הסביבה והתקנת ספריות**

מכיוון שאנחנו עומדים לפתוח קבצי תמונה אמיתיים, אנחנו צריכים ספרייה שיודעת לפענח פורמטים ויזואליים. נשתמש ב-Pillow, הספרייה הסטנדרטית בפייתון לעיבוד תמונה.

1. פתח את הטרמינל בתיקיית הפרויקט.

2. הרץ את הפקודה הבאה:

bash

pip install pillow

**שלב 1: ארגון התיקיות והקבצים (Setup)**

כדי שהפרויקט יהיה מסודר, לא נזרוק קבצים סתם כך. ניצור תיקייה ייעודית למידע גולמי.

כדי שלא תצטרך לחפש תמונות בגוגל, כתבנו עבורך סקריפט עזר קטן שייצר קבצים אמיתיים בתוך התיקייה הזו לצורך הניסוי.

צור קובץ בשם setup_data.py בתיקייה הראשית (chapter-06-rag) והרץ אותו פעם אחת בעזרת הפקודה:

bash

python setup_data.py

python

# setup_data.py

import os

from PIL import Image, ImageDraw

def create_real_assets():

# 1. Ensure the data directory exists

data_dir = os.path.join(os.path.dirname(__file__), "data")

os.makedirs(data_dir, exist_ok=True)



print(f"📂 Data directory ready at: {data_dir}")

# 2. Create a Real Image File (simulating broken glass)

# We draw a red square with text to act as a real binary JPG file

img_path = os.path.join(data_dir, "damage_evidence.jpg")

img = Image.new('RGB', (400, 300), color=(200, 50, 50)) # Red background

d = ImageDraw.Draw(img)

d.text((20, 140), "BROKEN GLASS - SEVERE DAMAGE", fill=(255, 255, 255))

img.save(img_path)

print(f"✅ Created real image file: {img_path}")

# 3. Create a Real Text File (simulating a manifest)

txt_path = os.path.join(data_dir, "shipping_manifest.txt")

with open(txt_path, "w", encoding="utf-8") as f:

f.write("SHIPMENT ID: LS-2026-X\nCONTENTS: High-End Glassware\nSTATUS: Fragile\nINSURANCE: Full Coverage")

print(f"✅ Created real text file: {txt_path}")

if __name__ == "__main__":

create_real_assets()

מה עשינו כאן? יצרנו קבצים פיזיים בדיסק. כעת יש לך תמונה אמיתית (.jpg) וקובץ טקסט אמיתי (.txt) בתיקיית data. המערכת שלנו תצטרך לקרוא אותם.

**שלב 2: הגדרת מודל הנתונים (The Data Schema)**

לפני שאנחנו בונים את המנוע, אנחנו חייבים להגדיר לו מה זה "משלוח" ומה זה "קובץ". בלי ההגדרה הזו, הקוד בשלבים הבאים ייכשל (שגיאת ModuleNotFoundError), כי הוא לא ידע מאיפה לייבא את האובייקטים.

צור קובץ חדש בשם src/models.py. קובץ זה ישמש כ"חוזה" (Contract) של המערכת שלנו:

python

# src/models.py

from dataclasses import dataclass

from typing import List, Literal, Dict, Any

@dataclass

class ShipmentArtifact:

"""Represents a single piece of evidence (text or image)."""

content_path: str   # Path to image file or text file

artifact_type: Literal['ocr_text', 'damage_photo', 'delivery_slip']

metadata: Dict[str, Any]

@dataclass

class ShipmentCase:

"""The aggregate unit: A collection of artifacts tied to one shipment."""

shipment_id: str

customer_id: str

artifacts: List[ShipmentArtifact]

למה זה נחוץ?

אובייקט ה-ShipmentCase הוא ה"דבק" שמחזיק יחד את התמונה (damage_photo) ואת הטקסט (ocr_text) תחת מזהה אחד (shipment_id).

**שלב 3: שירות ה-Ingestion החדש (קורא קבצים מהדיסק)**

כעת נכתוב את MultimodalIngestionService. שים לב להבדל הגדול מפרק 6: אנחנו משתמשים בפקודות ()open ו-()Image.open כדי לגשת למידע הבינארי.

צור (או עדכן) את הקובץ src/services/multimodal_ingestion.py:

python

# src/services/multimodal_ingestion.py

import os

from typing import List

from PIL import Image  # This handles the actual image binary data

from src.interfaces import VectorStoreInterface, IngestionDocument

from src.models import ShipmentCase

from src.services.text_ingestion import TextIngestionService

class MultimodalIngestionService:

def __init__(self, vector_store: VectorStoreInterface, text_service: TextIngestionService):

self.vector_store = vector_store

self.text_service = text_service

def _extract_image_features(self, file_path: str) -> str:

"""

Opens the physical file, verifies it's an image, and extracts metadata.

In a real AI system, this is where we would send the image bytes to CLIP/Gemini.

"""

try:

with Image.open(file_path) as img:

# We are actually reading the binary header of the file here

width, height = img.size

format_desc = img.format_description

filename = os.path.basename(file_path)



# We return a structured description of what we found

return f"[IMAGE FOUND: File={filename} | Dim={width}x{height} | Type={format_desc}]"

except Exception as e:

print(f"❌ Error opening image {file_path}: {e}")

return "[IMAGE ERROR: Corrupt or missing file]"

def _read_text_file(self, file_path: str) -> str:

"""Reads the raw content of a text file from disk."""

try:

with open(file_path, 'r', encoding='utf-8') as f:

content = f.read()

filename = os.path.basename(file_path)

return f"[FILE CONTENT ({filename}): {content}]"

except Exception as e:

return f"[TEXT ERROR: {e}]"

def ingest_case(self, case: ShipmentCase) -> int:

print(f"--- 📥 Starting Ingestion for Case: {case.shipment_id} ---")

docs_to_ingest = []

for artifact in case.artifacts:

# Validation: Does the file actually exist?

if not os.path.exists(artifact.content_path):

print(f"⚠️ Warning: File not found at {artifact.content_path}")

continue

base_metadata = {

"parent_id": case.shipment_id,

"type": artifact.artifact_type,

**artifact.metadata**

}

# Branching logic based on artifact type

if artifact.artifact_type == 'damage_photo':

# Open and process the image file

visual_description = self._extract_image_features(artifact.content_path)



doc = IngestionDocument(

content=visual_description,

metadata=base_metadata,

doc_id=f"{case.shipment_id}_{artifact.artifact_type}"

)

docs_to_ingest.append(doc)

print(f"📸 Processed Real Image: {artifact.content_path}")

elif artifact.artifact_type == 'ocr_text':

# Open and read the text file

text_content = self._read_text_file(artifact.content_path)



doc = IngestionDocument(

content=text_content,

metadata=base_metadata,

doc_id=f"{case.shipment_id}_{artifact.artifact_type}"

)

docs_to_ingest.append(doc)

print(f"📄 Processed Real Text: {artifact.content_path}")

# Store everything in the vector DB

self.vector_store.add_documents(docs_to_ingest)

return len(docs_to_ingest)

**שלב 4: ה-Chat Service (המוח)**

כדי לסגור את המעגל, אנחנו צריכים רכיב שיענה על שאלות בהתבסס על מה שקראנו מהקבצים.

צור קובץ src/services/generation.py:

python

# src/services/generation.py

from typing import List

from src.interfaces import IngestionDocument

class MockLLMService:

"""

Simulates the AI generation layer.

It takes the retrieved documents (context) and the user question to form an answer.

"""

def generate_answer(self, user_query: str, context_docs: List[IngestionDocument]) -> str:

# 1. Analyze the Context

# We look at what the retrieval step found in the database

found_image = any("IMAGE FOUND" in d.content for d in context_docs)

found_manifest = any("SHIPMENT ID" in d.content for d in context_docs)



print(f"\n🧠 AI Processing Context...")

for doc in context_docs:

print(f"   > Evidence: {doc.content[:60]}...") # Print preview

# 2. Formulate Answer (Rule-based simulation for the lab)

if "damage" in user_query.lower() or "broken" in user_query.lower():

if found_image:

return "DETECTED DAMAGE: I have analyzed the image file 'damage_evidence.jpg'. The visual data confirms severe damage (Broken Glass)."

else:

return "No visual evidence of damage was found in the files."



elif "manifest" in user_query.lower() or "id" in user_query.lower():

if found_manifest:

return "MANIFEST VERIFIED: The shipment ID is LS-2026-X containing High-End Glassware."



return "I have analyzed the provided files but cannot answer that specific question."

**שלב 5: הרצה אינטגרטיבית (The Grand Finale)**

כעת נחבר הכל. הסקריפט הזה ייגש לתיקיית data שיצרנו, יקרא את הקבצים, יכניס אותם למסד הנתונים, ואז ישאל שאלה עליהם.

צור את src/main_multimodal.py:

python

# src/main_multimodal.py

import os

from src.infrastructure.chroma_store import ChromaVectorStore

from src.services.text_ingestion import TextIngestionService

from src.services.multimodal_ingestion import MultimodalIngestionService

from src.services.generation import MockLLMService

from src.models import ShipmentCase, ShipmentArtifact

def run_real_lab():

# --- SETUP ---

# Define paths to the REAL files we created in Step 1

base_dir = os.path.join(os.getcwd(), "data")

img_path = os.path.join(base_dir, "damage_evidence.jpg")

txt_path = os.path.join(base_dir, "shipping_manifest.txt")

# Initialize System

vector_db = ChromaVectorStore(collection_name="logismart_real_files")

vector_db.reset() # Clean slate



text_svc = TextIngestionService(vector_db)

multimodal_svc = MultimodalIngestionService(vector_db, text_svc)

llm = MockLLMService()

# --- STEP 1: INGESTION (IO Operations) ---

print(f"📂 Reading files from: {base_dir}")



case = ShipmentCase(

shipment_id="LS-2026-X",

customer_id="GLOBAL-IMPORTS-LTD",

artifacts=[

# We point the system to the actual files on your disk

ShipmentArtifact(img_path, "damage_photo", {"camera": "Dock-04"}),

ShipmentArtifact(txt_path, "ocr_text", {"scanner": "Gate-1"})

]

)



# This triggers the real file opening logic

multimodal_svc.ingest_case(case)

# --- STEP 2: RAG CHAT (The User Experience) ---

user_question = "What evidence of damage do we have?"

print(f"\n👤 User Question: '{user_question}'")



# A. Retrieve

results = vector_db.search("damage", limit=3)



# B. Generate

answer = llm.generate_answer(user_question, results)



print(f"\n💡 LogiSmart AI Answer: {answer}")

if __name__ == "__main__":

run_real_lab()

**איך מריצים? (Crucial Step)**

מכיוון שאנחנו עדיין באותה תיקייה (chapter-06-rag), פשוט מריצים:

bash

python -m src.main_multimodal

**סיכום**

בפרק זה בנינו מערכת אמיתית:

1. יצרנו קבצים (תמונה וטקסט) בדיסק.

2. בנינו שירות שיודע לפתוח ולנתח קבצים בינאריים.

3. בנינו מנוע צ'אט שמבסס את התשובות שלו על תוכן הקבצים הללו.


