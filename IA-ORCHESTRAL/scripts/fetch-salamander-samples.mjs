import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "piano-audio");
const BASE = "https://tambien.github.io/Piano/audio/";

const ALL_NOTES = [
  21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87,
  90, 93, 96, 99, 102, 105, 108,
];

/** 16 couches = mapping fin MIDI 1–127 côté @tonejs/piano (velocities: 16). */
const VELOCITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const PEDAL = ["pedalD1.mp3", "pedalD2.mp3", "pedalU1.mp3", "pedalU2.mp3"];

function midiToNote(midi) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const oct = Math.floor(midi / 12) - 1;
  return names[midi % 12] + oct;
}

function fileNameForNote(midi, vel) {
  const n = midiToNote(midi).replace("#", "s");
  return `${n}v${vel}.mp3`;
}

async function downloadFile(name) {
  const url = BASE + name;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, name), buf);
  return name;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const tasks = [];
  for (const midi of ALL_NOTES) {
    for (const v of VELOCITIES) {
      tasks.push(fileNameForNote(midi, v));
    }
  }
  tasks.push(...PEDAL);

  console.log(`→ ${OUT_DIR}\n→ ${tasks.length} fichiers depuis ${BASE}`);
  let i = 0;
  for (const name of tasks) {
    await downloadFile(name);
    i++;
    if (i % 40 === 0 || i === tasks.length) console.log(`  ${i}/${tasks.length}`);
  }
  console.log("Terminé. @tonejs/piano : velocities: 16 dans l’app.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
