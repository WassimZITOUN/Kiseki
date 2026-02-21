"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, } from "react-native-reanimated";
import { colors, spacing } from "./tokens";
import { KText } from "./KText";
export function CountdownTimer({ countdown, label = "Resultats dans..." }) {
    const pulse = useSharedValue(1);
    useEffect(() => {
        pulse.value = withRepeat(withSequence(withTiming(1.02, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, false);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }), []);
    return (_jsxs(View, { style: { alignItems: "center" }, children: [_jsx(KText, { variant: "bodySmall", color: colors.textMuted, style: { marginBottom: spacing.sm }, children: label }), _jsx(Animated.View, { style: animatedStyle, children: _jsx(KText, { variant: "h1", style: {
                        fontSize: 42,
                        fontWeight: "bold",
                        fontVariant: ["tabular-nums"],
                        letterSpacing: 2,
                    }, children: countdown }) })] }));
}
