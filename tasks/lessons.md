## לקחים

### 2026-04-06
קבצי src/pipeline/ חייבים להכיל קוד אמיתי לפני הרצת pipeline.
בלעדיהם הסוכנים כותבים את הקוד מחדש בכל הרצה ושורפים tokens מיותרים.

### 2026-04-06
מעבר שפה עברית/אנגלית לא עבד בריצה הראשונה.
הסיבה: Builder לא יישם את מנגנון ה-cookie ואת ה-?lang= ב-URL.
הפתרון: לאחר שBuilder מסיים, בדוק ידנית שמעבר השפה עובד לפני שממשיכים.

### 2026-04-07
Astro.url.searchParams לא עובד ב-output: static.
הסיבה: בבנייה סטטית אין request לכן searchParams תמיד ריק.
הפתרון: להטמיע את שני הגרסאות (עברית/אנגלית) ב-HTML ולבצע שינוי שפה בצד הלקוח
דרך [data-he]/[data-en] attributes + script שקורא window.location.search.

### 2026-04-07
Builder לא בנה דף בית ללא הוראה מפורשת.
כפתור שפה נבנה חד כיווני ללא בדיקה.

### 2026-04-07
Translator לא צריך לקרוא ל-API ישירות.
הוא סוכן Claude Code שמתרגם בעצמו כחלק מה-session.
אם הסוכן ביקש API key לתרגום, זה שגוי.

### 2026-04-07
parse.py חילץ תמונה אקראית לפי סדר relations ולא תמונת השער.
צריך לחלץ לפי מיקום בדף, לא לפי סדר ה-relations.

### 2026-04-09
**CRITICAL BUG FIXED:** extract_images() שמר תמונה שגויה כ-cover.png.
הבעיה המקורית: הקוד סרק doc.part.rels.items() והתמונה הראשונה ב-dictionary נשמרה כ-cover.
סדר dictionary iteration אינו מובטח ולא מתאים לסדר המסמך.
במקרה Machine Learning, rId13 (תמונה מעמוד 4) נשמרה כ-cover במקום rId11 (תמונה מפסקה 8).

הפתרון הראשון (לא מספיק): למפות כל תמונה ל-para_idx, למיין לפי מיקום, התמונה עם para_idx הנמוך ביותר = cover.png.
הבעיה הנוספת שהתגלתה: במסמך הזה אין תמונה לפני Heading 1 הראשון!
"פתיחה" (Heading 1) מופיעה בפסקה 0, כל התמונות מופיעות אחרי זה (מפסקה 8).

**הפתרון המלא:**
1. למצוא את Heading 1 הראשון (first_heading_idx)
2. למפות כל תמונה לפסקה שלה ולמיין לפי סדר
3. **רק אם** התמונה הראשונה מופיעה **לפני** Heading 1 → זו cover.png
4. אחרת: אין cover, כל התמונות מסופרות image-01, image-02...
5. מחזיר has_cover flag כדי שהקוד ידע אם יש שער או לא

### 2026-04-09
**CRITICAL BUILD ISSUE:** dist/ הכיל תמונות ישנות שעקפו את output/.
הבעיה: public/machine-learning-summary/ נוצר בטעות עם תמונות מגרסה ישנה (cover.png = 184KB).

### 2026-04-12
**TRANSLATION FORMATTING:** בעת תרגום פרקים, לשמור על כל סימני ** (bold) מהמקור.
הבעיה: בכמה תרגומים, טקסט שהיה אמור להיות מודגש נכתב ללא כוכביות.
דוגמה: "High Precision →" במקום "**High Precision** →"
הפתרון:
1. לפני תרגום, לסרוק את המקור עם Select-String -Pattern "\*\*" לזיהוי כל הטקסט המודגש
2. בתרגום, לוודא שכל מונח/משפט שמופיע בין ** במקור גם יופיע בין ** בתרגום
3. אחרי תרגום, לאמת: Select-String -Pattern "\*\*" | Measure-Object על המקור והתרגום - המספרים צריכים להיות זהים

