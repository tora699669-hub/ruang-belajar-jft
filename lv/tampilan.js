// Tampilan dunia sebagai HTML (fungsi murni: keadaan masuk, teks HTML keluar).
// Lapisan ini juga menjadi fallback 2D: semua zona, pintu, dan panel bisa dipakai tanpa 3D.
// Semua teks yang berasal dari data dilewatkan ke esc().
import { ZONA, NPC, URUTAN_PETA, zonaDari } from './zona.js';
import { KATEGORI, NAMA_RARITY, RARITY } from './katalog.js';
import { tingkat } from './kekuatan.js';
import { LAWAN } from './duel.js';
import { FASE } from './waktu.js';

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rb = (n) => Number(n || 0).toLocaleString('id-ID');

export const CSS = `
#lv-akar{--latar:#f6f0e6;--panel:#fbf7f0;--kartu:#ffffff;--teks:#2a2320;--redup:#5f554d;--garis:#d8cdbf;--aktif:#b8322a;--aktif-teks:#fff;--fokus:#1d5fd1;--baik:#1f7a45;--kurang:#a3541a;--lemah:#b3261e;
 position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:var(--latar);color:var(--teks);
 font:15px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans","Noto Sans JP",sans-serif;-webkit-text-size-adjust:100%;overflow:hidden}
@media (prefers-color-scheme:dark){#lv-akar{--latar:#141216;--panel:#1d1a1f;--kartu:#2a262d;--teks:#f3ede6;--redup:#bdb2a8;--garis:#4a434c;--aktif:#f28b80;--aktif-teks:#1d0f0e;--fokus:#8ab4ff;--baik:#7fd6a0;--kurang:#f0b27a;--lemah:#ff9d94}}
#lv-akar.besar{font-size:17.5px}
#lv-akar *{box-sizing:border-box}
#lv-akar button{font:inherit;font-weight:650;min-height:44px;min-width:44px;padding:6px 10px;border-radius:12px;border:1.5px solid var(--garis);background:var(--kartu);color:var(--teks);cursor:pointer;line-height:1.2;text-align:center}
#lv-akar button[aria-pressed="true"],#lv-akar button.utama{background:var(--aktif);border-color:var(--aktif);color:var(--aktif-teks)}
#lv-akar button:focus-visible{outline:3px solid var(--fokus);outline-offset:2px}
#lv-akar button[aria-disabled="true"]{opacity:.72}
.lv-pentas{position:relative;flex:1 1 auto;min-height:190px;overflow:hidden;background:#0d1226}
.lv-pentas canvas{display:block;width:100%;height:100%;touch-action:manipulation}
.lv-dua{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#fff;padding:56px 16px 16px}
.lv-dua b{display:block;font-size:84px;line-height:1;font-weight:700;text-shadow:0 2px 10px rgba(0,0,0,.45)}
.lv-dua span{display:inline-block;margin-top:10px;background:rgba(16,14,20,.78);border-radius:10px;padding:6px 12px;font-size:.93em}
.lv-hud{position:absolute;inset:6px 6px auto 6px;display:flex;gap:6px;align-items:flex-start;justify-content:space-between;pointer-events:none}
.lv-hud>*{pointer-events:auto}
.lv-pil{background:rgba(16,14,20,.78);color:#fff;border-radius:10px;padding:5px 9px;font-size:.78em;line-height:1.25;min-width:0}
.lv-pil.lv-dompet{flex:0 0 auto;text-align:right}
.lv-pil b{font-size:1.05em}
.lv-hud .lv-kiri{display:flex;gap:6px;align-items:flex-start;min-width:0}
#lv-akar .lv-keluar{background:rgba(16,14,20,.78);color:#fff;border-color:transparent;padding:4px 10px;font-size:.87em;white-space:nowrap;flex:0 0 auto}
.lv-xp{display:block;width:100%;min-width:92px;height:6px;border-radius:4px;background:rgba(255,255,255,.28);margin-top:4px;overflow:hidden}
.lv-xp i{display:block;height:100%;background:#ffd166}
.lv-toast{position:absolute;left:50%;top:64px;transform:translateX(-50%);max-width:90%;text-align:center;background:rgba(16,14,20,.88);color:#fff;border-radius:14px;padding:9px 14px;font-weight:700;opacity:0;transition:opacity .25s;pointer-events:none}
.lv-toast.tampil{opacity:1}
.lv-toast small{display:block;font-weight:500;font-size:.8em}
.lv-lembar{flex:0 0 auto;max-height:58%;overflow:auto;background:var(--panel);border-top:1px solid var(--garis);padding:10px 12px calc(8px + env(safe-area-inset-bottom));display:grid;gap:9px}
.lv-npc{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;background:var(--kartu);border:1.5px solid var(--garis);border-radius:14px;padding:8px 10px}
.lv-npc b{font-size:.87em;color:var(--aktif)}
.lv-npc p{margin:2px 0 0}
.lv-judul{margin:0;font-size:.8em;font-weight:700;color:var(--redup)}
.lv-pintu{display:grid;grid-template-columns:1fr 1fr;gap:7px}
#lv-akar .lv-pintu button{display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:center;text-align:left;padding:6px 10px}
.lv-pintu button i{font-style:normal;font-size:1.35em;font-weight:700;color:var(--aktif);min-width:1.2em;text-align:center}
.lv-pintu button[aria-disabled="true"] i{color:var(--redup)}
.lv-pintu button:only-child,.lv-pintu button:last-child:nth-child(odd){grid-column:1/-1}
.lv-nav{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:7px}
.lv-panel{position:absolute;inset:0;z-index:5;background:var(--latar);display:flex;flex-direction:column}
.lv-panel[hidden]{display:none}
.lv-panel header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid var(--garis);background:var(--panel)}
.lv-panel h2{margin:0;font-size:1.13em}
.lv-isi{flex:1;overflow:auto;padding:12px;display:grid;gap:10px;align-content:start;grid-auto-rows:max-content}
.lv-kartu{background:var(--kartu);border:1.5px solid var(--garis);border-radius:14px;padding:10px 12px}
.lv-kartu h3{margin:0 0 2px;font-size:1em}
.lv-kartu p{margin:2px 0;color:var(--redup);font-size:.9em}
.lv-kartu .lv-hadiah{color:var(--teks)}
.lv-cap{display:inline-block;border-radius:999px;padding:2px 9px;font-size:.78em;font-weight:700;border:1.5px solid currentColor}
.lv-cap.baik{color:var(--baik)}.lv-cap.kurang{color:var(--kurang)}.lv-cap.lemah{color:var(--lemah)}.lv-cap.netral{color:var(--redup)}
.lv-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#lv-akar .lv-zona{display:grid;gap:2px;text-align:left;padding:8px 10px}
.lv-zona i{font-style:normal;font-size:1.5em;font-weight:700;color:var(--aktif);line-height:1}
#lv-akar .lv-zona[aria-current="true"]{border-color:var(--aktif);border-width:2.5px}
.lv-zona small{color:var(--redup);font-weight:500;font-size:.8em}
.lv-batang{height:12px;border-radius:7px;background:var(--garis);overflow:hidden;margin:6px 0 2px}
.lv-batang i{display:block;height:100%;background:var(--aktif)}
.lv-baris{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
.lv-chip{display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding-bottom:2px;min-height:48px;flex:0 0 auto}
#lv-akar .lv-chip button{flex:0 0 auto;min-height:44px;padding:4px 12px;border-radius:999px;font-size:.87em}
.lv-lencana{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.lv-lencana div{border:1.5px solid var(--garis);border-radius:12px;padding:8px 6px;text-align:center;background:var(--kartu);font-size:.8em}
.lv-lencana div i{display:block;font-style:normal;font-size:1.9em;font-weight:700;color:var(--aktif)}
.lv-lencana div.belum{opacity:.55}.lv-lencana div.belum i{color:var(--redup)}
.lv-duel{display:grid;gap:10px}
.lv-hp{display:flex;justify-content:space-between;gap:10px;font-weight:700;font-size:.9em}
.lv-soal{text-align:center;font-size:2em;font-weight:700;padding:14px 8px;background:var(--kartu);border:1.5px solid var(--garis);border-radius:14px}
.lv-soal small{display:block;font-size:.45em;font-weight:500;color:var(--redup)}
#lv-akar .lv-opsi button.benar{border-color:var(--baik);border-width:2.5px}
#lv-akar .lv-opsi button.salah{border-color:var(--lemah);border-width:2.5px}
.lv-saklar{display:flex;justify-content:space-between;align-items:center;gap:10px}
.lv-saklar>div{min-width:0;flex:1 1 auto}
#lv-akar .lv-saklar>button{flex:0 0 auto;min-width:64px}
.lv-chip.bungkus{flex-wrap:wrap;overflow:visible}
.lv-catatan{font-size:.82em;color:var(--redup);margin:0}
#lv-kembali{position:fixed;left:10px;bottom:132px;z-index:2147482000;min-height:44px;padding:6px 14px;border-radius:999px;border:0;background:#b8322a;color:#fff;font:700 14px system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3);cursor:pointer}
#lv-kembali[hidden]{display:none}
@media (prefers-reduced-motion:reduce){.lv-toast{transition:none}}
@media (min-width:760px){#lv-akar{flex-direction:row}.lv-lembar{flex:0 0 380px;max-height:none;border-top:0;border-left:1px solid var(--garis);align-content:start}}
`;

