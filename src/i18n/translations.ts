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
  'fab.reading':           { he: 'הגדרות קריאה',   en: 'Reading controls', es: 'Controles de lectura' },
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
  'display.fontModern':    { he: 'מודרני',          en: 'Modern',           es: 'Moderno' },
  'display.fontClean':     { he: 'נקי',             en: 'Clean',            es: 'Limpio' },
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
  'sidebar.toc':           { he: 'תוכן העניינים',  en: 'Table of Contents', es: 'Tabla de Contenidos' },
  'sidebar.tableOfContents': { he: 'תוכן העניינים',  en: 'Table of Contents', es: 'Tabla de Contenidos' },
  'sidebar.completed':     { he: 'הושלמו',          en: 'completed',        es: 'completados' },
  'sidebar.outline':       { he: 'מתוכן הפרק',     en: 'Chapter Outline',  es: 'Esquema del Capítulo' },
  'sidebar.noSections':    { he: 'לא נמצאו סעיפים', en: 'No sections found', es: 'No se encontraron secciones' },
  'sidebar.noSectionsFound': { he: 'לא נמצאו סעיפים', en: 'No sections found', es: 'No se encontraron secciones' },
  'sidebar.collapse':      { he: 'הסתר תפריט',       en: 'Collapse navigation', es: 'Ocultar navegación' },
  'sidebar.expand':        { he: 'הצג תפריט',        en: 'Show navigation',     es: 'Mostrar navegación' },

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

  // ── Library (books) section ─────────────────────────────────────────────────
  'library.title':         { he: 'ספריה',           en: 'Library',          es: 'Biblioteca' },
  'library.subtitle':      { he: 'תוכן מקורי — ספרים מלאים', en: 'Original content — full books', es: 'Contenido original — libros completos' },
  'library.category.foundations': { he: 'יסודות',   en: 'Foundations',      es: 'Fundamentos' },
  'library.category.ai-systems':  { he: 'מערכות AI', en: 'AI Systems',      es: 'Sistemas de IA' },
  'library.category.ai-engineering': { he: 'הנדסת מערכות AI', en: 'AI Systems Engineering', es: 'Ingeniería de Sistemas de IA' },

  // Difficulty level — keys mirror BookLevel in src/types/index.ts.
  // Resolved by discoverBook() from book-manifest.json → _catalog.json
  // (book entry) → parent course. UI calls t('library.level.' + book.level).
  'library.level.foundations':   { he: 'יסודות',  en: 'Foundations',  es: 'Fundamentos' },
  'library.level.intermediate':  { he: 'ביניים',  en: 'Intermediate', es: 'Intermedio' },
  'library.level.advanced':      { he: 'מתקדם',   en: 'Advanced',     es: 'Avanzado' },

  // Book Overview — hero card CTAs and meta.
  'book.startLearning':    { he: 'התחל ללמוד',     en: 'Start learning',    es: 'Empezar a aprender' },
  'book.continueLearning': { he: 'המשך לימוד',     en: 'Continue learning', es: 'Continuar aprendiendo' },
  'book.minutesRead':      { he: '{{n}} דקות קריאה', en: '{{n}} min read',  es: '{{n}} min de lectura' },
  'book.availableIn':      { he: 'זמין ב',          en: 'Available in',     es: 'Disponible en' },
  'book.bookmark':         { he: 'סמן ספר',         en: 'Bookmark book',    es: 'Marcar libro' },
  'book.removeBookmark':   { he: 'הסר סימן',        en: 'Remove bookmark',  es: 'Quitar marcador' },

  // Book Overview — progress and summary sections.
  'bookOverview.bookSummary':       { he: 'תקציר',                            en: 'Summary',                                es: 'Resumen' },
  'bookOverview.readMore':          { he: 'קרא עוד',                          en: 'Read more',                              es: 'Leer más' },
  'bookOverview.showLess':          { he: 'הצג פחות',                         en: 'Show less',                              es: 'Mostrar menos' },
  'bookOverview.notStarted':        { he: 'טרם התחלת',                        en: 'Not started yet',                        es: 'Aún no empezado' },
  'bookOverview.chaptersCompleted': { he: '{{n}} מתוך {{total}} פרקים הושלמו', en: '{{n}} of {{total}} chapters completed', es: '{{n}} de {{total}} capítulos completados' },
  'bookOverview.currentChapter':    { he: 'הפרק הנוכחי',                       en: 'Current chapter',                        es: 'Capítulo actual' },
  'bookOverview.showAllChapters':   { he: 'הצג את כל הפרקים',                  en: 'Show all chapters',                       es: 'Mostrar todos los capítulos' },
  'bookOverview.showFewerChapters': { he: 'הצג פחות פרקים',                    en: 'Show fewer chapters',                     es: 'Mostrar menos capítulos' },
  'bookOverview.locked':            { he: 'פרק נעול',                           en: 'Chapter locked',                          es: 'Capítulo bloqueado' },
  'bookOverview.whatYouWillLearn':  { he: 'מה תלמדו',                            en: 'What you will learn',                     es: 'Lo que aprenderás' },
  'bookOverview.listenSummary':     { he: 'האזן לסיכום',                         en: 'Listen to summary',                       es: 'Escuchar resumen' },

  // ── Courses (learning) section ──────────────────────────────────────────────
  'courses.title':         { he: 'למידה מקורסים',    en: 'Learning from Courses', es: 'Aprendizaje de cursos' },
  'courses.subtitle':      { he: 'סיכומי שיעורים בתהליך', en: 'Lecture summaries in progress', es: 'Resúmenes de clases en curso' },
  'courses.inProgress':    { he: 'בתהליך',          en: 'In progress',      es: 'En curso' },
  'courses.available':     { he: '{{n}} מתוך {{total}} זמינים', en: '{{n}} of {{total}} available', es: '{{n}} de {{total}} disponibles' },
  'courses.continueLearning': { he: 'המשך למידה',   en: 'Continue Learning', es: 'Continuar aprendizaje' },
  'courses.startLearning': { he: 'התחל למידה',      en: 'Start Learning',   es: 'Comenzar aprendizaje' },
  'courses.lessonBadge':   { he: 'סיכום שיעור',     en: 'Lecture Summary',  es: 'Resumen de clase' },
  'courses.lessonNumber':  { he: 'שיעור {{n}}',     en: 'Lesson {{n}}',     es: 'Clase {{n}}' },
  'courses.lessons':       { he: 'שיעורים',         en: 'Lessons',          es: 'Clases' },
  'courses.lecturer':      { he: 'מרצה',            en: 'Lecturer',         es: 'Profesor' },
  'courses.summaryBy':     { he: 'סיכומים',          en: 'Summaries by',     es: 'Resúmenes por' },
  'courses.notAvailableYet': { he: 'טרם זמין',      en: 'Not available yet', es: 'Aún no disponible' },
  'courses.viewAllLessons': { he: 'לכל השיעורים',    en: 'View all lessons',  es: 'Ver todas las clases' },

  // ── Unified "all content" section — books + lessons grouped by category ────
  'all.title':             { he: 'כל הספרים',        en: 'All Content',       es: 'Todo el contenido' },
  'all.subtitle':          { he: 'ספרים וסיכומי שיעורים, ממוינים לפי קטגוריה', en: 'Books and lecture summaries, grouped by category', es: 'Libros y resúmenes, agrupados por categoría' },

  // ── Search ──────────────────────────────────────────────────────────────────
  'search.placeholderChapter': { he: 'חפש בפרק...', en: 'Search chapter...', es: 'Buscar en el capítulo...' },
  'search.placeholderBook': { he: 'חפש בספר...', en: 'Search book...', es: 'Buscar en el libro...' },
  'search.modeChapter':    { he: 'חיפוש בפרק',      en: 'Search chapter',    es: 'Buscar en capítulo' },
  'search.modeBook':       { he: 'חיפוש בספר',      en: 'Search book',       es: 'Buscar en libro' },
  'search.noResults':      { he: 'אין תוצאות',       en: 'No results',        es: 'Sin resultados' },
  'search.results':        { he: '{{n}} / {{total}}',    en: '{{n}} / {{total}}',  es: '{{n}} / {{total}}' },
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

  // ── Bookmark "add" dialog (premium variant) ─────────────────────────────────
  'reading.bookmarkDialog.title':       { he: 'הוסף סימניה?',                                              en: 'Add bookmark?',                                                  es: '¿Añadir marcador?' },
  'reading.bookmarkDialog.description': { he: 'שמור את המיקום הנוכחי כדי לחזור אליו במהירות בהמשך', en: 'Save your current position so you can return to it quickly later.', es: 'Guarda tu posición actual para volver rápidamente más tarde.' },
  'reading.bookmarkDialog.confirm':     { he: 'הוסף סימניה',                                               en: 'Add bookmark',                                                   es: 'Añadir marcador' },
  'reading.bookmarkDialog.cancel':      { he: 'ביטול',                                                     en: 'Cancel',                                                         es: 'Cancelar' },

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

  // ── Highlight (singular — in-content highlight UI: toolbar, hover popup,
  //    inline note editor, quote-card share, mobile color picker, replay) ──
  'highlight.title':            { he: 'הדגשה',                  en: 'Highlight',                    es: 'Resaltado' },
  'highlight.empty':            { he: 'אין הדגשות עדיין',        en: 'No highlights yet',            es: 'Aún no hay resaltados' },
  'highlight.count':            { he: '{{n}} הדגשות',           en: '{{n}} highlights',             es: '{{n}} resaltados' },
  'highlight.toolbar':          { he: 'סרגל הדגשה',              en: 'Highlight toolbar',            es: 'Barra de resaltado' },
  'highlight.chapter':          { he: 'פרק {{n}}',              en: 'Chapter {{n}}',                es: 'Capítulo {{n}}' },
  'highlight.note.add':         { he: 'הוסף הערה',               en: 'Add note',                     es: 'Añadir nota' },
  'highlight.note.placeholder': { he: 'כתוב הערה...',            en: 'Write a note...',              es: 'Escribe una nota...' },
  'highlight.note.hint':        { he: 'Enter לשמירה, Esc לביטול', en: 'Enter to save, Esc to cancel', es: 'Enter para guardar, Esc para cancelar' },
  'highlight.quoteCard':        { he: 'כרטיס ציטוט',             en: 'Quote card',                   es: 'Tarjeta de cita' },
  'highlight.remove':           { he: 'הסר הדגשה',               en: 'Remove highlight',             es: 'Quitar resaltado' },
  'highlight.download':         { he: 'הורדה',                  en: 'Download',                     es: 'Descargar' },
  'highlight.shareImage':       { he: 'שתף כתמונה',              en: 'Share as image',               es: 'Compartir como imagen' },
  'highlight.yellow':           { he: 'תובנה',                  en: 'Insight',                      es: 'Idea' },
  'highlight.blue':             { he: 'שאלה',                   en: 'Question',                     es: 'Pregunta' },
  'highlight.green':            { he: 'פעולה',                  en: 'Action',                       es: 'Acción' },
  'highlight.pink':             { he: 'ציטוט',                  en: 'Quote',                        es: 'Cita' },
  'highlight.mobile.title':     { he: 'בחר צבע',                 en: 'Pick a color',                 es: 'Elige un color' },

  // ── Common (shared atoms used by multiple features) ─────────────────────────
  'common.close':               { he: 'סגור',                   en: 'Close',                        es: 'Cerrar' },
  'common.copy':                { he: 'העתק',                   en: 'Copy',                         es: 'Copiar' },
  'common.copied':              { he: 'הועתק',                  en: 'Copied',                       es: 'Copiado' },
  'common.cancel':              { he: 'ביטול',                  en: 'Cancel',                       es: 'Cancelar' },
  'common.generating':          { he: 'מייצר...',                en: 'Generating...',                es: 'Generando...' },

  // ── Keyboard navigation (toast feedback + shortcuts panel) ─────────────────
  'keyboard.chapterNav':        { he: 'פרק {{n}}',                en: 'Chapter {{n}}',                es: 'Capítulo {{n}}' },
  'keyboard.focusOn':           { he: 'מצב מיקוד פעיל',           en: 'Focus mode on',                es: 'Modo enfoque activado' },
  'keyboard.focusOff':          { he: 'מצב מיקוד כבוי',           en: 'Focus mode off',               es: 'Modo enfoque desactivado' },
  'keyboard.zenOn':             { he: 'מצב Zen פעיל',            en: 'Zen mode on',                  es: 'Modo Zen activado' },
  'keyboard.zenOff':            { he: 'מצב Zen כבוי',            en: 'Zen mode off',                 es: 'Modo Zen desactivado' },
  'keyboard.highlights':        { he: 'פאנל הדגשות',              en: 'Highlights panel',             es: 'Panel de resaltados' },
  'keyboard.stats':             { he: 'סטטיסטיקות קריאה',         en: 'Reading stats',                es: 'Estadísticas de lectura' },
  'keyboard.bookmarks':         { he: 'סימניות',                  en: 'Bookmarks',                    es: 'Marcadores' },
  'keyboard.normalMode':        { he: 'חזרה למצב רגיל',           en: 'Back to normal mode',          es: 'Volver al modo normal' },
  'keyboard.shortcutsTitle':    { he: '⌨️ קיצורי מקלדת',          en: '⌨️ Keyboard shortcuts',        es: '⌨️ Atajos de teclado' },
  'keyboard.shortcut.nav':      { he: 'פרק קודם / הבא',           en: 'Prev / next chapter',          es: 'Cap. anterior / siguiente' },
  'keyboard.shortcut.focus':    { he: 'מצב מיקוד',                en: 'Focus mode',                   es: 'Modo enfoque' },
  'keyboard.shortcut.zen':      { he: 'מצב Zen',                  en: 'Zen mode',                     es: 'Modo Zen' },
  'keyboard.shortcut.search':   { he: 'חיפוש',                    en: 'Search',                       es: 'Búsqueda' },
  'keyboard.shortcut.highlights': { he: 'פאנל הדגשות',            en: 'Highlights panel',             es: 'Panel de resaltados' },
  'keyboard.shortcut.bookmarks':{ he: 'סימניות',                  en: 'Bookmarks',                    es: 'Marcadores' },
  'keyboard.shortcut.stats':    { he: 'סטטיסטיקות קריאה',         en: 'Reading stats',                es: 'Estadísticas de lectura' },
  'keyboard.shortcut.replay':   { he: 'חזרה על הדגשות',           en: 'Highlight replay',             es: 'Repetición de resaltados' },
  'keyboard.shortcut.help':     { he: 'עזרה',                     en: 'Help',                         es: 'Ayuda' },
  'keyboard.shortcut.escape':   { he: 'סגור / יציאה',             en: 'Close / exit',                 es: 'Cerrar / salir' },

  // ── Reading hints (onboarding strip + keyboard hint bar) ───────────────────
  'hints.onboardTitle':         { he: 'בחר טקסט כדי להדגיש',      en: 'Select text to highlight',     es: 'Selecciona texto para resaltar' },
  'hints.onboardSub':           { he: '4 צבעים לארגון תובנות',     en: '4 colors to organize ideas',   es: '4 colores para organizar ideas' },
  'hints.chapters':             { he: 'פרקים',                    en: 'chapters',                     es: 'capítulos' },
  'hints.focus':                { he: 'מיקוד',                    en: 'focus',                        es: 'enfoque' },
  'hints.highlight':            { he: 'בחר טקסט להדגשה',          en: 'select text to highlight',     es: 'selecciona texto para resaltar' },

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

  // ── Left Sidebar (reading-tools activity bar) ──────────────────────────────
  'leftSidebar.dailyGoal':  { he: 'יעד יומי',           en: 'Daily goal',           es: 'Meta diaria' },
  'leftSidebar.tts':        { he: 'הקראה',              en: 'Listen',               es: 'Escuchar' },
  'leftSidebar.statistics': { he: 'סטטיסטיקות קריאה',   en: 'Reading statistics',   es: 'Estadísticas de lectura' },
  'leftSidebar.bookmarks':  { he: 'סימניות',            en: 'Bookmarks',            es: 'Marcadores' },
  'leftSidebar.highlights': { he: 'ההדגשות שלי',        en: 'My highlights',        es: 'Mis resaltados' },
  'leftSidebar.collapse':   { he: 'הסתר סרגל כלים',     en: 'Collapse tools',       es: 'Ocultar herramientas' },
  'leftSidebar.expand':     { he: 'הצג סרגל כלים',      en: 'Show tools',           es: 'Mostrar herramientas' },

  // ── Reading Left Dock (premium vertical floating dock) ────────────────────
  'reading.leftDock.progress':   { he: 'התקדמות',   en: 'Progress',   es: 'Progreso' },
  'reading.leftDock.collapse':   { he: 'כווץ',      en: 'Collapse',   es: 'Contraer' },
  'reading.restorePanels':       { he: 'החזר תפריטים', en: 'Restore panels', es: 'Restaurar paneles' },

  // ── Reading Tools (six-action toolbar in the left dock) ───────────────────
  'readingTools.dailyGoal':     { he: 'יעד יומי',           en: 'Daily goal',         es: 'Objetivo diario' },
  'readingTools.audioReading':  { he: 'הקראה בקול רם',     en: 'Read aloud',         es: 'Lectura en voz alta' },
  'readingTools.readingStats':  { he: 'סטטיסטיקות קריאה',  en: 'Reading statistics', es: 'Estadísticas de lectura' },
  'readingTools.bookmarks':     { he: 'סימניות',            en: 'Bookmarks',          es: 'Marcadores' },
  'readingTools.highlights':    { he: 'ההדגשות שלי',        en: 'My highlights',      es: 'Mis resaltados' },
  'readingTools.search':        { he: 'חיפוש בפרק',         en: 'Search in chapter',  es: 'Buscar en el capítulo' },
  'readingTools.progress':      { he: 'התקדמות קריאה',      en: 'Reading progress',   es: 'Progreso de lectura' },

  // ── Image Lightbox ──────────────────────────────────────────────────────────
  'lightbox.close':        { he: 'סגור',              en: 'Close',            es: 'Cerrar' },
  'lightbox.prev':         { he: 'תמונה קודמת',       en: 'Previous image',   es: 'Imagen anterior' },
  'lightbox.next':         { he: 'תמונה הבאה',        en: 'Next image',       es: 'Imagen siguiente' },
  'lightbox.zoomHint':     { he: 'לחץ על תמונה להגדלה', en: 'Click any image to enlarge', es: 'Haz clic en una imagen para ampliar' },

  // ── Resume-from-here banner ────────────────────────────────────────────────
  'resume.welcomeBack':         { he: 'ברוך שובך!',  en: 'Welcome back!',   es: '¡Bienvenido de vuelta!' },
  'resume.dismiss':             { he: 'סגור',         en: 'Dismiss',         es: 'Cerrar' },
  'resume.bannerBody':          { he: "עצרת {{timeAgo}} בסעיף '{{section}}', {{position}}", en: "You stopped {{timeAgo}} in '{{section}}', {{position}}", es: "Te detuviste {{timeAgo}} en '{{section}}', {{position}}" },
  'resume.bannerBodyNoSection': { he: 'עצרת {{timeAgo}}, {{position}}',                     en: 'You stopped {{timeAgo}}, {{position}}',                     es: 'Te detuviste {{timeAgo}}, {{position}}' },
  'resume.position.start':      { he: 'בהתחלה',       en: 'near the start',  es: 'cerca del inicio' },
  'resume.position.middle':     { he: 'בערך באמצע',   en: 'about midway',    es: 'aproximadamente a la mitad' },
  'resume.position.end':        { he: 'כמעט בסוף',    en: 'near the end',    es: 'cerca del final' },

  // ── Time-ago humanization ──────────────────────────────────────────────────
  // Hebrew uses dual forms (שעתיים / יומיים / שבועיים) for n=2 — separate
  // *Dual keys carry the dual form. en/es mirror their plural form for those
  // keys so the lookup in sidebar-time-ago.ts stays uniform across languages.
  'timeAgo.justNow':       { he: 'לפני רגע',         en: 'just now',           es: 'hace un momento' },
  'timeAgo.minutes':       { he: 'לפני {{n}} דקות',  en: '{{n}} minutes ago',  es: 'hace {{n}} minutos' },
  'timeAgo.hour':          { he: 'לפני שעה',         en: 'an hour ago',        es: 'hace una hora' },
  'timeAgo.hoursDual':     { he: 'לפני שעתיים',      en: '2 hours ago',        es: 'hace 2 horas' },
  'timeAgo.hours':         { he: 'לפני {{n}} שעות',  en: '{{n}} hours ago',    es: 'hace {{n}} horas' },
  'timeAgo.yesterday':     { he: 'אתמול',            en: 'yesterday',          es: 'ayer' },
  'timeAgo.daysDual':      { he: 'לפני יומיים',      en: '2 days ago',         es: 'hace 2 días' },
  'timeAgo.days':          { he: 'לפני {{n}} ימים',  en: '{{n}} days ago',     es: 'hace {{n}} días' },
  'timeAgo.week':          { he: 'לפני שבוע',        en: 'a week ago',         es: 'hace una semana' },
  'timeAgo.weeksDual':     { he: 'לפני שבועיים',     en: '2 weeks ago',        es: 'hace 2 semanas' },
  'timeAgo.weeks':         { he: 'לפני {{n}} שבועות', en: '{{n}} weeks ago',   es: 'hace {{n}} semanas' },
  'timeAgo.moreThanMonth': { he: 'לפני יותר מחודש',  en: 'more than a month ago', es: 'hace más de un mes' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Living Library (future /library screen) ────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // Namespace map (Open/Closed: add new sub-namespaces here without touching
  // existing `library.title`, `library.subtitle`, `library.category.*`,
  // `library.level.*` keys above):
  //   library.galaxy.*           main screen chrome
  //   library.itemType.*         display label per LibraryItemType
  //   library.status.*           display label per LibraryItemStatus
  //   library.sourceKind.*       display label per LibrarySourceKind
  //   library.filter.*           filter chips and toggles
  //   library.sort.*             sort options
  //   library.continueReading.*  resume card
  //   library.stats.*            stats panel
  //   library.recommendation.*   recommendation strip
  //   library.action.*           AI assistant toolbar actions
  //   library.search.*           search affordances
  //   library.empty.*            empty states
  //   library.processing.*       processing / failed / archived helper text
  //   library.a11y.*             aria labels
  //   library.mobile.*           mobile-only UI
  //
  // SOLID: keys mirror machine values from src/types/library.ts so any
  // LibraryItem can be displayed via `t('library.itemType.' + item.type, lang)`
  // (Liskov: every type renders through the same key pattern).
  // ───────────────────────────────────────────────────────────────────────────

  // ── library.galaxy.* — main screen chrome ──────────────────────────────────
  'library.galaxy.title':           { he: 'הספרייה החיה שלך',                                                 en: 'Your Living Library',                                                          es: 'Tu biblioteca viva' },
  'library.galaxy.subtitle':        { he: 'כל ספר, קורס, סדרה, סיכום או מאמר שאתה מעלה הופך לחלק ממערכת ידע חכמה', en: 'Every book, course, series, summary or article you add becomes part of one smart knowledge system', es: 'Cada libro, curso, serie, resumen o artículo que añades se vuelve parte de un sistema de conocimiento inteligente' },
  'library.galaxy.welcome':         { he: 'ברוך הבא למרחב הידע שלך',                                          en: 'Welcome to your knowledge space',                                              es: 'Bienvenido a tu espacio de conocimiento' },
  'library.galaxy.searchPlaceholder': { he: 'חפש ספרים, קורסים, סדרות, מאמרים ונושאים',                       en: 'Search books, courses, series, articles and topics',                            es: 'Busca libros, cursos, series, artículos y temas' },
  'library.galaxy.primaryCta':      { he: 'הוסף ספר, מאמר או קורס',                                           en: 'Add a book, article or course',                                                 es: 'Añadir un libro, artículo o curso' },
  'library.galaxy.secondaryCta':    { he: 'גלה איך זה עובד',                                                 en: 'See how it works',                                                              es: 'Descubre cómo funciona' },
  'library.galaxy.loading':         { he: 'טוען את הספרייה שלך',                                              en: 'Loading your library',                                                          es: 'Cargando tu biblioteca' },
  'library.galaxy.error':           { he: 'לא הצלחנו לטעון את הספרייה. נסה שוב בעוד רגע',                     en: "We couldn't load your library. Try again in a moment",                          es: 'No pudimos cargar tu biblioteca. Inténtalo de nuevo en un momento' },

  // ── library.itemType.* — display label per LibraryItemType ─────────────────
  'library.itemType.book':            { he: 'ספר',              en: 'Book',             es: 'Libro' },
  'library.itemType.course':          { he: 'קורס',             en: 'Course',           es: 'Curso' },
  'library.itemType.course_lesson':   { he: 'שיעור בקורס',      en: 'Course lesson',    es: 'Clase del curso' },
  'library.itemType.article':         { he: 'מאמר',             en: 'Article',          es: 'Artículo' },
  'library.itemType.series':          { he: 'סדרה',             en: 'Series',           es: 'Serie' },
  'library.itemType.lesson_summary':  { he: 'סיכום שיעור',      en: 'Lesson summary',   es: 'Resumen de clase' },
  'library.itemType.slides':          { he: 'מצגת',             en: 'Slides',           es: 'Diapositivas' },
  'library.itemType.lab':             { he: 'מעבדה',            en: 'Lab',              es: 'Laboratorio' },
  'library.itemType.transcript':      { he: 'תמלול',            en: 'Transcript',       es: 'Transcripción' },
  'library.itemType.document':        { he: 'מסמך',             en: 'Document',         es: 'Documento' },

  // ── library.status.* — display label per LibraryItemStatus ─────────────────
  'library.status.new':           { he: 'חדש',         en: 'New',         es: 'Nuevo' },
  'library.status.processing':    { he: 'בעיבוד',      en: 'Processing',  es: 'Procesando' },
  'library.status.ready':         { he: 'מוכן',        en: 'Ready',       es: 'Listo' },
  'library.status.failed':        { he: 'נכשל',        en: 'Failed',      es: 'Falló' },
  'library.status.archived':      { he: 'בארכיון',     en: 'Archived',    es: 'Archivado' },

  // ── library.processing.* — short helper text per non-ready status ──────────
  'library.processing.processingText': { he: 'הפריט הזה עדיין בעיבוד. נציג אותו ברגע שיהיה מוכן',          en: 'This item is still being processed. We will show it as soon as it is ready', es: 'Este elemento aún se está procesando. Lo mostraremos en cuanto esté listo' },
  'library.processing.failedText':     { he: 'העיבוד נכשל. אפשר לנסות שוב או למחוק את הפריט',              en: 'Processing failed. You can retry or remove this item',                       es: 'El procesamiento falló. Puedes reintentarlo o eliminar este elemento' },
  'library.processing.archivedText':   { he: 'הפריט בארכיון. הוא לא מופיע בתוצאות חיפוש רגילות',           en: 'This item is archived. It will not appear in regular search results',        es: 'Este elemento está archivado. No aparecerá en los resultados de búsqueda normales' },
  'library.processing.retry':          { he: 'נסה שוב',                                                    en: 'Retry',                                                                       es: 'Reintentar' },

  // ── library.sourceKind.* — display label per LibrarySourceKind ─────────────
  'library.sourceKind.pipeline':   { he: 'מהפייפליין',     en: 'From pipeline',   es: 'Del pipeline' },
  'library.sourceKind.manual':     { he: 'ידני',           en: 'Manual',          es: 'Manual' },
  'library.sourceKind.generated':  { he: 'נוצר ע"י AI',     en: 'AI generated',    es: 'Generado por IA' },
  'library.sourceKind.external':   { he: 'חיצוני',          en: 'External',        es: 'Externo' },

  // ── library.filter.* — filter chips and toggles ────────────────────────────
  'library.filter.all':              { he: 'הכל',                  en: 'All items',          es: 'Todos los elementos' },
  'library.filter.books':            { he: 'ספרים',                en: 'Books',              es: 'Libros' },
  'library.filter.courses':          { he: 'קורסים',               en: 'Courses',            es: 'Cursos' },
  'library.filter.series':           { he: 'סדרות',                en: 'Series',             es: 'Series' },
  'library.filter.articles':         { he: 'מאמרים',               en: 'Articles',           es: 'Artículos' },
  'library.filter.lessonSummaries':  { he: 'סיכומי שיעורים',       en: 'Lesson summaries',   es: 'Resúmenes de clases' },
  'library.filter.ready':            { he: 'מוכנים',               en: 'Ready',              es: 'Listos' },
  'library.filter.new':              { he: 'חדשים',                en: 'New',                es: 'Nuevos' },
  'library.filter.processing':       { he: 'בעיבוד',               en: 'Processing',         es: 'En proceso' },
  'library.filter.archived':         { he: 'בארכיון',              en: 'Archived',           es: 'Archivados' },
  'library.filter.failed':           { he: 'נכשלו',                en: 'Failed',             es: 'Fallidos' },
  'library.filter.includeArchived':  { he: 'כלול פריטים בארכיון',  en: 'Include archived',   es: 'Incluir archivados' },
  'library.filter.includeFailed':    { he: 'כלול פריטים שנכשלו',   en: 'Include failed',     es: 'Incluir fallidos' },
  'library.filter.clear':            { he: 'נקה סינון',            en: 'Clear filters',      es: 'Limpiar filtros' },

  // ── library.sort.* — sort options (mirror LibrarySortKey) ──────────────────
  'library.sort.recent':       { he: 'עודכן לאחרונה',     en: 'Recently updated',   es: 'Actualizado recientemente' },
  'library.sort.created':      { he: 'נוצר לאחרונה',      en: 'Recently created',   es: 'Creado recientemente' },
  'library.sort.title':        { he: 'לפי כותרת',          en: 'Title',              es: 'Título' },
  'library.sort.readingTime':  { he: 'לפי זמן קריאה',      en: 'Reading time',       es: 'Tiempo de lectura' },
  'library.sort.type':         { he: 'לפי סוג',            en: 'Type',               es: 'Tipo' },
  'library.sort.status':       { he: 'לפי סטטוס',          en: 'Status',             es: 'Estado' },

  // ── library.continueReading.* — resume card ────────────────────────────────
  'library.continueReading.title':         { he: 'המשך מהמקום שעצרת',         en: 'Continue where you left off',  es: 'Continúa donde lo dejaste' },
  'library.continueReading.cta':           { he: 'המשך קריאה',                 en: 'Continue reading',             es: 'Continuar leyendo' },
  'library.continueReading.lastOpened':    { he: 'נפתח לאחרונה {{when}}',       en: 'Last opened {{when}}',         es: 'Abierto por última vez {{when}}' },
  'library.continueReading.noActive':      { he: 'אין פריט פעיל כרגע',          en: 'Nothing in progress right now', es: 'Nada en progreso ahora mismo' },
  'library.continueReading.startLearning': { he: 'התחל ללמוד',                  en: 'Start learning',               es: 'Empezar a aprender' },

  // ── library.stats.* — stats panel (interpolated counts) ────────────────────
  'library.stats.title':            { he: 'סטטיסטיקות הספרייה',     en: 'Library stats',                  es: 'Estadísticas de la biblioteca' },
  'library.stats.totalItems':       { he: '{{n}} פריטים בסך הכל',    en: '{{n}} items in total',           es: '{{n}} elementos en total' },
  'library.stats.booksCount':       { he: '{{n}} ספרים',             en: '{{n}} books',                    es: '{{n}} libros' },
  'library.stats.coursesCount':     { he: '{{n}} קורסים',            en: '{{n}} courses',                  es: '{{n}} cursos' },
  'library.stats.seriesCount':      { he: '{{n}} סדרות',             en: '{{n}} series',                   es: '{{n}} series' },
  'library.stats.articlesCount':    { he: '{{n}} מאמרים',            en: '{{n}} articles',                 es: '{{n}} artículos' },
  'library.stats.readingMinutes':   { he: '{{n}} דקות קריאה',        en: '{{n}} reading minutes',          es: '{{n}} minutos de lectura' },
  'library.stats.words':            { he: '{{n}} מילים',              en: '{{n}} words',                    es: '{{n}} palabras' },
  'library.stats.updatedRecently':  { he: 'עודכן לאחרונה {{when}}',   en: 'Updated {{when}}',               es: 'Actualizado {{when}}' },

  // ── library.recommendation.* — recommendation strip ────────────────────────
  'library.recommendation.forYou':            { he: 'מומלץ עבורך',                       en: 'Recommended for you',                 es: 'Recomendado para ti' },
  'library.recommendation.basedOnYourLibrary':{ he: 'על בסיס הספרייה שלך',               en: 'Based on your library',                es: 'Basado en tu biblioteca' },
  'library.recommendation.becauseRelatedTo':  { he: 'כי זה קשור ל"{{title}}"',           en: 'Because it is related to "{{title}}"',  es: 'Porque está relacionado con "{{title}}"' },
  'library.recommendation.more':              { he: 'עוד המלצות',                         en: 'More recommendations',                  es: 'Más recomendaciones' },
  'library.recommendation.none':              { he: 'אין עדיין המלצות. הוסף עוד תכנים והמלצות יופיעו כאן', en: 'No recommendations yet. Add more content and they will appear here', es: 'Aún no hay recomendaciones. Añade más contenido y aparecerán aquí' },

  // ── library.action.* — AI assistant toolbar ────────────────────────────────
  'library.action.aiAssistant':       { he: 'עוזר AI',                       en: 'AI assistant',                  es: 'Asistente IA' },
  'library.action.bookmarks':         { he: 'סימניות',                        en: 'Bookmarks',                     es: 'Marcadores' },
  'library.action.history':           { he: 'היסטוריה',                       en: 'History',                       es: 'Historial' },
  'library.action.openAssistant':     { he: 'פתח עוזר AI',                    en: 'Open AI assistant',             es: 'Abrir asistente IA' },
  'library.action.closeAssistant':    { he: 'סגור עוזר AI',                   en: 'Close AI assistant',            es: 'Cerrar asistente IA' },
  'library.action.askAboutItem':      { he: 'שאל על הפריט הזה',              en: 'Ask about this item',           es: 'Preguntar sobre este elemento' },
  'library.action.summarizeArticle':  { he: 'סכם את המאמר הזה',              en: 'Summarize this article',        es: 'Resumir este artículo' },
  'library.action.findRelated':       { he: 'מצא פריטים קשורים',             en: 'Find related items',            es: 'Encontrar elementos relacionados' },
  'library.action.whatNext':          { he: 'מה כדאי לי לקרוא עכשיו',         en: 'What should I read next',       es: 'Qué debería leer a continuación' },

  // ── library.search.* — search affordances ──────────────────────────────────
  'library.search.placeholder':   { he: 'חפש בספרייה',                en: 'Search the library',         es: 'Buscar en la biblioteca' },
  'library.search.results':       { he: 'תוצאות חיפוש',               en: 'Search results',             es: 'Resultados de búsqueda' },
  'library.search.resultsFor':    { he: 'תוצאות עבור "{{q}}"',         en: 'Results for "{{q}}"',        es: 'Resultados para "{{q}}"' },
  'library.search.noResults':     { he: 'לא נמצאו תוצאות',             en: 'No results',                  es: 'Sin resultados' },
  'library.search.tryAnother':    { he: 'נסה חיפוש אחר',               en: 'Try another search',          es: 'Prueba otra búsqueda' },
  'library.search.clear':         { he: 'נקה חיפוש',                   en: 'Clear search',                es: 'Limpiar búsqueda' },

  // ── library.empty.* — empty states per content kind ────────────────────────
  'library.empty.items':       { he: 'אין עדיין פריטים בספרייה. הוסף ספר, מאמר או קורס כדי להתחיל', en: 'No items yet. Add a book, article or course to get started',                  es: 'Aún no hay elementos. Añade un libro, artículo o curso para empezar' },
  'library.empty.articles':    { he: 'עדיין אין מאמרים',                                              en: 'No articles yet',                                                              es: 'Aún no hay artículos' },
  'library.empty.series':      { he: 'עדיין אין סדרות',                                               en: 'No series yet',                                                                es: 'Aún no hay series' },
  'library.empty.processing':  { he: 'אין כרגע פריטים בעיבוד',                                       en: 'No items currently processing',                                                es: 'No hay elementos en proceso ahora' },
  'library.empty.failed':      { he: 'אין פריטים שנכשלו',                                            en: 'No failed items',                                                              es: 'No hay elementos fallidos' },

  // ── library.a11y.* — aria labels (no visible text) ─────────────────────────
  'library.a11y.mainRegion':            { he: 'אזור הספרייה הראשי',          en: 'Library main region',           es: 'Región principal de la biblioteca' },
  'library.a11y.searchInput':           { he: 'שדה חיפוש בספרייה',           en: 'Library search input',          es: 'Campo de búsqueda de la biblioteca' },
  'library.a11y.openFilters':           { he: 'פתח מסננים',                   en: 'Open filters',                  es: 'Abrir filtros' },
  'library.a11y.closeFilters':          { he: 'סגור מסננים',                  en: 'Close filters',                 es: 'Cerrar filtros' },
  'library.a11y.openAssistant':         { he: 'פתח את עוזר ה-AI',             en: 'Open AI assistant',             es: 'Abrir asistente IA' },
  'library.a11y.closeAssistant':        { he: 'סגור את עוזר ה-AI',            en: 'Close AI assistant',            es: 'Cerrar asistente IA' },
  'library.a11y.carouselNext':          { he: 'הבא בקרוסלה',                  en: 'Next in carousel',              es: 'Siguiente en el carrusel' },
  'library.a11y.carouselPrev':          { he: 'הקודם בקרוסלה',                en: 'Previous in carousel',          es: 'Anterior en el carrusel' },
  'library.a11y.selectItem':            { he: 'בחר פריט',                     en: 'Select item',                   es: 'Seleccionar elemento' },
  'library.a11y.openItem':              { he: 'פתח פריט',                     en: 'Open item',                     es: 'Abrir elemento' },
  'library.a11y.bookmarkItem':          { he: 'סמן פריט בסימנייה',            en: 'Bookmark item',                 es: 'Marcar elemento' },
  'library.a11y.recommendationCarousel':{ he: 'קרוסלת המלצות',                en: 'Recommendation carousel',       es: 'Carrusel de recomendaciones' },
  'library.a11y.continueReadingCard':   { he: 'כרטיס המשך קריאה',             en: 'Continue reading card',         es: 'Tarjeta de continuar leyendo' },
  'library.a11y.libraryStatsPanel':     { he: 'פאנל סטטיסטיקות הספרייה',      en: 'Library stats panel',           es: 'Panel de estadísticas de la biblioteca' },

  // ── library.mobile.* — mobile-only UI ──────────────────────────────────────
  'library.mobile.openMenu':          { he: 'פתח תפריט ספרייה',         en: 'Open library menu',         es: 'Abrir menú de biblioteca' },
  'library.mobile.closeMenu':         { he: 'סגור תפריט ספרייה',        en: 'Close library menu',        es: 'Cerrar menú de biblioteca' },
  'library.mobile.openQuickActions':  { he: 'פתח פעולות מהירות',        en: 'Open quick actions',        es: 'Abrir acciones rápidas' },
  'library.mobile.closeQuickActions': { he: 'סגור פעולות מהירות',       en: 'Close quick actions',       es: 'Cerrar acciones rápidas' },
  'library.mobile.swipeToBrowse':     { he: 'החלק כדי לעיין',             en: 'Swipe to browse',           es: 'Desliza para explorar' },
  'library.mobile.showFilters':       { he: 'הצג מסננים',                  en: 'Show filters',              es: 'Mostrar filtros' },
  'library.mobile.hideFilters':       { he: 'הסתר מסננים',                 en: 'Hide filters',              es: 'Ocultar filtros' },
};