### 2026-04-12
**SPANISH LOCALIZATION - תרגום תרבותי, לא מילולי:**
משוב: התרגום לספרדית היה טכנית נכון אך לא זרם בצורה טבעית לדוברי ספרדית.
הבעיה: תרגום 1:1 במקום התאמה תרבותית (localization).

**עקרונות לתרגום ספרדית איכותי:**
1. **זרימה טבעית:** מבנה משפט ספרדי, לא העתקה של מבנה עברי/אנגלי
2. **ספרדית ניטרלית (español neutro):** נמנעים מסלנג אזורי (ארגנטינה, מקסיקו, ספרד)
3. **מונחים טכניים מקובלים:**
   - Machine Learning → Aprendizaje automático (לא "de máquina")
   - Neural Network → Red neuronal
   - Dataset → Conjunto de datos
4. **רישום עקבי:** usted לטקסטים מקצועיים, tú להדרכה ידידותית
5. **ביטויים אידיומטיים:** "prestar atención" ולא "poner atención"
6. **סימני פיסוק:** ¿...? ו-¡...! עם סימנים הפוכים בתחילת משפט

**הנחיות עודכנו ב:** .claude/agents/translator.md
**לבדיקה:** לבקש מדוברת ספרדית native לקרוא קטע ולתת משוב על טבעיות

### 2026-04-12
**CHAPTER COMPLETION SIDEBAR:** חיווי השלמת פרקים בסיידבר לא התעדכן בזמן אמת.
הבעיה: chapter-completion.ts הציג panel של "פרק הושלם" אבל לא שמר את הסטטוס ולא עדכן את הסיידבר.
reading-stats.ts השתמש בscroll position כאינדיקציה להשלמה (לא אמין).

הפתרון:
1. הוספת `markChapterComplete()` ב-chapter-completion.ts ששומר ל-localStorage בkey `yuval_ch_complete_${book}`
2. הוספת `updateSidebarCheckmarks()` שמוסיפה סימני ✓ לפרקים שהושלמו
3. קריאה ל-updateSidebarCheckmarks בעת טעינת דף ואחרי כל השלמת פרק
4. עדכון reading-stats.ts לקרוא מאותו storage key
5. הוספת CSS ל-ChapterSidebars.astro עם `.toc-item-completed` ו-`.chapter-complete-check`

Event: window dispatches 'chapter-completed' { detail: { book, chapter } } כשפרק מושלם.
Astro מעתיק את public/ ישירות ל-dist/ ללא בדיקה, לכן תמונות ישנות עקפו את הנכונות.
הפתרון: למחוק public/{book-name}/ אם נוצר בטעות. רק public/covers/ אמור להכיל תמונות ספרים.

### 2026-04-10
**COVER DETECTION LOGIC SIMPLIFIED:** הלוגיקה לזיהוי תמונת שער הייתה מורכבת מדי עם בדיקת Heading 1.
במסמך ML, התמונה הראשונה (פסקה 8) היא אחרי שני ה-Headings הראשונים (פסקה 0 "פתיחה", פסקה 6 "מה זה AI").
הלוגיקה הקודמת ניסתה לבדוק אם יש תמונה **לפני** Heading 1, אבל זה לא תופס ספרים שבהם יש כותרת פתיחה + תמונת שער + פרק ראשון.
**הפתרון הסופי:** כלל פשוט - אם התמונה הראשונה מופיעה בתוך **15 הפסקאות הראשונות**, היא תמונת השער.
זה תופס את רוב המקרים (חזור) ללא לוגיקה מורכבת. המגבלה של 15 פסקאות מונעת תמונות מאוחרות מלהיחשב כשער.

