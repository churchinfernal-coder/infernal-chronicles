// Usage: node scripts/generate-ringtones.js
// Generates two short WAV ringtones in public/ringtones:
// - public/ringtones/default.wav
// - public/ringtones/classic.wav

const fs = require("fs");
const path = require("path");

function writeWav(filePath, samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * 2; // 16-bit
  const chunkSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write("WAVE", 8);

  // fmt subchunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // PCM samples (16-bit little endian)
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = Math.floor(s * 0x7fff);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  console.log(`Wrote ${filePath} (${dataSize} bytes of audio)`);
}

function generateSine(durationSec = 1.2, freq = 880, sampleRate = 44100, amplitude = 0.6) {
  const length = Math.floor(durationSec * sampleRate);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // simple exponential fade-out to avoid clicks
    const env = Math.pow(1 - t / durationSec, 1);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * amplitude * env;
  }
  return samples;
}

function generateSquare(durationSec = 1.2, freq = 660, sampleRate = 44100, amplitude = 0.6) {
  const length = Math.floor(durationSec * sampleRate);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const v = Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1;
    // gentle low-pass-ish smoothing to reduce harshness
    const env = Math.pow(1 - t / durationSec, 1.2);
    samples[i] = v * amplitude * env * 0.8;
  }
  return samples;
}

// Generate files
const outDir = path.join(__dirname, "..", "public", "ringtones");
const defaultPath = path.join(outDir, "default.wav");
const classicPath = path.join(outDir, "classic.wav");

const sine = generateSine(1.2, 880, 44100, 0.6);
writeWav(defaultPath, sine, 44100);

const square = generateSquare(1.2, 660, 44100, 0.6);
writeWav(classicPath, square, 44100);

console.log("Ringtones generated. Paths:");
console.log(" -", defaultPath);
console.log(" -", classicPath);