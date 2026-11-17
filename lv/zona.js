// Peta dunia Kota Akimichi: 11 zona, 10 NPC guru, dan pintu tiap zona.
// Pintu dengan `rute` memanggil halaman aplikasi yang sudah ada (itulah fallback 2D tiap zona).
// Pintu dengan `panel` membuka panel di dalam dunia. Pintu dengan `zona` pindah zona.

export const NPC = {
  tora: { nama: 'Tora Sensei', berkas: 'npc_tora.glb', peran: 'Kepala guru, pemandu utama',
    sapa: ['ようこそ！ Selamat datang di Kota Akimichi.', 'Bingung mulai dari mana? Lihat papan misi dulu, satu langkah kecil tiap hari.', 'がんばって！ Ujiannya makin dekat, tapi kamu nggak sendirian.'] },
  chacha: { nama: 'Cha Cha Sensei', berkas: 'npc_chacha.glb', peran: 'Pemberi misi harian',
    sapa: ['おはよう！ Misi hari ini sudah aku tempel di papan.', 'Tiga misi kecil saja. Beres itu, beruntunmu aman.', 'Kalau lagi sibuk, kerjakan satu dulu. Yang penting mulai.'] },
  iqbal: { nama: 'Iqbal Sensei', berkas: 'npc_iqbal.glb', peran: 'Guru Irodori, pemandu Hutan Irodori',
    sapa: ['Hutan ini punya enam jalur, Bab 13 sampai 18. Pilih yang mau kamu jelajahi.', 'Bab yang sudah kamu kerjakan jalurnya jadi lebih terang.', 'ゆっくりでいいよ。 Pelan-pelan nggak apa-apa, asal jalan terus.'] },
  putu: { nama: 'Putu Sensei', berkas: 'npc_putu.glb', peran: 'Guru Kanji, penjaga Gua Kanji',
    sapa: ['Di gua ini, kanji yang kamu kuasai akan menyala.', 'Kanji muncul di hampir semua bagian JFT. Sedikit tiap hari paling awet.', 'Berani coba Kanji 5 Detik? Itu cuma buat seru-seruan, kok.'] },
  angga: { nama: 'Angga Sensei', berkas: 'npc_angga.glb', peran: 'Guru Bunpou, penjaga Menara Bunpou',
    sapa: ['Setiap pola yang kamu kuasai membuka satu lantai menara.', 'Bunpou itu kunci buat memahami kalimat panjang. Naik satu lantai dulu hari ini.', 'Lupa bentuk kata kerja? Mampir ke ruang Ubah Kata Kerja.'] },
  dika: { nama: 'Dika Sensei', berkas: 'npc_dika.glb', peran: 'Penjaga Arena Simulasi',
    sapa: ['Sembilan gerbang, sembilan paket simulasi. Waktunya berjalan seperti ujian asli.', 'Jangan takut nilainya. Yang dicari itu bagian mana yang masih lemah.', 'Siapkan waktu yang tenang sebelum masuk gerbang, ya.'] },
  kevin: { nama: 'Kevin Sensei', berkas: 'npc_kevin.glb', peran: 'Guru Duel, pelatih Panggung Duel',
    sapa: ['よし！ Mau latihan duel? Kanji jadi mantra, kosakata jadi kartu.', 'Duel di sini buat pemanasan. Nggak ada EXP atau Koin, jadi santai saja.', 'Kalah itu biasa. Yang penting tahu jawaban yang benar.'] },
  pia: { nama: 'Pia Sensei', berkas: 'npc_pia.glb', peran: 'Guru Choukai, penjaga Ruang Dengar',
    sapa: ['Ruang Dengar masih disiapkan. Audionya belum lengkap.', 'Sambil menunggu, biasakan telinga dengan audio di Latihan Bab.', 'もうすこし待ってね。 Tunggu sebentar lagi, ya.'] },
  dede: { nama: 'Dede Sensei', berkas: 'npc_dede.glb', peran: 'Pemandu Balai Rapor',
    sapa: ['Di balai ini kamu bisa lihat peta kekuatanmu.', 'Panah naik artinya membaik. Panah turun artinya perlu diulang, bukan gagal.', 'Lencanamu juga dipajang di sini.'] },
  ara: { nama: 'Ara Sensei', berkas: 'npc_ara.glb', peran: 'Penjual di Pasar Toko',
    sapa: ['いらっしゃいませ！ Selamat datang di Pasar Toko.', 'Koin datang dari belajar. Lihat-lihat dulu juga boleh.', 'Barang baru masih menunggu harga dari Sensei, jadi sementara pajangan dulu.'] },
};

const P = (id, label, o) => ({ id, label, ...o });

