// Duel lawan NPC. Mesin keadaan murni: jawaban benar jadi serangan (kanji = mantra, kosakata = kartu).
// Murni hiburan, sama seperti Duel dan Taman Bermain yang sudah ada: tidak memberi EXP, Koin, atau Permata.

export const LAWAN = {
  kevin1: { nama: 'Kevin Sensei · Pemanasan', hp: 5, soal: 10, jenis: 'kosakata' },
  kevin2: { nama: 'Kevin Sensei · Latihan', hp: 6, soal: 12, jenis: 'campur' },
  kevin3: { nama: 'Kevin Sensei · Serius', hp: 8, soal: 14, jenis: 'kanji' },
};
const NYAWA = 3;

export function mulaiDuel({ soal, lawan }) {
  const L = LAWAN[lawan] || LAWAN.kevin1;
  return Object.freeze({ lawan: LAWAN[lawan] ? lawan : 'kevin1', namaLawan: L.nama, soal: (soal || []).slice(0, L.soal), i: 0, hpLawan: L.hp, hpLawanMaks: L.hp,
    hpPemain: NYAWA, hpPemainMaks: NYAWA, benar: 0, salah: 0, selesai: !(soal && soal.length), menang: false, terakhir: null, hadiah: null });
}

export function jawab(d, pilihan) {
  if (d.selesai) return d;
  const q = d.soal[d.i], benar = pilihan === q.a;
  const hpLawan = d.hpLawan - (benar ? 1 : 0), hpPemain = d.hpPemain - (benar ? 0 : 1), i = d.i + 1;
  const habis = i >= d.soal.length;
  const selesai = hpLawan <= 0 || hpPemain <= 0 || habis;
  return Object.freeze({ ...d, i, hpLawan, hpPemain, benar: d.benar + (benar ? 1 : 0), salah: d.salah + (benar ? 0 : 1), selesai, menang: hpLawan <= 0,
    terakhir: { benar, pilihan, kunci: q.a, serangan: benar ? (q.jenis === 'kanji' ? 'mantra' : 'kartu') : 'lawan', soal: q } });
}
