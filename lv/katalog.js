// Katalog toko JFT Leveling. HANYA TAMPILAN.
// - Barang lama (dari game.js) tetap dengan harga dan mata uang aslinya, dan tetap dibeli di Toko yang sudah ada.
// - Barang usulan belum punya harga dan tidak bisa dibeli, sampai Sensei memutuskan harganya.
// Modul ini tidak menyentuh saldo, kepemilikan, atau aturan ekonomi.

export const RARITY = ['biasa', 'langka', 'eksklusif'];
export const NAMA_RARITY = { biasa: 'Biasa', langka: 'Langka', eksklusif: 'Eksklusif' };

export const KATEGORI = [
  { id: 'pose', nama: 'Pose' }, { id: 'efek', nama: 'Efek karakter' }, { id: 'lencana', nama: 'Tag dan lencana' },
  { id: 'rambut', nama: 'Rambut' }, { id: 'hijab', nama: 'Hijab' }, { id: 'baju', nama: 'Baju' }, { id: 'bawahan', nama: 'Celana dan rok' },
  { id: 'sepatu', nama: 'Sepatu' }, { id: 'tas', nama: 'Tas' }, { id: 'aksesori', nama: 'Aksesori' },
  { id: 'latar', nama: 'Latar tempat' }, { id: 'suasana', nama: 'Pencahayaan dan suasana' },
];

/** Lima tingkat data lama -> tiga tingkat tampilan. */
export const rarityTampil = (r) => (r === 'epic' ? 'langka' : r === 'legendary' || r === 'mythic' ? 'eksklusif' : 'biasa');

/** Aturan rarity lama, ditiru persis dari game.js (diuji terhadap rumus aslinya). */
export const rarityLama = (x) => (x.cur === 'P' ? (x.price >= 5 ? 'mythic' : 'legendary') : x.ex ? 'legendary' : x.price <= 0 ? 'basic' : x.price <= 200 ? 'normal' : x.price <= 520 ? 'epic' : 'legendary');

