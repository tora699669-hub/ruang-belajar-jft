// Pintu masuk dunia JFT Leveling. Dimuat hanya saat murid menekan tombol dunia.
// Merekatkan: jembatan data (baca-saja), tampilan HTML (juga fallback 2D), mesin 3D (opsional), jam WIB, cuaca.
import { potret, soalDuel, keRute, barangToko } from './jembatan.js';
import { zonaDari, NPC } from './zona.js';
import { susunQuest } from './quest.js';
import { petaKekuatan } from './kekuatan.js';
import { gabungKatalog } from './katalog.js';
import { mulaiDuel, jawab, LAWAN } from './duel.js';
import { suasana, menitWIB, tanggalWIB, faseDari, FASE, jamTeks } from './waktu.js';
import { efekCuaca, efekJenis, cuacaSaat, NAMA_CUACA } from './cuaca.js';
import { PAKET_SIMULASI, BATAS_TAKLUK } from './quest.js';
import * as T from './tampilan.js';
import { Suara } from './suara.js';

const W = window, D = document;
const TENANG = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const baca = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const tulis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* penyimpanan penuh atau diblokir */ } };
const SETELAN_AWAL = { ikutiWIB: true, kunci: 'siang', ringan: false, mutu: 'auto', besar: false, suara: true, musik: false };
const TENGAH = { subuh: 4 * 60 + 45, pagi: 8 * 60, siang: 12 * 60 + 30, sore: 16 * 60 + 15, senja: 18 * 60, malam: 21 * 60 };

let K = null;          // keadaan dunia yang sedang terbuka
let suara = null;

function saat() {
  if (K.uji) return K.uji;
  if (!K.setelan.ikutiWIB) return { menit: TENGAH[K.setelan.kunci] ?? TENGAH.siang, tanggal: null };
  return { menit: menitWIB(), tanggal: tanggalWIB() };
}
function hitungSuasana() {
  const { menit, tanggal } = saat();
  const sua = suasana(menit), efek = tanggal ? efekCuaca(tanggal, menit) : efekJenis('cerah');
  const fase = FASE.find((f) => f.id === faseDari(menit));
  const jenis = tanggal ? cuacaSaat(tanggal, menit).jenis : 'cerah';
  K.chip = `${fase.nama} · ${jamTeks(menit)} WIB · ${NAMA_CUACA[jenis]}`;
  K.fase = fase.id; K.cuaca = jenis; K.sua = sua; K.efek = efek;
  const rgb = (a) => `rgb(${a.map((x) => Math.round(x * 255)).join(',')})`;
  K.el.pentas.style.background = `linear-gradient(${rgb(sua.langitAtas)}, ${rgb(sua.langitCakrawala)})`;
  const c = D.getElementById('lv-chip'); if (c) c.textContent = K.chip;
  if (K.dunia) K.dunia.terapkan(sua, efek);
}

function segarkanData() {
  K.snap = potret(W);
  K.quest = susunQuest(K.snap);
  K.questSisa = K.quest.filter((q) => q.jenis === 'harian' && !q.selesai).length;
  K.kekuatan = petaKekuatan(K.snap);
  if (!K.katalog) K.katalog = gabungKatalog(barangToko(W));
}

function gambar() {
  K.el.hud.innerHTML = T.hud(K);
  K.el.lembar.innerHTML = T.lembar(K);
  K.el.dua.innerHTML = K.dunia ? '' : T.duaD(K);
  K.el.dua.hidden = !!K.dunia;
  K.el.akar.classList.toggle('besar', !!K.setelan.besar);
  K.el.akar.dataset.zona = K.zona; K.el.akar.dataset.mode = K.dunia ? '3d' : '2d';
  gambarPanel();
}
function gambarPanel(fokus) {
  const p = K.el.panel;
  if (!K.panel) { p.hidden = true; p.innerHTML = ''; return; }
  p.hidden = false;
  p.innerHTML = `<header><h2 id="lv-pj">${T.esc(T.judulPanel(K.panel))}</h2><button type="button" data-lv="tutuppanel" aria-label="Tutup panel">Tutup</button></header><div class="lv-isi">${T.isiPanel(K)}</div>`;
  if (fokus) { const b = p.querySelector('[data-lv="tutuppanel"]'); if (b) b.focus(); }
}

function toast(html, lama = 2400) {
  const t = K && K.el.toast; if (!t) return;
  t.innerHTML = html; t.classList.add('tampil');
  clearTimeout(K.tToast); K.tToast = setTimeout(() => t.classList.remove('tampil'), lama);
}

