import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { Piano } from "@tonejs/piano/build/piano/Piano.js";
import { MODES, ROMAN_LABELS, TONIC_OPTIONS, buildDiatonicChord, midiVelocityToUnit } from "./pianoTheory.js";

/** Ordre d’essai : max réalisme → minimal (si dossier local incomplet). */
const PIANO_VELOCITY_TRIES = [16, 8, 5, 3, 1];
const CDN_PIANO_AUDIO = "https://tambien.github.io/Piano/audio/";

function resolvePianoSampleBase() {
  const root = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  const rel = `${root}piano-audio/`;
  if (typeof window === "undefined") return rel;
  try {
    return new URL(rel, window.location.href).href;
  } catch {
    return rel;
  }
}

function normalizeSampleUrl(u) {
  let s = u;
  if (!s.endsWith("/")) s += "/";
  return s;
}

/** Volume principal (curseur 0–1) → dB sur `Tone.Context.destination`. */
function applyDestinationVolume(toneCtx, linear) {
  const vol = toneCtx?.destination?.volume;
  if (!vol) return;
  const t = toneCtx.currentTime;
  vol.cancelScheduledValues(t);
  const x = Number(linear);
  if (!Number.isFinite(x) || x <= 0) {
    vol.setValueAtTime(-Infinity, t);
    return;
  }
  const g = Math.min(1, x);
  vol.setValueAtTime(20 * Math.log10(Math.max(1e-5, g)), t);
}

/**
 * Charge le piano : essaie plusieurs nombres de vélocités (fichiers manquants = échec).
 * Local d’abord, puis CDN officiel Salamander si besoin — évite silence sans message.
 */
async function loadPianoWithFallback(tctx, baseUrl, sourceLabel) {
  const url = normalizeSampleUrl(baseUrl);
  let lastErr = null;
  for (const velocities of PIANO_VELOCITY_TRIES) {
    const p = new Piano({
      context: tctx,
      url,
      velocities,
      pedal: true,
      release: false,
    });
    try {
      await p.load();
      try {
        p.disconnect();
      } catch {
        /* ignore */
      }
      p.toDestination();
      return { piano: p, velocities, url, sourceLabel };
    } catch (e) {
      lastErr = e;
      try {
        p.dispose();
      } catch {
        /* ignore */
      }
    }
  }
  throw lastErr || new Error(`${sourceLabel} : aucun jeu de vélocité n’a pu être chargé`);
}

async function createPianoBestEffort(tctx) {
  const localUrl = normalizeSampleUrl(resolvePianoSampleBase());
  try {
    return await loadPianoWithFallback(tctx, localUrl, "local (piano-audio)");
  } catch {
    return await loadPianoWithFallback(tctx, CDN_PIANO_AUDIO, "CDN tambien.github.io");
  }
}

function parseScore(text) {
  if (!text) return null;
  const m1 = text.match(/```json\s*([\s\S]*?)```/i);
  if (m1) {
    try {
      return JSON.parse(m1[1].trim());
    } catch {
      /* ignore */
    }
  }
  const m2 = text.match(/```\s*([\s\S]*?)```/);
  if (m2) {
    try {
      return JSON.parse(m2[1].trim());
    } catch {
      /* ignore */
    }
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* ignore */
    }
  }
  try {
    return JSON.parse(text.trim());
  } catch {
    return null;
  }
}