export function hud(k) {
  const s = k.snap, lv = s.lv, pj = Math.max(1, lv.next - lv.base), isi = Math.max(0, Math.min(100, Math.round(((s.xp - lv.base) / pj) * 100)));
  const z = zonaDari(k.zona);
  return `<div class="lv-kiri"><button type="button" class="lv-keluar" data-lv="keluar" aria-label="Keluar dari dunia, kembali ke beranda">✕ Keluar</button>
<div class="lv-pil"><b>${esc(z.kanji)} ${esc(z.nama)}</b><br><span id="lv-chip">${esc(k.chip)}</span></div></div>
<div class="lv-pil lv-dompet" aria-label="Level ${lv.L}, ${rb(s.xp)} EXP, ${rb(s.koin)} Koin, ${rb(s.permata)} Permata"><b>Lv ${lv.L}</b> · ${rb(s.xp)} EXP<br>${rb(s.koin)} Koin · ${rb(s.permata)} Permata<span class="lv-xp" aria-hidden="true"><i style="width:${isi}%"></i></span></div>`;
}

export function duaD(k) {
  const z = zonaDari(k.zona);
  return `<div class="lv-dua"><div><b aria-hidden="true">${esc(z.kanji)}</b><span>${esc(z.ringkas)}</span></div></div>`;
}

