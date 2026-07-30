# קעמפ גן ישראל חדרה — Cloudflare V4

מערכת עובדת ל־Cloudflare Pages הכוללת אתר ציבורי, גלריות לפי ימים, D1, אחסון R2 ופאנל ניהול.

## מבנה
- `public/` האתר ופאנל הניהול
- `functions/` API של Cloudflare Pages Functions
- `migrations/0001_schema.sql` סכמת D1

## הגדרות Cloudflare Pages
- Framework preset: None
- Build command: `exit 0`
- Build output directory: `public`

## Bindings שחייבים ליצור בפרויקט Pages
Settings → Bindings:
1. D1 database binding בשם `DB` ולבחור `camp-database`
2. R2 bucket binding בשם `MEDIA` ולבחור `camp-media`

## משתנה סודי
Settings → Variables and Secrets:
- `ADMIN_TOKEN` — קוד ארוך וסודי לבחירתך

## יצירת הטבלאות
ב־D1 Console הדבק והריץ את התוכן של `migrations/0001_schema.sql`.

## כניסה לניהול
`https://YOUR-DOMAIN/admin/`

הזן את הערך שהגדרת ב־`ADMIN_TOKEN`.