### 2026-04-10
**CRITICAL FIX: SDT COVER PAGE IMAGES WERE IGNORED!**
הבעיה האמיתית: תמונת דף השער הייתה ב-**SDT** (Structured Document Tag) **לפני** פסקה 0.
`extract_images()` עבר רק על `doc.paragraphs` ולכן דילג על תמונות בעמוד השער.
המסמך ML יש עמוד שער נפרד עם **שתי תמונות** (rId9 + rId10) לפני "פתיחה".
**הפתרון:**
1. לחפש תמונות גם ב-`body.xpath('.//sdt')` (Structured Document Tags)
2. לתייג תמונות אלו עם position=-1 (לפני פסקה 0)
3. אם יש מספר תמונות ב-SDT, לקחת את **האחרונה** (המשתמש מחק את הראשונה)
4. תמונות ב-SDT לא מופיעות בפלט MD (רק cover.png נשמר)
התוצאה: rId10 (338.7 KB) זוהתה נכון כתמונת השער.

**לקח להבא:** בספר חדש, **תמיד לבדוק SDT elements תחילה** לפני חיפוש בפסקאות.
זה חוסך זמן ומונע בלבול. הקוד עכשיו עושה את זה אוטומטית.
Astro מעתיק את public/ ישירות ל-dist/, ולכן הגרסה הישנה overwrite את כל העדכונים.
התוצאה: dist/machine-learning-summary/assets/image-18.png היה 338KB (ישן) במקום 1351KB (חדש).
הפתרון: מחיקת public/machine-learning-summary/ לגמרי.
תמונות צריכות לבוא רק מoutput/*/assets/ (נטען דרך MD files).
רק public/covers/ צריך להכיל cover images (מועתק מoutput/*/assets/cover.png).
כלל: אל תיצור public/{book-name}/ - זה יגרום לconfusion עם output/.

### 2026-04-08
Builder צריך להטמיע טעינת chapter content מ-markdown files בדף קריאה.
הדף /read/[book]/[chapter] לא צריך להיות stub. צריך עומס בפועלי של chapter-XX.he.md או chapter-XX.en.md
בהתאם לשפה (מ-localStorage או ?lang= parameter).

### 2026-04-08
Event listeners בקומפוננטים צריכים cleanup על page transition.
אחרת addEventListener calls מתצברים בזיכרון (memory leak).
פתרון: AbortController או removeEventListener ב-astro:before-unmount hook.

### 2026-04-08
Language/RTL logic חוזר בכל קומפוננט (7+ מיקומים).
צריך extract לreusable utility function כדי לחזור מ-code duplication.
זה קריטי למיתחזוקה.

### 2026-04-08
Builder צריך להוסיף data-he ו-data-en attributes לכל elements שבהם text.
זה נחוץ לmultilingual content switching בצד הלקוח.

### 2025-01-28
image positioning ב-Word דורש XML parsing.
python-docx לא מספקת מיפוי ישיר של תמונה לפסקה.
פתרון: parse את run._element.xml לזהות image relationships ולמפות למקום המדויק בטקסט.
בלי זה, תמונות יושבות בסוף הקובץ.

### 2025-01-28
design-system.json חייב להיות complete כמו sample-book.
UI Designer לפעמים יוצר JSON חלקי ללא spacing/components/breakpoints/rtl.
Error Handler צריך לוודא שכל השדות הבסיסיים קיימים ולהשלים אם חסרים.
קומפוננטים מתבססים על ההגדרות האלה.

### 2025-01-28
data-loader.ts לא צריך hardcoded slugs.
הוא צריך לקרוא ל-discoverAllBooks() של book-discovery.ts.
ספרים חדשים צריכים להתגלות אוטומטית ללא שינוי קוד.
זה DRY - book-discovery הוא מקור האמת היחיד.

### 2025-01-28
translation pipeline יעילה עם batch reads.
במקום לקרוא פרק אחד בכל פעם, קרא 4 פרקים בכל batch ותרגם במקביל.
זה חוסך round-trips ומאיץ משמעותית (29 פרקים תורגמו ב-~10 דקות).

### 2025-01-28
AbortController חיוני לניקוי event listeners בAstro SPA.
בכל component שמוסיף event listener, צריך:
1. `const controller = new AbortController()`
2. `addEventListener(..., { signal: controller.signal })`
3. Cleanup on `astro:before-unmount` ו-`window.unload`