export function lembar(k) {
  const z = zonaDari(k.zona);
  const id = z.npc[k.npcKe % Math.max(1, z.npc.length)], n = id ? NPC[id] : null;
  const baris = n ? n.sapa[k.barisKe % n.sapa.length] : z.ringkas;
  const npc = `<div class="lv-npc" role="group" aria-label="Sapaan"><div><b>${esc(n ? n.nama : z.nama)}</b><p id="lv-sapa">${esc(baris)}</p></div>${n ? '<button type="button" data-lv="sapa" aria-label="Sapaan berikutnya">Lanjut</button>' : ''}</div>`;
  const pintu = z.pintu.map((p, i) => `<button type="button" data-lv="pintu" data-i="${i}"${p.terkunci ? ' aria-disabled="true"' : ''}><i aria-hidden="true">${esc(p.ikon || '門')}</i><span>${esc(p.label)}</span></button>`).join('');
  return `${npc}<p class="lv-judul" id="lv-jp">Di zona ini</p><div class="lv-pintu" role="group" aria-labelledby="lv-jp">${pintu}</div>
<nav class="lv-nav" aria-label="Menu dunia"><button type="button" data-lv="panel" data-p="peta">Peta</button><button type="button" data-lv="panel" data-p="quest">Quest${k.questSisa ? ' (' + k.questSisa + ')' : ''}</button><button type="button" data-lv="panel" data-p="setelan">Setelan</button></nav>`;
}

