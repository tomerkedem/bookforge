# ממשק שורת פקודה (CLI)

## למה CLI חשוב בפרויקטי AI

בפרויקטי **AI**, גם הקוד הכי חכם חסר ערך אם אי אפשר **להפעיל אותו בקלות**. ממשק שורת הפקודה (**CLI**) הוא הדרך להפוך קוד גולמי **לכלי אמיתי** כזה שאפשר **להריץ, לבדוק ולשל**בבתהליכים אחרים בלי לפתוח את העורך. CLI הוא לא שריד מעולם ישן, אלא **שכבת השליטה הטבעית** של פרויקטים חכמים. הוא מעניק דרך **יציבה, מהירה ואחידה** להפעיל תהליכים. בין אם מדובר בהרצת מודלים, ניקוי טקסטים או ניתוח נתונים.

נניח שבניתם כלי שמנקה טקסטים לפני שליחה למודל. 
בלי CLI, צריך לפתוח את הקובץ ולהריץ פונקציות מתוך הקוד. 
עם CLI, זה נראה כך:

```bash
mintx clean data/articles.csv --lang he
```

או

```bash
mintx stats output/cleaned.csv
```

פקודה אחת, והתהליך רץ מההתחלה ועד הסוף.

**למה זה כל כך חשוב בפרויקטי AI**

• **אוטומציה קלה:**

כל פקודת CLI ניתנת לשילוב ישיר בתוך scripts, pipelines או cron jobs. כך בונים מערכות שעובדות לבד.

• **עקביות בין סביבות:**

אותה פקודה עובדת בלפטופ, בענן או בתוךDocker , בלי לשנות שורה אחת של קוד.

• **נוחות לשיתוף:**

אפשר למסור כלי לאחרים: חוקרים, אנשי דאטה, אוDevOps, והם יוכלו להשתמש בו בלי לדעת איך הוא כתוב.

• **מודולריות וניקיון:**

CLI מפריד בין הלוגיקה העסקית לבין דרך ההפעלה, ומאפשר לבנות קוד גמיש שקל לתחזק.

בסופו של דבר, CLI הוא המפתח שהופך קוד לריצה אמיתית. 
הוא מעניק לפרויקט שלכם נוכחות בעולם. מאפשר להריץ, למדוד, לשתף ולשלב וכל זאת דרך פקודה אחת ברורה ונקייה.

## argparse - הכלי המובנה

כשאנחנו מריצים סקריפט פייתון, לדוגמה:

```python
python clean_text.py
```

הקובץ רץ, אבל אין לו מושג מאיפה לקרוא קובץ, לאן לשמור תוצאה, או באיזו שפה להשתמש.

אם נרצה להפעיל את אותו סקריפט עם קלטים שונים בכל פעם, נצטרך דרך להעביר לו פרמטרים מבחוץ, בלי לשנות את הקוד בכל הרצה.

כאן נכנסת לתמונה argparse. 
זו מערכת קטנה ומובנית בפייתון שתפקידה אחד: לאפשר לקוד שלך להבין פקודות מהמשתמש בדיוק כמו שעושים כלים מוכרים כמו git, pip או docker.

במילים פשוטות, argparse היא המוח שמתרגם את מה שכתבת בשורת הפקודה לערכים שהקוד שלך מבין.

**למה צריך אותה בכלל**

בלי argparse, הדרך היחידה לדעת מה המשתמש כתב היא לבדוק את רשימת המילים אחרי שם הקובץ, שנמצאת במשתנה sys.argv:

```python

import sys

input_path = sys.argv[1]

output_path = sys.argv[2]

```

זה עובד, אבל זה גם שביר ומסורבל. אם המשתמש שכח להזין פרמטר, הקוד קורס. אם הוא רוצה לדעת אילו אפשרויות קיימות, אין לו מושג. ואם נוסיף פרמטר חדש, צריך לשנות שוב את הקוד.

argparse פותרת את כל זה באופן אלגנטי:

• **מפרשת** את כל מה שנכתב אחרי שם הקובץ

(lang, --verbose, input.txt-- וכו׳).

• **בודקת תקינות** האם חסר פרמטר? האם סוג הערך נכון?