/** Slot lama -> kategori baru. */
export function kategoriLama(x) {
  if (x.slot === 'topi') return /^t_hijab/.test(x.id) ? 'hijab' : 'aksesori';
  if (x.slot === 'aksesori') return /^a_(tas|ransel)/.test(x.id) ? 'tas' : 'aksesori';
  return { baju: 'baju', celana: 'bawahan', sepatu: 'sepatu', rambut: 'rambut', pose: 'pose', wajah: 'aksesori' }[x.slot] || 'aksesori';
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const USUL = [];
function u(kategori, untuk, sub, daftar) {
  for (const rarity of RARITY) for (const nama of daftar[rarity] || []) USUL.push({ id: 'u_' + kategori + '_' + slug(nama) + (untuk === 'semua' ? '' : '_' + untuk[0]), nama, kategori, untuk, sub: sub || '', rarity });
}
u('pose', 'semua', 'berdiri', { biasa: ['Berdiri santai', 'Tangan di saku'], langka: ['Bersandar', 'Tangan di pinggang'], eksklusif: ['Pose pahlawan'] });
u('pose', 'semua', 'duduk', { biasa: ['Duduk bersila', 'Duduk di bangku'], langka: ['Seiza', 'Duduk membaca'], eksklusif: ['Duduk di awan kecil'] });
u('pose', 'semua', 'hormat', { biasa: ['Ojigi ringan', 'Melambai sopan'], langka: ['Ojigi dalam', 'Salam tangan di dada'], eksklusif: ['Hormat upacara'] });
u('pose', 'semua', 'semangat', { biasa: ['Kepal tangan', 'Hore kecil'], langka: ['Lompat kecil', 'Peace ceria'], eksklusif: ['Pose juara'] });
u('pose', 'semua', 'berpikir', { biasa: ['Tangan di dagu'], langka: ['Menggaruk kepala', 'Melihat buku'], eksklusif: ['Berpikir dengan tanda tanya'] });
u('efek', 'semua', '', { biasa: ['Kilau halus'], langka: ['Aura lembut', 'Jejak cahaya'], eksklusif: ['Percikan sakura', 'Percikan bintang', 'Aura emas'] });
u('lencana', 'semua', '', { biasa: ['Murid Rajin', 'Pecinta Kanji'], langka: ['Jago Bunpou', 'Raja Kotoba', 'Ninja Kana'], eksklusif: ['Lulus Simulasi', 'Juara Duel', 'Beruntun 30 Hari'] });
u('rambut', 'pria', '', { biasa: ['Cepak rapi', 'Belah tengah'], langka: ['Two block', 'Ikal pendek', 'Comma hair'], eksklusif: ['Ikat samurai'] });
u('rambut', 'wanita', '', { biasa: ['Lurus panjang', 'Sebahu rapi', 'Bob pendek'], langka: ['Kuncir tinggi', 'Kepang dua', 'Sanggul rendah'], eksklusif: ['Kepang hias bunga'] });
u('hijab', 'wanita', '', { biasa: ['Hijab polos putih', 'Hijab polos navy', 'Hijab polos abu'], langka: ['Hijab motif garis', 'Pashmina krem'], eksklusif: ['Hijab motif sakura'] });
u('baju', 'pria', '', { biasa: ['Kaos lengan panjang', 'Kemeja putih sekolah'], langka: ['Kemeja flanel', 'Sweater rajut', 'Koko modern'], eksklusif: ['Haori musim gugur', 'Jinbei festival'] });
u('baju', 'wanita', '', { biasa: ['Blus lengan panjang', 'Tunik polos'], langka: ['Cardigan rajut', 'Tunik batik', 'Gamis harian'], eksklusif: ['Yukata lengan panjang', 'Gamis festival'] });
u('bawahan', 'pria', '', { biasa: ['Celana bahan abu', 'Chino krem'], langka: ['Celana kulot pria', 'Jogger hitam'], eksklusif: ['Hakama hitam'] });
u('bawahan', 'wanita', '', { biasa: ['Celana panjang hitam', 'Rok lipit selutut'], langka: ['Rok panjang plisket', 'Kulot lebar'], eksklusif: ['Rok batik panjang', 'Hakama merah marun'] });
u('sepatu', 'pria', '', { biasa: ['Sneakers hitam', 'Sandal gunung'], langka: ['Sepatu pantofel cokelat', 'Sneakers tinggi putih'], eksklusif: ['Geta hitam', 'Boots kulit'] });
u('sepatu', 'wanita', '', { biasa: ['Sneakers krem', 'Flat shoes hitam'], langka: ['Loafer cokelat', 'Boots pendek krem'], eksklusif: ['Zori merah', 'Sneakers pelangi'] });
u('tas', 'pria', '', { biasa: ['Ransel hitam', 'Tas selempang kanvas'], langka: ['Tas kurir', 'Tas olahraga'], eksklusif: ['Randoseru hitam', 'Tas furoshiki biru'] });
u('tas', 'wanita', '', { biasa: ['Ransel krem', 'Tote kanvas'], langka: ['Tas selempang kecil', 'Tas buku'], eksklusif: ['Randoseru merah', 'Tas kinchaku'] });
u('latar', 'semua', '', { biasa: ['Ruang kelas', 'Taman kota'], langka: ['Stasiun kereta', 'Kedai ramen', 'Perpustakaan'], eksklusif: ['Kuil saat matsuri', 'Jalan sakura'] });
u('suasana', 'semua', '', { biasa: ['Pagi cerah'], langka: ['Senja jingga', 'Malam berlentera'], eksklusif: ['Hujan sakura', 'Langit kembang api'] });

export const USULAN = Object.freeze(USUL.map((x) => Object.freeze(x)));

/** Gabungkan barang lama (apa adanya) dengan barang usulan untuk ditampilkan. */
export function gabungKatalog(itemsLama) {
  const lama = (itemsLama || []).map((x) => ({ id: x.id, nama: x.name, kategori: kategoriLama(x), untuk: x.bd === 'P' ? 'wanita' : x.bd === 'L' ? 'pria' : 'semua', sub: '',
    rarity: rarityTampil(x.rar || rarityLama(x)), status: 'ada', harga: x.price, mataUang: x.cur, bisaDibeli: true, hadiahPencapaian: !!x.ex }));
  const usul = USULAN.map((x) => ({ ...x, status: 'usulan', harga: null, mataUang: null, bisaDibeli: false, hadiahPencapaian: false }));
  return [...lama, ...usul];
}
