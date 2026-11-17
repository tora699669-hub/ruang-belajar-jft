// Langit, cahaya, dan cuaca bersama untuk semua zona. Murni tampilan: menerima angka dari waktu.js dan
// cuaca.js, tidak punya akses ke data murid.
import * as THREE from './vendor/three/three.min.js';

const srgb = (h) => new THREE.Color().setStyle(h, THREE.SRGBColorSpace);
const warnaDari = (a) => new THREE.Color().setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace);
const ABU = [0.62, 0.65, 0.70];
const campur = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

export function buatLangit(opsi = {}) {
  const grup = new THREE.Group();
  grup.name = 'Langit';
  const langit = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 14), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { atas: { value: new THREE.Color() }, cakrawala: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vArah; void main(){ vArah = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 atas; uniform vec3 cakrawala; varying vec3 vArah; void main(){ float t = smoothstep(-0.02, 0.62, vArah.y); vec3 c = mix(cakrawala, atas, t); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}',
  }));
  langit.name = 'langit'; langit.renderOrder = -10; langit.frustumCulled = false;
  const nb = 260, pb = new Float32Array(nb * 3);
  let s = 99;
  const acak = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < nb; i++) {
    const az = acak() * Math.PI * 2, el = 0.12 + acak() * 1.35, r = 84;
    pb[i * 3] = Math.cos(az) * Math.cos(el) * r; pb[i * 3 + 1] = Math.sin(el) * r; pb[i * 3 + 2] = Math.sin(az) * Math.cos(el) * r;
  }
  const gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.BufferAttribute(pb, 3));
  const bintang = new THREE.Points(gb, new THREE.PointsMaterial({ color: 0xffffff, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  bintang.name = 'bintang'; bintang.renderOrder = -9; bintang.frustumCulled = false;
  const bulan = new THREE.Mesh(new THREE.CircleGeometry(2.6, 28), new THREE.MeshBasicMaterial({ color: srgb('#fff6dc'), transparent: true, opacity: 0, fog: false, depthWrite: false }));
  bulan.position.set(...(opsi.posisiBulan || [-7.5, 24, -70])); bulan.name = 'bulan'; bulan.renderOrder = -8;

  // awan: beberapa gumpalan pipih, tembus pandang mengikuti cuaca
  const matAwan = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const awan = new THREE.Group(); awan.name = 'awan'; awan.renderOrder = -7;
  const geoAwan = new THREE.SphereGeometry(1, 10, 7);
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(geoAwan, matAwan);
    m.position.set(-38 + acak() * 76, 15 + acak() * 9, -30 - acak() * 38);
    m.scale.set(7 + acak() * 7, 1.6 + acak() * 1.4, 3.5 + acak() * 3);
    m.renderOrder = -7; awan.add(m);
  }
  // hujan: garis pendek yang jatuh di sekitar kamera
  const nh = 420, ph = new Float32Array(nh * 6), dasar = new Float32Array(nh * 3);
  for (let i = 0; i < nh; i++) { dasar[i * 3] = (acak() - 0.5) * 22; dasar[i * 3 + 1] = acak() * 12; dasar[i * 3 + 2] = (acak() - 0.5) * 22; }
  const gh = new THREE.BufferGeometry(); gh.setAttribute('position', new THREE.BufferAttribute(ph, 3));
  const hujan = new THREE.LineSegments(gh, new THREE.LineBasicMaterial({ color: srgb('#cfe0f2'), transparent: true, opacity: 0, depthWrite: false }));
  hujan.name = 'hujan'; hujan.frustumCulled = false; hujan.visible = false;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
  const utama = new THREE.DirectionalLight(0xffffff, 2);
  utama.castShadow = true;
  utama.shadow.mapSize.set(1024, 1024);
  const sc = utama.shadow.camera;
  sc.near = 1; sc.far = 40; sc.left = -7; sc.right = 7; sc.top = 8; sc.bottom = -6;
  utama.shadow.bias = -0.0006; utama.shadow.normalBias = 0.03;
  utama.target.position.set(0, 0.8, -0.8);
  const isi = new THREE.DirectionalLight(srgb('#ffd9b4'), 0);       // pengisi hangat, menyala bersama lampu
  isi.position.set(1.5, 3.2, 8); isi.target.position.set(0, 1.2, -0.5);
  grup.add(langit, bintang, bulan, awan, hujan, hemi, utama, utama.target, isi, isi.target);
  const kabut = new THREE.Fog(0xffffff, 26, 95);
  const keadaan = { hujan: 0, t: 0 };

  function terapkan(sua, efek, renderer) {
    const e = efek || { awan: 0, hujan: 0, kabut: 0, redup: 0 };
    const kelabu = 0.75 * e.redup;
    langit.material.uniforms.atas.value.copy(warnaDari(campur(sua.langitAtas, ABU.map((x) => x * (0.25 + 0.75 * (sua.kuatCahaya / 3))), kelabu)));
    langit.material.uniforms.cakrawala.value.copy(warnaDari(campur(sua.langitCakrawala, ABU.map((x) => x * (0.3 + 0.7 * (sua.kuatCahaya / 3))), kelabu)));
    kabut.color.copy(warnaDari(campur(sua.kabut, ABU.map((x) => x * (0.3 + 0.7 * (sua.kuatCahaya / 3))), kelabu)));
    kabut.near = 26 - 19 * e.kabut; kabut.far = 95 - 58 * e.kabut;
    hemi.color.copy(warnaDari(sua.hemiLangit)); hemi.groundColor.copy(warnaDari(sua.hemiTanah)); hemi.intensity = sua.kuatHemi * (1 - 0.2 * e.redup);
    utama.color.copy(warnaDari(sua.cahaya)); utama.intensity = sua.kuatCahaya * (1 - 0.6 * e.redup);
    const a = sua.arahCahaya;
    utama.position.set(utama.target.position.x + a[0] * 16, utama.target.position.y + a[1] * 16, utama.target.position.z + a[2] * 16);
    isi.intensity = 1.15 * sua.lampu;
    bintang.material.opacity = sua.bintang * (1 - e.awan * 0.85);
    bulan.material.opacity = Math.min(1, sua.bintang * 1.1) * (1 - e.awan * 0.7);
    matAwan.opacity = 0.85 * e.awan;
    matAwan.color.setScalar(0.35 + 0.65 * Math.min(1, sua.kuatCahaya / 2.5) * (1 - 0.35 * e.redup));
    keadaan.hujan = e.hujan;
    hujan.visible = e.hujan > 0.02;
    hujan.material.opacity = 0.2 + 0.5 * e.hujan;
    if (renderer) renderer.toneMappingExposure = sua.eksposur;
  }

  function perbarui(dt, kamera, tenang) {
    if (!hujan.visible) return;
    keadaan.t += tenang ? 0 : dt;
    const n = Math.round(nh * Math.min(1, 0.25 + keadaan.hujan)), jatuh = 11, pj = 0.28 + 0.2 * keadaan.hujan;
    const cx = kamera ? kamera.position.x : 0, cz = kamera ? kamera.position.z - 6 : 0;
    for (let i = 0; i < n; i++) {
      const x = cx + dasar[i * 3], z = cz + dasar[i * 3 + 2];
      const y = 12 - ((dasar[i * 3 + 1] + keadaan.t * jatuh) % 12);
      ph[i * 6] = x; ph[i * 6 + 1] = y; ph[i * 6 + 2] = z; ph[i * 6 + 3] = x + 0.03; ph[i * 6 + 4] = y - pj; ph[i * 6 + 5] = z;
    }
    gh.setDrawRange(0, n * 2);
    gh.attributes.position.needsUpdate = true;
  }

  return { grup, kabut, utama, isi, terapkan, perbarui };
}
