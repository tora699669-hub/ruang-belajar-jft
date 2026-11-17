// Animasi prosedural untuk rangka game_engine (tulang tanpa rotasi diam, sumbu sejajar dunia:
// X = kiri karakter, Y = atas, Z = depan). Klip dibuat per karakter dari posisi tulangnya,
// jadi tidak ada file animasi yang diunduh.
import * as THREE from './vendor/three/three.min.js';

const TAU = Math.PI * 2;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const JARI = ['index', 'middle', 'ring', 'pinky'];
const lonceng = (p, pusat, lebar) => { let d = ((p - pusat) % 1 + 1.5) % 1 - 0.5; return Math.exp(-((d / lebar) ** 2)); };

function tulangDari(akar) {
  const t = {};
  akar.traverse((o) => { if (o.isBone) t[o.name] = o; });
  return t;
}

// Data diam: arah tiap ruas dalam kerangka dunia (rotasi diam = identitas).
function ukur(t) {
  const arah = (anak) => t[anak].position.clone().normalize();
  const d = { arah: {}, sumbuJari: {} };
  for (const s of ['l', 'r']) {
    d.arah['upperarm_' + s] = arah('lowerarm_' + s);
    d.arah['lowerarm_' + s] = arah('hand_' + s);
    d.arah['thigh_' + s] = arah('calf_' + s);
    d.arah['calf_' + s] = arah('foot_' + s);
    d.arah['foot_' + s] = arah('ball_' + s);
    const a = t['index_01_' + s].position, b = t['pinky_01_' + s].position;
    const normal = new THREE.Vector3().crossVectors(a, b).normalize(); // normal telapak
    for (const j of [...JARI, 'thumb']) {
      const dj = t[j + '_02_' + s].position.clone().normalize();
      const sumbu = new THREE.Vector3().crossVectors(dj, normal).normalize();
      d.sumbuJari[j + '_' + s] = s === 'l' ? sumbu : sumbu;
    }
    d.tanda = d.tanda || {};
  }
  d.pinggul = t.pelvis.position.clone();
  return d;
}

const q = () => new THREE.Quaternion();
const putar = (sumbu, sudut) => q().setFromAxisAngle(sumbu, sudut);
const ke = (dari, tujuan) => q().setFromUnitVectors(dari, tujuan.clone().normalize());

// Pose dasar berdiri: lengan turun di samping badan, kaki sedikit merapat, jari rileks.
function poseDasar(d, opsi = {}) {
  const P = {};
  const buka = opsi.bukaLengan ?? 0.16, siku = opsi.siku ?? 0.22;
  for (const s of ['l', 'r']) {
    const k = s === 'l' ? 1 : -1;
    const qa = ke(d.arah['upperarm_' + s], new THREE.Vector3(k * buka, -1, 0.02));
    P['upperarm_' + s] = qa;
    const tuj = new THREE.Vector3(k * (buka - 0.05), -1, siku).normalize().applyQuaternion(qa.clone().invert());
    P['lowerarm_' + s] = ke(d.arah['lowerarm_' + s], tuj);
    P['hand_' + s] = q();
    const rapat = opsi.rapat ?? 0.055;
    const qt = ke(d.arah['thigh_' + s], new THREE.Vector3(k * rapat, -1, 0.0));
    P['thigh_' + s] = qt;
    P['calf_' + s] = ke(d.arah['calf_' + s], new THREE.Vector3(k * rapat, -1, -0.02).normalize().applyQuaternion(qt.clone().invert()));
    P['foot_' + s] = q();
    for (const j of JARI) {
      const ax = d.sumbuJari[j + '_' + s];
      P[j + '_01_' + s] = putar(ax, 0.30); P[j + '_02_' + s] = putar(ax, 0.38); P[j + '_03_' + s] = putar(ax, 0.25);
    }
    const at = d.sumbuJari['thumb_' + s];
    P['thumb_01_' + s] = putar(at, 0.12); P['thumb_02_' + s] = putar(at, 0.18); P['thumb_03_' + s] = putar(at, 0.12);
  }
  for (const n of ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'head', 'clavicle_l', 'clavicle_r']) P[n] = q();
  return P;
}

