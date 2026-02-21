"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { View, Pressable, LayoutAnimation, Platform, UIManager, StyleSheet, } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { GlassCard } from "./GlassCard";
import { KAvatar } from "./KAvatar";
import { KText } from "./KText";
import { colors, spacing, radii } from "./tokens";
// Enable LayoutAnimation on Android
if (Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
export function ResultCard({ item, rank, delay = 0 }) {
    const [expanded, setExpanded] = useState(false);
    const hasComments = item.comments.length > 0;
    const handlePress = () => {
        if (!hasComments)
            return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((prev) => !prev);
    };
    return (_jsx(Animated.View, { entering: FadeInUp.delay(delay).duration(400), style: { marginBottom: spacing.sm }, children: _jsx(Pressable, { onPress: handlePress, disabled: !hasComments, children: _jsxs(GlassCard, { style: { borderRadius: radii.lg, padding: 0 }, children: [_jsx(View, { style: [
                            StyleSheet.absoluteFill,
                            {
                                borderRadius: radii.lg,
                                overflow: "hidden",
                            },
                        ], children: _jsx(View, { style: {
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${item.percentage}%`,
                                backgroundColor: colors.success,
                                opacity: 0.2,
                            } }) }), _jsxs(View, { style: {
                            flexDirection: "row",
                            alignItems: "center",
                            padding: spacing.md,
                            minHeight: 60,
                        }, children: [_jsx(KText, { variant: "bodySmall", color: colors.textMuted, style: { width: 24, fontWeight: "600" }, children: rank }), _jsx(KAvatar, { uri: item.avatarUri, name: item.name, size: 36 }), _jsx(KText, { variant: "body", color: colors.textPrimary, style: { flex: 1, marginLeft: spacing.sm, fontWeight: "500" }, children: item.name }), _jsx(View, { style: {
                                    backgroundColor: "rgba(139, 92, 246, 0.2)",
                                    borderRadius: radii.full,
                                    paddingHorizontal: 10,
                                    paddingVertical: 3,
                                }, children: _jsxs(KText, { variant: "caption", color: colors.violet[300], style: { fontWeight: "600" }, children: [item.voteCount, " vote", item.voteCount > 1 ? "s" : ""] }) }), hasComments && (_jsx(KText, { variant: "caption", color: colors.textMuted, style: { marginLeft: spacing.sm }, children: expanded ? "▲" : "▼" }))] }), expanded && (_jsx(View, { style: {
                            paddingHorizontal: spacing.md,
                            paddingBottom: spacing.md,
                            paddingTop: spacing.xs,
                            borderTopWidth: 1,
                            borderTopColor: colors.glass.border,
                        }, children: item.comments.map((comment, i) => (_jsxs(KText, { variant: "bodySmall", color: colors.textSecondary, style: {
                                fontStyle: "italic",
                                marginBottom: i < item.comments.length - 1 ? spacing.xs : 0,
                            }, children: ["\"", comment, "\""] }, i))) }))] }) }) }));
}
