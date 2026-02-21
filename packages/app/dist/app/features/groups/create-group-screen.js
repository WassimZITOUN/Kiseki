"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { View, Platform } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { getSupabase } from "../../utils/supabase";
import { services, validators } from "@my-app/core";
import { AuroraScreenWrapper, KText, KInput, KButton, GlassCard, ErrorBanner, colors, spacing, } from "@repo/ui";
const { createGroupsService } = services;
const { GROUP_NAME_MAX_LENGTH } = validators;
export function CreateGroupScreen({ onGroupCreated, onBack }) {
    const [name, setName] = useState("");
    const [maxMembers, setMaxMembers] = useState("12");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inviteCode, setInviteCode] = useState(null);
    const [createdGroupId, setCreatedGroupId] = useState(null);
    const [copied, setCopied] = useState(false);
    const handleCreate = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Le nom du groupe est obligatoire");
            return;
        }
        if (trimmedName.length > GROUP_NAME_MAX_LENGTH) {
            setError(`Le nom du groupe ne doit pas depasser ${GROUP_NAME_MAX_LENGTH} caracteres`);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const service = createGroupsService(getSupabase());
            const group = await service.createGroup(trimmedName, {
                maxMembers: parseInt(maxMembers, 10) || 20,
            });
            setInviteCode(group.invite_code);
            setCreatedGroupId(group.id);
        }
        catch (err) {
            setError(err?.message ?? "Erreur lors de la creation du groupe");
        }
        finally {
            setLoading(false);
        }
    };
    const handleCopy = async () => {
        if (!inviteCode)
            return;
        try {
            if (Platform.OS === "web") {
                await navigator.clipboard.writeText(inviteCode);
            }
            else {
                const Clipboard = require("expo-clipboard");
                await Clipboard.setStringAsync(inviteCode);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch { }
    };
    if (inviteCode && createdGroupId) {
        return (_jsx(AuroraScreenWrapper, { children: _jsx(View, { style: {
                    flex: 1,
                    justifyContent: "center",
                    padding: spacing.lg,
                }, children: _jsxs(Animated.View, { entering: FadeIn.duration(400), children: [_jsx(KText, { variant: "h1", style: {
                                textAlign: "center",
                                marginBottom: spacing.md,
                            }, children: "Groupe cree !" }), _jsx(KText, { variant: "bodySmall", color: colors.textSecondary, style: {
                                textAlign: "center",
                                marginBottom: spacing.lg,
                            }, children: "Partage ce code d'invitation avec tes amis :" }), _jsx(GlassCard, { style: {
                                alignItems: "center",
                                paddingVertical: spacing.lg,
                                marginBottom: spacing.md,
                            }, children: _jsx(KText, { variant: "h1", style: {
                                    fontSize: 32,
                                    letterSpacing: 4,
                                    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
                                }, children: inviteCode.toUpperCase() }) }), _jsx(KButton, { title: copied ? "Copie !" : "Copier le code", onPress: handleCopy, variant: "glass", style: { marginBottom: spacing.md } }), _jsx(KButton, { title: "Voir le groupe", onPress: () => onGroupCreated?.(createdGroupId) })] }) }) }));
    }
    return (_jsx(AuroraScreenWrapper, { children: _jsxs(View, { style: {
                flex: 1,
                padding: spacing.lg,
                justifyContent: "center",
            }, children: [_jsx(KText, { variant: "h1", style: { marginBottom: spacing.lg }, children: "Creer un groupe" }), _jsxs(GlassCard, { style: { marginBottom: spacing.lg }, children: [_jsx(KInput, { label: "Nom du groupe", value: name, onChangeText: setName, placeholder: "Ex: La bande du lycee", maxLength: GROUP_NAME_MAX_LENGTH, containerStyle: { marginBottom: spacing.md } }), _jsx(KInput, { label: "Nombre max de membres (2-12)", value: maxMembers, onChangeText: setMaxMembers, keyboardType: "numeric" })] }), _jsx(ErrorBanner, { message: error }), _jsx(KButton, { title: "Creer le groupe", onPress: handleCreate, loading: loading })] }) }));
}
