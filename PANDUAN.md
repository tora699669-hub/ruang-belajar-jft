# Panduan Pasang Ruang Belajar JFT (Supabase + Netlify)

## 1. Supabase (data + login Google)
1. Buka supabase.com, buat project baru (gratis).
2. Menu SQL Editor, buka schema.sql, ganti `GURU_EMAIL_DI_SINI` dengan email Google guru, lalu Run.
3. Menu Project Settings, API: salin **Project URL** dan **anon public key**. JANGAN pakai service_role key.
4. Isi keduanya di config.js.

## 2. Google login
1. console.cloud.google.com, buat OAuth Client ID (Web application).
2. Authorized redirect URI: `https://<project-id>.supabase.co/auth/v1/callback`
3. Supabase, Authentication, Providers, Google: aktifkan, tempel Client ID dan Secret.
4. Authentication, URL Configuration: Site URL dan Redirect URLs diisi alamat Netlify.

## 3. Netlify
1. app.netlify.com, Add new site, Deploy manually.
2. Seret folder ini (isi zip yang sudah diekstrak) ke halaman itu.
3. Salin alamat situs ke langkah Google login nomor 4.

## Catatan
- Supabase gratis di-pause kalau 7 hari tidak aktif. Buka aplikasinya tiap minggu.
- Data lama di artifact tidak ikut pindah (id akun berbeda).
- Tes audio choukai di iPhone asli dulu sebelum hari H.

## Pembaruan v2 (fitur game) — wajib sekali
1. Supabase > SQL Editor > New query.
2. Salin isi schema_v2.sql, tempel, Run.
3. Deploy ulang folder ini ke Netlify.
Tanpa langkah ini, avatar dan Koin hanya tersimpan di HP masing-masing dan papan peringkat kosong.

## Pembaruan v3 (Bab 14, Latihan Bunpou, penghargaan bertingkat)
- Tidak ada SQL baru. Cukup deploy ulang folder ini ke Netlify (seret zip).
- Bab 14: 3 ujian (Dasar, Standar, Remedial), 25 soal tiap ujian, 7 audio choukai baru (folder audio/t14-*).
- Nama ujian sekarang: "Bab 13 · Ujian Dasar", "Bab 13 · Ujian Standar", "Bab 13 · Ujian Remedial", dan yang sama untuk Bab 14. Riwayat lama tetap aman (kode paket A, B, R tidak berubah).
- Remedial per bab: dibuka lewat tombol Remedial yang sama di panel guru, murid hanya melihatnya kalau belum lulus bab itu.
- Latihan Bunpou (perubahan kata kerja) tersimpan di dokumen game murid. Papan "Ninja Bunpou" muncul setelah murid menjawab minimal 20 soal.
- Penghargaan: 103 buah, bertingkat. Login harian dicatat di dokumen game.

## Pembaruan v4 (desain BlokKit, Misi Harian wajib, batsu, aturan ujian)
- Deploy ulang folder ini ke Netlify. Tidak ada SQL wajib untuk fitur ini.
- Pengingat 20:30 butuh langkah tambahan di Supabase: lihat paket terpisah `pengingat_supabase.zip` (JANGAN diunggah ke Netlify).
- Kartu persetujuan data sudah dihapus. Di versi Netlify, hasil otomatis tersimpan begitu murid masuk akun.
- Jatah percobaan per ujian: default 3 kali (1 kali pertama + 2 kali ulang). Bisa diubah di Panel Guru > Latihan Bab > Kelulusan dan remedial.

## Pembaruan v5 (perbaikan Permata, Misi Harian, baju 3D)
Tidak ada SQL baru. Cukup unggah ulang folder ini ke Netlify (Deploys > drag and drop).
- Permata dicatat per transaksi (grant/{uid}/{id}), jadi saldo murid dan Sensei selalu sama dan tidak bisa saling menimpa. Saldo lama tetap dihitung.
- Setelah menekan +1/+5, aplikasi membaca ulang dari server. Kalau gagal, pesan error menjelaskan sebabnya. Tombol −1 untuk koreksi.
- Misi Harian: tombol Gas langsung membuka tugasnya (kartu terisi otomatis 10 kata, tes langsung mulai, kata kerja langsung jalan) dan ada tombol Lanjut.
- Karakter 3D sekarang menampilkan baju, celana, topi, dan aksesori yang dipakai.