function defZona() {
  const z = zonaDari(K.zona), s = K.snap, a = s.avatar;
  const best = s.sim.best || {};
  return { id: z.id, tema: z.tema, pintu: z.pintu.map((p) => ({ label: p.label, ikon: p.ikon, terkunci: !!p.terkunci })), npc: z.npc.map((id) => ({ berkas: NPC[id].berkas })),
    avatar: a.badan === 'wanita' ? (a.hijab ? 'murid_wanita.glb' : 'murid_wanita_rambut.glb') : 'murid_pria.glb',
    data: { lantaiMenyala: Math.min(5, s.bunpou.pass), kanjiMenyala: s.kanji.n ? Math.round((s.kanji.avg / 100) * 6) : 0, boss: PAKET_SIMULASI.map((n) => best[n] != null && +best[n] >= BATAS_TAKLUK), bab: [] } };
}

async function nyalakan3D() {
  if (K.setelan.ringan || K.dunia) return;
  try {
    const m = await import('./dunia3d.js');
    if (!K || K.setelan.ringan) return;
    if (!m.webglAda()) throw new Error('WebGL tidak tersedia');
    const kanvas = D.createElement('canvas');
    kanvas.setAttribute('role', 'img'); kanvas.setAttribute('aria-label', 'Pemandangan 3D zona. Semua aksi juga tersedia sebagai tombol di bawah.');
    K.el.pentas.insertBefore(kanvas, K.el.pentas.firstChild);
    K.el.kanvas = kanvas;
    K.dunia = new m.Dunia3D(kanvas, { tenang: TENANG(), mutu: K.setelan.mutu, padaPintu: (i) => aksiPintu(i) });
    K.dunia.padaMutu = () => toast('Mutu 3D diturunkan supaya lancar');
    K.dunia.padaLambat = () => toast('HP terasa berat? <small>Coba Mode ringan di Setelan</small>', 4200);
    hitungSuasana();
    await K.dunia.masukZona(defZona());
    if (K) { gambar(); cekNaikLevel(); }
  } catch (e) {
    console.info('[lv] 3D tidak dipakai:', e.message);
    if (K) { matikan3D(); K.galat3d = e.message; gambar(); toast('Mode ringan dipakai <small>3D belum bisa di perangkat ini</small>', 3200); }
  }
}
function matikan3D() {
  if (K.dunia) { try { K.dunia.hentikan(); } catch { /* sudah berhenti */ } K.dunia = null; }
  if (K.el.kanvas) { K.el.kanvas.remove(); K.el.kanvas = null; }
}

function cekNaikLevel() {
  if (!K.snap.siap) return;
  const lama = baca('lv:lvl', null), kini = K.snap.lv.L;
  if (lama != null && kini > lama) { toast(`LEVEL UP! <small>Lv ${lama} → Lv ${kini}</small>`, 3200); if (K.dunia) K.dunia.rayakan('level'); if (suara && K.setelan.suara) suara.naikLevel(); }
  if (lama !== kini) tulis('lv:lvl', kini);
}

async function pindah(z) {
  if (!zonaDari(z)) return;
  K.zona = z; K.panel = null; K.npcKe = 0; K.barisKe = 0; K.duel = null;
  try { sessionStorage.setItem('lv:zona', z); } catch { /* tidak apa-apa */ }
  gambar();
  if (K.dunia) await K.dunia.masukZona(defZona());
}

async function aksiPintu(i) {
  if (K.sibuk) return;
  const p = zonaDari(K.zona).pintu[i]; if (!p) return;
  if (p.terkunci) { toast(T.esc(p.terkunci), 3600); return; }
  K.sibuk = true;
  try { if (K.dunia) await K.dunia.jalanKe(i); } finally { if (K) K.sibuk = false; }
  if (!K) return;
  if (p.zona) return pindah(p.zona);
  if (p.panel) return bukaPanel(p.panel);
  if (p.rute) return keluarKe(p.rute);
}

function bukaPanel(p) {
  K.panel = p; if (p === 'duel') K.duel = null;
  if (p === 'quest' || p === 'kekuatan' || p === 'lencana' || p === 'boss') segarkanData();
  gambarPanel(true);
}

function mulai(lawan) {
  const L = LAWAN[lawan] || LAWAN.kevin1, soal = soalDuel(W, L.jenis, L.soal);
  K.duelKosong = !soal.length; K.duelTunggu = false;
  K.duel = soal.length ? mulaiDuel({ soal, lawan }) : null;
  K.duelDicatat = false;
  gambarPanel();
}

function keluarKe(rute) {
  const z = K.zona;
  tutup();
  keRute(W, rute);
  tombolKembali(z);
}

