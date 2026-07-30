export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'missing slug' }, { status: 400 });
  const day = await env.DB.prepare('SELECT * FROM days WHERE slug=? AND is_published=1').bind(slug).first();
  if (!day) return Response.json({ error: 'not found' }, { status: 404 });
  const media = await env.DB.prepare('SELECT * FROM media WHERE day_id=? ORDER BY sort_order,id').bind(day.id).all();
  return Response.json({ day, media: media.results || [] });
}
