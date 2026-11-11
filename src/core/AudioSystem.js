/* Yellowstone AudioSystem: each realm sounds like what it is - the geyser
 * basin hisses and blops, the falls are whitewater and rumble, Lamar is open
 * wind with meadowlarks and ravens, the caldera is pines and lake lap.
 * All synthesis, no samples, no voice. Opt-in via #sound, suspends hidden. */

import {
  makeCtx, windNoise, streamBed, lapping, rumble, steam, bloops,
  birdChirps, croaks,
} from './soundscape-layers.js';

const SEED = 1872;
const S = 12;

const RENDERERS = {
  pinesWind: (c) => windNoise(c, { color: 0.03, gustDepth: 0.55, base: 0.45, seed: SEED + 1 }),
  river: (c) => streamBed(c, { gain: 0.4, period: 0.27, depth: 0.5, seed: SEED + 2 }),
  geyser: (c) => steam(c, { count: 4, gain: 0.4, floor: 0.1, seed: SEED + 3 }),
  hotSpring: (c) => bloops(c, { count: 22, fLo: 170, fHi: 380, gain: 0.2, seed: SEED + 4 }),
  falls: (c) => streamBed(c, { gain: 0.75, period: 0.16, depth: 0.35, seed: SEED + 5 }),
  fallsRumble: (c) => rumble(c, { gain: 0.55, swellSec: 5, seed: SEED + 6 }),
  meadowBirds: (c) => birdChirps(c, { count: 9, fLo: 2000, fHi: 3400, trill: 18, gain: 0.26, seed: SEED + 7, minGap: 0.6, syllables: 2 }),
  ravens: (c) => croaks(c, { count: 4, f: 780, gain: 0.16, seed: SEED + 8 }),
  lakeLap: (c) => lapping(c, { gain: 0.35, period: 2.4, depth: 0.6, seed: SEED + 9 }),
};

/* Per-realm layer gains: geyser basin, grand prismatic, canyon & falls,
   lamar valley, caldera country. */
const REALM_GAINS = [
  { geyser: 0.8, hotSpring: 0.55, pinesWind: 0.25 },
  { geyser: 0.45, hotSpring: 0.6, pinesWind: 0.3 },
  { falls: 0.9, fallsRumble: 0.65, pinesWind: 0.2 },
  { pinesWind: 0.5, meadowBirds: 0.75, river: 0.4, ravens: 0.45 },
  { pinesWind: 0.55, lakeLap: 0.6, ravens: 0.3, river: 0.15 },
];

export class AudioSystem {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.realm = 0;
    this.paused = false;
    this.layerGains = {};
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
    this.master.gain.value = 0.24;
    this.master.connect(c.destination);
    const sr = c.sampleRate;
    for (const [key, render] of Object.entries(RENDERERS)) {
      const ctxLike = makeCtx(sr, S, SEED);
      const out = render(ctxLike) || ctxLike;
      const buffer = c.createBuffer(2, out.L.length, sr);
      buffer.getChannelData(0).set(out.L);
      buffer.getChannelData(1).set(out.R);
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const g = c.createGain();
      g.gain.value = 0;
      src.connect(g);
      g.connect(this.master);
      src.start();
      this.layerGains[key] = g;
    }
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
    const want = REALM_GAINS[i] || {};
    for (const [key, g] of Object.entries(this.layerGains)) {
      g.gain.setTargetAtTime(want[key] || 0, this.context.currentTime, 0.4);
    }
  }
}

/* Preview scenes for tools/render-audio-preview.mjs (gains = REALM_GAINS). */
export const previewProgram = {
  defaultScene: 'geyserBasin',
  layers: Object.fromEntries(
    Object.entries(RENDERERS).map(([k, r]) => [k, { seconds: S, seed: SEED, render: r }]),
  ),
  scenes: {
    geyserBasin: Object.entries(REALM_GAINS[0]).map(([layer, gain]) => ({ layer, gain })),
    grandPrismatic: Object.entries(REALM_GAINS[1]).map(([layer, gain]) => ({ layer, gain })),
    canyonFalls: Object.entries(REALM_GAINS[2]).map(([layer, gain]) => ({ layer, gain })),
    lamarValley: Object.entries(REALM_GAINS[3]).map(([layer, gain]) => ({ layer, gain })),
    caldera: Object.entries(REALM_GAINS[4]).map(([layer, gain]) => ({ layer, gain })),
  },
};
