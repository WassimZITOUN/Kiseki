"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, TouchableOpacity, Platform, StatusBar, StyleSheet } from "react-native";
import { colors, spacing, radii } from "./tokens";
import { KText } from "./KText";
import { getWebGlassStyle } from "./webGlass";
export function KHeader({ title, onBack, rightAction }) {
    const statusBarHeight = Platform.OS === "android"
        ? StatusBar.currentHeight ?? 0
        : Platform.OS === "ios"
            ? 50
            : 0;
    const isWeb = Platform.OS === "web";
    // Inline glass header — no GlassCard to avoid padding conflicts
    const BlurView = !isWeb ? require("expo-blur").BlurView : null;
    return (_jsx(View, { style: {
            paddingTop: statusBarHeight + spacing.sm,
            paddingBottom: spacing.sm,
            paddingHorizontal: spacing.md,
        }, children: _jsxs(View, { style: {
                borderRadius: radii.lg,
                shadowColor: colors.shadow.color,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                elevation: 8,
            }, children: [!isWeb && (_jsx(View, { style: [
                        StyleSheet.absoluteFill,
                        { borderRadius: radii.lg, overflow: "hidden" },
                    ], children: _jsx(BlurView, { intensity: 30, tint: "dark", experimentalBlurMethod: "dimezisBlurView", style: StyleSheet.absoluteFill }) })), _jsx(View, { style: [
                        StyleSheet.absoluteFill,
                        {
                            borderRadius: radii.lg,
                            borderWidth: 1,
                            borderColor: colors.glass.border,
                            backgroundColor: colors.glass.background,
                            ...(isWeb
                                ? {
                                    ...getWebGlassStyle({
                                        blur: 8,
                                        tintAlpha: 0.07,
                                        borderAlpha: 0.3,
                                        shadow: "0 12px 34px rgba(0,0,0,0.22)",
                                    }),
                                }
                                : {}),
                        },
                    ] }), _jsxs(View, { style: {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                    }, children: [_jsx(View, { style: { width: 44 }, children: onBack && (_jsxs(TouchableOpacity, { onPress: onBack, activeOpacity: 0.8, style: {
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    ...(isWeb
                                        ? {}
                                        : {
                                            shadowColor: colors.shadow.color,
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 8,
                                            elevation: 4,
                                        }),
                                }, children: [!isWeb && (_jsx(View, { style: [
                                            StyleSheet.absoluteFill,
                                            { borderRadius: 22, overflow: "hidden" },
                                        ], children: _jsx(BlurView, { intensity: 25, tint: "dark", experimentalBlurMethod: "dimezisBlurView", style: StyleSheet.absoluteFill }) })), _jsx(View, { style: [
                                            StyleSheet.absoluteFill,
                                            {
                                                borderRadius: 22,
                                                borderWidth: 1,
                                                borderColor: colors.glass.border,
                                                backgroundColor: colors.glass.background,
                                                ...(isWeb
                                                    ? {
                                                        ...getWebGlassStyle({
                                                            blur: 7,
                                                            tintAlpha: 0.08,
                                                            borderAlpha: 0.34,
                                                            shadow: "0 8px 22px rgba(0,0,0,0.22)",
                                                        }),
                                                    }
                                                    : {}),
                                            },
                                        ] }), _jsx(View, { style: {
                                            flex: 1,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }, children: _jsx(KText, { style: { fontSize: 20 }, children: "\u2190" }) })] })) }), _jsx(KText, { variant: "h3", style: { flex: 1, textAlign: "center" }, children: title }), _jsx(View, { style: { width: 44, alignItems: "flex-end", justifyContent: "center" }, children: rightAction })] })] }) }));
}
