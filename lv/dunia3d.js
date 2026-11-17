// Mesin dunia 3D: satu zona tampil pada satu waktu. Pemain berjalan ke penanda pintu, NPC berdiri di zonanya,
// langit dan cuaca mengikuti angka dari waktu.js dan cuaca.js. Modul ini tidak membaca data murid sendiri;
// semua yang ia tahu diberikan oleh masuk.js.
import * as THREE from './vendor/three/three.min.js';
import { GLTFLoader } from './vendor/three/addons/loaders/GLTFLoader.js';
import { buatLangit } from './langit.js';
import { bangunTema, teksturTeks } from './prop.js';
import { buatKlip } from './animasi.js';
import { Efek } from './efek.js';

const ASET = new URL('./aset/', import.meta.url).href;
const KECEPATAN = 2.4;                      // m/detik saat berjalan ke pintu (dipercepat supaya tidak menunggu)

export function webglAda() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export class Dunia3D {
  constructor(kanvas, opsi = {}) {
    this.kanvas = kanvas; this.tenang = !!opsi.tenang; this.padaPintu = opsi.padaPintu || (() => {});
    this.renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.kamera = new THREE.PerspectiveCamera(50, 1, 0.1, 220);
    this.langit = buatLangit({ posisiBulan: [-9, 26, -70] });
    this.scene.add(this.langit.grup); this.scene.fog = this.langit.kabut;
    this.efek = new Efek(this.scene, { tenang: this.tenang });
    this.loader = new GLTFLoader();
    this.cache = new Map();                 // berkas -> Promise<gltf>
    this.zona = null; this.tema = null; this.aktor = []; this.penanda = []; this.pemain = null;
    this.timer = new THREE.Timer(); this.timer.connect(document);
    this.ukur = { n: 0, dt: 0, kerja: 0, fps: 0, ms: 0, lambat: 0, akhir: 0 };
    this.mutu = 'tinggi'; this.mutuTetap = opsi.mutu && opsi.mutu !== 'auto' ? opsi.mutu : null;
    this.aturMutu(this.mutuTetap || 'tinggi');
    this._ro = new ResizeObserver(() => this.ukuran()); this._ro.observe(kanvas.parentElement);
    this._ketuk = (e) => this._padaKetuk(e); kanvas.addEventListener('pointerup', this._ketuk);
    this._sinar = new THREE.Raycaster(); this._v = new THREE.Vector3(); this._kamPos = new THREE.Vector3(0, 3.1, 7.6); this._kamLihat = new THREE.Vector3(0, 1.1, -1.4);
    this.sua = null; this.jalan = null; this.hidup = true;
    this.renderer.setAnimationLoop(() => this._bingkai());
  }

  aturMutu(m) {
    this.mutu = m;
    const tinggi = m === 'tinggi';
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tinggi ? 1.5 : 1));
    this.renderer.shadowMap.enabled = tinggi; this.langit.utama.castShadow = tinggi;
    this.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((x) => { x.needsUpdate = true; }); });
    this.ukuran();
  }
  ukuran() {
    const p = this.kanvas.parentElement, w = Math.max(1, p.clientWidth), h = Math.max(1, p.clientHeight);
    this.renderer.setSize(w, h, false); this.kamera.aspect = w / h; this.kamera.updateProjectionMatrix();
  }

  _muat(berkas) {
    if (!this.cache.has(berkas)) this.cache.set(berkas, this.loader.loadAsync(ASET + berkas));
    return this.cache.get(berkas);
  }
  async _aktor(berkas, x, z, ry, pakaiCache = true) {
    const g = await this._muat(berkas);
    const akar = g.scene;                       // satu berkas dipakai satu aktor (tiap NPC punya berkas sendiri)
    akar.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(akar), aksi = {};
    for (const n of ['diam', 'jalan', 'ojigi', 'semangat']) {
      const klip = buatKlip(n, akar), a = mixer.clipAction(klip);
      if (!klip.userData.ulang) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      aksi[n] = a;
    }
    const p = { berkas, akar, mixer, aksi, kini: null, klip: '', tinggi: g.asset?.extras?.tinggi || 1.65, arah: ry, tuju: ry };
    mixer.addEventListener('finished', () => this._main(p, 'diam', 0.4));
    akar.position.set(x, 0, z); akar.rotation.y = ry;
    this._main(p, 'diam'); aksi.diam.time = Math.random() * 8;
    this.scene.add(akar);
    return p;
  }
  _main(p, nama, lama = 0.3) {
    const a = p.aksi[nama];
    if (!a || p.kini === a) return;
    a.reset(); a.setEffectiveWeight(1); a.setEffectiveTimeScale(nama === 'jalan' ? 1.7 : 1); a.play();
    if (p.kini) p.kini.crossFadeTo(a, this.tenang ? 0.01 : lama, false);
    p.kini = a; p.klip = nama;
  }

  /** Ganti zona. def: {id, tema, npc:[{berkas}], pintu:[{label, ikon, terkunci}], avatar: berkas, data} */
  async masukZona(def) {
    const nomor = (this._nomor = (this._nomor || 0) + 1);
    this._bersihkan();
    this.zona = def.id;
    this.tema = bangunTema(def.tema, def.data || {});
    this.scene.add(this.tema.grup);
    // penanda pintu: papan berlabel di busur belakang
    const n = def.pintu.length;
    def.pintu.forEach((p, i) => {
      const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1, x = u * Math.min(2.75, 0.8 * n), z = -2.7 + Math.abs(u) * 0.5;
      const tex = teksturTeks([p.ikon || '門', p.label], p.terkunci ? { latar: '#d9d5cf', tepi: '#77736d', warnaIkon: '#77736d', warna: '#4a4640' } : {});
      const papan = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.68), new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, toneMapped: false }));
      papan.position.set(x, 2.08 + (i % 2) * 0.34, z); papan.userData.pintu = i; papan.name = 'penanda_' + i;
      const tiang = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.72, 6), new THREE.MeshStandardMaterial({ color: 0x4a2d1b, roughness: 0.8 }));
      tiang.position.set(x, 0.86, z - 0.02); tiang.castShadow = true;
      this.scene.add(papan, tiang); this.penanda.push({ papan, tiang, x, z, tex });
    });
    if (def.tema === 'gerbang' && this.penanda[0]) { this.penanda[0].papan.position.set(0, 1.75, -2.2); this.penanda[0].tiang.visible = false; this.penanda[0].x = 0; this.penanda[0].z = -2.6; }
    this.terapkan(this.sua, this.efekCuaca);
    try {
      const tugas = [this._aktor(def.avatar, 0, 2.3, Math.PI)];
      const tempat = def.tema === 'gerbang' ? [[1.15, -1.3]] : [[-1.7, -0.5], [1.7, -0.5]];
      def.npc.forEach((b, i) => tugas.push(this._aktor(b.berkas, tempat[i % 2][0], tempat[i % 2][1], 0)));
      const hasil = await Promise.all(tugas);
      if (nomor !== this._nomor || !this.hidup) { hasil.forEach((p) => this.scene.remove(p.akar)); return false; }
      this.pemain = hasil[0]; this.aktor = hasil;
      if (!this.tenang) hasil.slice(1).forEach((p, i) => setTimeout(() => { if (this.aktor.includes(p)) this._main(p, 'ojigi', 0.35); }, 500 + i * 500));
    } catch (e) { console.warn('[lv] karakter zona gagal dimuat:', e.message); this.galatAset = e.message; }
    this._bidik(0, true);
    return true;
  }
  _bersihkan() {
    this.jalan = null;
    for (const p of this.aktor) { p.mixer.stopAllAction(); this.scene.remove(p.akar); }
    this.aktor = []; this.pemain = null;
    for (const m of this.penanda) { this.scene.remove(m.papan, m.tiang); m.papan.geometry.dispose(); m.papan.material.dispose(); m.tex.dispose(); m.tiang.geometry.dispose(); m.tiang.material.dispose(); }
    this.penanda = [];
    if (this.tema) {
      this.scene.remove(this.tema.grup);
      this.tema.grup.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
      this.tema = null;
    }
  }

  /** Terapkan suasana (dari waktu.js) dan efek cuaca (dari cuaca.js). */
  terapkan(sua, efek) {
    if (!sua) return;
    this.sua = sua; this.efekCuaca = efek;
    this.langit.terapkan(sua, efek, this.renderer);
    if (this.tema) this.tema.terapkan(sua);
  }

  /** Pemain berjalan ke penanda pintu ke-i, lalu janji selesai. */
  jalanKe(i) {
    const m = this.penanda[i];
    if (!m || !this.pemain || this.tenang) return Promise.resolve();
    return new Promise((ok) => {
      this.jalan = { x: m.x, z: m.z + 1.0, ok, batas: 1.6 };
      this._main(this.pemain, 'jalan', 0.15);
    });
  }
  rayakan(jenis) {
    const p = this.pemain; if (!p) return;
    const t = this._v.copy(p.akar.position);
    if (jenis === 'level') { this.efek.konfeti(t.setY(1.02 * p.tinggi)); if (!this.tenang) this._main(p, 'semangat', 0.2); } else this.efek.kilau(t.setY(0.72 * p.tinggi));
  }

  _padaKetuk(e) {
    const r = this.kanvas.getBoundingClientRect();
    this._sinar.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.kamera);
    const kena = this._sinar.intersectObjects(this.penanda.map((m) => m.papan), false)[0];
    if (kena) this.padaPintu(kena.object.userData.pintu);
  }
  _bidik(dt, langsung) {
    const p = this.pemain, sempit = this.kamera.aspect < 0.8;
    const px = p ? p.akar.position.x : 0, pz = p ? p.akar.position.z : 2.3;
    this._v.set(px * 0.35, sempit ? 3.5 : 3.1, pz + (sempit ? 6.4 : 5.3));
    const k = langsung || this.tenang ? 1 : 1 - Math.exp(-dt * 3.2);
    this._kamPos.lerp(this._v, k);
    this._kamLihat.lerp(this._v.set(px * 0.3, 1.25, pz - 3.4), k);
    this.kamera.position.copy(this._kamPos); this.kamera.lookAt(this._kamLihat);
    for (const m of this.penanda) m.papan.quaternion.copy(this.kamera.quaternion);
  }
  _bingkai() {
    const t0 = performance.now();
    this.timer.update();
    const dt = Math.min(Math.max(this.timer.getDelta(), 0), 0.1);
    const p = this.pemain;
    if (p && this.jalan) {
      const j = this.jalan, dx = j.x - p.akar.position.x, dz = j.z - p.akar.position.z, d = Math.hypot(dx, dz);
      j.batas -= dt;
      if (d < 0.08 || j.batas <= 0) { p.akar.position.set(j.x, 0, j.z); p.tuju = Math.PI; this._main(p, 'diam', 0.2); this.jalan = null; j.ok(); }
      else { const l = Math.min(d, KECEPATAN * dt); p.akar.position.x += (dx / d) * l; p.akar.position.z += (dz / d) * l; p.tuju = Math.atan2(dx, dz); }
    }
    for (const a of this.aktor) {
      const beda = ((a.tuju - a.arah + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      a.arah += beda * Math.min(1, dt * 9); a.akar.rotation.y = a.arah; a.mixer.update(dt);
    }
    this._bidik(dt);
    this.langit.perbarui(dt, this.kamera, this.tenang);
    this.efek.perbarui(dt, this.kamera);
    this.renderer.render(this.scene, this.kamera);
    const u = this.ukur, t1 = performance.now();
    if (u.akhir) { u.dt += t0 - u.akhir; u.kerja += t1 - t0; u.n++; }
    u.akhir = t0;
    if (u.n >= 30) {
      u.fps = 1000 / (u.dt / u.n); u.ms = u.kerja / u.n; u.n = 0; u.dt = 0; u.kerja = 0;
      if (!this.mutuTetap && this.mutu === 'tinggi' && u.fps < 26 && ++u.lambat >= 4) { this.aturMutu('hemat'); if (this.padaMutu) this.padaMutu('hemat'); }
      else if (!this.mutuTetap && this.mutu === 'hemat' && u.fps < 20 && ++u.lambat >= 12 && this.padaLambat) { this.padaLambat(); u.lambat = -1e9; }
    }
  }
  statistik() {
    const i = this.renderer.info;
    return { fps: this.ukur.fps, kerjaMs: this.ukur.ms, draw: i.render.calls, segitiga: i.render.triangles, geometri: i.memory.geometries, tekstur: i.memory.textures, mutu: this.mutu, zona: this.zona, aktor: this.aktor.length, penanda: this.penanda.length };
  }
  jeda(ya) { this.renderer.setAnimationLoop(ya ? null : () => this._bingkai()); if (!ya) this.ukur.akhir = 0; }
  hentikan() {
    this.hidup = false;
    this.renderer.setAnimationLoop(null);
    this.kanvas.removeEventListener('pointerup', this._ketuk); this._ro.disconnect(); this.timer.dispose();
    this._bersihkan();
    this.renderer.dispose();
    try { this.renderer.forceContextLoss(); } catch { /* sudah hilang */ }
  }
}
