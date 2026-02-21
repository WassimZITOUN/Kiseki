"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, TouchableOpacity, Alert, Platform } from "react-native";
import { GlassBottomSheet, KText, KButton, KAvatar, colors, spacing, radii, } from "@repo/ui";
export function GroupMenu({ visible, onClose, members, group, leaving, onLeave, onCopyCode, codeCopied, currentUserId, onRemoveMember, }) {
    if (!group)
        return null;
    const currentMember = members.find((m) => m.user_id === currentUserId);
    const isAdmin = currentMember?.role === "admin";
    const handleRemove = (member) => {
        const name = member.profiles?.display_name ??
            member.profiles?.username ??
            "Inconnu";
        if (Platform.OS === "web") {
            if (window.confirm(`Exclure ${name} du groupe ?`)) {
                onRemoveMember?.(member.user_id, name);
            }
        }
        else {
            Alert.alert("Exclure un membre", `Exclure ${name} du groupe ?`, [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Exclure",
                    style: "destructive",
                    onPress: () => onRemoveMember?.(member.user_id, name),
                },
            ]);
        }
    };
    const handleLeave = () => {
        if (Platform.OS === "web") {
            if (window.confirm("Quitter ce groupe ?")) {
                onLeave();
            }
        }
        else {
            Alert.alert("Quitter le groupe", "Es-tu sur de vouloir quitter ce groupe ?", [
                { text: "Annuler", style: "cancel" },
                { text: "Quitter", style: "destructive", onPress: onLeave },
            ]);
        }
    };
    return (_jsxs(GlassBottomSheet, { visible: visible, onClose: onClose, children: [_jsxs(View, { style: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing.md,
                }, children: [_jsx(KText, { variant: "h3", children: group.name }), _jsx(TouchableOpacity, { onPress: onClose, style: {
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            borderRadius: radii.full,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.2)",
                        }, children: _jsx(KText, { variant: "bodySmall", color: colors.textMuted, children: "Fermer" }) })] }), _jsxs(View, { style: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.xs,
                    marginBottom: spacing.md,
                }, children: [_jsx(View, { style: {
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.15)",
                            borderRadius: radii.full,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 4,
                        }, children: _jsxs(KText, { variant: "caption", color: colors.textSecondary, children: ["Question : ", group.question_time] }) }), _jsx(View, { style: {
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.15)",
                            borderRadius: radii.full,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 4,
                        }, children: _jsxs(KText, { variant: "caption", color: colors.textSecondary, children: ["Reveal : ", group.reveal_time] }) }), _jsx(View, { style: {
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.15)",
                            borderRadius: radii.full,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 4,
                        }, children: _jsxs(KText, { variant: "caption", color: colors.textSecondary, children: ["Max : ", group.max_members] }) })] }), _jsx(KButton, { title: codeCopied
                    ? "Code copié !"
                    : `Copier le code : ${group.invite_code.toUpperCase()}`, onPress: onCopyCode, variant: "glass", style: { marginBottom: spacing.md } }), _jsxs(KText, { variant: "body", style: {
                    fontWeight: "600",
                    marginBottom: spacing.sm,
                }, children: ["Membres (", members.length, "/", group.max_members, ")"] }), members.map((item, index) => (_jsxs(View, { style: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: spacing.sm,
                    borderBottomWidth: index < members.length - 1 ? 1 : 0,
                    borderBottomColor: "rgba(255,255,255,0.1)",
                }, children: [_jsx(KAvatar, { uri: item.profiles?.avatar_url, name: item.profiles?.display_name ??
                            item.profiles?.username, size: 36, style: { marginRight: spacing.sm } }), _jsx(View, { style: { flex: 1 }, children: _jsx(KText, { variant: "bodySmall", style: { fontWeight: "500" }, children: item.profiles?.display_name ??
                                item.profiles?.username ??
                                "Inconnu" }) }), item.role === "admin" && (_jsx(View, { style: {
                            backgroundColor: "rgba(149, 114, 207, 0.15)",
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 3,
                            borderRadius: radii.full,
                            borderWidth: 1,
                            borderColor: "rgba(149, 114, 207, 0.3)",
                        }, children: _jsx(KText, { variant: "caption", color: colors.violet.primary, children: "Admin" }) })), isAdmin && item.user_id !== currentUserId && (_jsx(TouchableOpacity, { onPress: () => handleRemove(item), style: {
                            marginLeft: spacing.sm,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            borderRadius: radii.full,
                            backgroundColor: "rgba(229, 62, 62, 0.1)",
                            borderWidth: 1,
                            borderColor: "rgba(229, 62, 62, 0.2)",
                        }, children: _jsx(KText, { variant: "caption", color: colors.error, children: "Exclure" }) }))] }, item.id))), _jsx(KButton, { title: leaving ? "Départ..." : "Quitter le groupe", onPress: handleLeave, disabled: leaving, variant: "ghost", style: { marginTop: spacing.lg } })] }));
}
