import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const DEFAULT_MOVIES = [];

const DEFAULT_PROFILES = [
  {
    id: "ben-dono",
    name: "ben",
    pin: "151226",
    avatar: "https://upload.wikimedia.org/wikipedia/en/5/5e/Ben_Tennyson_10.png",
    role: "Dono",
    verified: true
  }
];

const AVATARS = [
  "🦊","🐺","🐯","🦁","🐼","🐸","🐵","🐨","🐻","🦄","🐲","👾",
  "🤖","👽","🎭","🕶️","🔥","⚡","🌙","⭐","💎","🎮","🏎️","🦈"
];

const MOVIE_ART = {
  1:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85",
  2:"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85",
  3:"https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",
  4:"https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=900&q=85",
  5:"https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85",
  6:"https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=85"
};

function getProfiles(){
  try { return JSON.parse(localStorage.getItem("wt_profiles")) || DEFAULT_PROFILES; }
  catch { return DEFAULT_PROFILES; }
}

function App(){
  const [profiles,setProfiles] = useState(getProfiles);
  const [profile,setProfile] = useState(null);
  const [pinProfile,setPinProfile] = useState(null);
  const [pin,setPin] = useState("");
  const [pinError,setPinError] = useState("");
  const [page,setPage] = useState("home");
  const [selectedMovie,setSelectedMovie] = useState(null);
  const [rooms,setRooms] = useState(() => JSON.parse(localStorage.getItem("wt_rooms") || "[]"));
  const [room,setRoom] = useState(null);
  const [showCreate,setShowCreate] = useState(false);
  const [showProfile,setShowProfile] = useState(false);
  const [movies,setMovies] = useState([]);
  const [moviesLoading,setMoviesLoading] = useState(true);
  const [showAdmin,setShowAdmin] = useState(false);

  useEffect(()=>localStorage.setItem("wt_profiles",JSON.stringify(profiles)),[profiles]);
  useEffect(()=>localStorage.setItem("wt_rooms",JSON.stringify(rooms)),[rooms]);
  useEffect(()=>{
    fetch("/api/movies").then(r=>r.ok?r.json():[]).then(setMovies).catch(()=>setMovies([])).finally(()=>setMoviesLoading(false));
  },[]);

  if(!profile) {
    return <ProfileGate profiles={profiles} setProfiles={setProfiles} pinProfile={pinProfile}
      setPinProfile={setPinProfile} pin={pin} setPin={setPin} pinError={pinError}
      setPinError={setPinError} onLogin={(p)=>{setProfile(p);setPinProfile(null);setPin("");setPinError("")}} />;
  }

  if(room) {
    return <Room room={room} profile={profile} onLeave={()=>setRoom(null)} />;
  }

  const openMovie=(m)=>{setSelectedMovie(m);setPage("watch")};

  return <>
    <header className="topbar">
      <div className="brand" onClick={()=>setPage("home")}>WATCH<span>TOGETHER</span></div>
      <nav>
        <button className={page==="home"?"active":""} onClick={()=>setPage("home")}>Início</button>
        <button className={page==="movies"?"active":""} onClick={()=>setPage("movies")}>Filmes</button>
        <button className={page==="rooms"?"active":""} onClick={()=>setPage("rooms")}>Salas</button>
      </nav>
      <button className="profileMini" onClick={()=>setShowProfile(true)}>
        <img src={profile.avatar}/><span>{profile.name}{profile.role === "Dono" && <small className="header-owner"> • DONO</small>}</span><b>⌄</b>
      </button>
    </header>

    {page==="home" && <Home movies={movies} openMovie={openMovie} onRooms={()=>setPage("rooms")} onAdmin={()=>setShowAdmin(true)} profile={profile} />}
    {page==="movies" && <Movies movies={movies} openMovie={openMovie}/>}
    {page==="watch" && selectedMovie && <MoviePage movie={selectedMovie} onBack={()=>setPage("home")} onCreateRoom={()=>setShowCreate(true)} />}
    {page==="rooms" && <Rooms rooms={rooms} onCreate={()=>setShowCreate(true)} onJoin={(r)=>setRoom(r)} />}

    {showCreate && <CreateRoom profile={profile} onClose={()=>setShowCreate(false)} onCreate={(r)=>{setRooms(x=>[r,...x]);setShowCreate(false);setRoom(r)}} />}
    {showProfile && <ProfileModal profile={profile} onClose={()=>setShowProfile(false)} onLogout={()=>{setProfile(null);setShowProfile(false)}} onAdmin={()=>{setShowProfile(false);setShowAdmin(true)}} />}
    {showAdmin && profile.role === "Dono" && <AdminPanel movies={movies} setMovies={setMovies} onClose={()=>setShowAdmin(false)} />}
  </>;
}

