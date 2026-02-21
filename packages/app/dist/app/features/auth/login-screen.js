"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import { AuroraScreenWrapper, KText, KInput, KButton, GlassCard, ErrorBanner, GoogleLogo, colors, spacing, } from "@repo/ui";
export function LoginScreen({ onNavigateSignup }) {
    const { signIn, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const handleLogin = async () => {
        if (!email || !password) {
            setError("Remplis tous les champs");
            return;
        }
        setError(null);
        setLoading(true);
        const { error: err } = await signIn(email.trim(), password);
        setLoading(false);
        if (err)
            setError(err);
    };
    const handleGoogleLogin = async () => {
        setError(null);
        setGoogleLoading(true);
        const { error: err } = await signInWithGoogle();
        setGoogleLoading(false);
        if (err)
            setError(err);
    };
    return (_jsx(AuroraScreenWrapper, { children: _jsxs(ScrollView, { contentContainerStyle: {
                flexGrow: 1,
                justifyContent: "center",
                padding: spacing.lg,
            }, keyboardShouldPersistTaps: "handled", children: [_jsx(KText, { variant: "questionLarge", style: {
                        textAlign: "center",
                        marginBottom: spacing.xs,
                        fontSize: 38,
                    }, children: "Kiseki" }), _jsx(KText, { variant: "bodySmall", color: colors.textSecondary, style: { textAlign: "center", marginBottom: spacing.xl }, children: "Qui c'est qui ?" }), _jsxs(GlassCard, { style: { marginBottom: spacing.lg }, children: [_jsx(KInput, { placeholder: "Email", value: email, onChangeText: setEmail, autoCapitalize: "none", keyboardType: "email-address", containerStyle: { marginBottom: spacing.sm } }), _jsx(KInput, { placeholder: "Mot de passe", value: password, onChangeText: setPassword, secureTextEntry: true, containerStyle: { marginBottom: spacing.md } }), _jsx(ErrorBanner, { message: error }), _jsx(KButton, { title: "Se connecter", onPress: handleLogin, loading: loading, style: { marginBottom: spacing.md } }), _jsxs(View, { style: {
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: spacing.md,
                            }, children: [_jsx(View, { style: { flex: 1, height: 1, backgroundColor: colors.glass.border } }), _jsx(KText, { variant: "caption", color: colors.textMuted, style: { marginHorizontal: spacing.sm }, children: "ou" }), _jsx(View, { style: { flex: 1, height: 1, backgroundColor: colors.glass.border } })] }), _jsx(KButton, { title: "Continuer avec Google", onPress: handleGoogleLogin, variant: "glass", loading: googleLoading, leftIcon: _jsx(GoogleLogo, { size: 20, source: require("../../../../apps/assets/logo-google.png") }) })] }), _jsx(TouchableOpacity, { onPress: onNavigateSignup, children: _jsxs(KText, { variant: "bodySmall", color: colors.textSecondary, style: { textAlign: "center" }, children: ["Pas encore de compte ?", " ", _jsx(KText, { variant: "bodySmall", color: colors.violet.primary, style: { fontWeight: "600" }, children: "S'inscrire" })] }) })] }) }));
}