## Pembaruan v6 (karakter semi-realistis, outfit lengkap, ekonomi diperketat)
Tidak ada SQL baru. Cukup unggah ulang folder ini ke Netlify (Deploys > drag and drop).
- Karakter 3D baru (cowok/cewek) dengan badan, wajah, rambut, tangan, dan outfit yang menyesuaikan bentuk tubuh. Cadangan otomatis ke tampilan lama kalau HP murid tidak mendukung WebGL.
- Katalog baru: baju, celana/rok, sepatu, gaya rambut, topi (termasuk hijab, peci, caping), kacamata/masker, aksesori, pose, serta 12 set. Item tertentu khusus cowok atau cewek.
- Koin dari belajar: 1 Koin tiap 5 EXP, maksimal 60 Koin per hari. Saldo Koin lama dibawa utuh (dicatat otomatis saat murid pertama kali membuka versi ini). Hadiah penghargaan baru bernilai 30% dari sebelumnya; yang sudah diambil tetap dihitung nilai lama.
- Hadiah Peringkat 1 sampai 5: 🪙60💎3, 🪙40💎2, 🪙30💎1, 🪙20💎1, 🪙10. Tombol Sensei: +1, +2, −1. Kalau murid sudah dapat 5 💎 atau lebih dalam 7 hari, aplikasi minta tekan sekali lagi untuk konfirmasi.
- Harga item: biasa 90 sampai 700 Koin, set 970 sampai 2040 Koin, eksklusif 2 sampai 14 Permata.

## v6.1 — poles karakter
Wajah lebih berkontur (bayangan pipi/rahang, highlight dahi & hidung), mata lebih besar dan dalam, bulu mata lebih tebal, hidung lebih halus, tekstur rambut lebih halus, bahu baju lebih rapi. Tidak ada perubahan Koin/Permata atau data murid.

## v7 — Koleksi BlokKit (karakter set, pose gerak, badge)
Tab baru **Koleksi** di halaman Karakter, memakai sistem desain BlokKit buatan Sensei.

| Isi | Jumlah | Harga |
|---|---|---|
| Karakter set utuh | 36 | Basic 🪙500, Normal 🪙900, Epic 🪙1600, Legendary 💎10, Mythic 💎20 |
| Pose gerak | 11 | Diam gratis; Normal 🪙200-250; Epic 🪙400-450; Legendary 💎3-4; Mythic 💎6-8 |
| Badge | 12 | Basic 🪙150; Normal 🪙300-350; Epic 🪙600-650; Legendary 💎3-5; Mythic 💎8 |

- Karakter BlokKit menggantikan avatar biasa (kulit/rambut/baju biasa tidak tampil). Tombol "Pakai avatar biasa" mengembalikannya.
- Efek rarity jalan otomatis: glow, cincin, api aura, partikel, cape (Legendary), sayap dan halo pelangi (Mythic).
- Pose dan badge hanya tampil di karakter BlokKit. Murid bisa Coba semua tanpa beli.
- Pratinjau kecil melayang muncul saat murid menggulir daftar, supaya pose tetap kelihatan.
- Data tersimpan di dokumen game murid (`kit` dan `owned`), tidak mengubah rumus Koin/Permata.
- Perangkat lemah otomatis dikurangi efeknya supaya tidak berat. Pengaturan "kurangi gerakan" di HP dihormati (ada tombol Mainkan gerak).

## v8 – Tingkat kesulitan
Tiap kartu paket sekarang punya label: Mudah (Ujian Dasar dan Remedial), Sedang (Ujian Standar). Label Sulit sudah disiapkan tapi paketnya belum ada. Ujian Standar menampilkan saran "capai 70% di Ujian Dasar dulu" kalau skor Dasar murid belum 70%. Ini saran, bukan kunci. Sensei tidak melihat saran itu.
