function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}})}
async function isAdmin(request, env) {
  const cookie=request.headers.get("Cookie")||""; const token=cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("wt_admin="))?.slice(9);
  if(!token||!env.SESSION_SECRET)return false; const [exp,sig]=token.split("."); if(!exp||!sig||Number(exp)<Date.now())return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  const bytes=Uint8Array.from(atob(sig.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
  return crypto.subtle.verify("HMAC",key,bytes,new TextEncoder().encode(exp));
}
export async function onRequestPost({request,env}){
  if(!(await isAdmin(request,env)))return json({error:"Não autorizado"},401);
  const form=await request.formData(); const file=form.get("file"); const kind=form.get("kind");
  if(!(file instanceof File))return json({error:"Arquivo ausente"},400);
  if(!["video","poster"].includes(kind))return json({error:"Tipo inválido"},400);
  const max=kind==="video"?2*1024*1024*1024:10*1024*1024;
  if(file.size>max)return json({error:kind==="video"?"Vídeo acima de 2 GB nesta versão.":"Capa acima de 10 MB."},413);
  const ext=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"");
  const key=`${kind}/${crypto.randomUUID()}.${ext||"bin"}`;
  await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type||"application/octet-stream",cacheControl:"public, max-age=31536000, immutable"}});
  return json({ok:true,key,url:`/api/media/${encodeURIComponent(key)}`},201);
}