const JUDUL = { peta: 'Peta Kota Akimichi', quest: 'Papan Quest', setelan: 'Setelan', kekuatan: 'Peta Kekuatan', lencana: 'Lencanaku', katalog: 'Katalog Toko', boss: 'Gerbang Boss', lantai: 'Lantai Menara', kartu: 'Kartu Koleksi', bab: 'Jalur Bab', duel: 'Duel' };
export const judulPanel = (p) => JUDUL[p] || '';

function pPeta(k) {
  return `<div class="lv-grid2">${URUTAN_PETA.map((id) => { const z = zonaDari(id); return `<button type="button" class="lv-zona" data-lv="zona" data-z="${id}"${id === k.zona ? ' aria-current="true"' : ''}><i aria-hidden="true">${esc(z.kanji)}</i><span>${esc(z.nama)}</span><small>${esc(z.ringkas)}</small></button>`; }).join('')}</div>`;
}

function kartuQuest(q) {
  const cap = q.selesai ? '<span class="lv-cap baik">Selesai</span>' : q.kemajuan ? `<span class="lv-cap netral">${esc(q.kemajuan)}</span>` : '<span class="lv-cap netral">Belum</span>';
  return `<div class="lv-kartu"><div class="lv-baris"><h3>${esc(q.judul)}</h3>${cap}</div><p>${esc(q.tujuan)}</p><p class="lv-hadiah"><b>Hadiah:</b> ${esc(q.hadiah)}</p></div>`;
}
function pQuest(k) {
  const g = (j) => k.quest.filter((q) => q.jenis === j);
  const bagian = (judul, isi, tombol) => `<p class="lv-judul">${judul}</p>${isi.length ? isi.map(kartuQuest).join('') : '<p class="lv-catatan">Belum ada data. Buka aplikasi sebentar lalu kembali ke sini.</p>'}${tombol}`;
  return bagian('Quest harian dari Cha Cha Sensei', g('harian'), '<button type="button" class="utama" data-lv="rute" data-r="harian">Kerjakan di Misi Harian</button>')
    + bagian('Misi Pondasi', g('pondasi'), '')
    + `<p class="lv-judul">Boss Simulasi</p><div class="lv-kartu"><p>${g('boss').filter((q) => q.selesai).length} dari 9 boss sudah takluk.</p></div><button type="button" data-lv="panel" data-p="boss">Lihat gerbang boss</button>`;
}

function pBoss(k) {
  return `<p class="lv-catatan">Tiap gerbang adalah satu Paket Simulasi JFT dengan timer. Soal dan penilaiannya ada di halaman Simulasi.</p><div class="lv-grid2">${k.quest.filter((q) => q.jenis === 'boss').map((q) => `<div class="lv-kartu"><h3>Paket ${q.paket}</h3><p>${q.terbaik == null ? 'Belum dikerjakan' : 'Terbaik ' + q.terbaik + '%'}</p>${q.selesai ? '<span class="lv-cap baik">Takluk</span>' : q.terbaik == null ? '<span class="lv-cap netral">Menunggu</span>' : '<span class="lv-cap kurang">Coba lagi</span>'}</div>`).join('')}</div>
<button type="button" class="utama" data-lv="rute" data-r="simulasi">Masuk Arena Simulasi</button>`;
}