const salin = (P) => Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v.clone()]));
const kali = (P, n, r) => { P[n] = r.multiply(P[n]); };          // rotasi di kerangka induk, sesudah pose dasar
const kaliLokal = (P, n, r) => { P[n] = P[n].multiply(r); };      // rotasi di kerangka tulang itu sendiri

// --- pembuat pose per fase -------------------------------------------------

function poseDiam(d, dasar, p) {           // p 0..1 dalam satu putaran (8 detik)
  const P = salin(dasar);
  const napas = Math.sin(TAU * p * 2), goyang = Math.sin(TAU * p), lihat = Math.sin(TAU * p + 1.1);
  kali(P, 'spine_02', putar(X, -0.012 * napas));
  kali(P, 'spine_03', putar(X, -0.016 * napas));
  kali(P, 'clavicle_l', putar(Z, 0.018 * napas)); kali(P, 'clavicle_r', putar(Z, -0.018 * napas));
  kali(P, 'pelvis', putar(Z, 0.014 * goyang));
  kali(P, 'thigh_l', putar(Z, -0.014 * goyang)); kali(P, 'thigh_r', putar(Z, -0.014 * goyang));
  kali(P, 'spine_01', putar(Z, -0.010 * goyang));
  kali(P, 'neck_01', putar(Y, 0.05 * lihat)); kali(P, 'head', putar(Y, 0.07 * lihat));
  kali(P, 'head', putar(X, 0.02 * Math.sin(TAU * p * 2 + 0.6)));
  for (const s of ['l', 'r']) {
    const k = s === 'l' ? 1 : -1;
    kali(P, 'upperarm_' + s, putar(X, 0.02 * Math.sin(TAU * p + k)));
    kali(P, 'upperarm_' + s, putar(Z, -k * 0.012 * napas));
  }
  return { P, pos: new THREE.Vector3(0, 0.002 * napas, 0) };
}

function poseJalan(d, dasar, p, gaya = {}) {       // p 0..1 satu langkah penuh; p=0 tumit kiri mendarat
  const P = salin(dasar);
  const ayun = gaya.ayun ?? 0.36, tekuk = gaya.tekuk ?? 0.95, lengan = gaya.lengan ?? 0.32;
  for (const s of ['l', 'r']) {
    const f = s === 'l' ? p : (p + 0.5) % 1;
    const paha = -ayun * Math.cos(TAU * f) - 0.06;                         // negatif = ke depan
    const lutut = 0.08 + tekuk * lonceng(f, 0.70, 0.13) + 0.20 * lonceng(f, 0.10, 0.09);
    const total = paha + lutut;
    const tapak = smooth(0.02, 0.10, f) * (1 - smooth(0.42, 0.56, f));       // telapak rata saat menapak
    const kakiX = -total * tapak - 0.22 * lonceng(f, 0.0, 0.07) + 0.42 * lonceng(f, 0.60, 0.09) + (1 - tapak) * 0.08;
    kali(P, 'thigh_' + s, putar(X, paha));
    kaliLokal(P, 'calf_' + s, putar(X, lutut));
    kaliLokal(P, 'foot_' + s, putar(X, kakiX));
    const k = s === 'l' ? 1 : -1;
    const a = lengan * Math.cos(TAU * p) * k;                                 // lengan kiri ke belakang saat kaki kiri di depan
    kali(P, 'upperarm_' + s, putar(X, a));
    kaliLokal(P, 'lowerarm_' + s, putar(X, -0.22 - 0.26 * Math.max(0, -a / lengan)));
    kali(P, 'clavicle_' + s, putar(Y, 0.04 * Math.cos(TAU * p) * 1));
  }
  const c = Math.cos(TAU * p);
  kali(P, 'pelvis', putar(Y, -0.075 * c));
  kali(P, 'pelvis', putar(Z, 0.035 * Math.sin(TAU * p)));
  kali(P, 'spine_01', putar(X, 0.035));
  kali(P, 'spine_02', putar(Y, 0.07 * c));
  kali(P, 'spine_03', putar(Y, 0.08 * c));
  kali(P, 'neck_01', putar(Y, -0.04 * c));
  kali(P, 'head', putar(Y, -0.035 * c)); kali(P, 'head', putar(X, -0.02));
  const naik = -0.022 - 0.016 * Math.cos(2 * TAU * p);
  return { P, pos: new THREE.Vector3(0.006 * Math.sin(TAU * p), naik, 0) };
}

