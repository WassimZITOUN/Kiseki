"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, TouchableOpacity } from "react-native";
import { GlassBottomSheet, KText, KAvatar, colors, spacing, radii, } from "@repo/ui";
export function VoteDetailsSheet({ visible, onClose, votes, question, }) {
    // Group votes by target, sorted by vote count descending
    const grouped = votes.reduce((acc, vote) => {
        const key = vote.target.id;
        const list = acc.get(key) ?? [];
        list.push(vote);
        acc.set(key, list);
        return acc;
    }, new Map());
    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => b[1].length - a[1].length);
    return (_jsxs(GlassBottomSheet, { visible: visible, onClose: onClose, children: [_jsxs(View, { style: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing.sm,
                }, children: [_jsx(KText, { variant: "h3", style: { flex: 1 }, children: "Detail des votes" }), _jsx(TouchableOpacity, { onPress: onClose, style: {
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            borderRadius: radii.full,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.2)",
                        }, children: _jsx(KText, { variant: "bodySmall", color: colors.textPrimary, children: "Fermer" }) })] }), _jsx(KText, { variant: "bodySmall", color: colors.textPrimary, style: {
                    fontStyle: "italic",
                    marginBottom: spacing.md,
                    fontWeight: "700",
                }, children: question }), sortedGroups.map(([targetId, targetVotes], groupIndex) => {
                const target = targetVotes[0].target;
                const targetName = target.display_name ?? target.username;
                return (_jsxs(View, { children: [_jsxs(View, { style: {
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: spacing.sm,
                                marginTop: groupIndex > 0 ? spacing.sm : 0,
                                borderBottomWidth: 1,
                                borderBottomColor: "rgba(139,92,246,0.2)",
                            }, children: [_jsx(KAvatar, { uri: target.avatar_url, name: targetName, size: 28 }), _jsx(KText, { color: colors.violet[500], variant: "body", style: {
                                        marginLeft: spacing.xs,
                                        fontWeight: "700",
                                        flex: 1,
                                        textShadowColor: colors.violet[900],
                                        textShadowOffset: { width: 0, height: 0 },
                                        textShadowRadius: 3,
                                    }, children: targetName }), _jsx(View, { style: {
                                        backgroundColor: "rgba(139, 92, 246, 0.2)",
                                        borderRadius: radii.full,
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                    }, children: _jsxs(KText, { variant: "caption", color: colors.violet[300], style: { fontWeight: "600" }, children: [targetVotes.length, " vote", targetVotes.length > 1 ? "s" : ""] }) })] }), targetVotes.map((vote, voteIndex) => {
                            const voterName = vote.voter.display_name ?? vote.voter.username;
                            return (_jsxs(View, { style: {
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    paddingVertical: spacing.sm,
                                    paddingLeft: spacing.md,
                                    borderBottomWidth: voteIndex < targetVotes.length - 1 ? 1 : 0,
                                    borderBottomColor: "rgba(255,255,255,0.06)",
                                }, children: [_jsx(KAvatar, { uri: vote.voter.avatar_url, name: voterName, size: 24 }), _jsxs(View, { style: { marginLeft: spacing.xs, flex: 1 }, children: [_jsx(KText, { variant: "bodySmall", color: colors.violet[300], style: { fontWeight: "500" }, children: voterName }), vote.context_note && (_jsxs(KText, { variant: "caption", color: colors.textPrimary, style: { fontStyle: "italic", marginTop: 2 }, children: ["\"", vote.context_note, "\""] }))] })] }, `${vote.voter.id}-${voteIndex}`));
                        })] }, targetId));
            }), votes.length === 0 && (_jsx(KText, { variant: "body", color: colors.textMuted, style: { textAlign: "center", paddingVertical: spacing.lg }, children: "Aucun vote" }))] }));
}
