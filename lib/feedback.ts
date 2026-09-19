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
 *
 * ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ *
 *
 *   playFeedback(cue, sound?, haptics?, context?)
 *
 * The first three arguments are the frozen original signature and keep working
 * unchanged. The optional fourth argument carries the real outcome of the
 * action that produced the cue:
 *
 *   // Turn result: identity audit, natural 14 + 3 = 17 against a threshold of 11.
 *   playFeedback(
 *     result.adversaryEvent ? "warning" : result.success ? "success" : "failure",
 *     soundEnabled,
 *     hapticsEnabled,
 *     {
 *       procedure: id,                                    // Turn.procedure
 *       success: result.success,                          // Turn.success
 *       roll: result.raw,                                 // Turn.raw
 *       total: result.total,                              // Turn.total
 *       threshold: difficulties[next.difficulty].threshold,
 *       impact: next.impact,                              // Game.impact
 *       continuity: next.continuity,                      // Game.continuity
 *       turn: result.number,                              // Turn.number
 *       stageRevealed: !!result.revealed,                 // Turn.revealed
 *     },
 *   );
 *
 * When the context is omitted (every existing call site) the voice is designed
 * from the rolling module state exactly as before — same numbers, same order of
 * PRNG draws, same haptic patterns. When it is present the real values drive
 * the design instead: the procedure picks the register and timbre family, the
 * margin picks pitch and velocity, the incident pressure darkens the timbre,
 * and a stage reveal gets its own articulation.
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
 * Per-action context
 * ------------------------------------------------------------------ */

/**
 * Optional fourth argument for {@link playFeedback}. It carries what the cue
 * itself cannot know: which procedure ran, how the roll actually landed and how
 * badly the incident is going.
 *
 * Every field is optional. A field that is absent contributes nothing, so a
 * caller can pass only the values it has and the remaining dimensions keep the
 * synthesised behaviour. Field names and ranges follow the engine types in
 * `lib/game.ts` and `lib/advanced-game.ts` so a call site can be wired up by
 * copying values straight across:
 *
 * - `procedure`      → `Turn.procedure` / `procedures[].id` (endpoint, identity, forensic, …).
 * - `success`        → `Turn.success`.
 * - `roll`           → `Turn.raw` (the natural d20 face, 1..20).
 * - `total`          → `Turn.total` (raw + every modifier).
 * - `threshold`      → `difficulties[game.difficulty].threshold` (10 / 11 / 12).
 * - `margin`         → `total - threshold`. Supplied directly when the caller
 *                      already has it; otherwise derived from `total`/`threshold`.
 * - `impact`         → `Game.impact` after the action, 0..100 (higher is worse).
 * - `continuity`     → `Game.continuity` after the action, 0..100 (lower is worse).
 * - `turn`           → `Turn.number` (1-based).
 * - `stageRevealed`  → `!!Turn.revealed` (a previously hidden attack stage opened up).
 */
export type FeedbackContext = {
  procedure?: string | null;
  success?: boolean | null;
  roll?: number | null;
  total?: number | null;
  threshold?: number | null;
  margin?: number | null;
  impact?: number | null;
  continuity?: number | null;
  turn?: number | null;
  stageRevealed?: boolean | null;
};

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * The voice of an investigative domain. Register, scale and envelope do most of
 * the work — an identity audit and a forensic triage should be told apart
 * before the player reads the report — while the palette supplies the secondary
 * timbre family, ordered calm → harsh so severity can pick into it.
 *
 * Multipliers are relative to the cue defaults (1 = unchanged).
 */
type ProcedureVoice = {
  /** Fixed register offset in semitones. Identity sits at 0 as the reference voice. */
  register: number;
  /** Ordered calm → harsh wave table. */
  palette: OscillatorType[];
  /** Whether the domain prefers an open (major) or guarded (minor) scale. */
  major: boolean;
  attack: number;
  decay: number;
  /** Per-voice detune spread in cents — how wide the "room" sounds. */
  spread: number;
  /** Note-spacing bias, i.e. how deliberate the figure reads. */
  spacing: number;
};

