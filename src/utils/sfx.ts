/**
 * TDV BTL MAFIA - Cinematic & Realistic Audio SFX Engine
 * Soft, muted ("boğuq, tok"), non-fatiguing sound effects with 35% Master Volume.
 * Uses high-fidelity acoustic audio with resilient Web Audio API zero-latency fallback.
 */

const STORAGE_KEY = 'tdv_mafia_sound_muted';
const SOUND_EVENT_KEY = 'tdv_mafia_sound_change';

/** Standardized comfortable Master Volume (35%) */
const MASTER_VOLUME = 0.35;

let audioCtx: AudioContext | null = null;
const audioCache: Record<string, HTMLAudioElement> = {};

/** Get or initialize AudioContext safely */
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
 * Safely plays a realistic audio sound from /sounds directory with Master Volume.
 * Returns true if played successfully, or false to trigger the Web Audio fallback.
 */
function playAudioFile(soundPath: string, volumeScale: number = 1.0): boolean {
  if (typeof window === 'undefined') return false;
  try {
    let audio = audioCache[soundPath];
    if (!audio) {
      audio = new Audio(soundPath);
      audio.preload = 'auto';
      audioCache[soundPath] = audio;
    }

    audio.volume = Math.max(0, Math.min(1, MASTER_VOLUME * volumeScale));
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback silently if autoplay policy blocked or not loaded yet
      });
    }
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GECƏ FAZASI (playNight)
// Dərin, alçaq tezlikli duman bası və uzaqdan gələn sirli qədim saat zəngi.
// ─────────────────────────────────────────────────────────────────────────────
export function playNight(): void {
  if (isSoundMuted()) return;

  try {
    const played = playAudioFile('/sounds/night.wav', 1.0);
    if (played) return;
  } catch {
    // Continue to resilient fallback
  }

  // Resilient Web Audio Fallback: Warm sub-bass fog drone (no buzz)
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(MASTER_VOLUME * 0.7, now);
    masterGain.connect(ctx.destination);

    // Deep sub sine (52Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFilter = ctx.createBiquadFilter();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(52, now);

    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(140, now);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.4, now + 0.4);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(masterGain);

    subOsc.start(now);
    subOsc.stop(now + 2.6);

    // Distant warm clock chime (130.8Hz C3)
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    const chimeFilter = ctx.createBiquadFilter();

    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(130.8, now + 0.2);

    chimeFilter.type = 'lowpass';
    chimeFilter.frequency.setValueAtTime(320, now);

    chimeGain.gain.setValueAtTime(0.001, now + 0.2);
    chimeGain.gain.linearRampToValueAtTime(0.25, now + 0.23);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    chimeOsc.connect(chimeFilter);
    chimeFilter.connect(chimeGain);
    chimeGain.connect(masterGain);

    chimeOsc.start(now + 0.2);
    chimeOsc.stop(now + 2.3);
  } catch {
    // Never crash
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SƏHƏR FAZASI (playDay)
// Yumşaq səhər kilsə/şəhər zəngi zərbəsi və yüngül qəzet xışıltısı.
// ─────────────────────────────────────────────────────────────────────────────
export function playDay(): void {
  if (isSoundMuted()) return;

  try {
    const played = playAudioFile('/sounds/day.wav', 1.0);
    if (played) return;
  } catch {
    // Continue to resilient fallback
  }

  // Resilient Web Audio Fallback: Mellow warm bell chord
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(MASTER_VOLUME * 0.65, now);
    masterGain.connect(ctx.destination);

    const notes = [329.6, 440.0]; // Warm E4 & A4
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 1.9);
    });
  } catch {
    // Never crash
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MƏHKƏMƏ / EDAM (playGavel)
// Quru, əks-sədasız, təmiz və ağır ikiqat taxta məhkəmə çəkici taqqıltısı (tok... tok!).
// ─────────────────────────────────────────────────────────────────────────────
export function playGavel(): void {
  if (isSoundMuted()) return;

  try {
    const played = playAudioFile('/sounds/gavel.wav', 1.0);
    if (played) return;
  } catch {
    // Continue to resilient fallback
  }

  // Resilient Web Audio Fallback: Dry dense wood knocks
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(MASTER_VOLUME * 0.8, now);
    masterGain.connect(ctx.destination);

    const strikes = [0.01, 0.12];
    strikes.forEach((st, idx) => {
      const strikeTime = now + st;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 150 : 130, strikeTime);
      osc.frequency.exponentialRampToValueAtTime(55, strikeTime + 0.06);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, strikeTime);

      gain.gain.setValueAtTime(0.5, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(strikeTime);
      osc.stop(strikeTime + 0.08);
    });
  } catch {
    // Never crash
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. KART VƏ YA DÜYMƏ KLİKLƏNMƏSİ (playCard)
// Rahatsız etməyən, çox zərif "mat klik" (soft tactile micro-click) toxunuşu.
// ─────────────────────────────────────────────────────────────────────────────
export function playCard(): void {
  if (isSoundMuted()) return;

  try {
    const played = playAudioFile('/sounds/card.wav', 0.85);
    if (played) return;
  } catch {
    // Continue to resilient fallback
  }

  // Resilient Web Audio Fallback: Ultra-soft tactile micro-click
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(MASTER_VOLUME * 0.45, now);
    masterGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.025);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Never crash
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EDAM / QƏTL (playElimination)
// Dərin, boğuq kinematoqrafik sub-thud zərbəsi.
// ─────────────────────────────────────────────────────────────────────────────
export function playElimination(): void {
  if (isSoundMuted()) return;

  try {
    const played = playAudioFile('/sounds/elimination.wav', 1.0);
    if (played) return;
  } catch {
    // Continue to resilient fallback
  }

  // Resilient Web Audio Fallback: Muted cinematic sub-impact
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(MASTER_VOLUME * 0.75, now);
    masterGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 1.3);
  } catch {
    // Never crash
  }
}


export function playTick(): void {
  const ctx = getAudioContext();
  if (!ctx || isSoundMuted()) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
  gain.gain.setValueAtTime(MASTER_VOLUME * 0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}


// ─────────────────────────────────────────────────────────────────────────────
// CHAT MESSAGE PING
// ─────────────────────────────────────────────────────────────────────────────
export function playMessagePing(): void {
  if (isSoundMuted()) return;
  try {
    const played = playAudioFile('/sounds/chat_ping.wav', 0.5);
    if (played) return;
  } catch {}

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore
  }
}
