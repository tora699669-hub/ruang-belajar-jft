// Adegan Gerbang Login: gerbang kayu beratap, tembok, lampion, lentera batu, kota kecil di belakang.
// Semua bentuk dibuat dari kode (tanpa file model), lalu digabung per bahan supaya hemat draw call.
import * as THREE from './vendor/three/three.min.js';
import { mergeGeometries } from './vendor/three/addons/utils/BufferGeometryUtils.js';
import { buatLangit } from './langit.js';

const srgb = (h) => new THREE.Color().setStyle(h, THREE.SRGBColorSpace);
const warnaDari = (a) => new THREE.Color().setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace);

function teksturPaving() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#8d8983'; g.fillRect(0, 0, 256, 256);
  let s = 12345;
  const acak = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const b = 64;
  for (let y = 0; y < 4; y++) for (let x = -1; x < 4; x++) {
    const ox = (y % 2) * (b / 2);
    const t = 150 + Math.floor(acak() * 36);
    g.fillStyle = `rgb(${t + 6},${t + 2},${t - 4})`;
    g.fillRect(x * b + ox + 2, y * b + 2, b - 4, b - 4);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(60,55,50,${0.05 + acak() * 0.08})`;
      g.fillRect(x * b + ox + 2 + acak() * (b - 6), y * b + 2 + acak() * (b - 6), 2 + acak() * 3, 1 + acak() * 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

function teksturPapan(teks) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#3b2616'; g.fillRect(0, 0, 512, 160);
  g.strokeStyle = '#d8b56a'; g.lineWidth = 6; g.strokeRect(9, 9, 494, 142);
  g.fillStyle = '#f6ead2'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 92px "Noto Sans JP","Hiragino Sans","Yu Gothic",system-ui,sans-serif';
  g.fillText(teks, 256, 86);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function buatGerbang(opsi = {}) {
  const grup = new THREE.Group();
  grup.name = 'GerbangLogin';
  const bahan = {
    kayu: new THREE.MeshStandardMaterial({ color: srgb('#8a5230'), roughness: 0.78 }),
    kayuGelap: new THREE.MeshStandardMaterial({ color: srgb('#4a2d1b'), roughness: 0.8 }),
    atap: new THREE.MeshStandardMaterial({ color: srgb('#3e4856'), roughness: 0.62 }),
    plester: new THREE.MeshStandardMaterial({ color: srgb('#efe6d6'), roughness: 0.92 }),
    batu: new THREE.MeshStandardMaterial({ color: srgb('#8c8780'), roughness: 0.95 }),
    rumput: new THREE.MeshStandardMaterial({ color: srgb('#7fa765'), roughness: 1 }),
    daun: new THREE.MeshStandardMaterial({ color: srgb('#5f9457'), roughness: 0.95, flatShading: true }),
    sakura: new THREE.MeshStandardMaterial({ color: srgb('#f3b6c6'), roughness: 0.95, flatShading: true }),
    batang: new THREE.MeshStandardMaterial({ color: srgb('#5d4334'), roughness: 0.95 }),
    rumah: new THREE.MeshStandardMaterial({ color: srgb('#e3d5bd'), roughness: 0.95 }),
    bukit: new THREE.MeshStandardMaterial({ color: srgb('#7f9f8a'), roughness: 1 }),
    kertas: new THREE.MeshStandardMaterial({ color: srgb('#f2dfc4'), roughness: 0.7, emissive: srgb('#ffb056'), emissiveIntensity: 0 }),
    lampionMerah: new THREE.MeshStandardMaterial({ color: srgb('#d8432f'), roughness: 0.65, emissive: srgb('#ff5a2a'), emissiveIntensity: 0 }),
    jendela: new THREE.MeshStandardMaterial({ color: srgb('#6f7f8f'), roughness: 0.4, emissive: srgb('#ffc56e'), emissiveIntensity: 0 }),
  };
  const tumpuk = {};
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  function taruh(kunci, geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.deleteAttribute('uv');
    E.set(rx, ry, rz); Q.setFromEuler(E);
    M.compose(new THREE.Vector3(x, y, z), Q, new THREE.Vector3(sx, sy, sz));
    g.applyMatrix4(M);
    (tumpuk[kunci] ||= []).push(g);
  }
  const kotak = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const silinder = (r1, r2, h, n = 12) => new THREE.CylinderGeometry(r1, r2, h, n);

  // ---------- tanah, jalan batu
  const paving = teksturPaving();
  const tanah = new THREE.Mesh(new THREE.CircleGeometry(70, 40), bahan.rumput);
  tanah.rotation.x = -Math.PI / 2; tanah.receiveShadow = true; tanah.name = 'tanah';
  grup.add(tanah);
  const matJalan = new THREE.MeshStandardMaterial({ map: paving, roughness: 0.95 });
  const geoJalan = new THREE.PlaneGeometry(3.4, 30);
  geoJalan.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * 15 : v * 1.7; });
  const jalan = new THREE.Mesh(geoJalan, matJalan);
  jalan.rotation.x = -Math.PI / 2; jalan.position.set(0, 0.012, -5); jalan.receiveShadow = true; jalan.name = 'jalan';
  grup.add(jalan);
  const geoPlaza = new THREE.CircleGeometry(4.2, 40);
  geoPlaza.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 4.2; });
  const plaza = new THREE.Mesh(geoPlaza, matJalan);
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.016, 0.6); plaza.receiveShadow = true; plaza.name = 'plaza';
  grup.add(plaza);

  // ---------- gerbang
  const zg = -3.0;
  for (const sx of [-1, 1]) {
    taruh('kayu', kotak(0.36, 3.5, 0.36), sx * 1.8, 1.75, zg);
    taruh('batu', kotak(0.56, 0.3, 0.56), sx * 1.8, 0.15, zg);
    taruh('kayuGelap', kotak(0.22, 2.2, 0.22), sx * 1.8, 1.3, zg - 0.7);         // tiang penyangga belakang
    taruh('kayuGelap', kotak(0.16, 0.16, 0.9), sx * 1.8, 2.25, zg - 0.38);
  }
  taruh('kayu', kotak(4.5, 0.30, 0.34), 0, 3.28, zg);
  taruh('kayuGelap', kotak(4.1, 0.20, 0.24), 0, 2.72, zg);
  taruh('kayu', kotak(0.2, 0.36, 0.26), 0, 3.0, zg);
  for (const sz of [-1, 1]) {                                                       // dua bidang atap
    taruh('atap', kotak(5.5, 0.12, 1.55), 0, 3.92, zg + sz * 0.66, sz * 0.46);
    taruh('kayuGelap', kotak(5.3, 0.08, 0.14), 0, 3.56, zg + sz * 1.34, sz * 0.46);
  }
  taruh('atap', kotak(5.6, 0.2, 0.26), 0, 4.3, zg);
  for (let i = -5; i <= 5; i++) taruh('atap', silinder(0.05, 0.05, 1.5, 6), i * 0.5, 3.97, zg + 0.66, Math.PI / 2 + 0.46, 0, 0, 1, 1, 1);
  for (const sx of [-1, 1]) taruh('atap', kotak(0.16, 0.34, 0.3), sx * 2.74, 4.32, zg);
  // papan nama
  const papan = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.53), new THREE.MeshStandardMaterial({ map: teksturPapan(opsi.teks || 'ようこそ'), roughness: 0.8 }));
  papan.position.set(0, 2.99, zg + 0.19); papan.name = 'papan';
  grup.add(papan);
  // tembok kiri kanan
  for (const sx of [-1, 1]) {
    taruh('plester', kotak(4.2, 1.7, 0.3), sx * 4.08, 1.05, zg);
    taruh('batu', kotak(4.3, 0.24, 0.42), sx * 4.08, 0.12, zg);
    taruh('atap', kotak(4.4, 0.1, 0.56), sx * 4.08, 1.97, zg + 0.13, 0.3);
    taruh('atap', kotak(4.4, 0.1, 0.56), sx * 4.08, 1.97, zg - 0.13, -0.3);
    taruh('atap', kotak(4.45, 0.1, 0.14), sx * 4.08, 2.07, zg);
  }
  // lampion gantung
  const lampu = [];
  for (const sx of [-1, 1]) {
    taruh('lampionMerah', new THREE.SphereGeometry(0.24, 14, 10), sx * 1.22, 2.22, zg + 0.1, 0, 0, 0, 1, 1.25, 1);
    taruh('kayuGelap', silinder(0.11, 0.11, 0.06), sx * 1.22, 2.53, zg + 0.1);
    taruh('kayuGelap', silinder(0.11, 0.11, 0.06), sx * 1.22, 1.91, zg + 0.1);
    taruh('kayuGelap', silinder(0.012, 0.012, 0.12, 5), sx * 1.22, 2.61, zg + 0.1);
    const p = new THREE.PointLight(srgb('#ffa85e'), 0, 9, 1.6);
    p.position.set(sx * 1.2, 2.15, zg + 0.75);
    grup.add(p); lampu.push({ l: p, kuat: 6.5 });
  }
  // lentera batu
  for (const sx of [-1, 1]) {
    const x = sx * 2.55, z = -1.2;
    taruh('batu', silinder(0.2, 0.26, 0.16, 6), x, 0.08, z);
    taruh('batu', silinder(0.09, 0.11, 0.62, 6), x, 0.47, z);
    taruh('batu', silinder(0.24, 0.14, 0.1, 6), x, 0.83, z);
    taruh('kertas', kotak(0.26, 0.24, 0.26), x, 1.0, z);
    taruh('batu', new THREE.ConeGeometry(0.34, 0.24, 4), x, 1.24, z, 0, Math.PI / 4);
    taruh('batu', new THREE.SphereGeometry(0.05, 6, 5), x, 1.39, z);
    const p = new THREE.PointLight(srgb('#ffb873'), 0, 5, 1.8);
    p.position.set(x, 1.05, z + 0.3);
    grup.add(p); lampu.push({ l: p, kuat: 3.2 });
  }
  // pohon
  function pohon(x, z, tinggi, jenis, r = 1) {
    taruh('batang', silinder(0.09 * r, 0.14 * r, tinggi, 7), x, tinggi / 2, z);
    const ico = (rr) => new THREE.IcosahedronGeometry(rr, 1);
    taruh(jenis, ico(0.95 * r), x, tinggi + 0.45 * r, z);
    taruh(jenis, ico(0.7 * r), x - 0.6 * r, tinggi + 0.1 * r, z + 0.25 * r);
    taruh(jenis, ico(0.72 * r), x + 0.62 * r, tinggi + 0.15 * r, z - 0.2 * r);
    taruh(jenis, ico(0.6 * r), x + 0.1 * r, tinggi + 0.95 * r, z + 0.1 * r);
  }
  pohon(-3.9, -1.5, 1.7, 'sakura', 1.05); pohon(3.95, -1.7, 1.8, 'sakura', 1.1);
  pohon(-6.4, -4.6, 2.2, 'daun', 1.3); pohon(6.2, -4.9, 2.3, 'daun', 1.35);
  pohon(-9.5, -9, 2.6, 'daun', 1.6); pohon(9.8, -10, 2.4, 'daun', 1.5); pohon(-5.2, 3.5, 1.6, 'daun', 1.0); pohon(5.6, 3.9, 1.5, 'sakura', 0.95);
  // rumah di belakang gerbang
  function rumah(x, z, w, h, d, ry = 0) {
    const c = Math.cos(ry), s = Math.sin(ry);
    taruh('rumah', kotak(w, h, d), x, h / 2, z, 0, ry);
    const miring = 0.6, pj = d * 0.62;
    for (const k of [-1, 1]) {
      const oz = k * d * 0.27;
      taruh('atap', kotak(w + 0.5, 0.12, pj), x + s * oz, h + pj * 0.5 * Math.sin(miring) - 0.02, z + c * oz, k * miring, ry);
    }
    taruh('kayuGelap', kotak(w, 0.14, 0.14), x, h + pj * Math.sin(miring) - 0.05, z, 0, ry);
    const n = Math.max(2, Math.round(w / 1.3));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n - 0.5;
      taruh('jendela', kotak(0.62, 0.72, 0.06), x + c * u * w + s * (d / 2 + 0.01), h * 0.55, z - s * u * w + c * (d / 2 + 0.01), 0, ry);
    }
  }
  rumah(-5.6, -11, 4.4, 2.7, 3.2, 0.12); rumah(5.9, -12.5, 5.0, 3.0, 3.4, -0.1); rumah(-11.5, -16, 5.2, 3.2, 3.6, 0.3);
  rumah(12, -17.5, 4.6, 2.8, 3.2, -0.3); rumah(0.3, -20, 5.6, 3.6, 3.6, 0);
  // bukit jauh
  taruh('bukit', new THREE.SphereGeometry(1, 18, 10), -26, -3, -48, 0, 0, 0, 22, 11, 14);
  taruh('bukit', new THREE.SphereGeometry(1, 18, 10), 20, -4, -52, 0, 0, 0, 26, 13, 14);
  taruh('bukit', new THREE.SphereGeometry(1, 18, 10), -2, -5, -60, 0, 0, 0, 20, 12, 12);

  for (const [k, daftar] of Object.entries(tumpuk)) {
    const mesh = new THREE.Mesh(mergeGeometries(daftar, false), bahan[k]);
    mesh.name = 'statis_' + k;
    mesh.castShadow = !['bukit', 'jendela', 'rumah'].includes(k);
    mesh.receiveShadow = !['bukit'].includes(k);
    grup.add(mesh);
    daftar.forEach((g) => g.dispose());
  }

  // ---------- langit, cahaya, cuaca (bersama dengan zona lain)
  const L = opsi.tanpaLangit ? null : buatLangit();
  if (L) grup.add(L.grup);
  const kabut = L ? L.kabut : null, utama = L ? L.utama : null;

  function terapkan(sua, renderer, efek) {
    if (L) L.terapkan(sua, efek, renderer);
    for (const { l, kuat } of lampu) l.intensity = kuat * sua.lampu;
    bahan.kertas.emissiveIntensity = 0.02 + 2.4 * sua.lampu;
    bahan.lampionMerah.emissiveIntensity = 0.02 + 1.1 * sua.lampu;
    bahan.jendela.emissiveIntensity = 1.6 * sua.lampu;
  }

  return { grup, kabut, terapkan, cahayaUtama: utama, lampu, langit: L };
}
