export async function onRequestGet({request,env,params}){
  const key=Array.isArray(params.path)?params.path.join("/"):params.path;
  const obj=await env.MEDIA.get(key,{range:request.headers});
  if(!obj)return new Response("Not found",{status:404});
  const headers=new Headers(); obj.writeHttpMetadata(headers); headers.set("etag",obj.httpEtag); headers.set("accept-ranges","bytes");
  if(obj.range){ const len=obj.range.end-obj.range.start+1; headers.set("content-range",`bytes ${obj.range.start}-${obj.range.end}/${obj.size}`); headers.set("content-length",String(len)); return new Response(obj.body,{status:206,headers}); }
  headers.set("content-length",String(obj.size)); return new Response(obj.body,{headers});
}