### 2026-04-08
Language switching צריך centralized utilities, לא שכפול בכל component.
יצרנו language.ts עם:
- getLanguageFromStorage() - single source of truth
- setLanguageToStorage() - updates localStorage + cookie + DOM
- applyLanguageToPage() - toggles data-he/data-en visibility
- dispatchLanguageChangeEvent() - custom event for components
זה חסך הרבה קוד כפול וזיהום.

### 2026-04-08
getStaticPaths() חיוני לכל dynamic routes בAstro static builds.
צריך להגדיר את כל הפרמטרים האפשריים (books, chapters) לפני הבנייה.
בלי זה הבנייה נכשלת עם "getStaticPaths required" error.

### 2026-04-08
markdown content loading עובד דרך fetch() ל-public files.
בAstro static build, יש טוען לטעון files מתיקיית output/ דרך URL.
צריך להעביר markdown files ל-public/{book}/{chapter}.{lang}.md 
או למטמון בבנייה כחלק של content collection.

### 2026-04-12
**Em dash (-) ו-en dash (–) אסורים בקבצי MD.**
הבעיה: Claude מייצר em/en dashes בתרגום, וקבצי Word מכילים אותם.
זה נראה לא נקי ולא עקבי עם רוב הקוד.

**הפתרון:**
1. `fix_rtl_text()` ב-translate.py מחליף אותם במקף רגיל (-)
2. `build.py` step 5.5 מריץ `fix_all_hebrew_files()` אוטומטית

### 2026-04-12
**Language toggle חייב להיות מקור אמת יחיד.**
הבעיה: המערכת זיהתה שפה מכמה מקורות - URL ?lang= קודם ל-localStorage.
כשמשתמש לחץ על toggle ואז ניווט לפרק אחר, ה-URL הישן הכתיב שפה אחרת.

**הפתרון:**
1. `getLanguageFromStorage()` קורא רק מ-localStorage (+ cookie כfallback)
2. הסרנו את ?lang= מכל URLs פנימיים
3. הטוגל (הבועה הזהובה) הוא המקור היחיד לאמת

### 2026-04-14
**Tailwind מסיר list-style מרשימות ממוספרות ולא ממוספרות.**
הבעיה: רשימות ol/ul לא הציגו מספרים או נקודות כי Tailwind preflight מאפס אותם.

**הפתרון (ב-ReadingLayout.astro):**
```css
:global(article ul) {
  list-style-type: disc;
}
:global(article ol) {
  list-style-type: decimal;
}
```
התיקון כבר מוטמע. ספרים חדשים יקבלו עיצוב רשימות אוטומטית.
4. קבצים שעודכנו:
   - `language.ts` - הסרת URL param priority
   - `language-switcher.ts` - הסרת URL param check
   - `LanguageToggle.astro` - כבר עובד מ-localStorage
   - `ChapterSidebars.astro` - הסרת ?lang= מלינקים
   - `BookCard.astro`, `ChapterNavigation.astro` - הסרת עדכון URLs
   - `search.ts`, `search-index.json.ts` - URL יחיד ללא שפה
   - `bookmarks.ts`, `highlights-panel.ts` - URLs נקיים
3. לא צריך יותר להריץ `--fix-rtl` ידנית

כלל לתרגום: כשמתרגמים ידנית, תמיד להשתמש במקף רגיל (-), לא ב-em/en dashes.

### 2026-04-12
**content-structure.json לא התעדכן עם כותרות מתורגמות.**
הבעיה: `organize.py` יוצר content-structure.json עם placeholders בעברית לכל השפות.
לדוגמה: `"titles": { "he": "פרק 1", "en": "פרק 1", "es": "פרק 1" }` - כולן עברית!
זה קורה כי organize.py רץ לפני התרגום ואין לו גישה לתרגומים.

**הפתרון:**
1. הוספת `update_content_structure_titles()` ב-translate.py
2. הפונקציה קוראת כותרת מכל קובץ `.{lang}.md` (שורת `# ...` ראשונה)
3. מעדכנת את ה-JSON עם כותרות בשפה הנכונה
4. הוספת `--finalize` flag ל-build.py שמריץ את העדכון + sync ל-src/output
5. אחרי תרגום: `python -m pipeline.build ml-book --finalize`