function tombolKembali(z) {
  let b = D.getElementById('lv-kembali');
  if (!b) {
    b = D.createElement('button'); b.id = 'lv-kembali'; b.type = 'button';
    b.addEventListener('click', () => buka({ zona: b.dataset.z }));
    D.body.appendChild(b);
    setInterval(() => { const x = D.getElementById('lv-kembali'); if (x && !x.dataset.tutup) x.hidden = !!(D.body.classList.contains('exam') || D.getElementById('lms-login') || W.LMS_OWNER_VIEW); }, 1000);
  }
  b.dataset.z = z; delete b.dataset.tutup; b.hidden = false;
  b.textContent = '↩ ' + zonaDari(z).nama;
  b.setAttribute('aria-label', 'Kembali ke ' + zonaDari(z).nama + ' di dunia JFT Leveling');
}

function padaKlik(e) {
  const b = e.target.closest('[data-lv]');
  if (!b || !K) return;
  if (b.getAttribute('aria-disabled') === 'true' && b.dataset.lv !== 'pintu') return;
  if (suara && K.setelan.suara) suara.klik();
  const a = b.dataset.lv;
  if (a === 'keluar') { tutup(); }
  else if (a === 'pintu') aksiPintu(+b.dataset.i);
  else if (a === 'sapa') { const z = zonaDari(K.zona); K.barisKe++; if (K.barisKe % NPC[z.npc[K.npcKe % z.npc.length]].sapa.length === 0) K.npcKe++; K.el.lembar.innerHTML = T.lembar(K); const s = K.el.lembar.querySelector('[data-lv="sapa"]'); if (s) s.focus(); }
  else if (a === 'panel') bukaPanel(b.dataset.p);
  else if (a === 'tutuppanel') { K.panel = null; K.duel = null; gambarPanel(); const n = K.el.lembar.querySelector('.lv-nav button'); if (n) n.focus(); }
  else if (a === 'zona') pindah(b.dataset.z);
  else if (a === 'rute') keluarKe(b.dataset.r);
  else if (a === 'kat') { K.katalogPilih.kat = b.dataset.k; gambarPanel(); }
  else if (a === 'rar') { K.katalogPilih.rar = b.dataset.k; gambarPanel(); }
  else if (a === 'duel') mulai(b.dataset.l);
  else if (a === 'duelpilih') { K.duel = null; gambarPanel(); }
  else if (a === 'jawab') {
    if (!K.duel || K.duelTunggu) return;
    K.duel = jawab(K.duel, +b.dataset.i); K.duelTunggu = true;
    // Hasil duel ikut tercatat di riwayat latihan murid (Pantauan Sensei dan rapor). Hanya log, tanpa EXP/Koin.
    if (K.duel.selesai && !K.duelDicatat) { K.duelDicatat = true; try { const n = K.duel.benar + K.duel.salah; if (n && typeof window.lmsLog === 'function' && !window.LMS_OWNER_VIEW) window.lmsLog('lv:duel:' + K.duel.lawan, K.duel.benar, n, null, { menang: K.duel.menang ? 1 : 0 }); } catch (e) { /* log gagal tidak menghentikan dunia */ } }
    const t = K.duel.terakhir;
    if (t.benar) { if (K.dunia) K.dunia.rayakan('benar'); if (suara && K.setelan.suara) suara.benar(); }
    gambarPanel();
    const l = K.el.panel.querySelector('[data-lv="lanjutduel"]'); if (l) l.focus();
  } else if (a === 'lanjutduel') { K.duelTunggu = false; gambarPanel(); }
  else if (a === 'saklar') aturSetelan(b.dataset.k, !K.setelan[b.dataset.k]);
  else if (a === 'kunci') { K.setelan.kunci = b.dataset.k; simpanSetelan(); hitungSuasana(); gambar(); }
  else if (a === 'mutu') { K.setelan.mutu = b.dataset.k; simpanSetelan(); if (K.dunia) { K.dunia.mutuTetap = b.dataset.k === 'auto' ? null : b.dataset.k; K.dunia.aturMutu(b.dataset.k === 'hemat' ? 'hemat' : 'tinggi'); } gambarPanel(); }
}
function simpanSetelan() { tulis('lv:setelan', K.setelan); }
function aturSetelan(k, v) {
  K.setelan[k] = v; simpanSetelan();
  if (k === 'ikutiWIB') hitungSuasana();
  if (k === 'ringan') { if (v) matikan3D(); else { K.modeSiap = false; nyalakan3D().finally(() => { if (K) K.modeSiap = true; }); } }
  if (k === 'musik' && suara) suara.musik(v).then((ok) => { if (v && !ok && K) { K.setelan.musik = false; simpanSetelan(); gambarPanel(); toast('Musik belum bisa diputar di perangkat ini'); } });
  gambar();
}
function padaTombol(e) {
  if (e.key === 'Escape' && K) { if (K.panel) { K.panel = null; K.duel = null; gambarPanel(); } else tutup(); }
}

