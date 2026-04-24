# CLAUDE.local.md

## סביבה מקומית

- Python: `C:\Python312`
- Node: `C:\Program Files\nodejs`
- PowerShell כברירת מחדל (לא bash/cmd)
- קובץ עיבוד נוכחי: `D:\Books\AI_Developer_Fitness.docx`
- ספרי בדיקה:
  - `D:\Books\Practical Python for AI Engineering.docx` (18 פרקים, portrait cover)
  - `D:\Books\Lesson 1- Introduction to AI Engineering and Generative AI.docx`
    (29 פרקים, landscape cover, עם SDT cover page)

## פרויקט נוכחי

`D:\2025 Stu\AI Engineer\AllBooks2026\Claude Code - Book\bookforge\`

## העדפות אישיות

- **שפת דיון**: עברית
- **שפת UI באתר**: אנגלית גם בספר עברי
- **הצג התקדמות**: בעברית
- **לפני כל פעולה destructive**: שאל אותי
- **אחרי `Ctrl+C` של dev server**: אני רץ `npm run dev` מחדש בעצמי
- **ביקורת כנה**: אני מעדיף ביקורת ישירה ופרקטית ("תכלס") על
  פידבק מעודד. אל תתבזבז על אימות — אם משהו לא טוב, תגיד
- **אין em dashes** (`—` / `–`) בתוכן עברי

## סגנון עבודה עם Claude

### מה עובד לי

- **קובץ מלא מעודכן** עדיף על פני הוראות חיפוש/החלפה ידניות
- כשיש ריפקטור גדול, **הצג את השינוי המלא** לפני ביצוע
- **אל תוותר מהר** — כשמשהו לא עבד, תאבחן עם DevTools
- **סעיף אחד בכל פעם** לאישור. אל תשלח חמישה שינויים בבת אחת
- **שמור על קוד הקיים**. אל תיזרם ותתחיל לייצר. תשתמש בתשתית

### מה לא עובד לי

- הוראות "חפש את X והחלף ב-Y" בקובץ של 1500 שורות — שגיאה אחת בדרך
  ומפסידים שעה
- **דופליקציות בקוד אחרי `str_replace`** — תמיד תבדוק אחרי
  `grep -c "function foo"` לפני שמסיימים
- להמציא content שלא ביקשתי — אם יש ספק, תשאל

### איך לבדוק עבודה

אחרי כל שינוי:

1. `Ctrl+Shift+R` בדפדפן (אני אעשה)
2. פתח Console (F12 → Console) — **לא בטאב Elements!**
3. אם יש שגיאות אדומות, צלם ושלח לי
4. אם מדובר בעיית CSS, `Inspect` על האלמנט ותראה את הפאנל Styles

## טיפים טכניים לסשן הנוכחי

### PowerShell queries שימושיות

```powershell
# חיפוש טקסט בכל הפרויקט
Get-ChildItem -Path "..." -Recurse -Include "*.astro","*.ts","*.css" |
  ForEach-Object { Select-String -LiteralPath $_.FullName -Pattern "PATTERN" -List }

# בדיקת duplicate function
Select-String -LiteralPath "FILE" -Pattern "function FN_NAME" |
  Measure-Object | Select-Object Count

# שם קובץ דורש case change (Windows trick)
Rename-Item "old.ts" "temp.ts"
Rename-Item "temp.ts" "new.ts"
```

### Console JS שימושיות

```javascript
// בדוק state של כל בלוקי הקוד
document.querySelectorAll('.coderunner').forEach((b, i) =>
  console.log(i, 'initialized:', b.dataset.initialized,
                 'has copy:', !!b.querySelector('.cr-copy-btn')));

// בדוק computed style
getComputedStyle(document.querySelector('.cr-theme-icon-sun')).display

// טריגר theme switch ידני
document.documentElement.setAttribute('data-code-theme', 'light');
```

## החלטות שנסגרו בסשן עיצוב הקוד (אפריל 2026)

- **BashBlock** → Stripe Navy, פרומפט ציאן
- **CodeRunner** → GitHub Dark (default) + Light
- **Theme picker**: כפתור פר בלוק עם שמש/ירח zoom
- **BashBlock לא מקבל theme** — תמיד נייבי
- **אייקונים**: gradient + glow, לא stroke contour
- **שמש**: `#fff8b0 → #ffdd55 → #ff9500` עם 8 קרניים
- **ירח**: `#fffef8 → #e8e4d0 → #a8a495` עם craters