const PANAH = { naik: '↑ naik', turun: '↓ turun', tetap: '→ stabil' };
function pKekuatan(k) {
  const s = k.snap.kesiapan;
  return `${s ? `<div class="lv-kartu"><h3>Kesiapan ujian: ${esc(s.label)} (${s.v}%)</h3><p>${esc(s.tip)}</p></div>` : ''}
${k.kekuatan.map((x) => { const t = tingkat(x.nilai), cap = { kuat: ['baik', 'Kuat'], cukup: ['kurang', 'Cukup'], lemah: ['lemah', 'Perlu diulang'], kosong: ['netral', 'Belum ada data'] }[t];
    return `<div class="lv-kartu"><div class="lv-baris"><h3>${esc(x.nama)}</h3><span class="lv-cap ${cap[0]}">${cap[1]}</span></div>
<div class="lv-batang" role="img" aria-label="${esc(x.nama)} ${x.nilai == null ? 'belum ada data' : x.nilai + ' persen'}"><i style="width:${x.nilai || 0}%"></i></div>
<div class="lv-baris"><p>${x.nilai == null ? 'Belum ada data' : x.nilai + '%'} · ${esc(x.ket)}${x.tren ? ' · <b>' + PANAH[x.tren] + '</b>' : ''}</p><button type="button" data-lv="zona" data-z="${x.zona}">Ke ${esc(zonaDari(x.zona).nama)}</button></div></div>`; }).join('')}
<button type="button" data-lv="rute" data-r="progres">Buka Rapor lengkap</button>`;
}

function pLencana(k) {
  const l = k.snap.lencana, punya = l.filter((x) => x.punya).length;
  return `<p class="lv-catatan">${punya} dari ${l.length} lencana sudah kamu dapat. Lencana diklaim di halaman Karakter.</p>
<div class="lv-lencana">${l.map((x) => `<div class="${x.punya ? '' : 'belum'}" title="${esc(x.why)}"><i aria-hidden="true">${esc(x.ikon)}</i>${esc(x.nama)}<br><small>${x.punya ? 'Didapat' : esc(x.why)}</small></div>`).join('') || '<p class="lv-catatan">Belum ada data lencana.</p>'}</div>
<button type="button" data-lv="rute" data-r="karakter">Buka halaman Karakter</button>`;
}

function hargaTeks(x) {
  if (x.status === 'usulan') return 'Segera hadir · harga menunggu Sensei';
  if (x.hadiahPencapaian) return 'Hadiah pencapaian';
  if (!x.harga) return 'Gratis';
  return rb(x.harga) + (x.mataUang === 'P' ? ' Permata' : ' Koin');
}
function pKatalog(k) {
  const f = k.katalogPilih, daftar = k.katalog.filter((x) => x.kategori === f.kat && (f.rar === 'semua' || x.rarity === f.rar));
  return `<p class="lv-catatan">Barang yang sudah ada dibeli di Toko seperti biasa. Barang baru masih pajangan sampai harganya diputuskan Sensei.</p>
<div class="lv-chip" role="group" aria-label="Kategori">${KATEGORI.map((c) => `<button type="button" data-lv="kat" data-k="${c.id}" aria-pressed="${c.id === f.kat}">${esc(c.nama)}</button>`).join('')}</div>
<div class="lv-chip" role="group" aria-label="Kelangkaan">${['semua', ...RARITY].map((r) => `<button type="button" data-lv="rar" data-k="${r}" aria-pressed="${r === f.rar}">${r === 'semua' ? 'Semua' : NAMA_RARITY[r]}</button>`).join('')}</div>
<div class="lv-grid2">${daftar.map((x) => `<div class="lv-kartu"><h3>${esc(x.nama)}</h3><p><span class="lv-cap ${x.rarity === 'eksklusif' ? 'lemah' : x.rarity === 'langka' ? 'kurang' : 'netral'}">${NAMA_RARITY[x.rarity]}</span>${x.untuk !== 'semua' ? ' · ' + esc(x.untuk) : ''}</p><p class="lv-hadiah">${esc(hargaTeks(x))}</p></div>`).join('') || '<p class="lv-catatan">Tidak ada barang di pilihan ini.</p>'}</div>
<button type="button" class="utama" data-lv="rute" data-r="karakter">Buka Toko dan Karakter</button>`;
}

