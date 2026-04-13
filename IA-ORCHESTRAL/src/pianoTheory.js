/**
 * Gammes, modes et accords diatoniques (tierces empilées sur la gamme).
 * Références classiques : degrés ionien / modes de l’échelle majeure, mineur harmonique & mélodique.
 */

export const MODES = {
  ionian: { label: "Ionien (majeur)", intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian: { label: "Dorien", intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { label: "Phrygien", intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { label: "Lydien", intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { label: "Mixolydien", intervals: [0, 2, 4, 5, 7, 9, 10] },
  aeolian: { label: "Éolien (mineur naturel)", intervals: [0, 2, 3, 5, 7, 8, 10] },
  locrian: { label: "Locrien", intervals: [0, 1, 3, 5, 6, 8, 10] },
  harmonicMinor: { label: "Mineur harmonique", intervals: [0, 2, 3, 5, 7, 8, 11] },
  melodicMinor: { label: "Mineur mélodique (asc.)", intervals: [0, 2, 3, 5, 7, 9, 11] },
};

const PC_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PC_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const NAME_TO_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** MIDI 1–127 → amplitude 0–1 pour Tone / @tonejs/piano (évite 0 = silence total). */
export function midiVelocityToUnit(v) {
  const n = Math.max(1, Math.min(127, Number(v) || 64));
  return n / 127;
}

export function parseTonicPc(tonicStr) {
  const m = String(tonicStr || "")
    .trim()
    .match(/^([A-Ga-g])([#b]?)$/);
  if (!m) return null;
  let pc = NAME_TO_PC[m[1].toUpperCase()];
  if (m[2] === "#") pc = (pc + 1) % 12;
  if (m[2] === "b") pc = (pc + 11) % 12;
  return pc;
}

/** Convention alignée sur le reste du projet : C4 = 60. */
export function noteToMidi(note) {
  const m = String(note).match(/^([A-G])(#|b)?(\d)$/);
  if (!m) return null;
  let pc = NAME_TO_PC[m[1]];
  if (m[2] === "#") pc++;
  if (m[2] === "b") pc += 11;
  pc = ((pc % 12) + 12) % 12;
  const oct = parseInt(m[3], 10);
  return 12 * (oct + 1) + pc;
}

export function midiToNote(midi, preferFlats = false) {
  const m = Math.round(midi);
  const names = preferFlats ? PC_NAMES_FLAT : PC_NAMES_SHARP;
  const oct = Math.floor(m / 12) - 1;
  return names[((m % 12) + 12) % 12] + oct;
}

function midiFromOctaveAndPc(octave, pc) {
  const p = ((pc % 12) + 12) % 12;
  return 12 * (octave + 1) + p;
}

/**
 * Accords diatoniques : degré romain 1–7, tierces sur la gamme (pas chromatique arbitraire).
 * @param {string} tonicNote — ex. "C4"
 * @param {keyof typeof MODES} modeKey
 * @param {number} romanDegree 1–7
 * @param {boolean} withSeventh
 * @returns {{ notes: string[], label: string }}
 */
export function buildDiatonicChord(tonicNote, modeKey, romanDegree, withSeventh) {
  const tonicMidi = noteToMidi(tonicNote);
  if (tonicMidi == null) return { notes: [], label: "?" };
  const mode = MODES[modeKey];
  if (!mode) return { notes: [], label: "?" };

  const tonicPc = tonicMidi % 12;
  const baseOct = Math.floor(tonicMidi / 12) - 1;
  const iv = mode.intervals;
  const R = ((romanDegree - 1) % 7) + 1;
  const steps = withSeventh ? [0, 2, 4, 6] : [0, 2, 4];

  const pcs = steps.map((s) => (tonicPc + iv[(R - 1 + s) % 7]) % 12);
  const midis = [];
  let m0 = midiFromOctaveAndPc(baseOct, pcs[0]);
  midis.push(m0);
  for (let i = 1; i < pcs.length; i++) {
    let cand = midiFromOctaveAndPc(baseOct, pcs[i]);
    while (cand <= midis[midis.length - 1]) cand += 12;
    midis.push(cand);
  }

  const notes = midis.map((mi) => midiToNote(mi));
  const rootName = notes[0].replace(/\d+$/, "");
  const label = `${rootName}${withSeventh ? "7" : ""} · ${romanDegree}${withSeventh ? " (7e)" : ""}`;
  return { notes, label };
}

export const ROMAN_LABELS = ["I", "II", "III", "IV", "V", "VI", "VII"];

export const TONIC_OPTIONS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
