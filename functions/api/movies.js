function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

async function isAdmin(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map(x => x.trim()).find(x => x.startsWith("wt_admin="))?.slice(9);
  if (!token || !env.SESSION_SECRET) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SESSION_SECRET), {name:"HMAC", hash:"SHA-256"}, false, ["verify"]);
  const bytes = Uint8Array.from(atob(sig.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(exp));
}

export async function onRequestGet({ env }) {
  const { results = [] } = await env.DB.prepare("SELECT * FROM movies ORDER BY created_at DESC").all();
  const movies = results.map(m => ({
    id: m.id, title: m.title, genre: m.genre, year: m.year, duration: m.duration || "—", desc: m.description || "",
    art: m.poster_key ? `/api/media/${encodeURIComponent(m.poster_key)}` : (m.poster_url || ""),
    video: m.video_key ? `/api/media/${encodeURIComponent(m.video_key)}` : (m.video_url || "")
  }));
  return json(movies);
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({error:"Não autorizado"}, 401);
  const body = await request.json();
  if (!body.title || !body.video) return json({error:"Título e vídeo são obrigatórios."}, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO movies (id,title,genre,year,duration,description,poster_key,video_key,poster_url,video_url,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, String(body.title).slice(0,200), String(body.genre || "Filme").slice(0,80), Number(body.year)||null, String(body.duration||"").slice(0,50), String(body.desc||"").slice(0,2000), body.posterKey||null, body.videoKey||null, body.posterUrl||null, body.videoKey?null:(body.video||null), Date.now()).run();
  return json({ok:true,id}, 201);
}

export async function onRequestDelete({ request, env }) {
  if (!(await isAdmin(request, env))) return json({error:"Não autorizado"}, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({error:"ID obrigatório"}, 400);
  const movie = await env.DB.prepare("SELECT poster_key, video_key FROM movies WHERE id=?").bind(id).first();
  if (!movie) return json({error:"Filme não encontrado"}, 404);
  await env.DB.prepare("DELETE FROM movies WHERE id=?").bind(id).run();
  if (movie.poster_key) await env.MEDIA.delete(movie.poster_key);
  if (movie.video_key) await env.MEDIA.delete(movie.video_key);
  return json({ok:true});
}