/** Buka dunia. opsi: {zona, ringan, uji:{menit, tanggal}} -> true kalau terbuka. */
export async function buka(opsi = {}) {
  if (K) return true;
  const snap = potret(W);
  if (snap.guru) return false;                       // panel guru tetap alat kerja 2D
  if (!D.getElementById('lv-gaya')) { const s = D.createElement('style'); s.id = 'lv-gaya'; s.textContent = T.CSS; D.head.appendChild(s); }
  const akar = D.createElement('div');
  akar.id = 'lv-akar'; akar.setAttribute('role', 'dialog'); akar.setAttribute('aria-modal', 'true'); akar.setAttribute('aria-label', 'Dunia JFT Leveling');
  akar.innerHTML = '<section class="lv-pentas"><div class="lv-dua"></div><div class="lv-hud"></div><div class="lv-toast" role="status" aria-live="polite"></div></section><section class="lv-lembar" aria-label="Zona"></section><div class="lv-panel" role="dialog" aria-modal="true" aria-labelledby="lv-pj" hidden></div>';
  D.body.appendChild(akar);
  const q = (s) => akar.querySelector(s);
  let zonaAwal = opsi.zona;
  if (!zonaAwal) { try { zonaAwal = sessionStorage.getItem('lv:zona'); } catch { zonaAwal = null; } }
  if (!zonaDari(zonaAwal)) zonaAwal = baca('lv:pernah', false) ? 'plaza' : 'gerbang';
  tulis('lv:pernah', true);
  K = { zona: zonaAwal, panel: null, npcKe: 0, barisKe: 0, duel: null, duelTunggu: false, katalog: null, katalogPilih: { kat: 'baju', rar: 'semua' }, uji: opsi.uji || null,
    setelan: { ...SETELAN_AWAL, ...baca('lv:setelan', {}), ...(opsi.ringan ? { ringan: true } : {}) }, dunia: null, sibuk: false,
    el: { akar, pentas: q('.lv-pentas'), dua: q('.lv-dua'), hud: q('.lv-hud'), toast: q('.lv-toast'), lembar: q('.lv-lembar'), panel: q('.lv-panel'), kanvas: null }, gulir: D.documentElement.style.overflow };
  D.documentElement.style.overflow = 'hidden';
  const k = D.getElementById('lv-kembali'); if (k) { k.hidden = true; k.dataset.tutup = '1'; }
  suara = suara || new Suara(new URL('./aset/', import.meta.url).href);
  segarkanData(); hitungSuasana(); gambar();
  akar.addEventListener('click', padaKlik);
  D.addEventListener('keydown', padaTombol);
  K.tJam = setInterval(() => { if (K) hitungSuasana(); }, 30000);
  const pertama = q('.lv-pintu button'); if (pertama) pertama.focus();
  if (!K.setelan.ringan) await nyalakan3D(); else cekNaikLevel();
  if (K) K.modeSiap = true;
  if (K && K.setelan.musik && suara) suara.musik(true);
  return true;
}

export function tutup() {
  if (!K) return;
  clearInterval(K.tJam); clearTimeout(K.tToast);
  D.removeEventListener('keydown', padaTombol);
  matikan3D();
  if (suara) suara.musik(false);
  D.documentElement.style.overflow = K.gulir || '';
  K.el.akar.remove();
  K = null;
}

export const terbuka = () => !!K;

// Pegangan untuk uji otomatis. Tidak dipakai aplikasi.
W.LV = {
  buka, tutup, terbuka,
  uji: {
    aturWaktu(menit, tanggal) { if (!K) return; K.uji = menit == null ? null : { menit, tanggal: tanggal || tanggalWIB() }; hitungSuasana(); },
    keadaan: () => (K ? { zona: K.zona, panel: K.panel, mode: K.dunia ? '3d' : '2d', chip: K.chip, fase: K.fase, cuaca: K.cuaca, lampu: K.sua.lampu, bintang: K.sua.bintang, efek: K.efek, setelan: { ...K.setelan }, galat3d: K.galat3d || null, questSisa: K.questSisa, level: K.snap.lv.L, koin: K.snap.koin, duel: K.duel ? { i: K.duel.i, hpLawan: K.duel.hpLawan, hpPemain: K.duel.hpPemain, selesai: K.duel.selesai, menang: K.duel.menang, kunci: K.duel.selesai ? null : K.duel.soal[K.duel.i].a } : null } : null),
    statistik: () => (K && K.dunia ? K.dunia.statistik() : null),
    siapZona: () => !!(K && K.modeSiap && !K.sibuk && (!K.dunia || (K.dunia.zona === K.zona && K.dunia.aktor.length > 0) || K.dunia.galatAset)),
  },
};
