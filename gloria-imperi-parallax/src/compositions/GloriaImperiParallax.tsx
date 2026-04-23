import React, { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const TOTAL_FRAMES = 480; // 20s @ 24fps

// ─── Film Grain ──────────────────────────────────────────────────────────────

const GrainOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 270;
    const H = 480;
    canvas.width = W;
    canvas.height = H;

    // Seeded LCG for reproducible, render-safe grain
    let seed = (frame * 1_664_525 + 1_013_904_223) & 0xffffffff;
    const rand = () => {
      seed = (seed * 1_664_525 + 1_013_904_223) & 0xffffffff;
      return (seed >>> 0) / 4_294_967_296;
    };

    const data = ctx.createImageData(W, H);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = rand() * 255;
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
  }, [frame]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.045,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

// ─── Cover Image Layer ────────────────────────────────────────────────────────

interface LayerProps {
  scale: number;
  translateY: number;
  translateX: number;
  clip?: "sky" | "ground";
}

const CoverLayer: React.FC<LayerProps> = ({
  scale,
  translateY,
  translateX,
  clip,
}) => {
  const clipStyle: React.CSSProperties =
    clip === "sky"
      ? {
          clipPath: "inset(0 0 52% 0)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }
      : {};

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) translateY(${translateY}px) translateX(${translateX}px)`,
        transformOrigin: clip === "sky" ? "center top" : "center center",
        ...clipStyle,
      }}
    >
      <img
        src={staticFile("cover.jpg")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        alt=""
      />
    </AbsoluteFill>
  );
};

// ─── Main Composition ─────────────────────────────────────────────────────────

export const GloriaImperiParallax: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = frame / TOTAL_FRAMES; // 0 → 1

  // Slow cinematic zoom-out: 128% → 106%
  const scale = interpolate(p, [0, 1], [1.28, 1.06]);

  // Base layer: slow upward drift
  const bgY = interpolate(p, [0, 1], [40, -15]);

  // Sky layer: significantly faster — creates depth separation
  const skyY = interpolate(p, [0, 1], [20, -90]);

  // Subtle horizontal pendulum
  const xDrift = interpolate(p, [0, 0.35, 0.75, 1], [0, -14, -9, -4]);

  // Fade in / out
  const fadeIn = interpolate(frame, [0, fps * 1.5], [1, 0], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [TOTAL_FRAMES - fps * 2, TOTAL_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp" }
  );

  // Vignette builds in
  const vignetteOpacity = interpolate(frame, [0, fps * 2.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // MOZARFMUZIK — slides down from top
  const artistOpacity = interpolate(frame, [fps * 2, fps * 3.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const artistY = interpolate(frame, [fps * 2, fps * 3.5], [-24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gloria Imperi — rises from bottom
  const albumOpacity = interpolate(frame, [fps * 4.5, fps * 6.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const albumY = interpolate(frame, [fps * 4.5, fps * 6.5], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Thin horizontal rule under album title
  const ruleOpacity = interpolate(frame, [fps * 6.5, fps * 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>

      {/* ── Base image: full parallax ground layer ── */}
      <CoverLayer
        scale={scale}
        translateY={bgY}
        translateX={xDrift}
      />

      {/* ── Sky layer: faster parallax, faded at seam ── */}
      <CoverLayer
        scale={scale}
        translateY={skyY}
        translateX={xDrift * 0.85}
        clip="sky"
      />

      {/* ── Cold cinematic grade (blue shadow in highlights) ── */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(170deg, rgba(10,18,45,0.18) 0%, rgba(5,10,28,0.08) 50%, transparent 100%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* ── Bottom gradient: grounds the text ── */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 25%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Top gradient: grounds the artist name ── */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 18%, transparent 35%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Vignette ── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 75% at 50% 48%, transparent 25%, rgba(0,0,0,0.88) 100%)",
          opacity: vignetteOpacity,
          pointerEvents: "none",
        }}
      />

      {/* ── Film grain ── */}
      <GrainOverlay frame={frame} />

      {/* ── MOZARFMUZIK ── */}
      <AbsoluteFill
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: 90,
          opacity: artistOpacity,
          transform: `translateY(${artistY}px)`,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: 20,
            fontWeight: 300,
            letterSpacing: 16,
            color: "rgba(255,255,255,0.82)",
            textTransform: "uppercase",
          }}
        >
          MOZARFMUZIK
        </span>
      </AbsoluteFill>

      {/* ── Gloria Imperi + rule ── */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 110,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            opacity: albumOpacity,
            transform: `translateY(${albumY}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <span
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 72,
              fontWeight: 700,
              color: "rgba(255,255,255,0.96)",
              letterSpacing: 3,
              textShadow:
                "0 2px 60px rgba(180,200,255,0.35), 0 0 120px rgba(100,140,255,0.12)",
              lineHeight: 1,
            }}
          >
            Gloria Imperi
          </span>

          {/* Thin separator rule */}
          <div
            style={{
              width: 80,
              height: 1,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)",
              opacity: ruleOpacity,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* ── Fade in / out black overlay ── */}
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: Math.max(fadeIn, fadeOut),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
