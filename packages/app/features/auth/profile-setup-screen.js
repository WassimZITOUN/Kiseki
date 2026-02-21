"use client";
import React, { useState } from "react";
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
    return (<AuroraScreenWrapper>
      <View style={{
            flex: 1,
            justifyContent: "center",
            padding: spacing.lg,
        }}>
        <KText variant="h1" style={{ textAlign: "center", marginBottom: spacing.xs }}>
          Photo de profil
        </KText>
        <KText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: "center", marginBottom: spacing.xl }}>
          Optionnel - tu peux ajouter une photo plus tard
        </KText>

        <GlassCard style={{
            alignItems: "center",
            paddingVertical: spacing.xl,
            marginBottom: spacing.lg,
        }}>
          <TouchableOpacity onPress={handlePickImage} style={{ alignItems: "center" }}>
            {imageUri ? (<Image source={{ uri: imageUri }} style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.violet[50],
            }}/>) : (<View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.violet[100],
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.glass.border,
            }}>
                <KText variant="h1" color={colors.violet.primary}>
                  +
                </KText>
              </View>)}
            <KText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
              {imageUri ? "Changer la photo" : "Choisir une photo"}
            </KText>
          </TouchableOpacity>
        </GlassCard>

        {imageUri && (<KButton title="Enregistrer" onPress={handleSave} loading={loading} style={{ marginBottom: spacing.sm }}/>)}

        <KButton title="Passer" onPress={handleSkip} variant="ghost"/>
      </View>
    </AuroraScreenWrapper>);
}