function pLantai(k) {
  const b = k.snap.bunpou, n = Math.min(b.total || 0, 40);
  return `<div class="lv-kartu"><h3>${b.pass} dari ${b.total || 0} lantai terbuka</h3><p>Satu pola Bunpou yang lulus membuka satu lantai. Semua materi tetap bisa dibuka kapan saja.</p>
<div class="lv-batang" role="img" aria-label="${b.pass} dari ${b.total || 0} pola lulus"><i style="width:${b.total ? Math.round((b.pass / b.total) * 100) : 0}%"></i></div></div>
<div class="lv-lencana">${Array.from({ length: n }, (_, i) => `<div class="${i < b.pass ? '' : 'belum'}"><i aria-hidden="true">${i < b.pass ? '開' : '階'}</i>Lantai ${i + 1}<br><small>${i < b.pass ? 'Terbuka' : 'Belum'}</small></div>`).join('')}</div>
<div class="lv-grid2"><button type="button" class="utama" data-lv="rute" data-r="bunlat">Latihan Bunpou</button><button type="button" data-lv="rute" data-r="verb">Ubah Kata Kerja</button></div>`;
}

function pKartu(k) {
  const s = k.snap;
  return `<div class="lv-kartu"><h3>${rb(s.kartu.ulang)} kali mengulang kartu</h3><p>${s.kartu.total ? rb(s.kartu.total) + ' kartu ada di tumpukanmu.' : 'Tumpukan kartumu belum terbaca.'} Tiap kartu yang diulang memberi 2 EXP.</p></div>
<div class="lv-kartu"><h3>Kotoba: ${s.kotoba.n ? s.kotoba.avg + '%' : 'belum ada tes'}</h3><p>${s.kotoba.n} tes kotoba tercatat.</p></div>
<div class="lv-grid2"><button type="button" class="utama" data-lv="rute" data-r="hafalan">Ulang kartu</button><button type="button" data-lv="rute" data-r="kosa">Kosakata Irodori</button></div>`;
}

function pBab() {
  return `<p class="lv-catatan">Enam jalur, Bab 13 sampai 18. Semua bab bisa dibuka kapan saja.</p>
<div class="lv-grid2">${[13, 14, 15, 16, 17, 18].map((b) => `<button type="button" class="lv-zona" data-lv="rute" data-r="irodori"><i aria-hidden="true">${b}</i><span>Jalur Bab ${b}</span><small>Latihan dan materi</small></button>`).join('')}</div>`;
}

function pDuel(k) {
  const d = k.duel;
  if (!d) {
    return `<p class="lv-catatan">Duel ini murni latihan seru. Tidak ada EXP, Koin, atau Permata, dan tidak masuk Rapor.</p>
${Object.entries(LAWAN).map(([id, L]) => `<div class="lv-kartu"><div class="lv-baris"><h3>${esc(L.nama)}</h3><button type="button" class="utama" data-lv="duel" data-l="${id}">Mulai</button></div><p>${L.hp} nyawa lawan · sampai ${L.soal} soal · ${L.jenis === 'kanji' ? 'kanji' : L.jenis === 'campur' ? 'campur' : 'kosakata'}</p></div>`).join('')}
${k.duelKosong ? '<p class="lv-catatan">Bank soal duel belum siap. Coba lagi sebentar.</p>' : ''}`;
  }
  const hati = (n, m) => '●'.repeat(Math.max(0, n)) + '○'.repeat(Math.max(0, m - n));
  const hp = `<div class="lv-hp" role="status"><span>Kamu ${hati(d.hpPemain, d.hpPemainMaks)}</span><span>${esc(d.namaLawan.split(' · ')[0])} ${hati(d.hpLawan, d.hpLawanMaks)}</span></div>`;
  if (d.selesai) {
    return `<div class="lv-duel">${hp}<div class="lv-soal">${d.menang ? '勝ち！ Menang' : '負け… Belum menang'}<small>${d.benar} benar, ${d.salah} salah</small></div>
<div class="lv-grid2"><button type="button" class="utama" data-lv="duel" data-l="${d.lawan}">Main lagi</button><button type="button" data-lv="duelpilih">Pilih lawan</button></div><p class="lv-catatan">Tidak ada hadiah. Duel hanya pemanasan.</p></div>`;
  }
  const q = d.soal[d.i], t = k.duelTunggu ? d.terakhir : null;
  const tampil = t ? t.soal : q;
  return `<div class="lv-duel">${hp}<div class="lv-soal">${esc(tampil.p)}<small>${esc(tampil.s || (t ? (t.benar ? (t.serangan === 'mantra' ? 'Mantra kanji kena!' : 'Kartu kosakata kena!') : 'Meleset. Jawaban yang benar ditandai.') : 'Pilih jawaban yang tepat'))}</small></div>
<div class="lv-grid2 lv-opsi" role="group" aria-label="Pilihan jawaban">${tampil.o.map((o, i) => `<button type="button" data-lv="jawab" data-i="${i}"${t ? ' aria-disabled="true"' : ''} class="${t ? (i === t.kunci ? 'benar' : i === t.pilihan ? 'salah' : '') : ''}">${esc(o)}${t && i === t.kunci ? ' ✓' : ''}</button>`).join('')}</div>
${t ? '<button type="button" class="utama" data-lv="lanjutduel">Lanjut</button>' : ''}</div>`;
}

