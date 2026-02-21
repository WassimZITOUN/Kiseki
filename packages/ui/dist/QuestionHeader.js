"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors, spacing } from "./tokens";
import { KText } from "./KText";
export function QuestionHeader({ question, subtitle }) {
    return (_jsxs(Animated.View, { entering: FadeIn.duration(400), style: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xl,
            alignItems: "center",
            justifyContent: "center",
        }, children: [subtitle && (_jsx(KText, { variant: "caption", color: colors.textMuted, style: { marginBottom: spacing.xs, textTransform: "uppercase", letterSpacing: 1 }, children: subtitle })), _jsx(KText, { variant: "questionLarge", style: { textAlign: "center" }, children: question })] }));
}
