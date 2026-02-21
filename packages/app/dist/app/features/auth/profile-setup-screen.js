"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { TouchableOpacity, Image, View, Alert } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import { getSupabase } from "../../utils/supabase";
import { pickImage, uploadAvatar } from "../../utils/avatar";
import { AuroraScreenWrapper, KText, KButton, GlassCard, colors, spacing, } from "@repo/ui";
export function ProfileSetupScreen({ onComplete }) {
    const { user, refreshProfile } = useAuth();
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const handlePickImage = async () => {
        const uri = await pickImage();
        if (uri)
            setImageUri(uri);
    };
    const handleSave = async () => {
        if (!user || !imageUri)
            return;
        setLoading(true);
        try {
            const publicUrl = await uploadAvatar(user.id, imageUri);
            if (publicUrl) {
                const supabase = getSupabase();
                await supabase
                    .from("profiles")
                    .update({ avatar_url: publicUrl })
                    .eq("id", user.id);
                await refreshProfile();
                onComplete();
            }
            else {
                Alert.alert("Erreur", "L'upload a echoue. Verifie que le bucket 'avatars' existe dans Supabase Storage.");
            }
        }
        catch (e) {
            Alert.alert("Erreur", e.message ?? "Une erreur est survenue");
        }
        finally {
            setLoading(false);
        }
    };
    const handleSkip = () => {
        onComplete();
    };
    return (_jsx(AuroraScreenWrapper, { children: _jsxs(View, { style: {
                flex: 1,
                justifyContent: "center",
                padding: spacing.lg,
            }, children: [_jsx(KText, { variant: "h1", style: { textAlign: "center", marginBottom: spacing.xs }, children: "Photo de profil" }), _jsx(KText, { variant: "bodySmall", color: colors.textSecondary, style: { textAlign: "center", marginBottom: spacing.xl }, children: "Optionnel - tu peux ajouter une photo plus tard" }), _jsx(GlassCard, { style: {
                        alignItems: "center",
                        paddingVertical: spacing.xl,
                        marginBottom: spacing.lg,
                    }, children: _jsxs(TouchableOpacity, { onPress: handlePickImage, style: { alignItems: "center" }, children: [imageUri ? (_jsx(Image, { source: { uri: imageUri }, style: {
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: colors.violet[50],
                                } })) : (_jsx(View, { style: {
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: colors.violet[100],
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 2,
                                    borderColor: colors.glass.border,
                                }, children: _jsx(KText, { variant: "h1", color: colors.violet.primary, children: "+" }) })), _jsx(KText, { variant: "bodySmall", color: colors.textSecondary, style: { marginTop: spacing.sm }, children: imageUri ? "Changer la photo" : "Choisir une photo" })] }) }), imageUri && (_jsx(KButton, { title: "Enregistrer", onPress: handleSave, loading: loading, style: { marginBottom: spacing.sm } })), _jsx(KButton, { title: "Passer", onPress: handleSkip, variant: "ghost" })] }) }));
}