const LOCAL_MELODIES = [
  {
    title: "Nocturne en Ré mineur",
    composer_style: "Dans le style de Chopin",
    bpm: 58,
    notes: [
      { note: "D4", duration: 1, velocity: 52 },
      { note: "F4", duration: 0.5, velocity: 68 },
      { note: "A4", duration: 0.5, velocity: 72 },
      { note: "C5", duration: 1, velocity: 78 },
      { note: "A4", duration: 0.5, velocity: 64 },
      { note: "F4", duration: 0.5, velocity: 60 },
      { note: "E4", duration: 2, velocity: 55 },
      { note: "REST", duration: 0.5 },
      { note: "G4", duration: 0.5, velocity: 70 },
      { note: "Bb4", duration: 1, velocity: 76 },
      { note: "G4", duration: 0.5, velocity: 62 },
      { note: "E4", duration: 0.5, velocity: 58 },
      { note: "F4", duration: 2, velocity: 60 },
      { note: "REST", duration: 0.5 },
      { note: "D4", duration: 1, velocity: 54 },
      { note: "E4", duration: 0.5, velocity: 66 },
      { note: "F4", duration: 0.5, velocity: 72 },
      { note: "D4", duration: 2, velocity: 48 },
    ],
  },
  {
    title: "Allegro Solaire",
    composer_style: "Dans le style de Vivaldi",
    bpm: 132,
    notes: [
      { note: "E5", duration: 0.25, velocity: 90 },
      { note: "F#5", duration: 0.25, velocity: 92 },
      { note: "G5", duration: 0.5, velocity: 95 },
      { note: "E5", duration: 0.5, velocity: 82 },
      { note: "C5", duration: 0.5, velocity: 78 },
      { note: "D5", duration: 0.5, velocity: 80 },
      { note: "B4", duration: 1, velocity: 72 },
      { note: "REST", duration: 0.25 },
      { note: "B4", duration: 0.25, velocity: 75 },
      { note: "C5", duration: 0.5, velocity: 80 },
      { note: "D5", duration: 0.5, velocity: 84 },
      { note: "E5", duration: 0.5, velocity: 88 },
      { note: "F#5", duration: 0.5, velocity: 90 },
      { note: "G5", duration: 1, velocity: 96 },
      { note: "REST", duration: 0.5 },
      { note: "A5", duration: 0.5, velocity: 100 },
      { note: "G5", duration: 0.5, velocity: 88 },
      { note: "F#5", duration: 0.5, velocity: 85 },
      { note: "E5", duration: 2, velocity: 70 },
    ],
  },
  {
    title: "Adagio Cantabile",
    composer_style: "Dans le style de Beethoven",
    bpm: 66,
    notes: [
      { note: "C4", duration: 1, velocity: 58 },
      { note: "E4", duration: 1, velocity: 62 },
      { note: "G4", duration: 1, velocity: 68 },
      { note: "E4", duration: 1, velocity: 55 },
      { note: "F4", duration: 1, velocity: 60 },
      { note: "A4", duration: 1, velocity: 65 },
      { note: "G4", duration: 2, velocity: 52 },
      { note: "REST", duration: 0.5 },
      { note: "G4", duration: 0.5, velocity: 58 },
      { note: "A4", duration: 1, velocity: 64 },
      { note: "G4", duration: 1, velocity: 56 },
      { note: "F4", duration: 1, velocity: 54 },
      { note: "E4", duration: 2, velocity: 50 },
      { note: "D4", duration: 1, velocity: 48 },
      { note: "C4", duration: 2, velocity: 44 },
    ],
  },
];

/** En dev, Vite proxy `/anthropic-api` → api.anthropic.com (clé dans .env : ANTHROPIC_API_KEY). Sinon CORS bloque le navigateur. */
function anthropicMessagesUrl() {
  return import.meta.env.DEV ? "/anthropic-api/v1/messages" : "https://api.anthropic.com/v1/messages";
}

const generateMelody = async (userPrompt) => {
  let apiError = null;
  try {
    const res = await fetch(anthropicMessagesUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `You are a classical piano composer. Reply ONLY with raw JSON, no markdown.
Format: {"title":"string","composer_style":"string","bpm":72,"notes":[{"note":"C4","duration":1,"velocity":80}]}
Rules: note = A-G + optional #/b + octave 3-6, REST allowed, duration in 0.25,0.5,1,2, velocity integer 1-127 per note (expressive range), bpm 40-140, 14-22 notes.`,
        messages: [{ role: "user", content: `Compose piano solo. Style: ${userPrompt}. JSON only.` }],
      }),
    });
    const raw = await res.text();
    if (res.ok) {
      const data = JSON.parse(raw);
      const txt = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      const parsed = parseScore(txt);
      if (parsed?.notes?.length) return parsed;
      apiError = `Format inattendu: "${txt.slice(0, 120)}"`;
    } else {
      try {
        apiError = `API ${res.status}: ${JSON.parse(raw)?.error?.message || raw.slice(0, 120)}`;
      } catch {
        apiError = `API ${res.status}: ${raw.slice(0, 120)}`;
      }
    }
  } catch (e) {
    apiError = `Réseau: ${e.message}`;
  }
  const lower = userPrompt.toLowerCase();
  let idx = Math.floor(Math.random() * LOCAL_MELODIES.length);
  if (lower.includes("triste") || lower.includes("nuit") || lower.includes("mélanc")) idx = 0;
  else if (lower.includes("joyeux") || lower.includes("vif") || lower.includes("allegro")) idx = 1;
  else if (lower.includes("beethoven") || lower.includes("adagio") || lower.includes("cantab")) idx = 2;
  const melody = { ...LOCAL_MELODIES[idx] };
  melody.title = `${melody.title} ✦`;
  melody._fallback = true;
  melody._apiError = apiError;
  return melody;
};

/**
 * Temps absolus alignés sur `piano.now()` (horloge Tone + lookahead) : évite les notes
 * « dans le passé » par rapport au graphe interne du Sampler.
 */
