/**
 * Central translation registry.
 *
 * HOW TO ADD A NEW LANGUAGE:
 *   1. Add it to SUPPORTED_LANGUAGES in src/utils/language.ts
 *   2. Add its translations here - any missing key falls back to English.
 *
 * HOW TO ADD A NEW STRING:
 *   1. Add a key here with at least an `en` value.
 *   2. Use data-i18n="key" in .astro, or t('key', lang) in .ts scripts.
 *
 * INTERPOLATION: use {{param}} in strings, pass { param: value } to t().
 */

export type Translations = Record<string, Record<string, string>>;

export const translations: Translations = {

  // ── FAB / Reading Controls ──────────────────────────────────────────────────
  'fab.theme':             { he: 'ערכת צבע',     en: 'Theme',            es: 'Tema' },
  'fab.typography':        { he: 'גופן',          en: 'Typography',       es: 'Tipografía' },
  'fab.focus':             { he: 'מיקוד',         en: 'Focus',            es: 'Enfoque' },
  'fab.navigation':        { he: 'ניווט',         en: 'Navigation',       es: 'Navegación' },
  'fab.highlights':        { he: 'הדגשות',        en: 'Highlights',       es: 'Resaltados' },
  'fab.readAloud':         { he: 'הקראה',          en: 'Read aloud',       es: 'Leer en voz alta' },
  'fab.readAloudPause':    { he: 'השהה הקראה',     en: 'Pause reading',    es: 'Pausar lectura' },
  'chapter.scrollToTop':   { he: 'גלול למעלה',    en: 'Scroll to top',    es: 'Desplazar arriba' },

  // ── Display Settings Panel ──────────────────────────────────────────────────
  'display.settings':      { he: 'הגדרות תצוגה',  en: 'Display Settings', es: 'Configuración de pantalla' },
  'display.textSize':      { he: 'גודל טקסט',     en: 'Text Size',        es: 'Tamaño de texto' },
  'display.lineHeight':    { he: 'גובה שורה',      en: 'Line Height',      es: 'Interlineado' },
  'display.width':         { he: 'רוחב',           en: 'Width',            es: 'Ancho' },
  'display.widthNarrow':   { he: 'צר',             en: 'Narrow',           es: 'Estrecho' },
  'display.widthMedium':   { he: 'בינוני',         en: 'Medium',           es: 'Medio' },
  'display.widthWide':     { he: 'רחב',            en: 'Wide',             es: 'Amplio' },
  'display.font':          { he: 'גופן',           en: 'Font',             es: 'Fuente' },
  'display.reset':         { he: 'איפוס',          en: 'Reset defaults',   es: 'Restablecer' },

  // ── Focus Mode ──────────────────────────────────────────────────────────────
  'focus.mode':            { he: 'מצב מרוכז',     en: 'Focus Mode',       es: 'Modo enfoque' },
  'focus.toExit':          { he: 'ליציאה',         en: 'to exit',          es: 'para salir' },

  // ── Navigation ──────────────────────────────────────────────────────────────
  'nav.chapterNavLabel':   { he: 'ניווט פרקים',    en: 'Chapter navigation', es: 'Navegación de capítulos' },
  'nav.chapterOf':         { he: 'פרק {{n}} מתוך {{total}}', en: 'Chapter {{n}} of {{total}}', es: 'Capítulo {{n}} de {{total}}' },
  'chapter.label':         { he: 'פרק',            en: 'Chapter',          es: 'Capítulo' },

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  'sidebar.openNavigation': { he: 'פתח ניווט',      en: 'Open navigation',  es: 'Abrir navegación' },
  'sidebar.chapters':      { he: 'פרקים',          en: 'Chapters',         es: 'Capítulos' },
  'sidebar.inChapter':     { he: 'בפרק זה',        en: 'In This Chapter',  es: 'En Este Capítulo' },
  'sidebar.toc':           { he: 'תוכן עניינים',   en: 'Table of Contents', es: 'Tabla de Contenidos' },
  'sidebar.outline':       { he: 'מתוכן הפרק',     en: 'Chapter Outline',  es: 'Esquema del Capítulo' },
  'sidebar.noSections':    { he: 'לא נמצאו סעיפים', en: 'No sections found', es: 'No se encontraron secciones' },
  'sidebar.noSectionsFound': { he: 'לא נמצאו סעיפים', en: 'No sections found', es: 'No se encontraron secciones' },

  // ── Reading status ──────────────────────────────────────────────────────────
  'reading.total':         { he: '{{n}} דקות קריאה', en: '{{n}} min read',   es: '{{n}} min de lectura' },
  'reading.remaining':     { he: '{{n}} דקות נותרו', en: '{{n}} min left',   es: '{{n}} min restantes' },
  'reading.completed':     { he: 'הקריאה הושלמה',   en: 'Completed',        es: 'Completado' },

  // ── Home page ───────────────────────────────────────────────────────────────
  'home.title':            { he: 'ספרים',          en: 'Books',            es: 'Libros' },
  'home.subtitle':         { he: 'התחקות של ידע מעמיק ויישום מעשי', en: 'Explorations of deep knowledge and practical application', es: 'Exploraciones de conocimiento profundo y aplicación práctica' },
  'home.bookAvailable':    { he: 'ספר זמין',       en: 'book available',   es: 'libro disponible' },
  'home.booksAvailable':   { he: 'ספרים זמינים',   en: 'books available',  es: 'libros disponibles' },
  'home.all':              { he: 'הכל',            en: 'All',              es: 'Todos' },
  'home.continueReading':  { he: 'המשך קריאה',     en: 'Continue Reading', es: 'Continuar leyendo' },
  'home.chapter':          { he: 'פרק',            en: 'Chapter',          es: 'Capítulo' },
  'home.chapterShort':     { he: 'פרק',            en: 'Ch.',              es: 'Cap.' },
  'home.continueShort':    { he: 'המשך',           en: 'Continue',         es: 'Continuar' },
  'home.noBooks':          { he: 'אין ספרים זמינים כרגע', en: 'No books available yet', es: 'No hay libros disponibles aún' },
  'home.noBooksHint':      { he: 'הוסף ספרים לתיקיית output/ כדי להתחיל', en: 'Add books to the output/ folder to get started', es: 'Agrega libros a la carpeta output/ para comenzar' },

  // ── Search ──────────────────────────────────────────────────────────────────
  'search.placeholderChapter': { he: 'חפש בפרק...', en: 'Search chapter...', es: 'Buscar en el capítulo...' },
  'search.placeholderBook': { he: 'חפש בספר...', en: 'Search book...', es: 'Buscar en el libro...' },
  'search.modeChapter':    { he: 'חיפוש בפרק',      en: 'Search chapter',    es: 'Buscar en capítulo' },
  'search.modeBook':       { he: 'חיפוש בספר',      en: 'Search book',       es: 'Buscar en libro' },
  'search.noResults':      { he: 'אין תוצאות',       en: 'No results',        es: 'Sin resultados' },
  'search.results':        { he: '{{n}} מתוך {{total}}', en: '{{n}} of {{total}}', es: '{{n}} de {{total}}' },
  'search.chapterLabel':   { he: 'פרק {{n}}',        en: 'Chapter {{n}}',     es: 'Capítulo {{n}}' },
  'search.ariaPrev':       { he: 'תוצאה קודמת',      en: 'Previous result',   es: 'Resultado anterior' },
  'search.ariaNext':       { he: 'תוצאה הבאה',       en: 'Next result',       es: 'Resultado siguiente' },
  'search.ariaClose':      { he: 'סגור חיפוש',       en: 'Close search',      es: 'Cerrar búsqueda' },

  // ── ARIA Labels (accessibility) ─────────────────────────────────────────────
  'aria.highlights':       { he: 'ההדגשות שלי',     en: 'My highlights',     es: 'Mis resaltados' },
  'aria.bookmarks':        { he: 'סימניות',          en: 'Bookmarks',         es: 'Marcadores' },
  'aria.stats':            { he: 'סטטיסטיקות קריאה', en: 'Reading stats',     es: 'Estadísticas de lectura' },
  'aria.tts':              { he: 'האזן לפרק',        en: 'Listen to chapter', es: 'Escuchar capítulo' },

  // ── Book page ───────────────────────────────────────────────────────────────
  'book.chapterOne':       { he: 'פרק אחד',       en: '1 chapter',        es: '1 capítulo' },
  'book.chapters':         { he: '{{n}} פרקים',   en: '{{n}} chapters',   es: '{{n}} capítulos' },
  'book.words':            { he: '{{n}} מילים',   en: '{{n}} words',      es: '{{n}} palabras' },
  'book.sectionOne':       { he: 'סעיף אחד',      en: '1 section',        es: '1 sección' },
  'book.sections':         { he: '{{n}} סעיפים',  en: '{{n}} sections',   es: '{{n}} secciones' },
  'book.lecturer':         { he: 'מרצה',         en: 'Lecturer',         es: 'Instructor' },
  'book.editedBy':         { he: 'סיכום ועריכה', en: 'Summarized and edited by', es: 'Resumido y editado por' },
  'book.by':               { he: 'מאת:',          en: 'By:',              es: 'Por:' },

  // ── Header ─────────────────────────────────────────────────────────────────
  'header.skipToContent':  { he: 'דלג לתוכן',       en: 'Skip to content',  es: 'Saltar al contenido' },

  // ── Breadcrumbs ─────────────────────────────────────────────────────────────
  'breadcrumb.books':      { he: 'ספרים',          en: 'Books',            es: 'Libros' },

  // ── Text-to-Speech ──────────────────────────────────────────────────────────
  'tts.label':             { he: 'האזן לפרק',      en: 'Listen to chapter', es: 'Escuchar capítulo' },
  'tts.play':              { he: 'נגן',             en: 'Play',             es: 'Reproducir' },
  'tts.pause':             { he: 'השהה',            en: 'Pause',            es: 'Pausar' },
  'tts.stop':              { he: 'עצור',            en: 'Stop',             es: 'Detener' },
  'tts.speed':             { he: 'מהירות',          en: 'Speed',            es: 'Velocidad' },
  'tts.voice':             { he: 'קול',             en: 'Voice',            es: 'Voz' },
  'tts.notSupported':      { he: 'הדפדפן שלך לא תומך בקריאה בקול', en: "Your browser doesn't support text-to-speech", es: 'Tu navegador no soporta lectura en voz alta' },
  'tts.clickToRead':       { he: 'לחץ לקריאה מכאן', en: 'Click to read from here', es: 'Clic para leer desde aquí' },
  'tts.resume':            { he: 'המשך מהמיקום האחרון', en: 'Resume from last position', es: 'Reanudar desde la última posición' },
  'tts.panelTitle':        { he: 'הקראה',           en: 'Read aloud',       es: 'Lectura en voz alta' },
  'tts.slow':              { he: 'איטי',             en: 'Slow',             es: 'Lento' },
  'tts.normal':            { he: 'רגיל',             en: 'Normal',           es: 'Normal' },
  'tts.fast':              { he: 'מהיר',             en: 'Fast',             es: 'Rápido' },
  'tts.fromSelection':     { he: 'התחל מהטקסט שנבחר', en: 'Start from selected text', es: 'Empezar desde la selección' },
  'tts.fromTop':           { he: 'התחל מההתחלה',    en: 'Start from top',   es: 'Empezar desde arriba' },
  'tts.preview':           { he: 'האזן לדוגמה',     en: 'Preview voice',    es: 'Vista previa' },
  'tts.progress':          { he: 'התקדמות הקראה',   en: 'Reading progress', es: 'Progreso de lectura' },
  'tts.close':             { he: 'סגור',             en: 'Close',            es: 'Cerrar' },
  'tts.noVoices':          { he: 'לא נמצאו קולות',   en: 'No voices found',  es: 'No se encontraron voces' },
  'tts.miniPlayer':        { he: 'נגן הקראה',        en: 'Read-aloud player', es: 'Reproductor de lectura' },
  'tts.previous':          { he: 'משפט קודם',        en: 'Previous sentence', es: 'Oración anterior' },
  'tts.next':              { he: 'משפט הבא',         en: 'Next sentence',    es: 'Siguiente oración' },
  'tts.expand':            { he: 'פתח הגדרות',       en: 'Open settings',    es: 'Abrir ajustes' },
  'tts.rateCycle':         { he: 'שנה מהירות',       en: 'Change speed',     es: 'Cambiar velocidad' },
  'tts.seek':              { he: 'קפוץ לנקודה',      en: 'Seek',             es: 'Buscar' },
  'tts.listenToDescription': { he: 'האזן לתיאור',    en: 'Listen to description', es: 'Escuchar descripción' },

  // ── Bookmarks ───────────────────────────────────────────────────────────────
  'bookmarks.title':       { he: 'סימניות',        en: 'Bookmarks',        es: 'Marcadores' },
  'bookmarks.empty':       { he: 'אין סימניות עדיין', en: 'No bookmarks yet', es: 'Aún no hay marcadores' },
  'bookmarks.emptyHint':   { he: 'לחץ לחיצה כפולה על פסקה (או לחיצה ארוכה במובייל) כדי להוסיף סימנייה', en: 'Double-click a paragraph (or long-press on mobile) to bookmark it', es: 'Doble clic en un párrafo (o pulsación larga en móvil) para marcar' },
  'bookmarks.close':       { he: 'סגור',           en: 'Close',            es: 'Cerrar' },
  'bookmarks.add':         { he: '🔖 הוסף סימנייה', en: '🔖 Add bookmark',  es: '🔖 Añadir marcador' },
  'bookmarks.remove':      { he: 'הסר סימנייה',    en: 'Remove bookmark',  es: 'Quitar marcador' },
  'bookmarks.saved':       { he: 'סימנייה נשמרה',  en: 'Bookmark saved',   es: 'Marcador guardado' },
  'bookmarks.addPrompt':   { he: 'להוסיף סימנייה כאן?', en: 'Add a bookmark here?', es: '¿Añadir marcador aquí?' },
  'bookmarks.removePrompt':{ he: 'להסיר את הסימנייה?', en: 'Remove this bookmark?', es: '¿Quitar este marcador?' },
  'bookmarks.cancel':      { he: 'ביטול',          en: 'Cancel',           es: 'Cancelar' },
  'bookmarks.chapter':     { he: 'פרק {{n}}',      en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },
  'bookmarks.chapterLabel': { he: 'פרק {{n}}',     en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },
  'bookmarks.chapterUnknown': { he: 'פרק לא מזוהה', en: 'Unknown chapter', es: 'Capítulo desconocido' },
  'bookmarks.approximate': { he: 'ניווט למיקום הקרוב ביותר', en: 'Jumped to the closest location', es: 'Saltó al lugar más cercano' },
  'bookmarks.step1':       { he: 'לחץ לחיצה ימנית על פסקה', en: 'Right-click any paragraph', es: 'Clic derecho en cualquier párrafo' },
  'bookmarks.step2':       { he: 'בחר "הוסף סימנייה"', en: 'Choose "Add bookmark"', es: 'Elige "Añadir marcador"' },
  'bookmarks.step3':       { he: 'לחץ על הסימנייה לקפיצה אליה', en: 'Click bookmark to jump there', es: 'Clic en el marcador para saltar' },

  // ── Onboarding Tour ─────────────────────────────────────────────────────────
  'onboarding.next':       { he: 'הבא ←',          en: 'Next →',           es: 'Siguiente →' },
  'onboarding.skip':       { he: 'דלג',            en: 'Skip',             es: 'Omitir' },
  'onboarding.done':       { he: 'סיום! 🎉',       en: 'Done! 🎉',         es: '¡Listo! 🎉' },
  'onboarding.of':         { he: 'מתוך',           en: 'of',               es: 'de' },
  'onboarding.step1.title': { he: 'ברוכים הבאים! 👋', en: 'Welcome! 👋',   es: '¡Bienvenido! 👋' },
  'onboarding.step1.body': { he: 'זוהי פלטפורמת הקריאה של Yuval. נסייר יחד בתכונות העיקריות.', en: "This is Yuval's reading platform. Let's take a quick tour of the key features.", es: 'Esta es la plataforma de lectura Yuval. Hagamos un recorrido rápido por las funciones principales.' },
  'onboarding.step2.title': { he: 'תוכן עניינים 📋', en: 'Table of Contents 📋', es: 'Tabla de Contenidos 📋' },
  'onboarding.step2.body': { he: 'ניווט מהיר בין פרקים. לחץ על כל פרק לניווט מיידי.', en: 'Navigate between chapters instantly. Click any chapter to jump there.', es: 'Navega entre capítulos al instante. Haz clic en cualquier capítulo para ir allí.' },
  'onboarding.step3.title': { he: 'בקרי תצוגה ⚙️', en: 'Display Controls ⚙️', es: 'Controles de Pantalla ⚙️' },
  'onboarding.step3.body': { he: 'שנה גודל טקסט, גופן, רוחב, וערכת צבע. הכל נשמר אוטומטית.', en: 'Change font size, typeface, width, and color theme. All saved automatically.', es: 'Cambia el tamaño de fuente, tipografía, ancho y tema de color. Todo se guarda automáticamente.' },
  'onboarding.step4.title': { he: 'סמן טקסט 💡',  en: 'Highlight Text 💡', es: 'Resaltar Texto 💡' },
  'onboarding.step4.body': { he: 'בחר כל טקסט בדף כדי להדגיש אותו. 4 צבעים לארגון: תובנות, שאלות, פעולות, ציטוטים.', en: 'Select any text on the page to highlight it. 4 colors to organize: insights, questions, actions, quotes.', es: 'Selecciona cualquier texto para resaltarlo. 4 colores para organizar: ideas, preguntas, acciones, citas.' },
  'onboarding.step5.title': { he: 'יעד קריאה יומי 🎯', en: 'Daily Reading Goal 🎯', es: 'Meta de Lectura Diaria 🎯' },
  'onboarding.step5.body': { he: 'הגדר יעד יומי ועקב אחרי הרצף שלך. לחץ על הכפתור להגדרה.', en: 'Set a daily reading goal and track your streak. Click the button to configure.', es: 'Establece una meta diaria y sigue tu racha. Haz clic en el botón para configurar.' },
  'onboard.skip':          { he: 'דלג',            en: 'Skip',             es: 'Omitir' },
  'onboard.next':          { he: 'הבא ←',          en: 'Next →',           es: 'Siguiente →' },
  'onboard.done':          { he: 'סיום! 🎉',       en: 'Done! 🎉',         es: '¡Listo! 🎉' },
  'onboard.welcome.title': { he: 'ברוכים הבאים! 👋', en: 'Welcome! 👋',   es: '¡Bienvenido! 👋' },
  'onboard.welcome.body':  { he: 'זוהי פלטפורמת הקריאה של Yuval. נסייר יחד בתכונות העיקריות.', en: "This is Yuval's reading platform. Let's take a quick tour of the key features.", es: 'Esta es la plataforma de lectura Yuval. Hagamos un recorrido rápido por las funciones principales.' },
  'onboard.toc.title':     { he: 'תוכן עניינים 📋', en: 'Table of Contents 📋', es: 'Tabla de Contenidos 📋' },
  'onboard.toc.body':      { he: 'ניווט מהיר בין פרקים. לחץ על כל פרק לניווט מיידי.', en: 'Navigate between chapters instantly. Click any chapter to jump there.', es: 'Navega entre capítulos al instante. Haz clic en cualquier capítulo para ir allí.' },
  'onboard.display.title': { he: 'בקרי תצוגה ⚙️', en: 'Display Controls ⚙️', es: 'Controles de Pantalla ⚙️' },
  'onboard.display.body':  { he: 'שנה גודל טקסט, גופן, רוחב, וערכת צבע. הכל נשמר אוטומטית.', en: 'Change font size, typeface, width, and color theme. All saved automatically.', es: 'Cambia el tamaño de fuente, tipografía, ancho y tema de color. Todo se guarda automáticamente.' },
  'onboard.highlight.title': { he: 'סמן טקסט 💡', en: 'Highlight Text 💡', es: 'Resaltar Texto 💡' },
  'onboard.highlight.body': { he: 'בחר כל טקסט בדף כדי להדגיש אותו. 4 צבעים לארגון: תובנות, שאלות, פעולות, ציטוטים.', en: 'Select any text on the page to highlight it. 4 colors to organize: insights, questions, actions, quotes.', es: 'Selecciona cualquier texto para resaltarlo. 4 colores para organizar: ideas, preguntas, acciones, citas.' },
  'onboard.goal.title':    { he: 'יעד קריאה יומי 🎯', en: 'Daily Reading Goal 🎯', es: 'Meta de lectura diaria 🎯' },
  'onboard.goal.body':     { he: 'הגדר יעד יומי ועקב אחרי הרצף שלך. לחץ על הכפתור להגדרה.', en: 'Set a daily reading goal and track your streak. Click the button to configure.', es: 'Establece una meta diaria y sigue tu racha. Haz clic en el botón para configurar.' },

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────────
  'kbd.title':             { he: '⌨️ קיצורי מקלדת', en: '⌨️ Keyboard Shortcuts', es: '⌨️ Atajos de Teclado' },
  'kbd.chapterNav':        { he: 'פרק קודם / הבא',  en: 'Prev / next chapter', es: 'Cap. anterior / siguiente' },
  'kbd.focus':             { he: 'מצב מיקוד',       en: 'Focus / immersive mode', es: 'Modo enfoque' },
  'kbd.zen':               { he: 'מצב Zen',         en: 'Zen reading mode', es: 'Modo Zen' },
  'kbd.search':            { he: 'חיפוש',           en: 'Search',           es: 'Búsqueda' },
  'kbd.highlights':        { he: 'פאנל הדגשות',     en: 'Highlights panel', es: 'Panel de resaltados' },
  'kbd.bookmarks':         { he: 'סימניות',         en: 'Bookmarks',        es: 'Marcadores' },
  'kbd.stats':             { he: 'סטטיסטיקות קריאה', en: 'Reading stats',   es: 'Estadísticas de lectura' },
  'kbd.replay':            { he: 'חזרה על הדגשות',  en: 'Highlight replay', es: 'Repetición de resaltados' },
  'kbd.shortcuts':         { he: 'קיצורי מקלדת',   en: 'Keyboard shortcuts', es: 'Atajos de teclado' },
  'kbd.exit':              { he: 'סגור / יציאה ממצב', en: 'Close / exit mode', es: 'Cerrar / salir del modo' },

  // ── Highlights Panel ────────────────────────────────────────────────────────
  'highlights.title':      { he: 'ההדגשות שלי',    en: 'My Highlights',    es: 'Mis resaltados' },
  'highlights.empty':      { he: 'אין הדגשות עדיין', en: 'No highlights yet', es: 'Aún no hay resaltados' },
  'highlights.emptyHint':  { he: 'סמן טקסט בזמן קריאה כדי לשמור תובנות', en: 'Select text while reading to save insights', es: 'Selecciona texto mientras lees para guardar ideas' },
  'highlights.close':      { he: 'סגור',           en: 'Close',            es: 'Cerrar' },
  'highlights.chapter':    { he: 'פרק {{n}}',      en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },
  'highlights.chapterLabel': { he: 'פרק {{n}}',    en: 'Chapter {{n}}',    es: 'Capítulo {{n}}' },
  'highlights.exportMarkdown': { he: 'Markdown',   en: 'Markdown',         es: 'Markdown' },
  'highlights.exportPdf':  { he: 'PDF',            en: 'PDF',              es: 'PDF' },
  'highlights.addNote':    { he: 'הוסף הערה...',   en: 'Add a note...',    es: 'Añadir nota...' },
  'highlights.notePlaceholder': { he: 'כתוב הערה על ההדגשה הזו...', en: 'Write a note about this highlight...', es: 'Escribe una nota sobre este resaltado...' },
  'highlights.color.yellow': { he: 'תובנה',        en: 'Insight',          es: 'Idea' },
  'highlights.color.blue': { he: 'שאלה',           en: 'Question',         es: 'Pregunta' },
  'highlights.color.green': { he: 'פעולה',         en: 'Action',           es: 'Acción' },
  'highlights.color.pink': { he: 'ציטוט',          en: 'Quote',            es: 'Cita' },

  // ── Reading Goals ───────────────────────────────────────────────────────────
  'goal.title':            { he: 'יעד קריאה יומי', en: 'Daily Reading Goal', es: 'Meta de lectura diaria' },
  'goal.streak':           { he: '🔥 {{n}} ימים',  en: '🔥 {{n}} days',    es: '🔥 {{n}} días' },
  'goal.reached':          { he: '✅ השגת את היעד היום!', en: '✅ Goal reached today!', es: '✅ ¡Meta alcanzada hoy!' },
  'goal.minutesLeft':      { he: '{{n}} דקות נותרו', en: '{{n}} min left',  es: '{{n}} min restantes' },
  'goal.save':             { he: 'שמור',            en: 'Save',             es: 'Guardar' },
  'goal.cancel':           { he: 'ביטול',           en: 'Cancel',           es: 'Cancelar' },

  // ── Reading Stats ───────────────────────────────────────────────────────────
  'stats.title':           { he: 'סטטיסטיקות קריאה', en: 'Reading Stats',  es: 'Estadísticas' },
  'stats.of':              { he: 'מתוך',            en: 'of',              es: 'de' },
  'stats.chapters':        { he: 'פרקים שהושלמו',   en: 'Chapters completed', es: 'Capítulos completados' },
  'stats.words':           { he: 'מילים נקראו',     en: 'Words read',      es: 'Palabras leídas' },
  'stats.chaptersRead':    { he: 'פרקים שהושלמו',  en: 'Chapters completed', es: 'Capítulos leídos' },
  'stats.wordsRead':       { he: 'מילים נקראו',     en: 'Words read',       es: 'Palabras leídas' },
  'stats.highlights':      { he: 'הדגשות שמורות',  en: 'Saved highlights', es: 'Resaltados guardados' },
  'stats.streak':          { he: 'רצף קריאה',       en: 'Reading streak',   es: 'Racha de lectura' },
  'stats.streakDays':      { he: '{{n}} ימים',      en: '{{n}} days',       es: '{{n}} días' },
  'stats.close':           { he: 'סגור',            en: 'Close',            es: 'Cerrar' },

  // ── Chapter / Book Completion ───────────────────────────────────────────────
  'completion.chapterComplete': { he: 'פרק {{n}} הושלם ✓', en: 'Chapter {{n}} complete ✓', es: 'Capítulo {{n}} completado ✓' },
  'completion.highlightsTitle': { he: 'ההדגשות שלך בפרק זה', en: 'Your highlights from this chapter', es: 'Tus resaltados de este capítulo' },
  'completion.noHighlights': { he: 'לא סימנת שום דבר בפרק זה', en: "You didn't highlight anything in this chapter", es: 'No resaltaste nada en este capítulo' },
  'completion.next':       { he: 'לפרק הבא',      en: 'Next chapter',     es: 'Siguiente capítulo' },
  'completion.title':      { he: '🎉 סיימת את הספר!', en: '🎉 You finished the book!', es: '🎉 ¡Terminaste el libro!' },
  'completion.subtitle':   { he: 'קוראים כמוך הופכים סופרים למורים.', en: 'Readers like you turn authors into teachers.', es: 'Lectores como tú convierten a los autores en maestros.' },
  'completion.chapters':   { he: 'פרקים',         en: 'chapters',         es: 'capítulos' },
  'completion.words':      { he: 'מילים',         en: 'words',            es: 'palabras' },
  'completion.highlights': { he: 'הדגשות',        en: 'highlights',       es: 'resaltados' },
  'completion.streak':     { he: 'ימי רצף',        en: 'day streak',       es: 'días de racha' },
  'completion.share':      { he: 'שתף הישג',      en: 'Share achievement', es: 'Compartir logro' },
  'completion.library':    { he: 'חזרה לספרייה',   en: 'Back to library',   es: 'Volver a la biblioteca' },

  // ── General / Shared ────────────────────────────────────────────────────────
  'general.close':         { he: 'סגור',            en: 'Close',            es: 'Cerrar' },
  'general.of':            { he: 'מתוך',            en: 'of',               es: 'de' },
  'general.retry':         { he: 'נסה שוב',         en: 'Try again',        es: 'Reintentar' },
  'general.back':          { he: 'חזרה',            en: 'Back',             es: 'Volver' },
  'general.home':          { he: 'חזרה לדף הבית',   en: 'Back to Home',     es: 'Volver al inicio' },

  // ── Error pages ─────────────────────────────────────────────────────────────
  'error.404.title':       { he: 'הדף לא נמצא',     en: 'Page not found',   es: 'Página no encontrada' },
  'error.404.code':        { he: '404',             en: '404',              es: '404' },
  'error.404.body':        { he: 'הדף שחיפשת לא קיים או הועבר למקום אחר. אולי הגעת לקישור ישן?', en: "The page you're looking for doesn't exist or has been moved. Perhaps you followed an old link?", es: 'La página que buscas no existe o ha sido movida. ¿Quizás seguiste un enlace antiguo?' },
  'error.404.suggest':     { he: 'נסה לחזור לספרייה ולבחור ספר', en: 'Try returning to the library and picking a book', es: 'Prueba a volver a la biblioteca y elegir un libro' },

  'error.500.title':       { he: 'משהו השתבש',      en: 'Something went wrong', es: 'Algo salió mal' },
  'error.500.body':        { he: 'נתקלנו בשגיאה בלתי צפויה. נסה לרענן את הדף.', en: 'We hit an unexpected error. Try refreshing the page.', es: 'Encontramos un error inesperado. Intenta recargar la página.' },

  'error.offline.title':   { he: 'אין חיבור לאינטרנט', en: "You're offline",  es: 'Estás sin conexión' },
  'error.offline.body':    { he: 'בדוק את החיבור שלך ונסה שוב.', en: 'Check your connection and try again.', es: 'Revisa tu conexión e inténtalo de nuevo.' },

  'error.bookNotFound.title': { he: 'הספר לא נמצא', en: 'Book not found',   es: 'Libro no encontrado' },
  'error.bookNotFound.body': { he: 'הספר שביקשת לא זמין בשפה זו או שהוסר.', en: 'The book you requested is not available in this language or has been removed.', es: 'El libro que solicitaste no está disponible en este idioma o ha sido eliminado.' },

  'error.chapterNotFound.title': { he: 'הפרק לא נמצא', en: 'Chapter not found', es: 'Capítulo no encontrado' },
  'error.chapterNotFound.body': { he: 'הפרק הזה לא קיים בספר. אולי נמחק או שהקישור שגוי.', en: "This chapter doesn't exist in the book. It may have been removed, or the link is wrong.", es: 'Este capítulo no existe en el libro. Puede haber sido eliminado o el enlace es incorrecto.' },

  // ── Empty states ────────────────────────────────────────────────────────────
  'empty.bookmarks.title': { he: 'עוד אין סימניות', en: 'No bookmarks yet', es: 'Aún no hay marcadores' },
  'empty.bookmarks.body':  { he: 'סימן מקומות חשובים בספר כדי לחזור אליהם בקלות.', en: 'Mark meaningful places in the book so you can return to them easily.', es: 'Marca lugares importantes del libro para volver a ellos fácilmente.' },
  'empty.bookmarks.cta':   { he: 'לחיצה כפולה על פסקה להוספת סימנייה', en: 'Double-click a paragraph to bookmark it', es: 'Doble clic en un párrafo para marcarlo' },

  'empty.highlights.title': { he: 'עדיין אין הדגשות', en: 'No highlights yet', es: 'Aún no hay resaltados' },
  'empty.highlights.body': { he: 'הדגש טקסט בזמן קריאה כדי לשמור תובנות, שאלות, ציטוטים ופעולות.', en: 'Highlight text as you read to save insights, questions, quotes and actions.', es: 'Resalta texto mientras lees para guardar ideas, preguntas, citas y acciones.' },
  'empty.highlights.cta':  { he: 'בחר טקסט בדף ובחר צבע', en: 'Select text on the page and pick a color', es: 'Selecciona texto en la página y elige un color' },

  'empty.search.title':    { he: 'אין תוצאות',       en: 'No results',       es: 'Sin resultados' },
  'empty.search.body':     { he: 'לא מצאנו התאמות ל"{{q}}". נסה מילות חיפוש אחרות.', en: 'We couldn\'t find matches for "{{q}}". Try different keywords.', es: 'No encontramos coincidencias para "{{q}}". Prueba otras palabras.' },
  'empty.search.cta':      { he: 'חפש בספר כולו',    en: 'Search the whole book', es: 'Buscar en todo el libro' },

  'empty.library.title':   { he: 'הספרייה ריקה',     en: 'Library is empty', es: 'La biblioteca está vacía' },
  'empty.library.body':    { he: 'עוד לא נוספו ספרים. הוסף קובצי MD לתיקיית output/ כדי להתחיל.', en: 'No books added yet. Drop MD files into the output/ folder to get started.', es: 'Aún no se han añadido libros. Coloca archivos MD en la carpeta output/ para empezar.' },

  // ── Image Lightbox ──────────────────────────────────────────────────────────
  'lightbox.close':        { he: 'סגור',              en: 'Close',            es: 'Cerrar' },
  'lightbox.prev':         { he: 'תמונה קודמת',       en: 'Previous image',   es: 'Imagen anterior' },
  'lightbox.next':         { he: 'תמונה הבאה',        en: 'Next image',       es: 'Imagen siguiente' },
  'lightbox.zoomHint':     { he: 'לחץ על תמונה להגדלה', en: 'Click any image to enlarge', es: 'Haz clic en una imagen para ampliar' },
};
