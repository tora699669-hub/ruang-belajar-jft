// Pustaka benda dan resep tiap zona. Semua bentuk dibuat dari kode lalu digabung per bahan (hemat draw call).
// Data kemajuan (lantai menara, kanji menyala, boss takluk) hanya dipakai untuk menyalakan hiasan.
import * as THREE from './vendor/three/three.min.js';
import { mergeGeometries } from './vendor/three/addons/utils/BufferGeometryUtils.js';
import { buatGerbang } from './gerbang.js';

const srgb = (h) => new THREE.Color().setStyle(h, THREE.SRGBColorSpace);
const std = (warna, kasar = 0.9, o = {}) => new THREE.MeshStandardMaterial({ color: srgb(warna), roughness: kasar, ...o });

function teksturPaving(dasar = '#8d8983') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = dasar; g.fillRect(0, 0, 256, 256);
  let s = 4242; const acak = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < 4; y++) for (let x = -1; x < 4; x++) {
    const ox = (y % 2) * 32, t = 150 + Math.floor(acak() * 36);
    g.fillStyle = `rgb(${t + 6},${t + 2},${t - 4})`; g.fillRect(x * 64 + ox + 2, y * 64 + 2, 60, 60);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

export function teksturTeks(baris, o = {}) {
  const w = o.w || 256, h = o.h || 128, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = o.latar || '#fbf4e6'; g.beginPath(); g.roundRect(3, 3, w - 6, h - 6, 18); g.fill();
  g.lineWidth = 6; g.strokeStyle = o.tepi || '#b8322a'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const jp = '"Noto Sans JP","Hiragino Sans","Yu Gothic",system-ui,sans-serif';
  if (baris.length === 1) { g.fillStyle = o.warna || '#2a2320'; g.font = `700 ${o.besar || 64}px ${jp}`; g.fillText(baris[0], w / 2, h / 2 + 3); }
  else {
    g.fillStyle = o.warnaIkon || '#b8322a'; g.font = `700 ${Math.round(h * 0.42)}px ${jp}`; g.fillText(baris[0], w / 2, h * 0.36);
    g.fillStyle = o.warna || '#2a2320'; g.font = `700 ${Math.round(h * 0.215)}px ${jp}`;
    let t = baris[1]; while (g.measureText(t).width > w - 22 && t.length > 4) t = t.slice(0, -2) + '…';
    g.fillText(t, w / 2, h * 0.76);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

class Tukang {
  constructor() {
    this.grup = new THREE.Group();
    this.bahan = {
      kayu: std('#8a5230', 0.78), kayuGelap: std('#4a2d1b', 0.8), atap: std('#3e4856', 0.62), plester: std('#efe6d6', 0.92), batu: std('#8c8780', 0.95),
      batuGelap: std('#4d4a52', 0.95), daun: std('#5f9457', 0.95, { flatShading: true }), daunTua: std('#3f7448', 0.95, { flatShading: true }), sakura: std('#f3b6c6', 0.95, { flatShading: true }),
      batang: std('#5d4334', 0.95), rumah: std('#e3d5bd', 0.95), merah: std('#c2412f', 0.8), biru: std('#3d68a8', 0.8), kuning: std('#e8b84a', 0.8), hijau: std('#4f9a6a', 0.8),
      ungu: std('#7d5fb0', 0.8), putih: std('#f5f1e8', 0.85), pasir: std('#d9c59a', 1), kain: std('#b23a34', 0.9),
      kertas: std('#f2dfc4', 0.7, { emissive: srgb('#ffb056'), emissiveIntensity: 0 }), jendela: std('#6f7f8f', 0.4, { emissive: srgb('#ffc56e'), emissiveIntensity: 0 }),
      nyala: std('#ffe7a8', 0.5, { emissive: srgb('#ffd166'), emissiveIntensity: 1.6 }), kristal: std('#9fe8ff', 0.3, { emissive: srgb('#5fd0ff'), emissiveIntensity: 1.4 }),
      padam: std('#5a5f6b', 0.8), takluk: std('#3fa66a', 0.8, { emissive: srgb('#2f9a5a'), emissiveIntensity: 0.5 }), belum: std('#b5483e', 0.85),
    };
    this.tumpuk = {}; this.lampu = []; this.lepas = [];
    this._M = new THREE.Matrix4(); this._Q = new THREE.Quaternion(); this._E = new THREE.Euler();
  }
  t(kunci, geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.deleteAttribute('uv');
    this._E.set(rx, ry, rz); this._Q.setFromEuler(this._E);
    this._M.compose(new THREE.Vector3(x, y, z), this._Q, new THREE.Vector3(sx, sy, sz));
    g.applyMatrix4(this._M);
    (this.tumpuk[kunci] ||= []).push(g);
  }
  kotak(k, w, h, d, x, y, z, rx, ry, rz) { this.t(k, new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); }
  sil(k, r1, r2, h, x, y, z, n = 10, rx, ry, rz) { this.t(k, new THREE.CylinderGeometry(r1, r2, h, n), x, y, z, rx, ry, rz); }
  bola(k, r, x, y, z, sx = 1, sy = 1, sz = 1, detail = 1) { this.t(k, new THREE.IcosahedronGeometry(r, detail), x, y, z, 0, 0, 0, sx, sy, sz); }
  tanah(warna, r = 70) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), std(warna, 1));
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; m.name = 'tanah'; this.grup.add(m); this.lepas.push(m);
  }
  lantai(r, warnaDasar, ulang = 4.2, z = 0) {
    const geo = new THREE.CircleGeometry(r, 40);
    geo.attributes.uv.array.forEach((v, i, a) => { a[i] = v * ulang; });
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: teksturPaving(warnaDasar), roughness: 0.95 }));
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.014, z); m.receiveShadow = true; m.name = 'lantai'; this.grup.add(m); this.lepas.push(m);
  }
  pohon(x, z, tinggi = 1.8, jenis = 'daun', r = 1) {
    this.sil('batang', 0.09 * r, 0.14 * r, tinggi, x, tinggi / 2, z, 7);
    this.bola(jenis, 0.95 * r, x, tinggi + 0.45 * r, z); this.bola(jenis, 0.7 * r, x - 0.6 * r, tinggi + 0.1 * r, z + 0.25 * r);
    this.bola(jenis, 0.72 * r, x + 0.62 * r, tinggi + 0.15 * r, z - 0.2 * r); this.bola(jenis, 0.6 * r, x + 0.1 * r, tinggi + 0.95 * r, z + 0.1 * r);
  }
  cemara(x, z, t = 3, r = 1) {
    this.sil('batang', 0.1 * r, 0.14 * r, t * 0.35, x, t * 0.175, z, 7);
    for (let i = 0; i < 3; i++) this.t('daunTua', new THREE.ConeGeometry((1.0 - i * 0.22) * r, t * 0.42, 7), x, t * (0.42 + i * 0.24), z);
  }
  lentera(x, z, kuat = 3.2) {
    this.sil('batu', 0.2, 0.26, 0.16, x, 0.08, z, 6); this.sil('batu', 0.09, 0.11, 0.62, x, 0.47, z, 6); this.sil('batu', 0.24, 0.14, 0.1, x, 0.83, z, 6);
    this.kotak('kertas', 0.26, 0.24, 0.26, x, 1.0, z); this.t('batu', new THREE.ConeGeometry(0.34, 0.24, 4), x, 1.24, z, 0, Math.PI / 4);
    const p = new THREE.PointLight(srgb('#ffb873'), 0, 5.5, 1.8); p.position.set(x, 1.05, z + 0.3); this.grup.add(p); this.lampu.push({ l: p, kuat });
  }
  lampion(x, y, z, warna = 'merah', kuat = 0) {
    this.t(warna === 'merah' ? 'lampionM' : 'kertas', new THREE.SphereGeometry(0.2, 12, 9), x, y, z, 0, 0, 0, 1, 1.25, 1);
    this.sil('kayuGelap', 0.09, 0.09, 0.05, x, y + 0.26, z); this.sil('kayuGelap', 0.09, 0.09, 0.05, x, y - 0.26, z);
    if (kuat) { const p = new THREE.PointLight(srgb('#ffa85e'), 0, 8, 1.6); p.position.set(x, y - 0.1, z + 0.6); this.grup.add(p); this.lampu.push({ l: p, kuat }); }
  }
  rumah(x, z, w, h, d, ry = 0, dinding = 'rumah') {
    const c = Math.cos(ry), s = Math.sin(ry);
    this.kotak(dinding, w, h, d, x, h / 2, z, 0, ry);
    const miring = 0.6, pj = d * 0.62;
    for (const k of [-1, 1]) { const oz = k * d * 0.27; this.kotak('atap', w + 0.5, 0.12, pj, x + s * oz, h + pj * 0.5 * Math.sin(miring) - 0.02, z + c * oz, k * miring, ry); }
    this.kotak('kayuGelap', w, 0.14, 0.14, x, h + pj * Math.sin(miring) - 0.05, z, 0, ry);
    const n = Math.max(2, Math.round(w / 1.3));
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n - 0.5; this.kotak('jendela', 0.62, 0.72, 0.06, x + c * u * w + s * (d / 2 + 0.01), h * 0.55, z - s * u * w + c * (d / 2 + 0.01), 0, ry); }
  }
  kios(x, z, warna = 'merah', lebar = 1.9) {
    this.kotak('kayu', lebar, 0.85, 0.8, x, 0.425, z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.kotak('kayuGelap', 0.08, 2.1, 0.08, x + sx * (lebar / 2 - 0.05), 1.05, z + sz * 0.45);
    this.kotak(warna, lebar + 0.4, 0.07, 1.5, x, 2.2, z + 0.12, 0.28);
    this.kotak('putih', lebar + 0.4, 0.075, 0.25, x, 2.02, z + 0.78, 0.28);
  }
  bukit(x, z, sx, sy, sz, k = 'bukit') { this.t(k, new THREE.SphereGeometry(1, 16, 9), x, -sy * 0.35, z, 0, 0, 0, sx, sy, sz); }
  papan(teks, x, y, z, w = 1.6, h = 0.5, o = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: teksturTeks([teks], { w: 512, h: 160, latar: o.latar || '#3b2616', tepi: o.tepi || '#d8b56a', warna: o.warna || '#f6ead2', besar: o.besar || 88 }), roughness: 0.8 }));
    m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; m.name = 'papan'; this.grup.add(m); this.lepas.push(m);
  }
  selesai() {
    this.bahan.lampionM = this.bahan.lampionM || std('#d8432f', 0.65, { emissive: srgb('#ff5a2a'), emissiveIntensity: 0 });
    this.bahan.bukit = this.bahan.bukit || std('#7f9f8a', 1);
    for (const [k, daftar] of Object.entries(this.tumpuk)) {
      const mesh = new THREE.Mesh(mergeGeometries(daftar, false), this.bahan[k] || this.bahan.batu);
      mesh.name = 'statis_' + k; mesh.castShadow = !['bukit', 'jendela', 'nyala', 'kristal'].includes(k); mesh.receiveShadow = k !== 'bukit';
      this.grup.add(mesh); daftar.forEach((g) => g.dispose());
    }
    const B = this.bahan, lampu = this.lampu;
    return {
      grup: this.grup,
      terapkan(sua) {
        for (const { l, kuat } of lampu) l.intensity = kuat * sua.lampu;
        B.kertas.emissiveIntensity = 0.02 + 2.4 * sua.lampu; B.lampionM.emissiveIntensity = 0.02 + 1.1 * sua.lampu; B.jendela.emissiveIntensity = 1.6 * sua.lampu;
      },
    };
  }
}