function ProfileGate({profiles,setProfiles,pinProfile,setPinProfile,pin,setPin,pinError,setPinError,onLogin}){
  const [adding,setAdding]=useState(false);
  const [newName,setNewName]=useState("");
  const [newPin,setNewPin]=useState("");
  const [avatar,setAvatar]=useState(AVATARS[0]);
  const [customPhoto,setCustomPhoto]=useState("");

  const addProfile=()=>{
    if(!newName.trim() || !/^\d{4,6}$/.test(newPin)) return;
    const p={id:crypto.randomUUID(),name:newName.trim(),avatar:customPhoto || avatar,pin:newPin};
    setProfiles(x=>[...x,p]);setAdding(false);setNewName("");setNewPin("");setCustomPhoto("");setAvatar(AVATARS[0]);
  };
  const choosePhoto=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.size>2*1024*1024) return alert("Escolha uma foto de até 2 MB.");
    const reader=new FileReader();
    reader.onload=()=>setCustomPhoto(reader.result);
    reader.readAsDataURL(file);
  };
  const checkPin=()=>{
    if(pin===pinProfile.pin) onLogin(pinProfile);
    else {setPinError("PIN incorreto");setPin("")}
  };

  return <main className="gate">
    <div className="gateGlow"/>
    <div className="gateBox">
      <div className="brand big">WATCH<span>TOGETHER</span></div>
      {!pinProfile && !adding && <>
        <h1>Quem está assistindo?</h1>
        <p className="muted">{profiles.length ? "Escolha seu perfil para continuar." : "Crie seu primeiro perfil para começar."}</p>
        <div className="profileGrid">
          {profiles.map(p=><button className="profileCard" key={p.id} onClick={()=>setPinProfile(p)}>
            <img src={p.avatar}/><strong>{p.name}</strong><small>🔒 PIN</small>
          </button>)}
          <button className="profileCard add" onClick={()=>setAdding(true)}><span>＋</span><strong>Adicionar perfil</strong></button>
        </div>
      </>}
      {pinProfile && <div className="pinBox">
        <img className="pinAvatar" src={pinProfile.avatar}/>
        <h2>{pinProfile.name}</h2><p className="muted">Digite o PIN do perfil</p>
        <input autoFocus type="password" inputMode="numeric" maxLength="6" value={pin}
          onChange={e=>{setPin(e.target.value.replace(/\D/g,""));setPinError("")}}
          onKeyDown={e=>e.key==="Enter"&&checkPin()} placeholder="••••"/>
        {pinError && <div className="error">{pinError}</div>}
        <button className="primary wide" onClick={checkPin}>Entrar</button>
        <button className="ghost" onClick={()=>{setPinProfile(null);setPin("");setPinError("")}}>Voltar</button>
      </div>}
      {adding && <div className="formBox">
        <h2>Novo perfil</h2>
        <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nome do perfil"/>
        <input value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,""))} maxLength="6" placeholder="PIN de 4 a 6 números" type="password"/>
        <div className="avatarPreview">{customPhoto ? <img src={customPhoto}/> : <span>{avatar}</span>}</div>
        <div className="avatarGrid">{AVATARS.map(a=><button type="button" className={"avatarChoice "+(!customPhoto&&avatar===a?"selected":"")} key={a} onClick={()=>{setAvatar(a);setCustomPhoto("")}}>{a}</button>)}</div>
        <label className="photoUpload">📷 Escolher foto do computador<input type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto}/></label>
        <div className="row"><button className="ghost" onClick={()=>setAdding(false)}>Cancelar</button><button className="primary" onClick={addProfile}>Criar perfil</button></div>
      </div>}
    </div>
  </main>;
}

