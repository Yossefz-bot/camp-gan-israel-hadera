export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim().slice(0,120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'אימייל לא תקין' }, { status: 400 });
  await env.DB.prepare('INSERT OR IGNORE INTO subscribers(name,email) VALUES(?,?)').bind(name,email).run();
  return Response.json({ ok: true });
}
