import { authorized, denied } from './_auth.js';
export async function onRequest({ request, env }) {
  if (!authorized(request, env)) return denied();
  if (request.method === 'GET') {
    const rows = await env.DB.prepare('SELECT * FROM days ORDER BY sort_order,date DESC,id DESC').all();
    return Response.json({ days: rows.results || [] });
  }
  if (request.method === 'POST') {
    const b = await request.json();
    const slug = String(b.slug || '').trim().replace(/[^a-zA-Z0-9-_]/g,'-');
    const title = String(b.title || '').trim();
    if (!slug || !title) return Response.json({ error:'חסרים פרטים' }, { status:400 });
    const r = await env.DB.prepare('INSERT INTO days(slug,title,date,description,sort_order) VALUES(?,?,?,?,?)')
      .bind(slug,title,b.date || null,String(b.description || ''),Number(b.sort_order || 0)).run();
    return Response.json({ ok:true, id:r.meta.last_row_id });
  }
  return new Response('Method not allowed', { status:405 });
}
