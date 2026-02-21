"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { View, TouchableOpacity, Modal, Platform, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut, withSpring, useAnimatedStyle, useSharedValue, } from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";
import { getWebGlassStyle } from "./webGlass";
// iOS Premium Spring — snappy, no jelly
const SNAPPY_SPRING = {
    damping: 40,
    stiffness: 350,
    mass: 1,
    overshootClamping: true,
};
function ModalCard({ children }) {
    const scale = useSharedValue(0.9);
    React.useEffect(() => {
        scale.value = withSpring(1, SNAPPY_SPRING);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }), []);
    if (Platform.OS === "web") {
        return (_jsx(Animated.View, { entering: FadeIn.duration(150), exiting: FadeOut.duration(100), style: [
                {
                    borderRadius: radii.xl,
                    marginHorizontal: spacing.lg,
                    maxWidth: 400,
                    width: "100%",
                    alignSelf: "center",
                    overflow: "hidden",
                    padding: spacing.lg,
                    ...getWebGlassStyle({
                        blur: 10,
                        tintAlpha: 0.08,
                        borderAlpha: 0.34,
                        shadow: "0 22px 56px rgba(0, 0, 0, 0.34)",
                    }),
                },
                animatedStyle,
            ], children: children }));
    }
    const BlurView = require("expo-blur").BlurView;
    return (_jsxs(Animated.View, { entering: FadeIn.duration(150), exiting: FadeOut.duration(100), style: [
            {
                borderRadius: radii.xl,
                marginHorizontal: spacing.lg,
                maxWidth: 400,
                alignSelf: "center",
                width: "100%",
                shadowColor: colors.shadow.color,
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.25,
                shadowRadius: 24,
                elevation: 16,
            },
            animatedStyle,
        ], children: [_jsx(View, { style: [
                    StyleSheet.absoluteFill,
                    { borderRadius: radii.xl, overflow: "hidden" },
                ], children: _jsx(BlurView, { intensity: 60, tint: "dark", experimentalBlurMethod: "dimezisBlurView", style: StyleSheet.absoluteFill }) }), _jsx(View, { style: [
                    StyleSheet.absoluteFill,
                    {
                        borderRadius: radii.xl,
                        borderWidth: 1,
                        borderColor: colors.glass.border,
                        backgroundColor: colors.glass.background,
                    },
                ] }), _jsx(View, { style: { padding: spacing.lg }, children: children })] }));
}
export function GlassModal({ visible, onClose, children }) {
    if (Platform.OS === "web") {
        if (!visible)
            return null;
        return (_jsxs(View, { style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colors.overlay,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 200,
            }, children: [_jsx(TouchableOpacity, { activeOpacity: 1, onPress: onClose, style: {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    } }), _jsx(ModalCard, { children: children })] }));
    }
    return (_jsx(Modal, { visible: visible, transparent: true, animationType: "fade", children: _jsxs(View, { style: {
                flex: 1,
                backgroundColor: colors.overlay,
                justifyContent: "center",
                alignItems: "center",
            }, children: [_jsx(TouchableOpacity, { activeOpacity: 1, onPress: onClose, style: {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    } }), _jsx(ModalCard, { children: children })] }) }));
}
