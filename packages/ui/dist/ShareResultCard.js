"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KAvatar } from "./KAvatar";
import { KText } from "./KText";
import { colors, radii, spacing, typography } from "./tokens";
/** View-based crown icon — 3 triangles forming a crown shape */
function CrownIcon() {
    const triSize = 10;
    return (_jsxs(View, { style: {
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            marginBottom: spacing.xs,
            height: 20,
        }, children: [_jsx(View, { style: {
                    width: 0,
                    height: 0,
                    borderLeftWidth: triSize / 2,
                    borderRightWidth: triSize / 2,
                    borderBottomWidth: triSize,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderBottomColor: "#FFD700",
                    transform: [{ rotate: "-15deg" }],
                    marginRight: 2,
                } }), _jsx(View, { style: {
                    width: 0,
                    height: 0,
                    borderLeftWidth: triSize / 2 + 2,
                    borderRightWidth: triSize / 2 + 2,
                    borderBottomWidth: triSize + 4,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderBottomColor: "#FFD700",
                    marginBottom: 2,
                } }), _jsx(View, { style: {
                    width: 0,
                    height: 0,
                    borderLeftWidth: triSize / 2,
                    borderRightWidth: triSize / 2,
                    borderBottomWidth: triSize,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderBottomColor: "#FFD700",
                    transform: [{ rotate: "15deg" }],
                    marginLeft: 2,
                } })] }));
}
export function ShareResultCard({ question, winnerName, winnerAvatarUri, winnerVoteCount, groupName, }) {
    return (_jsx(View, { style: {
            maxWidth: 340,
            alignSelf: "center",
            borderRadius: radii.xl,
            overflow: "hidden",
        }, children: _jsxs(LinearGradient, { colors: [colors.violet[800], colors.violet[500]], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: {
                padding: spacing.lg,
                alignItems: "center",
            }, children: [_jsx(KText, { variant: "caption", color: "rgba(255,255,255,0.5)", style: { alignSelf: "flex-start", marginBottom: spacing.md }, children: "Kiseki" }), _jsx(KText, { variant: "questionLarge", color: colors.textPrimary, style: {
                        textAlign: "center",
                        marginBottom: spacing.lg,
                        ...typography.questionLarge,
                        fontSize: 24,
                        lineHeight: 32,
                    }, children: question.length > 80 ? question.slice(0, 77) + "..." : question }), _jsx(CrownIcon, {}), _jsx(View, { style: {
                        borderRadius: 44,
                        borderWidth: 3,
                        borderColor: "#FFD700",
                        padding: 3,
                        shadowColor: "#FFD700",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: 16,
                        elevation: 10,
                        marginBottom: spacing.sm,
                    }, children: _jsx(KAvatar, { uri: winnerAvatarUri, name: winnerName, size: 80 }) }), _jsx(KText, { variant: "h3", color: colors.textPrimary, style: { textAlign: "center", marginBottom: 2 }, children: winnerName }), _jsxs(KText, { variant: "caption", color: "rgba(255,255,255,0.7)", style: { marginBottom: spacing.md }, children: [winnerVoteCount, " vote", winnerVoteCount > 1 ? "s" : ""] }), _jsx(View, { style: {
                        width: "20%",
                        height: 1,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        marginBottom: spacing.md,
                    } }), _jsxs(KText, { variant: "caption", color: "rgba(255,255,255,0.4)", style: { textAlign: "center" }, children: [groupName, " \u00B7 kiseki.app"] })] }) }));
}
