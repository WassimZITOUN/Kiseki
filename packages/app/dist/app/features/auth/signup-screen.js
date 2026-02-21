"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import { AuroraScreenWrapper, KText, KInput, KButton, GlassCard, ErrorBanner, GoogleLogo, colors, spacing, } from "@repo/ui";
export function SignupScreen({ onNavigateLogin, onSignupSuccess }) {
    const { signUp, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const handleGoogleSignup = async () => {
        setError(null);
        setGoogleLoading(true);
        const { error: err } = await signInWithGoogle();
        setGoogleLoading(false);
        if (err)
            setError(err);
    };
    const handleSignup = async () => {
        if (!email || !password || !username || !displayName) {
            setError("Remplis tous les champs");
            return;
        }
        if (password.length < 6) {
            setError("Le mot de passe doit faire au moins 6 caracteres");
            return;
        }
        setError(null);
        setLoading(true);
        const { error: err } = await signUp(email.trim(), password, username.trim().toLowerCase(), displayName.trim());
        setLoading(false);
        if (err) {
            setError(err);
        }
        else {
            onSignupSuccess();
        }
    };
    return (_jsx(AuroraScreenWrapper, { children: _jsxs(ScrollView, { contentContainerStyle: {
                flexGrow: 1,
                justifyContent: "center",
                padding: spacing.lg,
            }, keyboardShouldPersistTaps: "handled", children: [_jsx(KText, { variant: "h1", style: { textAlign: "center", marginBottom: spacing.xs }, children: "Creer un compte" }), _jsx(KText, { variant: "bodySmall", color: colors.textSecondary, style: { textAlign: "center", marginBottom: spacing.xl }, children: "Rejoins Kiseki et vote avec tes amis" }), _jsxs(GlassCard, { style: { marginBottom: spacing.lg }, children: [_jsx(KInput, { placeholder: "Email", value: email, onChangeText: setEmail, autoCapitalize: "none", keyboardType: "email-address", containerStyle: { marginBottom: spacing.sm } }), _jsx(KInput, { placeholder: "Mot de passe (6 caracteres min.)", value: password, onChangeText: setPassword, secureTextEntry: true, containerStyle: { marginBottom: spacing.sm } }), _jsx(KInput, { placeholder: "Nom d'utilisateur (unique)", value: username, onChangeText: setUsername, autoCapitalize: "none", containerStyle: { marginBottom: spacing.sm } }), _jsx(KInput, { placeholder: "Nom affiche", value: displayName, onChangeText: setDisplayName, containerStyle: { marginBottom: spacing.md } }), _jsx(ErrorBanner, { message: error }), _jsx(KButton, { title: "S'inscrire", onPress: handleSignup, loading: loading, style: { marginBottom: spacing.md } }), _jsxs(View, { style: {
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: spacing.md,
                            }, children: [_jsx(View, { style: { flex: 1, height: 1, backgroundColor: colors.glass.border } }), _jsx(KText, { variant: "caption", color: colors.textMuted, style: { marginHorizontal: spacing.sm }, children: "ou" }), _jsx(View, { style: { flex: 1, height: 1, backgroundColor: colors.glass.border } })] }), _jsx(KButton, { title: "Continuer avec Google", onPress: handleGoogleSignup, variant: "glass", loading: googleLoading, leftIcon: _jsx(GoogleLogo, { size: 20, source: require("../../../../apps/assets/logo-google.png") }) })] }), _jsx(TouchableOpacity, { onPress: onNavigateLogin, children: _jsxs(KText, { variant: "bodySmall", color: colors.textSecondary, style: { textAlign: "center" }, children: ["Deja un compte ?", " ", _jsx(KText, { variant: "bodySmall", color: colors.violet.primary, style: { fontWeight: "600" }, children: "Se connecter" })] }) })] }) }));
}
