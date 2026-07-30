export async function onRequestPost(context) {
  if (!context.env.DB) {
    return Response.json({message: 'מסד הנתונים עדיין לא חובר.'}, {status: 503});
  }
  const body = await context.request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const message = String(body.message || '').trim();
  if (!name || !phone || message.length < 3) {
    return Response.json({message: 'יש למלא את כל השדות.'}, {status: 400});
  }
  await context.env.DB.prepare(`
    INSERT INTO contact_messages (full_name, phone, message)
    VALUES (?, ?, ?)
  `).bind(name, phone, message).run();
  return Response.json({ok: true, message: 'ההודעה נשלחה בהצלחה.'});
}
