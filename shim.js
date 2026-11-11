/* Penghubung Supabase: meniru claude.use('user'|'db'|'downloads') supaya kode aplikasi tidak berubah. */
(function(){
  const cfg=window.LMS_CONFIG||{};
  /* Perpanjang token tahan banting: server auth kadang membalas 500/502/503/504 (timeout) saat refresh.
     Tanpa ini pustaka menganggap sesi rusak lalu mengeluarkan murid ke halaman login. Di sini refresh diulang
     beberapa kali; kalau tetap gagal, dianggap gangguan jaringan sehingga sesi dipertahankan dan dicoba lagi nanti. */
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function rfetch(url,opts){
    const u=typeof url==='string'?url:(url&&url.url)||'';
    if(!/\/auth\/v1\/token\?grant_type=refresh_token/.test(u))return fetch(url,opts);
    for(let i=0;i<4;i++){
      try{const r=await fetch(url,opts);if(r.status<500)return r}catch(e){if(e&&e.name==='AbortError')throw e}
      if(i<3)await sleep(700*Math.pow(2,i));
    }
    throw new TypeError('Failed to fetch');
  }
  let manualOut=false;
  const sb=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},global:{fetch:rfetch}});
  const css='position:fixed;inset:0;z-index:9999;display:flex;padding:max(76px,env(safe-area-inset-top)) 16px max(20px,env(safe-area-inset-bottom));overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:radial-gradient(120% 60% at 50% 115%,#58cc02 0 38%,transparent 38.5%),linear-gradient(#7fdcff,#3fbcff 55%,#1cb0f6);color:#2b2a3d;font-family:Nunito,var(--f-ui,system-ui,sans-serif)';
  let session=null,teacher=false,member=false,ready=null;
  function overlay(html){let d=document.getElementById('lms-login');if(!d){d=document.createElement('div');d.id='lms-login';d.setAttribute('style',css);document.body.appendChild(d)}d.innerHTML=html;d.hidden=false}
  function hideOverlay(){const d=document.getElementById('lms-login');if(d)d.remove()}
  const card=(inner)=>`<style>@keyframes lgfl{to{transform:translateY(110vh) rotate(360deg)}}#lms-login i.pt{position:absolute;top:-20px;width:10px;height:7px;border-radius:50%;background:#ffb7cf;animation:lgfl linear infinite}@media(prefers-reduced-motion:reduce){#lms-login i.pt{display:none}}@media(max-height:520px){#lms-login{padding-top:16px!important}#lms-login svg,#ls-ph{display:none!important}#lms-login h1{font-size:22px!important}}#lms-login button{touch-action:manipulation;-webkit-tap-highlight-color:transparent;min-height:48px}#lms-g{transition:transform .12s}#lms-g:active{transform:translateY(3px);box-shadow:0 1px 0 #2b2a3d!important}</style>${[8,22,37,51,66,79,91].map((x,i)=>`<i class="pt" style="left:${x}%;animation-duration:${7+i%3*2}s;animation-delay:-${i*1.3}s"></i>`).join('')}<div style="position:relative;margin:auto;max-width:380px;width:100%;flex:none;background:#fffdf6;border:3px solid #2b2a3d;border-radius:26px;padding:30px 24px 24px;box-shadow:0 8px 0 #2b2a3d,0 24px 50px rgba(0,0,0,.2);text-align:center"><svg viewBox="0 0 120 80" width="120" height="80" aria-hidden="true" style="display:block;margin:-62px auto 4px"><rect x="22" y="22" width="9" height="56" rx="3" fill="#e8392f"/><rect x="89" y="22" width="9" height="56" rx="3" fill="#e8392f"/><rect x="6" y="8" width="108" height="10" rx="5" fill="#2b2a3d"/><rect x="12" y="16" width="96" height="8" rx="3" fill="#e8392f"/><rect x="16" y="30" width="88" height="6" rx="3" fill="#b8281f"/><rect x="50" y="18" width="20" height="14" rx="2" fill="#fff3dc" stroke="#2b2a3d" stroke-width="2"/><text x="60" y="29" text-anchor="middle" font-size="10" font-weight="900" fill="#2b2a3d">学</text></svg><h1 style="margin:0;font:700 26px Fredoka,Nunito,sans-serif">Dunia Akimichi</h1><div style="font-weight:800;color:#6b6880;margin:2px 0 14px">Ruang Belajar JFT · Tora 先生 menunggumu</div>${inner}</div>`;

  const inApp=()=>{const u=navigator.userAgent||'';return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|Snapchat|Twitter|; wv\)|GSA\//i.test(u)||(/iPhone|iPad/.test(u)&&!/Safari\//.test(u)&&/AppleWebKit/.test(u))};
  function loadingScreen(){overlay(card('<p style="margin:0 0 6px;font-weight:800">Memuat…</p><p id="lg-slow" style="margin:0;color:#6b6880;font-size:14px"></p>'));return setTimeout(()=>{const e=document.getElementById('lg-slow');if(e)e.innerHTML='Koneksi lambat. <button id="lg-retry" style="margin-top:12px;width:100%;padding:12px;border:3px solid #2b2a3d;border-radius:14px;background:#1cb0f6;color:#fff;font:900 15px Nunito,sans-serif">Coba lagi</button>';const b=document.getElementById('lg-retry');if(b)b.onclick=()=>location.reload()},8000)}
  function retryScreen(msg){overlay(card('<p style="margin:0 0 14px;color:#56607a">'+(msg||'Koneksi bermasalah. Cek sinyal lalu coba lagi.')+'</p><button id="lg-retry" style="width:100%;padding:14px;border:3px solid #2b2a3d;border-radius:16px;background:#1cb0f6;color:#fff;font:900 16px Nunito,sans-serif;cursor:pointer;box-shadow:0 5px 0 #2b2a3d">Coba lagi</button>'));document.getElementById('lg-retry').onclick=()=>location.reload()}
  function landScreen(next){
    let done=false;try{done=sessionStorage.getItem('lms:land')==='1'||localStorage.getItem('lms:land')==='1'}catch(e){}
    if(done){next();return}
    overlay(card(`<style>@keyframes lsrot{0%,25%{transform:rotate(0)}55%,100%{transform:rotate(-90deg)}}#ls-ph{width:54px;height:92px;border:5px solid #2b2a3d;border-radius:12px;margin:6px auto 14px;position:relative;background:#7fdcff;animation:lsrot 2.4s ease-in-out infinite alternate}#ls-ph::after{content:"";position:absolute;left:50%;bottom:4px;width:12px;height:4px;margin-left:-6px;border-radius:4px;background:#2b2a3d}@media(prefers-reduced-motion:reduce){#ls-ph{animation:none;transform:rotate(-90deg)}}</style>
      <div id="ls-ph" aria-hidden="true"></div>
      <p style="margin:0 0 10px;font-weight:800">Biar main di Dunia Akimichi makin enak:</p>
      <ul style="text-align:left;margin:0 0 14px;padding-left:20px;color:#57546b;line-height:1.5">
        <li><b>HP:</b> putar ke mode <b>landscape (miring)</b>, lalu tekan tombol ⛶ untuk layar penuh.</li>
        <li><b>Laptop:</b> jalan pakai <b>WASD</b> atau panah, ⛶ untuk layar penuh.</li>
        <li>Nyalakan suara 🔊 biar musik dan efeknya kerasa.</li></ul>
      <div id="ls-st" style="font-weight:800;margin:0 0 12px"></div>
      <button id="ls-go" style="width:100%;padding:14px;border:3px solid #2b2a3d;border-radius:16px;background:#1cb0f6;color:#fff;font:900 16px Nunito,sans-serif;cursor:pointer;box-shadow:0 5px 0 #2b2a3d">Oke, lanjut masuk</button>`));
    const st=()=>{const e=document.getElementById('ls-st');if(!e)return;const L=matchMedia('(orientation:landscape)').matches;e.textContent=L?'✅ Sudah landscape. Mantap!':'↻ Sekarang masih potret';e.style.color=L?'#46a302':'#c27c00'};
    st();addEventListener('resize',st);
    document.getElementById('ls-go').onclick=()=>{try{sessionStorage.setItem('lms:land','1');localStorage.setItem('lms:land','1')}catch(e){}removeEventListener('resize',st);next()};
  }
  function loginScreen(msg){
    const ua=inApp();let qe='';try{const h=new URLSearchParams((location.hash||'').replace(/^#/,'')+'&'+(location.search||'').replace(/^\?/,''));if(h.get('error_description')||h.get('error'))qe=(h.get('error_description')||h.get('error')).replace(/[<>&]/g,'')}catch(e){}
    overlay(card((ua?'<div style="text-align:left;background:#fff3cd;border:2px solid #2b2a3d;border-radius:14px;padding:10px 12px;margin:0 0 14px;font-size:14px;line-height:1.45"><b>Buka lewat Chrome / Safari ya.</b> Google menolak login dari browser di dalam aplikasi (WhatsApp, Instagram, dll). Salin tautan, lalu tempel di Chrome atau Safari.<button id="lms-cp" style="margin-top:8px;width:100%;padding:10px;border:2px solid #2b2a3d;border-radius:12px;background:#fff;font:800 14px Nunito,sans-serif">Salin tautan</button></div>':'')+(qe?'<p style="color:#b3261e;font-weight:700;margin:0 0 10px;font-size:14px">Login belum berhasil: '+qe+'. Coba lagi.</p>':'')+'<p style="color:var(--muted,#56607a);margin:0 0 18px">'+(msg||'Masuk dengan akun Google yang kamu berikan ke guru. Dengan masuk, kamu setuju namamu dan hasil latihanmu disimpan dan dilihat gurumu untuk memantau belajar.')+'</p><button id="lms-g" style="width:100%;padding:14px;border:3px solid #2b2a3d;border-radius:16px;background:#58cc02;color:#fff;font:900 16px Nunito,sans-serif;cursor:pointer;box-shadow:0 5px 0 #2b2a3d">Masuk dengan Google</button>'));
    const cp=document.getElementById('lms-cp');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);cp.textContent='Tersalin. Tempel di Chrome/Safari'}catch(e){cp.textContent=location.origin+location.pathname}};
    const g=document.getElementById('lms-g');
    g.onclick=async()=>{g.disabled=true;g.textContent='Menghubungkan…';try{const r=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});if(r&&r.error)throw r.error}catch(e){g.disabled=false;g.textContent='Masuk dengan Google';const p=g.previousElementSibling;if(p)p.insertAdjacentHTML('afterend','<p style="color:#b3261e;font-weight:700;margin:0 0 10px;font-size:14px">Gagal menghubungi Google. Cek sinyal lalu tekan lagi.</p>')}setTimeout(()=>{if(g.disabled){g.disabled=false;g.textContent='Masuk dengan Google'}},8000)};
  }
  function deniedScreen(email){
    overlay(card(`<p style="color:var(--muted,#56607a);margin:0 0 6px">Email <b>${(email||'').replace(/[<>&]/g,'')}</b> belum terdaftar di kelas ini.</p><p style="color:var(--muted,#56607a);margin:0 0 18px;font-size:14px">Hubungi guru untuk mendaftarkan emailmu, atau masuk dengan akun Google yang lain.</p><button id="lms-out" style="width:100%;padding:14px;border:0;border-radius:14px;background:var(--accent,#2c4fb8);color:#fff;font:700 16px inherit;cursor:pointer">Ganti akun</button>`));
    document.getElementById('lms-out').onclick=async()=>{manualOut=true;await sb.auth.signOut();location.reload()};
  }
  async function boot(){
    const lt=loadingScreen();
    let data=null;try{const r=await sb.auth.getSession();data=r&&r.data}catch(e){clearTimeout(lt);retryScreen();return null}
    clearTimeout(lt);session=data&&data.session;
    if(!session){landScreen(()=>loginScreen());return null}
    const ck='lms:member:'+session.user.id;let cached=false;try{cached=localStorage.getItem(ck)==='1'}catch(e){}
    try{
      let r=await sb.rpc('is_member');if(r.error)throw r.error;member=r.data===true;
      if(!member){/* jangan langsung menolak: token bisa sedang diperbarui. Periksa ulang setelah token pasti segar. */
        await sleep(1200);try{await sb.auth.refreshSession()}catch(e){}
        const g=await sb.auth.getUser();
        if(g.error&&!/fetch|network/i.test(String(g.error.message||''))){session=null;landScreen(()=>loginScreen('Sesimu habis. Masuk lagi sekali ya, datamu aman.'));return null}
        r=await sb.rpc('is_member');if(r.error)throw r.error;member=r.data===true;
        if(!member&&cached&&g.error)throw g.error}
      const t=await sb.rpc('is_teacher');teacher=t.data===true;
    }catch(e){retryScreen('Belum bisa memeriksa akunmu. Cek sinyal lalu coba lagi.');return null}
    if(!member){try{localStorage.removeItem(ck)}catch(e){}deniedScreen(session.user.email);return null}
    try{localStorage.setItem(ck,'1')}catch(e){}
    hideOverlay();
    try{if(!localStorage.getItem('lms:consent'))localStorage.setItem('lms:consent',String(Date.now()))}catch(e){}
    const u=session.user,m=u.user_metadata||{};
    try{await sb.from('profiles').upsert({id:u.id,email:u.email,name:m.full_name||m.name||u.email,avatar_url:m.avatar_url||m.picture||null,updated_at:new Date().toISOString()})}catch(e){}
    return session;
  }
  const getReady=()=>ready||(ready=boot());
  /* Kalau sesi benar-benar hilang di tengah pemakaian (bukan karena murid keluar sendiri), jangan diam-diam lanjut sebagai tamu:
     coba pulihkan dulu, kalau gagal tampilkan layar masuk dengan penjelasan jelas. */
  let outTimer=null;
  sb.auth.onAuthStateChange((ev,ses)=>{
    if(ev==='SIGNED_OUT'){ready=null;if(manualOut)return;clearTimeout(outTimer);
      outTimer=setTimeout(async()=>{try{const r=await sb.auth.getSession();if(r&&r.data&&r.data.session){ready=null;return}}catch(e){return}
        session=null;landScreen(()=>loginScreen('Sesimu terputus (biasanya karena sinyal). Masuk lagi sekali ya, hasil belajarmu aman tersimpan.'))},2500)}
    else if(ev==='SIGNED_IN'||ev==='TOKEN_REFRESHED'){clearTimeout(outTimer);if(ses)session=ses}
  });
  /* Saat tab kembali aktif atau internet pulih, segarkan token lebih dulu supaya tidak kedaluwarsa saat tab tertidur */
  const wake=()=>{if(!document.hidden&&navigator.onLine!==false)sb.auth.getSession().catch(()=>{})};
  document.addEventListener('visibilitychange',wake);addEventListener('online',wake);
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
    setInterval(()=>{if(!document.hidden)[...listeners].forEach(run)},15000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)[...listeners].forEach(run)});
  }
  let syncing=false;
  const dbApi=async()=>{const s=await getReady();if(!s)return null;if(!syncing){syncing=true;startSync()}return {doc:docRef,collection:colRef,tree:treeRef}};
  /* ---- downloads ---- */
  const dlApi={async save({filename,data}){const b=data instanceof Blob?data:new Blob([data],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}};
  window.claude={async use(n){if(n==='user'){await getReady();return userApi()}if(n==='db')return dbApi();if(n==='downloads')return dlApi;return null}};
  /* ---- lobi realtime (Supabase Realtime presence + broadcast; tidak menyimpan apa pun ke database) ---- */
  window.lmsRT=(function(){let ch=null,me=null,H={};return {
    async join(meta,h){const s=await getReady();if(!s)return null;me=s.user.id;H=h||{};if(ch)return me;
      try{ch=sb.channel('lobi-akimichi',{config:{presence:{key:me},broadcast:{self:false}}});
        ch.on('presence',{event:'sync'},()=>{try{H.sync&&H.sync(ch.presenceState())}catch(e){}});
        ch.on('broadcast',{event:'m'},m=>{try{H.msg&&H.msg(m.payload||{})}catch(e){}});
        ch.subscribe(st=>{if(st==='SUBSCRIBED'){try{ch.track(Object.assign({id:me},meta||{}))}catch(e){}H.up&&H.up(true)}else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'||st==='CLOSED'){H.up&&H.up(false)}})}catch(e){ch=null;return null}
      return me},
    track(m){try{if(ch)ch.track(Object.assign({id:me},m))}catch(e){}},
    send(p){try{if(ch)ch.send({type:'broadcast',event:'m',payload:Object.assign({from:me},p)})}catch(e){}},
    leave(){try{if(ch)sb.removeChannel(ch)}catch(e){}ch=null},
    id:()=>me}})();
  window.lmsHosted=true;window.lmsLogout=async()=>{manualOut=true;await sb.auth.signOut();location.reload()};
})();