function poseOjigi(d, dasar, p) {          // membungkuk memberi hormat, sekali jalan
  const P = salin(dasar);
  const k = smooth(0.08, 0.38, p) * (1 - smooth(0.62, 0.92, p));
  kali(P, 'spine_01', putar(X, 0.26 * k)); kali(P, 'spine_02', putar(X, 0.16 * k)); kali(P, 'spine_03', putar(X, 0.10 * k));
  kali(P, 'neck_01', putar(X, 0.10 * k)); kali(P, 'head', putar(X, 0.06 * k));
  for (const s of ['l', 'r']) { kali(P, 'upperarm_' + s, putar(X, -0.20 * k)); }
  return { P, pos: new THREE.Vector3(0, -0.01 * k, -0.035 * k) };
}

function poseSemangat(d, dasar, p) {       // kepal tangan kanan ke atas, sekali jalan
  const P = salin(dasar);
  const k = smooth(0.05, 0.28, p) * (1 - smooth(0.70, 0.96, p));
  const pompa = Math.sin(TAU * p * 3) * k;
  const s = 'r';
  const qa = ke(d.arah['upperarm_' + s], new THREE.Vector3(-0.50, 0.72 + 0.12 * pompa, 0.32));
  const ql = ke(d.arah['lowerarm_' + s], new THREE.Vector3(-0.06, 1, 0.10).normalize().applyQuaternion(qa.clone().invert()));
  P['upperarm_' + s] = dasar['upperarm_' + s].clone().slerp(qa, k);
  P['lowerarm_' + s] = dasar['lowerarm_' + s].clone().slerp(ql, k);
  for (const j of JARI) { const ax = d.sumbuJari[j + '_' + s]; for (const r of ['_01_', '_02_', '_03_']) kaliLokal(P, j + r + s, putar(ax, 0.85 * k)); }
  kali(P, 'spine_03', putar(Z, 0.05 * k)); kali(P, 'head', putar(X, -0.10 * k));
  return { P, pos: new THREE.Vector3(0, 0.018 * Math.abs(pompa), 0) };
}

function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

const RESEP = {
  diam: { durasi: 8, n: 96, f: poseDiam, ulang: true },
  jalan: { durasi: 1.04, n: 32, f: poseJalan, ulang: true },
  ojigi: { durasi: 2.6, n: 40, f: poseOjigi, ulang: false },
  semangat: { durasi: 2.0, n: 48, f: poseSemangat, ulang: false },
};

/** Buat AnimationClip untuk satu karakter. opsi: {bukaLengan, siku, rapat, gaya} */
export function buatKlip(nama, akar, opsi = {}) {
  const r = RESEP[nama];
  if (!r) throw new Error('klip tidak dikenal: ' + nama);
  const t = tulangDari(akar), d = ukur(t), dasar = poseDasar(d, opsi);
  const waktu = [], nilai = {}, pos = [];
  const jumlah = r.ulang ? r.n + 1 : r.n;
  for (let i = 0; i < jumlah; i++) {
    const p = r.ulang ? (i % r.n) / r.n : i / (r.n - 1);
    waktu.push(r.ulang ? (i / r.n) * r.durasi : p * r.durasi);
    const h = r.f(d, dasar, p, opsi.gaya);
    for (const [n, qq] of Object.entries(h.P)) (nilai[n] ||= []).push(qq.x, qq.y, qq.z, qq.w);
    pos.push(d.pinggul.x + h.pos.x, d.pinggul.y + h.pos.y, d.pinggul.z + h.pos.z);
  }
  const trek = Object.entries(nilai).filter(([n]) => t[n]).map(([n, v]) => new THREE.QuaternionKeyframeTrack(n + '.quaternion', waktu, v));
  trek.push(new THREE.VectorKeyframeTrack('pelvis.position', waktu, pos));
  const klip = new THREE.AnimationClip(nama, r.durasi, trek);
  klip.userData = { ulang: r.ulang };
  return klip;
}

export const DAFTAR_KLIP = Object.keys(RESEP);
