// Quest = cara menampilkan latihan yang sudah ada. Fungsi murni: tidak menyimpan dan tidak memberi hadiah.
// Teks hadiah menulis apa yang memang diberikan rumus aplikasi sekarang (lihat xpOf di shell.js dan
// aturan Koin di game.js), supaya tidak ada janji yang tidak ditepati.

export const PAKET_SIMULASI = [1, 2, 3, 4, 5, 6, 7, 9, 10];
export const BATAS_TAKLUK = 60; // persen: paket dianggap takluk kalau nilai terbaik mencapai ini

const KOIN = 'Koin ikut otomatis: 1 Koin tiap 5 EXP (maksimal 60 per hari).';
const HADIAH_HARIAN = {
  kartu: '2 EXP per kartu yang diulang. ' + KOIN,
  tes: '5 EXP per jawaban benar, 10 EXP saat selesai, bonus 15 EXP untuk tes harian. ' + KOIN,
  drill: 'EXP sesuai hasil drill. ' + KOIN,
};

export function susunQuest(snap) {
  const s = snap || {}, q = [];
  for (const m of Array.isArray(s.misi) ? s.misi : []) {
    q.push({ id: 'harian:' + m.id, jenis: 'harian', judul: m.t, tujuan: m.why || 'Selesaikan misi ini hari ini.', hadiah: HADIAH_HARIAN[m.id] || 'EXP sesuai hasil. ' + KOIN,
      selesai: !!m.done, kemajuan: m.prog || '', rute: 'harian', zona: 'plaza', pemberi: 'chacha' });
  }
  for (const p of Array.isArray(s.pondasi) ? s.pondasi : []) {
    q.push({ id: 'pondasi:' + p.id, jenis: 'pondasi', judul: p.t, tujuan: p.why || 'Latihan pondasi tambahan.', hadiah: 'Tanpa EXP dan Koin. Hasilnya tercatat di Rapor.',
      selesai: !!p.done, kemajuan: '', rute: 'harian', zona: 'plaza', pemberi: 'chacha' });
  }
  const best = (s.sim && s.sim.best) || {};
  for (const n of PAKET_SIMULASI) {
    const b = best[n] == null ? null : Math.round(+best[n]);
    q.push({ id: 'boss:' + n, jenis: 'boss', paket: n, judul: 'Boss Simulasi ' + n, tujuan: `Kerjakan Paket Simulasi ${n} sampai selesai. Takluk kalau nilainya ${BATAS_TAKLUK}% atau lebih.`,
      hadiah: 'Grafik hasil per bagian setelah selesai. Nilai terbaik tercatat.', selesai: b != null && b >= BATAS_TAKLUK, terbaik: Number.isFinite(b) ? b : null, kemajuan: b == null ? '' : 'terbaik ' + b + '%', rute: 'simulasi', zona: 'arena', pemberi: 'dika' });
  }
  return q;
}

export function ringkasQuest(q) {
  const hitung = (j) => { const x = q.filter((y) => y.jenis === j); return { selesai: x.filter((y) => y.selesai).length, total: x.length }; };
  return { harian: hitung('harian'), pondasi: hitung('pondasi'), boss: hitung('boss') };
}
