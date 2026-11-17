// Jam WIB dan suasana langit. Fungsi murni: masuk waktu, keluar angka tampilan.
// Modul ini tidak punya akses ke EXP, Koin, nilai, timer, atau data murid, dan tidak meminta lokasi.

export const TRANSISI = 40; // menit, berpusat di batas fase (20 menit sebelum sampai 20 menit sesudah)

export const FASE = [
  { id: 'subuh', mulai: 4 * 60, nama: 'Subuh' },
  { id: 'pagi', mulai: 5 * 60 + 30, nama: 'Pagi' },
  { id: 'siang', mulai: 10 * 60, nama: 'Siang' },
  { id: 'sore', mulai: 15 * 60, nama: 'Sore' },
  { id: 'senja', mulai: 17 * 60 + 30, nama: 'Senja' },
  { id: 'malam', mulai: 18 * 60 + 30, nama: 'Malam' },
];

let fmt = null;
function bagianIntl(date) {
  fmt = fmt || new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const o = {};
  for (const p of fmt.formatToParts(date)) o[p.type] = p.value;
  const n = (k) => Number(o[k]);
  if (![n('year'), n('month'), n('day'), n('hour'), n('minute'), n('second')].every(Number.isFinite)) throw new Error('Intl tidak lengkap');
  return { y: n('year'), b: n('month'), h: n('day'), jam: n('hour') % 24, menit: n('minute'), detik: n('second') };
}
function bagianUTC7(date) {
  const d = new Date(date.getTime() + 7 * 3600 * 1000);
  return { y: d.getUTCFullYear(), b: d.getUTCMonth() + 1, h: d.getUTCDate(), jam: d.getUTCHours(), menit: d.getUTCMinutes(), detik: d.getUTCSeconds() };
}
function bagian(date, opsi) {
  if (opsi?.pakaiIntl !== false) {
    try { return bagianIntl(date); } catch { /* jatuh ke UTC+7 */ }
  }
  return bagianUTC7(date);
}

/** Menit sejak tengah malam WIB (0 sampai <1440), termasuk pecahan detik. */
export function menitWIB(date = new Date(), opsi) {
  const p = bagian(date, opsi);
  return p.jam * 60 + p.menit + p.detik / 60;
}

/** Tanggal WIB sebagai 'YYYYMMDD' (dipakai nanti sebagai benih cuaca harian). */
export function tanggalWIB(date = new Date(), opsi) {
  const p = bagian(date, opsi);
  return String(p.y) + String(p.b).padStart(2, '0') + String(p.h).padStart(2, '0');
}

const norm = (m) => ((m % 1440) + 1440) % 1440;

export function indeksFase(menit) {
  const m = norm(menit);
  let i = FASE.length - 1; // sebelum 04.00 masih malam
  for (let k = 0; k < FASE.length; k++) if (m >= FASE[k].mulai) i = k;
  return i;
}
export const faseDari = (menit) => FASE[indeksFase(menit)].id;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

