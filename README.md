# קעמפ גן ישראל חדרה — Cloudflare V5

גרסה מאוחדת: מערכת הניהול המלאה בסגנון Google Apps Script יחד עם Cloudflare Pages, ‏D1 ו־R2.

## מה יש במערכת הניהול
- לוח בקרה עם נתונים וספירות
- יצירה, עריכה, הסתרה, סדר ומחיקה של ימים
- תאריך עברי אוטומטי
- תמונת שער לכל יום
- העלאת כמה תמונות יחד, סרטונים והמנונים ישירות ל־R2
- ספריית מדיה כללית ושיבוץ תמונות כלוגו, באנר ותמונות תחתית
- עריכת כל תוכן האתר, צבעים ו־SEO
- הודעות באתר
- ניהול המנונים, סדר, שמות והצגה/הסתרה
- תגובות הורים: ממתין, אישור, דחייה, עריכה ומחיקה
- נרשמים לעדכונים, סטטוס וייצוא CSV
- בדיקת חיבור D1/R2 ואבטחה

## שדרוג מהגרסה הקיימת
1. העלה את כל תוכן התיקייה הזאת ל־GitHub תוך שמירת התיקיות `public`, `functions`, `migrations`.
2. המתן לפריסה ירוקה ב־Cloudflare.
3. פתח D1 → `camp-database` → Console.
4. הדבק והריץ פעם אחת את `migrations/0002_upgrade_admin.sql`.
5. בצע Retry deployment או Commit קטן חדש.
6. פתח `/admin/` ורענן עם Ctrl+F5.

## Bindings
הקובץ `wrangler.jsonc` כבר מכיל:
- D1 בשם `DB` אל `camp-database`
- R2 בשם `MEDIA` אל `camp-media`

## Secret
ב־Cloudflare חייב להיות Secret בשם:
- `ADMIN_TOKEN`

## כניסה
`https://camp-gan-israel-hadera.pages.dev/admin/`