export const ZONA = [
  { id: 'gerbang', nama: 'Gerbang Login', kanji: '門', tema: 'gerbang', npc: ['tora'], ringkas: 'Pintu masuk Kota Akimichi.',
    pintu: [P('masuk', 'Masuk ke kota', { zona: 'plaza', ikon: '入' })] },
  { id: 'plaza', nama: 'Plaza Beranda', kanji: '広', tema: 'plaza', npc: ['tora', 'chacha'], ringkas: 'Titik awal. Papan misi harian ada di sini.',
    pintu: [P('papan', 'Papan misi', { panel: 'quest', ikon: '札' }), P('harian', 'Kerjakan Misi Harian', { rute: 'harian', ikon: '日' }),
      P('latihan', 'Pusat Latihan', { rute: 'latihan', ikon: '試' }), P('peta', 'Peta kota', { panel: 'peta', ikon: '図' }), P('bantuan', 'Bantuan', { rute: 'bantuan', ikon: '助' })] },
  { id: 'hutan', nama: 'Hutan Irodori', kanji: '森', tema: 'hutan', npc: ['iqbal'], ringkas: 'Satu jalur untuk tiap bab, 13 sampai 18.',
    pintu: [P('bab', 'Latihan Bab 13–18', { rute: 'irodori', ikon: '基' }), P('ujian', 'Ujian per Bab', { rute: 'jft', ikon: '試' }), P('jalur', 'Lihat jalur bab', { panel: 'bab', ikon: '道' })] },
  { id: 'gua', nama: 'Gua Kanji', kanji: '洞', tema: 'gua', npc: ['putu'], ringkas: 'Tes kanji wajib dan Kanji 5 Detik.',
    pintu: [P('wajib', 'Kartu Kanji Wajib', { rute: 'kwajib', ikon: '必' }), P('tes', 'Tes Kanji dan Kotoba', { rute: 'kotoba', ikon: '語' }), P('lima', 'Kanji 5 Detik', { rute: 'game', ikon: '秒' })] },
  { id: 'pasar_kotoba', nama: 'Pasar Kotoba', kanji: '語', tema: 'pasar', npc: [], ringkas: 'Kosakata Irodori, Kamus, dan kartu koleksi.',
    pintu: [P('kosa', 'Kosakata Irodori', { rute: 'kosa', ikon: '語' }), P('kamus', 'Kamus Irodori', { rute: 'kamus', ikon: '辞' }), P('hafal', 'Kartu Hafalan', { rute: 'hafalan', ikon: '暗' }), P('koleksi', 'Kartu koleksiku', { panel: 'kartu', ikon: '札' })] },
  { id: 'menara', nama: 'Menara Bunpou', kanji: '塔', tema: 'menara', npc: ['angga'], ringkas: 'Satu pola dikuasai, satu lantai terbuka.',
    pintu: [P('latihan', 'Latihan Bunpou', { rute: 'bunlat', ikon: '文' }), P('kartu', 'Kartu Bunpou', { rute: 'bunfc', ikon: '札' }), P('kerja', 'Ubah Kata Kerja', { rute: 'verb', ikon: '動' }), P('lantai', 'Lihat lantai menara', { panel: 'lantai', ikon: '階' })] },
  { id: 'arena', nama: 'Arena Simulasi', kanji: '闘', tema: 'arena', npc: ['dika'], ringkas: 'Sembilan paket simulasi JFT dengan timer.',
    pintu: [P('boss', 'Gerbang boss', { panel: 'boss', ikon: '総' }), P('sim', 'Masuk Simulasi JFT', { rute: 'simulasi', ikon: '試' }), P('moji', 'Latihan Moji-goi', { rute: 'moji', ikon: '文' }), P('kaiwa', 'Latihan Kaiwa', { rute: 'kaiwa', ikon: '話' }), P('dokkai', 'Latihan Dokkai', { rute: 'dokkai', ikon: '読' })] },
  { id: 'panggung', nama: 'Panggung Duel', kanji: '舞', tema: 'panggung', npc: ['kevin'], ringkas: 'Lawan NPC. Kanji dan kosakata jadi serangan.',
    pintu: [P('duel', 'Duel lawan Kevin Sensei', { panel: 'duel', ikon: '剣' }), P('taman', 'Taman Bermain', { rute: 'game', ikon: '遊' })] },
  { id: 'ruang_dengar', nama: 'Ruang Dengar', kanji: '聴', tema: 'studio', npc: ['pia'], ringkas: 'Choukai. Segera hadir setelah audio siap.',
    pintu: [P('choukai', 'Choukai (segera hadir)', { terkunci: 'Audio Choukai sedang disiapkan. Zona ini dibuka setelah audionya lengkap.', ikon: '聴' })] },
  { id: 'pasar_toko', nama: 'Pasar Toko', kanji: '店', tema: 'toko', npc: ['ara'], ringkas: 'Toko karakter dan barang.',
    pintu: [P('toko', 'Toko dan Karakter', { rute: 'karakter', ikon: '人' }), P('katalog', 'Lihat katalog', { panel: 'katalog', ikon: '品' })] },
  { id: 'balai', nama: 'Balai Rapor', kanji: '館', tema: 'balai', npc: ['dede'], ringkas: 'Peta kekuatan, lencana, dan peringkat.',
    pintu: [P('kekuatan', 'Peta kekuatan', { panel: 'kekuatan', ikon: '力' }), P('lencana', 'Lencanaku', { panel: 'lencana', ikon: '章' }), P('rapor', 'Rapor lengkap', { rute: 'progres', ikon: '進' }), P('peringkat', 'Peringkat', { rute: 'peringkat', ikon: '冠' })] },
];

export const URUTAN_PETA = ['plaza', 'hutan', 'gua', 'pasar_kotoba', 'menara', 'arena', 'panggung', 'ruang_dengar', 'pasar_toko', 'balai', 'gerbang'];
const INDEKS = Object.fromEntries(ZONA.map((z) => [z.id, z]));
export const zonaDari = (id) => INDEKS[id] || null;
export const pintuDari = (id) => (INDEKS[id] ? INDEKS[id].pintu : []);