• **מייצרת עזרה אוטומטית**(--help) שמסבירה למשתמש איך להשתמש בכלי.

• **מטפלת בשגיאות** בצורה ברורה, בלי Traceback מבולגן.

**דוגמה פשוטה**

```python

import argparse

parser = argparse.ArgumentParser(description="Clean text before AI processing")

parser.add_argument("input", help="Path to the source file")

parser.add_argument("output", help="Path to save the result")

parser.add_argument("--lang", default="he", help="Text language (he or en)")

args = parser.parse_args()

```

הרצה:

```bash

python clean_text.py data/raw.csv data/clean.csv --lang en

```

פלט:

```Plaintext

Reading from data/raw.csv, saving to data/clean.csv (language en)

```

הרצה שגויה (למשל בלי אחד הפרמטרים):

```bash

python clean_text.py data/raw.csv

```

פלט:

```Plaintext

usage: clean_text.py [-h] [--lang LANG] input output

clean_text.py: error: the following arguments are required: output

```

**למה זה משנה**

ממשק שורת הפקודה (CLI) הוא השפה שבה המשתמש מדבר עם הקוד שלך.

argparse היא המתורגמנית

היא הופכת את מילת הפקודה (--lang en)

למשתנה בקוד (args.lang = "en"). 
היא מאפשרת לך לבנות כלי שניתן להשתמש בו שוב ושוב, עם פרמטרים שונים, בלי לגעת בקוד הפנימי.

**בקצרה**

• אם תכתבו סקריפט בלי argparse - יש לכם קוד.

• אם תכתבו אותו עם argparse - יש לכם כלי אמיתי.

argparse היא הגשר בין המשתמש לקוד, בין מה להריץ לאיך להבין את זה. בזכותה, כל פרויקט פייתון יכול להפוך ליישום קטן, יציב, גמיש ונוח להרצה מכל מקום.

## Typer - הכלי המודרני

אם argparse היא הוותיקה והאמינה, אז Typer היא הדור החדש. 
היא נבנתה על ידי Sebastián Ramírez (יוצר FastAPI) במטרה אחת: לאפשר למתכנתים לבנות ממשקי CLI קריאים, חכמים ומוקפדים, תוך שימוש ב-type hints של פייתון. בעוד ש-argparse מחייבת להגדיר כל פרמטר ידנית, Typer מזהה את סוג המשתנים שלך, יוצרת תיעוד אוטומטי, ומפיקה CLI נקי כמעט בלי תצורה.

**למה בכלל נוצר Typer**

עם השנים, מתכנתים התחילו לדרוש מ-CLI יותר נוחות ואלגנטיות:

• כתיבה מהירה בלי הגדרות כפולות.

• טיפוסי נתונים ברורים (int, str, Path).

• תיעוד אוטומטי וקריא.

• תמיכה בפקודות משנה (כמו git add, git commit).

Typer נבנתה בדיוק לשם כך. היא שכבת CLI מודרנית מעל Click, ספרייה ותיקה שמאפשרת ניהול פקודות מתקדמות. 
אבל Typer עושה משהו מעבר: היא מתאימה את עצמה למבנה הפונקציות שלך.

**לדוגמה**

```python

import typer

from pathlib import Path

app = typer.Typer(help="Clean text before AI processing")

@app.command()

def clean(input: Path, output: Path, lang: str = "he"):

    """

    Clean text from an input file and save it to an output file.

    """

    typer.echo(f"Reading from {input}, saving to {output} (language {lang})")

if __name__ == "__main__":

    app()

```

הרצה:

```bash

python clean_text.py clean data/raw.csv data/clean.csv --lang en

```

פלט:

```Plaintext

Reading from data/raw.csv, saving to data/clean.csv (language en)

```

**מה קרה כאן**

• @app.command()הופך כל פונקציה לפקודה עצמאית ב-CLI.

• Typer קוראת את **רמזי הטיפוס (type hints)** ומייצרת מהם ממשק חכם:

• אם המשתנה הוא Path: היא תוודא שהקובץ קיים.

