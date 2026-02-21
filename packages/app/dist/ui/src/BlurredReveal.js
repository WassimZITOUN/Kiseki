"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { View, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, } from "react-native-reanimated";
import { radii } from "./tokens";
export function BlurredReveal({ children, revealed = false, duration = 1500, }) {
    const blurAmount = useSharedValue(revealed ? 0 : 80);
    useEffect(() => {
        blurAmount.value = withTiming(revealed ? 0 : 80, {
            duration,
            easing: Easing.out(Easing.cubic),
        });
    }, [revealed, duration]);
    if (Platform.OS === "web") {
        const animatedStyle = useAnimatedStyle(() => ({
            // @ts-ignore web-only
            filter: `blur(${blurAmount.value}px)`,
        }), []);
        return (_jsx(Animated.View, { style: [
                {
                    borderRadius: radii.lg,
                    overflow: "hidden",
                },
                animatedStyle,
            ], children: children }));
    }
    const BlurView = require("expo-blur").BlurView;
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: blurAmount.value / 80,
    }), []);
    return (_jsxs(View, { style: { borderRadius: radii.lg, overflow: "hidden" }, children: [children, _jsx(Animated.View, { style: [
                    {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    },
                    animatedStyle,
                ], children: _jsx(BlurView, { intensity: 80, tint: "dark", experimentalBlurMethod: "dimezisBlurView", style: { flex: 1 } }) })] }));
}
