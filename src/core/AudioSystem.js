export class AudioSystem {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.realm = 0;
    this.paused = false;
  }
  async toggle() {
    if (!this.context) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) throw Error("Audio is not supported in this browser.");
      this.context = new C();
      this.createNodes();
    }
    this.enabled = !this.enabled;
    await this.sync();
    return this.enabled;
  }
  createNodes() {
    const c = this.context;
    this.master = c.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(c.destination);
    const b = c.createBuffer(1, c.sampleRate * 6, c.sampleRate),
      d = b.getChannelData(0);
    let v = 0;
    for (let i = 0; i < d.length; i++) {
      v = (v + Math.random() * 0.04 - 0.02) / 1.02;
      d[i] = v * 3.5;
    }
    const n = c.createBufferSource();
    n.buffer = b;
    n.loop = true;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 650;
    this.wind = c.createGain();
    this.wind.gain.value = 0.32;
    n.connect(f);
    f.connect(this.wind);
    this.wind.connect(this.master);
    n.start();
    this.water = c.createGain();
    this.water.gain.value = 0.1;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 550;
    n.connect(hp);
    hp.connect(this.water);
    this.water.connect(this.master);
  }
  async sync() {
    if (!this.context) return;
    if (this.enabled && !this.paused && !document.hidden)
      await this.context.resume();
    else await this.context.suspend();
  }
  updateVolumes(i) {
    this.realm = i;
    if (!this.context) return;
    this.water.gain.setTargetAtTime(
      [0.65, 0.25, 0.8, 0.04, 0.12][i],
      this.context.currentTime,
      0.4,
    );
    this.wind.gain.setTargetAtTime(
      [0.18, 0.2, 0.24, 0.4, 0.28][i],
      this.context.currentTime,
      0.4,
    );
  }
}
