"use client";

import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "./tokens";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const isWeb = Platform.OS === "web";

// ─── Static 3D Glass Shapes ───────────────────────────────────────
// Each shape is a multi-layered gradient sphere positioned on the
// deep space surface.  No animation — purely static for stability.

type Shape = {
  width: number;
  height: number;
  top: number;
  left: number;
  borderRadius: number;
  gradientColors: readonly [string, string, string];
  start: { x: number; y: number };
  end: { x: number; y: number };
  opacity: number;
  blur: number;
  rotate?: string;
  /** Optional white highlight for 3D reflection effect */
  highlight?: {
    top: number;
    left: number;
    size: number;
    opacity: number;
  };
};

const SHAPES: Shape[] = [
  // ── Large magenta sphere — top-left, partially off-screen
  {
    width: 380,
    height: 380,
    top: -60,
    left: -80,
    borderRadius: 190,
    gradientColors: ["#ff007a", "#c4005e", "transparent"],
    start: { x: 0.3, y: 0.2 },
    end: { x: 0.8, y: 0.95 },
    opacity: 0.45,
    blur: 80,
    highlight: { top: 70, left: 90, size: 100, opacity: 0.2 },
  },
  // ── Electric violet sphere — center-right
  {
    width: 320,
    height: 350,
    top: SCREEN_H * 0.3,
    left: SCREEN_W * 0.55,
    borderRadius: 175,
    gradientColors: ["#9572CF", "#7a00ff", "transparent"],
    start: { x: 0.2, y: 0.1 },
    end: { x: 0.85, y: 0.9 },
    opacity: 0.5,
    blur: 90,
    highlight: { top: 55, left: 65, size: 90, opacity: 0.18 },
  },
  // ── Cyan elongated blob — bottom-left
  {
    width: 340,
    height: 260,
    top: SCREEN_H * 0.65,
    left: -50,
    borderRadius: 130,
    gradientColors: ["#00e5ff", "#007a99", "transparent"],
    start: { x: 0.35, y: 0.1 },
    end: { x: 0.75, y: 0.95 },
    opacity: 0.35,
    blur: 70,
    rotate: "-12deg",
    highlight: { top: 40, left: 80, size: 80, opacity: 0.15 },
  },
  // ── Small violet accent — top-right
  {
    width: 180,
    height: 180,
    top: SCREEN_H * 0.12,
    left: SCREEN_W * 0.72,
    borderRadius: 90,
    gradientColors: ["#BBA3EF", "#7a00ff", "transparent"],
    start: { x: 0.3, y: 0.15 },
    end: { x: 0.8, y: 0.9 },
    opacity: 0.4,
    blur: 60,
  },
  // ── Subtle magenta-pink glow — bottom-right corner
  {
    width: 220,
    height: 220,
    top: SCREEN_H * 0.78,
    left: SCREEN_W * 0.6,
    borderRadius: 110,
    gradientColors: ["#ff007a", "#7a00ff", "transparent"],
    start: { x: 0.5, y: 0.2 },
    end: { x: 0.5, y: 1 },
    opacity: 0.25,
    blur: 80,
  },
];

// ─── GlassShape ───────────────────────────────────────────────────
// Renders a single gradient sphere with optional 3D highlight spot.

function GlassShape({ shape }: { shape: Shape }) {
  return (
    <View
      style={{
        position: "absolute",
        top: shape.top,
        left: shape.left,
        width: shape.width,
        height: shape.height,
        borderRadius: shape.borderRadius,
        opacity: shape.opacity,
        overflow: "hidden",
        transform: shape.rotate ? [{ rotate: shape.rotate }] : [],
        ...(isWeb
          ? // @ts-ignore web-only
            { filter: `blur(${shape.blur}px)` }
          : {}),
      }}
    >
      <LinearGradient
        colors={[shape.gradientColors[0], shape.gradientColors[1], shape.gradientColors[2]]}
        start={shape.start}
        end={shape.end}
        style={StyleSheet.absoluteFill}
      />
      {/* 3D highlight — simulates light reflection on glass surface */}
      {shape.highlight && (
        <View
          style={{
            position: "absolute",
            top: shape.highlight.top,
            left: shape.highlight.left,
            width: shape.highlight.size,
            height: shape.highlight.size,
            borderRadius: shape.highlight.size / 2,
            backgroundColor: "rgba(255,255,255,0.25)",
            opacity: shape.highlight.opacity,
            ...(isWeb
              ? // @ts-ignore web-only
                { filter: "blur(15px)" }
              : {}),
          }}
        />
      )}
    </View>
  );
}

// ─── SVG noise texture as data URI for cross-platform grain ───────
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;

// ─── AuroraBackground ─────────────────────────────────────────────

export function AuroraBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Layer 0 — Deep Space dark surface */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.surface },
        ]}
      />

      {/* Layer 1 — Static 3D gradient shapes */}
      {SHAPES.map((shape, i) => (
        <GlassShape key={i} shape={shape} />
      ))}

      {/* Layer 2 — Decorative question marks (app identity) */}
      <Text
        style={{
          position: "absolute",
          top: SCREEN_H * 0.15,
          left: SCREEN_W * 0.06,
          fontSize: 140,
          fontFamily: "DMSerifDisplay",
          color: "rgba(149,114,207,0.06)",
          transform: [{ rotate: "-15deg" }],
        }}
      >
        ?
      </Text>
      <Text
        style={{
          position: "absolute",
          top: SCREEN_H * 0.52,
          left: SCREEN_W * 0.75,
          fontSize: 100,
          fontFamily: "DMSerifDisplay",
          color: "rgba(0,229,255,0.05)",
          transform: [{ rotate: "12deg" }],
        }}
      >
        ?
      </Text>
      <Text
        style={{
          position: "absolute",
          top: SCREEN_H * 0.82,
          left: SCREEN_W * 0.3,
          fontSize: 80,
          fontFamily: "DMSerifDisplay",
          color: "rgba(255,0,122,0.04)",
          transform: [{ rotate: "-8deg" }],
        }}
      >
        ?
      </Text>

      {/* Layer 3 — Noise texture overlay (Japandi paper feel) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: 0.04,
            ...(isWeb
              ? {
                  // @ts-ignore web-only
                  backgroundImage: `url("${NOISE_SVG}")`,
                  backgroundSize: "256px 256px",
                  backgroundRepeat: "repeat",
                }
              : {}),
          },
        ]}
      >
        {!isWeb && (
          <Image
            source={{ uri: NOISE_SVG }}
            style={StyleSheet.absoluteFill}
            resizeMode="repeat"
          />
        )}
      </View>
    </View>
  );
}
