"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, StyleSheet, Dimensions, Platform, Image, Text, } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "./tokens";
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const normalized = clean.length === 3
        ? clean
            .split("")
            .map((c) => `${c}${c}`)
            .join("")
        : clean;
    const int = Number.parseInt(normalized, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}
const MOBILE_SHAPES = [
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
const WEB_SHAPES = [
    {
        width: 360,
        height: 360,
        top: -70,
        left: -80,
        borderRadius: 180,
        gradientColors: ["#E5E5F7", "#8DA4FD", "transparent"],
        start: { x: 0.3, y: 0.2 },
        end: { x: 0.8, y: 0.95 },
        opacity: 0.62,
        blur: 60,
        glowColor: "#8DA4FD",
        highlight: { top: 70, left: 90, size: 90, opacity: 0.2 },
    },
    {
        width: 330,
        height: 340,
        top: SCREEN_H * 0.24,
        left: SCREEN_W * 0.56,
        borderRadius: 170,
        gradientColors: ["#96E3FD", "#8B7BFD", "transparent"],
        start: { x: 0.25, y: 0.1 },
        end: { x: 0.85, y: 0.9 },
        opacity: 0.6,
        blur: 70,
        glowColor: "#8B7BFD",
        highlight: { top: 58, left: 65, size: 88, opacity: 0.18 },
    },
    {
        width: 320,
        height: 260,
        top: SCREEN_H * 0.63,
        left: -45,
        borderRadius: 130,
        gradientColors: ["#82DDFD", "#B7DFFB", "transparent"],
        start: { x: 0.35, y: 0.1 },
        end: { x: 0.75, y: 0.95 },
        opacity: 0.5,
        blur: 58,
        rotate: "-10deg",
        glowColor: "#82DDFD",
        highlight: { top: 40, left: 76, size: 76, opacity: 0.14 },
    },
    {
        width: 190,
        height: 190,
        top: SCREEN_H * 0.1,
        left: SCREEN_W * 0.74,
        borderRadius: 95,
        gradientColors: ["#E5E5F7", "#8DA4FD", "transparent"],
        start: { x: 0.35, y: 0.2 },
        end: { x: 0.8, y: 0.9 },
        opacity: 0.52,
        blur: 52,
        glowColor: "#BBCDFB",
    },
    {
        width: 230,
        height: 230,
        top: SCREEN_H * 0.76,
        left: SCREEN_W * 0.62,
        borderRadius: 115,
        gradientColors: ["#D4EAFA", "#8B7BFD", "transparent"],
        start: { x: 0.45, y: 0.2 },
        end: { x: 0.55, y: 1 },
        opacity: 0.44,
        blur: 62,
        glowColor: "#8B7BFD",
    },
    // Extra orbs for denser composition
    {
        width: 140,
        height: 140,
        top: SCREEN_H * 0.32,
        left: SCREEN_W * 0.2,
        borderRadius: 70,
        gradientColors: ["#B7DFFB", "#96E3FD", "transparent"],
        start: { x: 0.3, y: 0.2 },
        end: { x: 0.75, y: 0.9 },
        opacity: 0.42,
        blur: 44,
        glowColor: "#96E3FD",
    },
    {
        width: 170,
        height: 170,
        top: SCREEN_H * 0.54,
        left: SCREEN_W * 0.36,
        borderRadius: 85,
        gradientColors: ["#BBCDFB", "#82DDFD", "transparent"],
        start: { x: 0.3, y: 0.15 },
        end: { x: 0.8, y: 0.92 },
        opacity: 0.38,
        blur: 46,
        glowColor: "#82DDFD",
    },
    {
        width: 150,
        height: 150,
        top: SCREEN_H * 0.08,
        left: SCREEN_W * 0.42,
        borderRadius: 75,
        gradientColors: ["#E5E5F7", "#B7DFFB", "transparent"],
        start: { x: 0.35, y: 0.15 },
        end: { x: 0.82, y: 0.9 },
        opacity: 0.4,
        blur: 42,
        glowColor: "#B7DFFB",
    },
];
const SHAPES = isWeb ? WEB_SHAPES : MOBILE_SHAPES;
// ─── GlassShape ───────────────────────────────────────────────────
// Renders a single gradient sphere with optional 3D highlight spot.
function GlassShape({ shape }) {
    return (_jsxs(View, { style: {
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
                ? {
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.24)",
                    // @ts-ignore web-only
                    boxShadow: `0 20px 44px rgba(22,28,68,0.34), 0 0 28px ${hexToRgba(shape.glowColor ?? shape.gradientColors[0], 0.36)}, inset -22px -22px 32px rgba(0,0,0,0.3), inset 16px 16px 20px rgba(255,255,255,0.12)`,
                }
                : {}),
        }, children: [_jsx(LinearGradient, { colors: [shape.gradientColors[0], shape.gradientColors[1], shape.gradientColors[2]], start: shape.start, end: shape.end, style: StyleSheet.absoluteFill }), shape.highlight && (_jsx(View, { style: {
                    position: "absolute",
                    top: shape.highlight.top,
                    left: shape.highlight.left,
                    width: shape.highlight.size,
                    height: shape.highlight.size,
                    borderRadius: shape.highlight.size / 2,
                    backgroundColor: "rgba(255,255,255,0.25)",
                    opacity: shape.highlight.opacity,
                } })), isWeb && shape.highlight && (_jsx(View, { style: {
                    position: "absolute",
                    top: shape.highlight.top + 18,
                    left: shape.highlight.left + 14,
                    width: Math.max(22, shape.highlight.size * 0.3),
                    height: Math.max(22, shape.highlight.size * 0.3),
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.22)",
                    opacity: shape.highlight.opacity * 0.95,
                } })), isWeb && (_jsx(View, { style: {
                    position: "absolute",
                    top: "8%",
                    left: "8%",
                    width: "84%",
                    height: "84%",
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.16)",
                } }))] }));
}
// ─── SVG noise texture as data URI for cross-platform grain ───────
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;
// ─── AuroraBackground ─────────────────────────────────────────────
export function AuroraBackground() {
    return (_jsxs(View, { style: isWeb
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }
            : StyleSheet.absoluteFill, pointerEvents: "none", children: [isWeb ? (_jsx(LinearGradient, { colors: ["#F1F4FF", "#D4EAFA", "#BBCDFB", "#8B7BFD"], start: { x: 0.05, y: 0 }, end: { x: 0.95, y: 1 }, style: StyleSheet.absoluteFill })) : (_jsx(View, { style: [
                    StyleSheet.absoluteFill,
                    { backgroundColor: colors.surface },
                ] })), SHAPES.map((shape, i) => (_jsx(GlassShape, { shape: shape }, i))), isWeb && (_jsx(LinearGradient, { colors: [
                    "rgba(129,105,255,0.08)",
                    "rgba(62,239,245,0.06)",
                    "rgba(109,162,253,0.06)",
                    "rgba(193,138,255,0.07)",
                    "rgba(230,195,251,0.06)",
                    "rgba(235,249,250,0.08)",
                ], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: StyleSheet.absoluteFill })), _jsx(Text, { style: {
                    position: "absolute",
                    top: SCREEN_H * 0.15,
                    left: SCREEN_W * 0.06,
                    fontSize: 140,
                    fontFamily: "DMSerifDisplay",
                    color: isWeb ? "rgba(139,123,253,0.08)" : "rgba(149,114,207,0.06)",
                    transform: [{ rotate: "-15deg" }],
                }, children: "?" }), _jsx(Text, { style: {
                    position: "absolute",
                    top: SCREEN_H * 0.52,
                    left: SCREEN_W * 0.75,
                    fontSize: 100,
                    fontFamily: "DMSerifDisplay",
                    color: isWeb ? "rgba(130,221,253,0.08)" : "rgba(0,229,255,0.05)",
                    transform: [{ rotate: "12deg" }],
                }, children: "?" }), _jsx(Text, { style: {
                    position: "absolute",
                    top: SCREEN_H * 0.82,
                    left: SCREEN_W * 0.3,
                    fontSize: 80,
                    fontFamily: "DMSerifDisplay",
                    color: isWeb ? "rgba(141,164,253,0.08)" : "rgba(255,0,122,0.04)",
                    transform: [{ rotate: "-8deg" }],
                }, children: "?" }), _jsx(View, { style: [
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
                ], children: !isWeb && (_jsx(Image, { source: { uri: NOISE_SVG }, style: StyleSheet.absoluteFill, resizeMode: "repeat" })) })] }));
}
