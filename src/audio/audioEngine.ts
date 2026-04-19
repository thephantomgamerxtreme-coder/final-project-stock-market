// StockQuest Audio Engine — procedural music + SFX via Web Audio API.
// No external assets, no CDN. Everything generated on the fly.

type MusicMode = "home" | "level" | "boss" | "win" | null;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private musicTimer: number | null = null;
  private musicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private currentMode: MusicMode = null;
  private muted = false;
  private musicVolume = 0.3;
  private sfxVolume = 0.5;
  private started = false;
  private nextNoteTime = 0;
  private step = 0;

  init() {
    if (this.ctx) return;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.musicGain.gain.value = 0; // fade in later
    this.sfxGain.gain.value = this.sfxVolume;
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  async ensureRunning() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      try { await this.ctx.resume(); } catch {}
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.linearRampToValueAtTime(m ? 0 : 1, t + 0.15);
    }
  }

  isMuted() { return this.muted; }

  // ============== MUSIC ==============
  // Procedural lo-fi / synthwave loop driven by a stepped scheduler.
  private scaleNotes = [0, 3, 5, 7, 10, 12, 15]; // minor pentatonic-ish
  private bassRoot = 41.20; // E1
  private bassPattern = [0, 0, 7, 0, 5, 0, 3, 7]; // semitone offsets
  private chordPattern = [
    [0, 7, 10, 15], // i
    [0, 7, 10, 15],
    [-2, 5, 8, 13], // VII
    [3, 7, 12, 15], // III
  ];

  startMusic(mode: MusicMode) {
    this.init();
    if (!this.ctx || !this.musicGain) return;
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    if (!mode) {
      this.fadeMusic(0, 0.6);
      return;
    }

    if (mode === "win") {
      this.playWinJingle();
      return;
    }

    // fade in
    this.fadeMusic(this.musicVolume, 1.2);

    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.step = 0;
    const tick = () => this.scheduler();
    this.musicTimer = window.setInterval(tick, 25) as unknown as number;
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentMode = null;
    this.fadeMusic(0, 0.4);
  }

  private fadeMusic(target: number, seconds: number) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.linearRampToValueAtTime(target, t + seconds);
  }

  private currentTempoStepSec(): number {
    // 16th-note step. Base 100 BPM → 0.15s/step. Boss faster.
    const bpm = this.currentMode === "boss" ? 132 : this.currentMode === "home" ? 88 : 100;
    return 60 / bpm / 4;
  }

  private scheduler() {
    if (!this.ctx) return;
    const lookahead = 0.2;
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += this.currentTempoStepSec();
      this.step = (this.step + 1) % 64;
    }
  }

  private scheduleStep(step: number, time: number) {
    const isBoss = this.currentMode === "boss";

    // Kick on every 4th 16th (downbeat)
    if (step % 4 === 0) this.kick(time, isBoss ? 0.5 : 0.4);
    // Hi-hat ticks
    if (step % 2 === 1) this.hat(time, isBoss ? 0.12 : 0.08);
    // Snare-ish on 2 & 4 of bar
    if (step % 16 === 8) this.snare(time, 0.18);

    // Bassline — every 8th note (every 2 steps)
    if (step % 2 === 0) {
      const idx = (step / 2) % this.bassPattern.length;
      const semi = this.bassPattern[idx];
      const freq = this.bassRoot * Math.pow(2, semi / 12);
      this.bassNote(freq, time, this.currentTempoStepSec() * 1.8);
    }

    // Chord pad — change every bar (16 steps)
    if (step % 16 === 0) {
      const chord = this.chordPattern[(Math.floor(step / 16)) % this.chordPattern.length];
      chord.forEach((semi) => {
        const freq = this.bassRoot * 4 * Math.pow(2, semi / 12);
        this.padNote(freq, time, this.currentTempoStepSec() * 14);
      });
    }

    // Sparkle chime — occasional
    if (step % 32 === 12 || (isBoss && step % 16 === 6)) {
      const semi = this.scaleNotes[Math.floor(Math.random() * this.scaleNotes.length)];
      const freq = this.bassRoot * 8 * Math.pow(2, semi / 12);
      this.chime(freq, time + 0.01);
    }
  }

  // ============== Instrument voices ==============
  private kick(time: number, vol = 0.4) {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(120, time);
    o.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    o.connect(g).connect(this.musicGain);
    o.start(time); o.stop(time + 0.2);
  }

  private hat(time: number, vol = 0.08) {
    if (!this.ctx || !this.musicGain) return;
    const buf = this.noiseBuffer(0.05);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    src.connect(hp).connect(g).connect(this.musicGain);
    src.start(time);
  }

  private snare(time: number, vol = 0.18) {
    if (!this.ctx || !this.musicGain) return;
    const buf = this.noiseBuffer(0.2);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1800;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    src.connect(bp).connect(g).connect(this.musicGain);
    src.start(time); src.stop(time + 0.2);
  }

  private bassNote(freq: number, time: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.22, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g).connect(this.musicGain);
    o.start(time); o.stop(time + dur + 0.05);
  }

  private padNote(freq: number, time: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = freq;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1200; lp.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.04, time + 0.4);
    g.gain.linearRampToValueAtTime(0.0001, time + dur);
    o.connect(lp).connect(g).connect(this.musicGain);
    o.start(time); o.stop(time + dur + 0.1);
  }

  private chime(freq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.1, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
    o.connect(g).connect(this.musicGain);
    o.start(time); o.stop(time + 1.3);
  }

  private noiseBuffer(seconds: number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ============== WIN JINGLE ==============
  private playWinJingle() {
    if (!this.ctx || !this.musicGain) return;
    this.fadeMusic(this.musicVolume, 0.3);
    const t0 = this.ctx.currentTime + 0.05;
    const root = 261.63; // C4
    const melody = [0, 4, 7, 12, 7, 12, 16, 19];
    melody.forEach((semi, i) => {
      const f = root * Math.pow(2, semi / 12);
      this.chime(f, t0 + i * 0.18);
      this.bassNote(f / 2, t0 + i * 0.18, 0.25);
    });
    // sparkle tail
    for (let i = 0; i < 6; i++) {
      this.chime(root * Math.pow(2, (12 + Math.floor(Math.random() * 12)) / 12), t0 + 1.6 + i * 0.12);
    }
  }

  // ============== SFX ==============
  private sfxBeep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.25, slideTo?: number) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // throttle slider tick
  private lastTick = 0;
  sfxTick() {
    const now = performance.now();
    if (now - this.lastTick < 40) return;
    this.lastTick = now;
    this.sfxBeep(900 + Math.random() * 200, 0.04, "square", 0.06);
  }

  sfxInvest() {
    if (!this.ctx || !this.sfxGain) return;
    // whoosh: filtered noise sweep
    const t = this.ctx.currentTime;
    const buf = this.noiseBuffer(0.4);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(3000, t + 0.25); bp.Q.value = 4;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0, t); g.gain.linearRampToValueAtTime(0.4, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(bp).connect(g).connect(this.sfxGain);
    src.start(t);
    // confirm beep
    this.sfxBeep(660, 0.12, "triangle", 0.3);
    setTimeout(() => this.sfxBeep(990, 0.18, "triangle", 0.3), 90);
  }

  sfxProfit() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.sfxBeep(f, 0.18, "sine", 0.25), i * 80));
  }

  sfxLoss() {
    [523, 466, 392, 349].forEach((f, i) => setTimeout(() => this.sfxBeep(f, 0.22, "sine", 0.22), i * 100));
  }

  sfxUnlock() {
    [880, 1320, 1760].forEach((f, i) => setTimeout(() => this.sfxBeep(f, 0.25, "sine", 0.18), i * 60));
  }

  sfxLifeline() {
    this.sfxBeep(1200, 0.18, "sine", 0.25, 1800);
  }

  sfxNewspaper() {
    // typewriter clicks
    for (let i = 0; i < 6; i++) {
      setTimeout(() => this.sfxBeep(1500 + Math.random() * 600, 0.03, "square", 0.12), i * 55);
    }
  }

  sfxTimerTick() {
    this.sfxBeep(1000, 0.06, "square", 0.14);
  }
}

export const audio = new AudioEngine();