const RESEP = {
  plaza(T) {
    T.tanah('#7fa765'); T.lantai(5.2, '#8d8983');
    T.sil('batu', 1.25, 1.35, 0.4, 0, 0.2, -6.2, 18); T.sil('biru', 1.1, 1.1, 0.06, 0, 0.4, -6.2, 18); T.sil('batu', 0.18, 0.24, 1.0, 0, 0.7, -6.2, 8); T.bola('batu', 0.22, 0, 1.3, -6.2);
    T.rumah(-5.6, -10.5, 4.4, 2.7, 3.2, 0.12); T.rumah(5.9, -11, 5.0, 3.0, 3.4, -0.1); T.rumah(0.2, -14, 5.6, 3.4, 3.6, 0);
    T.pohon(-4.6, -3.8, 1.7, 'sakura', 1.05); T.pohon(4.7, -4.0, 1.8, 'sakura', 1.1); T.pohon(-7.5, -7, 2.2, 'daun', 1.3); T.pohon(7.6, -7.5, 2.3, 'daun', 1.35);
    T.lentera(-3.3, -1.0); T.lentera(3.3, -1.0);
    for (const sx of [-1, 1]) { T.kotak('kayu', 1.5, 0.08, 0.4, sx * 4.3, 0.42, 0.6, 0, sx * 0.5); T.kotak('kayuGelap', 1.3, 0.4, 0.08, sx * 4.3, 0.2, 0.6, 0, sx * 0.5); }
    T.bukit(-24, -46, 22, 11, 14); T.bukit(20, -50, 26, 13, 14);
  },
  hutan(T, d) {
    T.tanah('#5f8f55'); T.lantai(2.6, '#9a8f78', 2.4);
    const titik = [[-6.5, -5], [-4.4, -7.2], [-1.8, -8.4], [1.6, -8.6], [4.3, -7.4], [6.6, -5.2], [-8.2, -1.5], [8.3, -1.8], [-5.2, -10.5], [5.6, -11], [0, -12], [-9.5, -7], [9.6, -7.5]];
    titik.forEach(([x, z], i) => (i % 3 === 1 ? T.cemara(x, z, 3.2 + (i % 4) * 0.4, 1.1) : T.pohon(x, z, 2.0 + (i % 3) * 0.4, i % 2 ? 'daun' : 'daunTua', 1.2 + (i % 3) * 0.15)));
    for (let i = 0; i < 6; i++) {               // enam tugu bab 13..18
      const a = -1.05 + i * 0.42, x = Math.sin(a) * 5.4, z = -3.2 - Math.cos(a) * 2.6;
      T.kotak('kayu', 0.22, 1.5, 0.22, x, 0.75, z); T.kotak((d.bab || []).includes(13 + i) ? 'nyala' : 'plester', 0.62, 0.42, 0.08, x, 1.45, z + 0.14);
    }
    for (let i = 0; i < 7; i++) T.bola('daunTua', 0.38, -5 + i * 1.7, 0.22, -4.6 - (i % 2) * 0.7, 1.3, 0.8, 1);
    T.lentera(-2.9, -0.6); T.lentera(2.9, -0.6); T.bukit(-22, -40, 20, 12, 14); T.bukit(18, -44, 24, 14, 14);
  },
  gua(T, d) {
    T.tanah('#56615a'); T.lantai(4.4, '#6a6a72');
    const batu = [[-4.6, 0.9, -5.2, 2.2], [-2.6, 1.3, -6.4, 2.6], [0, 2.6, -7.2, 2.9], [2.7, 1.3, -6.3, 2.5], [4.7, 0.9, -5.1, 2.2], [-3.6, 3.3, -6.6, 1.9], [3.6, 3.3, -6.6, 1.9], [0, 4.4, -6.9, 2.4], [-6.2, 0.7, -3.2, 1.6], [6.2, 0.7, -3.3, 1.6]];
    for (const [x, y, z, r] of batu) T.bola('batuGelap', r, x, y, z, 1.15, 0.95, 1);
    T.bola('padam', 1.5, 0, 1.3, -5.2, 1.25, 1.1, 0.5);                      // mulut gua
    const n = Math.max(0, Math.min(6, d.kanjiMenyala || 0));
    for (let i = 0; i < 6; i++) { const a = -0.95 + i * 0.38; T.kotak(i < n ? 'nyala' : 'padam', 0.6, 0.6, 0.08, Math.sin(a) * 4.6, 1.75 + (i % 2) * 0.5, -4.1 - Math.cos(a) * 0.9, 0, -a * 0.6); }
    for (const [x, z, h] of [[-3.3, -3.4, 0.9], [3.4, -3.5, 1.1], [-1.4, -4.4, 0.6], [1.7, -4.3, 0.7]]) T.t('kristal', new THREE.ConeGeometry(0.2, h, 5), x, h / 2, z);
    T.lentera(-3.0, -0.8, 4); T.lentera(3.0, -0.8, 4); T.cemara(-8, -6, 3.4); T.cemara(8.2, -6.4, 3.6); T.bukit(0, -30, 30, 16, 12, 'batuGelap');
  },
  pasar(T) {
    T.tanah('#86a56d'); T.lantai(5.4, '#9b9287');
    T.kios(-4.2, -4.4, 'merah'); T.kios(-1.4, -5.2, 'biru'); T.kios(1.4, -5.2, 'kuning'); T.kios(4.2, -4.4, 'hijau');
    for (const [x, z] of [[-4.2, -3.7], [-1.4, -4.5], [1.4, -4.5], [4.2, -3.7]]) { T.kotak('putih', 0.3, 0.4, 0.04, x - 0.5, 1.08, z, -0.3); T.kotak('kertas', 0.3, 0.4, 0.04, x, 1.08, z, -0.3); T.kotak('putih', 0.3, 0.4, 0.04, x + 0.5, 1.08, z, -0.3); }
    for (const [x, z] of [[-5.6, -2.4], [5.7, -2.5], [-2.8, -3.2]]) { T.kotak('kayu', 0.55, 0.45, 0.55, x, 0.225, z, 0, 0.3); T.kotak('kayu', 0.45, 0.4, 0.45, x + 0.1, 0.65, z, 0, 0.6); }
    for (let i = -2; i <= 2; i++) T.lampion(i * 1.6, 3.1 - Math.abs(i) * 0.1, -3.4, i % 2 ? 'putih' : 'merah', i === 0 ? 7 : 0);
    T.rumah(-7.5, -9.5, 4.6, 2.8, 3.2, 0.2); T.rumah(7.4, -9.8, 4.8, 2.9, 3.2, -0.2); T.pohon(0, -9, 2.2, 'sakura', 1.3);
  },
  menara(T, d) {
    T.tanah('#7fa765'); T.lantai(3.8, '#8d8983', 3.4);
    const lit = Math.max(0, Math.min(5, d.lantaiMenyala || 0));
    let y = 0;
    for (let i = 0; i < 5; i++) {
      const w = 4.2 - i * 0.62, h = 1.35;
      T.kotak('plester', w, h, w, 0, y + h / 2, -7.2);
      for (const sx of [-1, 0, 1]) T.kotak(i < lit ? 'nyala' : 'jendela', 0.5, 0.6, 0.08, sx * w * 0.28, y + h * 0.55, -7.2 + w / 2 + 0.02);
      T.kotak('atap', w + 1.3, 0.14, w + 1.3, 0, y + h + 0.07, -7.2); T.kotak('kayuGelap', w + 0.2, 0.12, w + 0.2, 0, y + h - 0.05, -7.2);
      y += h + 0.16;
    }
    T.t('atap', new THREE.ConeGeometry(1.5, 1.2, 4), 0, y + 0.55, -7.2, 0, Math.PI / 4); T.sil('kuning', 0.05, 0.05, 0.9, 0, y + 1.5, -7.2, 6);
    for (let i = 0; i < 4; i++) T.kotak('batu', 3.2 - i * 0.3, 0.16, 0.45, 0, 0.08 + i * 0.16, -4.6 - i * 0.42);
    T.pohon(-5.2, -5.2, 1.9, 'sakura', 1.15); T.pohon(5.3, -5.4, 2.0, 'daun', 1.2); T.cemara(-7.6, -8.5, 3.6); T.cemara(7.8, -8.8, 3.8); T.lentera(-2.6, -2.2); T.lentera(2.6, -2.2);
    T.bukit(-24, -46, 22, 11, 14); T.bukit(22, -48, 24, 12, 14);
  },
  arena(T, d) {
    T.tanah('#8aa06a');
    const pasir = new THREE.Mesh(new THREE.CircleGeometry(6.4, 44), T.bahan.pasir); pasir.rotation.x = -Math.PI / 2; pasir.position.y = 0.014; pasir.receiveShadow = true; T.grup.add(pasir); T.lepas.push(pasir);
    for (let i = 0; i < 15; i++) { const a = -1.75 + i * 0.25, r = 7.4; T.kotak('batu', 2.0, 1.5 + (i % 2) * 0.3, 0.7, Math.sin(a) * r, 0.8, -1.2 - Math.cos(a) * r, 0, -a); }
    const boss = d.boss || [];
    for (let i = 0; i < 9; i++) {                 // sembilan gerbang boss
      const a = -1.2 + i * 0.3, r = 6.0, x = Math.sin(a) * r, z = -1.2 - Math.cos(a) * r;
      T.kotak('kayuGelap', 0.14, 2.3, 0.14, x - 0.42 * Math.cos(a), 1.15, z - 0.42 * Math.sin(a)); T.kotak('kayuGelap', 0.14, 2.3, 0.14, x + 0.42 * Math.cos(a), 1.15, z + 0.42 * Math.sin(a));
      T.kotak('kayu', 1.1, 0.16, 0.2, x, 2.32, z, 0, -a); T.kotak(boss[i] ? 'takluk' : 'belum', 0.7, 0.9, 0.05, x, 1.75, z, 0, -a);
    }
    T.lentera(-3.4, 0.4, 4); T.lentera(3.4, 0.4, 4); T.pohon(-9.5, -4, 2.2, 'daun', 1.3); T.pohon(9.6, -4.3, 2.3, 'daun', 1.3); T.bukit(0, -44, 34, 13, 14);
  },
  panggung(T) {
    T.tanah('#7fa765'); T.lantai(4.6, '#8d8983');
    T.kotak('kayu', 7.2, 0.55, 3.4, 0, 0.275, -6.2); T.kotak('kayuGelap', 7.4, 0.1, 3.6, 0, 0.58, -6.2);
    T.kotak('kain', 7.2, 3.0, 0.2, 0, 2.1, -7.9); for (const sx of [-1, 1]) T.kotak('kayuGelap', 0.3, 3.6, 0.3, sx * 3.6, 1.8, -7.6);
    T.kotak('atap', 8.2, 0.16, 4.2, 0, 3.75, -6.4, 0.12); T.kotak('kayuGelap', 7.6, 0.24, 0.24, 0, 3.55, -4.6);
    for (let i = -4; i <= 4; i++) T.lampion(i * 0.8, 3.15 - Math.abs(i) * 0.03, -4.55, i % 2 ? 'putih' : 'merah', i === 0 ? 8 : 0);
    for (const sx of [-1, 1]) { T.sil('merah', 0.42, 0.42, 0.5, sx * 2.6, 0.9, -6.9, 14, Math.PI / 2); T.kotak('kayuGelap', 0.6, 0.5, 0.5, sx * 2.6, 0.83, -7.0); }
    for (const sx of [-1, 1]) for (let r = 0; r < 2; r++) T.kotak('kayu', 2.2, 0.1, 0.4, sx * 3.6, 0.42, 1.2 + r * 0.9, 0, sx * -0.25);
    T.pohon(-6.4, -5, 2.0, 'sakura', 1.2); T.pohon(6.5, -5.2, 2.1, 'sakura', 1.2); T.rumah(-9, -11, 4.4, 2.7, 3.2, 0.3); T.rumah(9.2, -11.4, 4.6, 2.8, 3.2, -0.3);
  },
  studio(T) {
    T.tanah('#7fa765'); T.lantai(3.8, '#8d8983', 3.4);
    T.rumah(0, -6.6, 5.4, 2.9, 3.4, 0, 'plester'); T.kotak('kayuGelap', 1.2, 2.1, 0.1, 0, 1.05, -4.86); T.kotak('kuning', 0.12, 0.12, 0.06, 0.4, 1.05, -4.8);
    T.papan('準備中', 0, 2.55, -4.84, 1.5, 0.48);
    for (const sx of [-1, 1]) { T.kotak('batuGelap', 0.6, 0.9, 0.5, sx * 2.0, 0.45, -4.5); T.sil('padam', 0.2, 0.2, 0.04, sx * 2.0, 0.6, -4.24, 14, Math.PI / 2); T.sil('padam', 0.1, 0.1, 0.04, sx * 2.0, 0.24, -4.24, 12, Math.PI / 2); }
    T.kotak('kayu', 1.6, 0.06, 0.06, 0, 1.0, -3.9); for (const sx of [-1, 1]) T.kotak('kayu', 0.06, 1.0, 0.06, sx * 0.8, 0.5, -3.9);
    T.pohon(-5.0, -4.6, 1.9, 'daun', 1.15); T.pohon(5.1, -4.8, 2.0, 'sakura', 1.15); T.lentera(-2.9, -1.4); T.lentera(2.9, -1.4); T.bukit(-22, -44, 22, 11, 14); T.bukit(20, -46, 24, 12, 14);
  },
  toko(T) {
    T.tanah('#86a56d'); T.lantai(5.2, '#9b9287');
    T.kios(-3.9, -4.6, 'ungu', 2.2); T.kios(0, -5.4, 'merah', 2.4); T.kios(3.9, -4.6, 'biru', 2.2);
    const warna = ['merah', 'biru', 'kuning', 'hijau', 'ungu', 'putih'];
    for (const [x, z] of [[-3.9, -4.3], [0, -5.1], [3.9, -4.3]]) { T.kotak('kayuGelap', 1.9, 0.05, 0.05, x, 1.75, z); for (let i = 0; i < 6; i++) T.kotak(warna[(i + Math.round(x)) % 6 < 0 ? 0 : (i + Math.abs(Math.round(x))) % 6], 0.24, 0.62, 0.06, x - 0.75 + i * 0.3, 1.42, z); }
    T.kotak('kayuGelap', 0.9, 1.9, 0.08, -6.2, 0.95, -3.0, 0, 0.5); T.kotak('jendela', 0.74, 1.7, 0.03, -6.16, 0.95, -2.96, 0, 0.5);
    for (let i = -2; i <= 2; i++) T.lampion(i * 1.7, 3.15, -3.5, i % 2 ? 'merah' : 'putih', i === 0 ? 7 : 0);
    T.rumah(-7.6, -9.8, 4.6, 2.8, 3.2, 0.2); T.rumah(7.5, -10, 4.8, 2.9, 3.2, -0.2); T.pohon(6.4, -2.6, 1.8, 'sakura', 1.1);
  },
  balai(T) {
    T.tanah('#7fa765'); T.lantai(4.8, '#8d8983');
    T.kotak('plester', 9.0, 3.4, 3.6, 0, 1.7, -8.2); for (let i = 0; i < 6; i++) T.sil('merah', 0.2, 0.22, 3.4, -4.0 + i * 1.6, 1.7, -5.9, 12);
    T.kotak('atap', 10.4, 0.2, 3.2, 0, 3.95, -6.3, 0.42); T.kotak('atap', 10.4, 0.2, 3.2, 0, 3.95, -8.8, -0.42); T.kotak('kayuGelap', 10.2, 0.24, 0.3, 0, 4.6, -7.55); T.kotak('batu', 10, 0.3, 5.6, 0, 0.15, -7.4);
    for (let i = 0; i < 5; i++) T.kotak('jendela', 0.8, 1.2, 0.06, -3.2 + i * 1.6, 1.9, -6.38);
    T.papan('成績', 0, 3.3, -5.75, 1.4, 0.46);
    for (let i = 0; i < 3; i++) T.kotak('batu', 3.4 - i * 0.3, 0.14, 0.4, 0, 0.07 + i * 0.14, -4.3 - i * 0.38);
    T.lentera(-3.2, -2.0); T.lentera(3.2, -2.0); T.pohon(-6.8, -4.6, 2.0, 'sakura', 1.2); T.pohon(6.9, -4.8, 2.1, 'daun', 1.25); T.bukit(-24, -46, 22, 11, 14); T.bukit(22, -48, 24, 12, 14);
  },
};

/** Bangun adegan satu zona. data: {lantaiMenyala, kanjiMenyala, boss:[bool x9], bab:[13..]} */
export function bangunTema(tema, data = {}) {
  if (tema === 'gerbang') {
    const g = buatGerbang({ teks: 'ようこそ', tanpaLangit: true });
    return { grup: g.grup, terapkan: (sua) => g.terapkan(sua, null, null) };
  }
  const T = new Tukang();
  (RESEP[tema] || RESEP.plaza)(T, data);
  return T.selesai();
}

export const DAFTAR_TEMA = ['gerbang', ...Object.keys(RESEP)];