function playPianoSequence(piano, events, bpm, defaultVel127) {
  const beatDur = 60 / bpm;
  const anchor = piano.now() + 0.12;
  let cursor = 0;
  let totalBeats = 0;
  for (const ev of events) {
    const dur = (ev.duration || 1) * beatDur;
    totalBeats += ev.duration || 1;
    const rawV = ev.velocity != null ? ev.velocity : defaultVel127;
    const v127 = Math.max(1, Math.min(127, Number(rawV) || 80));
    const velUnit = midiVelocityToUnit(v127);
    const tAttack = anchor + cursor;
    const tRelease = anchor + cursor + dur * 0.92;
    const list =
      Array.isArray(ev.chord) && ev.chord.length ? ev.chord : ev.note === "REST" || !ev.note ? [] : [ev.note];
    if (ev.usePedal && list.length) {
      piano.pedalDown({ time: tAttack });
    }
    list.forEach((n, i) => {
      if (!n || n === "REST") return;
      const t0 = tAttack + i * 0.0025;
      piano.keyDown({ note: n, time: t0, velocity: velUnit });
      piano.keyUp({ note: n, time: tRelease + i * 0.001 });
    });
    if (ev.usePedal && list.length) {
      piano.pedalUp({ time: tRelease + 0.06 });
    }
    cursor += dur;
  }
  return totalBeats * beatDur * 1000;
}

const NOTE_COLORS = {
  C: "#e8c97a",
  D: "#c9a96e",
  E: "#a8c4a0",
  F: "#7eb8c9",
  G: "#b89fd4",
  A: "#d4a0a0",
  B: "#c9c47e",
};

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

const ScoreVisualizer = ({ score, currentNote, isPlaying }) => {
  if (!score?.notes?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", padding: "18px 12px" }}>
      {score.notes.map((n, i) => {
        const isRest = n.note === "REST" && !n.chord?.length;
        const label = n.label || (n.chord?.length ? n.chord.join("·") : n.note);
        const colorKey = isRest ? "C" : (label[0] || "C");
        const color = isRest ? "#555" : NOTE_COLORS[colorKey] || "#aaa";
        const active = isPlaying && i === currentNote;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              transform: active ? "scale(1.35) translateY(-5px)" : "scale(1)",
              transition: "transform 0.1s ease",
              opacity: isRest ? 0.35 : 1,
            }}
          >
            <div
              style={{
                width: `${Math.max(24, (n.duration || 1) * 26)}px`,
                minHeight: "32px",
                borderRadius: "5px",
                background: active ? `radial-gradient(circle, #fff 0%, ${color} 100%)` : `rgba(${hexToRgb(color)},0.45)`,
                border: `1.5px solid ${active ? "#fff" : color}`,
                boxShadow: active ? `0 0 10px ${color}, 0 0 22px ${color}` : "none",
                transition: "all 0.1s ease",
              }}
            />
            <span
              style={{
                fontSize: "8px",
                fontFamily: "monospace",
                color: active ? "#fff" : "#777",
                letterSpacing: "0.3px",
                textAlign: "center",
                maxWidth: "120px",
                wordBreak: "break-word",
              }}
            >
              {isRest ? "—" : label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const LoadingWave = () => (
  <div style={{ display: "flex", justifyContent: "center", gap: "5px", alignItems: "flex-end", height: "28px" }}>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        style={{
          width: "3px",
          borderRadius: "2px",
          background: "rgba(200,169,110,0.7)",
          animation: `wv 1.1s ease-in-out ${i * 0.11}s infinite`,
          height: `${10 + Math.sin(i * 0.9) * 7}px`,
        }}
      />
    ))}
    <style>{`@keyframes wv{0%,100%{transform:scaleY(0.35);opacity:0.35}50%{transform:scaleY(1.5);opacity:1}}`}</style>
  </div>
);

const StaffLines = () => (
  <div style={{ position: "relative", height: "36px", margin: "0 16px", opacity: 0.12 }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "1px",
          background: "#c8a96e",
          top: `${6 + i * 6}px`,
        }}
      />
    ))}
  </div>
);

