"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getSupabase } from "../../../utils/supabase";
import { services } from "@my-app/core";
import { GlassModal, KText, KButton, ErrorBanner, colors, spacing, } from "@repo/ui";
const { createSubmissionsService } = services;
export function AdminModerateButton({ groupId, dailyQuestionId, isAdmin, disabled, onReplaced, }) {
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [replacing, setReplacing] = useState(false);
    const [error, setError] = useState(null);
    if (!isAdmin)
        return null;
    const isWeb = Platform.OS === "web";
    const BlurView = !isWeb ? require("expo-blur").BlurView : null;
    const handleReplace = async () => {
        setReplacing(true);
        setError(null);
        try {
            const svc = createSubmissionsService(getSupabase());
            await svc.adminReplaceQuestion(groupId, dailyQuestionId);
            setConfirmVisible(false);
            onReplaced();
        }
        catch (err) {
            const msg = err?.message ?? "Erreur";
            if (msg.includes("Limite atteinte")) {
                setError("Limite atteinte : 1 remplacement par jour");
            }
            else {
                setError(msg);
            }
        }
        finally {
            setReplacing(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(TouchableOpacity, { onPress: () => setConfirmVisible(true), disabled: disabled, activeOpacity: 0.7, style: {
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "center",
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: 20,
                    overflow: "hidden",
                    opacity: disabled ? 0.4 : 1,
                    marginTop: spacing.sm,
                }, children: [!isWeb && (_jsx(View, { style: [StyleSheet.absoluteFill, { borderRadius: 20, overflow: "hidden" }], children: _jsx(BlurView, { intensity: 25, tint: "dark", experimentalBlurMethod: "dimezisBlurView", style: StyleSheet.absoluteFill }) })), _jsx(View, { style: [
                            StyleSheet.absoluteFill,
                            {
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.15)",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                ...(isWeb
                                    ? {
                                        // @ts-ignore web-only
                                        backdropFilter: "blur(12px)",
                                        WebkitBackdropFilter: "blur(12px)",
                                    }
                                    : {}),
                            },
                        ] }), _jsx(Feather, { name: "refresh-cw", size: 14, color: disabled ? colors.textMuted : colors.textSecondary, style: { marginRight: spacing.xs } }), _jsx(KText, { variant: "caption", color: disabled ? colors.textMuted : colors.textSecondary, children: "Remplacer" })] }), _jsxs(GlassModal, { visible: confirmVisible, onClose: () => {
                    if (!replacing) {
                        setConfirmVisible(false);
                        setError(null);
                    }
                }, children: [_jsx(KText, { variant: "h3", style: { textAlign: "center", marginBottom: spacing.md }, children: "Remplacer la question ?" }), _jsx(KText, { variant: "bodySmall", color: colors.textSecondary, style: { textAlign: "center", marginBottom: spacing.lg }, children: "La question actuelle sera remplacee par une nouvelle de la banque. Tu ne peux le faire qu'une seule fois par jour." }), _jsx(ErrorBanner, { message: error }), _jsxs(View, { style: {
                            flexDirection: "row",
                            justifyContent: "center",
                        }, children: [_jsx(KButton, { title: "Annuler", onPress: () => {
                                    setConfirmVisible(false);
                                    setError(null);
                                }, variant: "glass", disabled: replacing, style: { minWidth: 110, marginRight: spacing.sm } }), _jsx(KButton, { title: "Remplacer", onPress: handleReplace, loading: replacing, disabled: replacing, style: { minWidth: 110 } })] })] })] }));
}
