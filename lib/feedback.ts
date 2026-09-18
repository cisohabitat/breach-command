export type FeedbackCue = "open" | "success" | "failure" | "warning" | "decision" | "complete";

/**
 * The audio layer is dependency-free and asset-free.
 *
 * A single AudioContext is created lazily on the first user gesture and shared
 * by every sound cue and by the adaptive score — no cue spins up or tears down
 * its own context any more.
 *
 * Signal flow:
 *
 *   SFX voices   ─▶ sfxBus  ─┐
 *                            ├─▶ masterGain ─▶ limiter ─▶ destination
 *   music voices ─▶ musicBus ┘
 *
 * The music bus is:
 *
 *   padOsc[0..2] ─▶ padLayer[0..2] ─▶ padFilter ─▶ padTrim ─▶ musicBus
 *   padLfo ─▶ lfoDepth ─▶ padTrim.gain        (tremolo = tempo / pulse)
 *
 * Because every voice shares one context and one bus structure the whole mix
 * passes through a single dynamics limiter, so overlapping cues never clip.
 */

/* ------------------------------------------------------------------ *
 * Shared graph
 * ------------------------------------------------------------------ */

type AudioGraph = {
  context: AudioContext;
  master: GainNode;
  limiter: DynamicsCompressorNode;
  sfxBus: GainNode;
  musicBus: GainNode;
};

const MASTER_LEVEL = 0.85;
const SFX_BUS_LEVEL = 1;
const SILENCE = 0.0001;

let graph: AudioGraph | null = null;

function ensureGraph(): AudioGraph | null {
  if (typeof window === "undefined") return null;
  if (graph) {
    if (graph.context.state === "suspended") void graph.context.resume();
    return graph;
  }
  const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = MASTER_LEVEL;
  // A fast, high-ratio compressor acts as a brick-wall-ish limiter. It is the
  // ceiling that keeps a pile-up of overlapping voices from clipping.
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  const sfxBus = context.createGain();
  sfxBus.gain.value = SFX_BUS_LEVEL;
  const musicBus = context.createGain();
  musicBus.gain.value = SILENCE;
  sfxBus.connect(master);
  musicBus.connect(master);
  master.connect(limiter);
  limiter.connect(context.destination);
  graph = { context, master, limiter, sfxBus, musicBus };
  if (graph.context.state === "suspended") void graph.context.resume();
  return graph;
}

/* ------------------------------------------------------------------ *
 * Deterministic variation helpers
 * ------------------------------------------------------------------ */

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