export default function OrchestraVST() {
  const [query, setQuery] = useState("");
  const [tonic, setTonic] = useState("C");
  const [tonicOctave, setTonicOctave] = useState(4);
  const [modeKey, setModeKey] = useState("ionian");
  const [chordDegree, setChordDegree] = useState(1);
  const [useSeventh, setUseSeventh] = useState(false);
  const [velocity, setVelocity] = useState(88);
  const [humanize, setHumanize] = useState(true);
  const [chordPedal, setChordPedal] = useState(true);
  const [chordDuration, setChordDuration] = useState(1);
  const [volume, setVolume] = useState(0.72);
  const [reverb, setReverb] = useState(0.28);
  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(null);
  const [currentNote, setCurrentNote] = useState(-1);
  const [history, setHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [focused, setFocused] = useState(false);
  const [pianoSource, setPianoSource] = useState(null);

  const audioCtxRef = useRef(null);
  const toneContextRef = useRef(null);
  const pianoRef = useRef(null);
  const pianoLoadPromiseRef = useRef(null);
  const playTRef = useRef(null);
  const noteTimersRef = useRef([]);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        pianoRef.current?.dispose?.();
      } catch {
        /* ignore */
      }
      pianoRef.current = null;
      pianoLoadPromiseRef.current = null;
      try {
        audioCtxRef.current?.close?.();
      } catch {
        /* ignore */
      }
      audioCtxRef.current = null;
      toneContextRef.current = null;
    };
  }, []);

  const ensureAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;

    const toneCtx = new Tone.Context({ context: ctx });
    toneContextRef.current = toneCtx;
    Tone.setContext(toneCtx, false);
    toneCtx.initialize();
    applyDestinationVolume(toneCtx, volume);
  }, [volume]);

  useEffect(() => {
    applyDestinationVolume(toneContextRef.current, volume);
  }, [volume]);

  const stopAll = useCallback(() => {
    if (playTRef.current) clearTimeout(playTRef.current);
    playTRef.current = null;
    noteTimersRef.current.forEach((t) => clearTimeout(t));
    noteTimersRef.current = [];
    try {
      if (pianoRef.current?.loaded) pianoRef.current.stopAll();
    } catch {
      /* ignore */
    }
    setCurrentNote(-1);
    setStatus((prev) => (prev === "playing" ? "idle" : prev));
  }, []);

  /** Appels non attendus dans le même tick que le clic (Safari / iOS : le 1er await peut perdre le « user gesture »). */
  const primeAudioSameTick = useCallback(() => {
    ensureAudio();
    const ctx = audioCtxRef.current;
    if (ctx) void ctx.resume();
    void Tone.start();
    const tc = toneContextRef.current;
    if (tc) void tc.resume();
  }, [ensureAudio]);

  /** Réveille le graphe audio — à appeler pendant le geste utilisateur *avant* toute attente longue (API), sinon Safari reste muet. */
  const resumeAudioGraph = useCallback(async () => {
    ensureAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    await ctx.resume();
    await Tone.start();
    const tc = toneContextRef.current;
    if (tc) await tc.resume();
  }, [ensureAudio]);

  const ensurePianoReady = useCallback(async () => {
    ensureAudio();
    const ctx = audioCtxRef.current;
    const tctx = toneContextRef.current;
    if (!ctx || !tctx) throw new Error("AudioContext indisponible");

    await tctx.resume();
    await ctx.resume();
    await Tone.start();

    if (pianoRef.current?.loaded) {
      return pianoRef.current;
    }
    if (pianoLoadPromiseRef.current) {
      await pianoLoadPromiseRef.current;
      if (pianoRef.current?.loaded) return pianoRef.current;
    }

    if (pianoRef.current) {
      try {
        pianoRef.current.dispose();
      } catch {
        /* ignore */
      }
      pianoRef.current = null;
    }

    const loadPromise = (async () => {
      const { piano, sourceLabel } = await createPianoBestEffort(tctx);
      pianoRef.current = piano;
      setPianoSource(sourceLabel.includes("CDN") ? "cdn" : "local");
      return piano;
    })();
    pianoLoadPromiseRef.current = loadPromise;
    try {
      const p = await loadPromise;
      return p;
    } catch (err) {
      pianoRef.current = null;
      setPianoSource(null);
      throw err;
    } finally {
      pianoLoadPromiseRef.current = null;
    }
  }, [ensureAudio]);

  const velForEvent = useCallback(
    (base127) => {
      let v = Math.max(1, Math.min(127, Number(base127) || 80));
      if (humanize) {
        const spread = Math.round((Math.random() - 0.5) * 18);
        v = Math.max(1, Math.min(127, v + spread));
      }
      return v;
    },
    [humanize]
  );

  const playCurrentScore = useCallback(
    (scoreData) => {
      if (!scoreData?.notes?.length) return;
      stopAll();
      primeAudioSameTick();
      setStatus("playing");
      setErrorMsg("");

      const run = async () => {
        try {
          await resumeAudioGraph();
          const piano = await ensurePianoReady();
          if (piano.context.state === "suspended") await piano.context.resume();
          await new Promise((r) => requestAnimationFrame(r));

          const bpm = scoreData.bpm || 72;
          const beatDur = 60 / bpm;
          let elapsed = 80;
          noteTimersRef.current = scoreData.notes.map((n, i) => {
            const t = setTimeout(() => setCurrentNote(i), elapsed);
            elapsed += (n.duration || 1) * beatDur * 1000;
            return t;
          });

          const events = scoreData.notes.map((n) => ({
            ...n,
            velocity: n.velocity != null ? velForEvent(n.velocity) : velForEvent(velocity),
          }));

          const totalMs = playPianoSequence(piano, events, bpm, velocity);

          playTRef.current = setTimeout(() => {
            setCurrentNote(-1);
            setStatus("idle");
          }, totalMs + 800);
        } catch (e) {
          const msg = e?.message || String(e);
          setErrorMsg(
            `Piano : ${msg}. Essaie « npm run fetch-samples » ou vérifie la connexion (secours CDN).`
          );
          setStatus("error");
          setCurrentNote(-1);
        }
      };
      void run();
    },
    [ensurePianoReady, primeAudioSameTick, resumeAudioGraph, stopAll, velForEvent, velocity]
  );

  const handleGenerate = useCallback(async () => {
    if (!query.trim()) return;
    stopAll();
    setStatus("loading");
    setErrorMsg("");
    setScore(null);
    setCurrentNote(-1);
    try {
      primeAudioSameTick();
      await resumeAudioGraph();
      const result = await generateMelody(query.trim());
      setScore(result);
      setHistory((h) => [{ query: query.trim(), title: result.title, score: result, ts: Date.now() }, ...h.slice(0, 4)]);
      if (result._fallback) {
        setErrorMsg(`⚠ API indisponible (${result._apiError || "réseau"}) — mélodie locale.`);
        setStatus("warning");
      } else {
        setStatus("idle");
      }
      setTimeout(() => {
        primeAudioSameTick();
        playCurrentScore(result);
      }, 150);
    } catch (e) {
      setErrorMsg(e.message || "Erreur inconnue");
      setStatus("error");
    }
  }, [primeAudioSameTick, query, resumeAudioGraph, stopAll, playCurrentScore]);

  const tonicNoteStr = `${tonic}${tonicOctave}`;
  const currentChord = useMemo(
    () => buildDiatonicChord(tonicNoteStr, modeKey, chordDegree, useSeventh),
    [tonicNoteStr, modeKey, chordDegree, useSeventh]
  );

  const previewChord = useCallback(() => {
    setErrorMsg("");
    const ev = {
      chord: currentChord.notes,
      duration: chordDuration,
      velocity: velForEvent(velocity),
      usePedal: chordPedal,
      label: currentChord.label,
    };
    const tmp = { title: "Accord", composer_style: "", bpm: 60, notes: [ev] };
    playCurrentScore(tmp);
  }, [chordDuration, chordPedal, currentChord, playCurrentScore, velForEvent, velocity]);

  const appendChord = useCallback(() => {
    const ev = {
      chord: [...currentChord.notes],
      duration: chordDuration,
      velocity: velForEvent(velocity),
      usePedal: chordPedal,
      label: `${ROMAN_LABELS[chordDegree - 1]} ${useSeventh ? "7" : ""} · ${MODES[modeKey].label.split("(")[0].trim()}`,
    };
    setScore((prev) => {
      const base = prev?.notes?.length ? { ...prev, notes: [...prev.notes] } : { title: "Ma ligne", composer_style: "Piano", bpm: 72, notes: [] };
      base.notes.push(ev);
      return base;
    });
    setStatus("idle");
    setErrorMsg("");
  }, [chordDegree, chordDuration, chordPedal, currentChord, modeKey, useSeventh, velForEvent, velocity]);

  const clearLine = useCallback(() => {
    setScore(null);
    stopAll();
    setErrorMsg("");
    setStatus("idle");
  }, [stopAll]);

  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const SUGGESTIONS = ["Nocturne doux", "Jazz modal", "Arpège mélancolique", "Cadence classique"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080810",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif",
        color: "#e8dcc8",
        backgroundImage: `
        radial-gradient(ellipse 100% 60% at 50% 0%, rgba(180,140,70,0.1) 0%, transparent 65%),
        radial-gradient(ellipse 60% 40% at 20% 80%, rgba(100,80,160,0.06) 0%, transparent 60%),
        repeating-linear-gradient(0deg,transparent,transparent 47px,rgba(255,255,255,0.012) 47px,rgba(255,255,255,0.012) 48px),
        repeating-linear-gradient(90deg,transparent,transparent 47px,rgba(255,255,255,0.012) 47px,rgba(255,255,255,0.012) 48px)
      `,
      }}
    >
      <header style={{ textAlign: "center", padding: "40px 20px 0", width: "100%" }}>
        <div style={{ fontSize: "14px", letterSpacing: "16px", color: "#c8a96e", opacity: 0.5, marginBottom: "12px" }}>✦ ✦ ✦</div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(26px,5vw,44px)",
            fontWeight: 400,
            letterSpacing: "8px",
            textTransform: "uppercase",
            color: "#ede0c4",
            textShadow: "0 0 50px rgba(200,169,110,0.35)",
          }}
        >
          Piano IA
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: "11px", letterSpacing: "4px", color: "#c8a96e", textTransform: "uppercase", opacity: 0.75 }}>
          Salamander · modes & accords diatoniques
        </p>
        {pianoSource === "cdn" && (
          <p style={{ margin: "8px 0 0", fontSize: "10px", color: "rgba(200,169,110,0.45)", maxWidth: "420px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.45 }}>
            Sons chargés depuis le réseau (dossier local vide ou incomplet). Pour l’hors-ligne :{" "}
            <span style={{ fontFamily: "monospace" }}>npm run fetch-samples</span>
          </p>
        )}
        <div style={{ marginTop: "14px", fontSize: "12px", letterSpacing: "8px", color: "rgba(200,169,110,0.3)" }}>───────────────────────────</div>
      </header>

      <main style={{ width: "100%", maxWidth: "820px", padding: "28px 20px 72px", display: "flex", flexDirection: "column", alignItems: "center", gap: "22px" }}>
        <div
          style={{
            width: "100%",
            background: "rgba(12,10,7,0.88)",
            border: "1px solid rgba(200,169,110,0.22)",
            borderRadius: "4px",
            padding: "16px 18px",
          }}
        >
          <div style={{ fontSize: "9px", letterSpacing: "3px", color: "rgba(200,169,110,0.55)", textTransform: "uppercase", marginBottom: "14px" }}>
            Accords réalistes (gammes & modes)
          </div>
          <p style={{ margin: "0 0 14px", fontSize: "11px", lineHeight: 1.55, color: "rgba(232,220,200,0.55)" }}>
            Accords construits en tierces sur les degrés de la gamme choisie (ionien à locrien, mineur harmonique & mélodique). Vélocité MIDI 1–127, humanisation optionnelle.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginBottom: "14px" }}>
            <label style={{ fontSize: "10px", color: "rgba(200,169,110,0.5)" }}>
              Tonique
              <select
                value={tonic}
                onChange={(e) => setTonic(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: "6px", background: "#1a1510", color: "#e8dcc8", border: "1px solid rgba(200,169,110,0.25)", padding: "8px", borderRadius: "3px" }}
              >
                {TONIC_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: "10px", color: "rgba(200,169,110,0.5)" }}>
              Octave
              <select
                value={tonicOctave}
                onChange={(e) => setTonicOctave(Number(e.target.value))}
                style={{ display: "block", width: "100%", marginTop: "6px", background: "#1a1510", color: "#e8dcc8", border: "1px solid rgba(200,169,110,0.25)", padding: "8px", borderRadius: "3px" }}
              >
                {[2, 3, 4, 5, 6].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: "10px", color: "rgba(200,169,110,0.5)", gridColumn: "span 2" }}>
              Mode
              <select
                value={modeKey}
                onChange={(e) => setModeKey(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: "6px", background: "#1a1510", color: "#e8dcc8", border: "1px solid rgba(200,169,110,0.25)", padding: "8px", borderRadius: "3px" }}
              >
                {Object.entries(MODES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "10px", color: "rgba(200,169,110,0.45)" }}>Degré</span>
            {ROMAN_LABELS.map((rom, i) => (
              <button
                key={rom}
                type="button"
                onClick={() => setChordDegree(i + 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "3px",
                  border: chordDegree === i + 1 ? "1px solid #c8a96e" : "1px solid rgba(200,169,110,0.2)",
                  background: chordDegree === i + 1 ? "rgba(200,169,110,0.15)" : "transparent",
                  color: chordDegree === i + 1 ? "#e4d4b0" : "rgba(200,169,110,0.45)",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "inherit",
                }}
              >
                {rom}
              </button>
            ))}
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px", fontSize: "11px", cursor: "pointer" }}>
              <input type="checkbox" checked={useSeventh} onChange={(e) => setUseSeventh(e.target.checked)} />
              7e (diatonique)
            </label>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#b89fd4",
              marginBottom: "12px",
              padding: "10px 12px",
              background: "rgba(0,0,0,0.25)",
              borderRadius: "3px",
              fontFamily: "monospace",
            }}
          >
            {currentChord.notes.length ? currentChord.notes.join(" · ") : "—"} <span style={{ opacity: 0.5 }}>({tonicNoteStr})</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "9px", letterSpacing: "2px", color: "rgba(200,169,110,0.5)", textTransform: "uppercase" }}>Vélocité MIDI</span>
                <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(200,169,110,0.45)" }}>{velocity}</span>
              </div>
              <div style={{ position: "relative", height: "3px", background: "rgba(200,169,110,0.1)", borderRadius: "2px" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: "2px", width: `${((velocity - 1) / 126) * 100}%`, background: "linear-gradient(90deg,rgba(200,169,110,0.35),rgba(200,169,110,0.85))" }} />
                <input
                  type="range"
                  min={1}
                  max={127}
                  value={velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  style={{ position: "absolute", inset: "-8px 0", opacity: 0, cursor: "pointer", width: "100%", margin: 0 }}
                />
              </div>
            </div>
            <label style={{ fontSize: "10px", color: "rgba(200,169,110,0.5)" }}>
              Durée (noires)
              <select
                value={chordDuration}
                onChange={(e) => setChordDuration(Number(e.target.value))}
                style={{ display: "block", width: "100%", marginTop: "6px", background: "#1a1510", color: "#e8dcc8", border: "1px solid rgba(200,169,110,0.25)", padding: "8px", borderRadius: "3px" }}
              >
                <option value={0.5}>½</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", marginBottom: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={humanize} onChange={(e) => setHumanize(e.target.checked)} />
            Humaniser (± vélocité légère)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", marginBottom: "14px", cursor: "pointer" }}>
            <input type="checkbox" checked={chordPedal} onChange={(e) => setChordPedal(e.target.checked)} />
            Pédale de sustain sur accords joués
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              type="button"
              onClick={() => void previewChord()}
              style={{
                padding: "10px 20px",
                borderRadius: "3px",
                border: "1px solid rgba(200,169,110,0.45)",
                background: "linear-gradient(135deg,rgba(200,169,110,0.22),rgba(160,120,50,0.12))",
                color: "#c8a96e",
                cursor: "pointer",
                fontSize: "11px",
                letterSpacing: "1.5px",
                fontFamily: "inherit",
              }}
            >
              ▶ Écouter l&apos;accord
            </button>
            <button
              type="button"
              onClick={appendChord}
              style={{
                padding: "10px 20px",
                borderRadius: "3px",
                border: "1px solid rgba(184,159,212,0.45)",
                background: "rgba(184,159,212,0.1)",
                color: "#d4c4e8",
                cursor: "pointer",
                fontSize: "11px",
                letterSpacing: "1px",
                fontFamily: "inherit",
              }}
            >
              + Ajouter à la ligne
            </button>
            <button
              type="button"
              onClick={clearLine}
              style={{
                padding: "10px 16px",
                borderRadius: "3px",
                border: "1px solid rgba(200,169,110,0.15)",
                background: "transparent",
                color: "rgba(200,169,110,0.4)",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "inherit",
              }}
            >
              Vider la ligne
            </button>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            background: "rgba(12,10,7,0.85)",
            border: "1px solid rgba(200,169,110,0.18)",
            borderRadius: "4px",
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {[
            { label: "Volume", value: volume, setter: setVolume },
            { label: "Réverbération", value: reverb, setter: setReverb },
          ].map((ctrl) => (
            <div key={ctrl.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <span style={{ fontSize: "9px", letterSpacing: "2.5px", color: "rgba(200,169,110,0.55)", textTransform: "uppercase" }}>{ctrl.label}</span>
                <span style={{ fontSize: "10px", color: "rgba(200,169,110,0.4)", fontFamily: "monospace" }}>{Math.round(ctrl.value * 100)}%</span>
              </div>
              <div style={{ position: "relative", height: "3px", background: "rgba(200,169,110,0.1)", borderRadius: "2px" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    borderRadius: "2px",
                    width: `${ctrl.value * 100}%`,
                    background: "linear-gradient(90deg,rgba(200,169,110,0.35),rgba(200,169,110,0.8))",
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={ctrl.value}
                  onChange={(e) => ctrl.setter(parseFloat(e.target.value))}
                  style={{ position: "absolute", inset: "-8px 0", opacity: 0, cursor: "pointer", width: "100%", margin: 0 }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ width: "100%" }}>
          <p style={{ textAlign: "center", fontSize: "11px", letterSpacing: "3px", color: "rgba(200,169,110,0.7)", textTransform: "uppercase", marginBottom: "14px" }}>
            Idée mélodique (piano)
          </p>
          <form
            style={{ margin: 0, width: "100%" }}
            onSubmit={(e) => {
              e.preventDefault();
              void handleGenerate();
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: "rgba(14,12,9,0.92)",
                border: `1px solid ${focused ? "rgba(200,169,110,0.65)" : "rgba(200,169,110,0.28)"}`,
                borderRadius: "4px",
                boxShadow: focused ? "0 0 0 3px rgba(200,169,110,0.07), 0 8px 48px rgba(0,0,0,0.55)" : "0 4px 32px rgba(0,0,0,0.45)",
                transition: "border-color 0.25s",
              }}
            >
              <span style={{ padding: "0 16px", fontSize: "24px", color: "rgba(200,169,110,0.45)", flexShrink: 0 }}>𝄞</span>
              <input
                ref={inputRef}
                type="text"
                name="melody"
                enterKeyHint="search"
                inputMode="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={isLoading}
                placeholder="Ex. nocturne mélancolique, gammes modales…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e8dcc8",
                  fontSize: "15px",
                  fontFamily: "inherit",
                  padding: "18px 0",
                  caretColor: "#c8a96e",
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                style={{
                  margin: "8px",
                  padding: "10px 20px",
                  flexShrink: 0,
                  background: isLoading ? "rgba(200,169,110,0.06)" : "linear-gradient(135deg,rgba(200,169,110,0.22),rgba(160,120,50,0.12))",
                  border: "1px solid rgba(200,169,110,0.45)",
                  borderRadius: "3px",
                  color: "#c8a96e",
                  cursor: isLoading ? "wait" : !query.trim() ? "default" : "pointer",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                  opacity: !query.trim() && !isLoading ? 0.38 : 1,
                }}
              >
                {isLoading ? "⟳" : "Composer"}
              </button>
            </div>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "12px" }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  setTimeout(() => inputRef.current?.focus(), 30);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(200,169,110,0.18)",
                  borderRadius: "20px",
                  color: "rgba(200,169,110,0.52)",
                  cursor: "pointer",
                  fontSize: "11px",
                  padding: "5px 13px",
                  fontFamily: "inherit",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div style={{ width: "100%", textAlign: "center", padding: "28px 20px", border: "1px solid rgba(200,169,110,0.14)", borderRadius: "4px", background: "rgba(8,6,4,0.6)" }}>
            <LoadingWave />
            <p style={{ margin: "16px 0 4px", fontSize: "12px", letterSpacing: "4px", color: "#c8a96e", textTransform: "uppercase" }}>Composition…</p>
          </div>
        )}

        {(status === "error" || status === "warning") && errorMsg && (
          <div
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `1px solid ${status === "warning" ? "rgba(200,140,50,0.4)" : "rgba(200,80,80,0.35)"}`,
              borderRadius: "4px",
              background: status === "warning" ? "rgba(18,12,4,0.9)" : "rgba(18,6,6,0.9)",
              color: status === "warning" ? "rgba(220,170,100,0.95)" : "rgba(220,150,150,0.95)",
              fontSize: "12px",
              lineHeight: 1.55,
              wordBreak: "break-word",
            }}
          >
            {errorMsg}
          </div>
        )}

        {score && !isLoading && (
          <div style={{ width: "100%", border: "1px solid rgba(200,169,110,0.22)", borderRadius: "4px", background: "rgba(9,7,4,0.75)", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(200,169,110,0.13)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 400, color: "#ede0c4" }}>{score.title}</h3>
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(200,169,110,0.55)" }}>
                  {score.composer_style} · {score.bpm || 72} BPM
                </p>
              </div>
              <button
                type="button"
                onClick={() => (isPlaying ? stopAll() : playCurrentScore(score))}
                style={{
                  padding: "9px 22px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  background: isPlaying ? "rgba(200,80,80,0.12)" : "rgba(200,169,110,0.12)",
                  border: `1px solid ${isPlaying ? "rgba(200,80,80,0.38)" : "rgba(200,169,110,0.38)"}`,
                  color: isPlaying ? "rgba(220,140,140,0.9)" : "#c8a96e",
                  fontSize: "12px",
                  fontFamily: "inherit",
                }}
              >
                {isPlaying ? "⏹ Arrêter" : "▶ Jouer"}
              </button>
            </div>
            <ScoreVisualizer score={score} currentNote={currentNote} isPlaying={isPlaying} />
            <StaffLines />
          </div>
        )}

        {history.length > 1 && (
          <div style={{ width: "100%" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "rgba(200,169,110,0.35)", textTransform: "uppercase", marginBottom: "8px" }}>Récent</div>
            {history.slice(1).map((h) => (
              <div
                key={h.ts}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setScore(h.score);
                  setStatus("idle");
                  setCurrentNote(-1);
                }}
                onKeyDown={(e) => e.key === "Enter" && setScore(h.score)}
                style={{
                  padding: "10px 14px",
                  marginBottom: "6px",
                  cursor: "pointer",
                  border: "1px solid rgba(200,169,110,0.1)",
                  borderRadius: "3px",
                  background: "rgba(9,7,4,0.5)",
                  fontSize: "12px",
                  color: "#c8b080",
                }}
              >
                {h.title}
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        *{box-sizing:border-box}
        input[type=range]::-webkit-slider-thumb{opacity:0}
        input[type=range]::-moz-range-thumb{opacity:0}
        ::placeholder{color:rgba(200,169,110,0.22);font-style:italic}
      `}</style>
    </div>
  );
}