const procedureVoices: Record<string, ProcedureVoice | undefined> = {
  // Blunt and percussive: something ran on a host.
  endpoint: { register: -3, palette: ["triangle", "square", "sawtooth"], major: false, attack: 0.7, decay: 0.85, spread: 6, spacing: 0.95 },
  // The reference voice: clean, tonal, authoritative.
  identity: { register: 0, palette: ["sine", "triangle", "square"], major: true, attack: 1, decay: 1, spread: 4, spacing: 1 },
  // Airy and flowing, with a slow attack and a wide stereo-free "corridor".
  network: { register: 5, palette: ["sine", "triangle", "sawtooth"], major: true, attack: 1.6, decay: 1.35, spread: 12, spacing: 1.15 },
  // Clipped and gated: a boundary closing on a session.
  firewall: { register: -5, palette: ["square", "sawtooth"], major: false, attack: 0.35, decay: 0.6, spread: 3, spacing: 0.8 },
  // Message-shaped: short, mid register, delivered rather than played.
  email: { register: 3, palette: ["sine", "triangle", "square"], major: true, attack: 0.9, decay: 0.9, spread: 5, spacing: 0.9 },
  // Mechanical and resonant, like a service responding.
  server: { register: -2, palette: ["triangle", "square", "sawtooth"], major: false, attack: 1.1, decay: 1.15, spread: 7, spacing: 1.05 },
  // Remote and shimmering: highest register, slow onset, widest detune.
  cloud: { register: 7, palette: ["sine", "triangle", "sawtooth"], major: true, attack: 2.2, decay: 1.5, spread: 18, spacing: 1.25 },
  // A resolver ping: tiny attack, tiny decay, tight figure.
  dns: { register: 2, palette: ["sine", "square"], major: true, attack: 0.25, decay: 0.45, spread: 2, spacing: 0.7 },
  // Low and brooding: the deliberate sweep of a hypothesis test.
  hunt: { register: -7, palette: ["triangle", "sawtooth"], major: false, attack: 1.4, decay: 1.6, spread: 14, spacing: 1.1 },
  // Clinical and granular: long onset, long tail, widest spread of all.
  forensic: { register: -4, palette: ["triangle", "square", "sawtooth"], major: false, attack: 2.6, decay: 1.9, spread: 22, spacing: 1.3 },
  // Distant and chorused: correlated from somewhere else.
  intel: { register: 4, palette: ["sine", "triangle", "sawtooth"], major: true, attack: 2, decay: 1.7, spread: 10, spacing: 1.2 },
};

/**
 * Context reduced to the handful of numbers the voice designer understands.
 * Neutral values are 0 / null / 1, so a context that says nothing about a given
 * dimension leaves that dimension exactly as it would have been.
 */
type CueModulation = {
  /** Added to the cue's baseline severity; positive darkens the voice. */
  severity: number;
  /** Replaces the synthesised margin when the real outcome is known. */
  margin: number | null;
  /** Added after the severity/margin blend; positive opens the low-pass. */
  brightness: number;
  /** Register shift in semitones: procedure family, outcome and reveal. */
  semitones: number;
  /** Scale preference, or null to keep the brightness-selected scale. */
  major: boolean | null;
  /** Timbre family, or null to keep the cue's own palette. */
  palette: OscillatorType[] | null;
  /** 0..1 target position inside the palette (calm → harsh). */
  harshness: number;
  /** Low-pass multiplier; below 1 muffles, above 1 opens. */
  filter: number;
  /** Filter resonance added to the cue's base Q. */
  resonance: number;
  /** Velocity multiplier. */
  velocity: number;
  /** Figure tempo / spacing multiplier. */
  tempo: number;
  attack: number;
  decay: number;
  /** Extra detune spread in cents. */
  spread: number;
  /** Whether to append the stage-reveal flourish. */
  reveal: boolean;
  /** Haptic pattern override, or null to keep the cue's default pattern. */
  haptics: number[] | null;
};

type HapticSignals = {
  reveal: boolean;
  nearMiss: number;
  missDepth: number;
  incident: number;
  comfortable: number;
  success: boolean;
  failure: boolean;
};

/**
 * Haptics answer the same question as the sound, so they follow the same
 * signals: a collapse jolts twice and long, a near miss is one short thud, a
 * reveal is two taps and a confirming buzz, and a comfortable win is a small
 * satisfied roll. Anything the context does not speak to returns null, which
 * keeps the original cue pattern.
 */
function contextHaptics(cue: FeedbackCue, signals: HapticSignals): number[] | null {
  if (signals.reveal) return [24, 40, 24, 40, 90];
  if (signals.failure) return signals.nearMiss > 0.6 ? [45, 35, 45] : [85, 40, 85, 40, 130];
  if (signals.success) return signals.comfortable > 0.5 ? [22, 26, 22] : [30];
  if (cue === "warning") return signals.incident > 0.5 ? [40, 45, 75, 45, 95] : null;
  if (signals.incident > 0.6) return [35, 40, 60];
  return null;
}

