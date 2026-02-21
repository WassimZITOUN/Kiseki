"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { View, ScrollView, Platform } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import { AuroraScreenWrapper, KText, KButton, KAvatar, GlassCard, colors, spacing, radii, } from "@repo/ui";
export function ProfileScreen({ onNavigateEdit }) {
    const isWeb = Platform.OS === "web";
    const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
    const { user, profile, signOut } = useAuth();
    React.useEffect(() => {
        if (!isWeb || typeof document === "undefined")
            return;
        const theme = document.documentElement.dataset.theme;
        setDarkModeEnabled(theme === "dark");
    }, [isWeb]);
    const toggleDarkMode = () => {
        if (!isWeb || typeof window === "undefined")
            return;
        const nextTheme = darkModeEnabled ? "light" : "dark";
        document.documentElement.dataset.theme = nextTheme;
        window.localStorage.setItem("kiseki-web-theme", nextTheme);
        setDarkModeEnabled(nextTheme === "dark");
    };
    return (_jsx(AuroraScreenWrapper, { children: _jsxs(ScrollView, { contentContainerStyle: { flexGrow: 1, padding: spacing.lg }, children: [_jsxs(GlassCard, { style: {
                        borderRadius: radii.xl,
                        alignItems: "center",
                        marginTop: spacing.lg,
                        marginBottom: spacing.md,
                    }, children: _jsx(KAvatar, { uri: profile?.avatar_url, name: profile?.display_name ?? profile?.username, size: 120 }) }), _jsxs(GlassCard, { style: { marginBottom: spacing.md }, children: [_jsxs(View, { style: { marginBottom: spacing.md }, children: [_jsx(KText, { variant: "caption", color: colors.textMuted, style: { marginBottom: spacing.xs }, children: "Nom affiche" }), _jsx(KText, { variant: "h3", children: profile?.display_name ?? "-" })] }), _jsxs(View, { style: { marginBottom: spacing.md }, children: [_jsx(KText, { variant: "caption", color: colors.textMuted, style: { marginBottom: spacing.xs }, children: "Nom d'utilisateur" }), _jsxs(KText, { variant: "body", color: colors.textSecondary, children: ["@", profile?.username ?? "-"] })] }), _jsxs(View, { style: { marginBottom: spacing.md }, children: [_jsx(KText, { variant: "caption", color: colors.textMuted, style: { marginBottom: spacing.xs }, children: "Email" }), _jsx(KText, { variant: "body", color: colors.textSecondary, children: user?.email ?? "-" })] }), _jsxs(View, { children: [_jsx(KText, { variant: "caption", color: colors.textMuted, style: { marginBottom: spacing.xs }, children: "Membre depuis" }), _jsx(KText, { variant: "body", color: colors.textSecondary, children: profile?.created_at
                                        ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })
                                        : "-" })] })] }), isWeb && (_jsxs(GlassCard, { style: { marginBottom: spacing.md, borderRadius: radii.xl }, children: [_jsx(KText, { variant: "h3", style: { marginBottom: spacing.sm }, children: "Apparence" }), _jsx(KButton, { title: darkModeEnabled ? "Desactiver le dark mode" : "Activer le dark mode", onPress: toggleDarkMode, variant: "glass" })] })), _jsxs(GlassCard, { style: {
                        borderRadius: radii.xl,
                    }, children: [_jsx(KButton, { title: "Modifier le profil", onPress: onNavigateEdit, style: { marginBottom: spacing.sm } }), _jsx(KButton, { title: "Se deconnecter", onPress: signOut, variant: "glass" })] })] }) }));
}