function Home({movies,openMovie,onRooms,onAdmin,profile}){
  return <main>
    <section className="hero emptyHero">
      <div className="heroContent">
        <span className="tag">WATCHTOGETHER</span><h1>Seu catálogo começa aqui.</h1>
        <p>Adicione filmes e vídeos pelo painel de administrador para eles aparecerem no catálogo.</p>
        <div className="heroBtns">{profile.role === "Dono" && <button className="primary" onClick={onAdmin}>⚙️ Painel de administrador</button>}<button className="secondary" onClick={onRooms}>👥 Criar sala</button></div>
      </div>
    </section>
    {moviesLoading ? <section className="empty"><div>⏳</div><h2>Carregando catálogo...</h2></section> : movies.length===0 ? <section className="empty"><div>🎬</div><h2>Nenhum filme ainda</h2><p>O catálogo está vazio. Entre no painel de administrador para adicionar seu primeiro vídeo.</p></section> : <section className="section"><div className="sectionHead"><h2>Catálogo</h2></div><div className="movieRow">{movies.slice(0,6).map(m=><MovieCard key={m.id} movie={m} onClick={()=>openMovie(m)}/>)}</div></section>}
  </main>;
}

function Movies({movies,openMovie}){
  const [q,setQ]=useState("");
  const filtered=movies.filter(m=>(m.title+" "+m.genre).toLowerCase().includes(q.toLowerCase()));
  return <main className="page"><div className="pageTitle"><div><span className="tag">CATÁLOGO</span><h1>Filmes</h1></div><input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="🔎 Buscar filme..."/></div><div className="movieGrid">{filtered.map(m=><MovieCard key={m.id} movie={m} onClick={()=>openMovie(m)}/>)}</div></main>;
}

function MovieCard({movie,onClick}){
  return <button className="movieCard" onClick={onClick}><div className="poster" style={movie.art?{backgroundImage:`url(${movie.art})`}:undefined}><span>{!movie.art&&movie.emoji}</span><div className="posterShade"/></div><div className="movieInfo"><strong>{movie.title}</strong><small>{movie.year} • {movie.genre} • {movie.duration}</small></div></button>;
}

function MoviePage({movie,onBack,onCreateRoom}){
  return <main className="watchPage">
    <button className="back" onClick={onBack}>← Voltar</button>
    <div className="videoFake">{movie.video ? <video className="realVideo" src={movie.video} controls playsInline /> : <><div className="playCircle">▶</div><div className="videoTitle">{movie.title}<small>Adicione uma URL de vídeo no painel</small></div></>}</div>
    <div className="watchInfo"><div><span className="tag">{movie.genre}</span><h1>{movie.title}</h1><p>{movie.desc}</p><small>{movie.year} • {movie.duration}</small></div><button className="primary" onClick={onCreateRoom}>👥 Assistir com amigos</button></div>
    <div className="notice">O player desta primeira versão está preparado como área de reprodução. Para vídeos reais, conecte uma URL de vídeo autorizada ou um storage/CDN seu.</div>
  </main>;
}

function Rooms({rooms,onCreate,onJoin}){
  return <main className="page"><div className="pageTitle"><div><span className="tag">TEMPO REAL</span><h1>Salas</h1><p className="muted">Crie uma sala pública ou compartilhe um link privado.</p></div><button className="primary" onClick={onCreate}>＋ Criar sala</button></div>
  {rooms.length===0?<div className="empty"><div>🎬</div><h2>Nenhuma sala criada</h2><p>Crie a primeira e convide seus amigos.</p></div>:<div className="roomGrid">{rooms.map(r=><div className="roomCard" key={r.id}><div className="roomIcon">🎬</div><div><h3>{r.name}</h3><p>{r.private?"🔒 Privada":"🌐 Pública"} • {r.host}</p></div><button className="secondary" onClick={()=>onJoin(r)}>Entrar</button></div>)}</div>}</main>;
}

