export async function onRequestGet({ params, env, request }) {
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (!key) return new Response('Not found', { status: 404 });
  const object = await env.MEDIA.get(key, { range: request.headers });
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers, status: object.range ? 206 : 200 });
}
