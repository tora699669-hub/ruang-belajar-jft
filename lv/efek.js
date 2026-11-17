// Efek dasar: kilau jawaban benar dan konfeti naik level. Partikel dipakai ulang (tanpa alokasi per frame).
import * as THREE from './vendor/three/three.min.js';

function teksturBintang() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,244,200,0.9)'); r.addColorStop(1, 'rgba(255,220,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(32, 4); g.lineTo(32, 60); g.moveTo(4, 32); g.lineTo(60, 32); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Efek {
  constructor(scene, opsi = {}) {
    this.tenang = !!opsi.tenang;                 // prefers-reduced-motion: tanpa partikel
    const nk = this.nk = 40;
    this.kPos = new Float32Array(nk * 3); this.kKec = new Float32Array(nk * 3);
    const gk = new THREE.BufferGeometry(); gk.setAttribute('position', new THREE.BufferAttribute(this.kPos, 3));
    this.kilauP = new THREE.Points(gk, new THREE.PointsMaterial({ map: teksturBintang(), size: 0.16, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff1b0 }));
    this.kilauP.frustumCulled = false; this.kilauP.visible = false; this.kilauP.name = 'efek_kilau';
    this.cincin = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.42, 40), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.cincin.visible = false; this.cincin.name = 'efek_cincin';
    this.tK = -1;
    const nc = this.nc = 150;
    this.konf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.034), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true }), nc);
    this.konf.frustumCulled = false; this.konf.visible = false; this.konf.name = 'efek_konfeti';
    const warna = ['#e8432f', '#ffcf3f', '#3fa7f0', '#58c36a', '#f08ab8', '#ffffff'];
    const c = new THREE.Color();
    for (let i = 0; i < nc; i++) this.konf.setColorAt(i, c.setStyle(warna[i % warna.length], THREE.SRGBColorSpace));
    this.cP = new Float32Array(nc * 3); this.cV = new Float32Array(nc * 3); this.cR = new Float32Array(nc * 4);
    this.tC = -1;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._s = new THREE.Vector3(1, 1, 1); this._p = new THREE.Vector3();
    scene.add(this.kilauP, this.cincin, this.konf);
  }

  /** Kilau jawaban benar di sekitar titik `p` (Vector3, kira-kira setinggi dada). */
  kilau(p) {
    if (this.tenang) return;
    for (let i = 0; i < this.nk; i++) {
      const a = Math.random() * Math.PI * 2, r = 0.15 + Math.random() * 0.35;
      this.kPos[i * 3] = p.x + Math.cos(a) * r; this.kPos[i * 3 + 1] = p.y - 0.5 + Math.random() * 1.0; this.kPos[i * 3 + 2] = p.z + Math.sin(a) * r;
      this.kKec[i * 3] = Math.cos(a) * 0.35; this.kKec[i * 3 + 1] = 0.6 + Math.random() * 0.9; this.kKec[i * 3 + 2] = Math.sin(a) * 0.35;
    }
    this.cincin.position.copy(p); this.tK = 0;
    this.kilauP.visible = this.cincin.visible = true;
  }

  /** Konfeti naik level, menyembur dari atas kepala di titik `p`. */
  konfeti(p) {
    if (this.tenang) return;
    for (let i = 0; i < this.nc; i++) {
      const a = Math.random() * Math.PI * 2, k = 0.5 + Math.random() * 1.3;
      this.cP[i * 3] = p.x + (Math.random() - 0.5) * 0.3; this.cP[i * 3 + 1] = p.y + Math.random() * 0.2; this.cP[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.3;
      this.cV[i * 3] = Math.cos(a) * k; this.cV[i * 3 + 1] = 1.5 + Math.random() * 1.7; this.cV[i * 3 + 2] = Math.sin(a) * k;
      this.cR[i * 4] = Math.random() * 6; this.cR[i * 4 + 1] = Math.random() * 6; this.cR[i * 4 + 2] = 4 + Math.random() * 9; this.cR[i * 4 + 3] = 3 + Math.random() * 7;
    }
    this.tC = 0; this.konf.visible = true; this.konf.material.opacity = 1;
  }

  get aktif() { return this.tK >= 0 || this.tC >= 0; }

  perbarui(dt, kamera) {
    if (this.tK >= 0) {
      this.tK += dt;
      const u = this.tK / 1.0;
      if (u >= 1) { this.tK = -1; this.kilauP.visible = this.cincin.visible = false; } else {
        for (let i = 0; i < this.nk; i++) {
          this.kPos[i * 3] += this.kKec[i * 3] * dt; this.kPos[i * 3 + 1] += this.kKec[i * 3 + 1] * dt; this.kPos[i * 3 + 2] += this.kKec[i * 3 + 2] * dt;
        }
        this.kilauP.geometry.attributes.position.needsUpdate = true;
        this.kilauP.material.opacity = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.7;
        this.kilauP.material.size = 0.10 + 0.10 * Math.sin(u * Math.PI);
        const s = 0.6 + u * 2.4;
        this.cincin.scale.set(s, s, s); this.cincin.material.opacity = 0.85 * (1 - u) ** 1.5;
        if (kamera) this.cincin.quaternion.copy(kamera.quaternion);
      }
    }
    if (this.tC >= 0) {
      this.tC += dt;
      if (this.tC > 3.2) { this.tC = -1; this.konf.visible = false; } else {
        const tarik = Math.exp(-1.6 * dt);
        for (let i = 0; i < this.nc; i++) {
          const j = i * 3, r = i * 4;
          this.cV[j + 1] -= 5.2 * dt; this.cV[j] *= tarik; this.cV[j + 2] *= tarik;
          if (this.cV[j + 1] < -1.3) this.cV[j + 1] = -1.3;                    // jatuh melayang
          this.cP[j] += (this.cV[j] + Math.sin(this.tC * this.cR[r + 3] + i) * 0.35) * dt; this.cP[j + 1] += this.cV[j + 1] * dt; this.cP[j + 2] += this.cV[j + 2] * dt;
          if (this.cP[j + 1] < 0.02) { this.cP[j + 1] = 0.02; this.cV[j] = this.cV[j + 2] = 0; }
          this._e.set(this.cR[r] + this.tC * this.cR[r + 2], this.cR[r + 1] + this.tC * this.cR[r + 3], 0);
          this._q.setFromEuler(this._e); this._p.set(this.cP[j], this.cP[j + 1], this.cP[j + 2]);
          this._m.compose(this._p, this._q, this._s); this.konf.setMatrixAt(i, this._m);
        }
        this.konf.instanceMatrix.needsUpdate = true;
        this.konf.material.opacity = this.tC > 2.5 ? Math.max(0, 1 - (this.tC - 2.5) / 0.7) : 1;
      }
    }
  }
}