function CreateRoom({profile,onClose,onCreate}){
  const [name,setName]=useState("Noite de filmes");
  const [privateRoom,setPrivateRoom]=useState(false);
  const [password,setPassword]=useState("");
  const create=()=>onCreate({id:Math.random().toString(36).slice(2,8).toUpperCase(),name,private:privateRoom,password,host:profile.name,createdAt:Date.now()});
  return <div className="modal"><div className="modalBox"><button className="close" onClick={onClose}>×</button><span className="tag">NOVA SALA</span><h2>Criar sala</h2><label>Nome da sala<input value={name} onChange={e=>setName(e.target.value)}/></label><div className="switchRow"><div><strong>Sala privada</strong><small>Somente quem tiver o link/senha entra.</small></div><button className={"switch "+(privateRoom?"on":"")} onClick={()=>setPrivateRoom(!privateRoom)}><i/></button></div>{privateRoom&&<label>Senha da sala<input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Opcional"/></label>}<button className="primary wide" onClick={create}>Criar e entrar</button></div></div>;
}

function Room({room,profile,onLeave}){
  const [chat,setChat]=useState([{name:room.host,text:"Bem-vindos à sala! 👋"}]);
  const [msg,setMsg]=useState("");
  const [muted,setMuted]=useState(false);
  const [copied,setCopied]=useState(false);
  const send=()=>{if(!msg.trim())return;setChat(c=>[...c,{name:profile.name,text:msg.trim()}]);setMsg("")};
  const invite=()=>{navigator.clipboard?.writeText(location.origin+"/sala/"+room.id);setCopied(true);setTimeout(()=>setCopied(false),1600)};
  return <main className="roomPage"><header className="roomTop"><button className="back" onClick={onLeave}>← Sair</button><div><strong>{room.name}</strong><small>{room.private?"🔒 Privada":"🌐 Pública"} • código {room.id}</small></div><button className="secondary" onClick={invite}>🔗 {copied?"Copiado":"Convidar"}</button></header>
    <div className="roomLayout"><section className="roomVideo"><div className="videoFake bigVideo"><div className="playCircle">▶</div><div className="controls"><span>▶</span><div className="progress"><i/></div><span>🔊</span><span>⚙️</span><span>⛶</span></div></div><div className="roomControls"><button className="secondary">▶/⏸ Sincronizar</button><button className={"secondary "+(muted?"danger":"")} onClick={()=>setMuted(!muted)}>{muted?"🔇 Mutado":"🎙️ Microfone"}</button><button className="secondary">🔊 Áudio</button></div></section>
    <aside className="roomSide"><div className="tabs"><b>👥 Pessoas</b><b>💬 Chat</b></div><div className="people"><Person name={profile.name} avatar={profile.avatar} me/><Person name={room.host} avatar="https://i.pravatar.cc/80?img=12"/><Person name="Convidado" avatar="https://i.pravatar.cc/80?img=32"/></div><div className="chat"><div className="chatTitle">Chat da sala</div><div className="messages">{chat.map((c,i)=><div className="message" key={i}><strong>{c.name}</strong><span>{c.text}</span></div>)}</div><div className="chatInput"><input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escreva uma mensagem..."/><button onClick={send}>➤</button></div></div></aside></div>
  </main>;
}

function Person({name,avatar,me}){return <div className="person"><img src={avatar}/><span>{name}{me?" (você)":""}</span><i>●</i></div>}
function ProfileModal({profile,onClose,onLogout,onAdmin}){return <div className="modal"><div className="modalBox profileModal"><button className="close" onClick={onClose}>×</button><img className="profileBig" src={profile.avatar}/><h2>{profile.name}</h2>{profile.role === "Dono" && <div className="owner-badge">♛ DONO</div>}<p className="muted">Perfil protegido por PIN</p>{profile.role === "Dono" && <button className="primary wide" onClick={onAdmin}>⚙️ Painel de administrador</button>}<button className="secondary wide" onClick={onClose}>Fechar</button><button className="dangerBtn wide" onClick={onLogout}>Sair do perfil</button></div></div>}

function AdminPanel({movies,setMovies,onClose}){
  const [title,setTitle]=useState(""); const [genre,setGenre]=useState("Filme"); const [year,setYear]=useState(new Date().getFullYear()); const [duration,setDuration]=useState(""); const [desc,setDesc]=useState("");
  const [posterUrl,setPosterUrl]=useState(""); const [videoUrl,setVideoUrl]=useState(""); const [posterFile,setPosterFile]=useState(null); const [videoFile,setVideoFile]=useState(null); const [busy,setBusy]=useState(false);
  const loginAdmin=async()=>{ const r=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pin:'151226'})}); return r.ok; };
  const upload=async(file,kind)=>{ const fd=new FormData(); fd.append('file',file); fd.append('kind',kind); const r=await fetch('/api/upload',{method:'POST',body:fd}); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Falha no upload'); return d; };
  const add=async()=>{
    if(!title.trim() || (!videoFile && !videoUrl.trim())) return alert('Preencha o nome e envie um vídeo ou informe uma URL de vídeo.');
    setBusy(true);
    try{
      const ok=await loginAdmin(); if(!ok) throw new Error('A sessão de administrador não pôde ser criada.');
      let videoKey=null, posterKey=null;
      if(videoFile) videoKey=(await upload(videoFile,'video')).key;
      if(posterFile) posterKey=(await upload(posterFile,'poster')).key;
      const payload={title:title.trim(),genre,year:Number(year)||new Date().getFullYear(),duration:duration||'—',desc:desc||'Vídeo adicionado pelo administrador.',posterKey,videoKey,posterUrl:posterKey?null:(posterUrl||''),video:videoKey?null:videoUrl.trim()};
      const r=await fetch('/api/movies',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Falha ao salvar');
      const fresh=await fetch('/api/movies').then(x=>x.json()); setMovies(fresh);
      setTitle('');setDuration('');setDesc('');setPosterUrl('');setVideoUrl('');setPosterFile(null);setVideoFile(null); alert('Vídeo publicado para todos os usuários.');
    }catch(e){ alert(e.message); } finally { setBusy(false); }
  };
  const remove=async(id)=>{ if(!confirm('Excluir este vídeo de todos os usuários?')) return; const r=await fetch('/api/movies?id='+encodeURIComponent(id),{method:'DELETE'}); const d=await r.json(); if(!r.ok)return alert(d.error||'Erro ao excluir'); setMovies(movies.filter(m=>m.id!==id)); };
  return <div className="modal"><div className="modalBox adminModal"><button className="close" onClick={onClose}>×</button><span className="tag">ADMINISTRAÇÃO • D1 + R2</span><h2>Painel do dono</h2><p className="muted">Tudo que você publicar aqui fica no catálogo global. Vídeos e capas enviados são armazenados no Cloudflare R2 e os dados dos filmes no D1.</p><div className="adminForm">
    <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nome do filme/vídeo"/>
    <div className="row"><input value={genre} onChange={e=>setGenre(e.target.value)} placeholder="Gênero"/><input value={year} onChange={e=>setYear(e.target.value)} placeholder="Ano"/></div>
    <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duração (ex.: 1h 40min)"/>
    <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Sinopse"></textarea>
    <label className="filePick">🖼️ Capa do filme<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPosterFile(e.target.files?.[0]||null)}/><small>{posterFile?.name || 'ou use uma URL abaixo'}</small></label>
    <input value={posterUrl} onChange={e=>setPosterUrl(e.target.value)} placeholder="URL da capa (opcional)"/>
    <label className="filePick">🎬 Vídeo para R2<input type="file" accept="video/mp4,video/webm,video/ogg" onChange={e=>setVideoFile(e.target.files?.[0]||null)}/><small>{videoFile?.name || 'ou use uma URL direta autorizada'}</small></label>
    <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="URL direta do vídeo (opcional)"/>
    <button className="primary wide" disabled={busy} onClick={add}>{busy?'⏳ Publicando...':'＋ Publicar para todos'}</button>
  </div><div className="adminList"><h3>Catálogo global ({movies.length})</h3>{movies.length===0?<p className="muted">Nenhum vídeo cadastrado.</p>:movies.map(m=><div className="adminItem" key={m.id}><span>{m.title}</span><button className="dangerBtn" onClick={()=>remove(m.id)}>Excluir</button></div>)}</div><p className="adminNote">O upload pelo painel nesta versão aceita arquivos de vídeo de até 2 GB por envio. Para filmes maiores, prefira armazenamento externo/CDN ou um fluxo de upload multipart dedicado.</p></div></div>}

createRoot(document.getElementById("root")).render(<App/>);
