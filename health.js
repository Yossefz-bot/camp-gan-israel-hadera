export async function onRequestGet() {
  return Response.json({ok: true, service: 'camp-gan-israel-hadera', time: new Date().toISOString()});
}