• אם הוא int: תתריע על טקסטים שאינם מספרים.

 • פרמטרים עם ערכי ברירת מחדל (lang="he") מזוהים אוטומטית כפרמטרים אופציונליים.

 • הכול מגיע עם תיעוד מיידי וקריא.

**עזרה מובנית**

בדיוק כמו ב-argparse, Typer תומכת בפקודת --help:

```bash

python clean_text.py clean -help

```

פלט:

```Plaintext

Usage:

  clean_text.py clean [OPTIONS] INPUT OUTPUT

Clean text from an input file and save it to an output file.

Arguments:

  INPUT   [required]

  OUTPUT  [required]

Options:

  --lang TEXT  Text language (default he)

  --help       Show help and exit

```

**למה מתכנתים אוהבים את Typer**

**כתיבה קצרה וקריאה:** במקום להגדיר parser וארגומנטים, פשוט כותבים פונקציה רגילה.

• **טיפוסי נתונים מובנים:**

סוגי המשתנים כבר מגדירים את אופי הפרמטרים.

• **תיעוד אוטומטי:**

כל פונקציה מתועדת לבד בעזרת ה-docstring שלה.

• **תמיכה בפקודות משנה :(subcommands)**

מושלם לכלים מורכבים כמו mintx clean, mintx stats ועוד.

• **אינטגרציה טבעית עם FastAPI:**

מי שמכיר את FastAPI ירגיש בבית אותה פילוסופיה, אותה נוחות.

**מתי לבחור Typer**

• כשאתם בונים **כלי CLI עם יותר מפקודה אחת.**

• כשאתם רוצים **תחזוקה פשוטה וקריאות גבוהה.**

• כשאתם עובדים בצוותים ומעדיפים קוד שנראה כמו API ולא כמו קונפיגורציה.

Typer הפכה בתוך זמן קצר לסטנדרט החדש של פרויקטי CLI מודרניים. היא לא רק מקלה על הכתיבה, היא מקרבת את עולם הפקודות לעולם הקוד, ומאפשרת לבנות ממשקים חכמים, מתועדים וברורים. כמעט בלי מאמץ.

**Subcommands - פקודות משנה**

כלי CLI אמיתי כולל לרוב יותר מפעולה אחת. במקום קובץ נפרד לכל משימה, נוח לרכז הכול תחת ממשק אחד עם פקודות משנה בדיוק כמו ב-git add, git commit או pip install.

ב-Typer זה פשוט במיוחד:

```python

import typer

app = typer.Typer(help="Mini text tool mintx for text processing")

@app.command()

def clean(input: str, output: str):

    typer.echo(f"Text cleaning from {input} to {output}")

@app.command()

def stats(file: str):

    typer.echo(f"Statistics for {file}")

if __name__ == "__main__":

    app()

```

כעת ניתן להריץ:

```bash

python mintx.py clean data/raw.csv out.csv

python mintx.py stats out.csv

```

כל פקודה פועלת בנפרד, עם פרמטרים שונים, אך חולקת אותו בסיס קוד ותיעוד.

**למה זה חשוב**

• מאפשר לאחד מספר כלים קטנים לכלי אחד ברור.

• קל לתחזוקה - אין שכפול קוד.

• מונע בלבול בשמות קבצים או סקריפטים.

כך CLI הופך ממספר סקריפטים לכלי שלם, מסודר וברור.

שלב חשוב בכל פרויקט AI אמיתי.

## קודי יציאה (Exit Codes) - 0 מול שאר

מאחורי הקלעים, כל תוכנית CLI מסיימת את פעולתה עם **קוד יציאה** מספר שמסמן למערכת האם הפעולה הצליחה או נכשלה. 
זה אולי נראה פרט טכני, אבל בפרויקטי AI (ובעיקר באוטומציה ו-pipelines) הוא **הקו שמפריד בין תהליך תקין לשגוי.**

הכלל פשוט:

• **0 - הצלחה.**

• **כל מספר אחר** - שגיאה כלשהיא.

ב-Typer (וגם ב-argparse) ניתן לקבוע זאת בקלות:

