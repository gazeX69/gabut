/**
 * Generates minimal WAV files for runtime audio demo.
 * Run: node apps/runtime/src/audio/generate-demo-audio.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../../../../projects/demo-project/assets/audio');

function writeToneWav(filePath, frequencyHz, durationSec, amplitude = 0.25) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const data = Buffer.alloc(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * amplitude;
    data[i] = Math.max(0, Math.min(255, Math.floor((sample + 1) * 127.5)));
  }

  const header = Buffer.alloc(44);
  const byteRate = sampleRate;
  const blockAlign = 1;
  const dataSize = data.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.concat([header, data]));
}

fs.mkdirSync(outDir, { recursive: true });
writeToneWav(path.join(outDir, 'music-scene-a.wav'), 220, 2.5, 0.2);
writeToneWav(path.join(outDir, 'music-scene-b.wav'), 330, 2.5, 0.2);
writeToneWav(path.join(outDir, 'sfx-interact.wav'), 660, 0.12, 0.4);
writeToneWav(path.join(outDir, 'sfx-trigger.wav'), 440, 0.15, 0.35);
writeToneWav(path.join(outDir, 'sfx-blocked.wav'), 110, 0.08, 0.45);
console.log(`Wrote demo audio to ${outDir}`);
