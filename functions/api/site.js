export async function onRequestGet({ env }) {
  const settingsRows = await env.DB.prepare('SELECT key,value FROM settings').all();
  const settings = Object.fromEntries((settingsRows.results || []).map(r => [r.key, r.value]));
  const days = await env.DB.prepare(`
    SELECT d.*, COUNT(m.id) AS media_count
    FROM days d LEFT JOIN media m ON m.day_id=d.id
    WHERE d.is_published=1
    GROUP BY d.id ORDER BY d.sort_order ASC, COALESCE(d.date,'') DESC, d.id DESC
  `).all();
  const message = await env.DB.prepare('SELECT * FROM messages WHERE is_active=1 ORDER BY id DESC LIMIT 1').first();
  return Response.json({ settings, days: days.results || [], message });
}
