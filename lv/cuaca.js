// Cuaca harian mengikuti pola Jakarta. Fungsi murni: masuk tanggal WIB dan menit, keluar angka tampilan.
// Tabel peluang adalah rancangan, bukan data cuaca langsung. Tidak ada permintaan jaringan,
// dan modul ini tidak punya akses ke EXP, Koin, nilai, timer, atau data murid.

export const JENIS = ['cerah', 'berawan', 'gerimis', 'hujan', 'kabut'];
export const NAMA_CUACA = { cerah: 'Cerah', berawan: 'Berawan', gerimis: 'Gerimis', hujan: 'Hujan ringan', kabut: 'Kabut tipis' };
export const TRANSISI_CUACA = 20; // menit, berpusat di batas blok

export const BLOK = [
  { id: 'pagi', mulai: 4 * 60 },
  { id: 'siang', mulai: 10 * 60 },
  { id: 'sore', mulai: 15 * 60 },
  { id: 'malam', mulai: 18 * 60 + 30 },
];

// Peluang hari basah per bulan (Jan..Des): musim hujan Nov-Mar, kemarau Jun-Sep.
const BASAH = [0.55, 0.55, 0.45, 0.35, 0.25, 0.15, 0.08, 0.06, 0.08, 0.20, 0.35, 0.45];
// Hujan Jakarta lebih sering siang sampai sore.
const FAKTOR_BLOK = [0.5, 1.0, 1.25, 0.8];

const EFEK = {
  cerah: { awan: 0.1, hujan: 0, kabut: 0, redup: 0 },
  berawan: { awan: 0.7, hujan: 0, kabut: 0.05, redup: 0.25 },
  gerimis: { awan: 0.8, hujan: 0.35, kabut: 0.1, redup: 0.35 },
  hujan: { awan: 1, hujan: 0.8, kabut: 0.2, redup: 0.5 },
  kabut: { awan: 0.4, hujan: 0, kabut: 0.8, redup: 0.2 },
};

function acak(benih) {            // mulberry32
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map();
/** Cuaca empat blok (pagi, siang, sore, malam) untuk satu tanggal WIB 'YYYYMMDD'. */
export function cuacaHari(tanggal) {
  const kunci = String(tanggal);
  if (cache.has(kunci)) return cache.get(kunci);
  const n = Number(kunci), bulan = Math.floor(n / 100) % 100;
  const r = acak(Math.imul(n, 2654435761) ^ 0x9e3779b9);
  const dasar = BASAH[(bulan - 1 + 12) % 12] ?? 0.3;
  const blok = BLOK.map((_, i) => {
    const x = r(), y = r(), z = r();
    if (x < Math.min(0.95, dasar * FAKTOR_BLOK[i])) return y < 0.55 ? 'hujan' : 'gerimis';
    if (i === 0 && z < 0.12) return 'kabut';
    return y < 0.25 + 0.5 * dasar ? 'berawan' : 'cerah';
  });
  const hasil = { tanggal: kunci, blok };
  cache.set(kunci, hasil);
  if (cache.size > 64) cache.delete(cache.keys().next().value);
  return hasil;
}

function kemarin(tanggal) {
  const s = String(tanggal);
  const d = new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) - 86400000);
  return String(d.getUTCFullYear()) + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
}

const norm = (m) => ((m % 1440) + 1440) % 1440;
const halus = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

// Urutan blok yang berlaku pada satu tanggal: malam kemarin (sampai 04.00), lalu pagi, siang, sore, malam.
function urutan(tanggal) {
  const h = cuacaHari(tanggal).blok, k = cuacaHari(kemarin(tanggal)).blok;
  return [{ mulai: -330, jenis: k[3] }, ...BLOK.map((b, i) => ({ mulai: b.mulai, jenis: h[i] }))];
}

/** Cuaca pada satu saat. Dini hari (sebelum 04.00) masih blok malam dari tanggal sebelumnya. */
export function cuacaSaat(tanggal, menit) {
  const m = norm(menit), u = urutan(tanggal);
  let i = 0;
  for (let k = 0; k < u.length; k++) if (m >= u[k].mulai) i = k;
  return { jenis: u[i].jenis, blok: i === 0 ? 'malam' : BLOK[i - 1].id };
}

/** Angka tampilan 0..1 (awan, hujan, kabut, redup), berpindah halus di sekitar batas blok. */
export function efekCuaca(tanggal, menit) {
  const m = norm(menit), u = urutan(tanggal), s = TRANSISI_CUACA / 2;
  let i = 0;
  for (let k = 0; k < u.length; k++) if (m >= u[k].mulai) i = k;
  let a = EFEK[u[i].jenis], b = a, t = 0;
  if (i > 0 && m - u[i].mulai < s) { a = EFEK[u[i - 1].jenis]; b = EFEK[u[i].jenis]; t = halus((m - u[i].mulai + s) / TRANSISI_CUACA); }
  else if (i < u.length - 1 && u[i + 1].mulai - m <= s) { b = EFEK[u[i + 1].jenis]; t = halus((s - (u[i + 1].mulai - m)) / TRANSISI_CUACA); }
  const o = {};
  for (const k of Object.keys(a)) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
}

/** Efek untuk satu jenis cuaca (dipakai opsi "Kunci suasana"). */
export const efekJenis = (jenis) => ({ ...(EFEK[jenis] || EFEK.cerah) });