```python

import typer

def main(file: str):

    if not file.endswith(".csv"):

        typer.echo("Error: only CSV files are supported")

        raise typer.Exit(code=1)

    typer.echo("Processing completed successfully")

    raise typer.Exit(code=0)

if __name__ == "__main__":

    typer.run(main)

```

כעת, מי שיריץ את הכלי מתוך סקריפט אחר יוכל לדעת אם הכול עבר בשלום:

```bash

mintx clean data.txt || echo "Run failed"

```

אם הקובץ לא חוקי. הפקודה תסתיים עם קוד 1, והמערכת תזהה זאת מיד.

**למה זה חשוב?**

• מאפשר ל-scripts ול-CI להבין אם השלב הצליח.

• משפר דיווחי שגיאות ב-pipelines.

• עוזר לתחזק כלים יציבים שניתן לסמוך עליהם בתהליכים אוטומטיים.

CLI טוב לא רק מדפיס הודעה, הוא גם מסמן אותה לקוד שמריץ אותו. 
זה ההבדל בין תוכנה אינטראקטיבית לבין רכיב אמין בשרשרת אוטומציה.

## תיעוד אוטומטי (--help)

כלי CLI טוב לא דורש מדריך. 
הוא מסביר את עצמו ברגע שמקלידים:

```bash

mintx -help

```

גם argparse וגם Typer מייצרים תיעוד אוטומטי שמציג את כל הפקודות, הארגומנטים והאפשרויות הקיימות, יחד עם הסבר קצר על כל אחד מהם. זו לא תוספת קוסמטית, זו שכבת **שקיפות והנגשה** שהופכת כלי CLI לשימושי באמת.

ב-Typer, למשל, זה קורה בלי שום מאמץ:

```bash

python mintx.py -help

```

פלט:

```Plaintext

Usage:

mintx clean [OPTIONS] INPUT OUTPUT

Clean text from an input file and save it to an output file.

Arguments:

  INPUT   [required]

  OUTPUT  [required]

Options:

  --lang TEXT  Text language (he or en)

  --help       Show help and exit

```

**למה זה חשוב?**

• **חוסך תיעוד חיצוני** הכלי מתעד את עצמו.

• **מונע טעויות משתמשים** אין צורך לזכור פרמטרים.

• **מקרין מקצועיות** כלי שמסביר את עצמו נראה מושלם גם בעיני מי שלא כתב אותו.

התוצאה היא CLI שמכבד את המשתמש, כלי שמסביר בדיוק מה הוא יודע לעשות, עוד לפני שמישהו פותח את הקוד.

## דוגמה מרכזית - CLI מלא למיני-טקסט (mintx)

כעת נחבר את הכול לכלי אחד שלם: ממשק שורת פקודה שמאפשר להריץ פעולות שונות על טקסטים, ניקוי, חישוב סטטיסטיקות, ועוד.

```python

# mintx.py

import typer

from pathlib import Path

app = typer.Typer(help="mintx CLI tool for text processing in AI projects")

@app.command()

def clean(input: Path, output: Path, lang: str = "he"):

    """

    Clean text from an input file and save the result to an output file.

    """

    typer.echo(f"Cleaning text language {lang} from {input} to {output}")

    # Here the real function will be called clean_text input output lang

    typer.echo("Cleaning completed successfully")

@app.command()

def stats(file: Path):

    """

    Compute basic text statistics.

    """

    typer.echo(f"Reading text from {file}")

    # Here the function will be called compute_stats file

    typer.echo("Statistics computed and saved")

if __name__ == "__main__":

    app()

```

הרצות לדוגמה:

```bash

python mintx.py clean data/raw.csv data/clean.csv --lang en

python mintx.py stats data/clean.csv

```

**מה מקבלים כאן**

• **פקודות משנ**ה clean, stats **:(Subcommands).**

• **תיעוד אוטומטי:** mintx --help מציג עזרה מלאה.

• **קודי יציאה ברורים:** אפשר להחזיר raise typer.Exit(1) במקרה של שגיאה.

• **מודולריות מלאה:** כל פקודה מופרדת לפונקציה, כך שקל להרחיב בהמשך.

