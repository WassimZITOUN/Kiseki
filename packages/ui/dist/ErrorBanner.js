"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import Animated, { FadeOut, SlideInUp } from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";
import { KText } from "./KText";
export function ErrorBanner({ message }) {
    if (!message)
        return null;
    return (_jsx(Animated.View, { entering: SlideInUp.duration(300), exiting: FadeOut.duration(200), style: {
            backgroundColor: "#FEE2E2",
            borderWidth: 1,
            borderColor: "#FECACA",
            borderRadius: radii.md,
            padding: spacing.md,
            marginHorizontal: spacing.md,
            marginBottom: spacing.sm,
        }, children: _jsx(KText, { variant: "bodySmall", color: colors.error, style: { textAlign: "center" }, children: message }) }));
}
