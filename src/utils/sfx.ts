/**
 * TDV BTL MAFIA - Web Audio API Zero-Latency Sound Synthesis Engine
 * No external .mp3 or .wav assets required. 100% browser-native synthesis.
 */

const STORAGE_KEY = 'tdv_mafia_sound_muted';
const SOUND_EVENT_KEY = 'tdv_mafia_sound_change';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Check if global sound is currently muted */
export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Set sound mute state */
export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent(SOUND_EVENT_KEY, { detail: { muted } }));
  } catch {
    // Ignore
  }
}

/** Toggle mute state and return the new muted status */
export function toggleSound(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
}

/** Subscribe to sound mute changes */
export function subscribeSound(callback: (muted: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ muted: boolean }>;
    callback(custom.detail?.muted ?? isSoundMuted());
  };
  window.addEventListener(SOUND_EVENT_KEY, handler);
  return () => {
    window.removeEventListener(SOUND_EVENT_KEY, handler);
  };
}

/**
 * 1. NIGHT PHASE TRANSITION
 * Deep, atmospheric sub-bass drone and ominous pitch drop.
 */
export function playNight(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Sub-bass glide
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(65, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 2.4);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.35, now + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 2.6);

    // Ominous low drone with low-pass filter
    const droneOsc = ctx.createOscillator();
    const droneFilter = ctx.createBiquadFilter();
    const droneGain = ctx.createGain();

    droneOsc.type = 'sawtooth';
    droneOsc.frequency.setValueAtTime(82.4, now); // Low E
    droneOsc.frequency.exponentialRampToValueAtTime(73.4, now + 2.2);

    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(260, now);
    droneFilter.frequency.exponentialRampToValueAtTime(70, now + 2.2);

    droneGain.gain.setValueAtTime(0.001, now);
    droneGain.gain.linearRampToValueAtTime(0.18, now + 0.4);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(ctx.destination);
    droneOsc.start(now);
    droneOsc.stop(now + 2.6);
  } catch {
    // Graceful fallback
  }
}

/**
 * 2. DAY PHASE TRANSITION
 * Uplifting, crystal-clear morning bell chord (C-E-G-C arpeggio).
 */
export function playDay(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chordNotes = [
      { freq: 523.25, time: 0.0 }, // C5
      { freq: 659.25, time: 0.08 }, // E5
      { freq: 783.99, time: 0.16 }, // G5
      { freq: 1046.5, time: 0.24 }, // C6
    ];

    chordNotes.forEach(({ freq, time }) => {
      const noteTime = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 1.3);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * 3. GAVEL STRIKE (JUDGE / VOTING COURT)
 * Sharp, double wooden gavel impact.
 */
export function playGavel(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const strikes = [0, 0.09]; // Double knock

    strikes.forEach((st) => {
      const strikeTime = now + st;

      // Body of gavel
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, strikeTime);
      osc.frequency.exponentialRampToValueAtTime(50, strikeTime + 0.08);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, strikeTime);
      filter.Q.setValueAtTime(4, strikeTime);

      gain.gain.setValueAtTime(0.35, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(strikeTime);
      osc.stop(strikeTime + 0.13);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * 4. CARD SELECTION / INTERACTION
 * Subtle crisp card swoosh and snap.
 */
export function playCard(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(500, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // Graceful fallback
  }
}

/**
 * 5. ELIMINATION / LYNCHING / MURDER
 * Dramatic suspense sting with deep tritone drop and heavy impact.
 */
export function playElimination(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Heavy low impact
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'sine';
    punchOsc.frequency.setValueAtTime(120, now);
    punchOsc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    punchGain.gain.setValueAtTime(0.4, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    punchOsc.connect(punchGain);
    punchGain.connect(ctx.destination);
    punchOsc.start(now);
    punchOsc.stop(now + 0.65);

    // Ominous dissonant tritone (A2 = 110Hz + D#3 = 155.56Hz)
    const tones = [110, 155.56];
    tones.forEach((f) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 1.6);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    });
  } catch {
    // Graceful fallback
  }
}