**שימו לב:** כותרת הספר עצמו (לא הפרקים) לא מתעדכנת אוטומטית - צריך לתרגם ידנית.

### 2026-04-14
**data-es חייב להשתמש ב-title_es ולא ב-title_en.**
הבעיה: ב-ChapterNavigation, כל ה-`data-es` attributes הוגדרו כ-`title_en` במקום `title_es`.
זה גרם לכך שכשבחרת ספרדית, כותרות הפרקים הופיעו באנגלית.

**הפתרון:**
```jsx
// נכון:
data-es={chapter.title_es || chapter.title_en}
// לא נכון:
data-es={chapter.title_en}
```

**כלל:** בכל קומפוננט שמשתמש ב-data-he/data-en/data-es, לוודא שכל שפה מקבלת את הערך שלה עם fallback.

### 2026-06-02
**משתני CSS מותאמי-מובייל שהוגדרו רק בבלוק הדסקטופ = טרנספורם שבור בשקט.**
הבעיה: בקרוסלת הסדרה במובייל (`index.astro`), כלל החברים `[data-stage-mode="series"] .galaxy-card.is-active-series-member`
השתמש ב-`--series-rel` / `--series-abs-rel` / `--series-row-x` בתוך `transform`, אבל שלושת המשתנים הוגדרו
**רק** בכלל המקביל שבתוך `@media (min-width:1024px)`. בערכי מובייל הם היו undefined, ה-`calc()` הפך לא תקין,
כל הצהרת ה-`transform` נזרקה, וכל השיעורים נערמו במרכז. נראה כמו "הכפתור לא עושה כלום".

**הפתרון:** להגדיר את המשתנים הנגזרים גם בכלל המובייל (לא להסתמך על ירושה מכלל בבלוק media אחר —
media query מגדיר את כל ההצהרות בכלל, כולל הצהרות `--custom-prop`).

**כלל:** אם כלל ב-`@media` משתמש ב-`var(--x)` בתוך `transform`/`calc`, ודא ש-`--x` מוגדר בכלל שחל **באותו** breakpoint.
custom property לא "זולג" מבלוק media אחר.

### 2026-06-02
**שני מסלולי series-mode מקבילים — חובה לתאם דגלי-DOM ביניהם.**
הרקע: יש שתי דרכים להיכנס ל"מצב סדרה" באורביט:
1. `enterSeriesMode(name)` ב-`universe-series-mode.ts` — מבוסס שם (`data-series-member`), מזריע `--series-focused-index`, מזריק כרטיס יציאה "Other Knowledge".
2. `applyCourseFilter(card)` ב-`universe-series-actions.ts` — מבוסס `data-series-id` (חזק, עובד בלי מטא-דאטה), אבל **לא** עושה את כל מה שהמסלול הראשון עושה.

הבאג: כפתור "הצג ספרי הסדרה" קורא ל-`applyCourseFilter`, שמסיר `data-pos` מכרטיס הקורס ידנית **בלי** `closeCenter()`.
לכן `data-focus-hidden` נשאר על הניווט התחתון במובייל → החצים (שכבר מחווטים לדפדף בין החברים) נשארו מוסתרים → "כלום לא קורה".

**הפתרון:** כש-`applyCourseFilter` נכנס/יוצא ממצב סדרה, לתאם ידנית את דגלי הניווט התחתון
(`delete focusHidden`, `set/delete seriesMode`). כללי `.is-muted`/`.is-active-series-capsule` קיימים היו רק בדסקטופ — להוסיף גם למובייל.

**כלל:** כשמודול A משכפל מצב שמודול B מנהל (focus/series), כל מעבר מצב חייב לתאם את **כל** הדגלים המשותפים,
אחרת מצב "תקוע למחצה" — חלק מה-UI חושב שהכרטיס פתוח וחלק חושב שלא.