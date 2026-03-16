"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { getSupabase } from "../../../utils/supabase";
import { services } from "@my-app/core";
import { GlassCard, GlassModal, KText, KInput, KButton, ErrorBanner, colors, spacing, } from "@repo/ui";
const { createSubmissionsService } = services;
export function SubmitQuestionCard({ groupId, slotId, onSubmitted }) {
    const [questionText, setQuestionText] = useState("");
    const [intensity, setIntensity] = useState("normal");
    const [mode, setMode] = useState("custom");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const trimmed = questionText.trim();
    const isValid = mode === "bank" || (trimmed.length >= 10 && trimmed.length <= 200);
    const handleSubmit = async () => {
        if (!isValid)
            return;
        setSubmitting(true);
        setError(null);
        try {
            const svc = createSubmissionsService(getSupabase());
            await svc.submitQuestion(slotId, groupId, mode === "bank" ? null : trimmed, {
                intensity,
                chooseBank: mode === "bank",
            });
            setConfirmVisible(true);
        }
        catch (err) {
            setError(err?.message ?? "Erreur lors de l'envoi");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Animated.View, { entering: FadeIn.duration(400), style: { paddingHorizontal: spacing.md, marginTop: spacing.md }, children: _jsxs(GlassCard, { children: [_jsx(KText, { variant: "h3", style: { marginBottom: spacing.xs }, children: "Propose ta question" }), _jsx(KText, { variant: "caption", color: colors.textSecondary, style: { marginBottom: spacing.md }, children: "Tu peux envoyer une seule proposition pour ce cycle." }), _jsx(ErrorBanner, { message: error }), _jsx(KText, { variant: "caption", color: colors.textSecondary, style: { marginBottom: spacing.xs }, children: "Mode" }), _jsxs(View, { style: { flexDirection: "row", marginBottom: spacing.md }, children: [_jsx(TouchableOpacity, { onPress: () => setMode("custom"), activeOpacity: 0.7, style: {
                                        flex: 1,
                                        paddingVertical: spacing.sm,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        backgroundColor: mode === "custom"
                                            ? "rgba(149, 114, 207, 0.3)"
                                            : "rgba(255, 255, 255, 0.05)",
                                        borderWidth: 1,
                                        borderColor: mode === "custom"
                                            ? colors.violet.primary
                                            : "rgba(255, 255, 255, 0.1)",
                                        marginRight: spacing.sm,
                                    }, children: _jsx(KText, { variant: "body", color: mode === "custom" ? colors.textPrimary : colors.textSecondary, children: "Ma question" }) }), _jsx(TouchableOpacity, { onPress: () => setMode("bank"), activeOpacity: 0.7, style: {
                                        flex: 1,
                                        paddingVertical: spacing.sm,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        backgroundColor: mode === "bank"
                                            ? "rgba(56, 161, 105, 0.25)"
                                            : "rgba(255, 255, 255, 0.05)",
                                        borderWidth: 1,
                                        borderColor: mode === "bank" ? colors.success : "rgba(255, 255, 255, 0.1)",
                                    }, children: _jsx(KText, { variant: "body", color: mode === "bank" ? colors.textPrimary : colors.textSecondary, children: "Auto" }) })] }), mode === "custom" ? (_jsxs(_Fragment, { children: [_jsx(KInput, { label: "Ta question", value: questionText, onChangeText: (t) => setQuestionText(t.slice(0, 200)), placeholder: "Qui est le plus susceptible de...", multiline: true, maxLength: 200, style: { minHeight: 80, textAlignVertical: "top" }, containerStyle: { marginBottom: spacing.xs } }), _jsxs(KText, { variant: "caption", color: trimmed.length < 10
                                        ? colors.textMuted
                                        : trimmed.length >= 190
                                            ? colors.error
                                            : colors.textMuted, style: { textAlign: "right", marginBottom: spacing.md }, children: [trimmed.length, "/200 ", trimmed.length > 0 && trimmed.length < 10 ? "(min 10)" : ""] })] })) : (_jsx(KText, { variant: "bodySmall", color: colors.textMuted, style: { marginBottom: spacing.md }, children: "L'algorithme choisira une question de la banque a ta place." })), _jsx(KText, { variant: "caption", color: colors.textSecondary, style: { marginBottom: spacing.xs }, children: "Intensite" }), _jsxs(View, { style: { flexDirection: "row", marginBottom: spacing.lg }, children: [_jsx(TouchableOpacity, { onPress: () => setIntensity("normal"), activeOpacity: 0.7, style: {
                                        flex: 1,
                                        paddingVertical: spacing.sm,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        backgroundColor: intensity === "normal"
                                            ? "rgba(149, 114, 207, 0.3)"
                                            : "rgba(255, 255, 255, 0.05)",
                                        borderWidth: 1,
                                        borderColor: intensity === "normal"
                                            ? colors.violet.primary
                                            : "rgba(255, 255, 255, 0.1)",
                                        marginRight: spacing.sm,
                                    }, children: _jsx(KText, { variant: "body", color: intensity === "normal" ? colors.textPrimary : colors.textSecondary, children: "Normal" }) }), _jsx(TouchableOpacity, { onPress: () => setIntensity("epice"), activeOpacity: 0.7, style: {
                                        flex: 1,
                                        paddingVertical: spacing.sm,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        backgroundColor: intensity === "epice"
                                            ? "rgba(239, 68, 68, 0.3)"
                                            : "rgba(255, 255, 255, 0.05)",
                                        borderWidth: 1,
                                        borderColor: intensity === "epice" ? "#EF4444" : "rgba(255, 255, 255, 0.1)",
                                    }, children: _jsx(KText, { variant: "body", color: intensity === "epice" ? colors.textPrimary : colors.textSecondary, children: "Epice" }) })] }), _jsx(KButton, { title: "Confirmer ma question", onPress: handleSubmit, loading: submitting, disabled: !isValid || submitting })] }) }), _jsxs(GlassModal, { visible: confirmVisible, onClose: () => {
                    setConfirmVisible(false);
                    onSubmitted();
                }, children: [_jsx(KText, { variant: "h3", style: { textAlign: "center", marginBottom: spacing.sm }, children: "Proposition envoyee" }), _jsx(KText, { variant: "bodySmall", color: colors.textSecondary, style: { textAlign: "center", marginBottom: spacing.lg }, children: "Ta proposition est verouillee jusqu'au prochain cycle." }), _jsx(KButton, { title: "Compris", onPress: () => {
                            setConfirmVisible(false);
                            onSubmitted();
                        } })] })] }));
}
