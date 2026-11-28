/* Service worker Ruang Belajar JFT (v111).
   - Notifikasi pengingat (seperti sebelumnya).
   - Halaman utama: jaringan dulu (murid selalu dapat versi terbaru), cadangan dari cache bila offline.
   - Font, gambar, ikon: cache-first supaya aplikasi cepat dibuka.
   - Tidak pernah menyimpan permintaan non-GET, API, atau data murid: nilai selalu langsung dari server. */
const V='akimichi-v113';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.add('./')).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  let u;try{u=new URL(r.url)}catch(_){return}
  if(u.origin!==self.location.origin)return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put('./',cp)).catch(()=>{})}return res}).catch(()=>caches.match('./').then(m=>m||new Response('Kamu sedang offline. Sambungkan internet lalu buka lagi.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}))));
    return}
  if(/\/(fonts|img)\//.test(u.pathname)||/\/icon-[a-z0-9-]+\.png$/.test(u.pathname)||/apple-touch-icon\.png$/.test(u.pathname)){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp)).catch(()=>{})}return res})))}
});
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(_){d={body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Sensei Akimichi',{body:d.body||'Misi harianmu belum beres!',icon:'icon-192.png',badge:'icon-192.png',tag:'misi-harian',renotify:true,data:{url:d.url||'./#harian'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'./#harian';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c){try{c.navigate(url)}catch(_){}return c.focus()}}return self.clients.openWindow(url)}));
});
