"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, Platform, StyleSheet } from "react-native";
import { colors, radii, spacing } from "./tokens";
import { getWebGlassStyle } from "./webGlass";
/**
 * GlassCard — Deep Glass Dark Theme
 *
 * Architecture:
 * 1. Shadow layer (soft depth, no colored glow)
 * 2. Blur layer (expo-blur with experimentalBlurMethod, tint="dark")
 * 3. Refraction border (subtle white edge)
 * 4. Content
 *
 * Dark mode optimized — neutral glass depth
 */
export function GlassCard({ children, style, intensity = 40 }) {
    const flatStyle = StyleSheet.flatten(style);
    const resolvedRadius = flatStyle?.borderRadius ?? radii.lg;
    const webBlur = Math.min(10, Math.max(6, intensity * 0.25));
    if (Platform.OS === "web") {
        return (_jsx(View, { style: [
                {
                    borderRadius: resolvedRadius,
                    padding: spacing.md,
                    overflow: "hidden",
                    ...getWebGlassStyle({
                        blur: webBlur,
                        tintAlpha: 0.06,
                        borderAlpha: 0.3,
                        shadow: "none",
                    }),
                },
                style,
            ], children: children }));
    }
    const BlurView = require("expo-blur").BlurView;
    return (
    // Layer 0: Shadow caster — violet glow
    _jsxs(View, { style: [
            {
                borderRadius: resolvedRadius,
                shadowColor: colors.shadow.color,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 12,
            },
            style,
        ], children: [_jsx(View, { style: [
                    StyleSheet.absoluteFill,
                    { borderRadius: resolvedRadius, overflow: "hidden" },
                ], children: _jsx(BlurView, { intensity: intensity, tint: "dark", experimentalBlurMethod: "dimezisBlurView", style: StyleSheet.absoluteFill }) }), _jsx(View, { style: [
                    StyleSheet.absoluteFill,
                    {
                        borderRadius: resolvedRadius,
                        borderWidth: 1,
                        borderColor: colors.glass.border,
                        backgroundColor: colors.glass.background,
                    },
                ] }), _jsx(View, { style: { padding: spacing.md }, children: children })] }));
}
