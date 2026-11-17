// Jembatan data: satu-satunya tempat dunia 3D membaca data aplikasi.
// Hanya MEMBACA lewat fungsi yang sudah ada di halaman, lalu mengembalikan salinan polos.
// Tidak ada panggilan jaringan, tidak ada penulisan, tidak ada akses ke kunci jawaban.

const aman = (f, cadangan) => { try { const v = f(); return v === undefined ? cadangan : v; } catch { return cadangan; } };
const angka = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const kunciHari = (t) => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

function bacaJSON(w, kunci, cadangan) {
  return aman(() => { const s = w.localStorage.getItem(kunci); const v = s ? JSON.parse(s) : null; return v && typeof v === 'object' ? v : cadangan; }, cadangan);
}

function bagian(d, jenis) {
  const pct = (a) => aman(() => d.ka.pct(a.ok, a.n), a.n ? Math.round((a.ok / a.n) * 100) : 0);
  const r = aman(() => d.at.filter((a) => a.y === jenis && a.n > 0).map(pct), []);
  return { avg: r.length ? Math.round(r.reduce((s, x) => s + x, 0) / r.length) : 0, n: r.length, riwayat: r.slice(-12) };
}

/** Potret data murid saat ini. Aman dipanggil kapan saja; kalau aplikasi belum siap hasilnya kosong. */
export function potret(w = globalThis) {
  const d = aman(() => (typeof w.LMS_ME === 'function' ? w.LMS_ME() : null), null);
  const G = aman(() => w.GAME.state.G, null);
  const dompet = aman(() => w.GAME.wallet(), null);       // tanpa argumen = hanya membaca saldo
  const lv = aman(() => ({ L: angka(d.lv.L, 1), base: angka(d.lv.base), next: angka(d.lv.next, 40) }), { L: 1, base: 0, next: 40 });
  const plog = bacaJSON(w, 'lms:plog', []);
  const hariIni = kunciHari(Date.now());
  const sudah = (k) => Array.isArray(plog) && plog.some((x) => x && x.k === k && kunciHari(x.t) === hariIni);
  const klaim = new Set(aman(() => G.claimed, []) || []);
  const topi = aman(() => String(G.equip.topi || ''), '');
  const vs = aman(() => w.GAME.verbStats(), null);
  const bp = aman(() => w.BUNPOU_UI.stat(), null);
  return {
    siap: !!d, guru: !!aman(() => w.LMS_OWNER_VIEW, false),
    nama: String(aman(() => w.LMS_NAME(), '') || ''),
    xp: angka(d && d.xp), lv, streak: angka(d && d.streak),
    koin: angka(dompet && dompet.koin), permata: angka(dompet && dompet.permata), koinHariIni: angka(dompet && dompet.today), batasKoin: angka(dompet && dompet.cap, 60),
    misi: aman(() => d.ms.map((m) => ({ id: String(m.id), ikon: String(m.ic || ''), t: String(m.t || ''), why: String(m.why || ''), done: !!m.done, prog: String(m.prog || '') })), []),
    pondasi: aman(() => w.MISI_PONDASI.ITEMS.map((p) => ({ id: String(p.id), t: String(p.t || ''), why: String(p.why || ''), done: sudah(p.key) })), []),
    bunpou: { pass: angka(bp && bp.pass), total: angka(bp && bp.total) },
    sim: { best: { ...bacaJSON(w, 'simpdf:best', {}) } },
    kotoba: d ? bagian(d, 'K') : { avg: 0, n: 0, riwayat: [] },
    kanji: d ? bagian(d, 'J') : { avg: 0, n: 0, riwayat: [] },
    verb: { pct: vs && vs.n ? Math.round((vs.ok / vs.n) * 100) : 0, n: angka(vs && vs.n) },
    kartu: { ulang: angka(aman(() => d.ka.srsReviews(), 0)), total: angka(aman(() => d.ka.srsTotal(), 0)) },
    lencana: aman(() => w.GAME.ACH.map((a) => ({ id: String(a.id), ikon: String(a.ic || ''), nama: String(a.name || ''), why: String(a.why || ''), punya: klaim.has(a.id) })), []),
    kesiapan: aman(() => (d.ready ? { v: angka(d.ready.v), label: String(d.ready.label), tip: String(d.ready.tip) } : null), null),
    avatar: { badan: aman(() => G.body, 'L') === 'P' ? 'wanita' : 'pria', hijab: topi.startsWith('t_hijab') },
  };
}

/** Bank soal mini untuk duel (bank hiburan Taman Bermain yang memang sudah ada di halaman). */
export function soalDuel(w, jenis, n) {
  return aman(() => w.SOAL.gen(jenis, n).map((q) => ({ p: String(q.p), s: String(q.s || ''), o: q.o.map(String), a: q.a | 0, jenis: /[一-龯]/.test(String(q.p)) && jenis !== 'kosakata' ? 'kanji' : 'kosakata' })), []);
}

/** Pindah ke halaman aplikasi yang sudah ada. */
export function keRute(w, rute) { return aman(() => { w.LMS_GO(rute); return true; }, false); }

/** Salinan polos katalog toko yang sudah ada (hanya untuk ditampilkan). */
export function barangToko(w) {
  return aman(() => w.GAME.ITEMS.map((x) => ({ id: String(x.id), slot: String(x.slot), name: String(x.name), price: angka(x.price), cur: String(x.cur), rar: String(x.rar || ''), ex: !!x.ex, bd: String(x.bd || '') })), []);
}
