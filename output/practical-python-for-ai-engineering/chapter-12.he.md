# פרק 12 - בדיקות אוטומטיות וארגונומיה למפתח

## למה בדיקות קריטיות בפרויקטי AI

בעולם של AI, כל שינוי קטן ספרייה חדשה, פרמטר נוסף, או מודל משודרג. עלול לשנות את התוצאות בצורה לא צפויה. ולכן, בניגוד לקוד “רגיל”, בפיתוח עם AI הבדיקות אינן מותרות, הן חומת הגנה הכרחית.

מודלי שפה, Pipelines לעיבוד נתונים, ותהליכי אימון, כולם מלאים באלמנטים הסתברותיים. אי-אפשר להבטיח תוצאה זהה בכל הרצה, אבל כן ניתן לוודא שהמערכת מתנהגת כראוי, שומרת על מבנה תקין, ומגיבה נכון לשגיאות. בדיקות טובות בפרויקטי AI לא נמדדות רק ב-“עבר/נכשל”, אלא גם ביכולת שלהן לאתר התנהגויות לא צפויות מוקדם, ולאפשר למפתח לעבוד בביטחון.

זו לא עוד משימה, זו שיטת חשיבה הנדסית.

## Fixtures: הכנה משותפת לבדיקות

Fixtures הן פונקציות שמכינות נתונים או סביבה לבדיקה, ומוחזרות לבדיקה אוטומטית לפי שם.

```python
import pytest
from mini_text_analyzer.text_utils import tokenize

@pytest.fixture
def sample_text() -> str:
 return "Python is an amazing language"

def test_tokenize_with_fixture(sample_text):
 tokens = tokenize(sample_text)
 assert len(tokens) == 4
```


אפשר להגדיר Fixtures כלליים בקובץ conftest.py כדי לשתף אותם בכל הפרויקט. הם מעולים להכנות חוזרות כמו פתיחת קובץ, יצירת אובייקט API, או ניקוי נתונים.

## בדיקות חריגות (pytest.raises)

נרצה לוודא שגם במקרים חריגים הפונקציה מתנהגת כמצופה. כלומר, זורקת את החריגה הנכונה.

```python
import pytest
from mini_text_analyzer.io_utils import read_json

def test_read_json_not_found():
 with pytest.raises(FileNotFoundError):
 read_json("data/missing.json")
```


בדיקה כזו אינה נועדה “להפיל” את הקוד, אלא לוודא שהתנהגות השגיאה צפויה, מתועדת וניתנת ללכידה.


## Mocking - סימולציה של API חיצוני

לא תמיד נרצה לגשת לשירות חיצוני אמיתי בזמן הבדיקות (כמו OpenAI API או Google Cloud). במקום זאת, נשתמש ב-Mock, אובייקט שמדמה התנהגות אמיתית.

```python
from unittest.mock import patch
from mini_text_analyzer.llm_client import query_model

@patch("mini_text_analyzer.llm_client.send_request")
def test_query_model(mock_send):
 # Setup the mock behavior
 mock_send.return_value = {"text": "Hello world"}

 # Execute the function that uses the mock
 result = query_model("hi")

 # Verify the results and that the mock was called
 assert "Hello" in result
 mock_send.assert_called_once_with("hi")
```


אנו בודקים את הלוגיקה שלנו בלי תלות ברשת או ב-API אמיתי.
גישה זו חיונית במיוחד במערכות מבוססות AI שבהן הגישה החיצונית איטית או עולה כסף.

## כלים משלימים (black, ruff, pre-commit)

בדיקות הן לא רק “בדיקת תוצאה”, הן חלק מתרבות של איכות קוד ונוחות פיתוח. שימוש בכלים חכמים שמקלים על המפתח, שומרים על אחידות בקוד, ומונעים בעיות עוד לפני שהן קורות.

כלים משלימים יכולים להפוך את הסביבה שלך לחכמה ואחידה:

• :**Black ** מעצב קוד אוטומטית לפי תקן אחיד.

• :**Ruff** מנתח סגנון (lint) ומזהה בעיות בזמן כתיבה.

• **pre-commit**: מריץ בדיקות לפני כל commit כדי למנוע טעויות מראש.

דוגמה לקובץ .pre-commit-config.yaml:

```yaml
repos:
 - repo: https://github.com/psf/black
 rev: 24.4.0
 hooks:
 - id: black
 - repo: https://github.com/astral-sh/ruff-pre-commit
 rev: v0.6.3
 hooks:
 - id: ruff
 - repo: https://github.com/pre-commit/mirrors-mypy
 rev: v1.10.0
 hooks:
 - id: mypy
```


## דוגמה מרכזית: בדיקות ל-tokenize ו-clean

נבנה בדיקות אמיתיות לשתי פונקציות מהפרקים הקודמים:

```python
```python
from mini_text_analyzer.text_utils import tokenize, normalize
```

def test_tokenize_simple():
 text = "Hello world"
 result = tokenize(text)
 assert result == ["Hello", "world"]

def test_normalize_lowercase():
 text = " Python "
 result = normalize(text)
 assert result == "Python"
```

אפשר גם לבדוק קלט בעייתי:

```python
import pytest

def test_tokenize_empty():
 assert tokenize("") == []

def test_normalize_non_string():
 with pytest.raises(AttributeError):
 normalize(None)
```

בדיקות קטנות, ממוקדות וברורות, הרבה יותר יעילות מבדיקה אחת ענקית שמנסה לבדוק את הכול.

## שילוב ב-CI/CD (GitHub Actions)

בדיקות אוטומטיות הופכות משמעותיות באמת כשהן רצות לבד, בכל פעם שמישהו מבצע push או pull request.

דוגמה פשוטה ל-GitHub Actions:

```yaml
name: Tests

on: [push, pull_request]

jobs:
 test:
 runs-on: ubuntu-latest
 steps:
 - uses: actions/checkout@v4
 - name: Set up Python
 uses: actions/setup-python@v5
 with:
 python-version: '3.12'
 - run: pip install -r requirements.txt
 - run: pytest -v
```

כך כל שינוי בקוד עובר בדיקה אוטומטית, בלי שמפתח צריך לזכור להריץ משהו ידנית.


## Best Practices

• כתוב בדיקות **קטנות, ממוקדות וברורות.**

• לפחות בדיקה אחת, עבור כל פונקציה ציבורית.

• ודא שכל קוד שגיאה נבדק עם pytest.raises.

• השתמש ב-Fixtures למידע שחוזר על עצמו.

• הפרד בין Unit Tests (בודקים פונקציה אחת)

לבין Integration Tests (בודקים תהליך מלא).

• ודא שהבדיקות שלך חיוביות (מה אמור לעבוד) וגם שליליות (מה אמור להיכשל).

• שמור על זמן ריצה קצר, כך תוכל להריץ בדיקות לעיתים קרובות.


## סיכום - בדיקות הן חלק מהפיתוח, לא "עוד משימה"

בדיקות טובות לא נועדו להרשים את הבודקים, אלא להגן עליך, המפתח. במערכות AI שבהן הכל משתנה מהר, רק בדיקות עקביות שומרות על יציבות. כשבדיקות רצות בכל commit, כש-pre-commit שומר על סגנון, וכש-CI בודק הכול אוטומטית.

אתה לא רק כותב קוד, אתה בונה מערכת אמינה.

בדיקות אינן "שלב הסיום", אלא היסוד של תהליך הפיתוח עצמו.
ומי שמבין את זה, כבר מתכנת ברמה של מהנדס.

