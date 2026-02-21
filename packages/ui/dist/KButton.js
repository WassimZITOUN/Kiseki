"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, TouchableOpacity, ActivityIndicator, Platform, StyleSheet, } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, } from "react-native-reanimated";
import { colors, radii } from "./tokens";
import { KText } from "./KText";
import { getWebGlassStyle } from "./webGlass";
// iOS Premium Spring — snappy, no jelly
const SNAPPY_SPRING = {
    damping: 40,
    stiffness: 350,
    mass: 1,
    overshootClamping: true,
};
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const isWeb = Platform.OS === "web";
export function KButton({ title, onPress, variant = "solid", loading = false, disabled = false, isPill = false, leftIcon, style, }) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }), []);
    const handlePressIn = () => {
        scale.value = withSpring(0.97, SNAPPY_SPRING);
    };
    const handlePressOut = () => {
        scale.value = withSpring(1, SNAPPY_SPRING);
    };
    const resolvedRadius = isPill ? radii.full : radii.md;
    const textColor = variant === "solid"
        ? "#fff"
        : variant === "glass"
            ? colors.textPrimary
            : colors.violet.primary;
    const content = loading ? (_jsx(ActivityIndicator, { color: textColor })) : leftIcon ? (_jsxs(View, { style: { flexDirection: "row", alignItems: "center", gap: 8 }, children: [leftIcon, _jsx(KText, { variant: "button", color: textColor, children: title })] })) : (_jsx(KText, { variant: "button", color: textColor, children: title }));
    const basePadding = {
        paddingVertical: isPill ? 12 : 14,
        paddingHorizontal: isPill ? 28 : 24,
        alignItems: "center",
        justifyContent: "center",
    };
    // ── Solid variant with glass effect ──
    if (variant === "solid") {
        if (isWeb) {
            return (_jsx(AnimatedTouchable, { onPress: onPress, onPressIn: handlePressIn, onPressOut: handlePressOut, disabled: disabled || loading, activeOpacity: 0.9, style: [
                    {
                        borderRadius: resolvedRadius,
                        backgroundColor: "rgba(139, 92, 246, 0.85)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.2)",
                        opacity: disabled ? 0.5 : 1,
                        ...getWebGlassStyle({
                            blur: 7,
                            tintAlpha: 0.18,
                            borderAlpha: 0.36,
                            shadow: "none",
                        }),
                        backgroundColor: "rgba(139, 92, 246, 0.28)",
                        borderColor: "rgba(213, 194, 255, 0.46)",
                    },
                    basePadding,
                    animatedStyle,
                    style,
                ], children: content }));
        }
        // Native solid + glass
        const BlurView = require("expo-blur").BlurView;
        return (_jsxs(AnimatedTouchable, { onPress: onPress, onPressIn: handlePressIn, onPressOut: handlePressOut, disabled: disabled || loading, activeOpacity: 0.9, style: [
                {
                    borderRadius: resolvedRadius,
                    opacity: disabled ? 0.5 : 1,
                    shadowColor: colors.violet[600],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 6,
                },
                animatedStyle,
                style,
            ], children: [_jsx(View, { style: [
                        StyleSheet.absoluteFill,
                        { borderRadius: resolvedRadius, overflow: "hidden" },
                    ], children: _jsx(BlurView, { intensity: 15, tint: "dark", experimentalBlurMethod: "dimezisBlurView", style: StyleSheet.absoluteFill }) }), _jsx(View, { style: [
                        StyleSheet.absoluteFill,
                        {
                            borderRadius: resolvedRadius,
                            backgroundColor: "rgba(139, 92, 246, 0.85)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.2)",
                        },
                    ] }), _jsx(View, { style: basePadding, children: content })] }));
    }
    // ── Glass & Ghost variants (unchanged layout) ──
    const bg = variant === "glass"
        ? {
            ...(isWeb
                ? getWebGlassStyle({
                    blur: 8,
                    tintAlpha: 0.08,
                    borderAlpha: 0.34,
                    shadow: "none",
                })
                : {
                    backgroundColor: colors.glass.background,
                    borderWidth: 1,
                    borderColor: colors.glass.border,
                }),
        }
        : { backgroundColor: "transparent" };
    return (_jsx(AnimatedTouchable, { onPress: onPress, onPressIn: handlePressIn, onPressOut: handlePressOut, disabled: disabled || loading, activeOpacity: 0.9, style: [
            {
                borderRadius: resolvedRadius,
                opacity: disabled ? 0.5 : 1,
            },
            basePadding,
            bg,
            animatedStyle,
            style,
        ], children: content }));
}
