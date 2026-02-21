"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, } from "react-native-reanimated";
import { colors } from "./tokens";
const PARTICLE_COUNT = 30;
const DURATION = 1500;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CONFETTI_COLORS = [
    colors.aurora.pink,
    colors.aurora.blue,
    colors.aurora.violet,
    colors.aurora.mint,
    colors.aurora.peach,
];
function Particle({ index, onDone }) {
    const progress = useSharedValue(0);
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    const startX = Math.random() * SCREEN_W;
    const endX = startX + (Math.random() - 0.5) * 120;
    const size = 6 + Math.random() * 6;
    const delay = Math.random() * 300;
    useEffect(() => {
        progress.value = withDelay(delay, withTiming(1, {
            duration: DURATION,
            easing: Easing.out(Easing.cubic),
        }));
    }, []);
    const animatedStyle = useAnimatedStyle(() => {
        const y = -50 + progress.value * (SCREEN_H + 100);
        const x = startX + (endX - startX) * progress.value;
        const opacity = progress.value < 0.8 ? 1 : 1 - (progress.value - 0.8) / 0.2;
        const rotate = progress.value * 360 * (index % 2 === 0 ? 1 : -1);
        return {
            transform: [
                { translateX: x },
                { translateY: y },
                { rotate: `${rotate}deg` },
            ],
            opacity,
        };
    }, [endX, index, startX]);
    return (_jsx(Animated.View, { style: [
            {
                position: "absolute",
                width: size,
                height: size,
                borderRadius: index % 3 === 0 ? size / 2 : 2,
                backgroundColor: color,
            },
            animatedStyle,
        ] }));
}
export function ConfettiOverlay({ visible, onDone }) {
    useEffect(() => {
        if (visible && onDone) {
            const timer = setTimeout(onDone, DURATION + 500);
            return () => clearTimeout(timer);
        }
    }, [visible, onDone]);
    if (!visible)
        return null;
    return (_jsx(View, { style: [StyleSheet.absoluteFill, { pointerEvents: "none", zIndex: 999 }], children: Array.from({ length: PARTICLE_COUNT }).map((_, i) => (_jsx(Particle, { index: i }, i))) }));
}