function pSetelan(k) {
  const s = k.setelan, sak = (id, label, nyala, ket) => `<div class="lv-kartu lv-saklar"><div><h3>${label}</h3><p>${ket}</p></div><button type="button" role="switch" data-lv="saklar" data-k="${id}" aria-checked="${!!nyala}" aria-pressed="${!!nyala}">${nyala ? 'Nyala' : 'Mati'}</button></div>`;
  return sak('ikutiWIB', 'Ikuti jam WIB', s.ikutiWIB, 'Langit dan cuaca mengikuti jam Jakarta. Tidak memakai lokasimu.')
    + `<div class="lv-kartu"><h3>Kunci suasana</h3><p>${s.ikutiWIB ? 'Matikan "Ikuti jam WIB" untuk memilih satu suasana.' : 'Dunia tetap di suasana ini, cuaca cerah.'}</p><div class="lv-chip bungkus" role="group" aria-label="Kunci suasana">${FASE.map((f) => `<button type="button" data-lv="kunci" data-k="${f.id}" aria-pressed="${!s.ikutiWIB && s.kunci === f.id}"${s.ikutiWIB ? ' aria-disabled="true"' : ''}>${f.nama}</button>`).join('')}</div></div>`
    + sak('ringan', 'Mode ringan (2D)', s.ringan, 'Tanpa 3D. Cocok untuk HP lama atau hemat baterai.')
    + `<div class="lv-kartu"><h3>Mutu 3D</h3><div class="lv-chip bungkus" role="group" aria-label="Mutu 3D">${[['auto', 'Otomatis'], ['tinggi', 'Tinggi'], ['hemat', 'Hemat']].map(([id, n]) => `<button type="button" data-lv="mutu" data-k="${id}" aria-pressed="${s.mutu === id}">${n}</button>`).join('')}</div></div>`
    + sak('besar', 'Teks besar', s.besar, 'Memperbesar tulisan di dunia.')
    + sak('suara', 'Bunyi tombol', s.suara, 'Ketukan pendek saat menekan tombol.')
    + sak('musik', 'Musik latar', s.musik, 'Dimuat saat dinyalakan (188 KB).')
    + '<p class="lv-catatan">Suasana, cuaca, dan setelan di sini hanya tampilan. Tidak ada yang memengaruhi EXP, Koin, nilai, atau timer.</p>';
}

const PANEL = { peta: pPeta, quest: pQuest, setelan: pSetelan, kekuatan: pKekuatan, lencana: pLencana, katalog: pKatalog, boss: pBoss, lantai: pLantai, kartu: pKartu, bab: pBab, duel: pDuel };
export const isiPanel = (k) => (PANEL[k.panel] ? PANEL[k.panel](k) : '');
export const DAFTAR_PANEL = Object.keys(PANEL);
export { ZONA };
