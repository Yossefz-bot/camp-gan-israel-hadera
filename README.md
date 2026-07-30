# קעמפ גן ישראל חדרה — Cloudflare Pages

זוהי חבילת הפריסה הראשונית ל־GitHub ול־Cloudflare Pages.

## מה עובד בפריסה הראשונה

- דף בית מקצועי, מהיר ומותאם לטלפון.
- RTL מלא.
- מבנה גלריות, סרטונים, נגן המנונים, הרשמה לעדכונים ויצירת קשר.
- קובץ האימות של Google בשורש האתר.
- robots.txt ו־sitemap.xml.
- Pages Functions בסיסיות.
- סכמת D1 מוכנה.

## מה יחובר בשלב הבא

- D1 למסד הנתונים.
- R2 לתמונות, סרטונים ושירים.
- פאנל ניהול מאובטח.
- העלאת קבצים, בחירת תמונת שער וגלריה מלאה.

## הגדרות Cloudflare Pages

- Framework preset: None
- Build command: exit 0
- Build output directory: public
- Root directory: ריק

## מבנה

- `public/` — האתר שמתפרסם.
- `functions/` — API של Cloudflare Pages.
- `migrations/` — סכמת מסד הנתונים D1.
