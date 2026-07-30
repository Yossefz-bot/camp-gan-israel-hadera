import { authorized, denied } from './_auth.js';
export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) return denied();
  const form = await request.formData();
  const file = form.get('file');
  const dayId = Number(form.get('day_id') || 0) || null;
  const kind = String(form.get('kind') || 'image');
  const title = String(form.get('title') || '');
  if (!(file instanceof File)) return Response.json({ error:'לא נבחר קובץ' }, { status:400 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
  const key = `${kind}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType:file.type } });
  await env.DB.prepare('INSERT INTO media(day_id,kind,title,object_key,mime_type,size_bytes) VALUES(?,?,?,?,?,?)')
    .bind(dayId,kind,title,key,file.type,file.size).run();
  return Response.json({ ok:true, key, url:`/api/media/${key}` });
}