function hashKey(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// mulberry32 — tiny deterministic PRNG so a given (cue, call-index) always
// designs the same voice, which keeps the variation reproducible.
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

// Snap a semitone offset onto the nearest note of a scale so pitch variation
// always stays musical instead of landing on random detuned frequencies.
function quantizeSemitones(value: number, major: boolean): number {
  const scale = major ? MAJOR_SCALE : MINOR_SCALE;
  const target = clamp(value, -7, 8);
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let octave = -1; octave <= 1; octave += 1) {
    for (const degree of scale) {
      const candidate = octave * 12 + degree;
      const distance = Math.abs(candidate - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * Sound cue design
 * ------------------------------------------------------------------ */

type CueProfile = {
  notes: number[];
  spacing: number;
  noteLength: number;
  basePeak: number;
  /** Baseline severity, 0..1 (routine → critical). */
  severity: number;
  /** Baseline success margin, 0..1 (narrow escape → comfortable win). */
  margin: number;
};

const cueProfiles: Record<FeedbackCue, CueProfile> = {
  open: { notes: [220, 330], spacing: 0.1, noteLength: 0.16, basePeak: 0.16, severity: 0.1, margin: 0.6 },
  success: { notes: [440, 660, 880], spacing: 0.09, noteLength: 0.14, basePeak: 0.18, severity: 0.12, margin: 0.68 },
  failure: { notes: [190, 150], spacing: 0.13, noteLength: 0.2, basePeak: 0.17, severity: 0.72, margin: 0.15 },
  warning: { notes: [260, 260, 220], spacing: 0.11, noteLength: 0.16, basePeak: 0.16, severity: 0.82, margin: 0.12 },
  decision: { notes: [330, 440], spacing: 0.1, noteLength: 0.15, basePeak: 0.16, severity: 0.3, margin: 0.5 },
  complete: { notes: [392, 523, 659, 784], spacing: 0.11, noteLength: 0.18, basePeak: 0.17, severity: 0.15, margin: 0.9 },
};

// Call-local rolling state. It is the "context" the frozen public signature
// cannot carry: how the operation has been going shapes how the next cue is
// designed, so repeated successes (or a run of alarms) do not sound identical.
let sequence = 0;
let stress = 0;
let streak = 0;

export function playFeedback(cue: FeedbackCue, sound = true, haptics = true) {
  if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
    const pattern = cue === "warning" ? [35, 45, 70] : cue === "failure" ? [70, 35, 70] : [30];
    navigator.vibrate(pattern);
  }
  if (!sound || typeof window === "undefined") return;
  const bus = ensureGraph();
  if (!bus) return;

  const profile = cueProfiles[cue];
  const negative = cue === "warning" || cue === "failure";
  sequence += 1;
  if (negative) {
    stress = clamp(stress + 0.34, 0, 1);
    streak = 0;
  } else {
    stress = clamp(stress - 0.12, 0, 1);
    streak = Math.min(4, streak + 1);
  }

  // A deterministic-but-evolving seed: the cue picks the timbre family, the
  // monotonic call index guarantees successive identical cues still differ.
  const rand = mulberry32((hashKey(cue) ^ Math.imul(sequence, 0x9e3779b1)) >>> 0);

  // Interpret the raw cue against the rolling context.
  const severity = clamp(profile.severity + (negative ? stress * 0.18 : stress * 0.06), 0, 1);
  const margin = clamp(profile.margin + (cue === "success" ? streak * 0.06 : 0) - stress * 0.1, 0, 1);
  const brightness = clamp(0.5 + (margin - severity) * 0.55, 0, 1);

  // Pitch: a comfort win lifts the melody, a severe event drags it down. The
  // offset is snapped onto a scale so it stays in key.
  const transpose = quantizeSemitones(Math.round((margin - 0.5) * 5 - severity * 2 + (rand() * 2 - 1) * 2), brightness >= 0.5);
  const transposeRatio = Math.pow(2, transpose / 12);

  // Timbre palette: harsh families for trouble, clean families for good news.
  // Which entry is used rotates with the call index so each cue is voiced
  // slightly differently — the closest analogue to "which procedure ran".
  const palette: OscillatorType[] = negative ? ["sawtooth", "square", "triangle"] : ["sine", "triangle", "sawtooth"];
  const tempoScale = clamp(1 - margin * 0.2 + severity * 0.15, 0.7, 1.4);
  const now = bus.context.currentTime;

  profile.notes.forEach((base, index) => {
    const oscillator = bus.context.createOscillator();
    const filter = bus.context.createBiquadFilter();
    const gain = bus.context.createGain();
    const voiceRand = mulberry32((hashKey(`${cue}:${sequence}:${index}`) ^ 0x85ebca6b) >>> 0);
    const variant = Math.floor(voiceRand() * palette.length) % palette.length;

    oscillator.type = palette[variant];
    oscillator.frequency.value = base * transposeRatio;
    oscillator.detune.value = (voiceRand() * 2 - 1) * 15;

    filter.type = "lowpass";
    filter.frequency.value = clamp(900 + brightness * 4200 - severity * 400, 350, 7000) * (0.9 + voiceRand() * 0.2);
    filter.Q.value = 0.5 + severity * 0.9;

    // Velocity: bigger margins hit harder, critical events are pushed but tamed
    // so the harsher waveforms do not become painful.
    const peak = clamp(profile.basePeak * (0.72 + margin * 0.5) * (1 - severity * 0.12) * (0.9 + voiceRand() * 0.2), 0.05, 0.3);

    const start = now + index * profile.spacing * tempoScale;
    const attack = 0.008 + voiceRand() * 0.012;
    const decay = profile.noteLength * (1 + voiceRand() * 0.25);
    gain.gain.setValueAtTime(SILENCE, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(SILENCE, start + attack + decay);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(bus.sfxBus);
    oscillator.start(start);
    oscillator.stop(start + attack + decay + 0.02);
  });
}

/* ------------------------------------------------------------------ *
 * Adaptive score
 * ------------------------------------------------------------------ */

type PadVoice = { oscillator: OscillatorNode; gain: GainNode };

type PadState = {
  voices: PadVoice[];
  filter: BiquadFilterNode;
  tremolo: GainNode;
  lfo: OscillatorNode;
  root: number;
  band: number;
};

type MusicBand = {
  /** Interval ratios over the sector root — this is the "mode" of the drone. */
  ratios: [number, number, number];
  /** Tremolo rate in Hz — this is the "tempo" of the drone. */
  tremolo: number;
  cutoff: number;
  waves: [OscillatorType, OscillatorType, OscillatorType];
};

// Four tension bands. Calm is an open fifth; escalating tension swaps in a
// minor third and then a semitone cluster plus tritone, speeding the pulse up.
const MUSIC_BANDS: MusicBand[] = [
  { ratios: [1, 1.5, 2], tremolo: 0.5, cutoff: 520, waves: ["sine", "triangle", "triangle"] },
  { ratios: [1, 1.5, 2.997], tremolo: 1.3, cutoff: 700, waves: ["sine", "triangle", "sawtooth"] },
  { ratios: [1, 1.19, 1.5], tremolo: 2.1, cutoff: 880, waves: ["triangle", "triangle", "sawtooth"] },
  { ratios: [1, 1.06, 1.414], tremolo: 3, cutoff: 1060, waves: ["sawtooth", "sawtooth", "square"] },
];

const SECTOR_ROOTS = [55, 58.27, 61.74, 65.41, 73.42];
const MUSIC_LAYER_GAINS = [0.5, 0.16, 0.16];
const LFO_DEPTH = 0.16;
const BAND_THRESHOLDS = [0.3, 0.6, 0.85];

let pad: PadState | null = null;
let padTeardown: number | null = null;

function bandForTension(tension: number): number {
  if (tension >= BAND_THRESHOLDS[2]) return 3;
  if (tension >= BAND_THRESHOLDS[1]) return 2;
  if (tension >= BAND_THRESHOLDS[0]) return 1;
  return 0;
}

function ensurePad(bus: AudioGraph): PadState {
  if (pad) return pad;
  const context = bus.context;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = MUSIC_BANDS[0].cutoff;
  filter.Q.value = 0.8;
  const tremolo = context.createGain();
  tremolo.gain.value = 1 - LFO_DEPTH;
  const lfo = context.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = MUSIC_BANDS[0].tremolo;
  const lfoDepth = context.createGain();
  lfoDepth.gain.value = LFO_DEPTH;
  lfo.connect(lfoDepth);
  lfoDepth.connect(tremolo.gain);
  lfo.start();
  filter.connect(tremolo);
  tremolo.connect(bus.musicBus);
  const voices: PadVoice[] = [];
  MUSIC_LAYER_GAINS.forEach((layerGain, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = MUSIC_BANDS[0].waves[index];
    oscillator.frequency.value = SECTOR_ROOTS[0] * MUSIC_BANDS[0].ratios[index];
    const grain = context.createGain();
    grain.gain.value = layerGain;
    oscillator.connect(grain);
    grain.connect(filter);
    oscillator.start();
    voices.push({ oscillator, gain: grain });
  });
  pad = { voices, filter, tremolo, lfo, root: SECTOR_ROOTS[0], band: 0 };
  return pad;
}

function stopPad() {
  if (!pad) return;
  const current = pad;
  pad = null;
  try { current.lfo.stop(); } catch {}
  try { current.lfo.disconnect(); } catch {}
  current.voices.forEach(voice => {
    try { voice.oscillator.stop(); } catch {}
    try { voice.oscillator.disconnect(); } catch {}
  });
  try { current.filter.disconnect(); } catch {}
  try { current.tremolo.disconnect(); } catch {}
}

function applyBand(bus: AudioGraph, state: PadState, band: number, tension: number, sector: number) {
  const rootIndex = ((sector % SECTOR_ROOTS.length) + SECTOR_ROOTS.length) % SECTOR_ROOTS.length;
  const root = SECTOR_ROOTS[rootIndex];
  const spec = MUSIC_BANDS[band];
  const bandChanged = state.band !== band;
  const now = bus.context.currentTime;
  state.voices.forEach((voice, index) => {
    // Swapping the waveform is only worth the click when the mode actually
    // changes; pitch, detune and level track tension continuously.
    if (bandChanged) voice.oscillator.type = spec.waves[index];
    voice.oscillator.frequency.setTargetAtTime(root * spec.ratios[index], now, 0.4);
    voice.oscillator.detune.setTargetAtTime(tension * (index + 1) * 7 + (band - 1) * 4, now, 0.5);
    voice.gain.gain.setTargetAtTime(MUSIC_LAYER_GAINS[index] * (index === 0 ? 1 : 0.85 + tension * 0.4), now, 0.4);
  });
  state.filter.frequency.setTargetAtTime(spec.cutoff + tension * 600 + (sector % 3) * 90, now, 0.5);
  state.lfo.frequency.setTargetAtTime(spec.tremolo + tension * 0.6, now, 0.6);
  state.root = root;
  state.band = band;
}

export function setAdaptiveScore(enabled: boolean, tension = 0, sector = 0) {
  if (typeof window === "undefined") return;
  if (!enabled) {
    if (padTeardown !== null) return;
    if (graph && pad) {
      const now = graph.context.currentTime;
      graph.musicBus.gain.setTargetAtTime(SILENCE, now, 0.18);
      padTeardown = window.setTimeout(() => {
        padTeardown = null;
        stopPad();
      }, 600);
    }
    return;
  }
  if (padTeardown !== null) {
    window.clearTimeout(padTeardown);
    padTeardown = null;
  }
  const bus = ensureGraph();
  if (!bus) return;
  const state = ensurePad(bus);
  const clamped = clamp(tension, 0, 1);
  bus.musicBus.gain.setTargetAtTime(0.02 + clamped * 0.06, bus.context.currentTime, 0.35);
  applyBand(bus, state, bandForTension(clamped), clamped, sector);
}
