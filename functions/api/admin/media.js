import { authorized, denied } from './_auth.js';
export async function onRequest({ request, env }) {
  if (!authorized(request, env)) return denied();
  if (request.method === 'GET') {
    const rows = await env.DB.prepare(`SELECT m.*,d.title AS day_title FROM media m LEFT JOIN days d ON d.id=m.day_id ORDER BY m.id DESC LIMIT 300`).all();
    return Response.json({ media: rows.results || [] });
  }
  if (request.method === 'DELETE') {
    const { id } = await request.json();
    const row = await env.DB.prepare('SELECT object_key FROM media WHERE id=?').bind(id).first();
    if (!row) return Response.json({ error:'not found' }, { status:404 });
    await env.MEDIA.delete(row.object_key);
    await env.DB.prepare('DELETE FROM media WHERE id=?').bind(id).run();
    return Response.json({ ok:true });
  }
  return new Response('Method not allowed', { status:405 });
}
