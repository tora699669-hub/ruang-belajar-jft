// Rapor sebagai peta kekuatan. Fungsi murni dari potret data; tidak menghitung nilai baru untuk rapor asli.

const rata = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const batas = (v) => (v == null || !Number.isFinite(v) ? null : Math.max(0, Math.min(100, Math.round(v))));

/** Tren dari tiga hasil terakhir dibanding tiga sebelumnya. Butuh minimal enam hasil. */
export function tren(riwayat) {
  if (!Array.isArray(riwayat) || riwayat.length < 6) return null;
  const akhir = rata(riwayat.slice(-3)), dulu = rata(riwayat.slice(-6, -3)), d = akhir - dulu;
  return d >= 5 ? 'naik' : d <= -5 ? 'turun' : 'tetap';
}

export function petaKekuatan(snap) {
  const s = snap || {};
  const sim = Object.values((s.sim && s.sim.best) || {}).map(Number).filter(Number.isFinite);
  const bp = s.bunpou && s.bunpou.total && s.bunpou.pass ? (s.bunpou.pass / s.bunpou.total) * 100 : null;   // belum ada pola lulus = belum ada data, bukan 'lemah'
  const kt = s.kartu && s.kartu.total ? (s.kartu.ulang / s.kartu.total) * 100 : null;
  return [
    { id: 'kotoba', nama: 'Kotoba', nilai: batas(s.kotoba && s.kotoba.n ? s.kotoba.avg : null), tren: tren(s.kotoba && s.kotoba.riwayat), zona: 'pasar_kotoba', ket: 'Rata-rata tes kotoba' },
    { id: 'kanji', nama: 'Kanji', nilai: batas(s.kanji && s.kanji.n ? s.kanji.avg : null), tren: tren(s.kanji && s.kanji.riwayat), zona: 'gua', ket: 'Rata-rata tes kanji' },
    { id: 'kerja', nama: 'Kata kerja', nilai: batas(s.verb && s.verb.n ? s.verb.pct : null), tren: null, zona: 'menara', ket: 'Ketepatan drill kata kerja' },
    { id: 'bunpou', nama: 'Bunpou', nilai: batas(bp), tren: null, zona: 'menara', ket: 'Pola yang sudah lulus' },
    { id: 'simulasi', nama: 'Simulasi', nilai: batas(rata(sim)), tren: null, zona: 'arena', ket: 'Rata-rata nilai terbaik paket yang sudah dikerjakan' },
    { id: 'kartu', nama: 'Kartu hafalan', nilai: batas(kt), tren: null, zona: 'pasar_kotoba', ket: 'Kartu yang sudah pernah diulang' },
  ];
}

export const tingkat = (nilai) => (nilai == null ? 'kosong' : nilai >= 75 ? 'kuat' : nilai >= 60 ? 'cukup' : 'lemah');
