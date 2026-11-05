/* Penghubung Supabase: meniru claude.use('user'|'db'|'downloads') supaya kode aplikasi tidak berubah. */
(function(){
  const cfg=window.LMS_CONFIG||{};
  const sb=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const css='position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:var(--bg,#edf0f8);color:var(--ink,#131a33);font-family:var(--f-ui,system-ui,sans-serif)';
  let session=null,teacher=false,member=false,ready=null;
  function overlay(html){let d=document.getElementById('lms-login');if(!d){d=document.createElement('div');d.id='lms-login';d.setAttribute('style',css);document.body.appendChild(d)}d.innerHTML=html;d.hidden=false}
  function hideOverlay(){const d=document.getElementById('lms-login');if(d)d.remove()}
  const card=(inner)=>`<div style="max-width:380px;width:100%;background:var(--card,#fff);border-radius:24px;padding:28px 24px;box-shadow:0 20px 50px rgba(0,0,0,.18);text-align:center"><div style="font-size:44px;margin-bottom:6px">学</div><h1 style="margin:0 0 6px;font-size:22px">Ruang Belajar JFT</h1>${inner}</div>`;
  function loginScreen(msg){
    overlay(card(`<p style="color:var(--muted,#56607a);margin:0 0 18px">${msg||'Masuk dengan akun Google yang kamu berikan ke guru. Dengan masuk, kamu setuju namamu dan hasil latihanmu disimpan dan dilihat gurumu untuk memantau belajar.'}</p><button id="lms-g" style="width:100%;padding:14px;border:0;border-radius:14px;background:var(--accent,#2c4fb8);color:#fff;font:700 16px inherit;cursor:pointer">Masuk dengan Google</button>`));
    document.getElementById('lms-g').onclick=()=>sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});
  }
  function deniedScreen(email){
    overlay(card(`<p style="color:var(--muted,#56607a);margin:0 0 6px">Email <b>${(email||'').replace(/[<>&]/g,'')}</b> belum terdaftar di kelas ini.</p><p style="color:var(--muted,#56607a);margin:0 0 18px;font-size:14px">Hubungi guru untuk mendaftarkan emailmu, atau masuk dengan akun Google yang lain.</p><button id="lms-out" style="width:100%;padding:14px;border:0;border-radius:14px;background:var(--accent,#2c4fb8);color:#fff;font:700 16px inherit;cursor:pointer">Ganti akun</button>`));
    document.getElementById('lms-out').onclick=async()=>{await sb.auth.signOut();location.reload()};
  }
  async function boot(){
    const {data}=await sb.auth.getSession();session=data&&data.session;
    if(!session){loginScreen();return null}
    try{const r=await sb.rpc('is_member');member=r.data===true;const t=await sb.rpc('is_teacher');teacher=t.data===true}catch(e){member=false}
    if(!member){deniedScreen(session.user.email);return null}
    hideOverlay();
    try{if(!localStorage.getItem('lms:consent'))localStorage.setItem('lms:consent',String(Date.now()))}catch(e){}
    const u=session.user,m=u.user_metadata||{};
    try{await sb.from('profiles').upsert({id:u.id,email:u.email,name:m.full_name||m.name||u.email,avatar_url:m.avatar_url||m.picture||null,updated_at:new Date().toISOString()})}catch(e){}
    return session;
  }
  const getReady=()=>ready||(ready=boot());
  sb.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_OUT'){ready=null}});
  /* ---- user ---- */
  const userApi=()=>({
    async me(){const s=await getReady();if(!s)return {id:null,name:'',avatarUrl:'',isOwner:false,canEdit:false};const u=s.user,m=u.user_metadata||{};return {id:u.id,name:m.full_name||m.name||u.email,email:u.email,avatarUrl:m.avatar_url||m.picture||'',isOwner:teacher,canEdit:teacher}},
    isOwner:()=>teacher,
    canEdit:()=>teacher,
    async can(n){const s=await getReady();return s&&member?true:null},
    async id(){const s=await getReady();return s?s.user.id:null},
    async profiles(ids){const out={};if(!teacher||!ids||!ids.length)return out;try{const r=await sb.from('profiles').select('id,email,name,avatar_url').in('id',ids.filter(x=>/^[0-9a-f-]{36}$/.test(x)));(r.data||[]).forEach(p=>{out[p.id]={id:p.id,name:p.name||p.email||'',email:p.email,avatarUrl:p.avatar_url||''}})}catch(e){}return out}
  });
  /* ---- db ---- */
  const listeners=new Set();
  const segs=p=>p.split('/').filter(Boolean).length;
  async function fetchDoc(path){const r=await sb.from('docs').select('data').eq('path',path).maybeSingle();if(r.error)throw r.error;return r.data?r.data.data:null}
  async function fetchCol(col){const r=await sb.from('docs').select('path,data').like('path',col+'/%');if(r.error)throw r.error;return (r.data||[]).filter(x=>segs(x.path)===segs(col)+1).map(x=>({id:x.path.slice(col.length+1),data:()=>x.data}))}
  async function fetchTree(prefix){const r=await sb.from('docs').select('path,data').like('path',prefix+'/%').limit(5000);if(r.error)throw r.error;return (r.data||[]).map(x=>({id:x.path.slice(prefix.length+1),data:()=>x.data}))}
  function treeRef(prefix){return {onSnapshot(cb,err){const l={kind:'tree',path:prefix,cb,err,last:undefined};listeners.add(l);run(l);return()=>listeners.delete(l)}}}
  function docRef(path){return {
    async get(){const d=await fetchDoc(path);return {exists:d!==null,data:()=>d}},
    async set(d){const r=await sb.from('docs').upsert({path,data:d,updated_at:new Date().toISOString()});if(r.error)throw r.error;notify(path)},
    async delete(){const r=await sb.from('docs').delete().eq('path',path);if(r.error)throw r.error;notify(path)},
    onSnapshot(cb,err){const l={kind:'doc',path,cb,err,last:undefined};listeners.add(l);run(l);return()=>listeners.delete(l)}
  }}
  function colRef(col){return {onSnapshot(cb,err){const l={kind:'col',path:col,cb,err,last:undefined};listeners.add(l);run(l);return()=>listeners.delete(l)}}}
  async function run(l){
    try{
      if(l.kind==='doc'){const d=await fetchDoc(l.path);const k=JSON.stringify(d);if(k===l.last)return;l.last=k;l.cb({exists:d!==null,data:()=>d})}
      else if(l.kind==='tree'){const docs=await fetchTree(l.path);const k=JSON.stringify(docs.map(x=>[x.id,x.data()]));if(k===l.last)return;l.last=k;l.cb({docs})}
      else{const docs=await fetchCol(l.path);const k=JSON.stringify(docs.map(x=>[x.id,x.data()]));if(k===l.last)return;l.last=k;l.cb({docs})}
    }catch(e){if(l.err)try{l.err(e)}catch(_){}}
  }
  const timers={};
  function notify(path){[...listeners].forEach(l=>{if(path===l.path||path.startsWith(l.path+'/')||l.path.startsWith(path))run(l)})}
  function startSync(){
    try{sb.channel('docs-sync').on('postgres_changes',{event:'*',schema:'public',table:'docs'},p=>{const path=(p.new&&p.new.path)||(p.old&&p.old.path);if(path)notify(path)}).subscribe()}catch(e){}
    setInterval(()=>{if(!document.hidden)[...listeners].forEach(run)},8000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)[...listeners].forEach(run)});
  }
  let syncing=false;
  const dbApi=async()=>{const s=await getReady();if(!s)return null;if(!syncing){syncing=true;startSync()}return {doc:docRef,collection:colRef,tree:treeRef}};
  /* ---- downloads ---- */
  const dlApi={async save({filename,data}){const b=data instanceof Blob?data:new Blob([data],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}};
  window.claude={async use(n){if(n==='user'){await getReady();return userApi()}if(n==='db')return dbApi();if(n==='downloads')return dlApi;return null}};
  window.lmsHosted=true;window.lmsLogout=async()=>{await sb.auth.signOut();location.reload()};
})();