/**
 * Turn real game context into voice parameters. The signals, in the order the
 * player would feel them:
 *
 * - outcome margin  → pitch and velocity. A comfortable success lifts the
 *   register and hits harder; a failure that missed by a hair stays close to the
 *   figure instead of collapsing, hanging a semitone under the bar; a failure
 *   that was nowhere near drops the register and hardens the timbre.
 * - incident pressure (impact up, continuity down) → severity, low-pass cutoff,
 *   resonance and tail length, i.e. a darker, longer, less stable voice.
 * - turn number → a slow escalation, so late cues in an incident are heavier.
 * - stage reveal → a distinct articulation: a bright open register plus a
 *   flourish appended after the figure (see scheduleRevealFlourish).
 * - procedure → the register, scale, envelope and timbre family of the domain.
 */
function contextModulation(context: FeedbackContext, cue: FeedbackCue): CueModulation {
  const roll = finiteOrNull(context.roll);
  const total = finiteOrNull(context.total);
  const threshold = finiteOrNull(context.threshold);
  const impact = finiteOrNull(context.impact);
  const continuity = finiteOrNull(context.continuity);
  const turn = finiteOrNull(context.turn);
  const voice = context.procedure ? procedureVoices[context.procedure] ?? null : null;

  // The signed margin is the most useful single number: how far the action
  // finished from the bar. It can be handed over directly or derived from the
  // total and the threshold the action had to clear.
  const signedMargin = finiteOrNull(context.margin) ?? (total !== null && threshold !== null ? total - threshold : null);

  // Outcome is explicit when the caller knows it, otherwise read from the sign
  // of a known margin. A context with neither leaves the cue's own reading of
  // the outcome alone.
  const outcome = typeof context.success === "boolean" ? context.success : signedMargin === null ? null : signedMargin >= 0;
  const success = outcome === true;
  const failure = outcome === false;

  // How far past the bar a success went (1 = crushed it, 0 = scraped through),
  // and how deep a failure was (1 = nowhere near, 0 = missed by a hair). A
  // failure with no margin is assumed middling rather than catastrophic.
  const comfortable = success && signedMargin !== null ? clamp(signedMargin / 8, 0, 1) : 0;
  const missDepth = failure ? (signedMargin === null ? 0.55 : clamp(Math.abs(signedMargin) / 8, 0, 1)) : 0;
  const nearMiss = failure ? 1 - missDepth : 0;

  // Incident pressure: a high business impact or a falling continuity value
  // darkens the cue. When only one of the two is supplied it speaks alone.
  const pressures = [
    impact === null ? null : clamp(impact / 100, 0, 1),
    continuity === null ? null : clamp(1 - continuity / 100, 0, 1),
  ].filter((value): value is number => value !== null);
  const incident = pressures.length ? pressures.reduce((sum, value) => sum + value, 0) / pressures.length : 0;
  const turnRamp = turn === null ? 0 : clamp((turn - 1) / 12, 0, 1);
  const reveal = context.stageRevealed === true;

  // A natural 1 that still failed reads as the die turning on the analyst.
  const severity = clamp(
    incident * 0.2 + missDepth * 0.24 - nearMiss * 0.18 + turnRamp * 0.07 + (failure && roll === 1 ? 0.06 : 0),
    -0.2,
    0.6,
  );

  // Margin, 0..1, from the real roll: 0.56 scraped through, ~1 crushed it;
  // ~0.48 missed by a hair, 0.04 collapsed.
  const margin = !success && !failure
    ? null
    : success
      ? clamp(0.56 + comfortable * 0.4 + (roll !== null && roll >= 18 ? 0.05 : 0), 0, 1)
      : clamp(0.34 - missDepth * 0.3 + nearMiss * 0.14, 0, 1);

  // Register: the procedure's own domain, lifted for a reveal and for a
  // comfortable win, dropped for a heavy miss.
  const semitones =
    (voice?.register ?? 0) + (reveal ? 5 : 0) + (failure ? nearMiss - missDepth * 3 : 0) + (success ? comfortable : 0);

  return {
    severity,
    margin,
    brightness: (reveal ? 0.3 : 0) - incident * 0.15 + (roll === 20 && !failure ? 0.05 : 0),
    semitones,
    // A reveal is the one moment that opens rather than closes, so it takes the
    // open scale; otherwise the domain's own preference, or none.
    major: reveal ? true : voice?.major ?? null,
    palette: reveal ? ["sine", "triangle", "square"] : voice?.palette ?? null,
    harshness: clamp(0.28 + severity * 0.7 + missDepth * 0.25 - nearMiss * 0.2, 0, 1),
    filter: clamp(1 + (reveal ? 0.35 : 0) - incident * 0.28 - missDepth * 0.1 + nearMiss * 0.08 + comfortable * 0.06, 0.5, 1.8),
    resonance: clamp(incident + missDepth * 0.5 - nearMiss * 0.25, -0.3, 1.5),
    velocity: clamp(1 + comfortable * 0.12 + (reveal ? 0.1 : 0) - missDepth * 0.08 - incident * 0.05, 0.7, 1.3),
    tempo: clamp(1 - comfortable * 0.08 + incident * 0.1 + nearMiss * 0.05, 0.8, 1.3) * (voice?.spacing ?? 1),
    attack: clamp((voice?.attack ?? 1) * (1 + incident * 0.15) * (1 - nearMiss * 0.25), 0.2, 3.2),
    decay: clamp((voice?.decay ?? 1) * (1 + incident * 0.25) * (1 - nearMiss * 0.2), 0.3, 3.5),
    spread: clamp((voice?.spread ?? 0) * (1 + incident * 0.5), 0, 40),
    reveal,
    haptics: contextHaptics(cue, { reveal, nearMiss, missDepth, incident, comfortable, success, failure }),
  };
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
// It stays in place as the fallback voice and as the ambient texture even when a
// real context is supplied.
let sequence = 0;
let stress = 0;
let streak = 0;

/**
 * Play a feedback cue.
 *
 * @param cue     Which cue to voice.
 * @param sound   Sound on/off (default true).
 * @param haptics Haptics on/off (default true).
 * @param context Optional per-action game context. When omitted the voice is
 *                designed from rolling module state exactly as it was before
 *                this parameter existed; when present the real procedure,
 *                outcome margin, incident pressure and reveal drive the design
 *                (see {@link FeedbackContext} for the field mapping).
 */
export function playFeedback(cue: FeedbackCue, sound = true, haptics = true, context?: FeedbackContext | null) {
  // Pure derivation: no audio graph is touched here, so it can run before the
  // haptics branch and the lazily-created AudioContext is still untouched.
  const mod = context ? contextModulation(context, cue) : null;

  if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
    const pattern = mod?.haptics ?? (cue === "warning" ? [35, 45, 70] : cue === "failure" ? [70, 35, 70] : [30]);
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

  // Interpret the raw cue against the rolling context, then let the real context
  // override the dimensions it actually knows about. Every context term is
  // neutral when no context was supplied, so the fallback numbers are the
  // originals and the PRNG below is drawn in the same order as before.
  const severity = clamp(profile.severity + (negative ? stress * 0.18 : stress * 0.06) + (mod?.severity ?? 0), 0, 1);
  const margin = mod?.margin ?? clamp(profile.margin + (cue === "success" ? streak * 0.06 : 0) - stress * 0.1, 0, 1);
  const brightness = clamp(0.5 + (margin - severity) * 0.55 + (mod?.brightness ?? 0), 0, 1);

  // Pitch: a comfort win lifts the melody, a severe event drags it down. The
  // real margin and procedure register move it further; the offset is snapped
  // onto a scale so it stays in key.
  const majorScale = mod?.major ?? brightness >= 0.5;
  const transpose = quantizeSemitones(Math.round((margin - 0.5) * 5 - severity * 2 + (rand() * 2 - 1) * 2 + (mod?.semitones ?? 0)), majorScale);
  const transposeRatio = Math.pow(2, transpose / 12);

  // Timbre palette: harsh families for trouble, clean families for good news.
  // A procedure-aware call swaps in that domain's family instead, and severity
  // then picks the position inside it (calm → harsh) rather than rotating
  // blindly through the call index.
  const palette: OscillatorType[] = mod?.palette ?? (negative ? ["sawtooth", "square", "triangle"] : ["sine", "triangle", "sawtooth"]);
  // Context scales, all neutral (0 or 1) on the fallback path.
  const tempoScale = clamp(1 - margin * 0.2 + severity * 0.15, 0.7, 1.4) * (mod?.tempo ?? 1);
  const filterScale = mod?.filter ?? 1;
  const resonance = mod?.resonance ?? 0;
  const velocityScale = mod?.velocity ?? 1;
  const attackScale = mod?.attack ?? 1;
  const decayScale = mod?.decay ?? 1;
  const spread = mod?.spread ?? 0;
  const now = bus.context.currentTime;

  profile.notes.forEach((base, index) => {
    const oscillator = bus.context.createOscillator();
    const filter = bus.context.createBiquadFilter();
    const gain = bus.context.createGain();
    const voiceRand = mulberry32((hashKey(`${cue}:${sequence}:${index}`) ^ 0x85ebca6b) >>> 0);
    const variant = mod
      ? clamp(Math.round(mod.harshness * (palette.length - 1) + (voiceRand() * 2 - 1) * 0.6), 0, palette.length - 1)
      : Math.floor(voiceRand() * palette.length) % palette.length;

    oscillator.type = palette[variant];
    oscillator.frequency.value = base * transposeRatio;
    oscillator.detune.value = (voiceRand() * 2 - 1) * 15 + spread;

    filter.type = "lowpass";
    filter.frequency.value = clamp(900 + brightness * 4200 - severity * 400, 350, 7000) * (0.9 + voiceRand() * 0.2) * filterScale;
    filter.Q.value = 0.5 + severity * 0.9 + resonance;

    // Velocity: bigger margins hit harder, critical events are pushed but tamed
    // so the harsher waveforms do not become painful.
    const peak = clamp(profile.basePeak * (0.72 + margin * 0.5) * (1 - severity * 0.12) * (0.9 + voiceRand() * 0.2) * velocityScale, 0.05, 0.3);

    const start = now + index * profile.spacing * tempoScale;
    const attack = (0.008 + voiceRand() * 0.012) * attackScale;
    const decay = profile.noteLength * (1 + voiceRand() * 0.25) * decayScale;
    gain.gain.setValueAtTime(SILENCE, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(SILENCE, start + attack + decay);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(bus.sfxBus);
    oscillator.start(start);
    oscillator.stop(start + attack + decay + 0.02);
  });

  if (mod?.reveal) {
    scheduleRevealFlourish(bus, {
      now,
      // Enter on the last note of the figure so the two read as "the procedure
      // ran, then a stage opened" instead of two overlapping events.
      offset: profile.notes.length * profile.spacing * tempoScale,
      root: profile.notes[0] * transposeRatio,
      brightness,
      severity,
    });
  }
}

/**
 * The one articulation a routine success never gets: a fifth sliding up onto the
 * octave, then a clean bell that rings on after the procedure figure stops. It
 * is deliberately interval-shaped rather than note-shaped so a reveal is
 * recognisable whatever the procedure ran.
 */
function scheduleRevealFlourish(
  bus: AudioGraph,
  timing: { now: number; offset: number; root: number; brightness: number; severity: number },
) {
  const context = bus.context;
  const start = timing.now + timing.offset;
  const lift = 0.85 + timing.brightness * 0.3 - timing.severity * 0.15;

  const glide = context.createOscillator();
  const glideFilter = context.createBiquadFilter();
  const glideGain = context.createGain();
  glide.type = "sine";
  glide.frequency.setValueAtTime(timing.root * Math.pow(2, 7 / 12), start);
  glide.frequency.exponentialRampToValueAtTime(timing.root * 2, start + 0.18);
  glideFilter.type = "lowpass";
  glideFilter.frequency.value = clamp(1200 + timing.brightness * 4200, 600, 6500);
  glideGain.gain.setValueAtTime(SILENCE, start);
  glideGain.gain.exponentialRampToValueAtTime(clamp(0.12 * lift, 0.04, 0.2), start + 0.012);
  glideGain.gain.exponentialRampToValueAtTime(SILENCE, start + 0.3);
  glide.connect(glideFilter);
  glideFilter.connect(glideGain);
  glideGain.connect(bus.sfxBus);
  glide.start(start);
  glide.stop(start + 0.34);

  const bells: { wave: OscillatorType; ratio: number; peak: number; decay: number }[] = [
    { wave: "sine", ratio: 4, peak: 0.09, decay: 0.7 },
    { wave: "triangle", ratio: 2, peak: 0.06, decay: 0.55 },
  ];
  bells.forEach(bell => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = bell.wave;
    oscillator.frequency.value = timing.root * bell.ratio;
    oscillator.detune.value = 4;
    gain.gain.setValueAtTime(SILENCE, start);
    gain.gain.exponentialRampToValueAtTime(clamp(bell.peak * lift, 0.03, 0.16), start + 0.005);
    gain.gain.exponentialRampToValueAtTime(SILENCE, start + bell.decay);
    oscillator.connect(gain);
    gain.connect(bus.sfxBus);
    oscillator.start(start);
    oscillator.stop(start + bell.decay + 0.02);
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
