// Suara contoh: klik tombol (file WAV pendek), musik latar (file MP3, dimuat saat dinyalakan),
// dan dua nada efek yang disintesis langsung (jawaban benar, naik level).
// AudioContext baru dibuat setelah sentuhan pertama, sesuai aturan browser.

export class Suara {
  constructor(dasar) {
    this.dasar = dasar; this.ctx = null; this.buf = {}; this.musikNode = null; this.musikNyala = false; this.senyap = false;
  }
  _siap() {
    if (this.ctx) return true;
    // browser hanya mengizinkan audio sesudah sentuhan pengguna; di luar itu diam saja (tanpa peringatan konsol)
    const ua = navigator.userActivation;
    if (ua && !ua.isActive) return false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
      this.utama = this.ctx.createGain(); this.utama.gain.value = 1; this.utama.connect(this.ctx.destination);
      this.gMusik = this.ctx.createGain(); this.gMusik.gain.value = 0; this.gMusik.connect(this.utama);
    } catch { this.ctx = null; return false; }
    return true;
  }
  async _muat(nama) {
    if (this.buf[nama]) return this.buf[nama];
    const r = await fetch(this.dasar + nama);
    if (!r.ok) throw new Error('gagal memuat suara ' + nama);
    const data = await r.arrayBuffer();
    this.buf[nama] = await new Promise((ok, gagal) => this.ctx.decodeAudioData(data, ok, gagal));
    return this.buf[nama];
  }
  async _bangun() {
    if (!this._siap()) return false;
    if (this.ctx.state === 'suspended') { try { await this.ctx.resume(); } catch { return false; } }
    return true;
  }
  /** Klik tombol. Aman dipanggil kapan pun; diam kalau audio belum boleh. */
  async klik() {
    try {
      if (this.senyap || !(await this._bangun())) return;
      const b = await this._muat('klik.wav');
      const s = this.ctx.createBufferSource(), g = this.ctx.createGain();
      s.buffer = b; g.gain.value = 0.55; s.connect(g); g.connect(this.utama); s.start();
    } catch (e) { console.warn('suara klik dilewati:', e.message); }
  }
  /** Nyalakan atau matikan musik latar. -> true kalau sekarang menyala. */
  async musik(nyala) {
    try {
      if (!nyala && !this.ctx) { this.musikNyala = false; return false; }
      if (!(await this._bangun())) return false;
      const t = this.ctx.currentTime;
      if (nyala) {
        if (!this.musikNode) {
          const b = await this._muat('musik_gerbang.mp3');
          this.musikNode = this.ctx.createBufferSource();
          this.musikNode.buffer = b; this.musikNode.loop = true; this.musikNode.connect(this.gMusik); this.musikNode.start();
        }
        this.gMusik.gain.cancelScheduledValues(t); this.gMusik.gain.setValueAtTime(this.gMusik.gain.value, t); this.gMusik.gain.linearRampToValueAtTime(0.42, t + 0.8);
      } else {
        this.gMusik.gain.cancelScheduledValues(t); this.gMusik.gain.setValueAtTime(this.gMusik.gain.value, t); this.gMusik.gain.linearRampToValueAtTime(0, t + 0.4);
      }
      this.musikNyala = !!nyala;
      return this.musikNyala;
    } catch (e) { console.warn('musik dilewati:', e.message); return false; }
  }
  async _nada(daftar, bentuk = 'sine', keras = 0.16) {
    try {
      if (this.senyap || !(await this._bangun())) return;
      const t0 = this.ctx.currentTime + 0.01;
      for (const [f, mulai, lama] of daftar) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = bentuk; o.frequency.value = f;
        g.gain.setValueAtTime(0, t0 + mulai); g.gain.linearRampToValueAtTime(keras, t0 + mulai + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t0 + mulai + lama);
        o.connect(g); g.connect(this.utama); o.start(t0 + mulai); o.stop(t0 + mulai + lama + 0.02);
      }
    } catch (e) { console.warn('nada dilewati:', e.message); }
  }
  benar() { return this._nada([[880, 0, 0.35], [1174.7, 0.09, 0.45], [1760, 0.18, 0.6]], 'sine', 0.15); }
  naikLevel() { return this._nada([[587.3, 0, 0.3], [740, 0.12, 0.3], [880, 0.24, 0.3], [1174.7, 0.36, 0.9], [880, 0.36, 0.9]], 'triangle', 0.13); }
}
