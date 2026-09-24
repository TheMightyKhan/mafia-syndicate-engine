const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function createWavBuffer(samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (SAMPLE_RATE * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // 'data' sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit PCM samples
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    let val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

// 1. NIGHT: Deep warm sub-bass fog drone + distant antique clock bell
function generateNight() {
  const duration = 2.8;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Sub-bass fog drone (50Hz + 75Hz warm gentle sine)
    const sub = Math.sin(2 * Math.PI * 50 * t) * 0.45 + Math.sin(2 * Math.PI * 75 * t) * 0.15;

    // Ambient warm hum envelope
    let envDrone = 1.0;
    if (t < 0.3) envDrone = t / 0.3;
    if (t > 1.8) envDrone = Math.max(0, (2.8 - t) / 1.0);

    // Distant antique clock bell struck at t=0.2s (fundamental 130.8Hz C3)
    let bell = 0;
    if (t >= 0.2) {
      const bt = t - 0.2;
      const bEnv = Math.exp(-bt * 2.2); // natural warm decay
      bell = (Math.sin(2 * Math.PI * 130.8 * bt) * 0.35 +
              Math.sin(2 * Math.PI * 261.6 * bt) * 0.12 +
              Math.sin(2 * Math.PI * 392.4 * bt) * 0.05) * bEnv;
    }

    samples[i] = (sub * envDrone + bell) * 0.7;
  }

  return samples;
}

// 2. DAY: Mellow church / morning city bell chime + subtle paper rustle
function generateDay() {
  const duration = 2.2;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Mellow bell chord struck at t=0.08s (E4 = 329.6Hz, A4 = 440Hz, C#5 = 554.4Hz)
    let bell = 0;
    if (t >= 0.08) {
      const bt = t - 0.08;
      const bEnv = Math.exp(-bt * 2.0); // warm gentle ring
      bell = (Math.sin(2 * Math.PI * 329.6 * bt) * 0.35 +
              Math.sin(2 * Math.PI * 440.0 * bt) * 0.25 +
              Math.sin(2 * Math.PI * 554.4 * bt) * 0.12) * bEnv;
    }

    // Soft newspaper / paper rustle at beginning (0.0s - 0.25s)
    let rustle = 0;
    if (t < 0.25) {
      const rEnv = Math.sin((t / 0.25) * Math.PI);
      const noise = (Math.random() * 2 - 1) * 0.08;
      rustle = noise * rEnv;
    }

    samples[i] = (bell + rustle) * 0.75;
  }

  return samples;
}

// 3. GAVEL: Dry, solid, non-reverberant heavy double wooden knock (tok... tok!)
function generateGavel() {
  const duration = 0.32;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(totalSamples);

  function knock(tOffset, pitchStart, pitchEnd, decayRate, gain) {
    return (t) => {
      if (t < tOffset) return 0;
      const kt = t - tOffset;
      if (kt > 0.1) return 0;

      const progress = kt / 0.08;
      const freq = pitchStart + (pitchEnd - pitchStart) * Math.min(1, progress * progress);
      const env = Math.exp(-kt * decayRate);

      // Wood body + acoustic transient thud
      const body = Math.sin(2 * Math.PI * freq * kt) * env;
      const click = (Math.random() * 2 - 1) * Math.exp(-kt * 180) * 0.3;

      return (body + click) * gain;
    };
  }

  const k1 = knock(0.01, 160, 65, 55, 0.7);
  const k2 = knock(0.12, 135, 55, 60, 0.85);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = k1(t) + k2(t);
  }

  return samples;
}

// 4. CARD: Very soft, subtle, dull micro-click (tactile mat click)
function generateCard() {
  const duration = 0.035; // 35ms total
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 160); // quick soft decay
    const freq = 220 - t * 2500; // smooth downward tone
    const wave = Math.sin(2 * Math.PI * Math.max(80, freq) * t);
    samples[i] = wave * env * 0.45;
  }

  return samples;
}

// 5. ELIMINATION: Heavy muted cinematic sub-thud
function generateElimination() {
  const duration = 1.6;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Sub-impact punch (48Hz decaying)
    const env = Math.exp(-t * 2.8);
    const punch = Math.sin(2 * Math.PI * 48 * t) * env * 0.7;

    // Distant low drone
    const droneEnv = Math.exp(-t * 1.5);
    const drone = Math.sin(2 * Math.PI * 65.4 * t) * droneEnv * 0.25;

    samples[i] = punch + drone;
  }

  return samples;
}

const soundsDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

fs.writeFileSync(path.join(soundsDir, 'night.wav'), createWavBuffer(generateNight()));
fs.writeFileSync(path.join(soundsDir, 'day.wav'), createWavBuffer(generateDay()));
fs.writeFileSync(path.join(soundsDir, 'gavel.wav'), createWavBuffer(generateGavel()));
fs.writeFileSync(path.join(soundsDir, 'card.wav'), createWavBuffer(generateCard()));
fs.writeFileSync(path.join(soundsDir, 'elimination.wav'), createWavBuffer(generateElimination()));

console.log('Successfully generated all cinematic audio files in public/sounds:');
console.log('- night.wav (Deep fog drone + antique bell)');
console.log('- day.wav (Mellow church chime + paper rustle)');
console.log('- gavel.wav (Dry hardwood double-thud)');
console.log('- card.wav (Soft tactile micro-click)');
console.log('- elimination.wav (Muted cinematic sub-impact)');