הכלי הזה קטן, אבל הוא כבר **התשתית של מערכת אמיתית**: 
אפשר לשלב אותו ב-pipeline, להריץ אותו מתסריט אוטומטי, או למסור אותו לחוקרים וצוותי דאטה בלי הסברים מיותרים.

**Best Practices**

**שמות ברורים ו-Defaults הגיוניים**

ממשק CLI טוב הוא לא רק פונקציונלי, הוא גם נעים לשימוש. 
כשמפתחים כלי שאחרים יריצו, חשוב לזכור: המשתמש לא רואה את הקוד, הוא רואה פקודות. כל מילה חשובה.

**שמות פקודות**

בחרו שמות ברורים וקצרים. 
עדיף פועל ברור אחד, שמייצג פעולה:

✓ clean, stats, train, serve

• text_cleaning, run_statistics_now

אם יש פקודות דומות, שמרו על אחידות:

```Plaintext

mintx clean ...

mintx stats ...

mintx export ...

```

**שמות פרמטרים**

פרמטרים טובים הם אינטואיטיביים:

• --input, --output, --lang, --model

• לעולם אל תשתמשו בקיצורים מבלבלים כמו --in או --op 
העדיפו שמות מלאים גם אם הם ארוכים במעט. הם נקראים פעם אחת, אבל מבטיחים שימוש נכון.

**ערכי ברירת מחדל (Defaults)**

ברירת מחדל טובה חוסכת הקלדה מיותרת ומונעת תקלות:

```python

def clean(input: Path, output: Path = Path("output.csv"), lang: str = "he"):

```

כך המשתמש יכול להריץ רק:

```bash

mintx clean data.csv

```

והכלי כבר יידע לשמור ל-output.csv בעברית.

**הודעות פלט**

CLI נוח גם **מדבר יפה**. 
לא רק מסיים את העבודה, הוא גם מספר מה בדיוק קרה.

```python

typer.echo("Cleaned 324 lines language he")

```

כשמדובר בכלים הנדסיים, חוויית שימוש שקטה וברורה עושה הבדל גדול.

**קונסיסטנטיות**

שמרו על אחידות בין פקודות, פרמטרים והודעות. משתמש שמכיר פקודה אחת, צריך להבין את כולן מיד.

כלל הזהב: 
**כלי CLI טוב הוא כזה שהמשתמש מצליח להבין בלי לקרוא תיעוד.**

אם השמות, ברירות המחדל וההודעות שלכם עומדים בכך.

הצלחתם לבנות כלי אמיתי, לא רק סקריפט שעובד.

## סיכום - איך להפוך קוד לכלי שימושי

CLI הוא לא קישוט, אלא שכבת שליטה שמעניקה לקוד שלכם חיים אמיתיים מחוץ לעורך.

בעולם של AI, שבו סקריפטים מתמזגים עם תהליכים אוטומטיים, זה ההבדל בין קוד שעובד רק אצלכם לבין כלי שיכול לעבוד בכל מקום.

במהלך הפרק ראינו:

• איך **argparse** מספקת בסיס יציב ונטול תלות לבניית CLI פשוט.

• איך **Typer** מאפשרת ליצור ממשקים אלגנטיים בעזרת פונקציות רגילות ו-type hints.

• איך **פקודות משנה (Subcommands)** מאחדות כמה פעולות לכלי אחד מסודר.

• איך **קודי יציאה** מאפשרים לסקריפטים לזהות הצלחה או כישלון בצורה אוטומטית.

• ואיך **תיעוד אוטומטי ו-defaults חכמים** הופכים כל כלי לקל לשימוש גם עבור אחרים.

הכוח האמיתי של CLI הוא בפשטות: פקודה אחת, פרמטר אחד, והרבה בהירות. כשכלי ה-AI שלכם מגיע לשלב שבו אחרים צריכים להריץ אותו. בין אם זה אנליסט, חוקר או שרת אוטומטי CLI הוא הדרך **להפוך את הקוד למוצר קטן, יציב ונגיש.**

מכאן והלאה, כל מודול שתכתבו יכול להפוך לפקודה, וכל פרויקט יכול להפוך לכלי שלם - אחד שמדבר בשפה אנושית וברורה.