// Satu palet per fase. Warna sRGB 0..1, kekuatan cahaya dalam satuan three.js.
const PALET = {
  subuh: { langitAtas: hex('#27365f'), langitCakrawala: hex('#e8a48a'), kabut: hex('#8b8fae'), cahaya: hex('#ffc9a8'), kuatCahaya: 0.9, hemiLangit: hex('#7f8fc4'), hemiTanah: hex('#4a4352'), kuatHemi: 0.75, lampu: 0.7, bintang: 0.35, eksposur: 0.95 },
  pagi: { langitAtas: hex('#5aa2e6'), langitCakrawala: hex('#fde3c0'), kabut: hex('#cfe0ee'), cahaya: hex('#fff0d6'), kuatCahaya: 2.5, hemiLangit: hex('#cfe4ff'), hemiTanah: hex('#8b7a66'), kuatHemi: 1.25, lampu: 0, bintang: 0, eksposur: 1.0 },
  siang: { langitAtas: hex('#3f93ea'), langitCakrawala: hex('#d9ecfb'), kabut: hex('#d3e6f5'), cahaya: hex('#fffaf0'), kuatCahaya: 3.0, hemiLangit: hex('#d6e8ff'), hemiTanah: hex('#93836f'), kuatHemi: 1.4, lampu: 0, bintang: 0, eksposur: 1.0 },
  sore: { langitAtas: hex('#4f8fd6'), langitCakrawala: hex('#ffe0b0'), kabut: hex('#e3d6c2'), cahaya: hex('#ffe2b4'), kuatCahaya: 2.6, hemiLangit: hex('#cfdcf5'), hemiTanah: hex('#8f7a60'), kuatHemi: 1.2, lampu: 0, bintang: 0, eksposur: 1.0 },
  senja: { langitAtas: hex('#3d4a8c'), langitCakrawala: hex('#ff9d5c'), kabut: hex('#c48a7c'), cahaya: hex('#ff9a5a'), kuatCahaya: 1.5, hemiLangit: hex('#9d8fc4'), hemiTanah: hex('#5e4a4a'), kuatHemi: 0.85, lampu: 0.75, bintang: 0.15, eksposur: 1.0 },
  malam: { langitAtas: hex('#0b1230'), langitCakrawala: hex('#273a6b'), kabut: hex('#18224a'), cahaya: hex('#a9c0ff'), kuatCahaya: 0.85, hemiLangit: hex('#5a6fb8'), hemiTanah: hex('#262536'), kuatHemi: 0.8, lampu: 1, bintang: 1, eksposur: 1.05 },
};

const halus = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
const campur = (a, b, t) => (Array.isArray(a) ? a.map((x, i) => x + (b[i] - x) * t) : a + (b - a) * t);

/** Dua fase yang sedang bercampur dan bobotnya. */
export function bobotFase(menit) {
  const m = norm(menit), i = indeksFase(m), n = FASE.length, setengah = TRANSISI / 2;
  const mulai = FASE[i].mulai, berikut = FASE[(i + 1) % n].mulai;
  const sejak = norm(m - mulai), menuju = norm(berikut - m);
  if (sejak < setengah) return { a: FASE[(i + n - 1) % n].id, b: FASE[i].id, t: halus((sejak + setengah) / TRANSISI) };
  if (menuju <= setengah) return { a: FASE[i].id, b: FASE[(i + 1) % n].id, t: halus((setengah - menuju) / TRANSISI) };
  return { a: FASE[i].id, b: FASE[i].id, t: 0 };
}

// Arah datang cahaya utama: matahari siang hari, bulan malam hari, berpindah halus saat senja dan subuh.
function arahCahaya(menit) {
  const s = (norm(menit) - 360) / 720 * Math.PI;           // 06.00 terbit, 18.00 terbenam
  const mat = [Math.cos(s) * 0.75, Math.sin(s), 0.55];
  const bln = [-Math.cos(s) * 0.5, Math.max(0.35, -Math.sin(s)), 0.6];
  const k = halus((mat[1] - 0.05) / 0.25);                   // 1 = matahari cukup tinggi
  const v = [0, 1, 2].map((i) => bln[i] + (mat[i] - bln[i]) * k);
  v[1] = Math.max(v[1], 0.28);
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
}

/** Semua angka tampilan untuk satu saat. */
export function suasana(menit) {
  const { a, b, t } = bobotFase(menit);
  const A = PALET[a], B = PALET[b], o = {};
  for (const k of Object.keys(A)) o[k] = campur(A[k], B[k], t);
  o.arahCahaya = arahCahaya(menit);
  return o;
}

/** Campuran dua suasana (dipakai tombol contoh untuk berpindah halus). */
export function campurSuasana(x, y, t) {
  const o = {};
  for (const k of Object.keys(x)) o[k] = campur(x[k], y[k], t);
  const l = Math.hypot(...o.arahCahaya) || 1;
  o.arahCahaya = o.arahCahaya.map((v) => v / l);
  return o;
}

export const jamTeks = (menit) => {
  const m = Math.floor(norm(menit));
  return String(Math.floor(m / 60)).padStart(2, '0') + '.' + String(m % 60).padStart(2, '0');
};
