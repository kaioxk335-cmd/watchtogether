function json(data, status=200, extra={}) { return new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json; charset=utf-8", ...extra}}); }
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC", hash:"SHA-256"}, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
export async function onRequestPost({request,env}) {
  const {pin} = await request.json().catch(()=>({}));
  if (!env.ADMIN_PIN || String(pin) !== String(env.ADMIN_PIN)) return json({error:"PIN incorreto"}, 401);
  if (!env.SESSION_SECRET) return json({error:"SESSION_SECRET não configurado no Cloudflare"}, 500);
  const exp = String(Date.now()+1000*60*60*24*7);
  const sig = await sign(exp, env.SESSION_SECRET);
  return json({ok:true}, 200, {"Set-Cookie":`wt_admin=${exp}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`});
}
export async function onRequestDelete({request}) {
  return new Response(JSON.stringify({ok:true}), {headers:{"content-type":"application/json", "Set-Cookie":"wt_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"}});
}
