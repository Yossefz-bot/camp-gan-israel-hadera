export async function onRequestPost(context) {
  if (!context.env.DB) {
    return Response.json({message: 'מסד הנתונים עדיין לא חובר.'}, {status: 503});
  }
  const body = await context.request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  if (!name || !phone || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({message: 'יש למלא שם, טלפון ואימייל תקין.'}, {status: 400});
  }
  await context.env.DB.prepare(`
    INSERT INTO subscribers (full_name, phone, email, consent, status)
    VALUES (?, ?, ?, 1, 'active')
    ON CONFLICT(email) DO UPDATE SET
      full_name = excluded.full_name,
      phone = excluded.phone,
      consent = 1,
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
  `).bind(name, phone, email).run();
  return Response.json({ok: true, message: 'נרשמת בהצלחה לעדכוני הקעמפ.'});
}
