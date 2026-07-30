export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), slug = url.searchParams.get('slug');
  if (!slug) return Response.json({ error:'missing slug' }, { status:400 });
  try {
    const day = await env.DB.prepare('SELECT * FROM days WHERE slug=? AND is_published=1').bind(slug).first();
    if (!day) return Response.json({ error:'not found' }, { status:404 });
    const sort = (await env.DB.prepare("SELECT value FROM settings WHERE key='gallery_sort'").first())?.value === 'newest' ? 'DESC' : 'ASC';
    const media = await env.DB.prepare(`SELECT * FROM media WHERE day_id=? AND is_published=1 ORDER BY sort_order ${sort},id ${sort}`).bind(day.id).all();
    return Response.json({ day, media:media.results||[] }, { headers:{'cache-control':'public,max-age=60'} });
  } catch (error) { return Response.json({ error:error.message }, { status:500 }); }
}
