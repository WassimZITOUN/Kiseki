"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { View } from "react-native";
import { getSupabase } from "../../utils/supabase";
import { services } from "@my-app/core";
import { AuroraScreenWrapper, KText, KInput, KButton, GlassCard, ErrorBanner, spacing, } from "@repo/ui";
const { createGroupsService } = services;
export function JoinGroupScreen({ onGroupJoined, onBack }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleJoin = async () => {
        if (code.trim().length !== 8) {
            setError("Le code d'invitation doit contenir 8 caracteres");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const service = createGroupsService(getSupabase());
            const groupId = await service.joinGroupByCode(code.trim());
            onGroupJoined?.(groupId);
        }
        catch (err) {
            const msg = err?.message ?? "";
            if (msg.includes("invalid") || msg.includes("invalide")) {
                setError("Code d'invitation invalide");
            }
            else if (msg.includes("plein") || msg.includes("full")) {
                setError("Ce groupe est plein");
            }
            else if (msg.includes("already") || msg.includes("deja")) {
                setError("Tu fais deja partie de ce groupe");
            }
            else {
                setError(msg || "Erreur lors de la tentative de rejoindre le groupe");
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(AuroraScreenWrapper, { children: _jsxs(View, { style: {
                flex: 1,
                padding: spacing.lg,
                justifyContent: "center",
            }, children: [_jsx(KText, { variant: "h1", style: { marginBottom: spacing.lg }, children: "Rejoindre un groupe" }), _jsx(GlassCard, { style: { marginBottom: spacing.lg }, children: _jsx(KInput, { label: "Code d'invitation", value: code, onChangeText: (t) => setCode(t.toUpperCase()), placeholder: "Ex: A1B2C3D4", maxLength: 8, autoCapitalize: "characters", style: {
                            fontSize: 20,
                            letterSpacing: 4,
                            textAlign: "center",
                        } }) }), _jsx(ErrorBanner, { message: error }), _jsx(KButton, { title: "Rejoindre", onPress: handleJoin, loading: loading })] }) }));
}
