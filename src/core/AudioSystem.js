export class AudioSystem {
    constructor() {
        this.initialized = false;

        // Ensure audio context is supported
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        this.context = new AudioContext();

        // Master Gain
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.5; // Overall volume
        this.masterGain.connect(this.context.destination);

        // We will init nodes upon user interaction to avoid autoplay warnings
        this.nodesCreated = false;

        // Sub-bass rumble (Geyser, Caldera)
        this.rumbleGain = null;
        this.rumbleOsc = null;

        // Wind (Plains, Canyon)
        this.windGain = null;
        this.windFilter = null;
        this.windNoise = null;

        // Steam vent (Geyser, Prismatic)
        this.steamGain = null;
        this.steamNoise = null;
        this.steamFilter = null;
        this.steamLfo = null;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        if (!this.nodesCreated) {
            this.createNodes();
            this.nodesCreated = true;
        }
    }

    createNoiseBuffer() {
        const bufferSize = this.context.sampleRate * 2; // 2 seconds of noise
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    createNodes() {
        const noiseBuffer = this.createNoiseBuffer();

        // --- Rumble ---
        this.rumbleGain = this.context.createGain();
        this.rumbleGain.gain.value = 0;
        this.rumbleGain.connect(this.masterGain);

        this.rumbleOsc = this.context.createOscillator();
        this.rumbleOsc.type = 'sine';
        this.rumbleOsc.frequency.value = 40; // Sub-bass

        // Add a bit of distortion/harmonics to rumble
        const rumbleFilter = this.context.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 100;

        this.rumbleOsc.connect(rumbleFilter);
        rumbleFilter.connect(this.rumbleGain);
        this.rumbleOsc.start();

        // --- Wind ---
        this.windGain = this.context.createGain();
        this.windGain.gain.value = 0;
        this.windGain.connect(this.masterGain);

        this.windNoise = this.context.createBufferSource();
        this.windNoise.buffer = noiseBuffer;
        this.windNoise.loop = true;

        this.windFilter = this.context.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.frequency.value = 400;
        this.windFilter.Q.value = 0.5;

        // Wind gusts via LFO
        const windLfo = this.context.createOscillator();
        windLfo.type = 'sine';
        windLfo.frequency.value = 0.1; // slow gusts
        const windLfoGain = this.context.createGain();
        windLfoGain.gain.value = 200; // Sweep frequency
        windLfo.connect(windLfoGain);
        windLfoGain.connect(this.windFilter.frequency);
        windLfo.start();

        this.windNoise.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windNoise.start();

        // --- Steam ---
        this.steamGain = this.context.createGain();
        this.steamGain.gain.value = 0;
        this.steamGain.connect(this.masterGain);

        this.steamNoise = this.context.createBufferSource();
        this.steamNoise.buffer = noiseBuffer;
        this.steamNoise.loop = true;

        this.steamFilter = this.context.createBiquadFilter();
        this.steamFilter.type = 'lowpass';
        this.steamFilter.frequency.value = 800;

        this.steamLfo = this.context.createOscillator();
        this.steamLfo.type = 'sine';
        this.steamLfo.frequency.value = 0.2; // exhale rhythm
        const steamLfoGain = this.context.createGain();
        steamLfoGain.gain.value = 0.5; // Gain modulation

        // To modulate gain, we need a dedicated gain node for the LFO
        const steamModGain = this.context.createGain();
        steamModGain.gain.value = 0.5; // Base gain

        this.steamLfo.connect(steamLfoGain);
        steamLfoGain.connect(steamModGain.gain);
        this.steamLfo.start();

        this.steamNoise.connect(this.steamFilter);
        this.steamFilter.connect(steamModGain);
        steamModGain.connect(this.steamGain);
        this.steamNoise.start();
    }

    updateVolumes(realmIndex, progress) {
        if (!this.initialized || !this.nodesCreated) return;

        const time = this.context.currentTime + 0.1;

        // Base volumes for each realm [Geyser, Prismatic, Canyon, Valley, Caldera]
        const targetRumble = [0.3, 0.1, 0.0, 0.0, 0.6];
        const targetWind   = [0.1, 0.2, 0.6, 0.8, 0.0];
        const targetSteam  = [0.8, 0.5, 0.1, 0.0, 0.2];

        // Interpolate based on progress
        const currentIndex = Math.min(Math.max(realmIndex, 0), 4);
        const nextIndex = Math.min(currentIndex + 1, 4);

        const curRumble = targetRumble[currentIndex] * (1 - progress) + targetRumble[nextIndex] * progress;
        const curWind = targetWind[currentIndex] * (1 - progress) + targetWind[nextIndex] * progress;
        const curSteam = targetSteam[currentIndex] * (1 - progress) + targetSteam[nextIndex] * progress;

        // Apply smooth ramps
        this.rumbleGain.gain.setTargetAtTime(curRumble, time, 0.5);
        this.windGain.gain.setTargetAtTime(curWind, time, 0.5);
        this.steamGain.gain.setTargetAtTime(curSteam, time, 0.5);
    }
}
