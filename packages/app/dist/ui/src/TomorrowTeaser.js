"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { GlassCard } from "./GlassCard";
import { KText } from "./KText";
import { colors, spacing, radii } from "./tokens";
/** View-based lock icon — rectangle body + arc top + center dot */
function LockIcon() {
    return (_jsxs(View, { style: { alignItems: "center", marginBottom: spacing.sm }, children: [_jsx(View, { style: {
                    width: 20,
                    height: 12,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    borderWidth: 3,
                    borderBottomWidth: 0,
                    borderColor: colors.textMuted,
                    marginBottom: -1,
                } }), _jsx(View, { style: {
                    width: 24,
                    height: 18,
                    borderRadius: 4,
                    backgroundColor: colors.textMuted,
                    alignItems: "center",
                    justifyContent: "center",
                }, children: _jsx(View, { style: {
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.surface,
                    } }) })] }));
}
export function TomorrowTeaser({ countdown }) {
    return (_jsx(Animated.View, { entering: FadeIn.delay(400).duration(500), children: _jsxs(GlassCard, { style: {
                borderRadius: radii.xl,
                alignItems: "center",
            }, children: [_jsx(LockIcon, {}), _jsx(KText, { variant: "bodySmall", color: colors.textMuted, style: { textAlign: "center", marginBottom: spacing.xs }, children: "Prochaine question dans" }), _jsx(KText, { variant: "h2", color: colors.violet.primary, style: {
                        textAlign: "center",
                        fontVariant: ["tabular-nums"],
                        letterSpacing: 1,
                        marginBottom: spacing.xs,
                    }, children: countdown }), _jsx(KText, { variant: "caption", color: colors.textMuted, style: { textAlign: "center" }, children: "Reviens demain !" })] }) }));
}
