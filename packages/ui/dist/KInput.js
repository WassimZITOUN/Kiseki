"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { TextInput, View, Platform, } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, } from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";
import { KText } from "./KText";
const AnimatedView = Animated.createAnimatedComponent(View);
export function KInput({ label, error, containerStyle, style, onFocus, onBlur, ...props }) {
    const [focused, setFocused] = useState(false);
    const borderOpacity = useSharedValue(0.3);
    const animatedBorder = useAnimatedStyle(() => ({
        borderColor: `rgba(149, 114, 207, ${borderOpacity.value})`,
    }), []);
    const handleFocus = (e) => {
        setFocused(true);
        borderOpacity.value = withTiming(0.8, { duration: 200 });
        onFocus?.(e);
    };
    const handleBlur = (e) => {
        setFocused(false);
        borderOpacity.value = withTiming(0.3, { duration: 200 });
        onBlur?.(e);
    };
    return (_jsxs(View, { style: containerStyle, children: [label && (_jsx(KText, { variant: "caption", color: colors.textSecondary, style: { marginBottom: spacing.xs }, children: label })), _jsx(AnimatedView, { style: [
                    {
                        backgroundColor: colors.glass.background,
                        borderWidth: 1,
                        borderRadius: radii.md,
                        overflow: "hidden",
                    },
                    animatedBorder,
                ], children: _jsx(TextInput, { placeholderTextColor: colors.textMuted, ...props, onFocus: handleFocus, onBlur: handleBlur, style: [
                        {
                            padding: spacing.md,
                            fontSize: 16,
                            color: Platform.OS === "web" ? "#16254A" : colors.textPrimary,
                        },
                        style,
                    ] }) }), error && (_jsx(KText, { variant: "caption", color: colors.error, style: { marginTop: spacing.xs }, children: error }))] }));
}
