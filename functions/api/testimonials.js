export async function onRequestPost({ request, env }) {
  try {
    const b=await request.json().catch(()=>({})), name=String(b.name||'').trim().slice(0,160), phone=String(b.phone||'').trim().slice(0,80), message=String(b.message||'').trim().slice(0,3000), rating=Math.min(5,Math.max(1,Number(b.rating)||5));
    if(!name||message.length<3)return Response.json({error:'חסרים שם או תגובה'}, {status:400});
    await env.DB.prepare("INSERT INTO testimonials(name,phone,rating,message,status,sort_order,updated_at) VALUES(?,?,?,?, 'pending',0,CURRENT_TIMESTAMP)").bind(name,phone,rating,message).run();
    return Response.json({ok:true});
  } catch(error){return Response.json({error:error.message},{status:500})}
}
