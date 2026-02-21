"use client";
import React, { useState } from "react";
import { View, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import { getSupabase } from "../../utils/supabase";
import { pickImage, uploadAvatar } from "../../utils/avatar";
import { AuroraScreenWrapper, KText, KInput, KButton, KAvatar, GlassCard, ErrorBanner, colors, spacing, } from "@repo/ui";
export function EditProfileScreen({ onComplete, onCancel }) {
    const { user, profile, refreshProfile } = useAuth();
    const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
    const [username, setUsername] = useState(profile?.username ?? "");
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const currentAvatarUrl = profile?.avatar_url;
    const handlePickImage = async () => {
        const uri = await pickImage();
        if (uri)
            setImageUri(uri);
    };
    const handleSave = async () => {
        if (!user)
            return;
        if (!username.trim()) {
            setError("Le nom d'utilisateur est obligatoire");
            return;
        }
        if (!displayName.trim()) {
            setError("Le nom affiche est obligatoire");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const supabase = getSupabase();
            let avatarUrl = currentAvatarUrl;
            if (imageUri) {
                const publicUrl = await uploadAvatar(user.id, imageUri);
                if (publicUrl) {
                    avatarUrl = publicUrl;
                }
                else {
                    Alert.alert("Erreur", "L'upload de la photo a echoue.");
                    setLoading(false);
                    return;
                }
            }
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                display_name: displayName.trim(),
                username: username.trim().toLowerCase(),
                ...(avatarUrl !== currentAvatarUrl
                    ? { avatar_url: avatarUrl }
                    : {}),
            })
                .eq("id", user.id);
            if (updateError) {
                if (updateError.message.includes("unique") ||
                    updateError.code === "23505") {
                    setError("Ce nom d'utilisateur est deja pris");
                }
                else {
                    setError(updateError.message);
                }
                setLoading(false);
                return;
            }
            await refreshProfile();
            onComplete();
        }
        catch (e) {
            setError(e.message ?? "Une erreur est survenue");
        }
        finally {
            setLoading(false);
        }
    };
    const displayedAvatar = imageUri ?? currentAvatarUrl;
    return (<AuroraScreenWrapper>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={handlePickImage} style={{
            alignItems: "center",
            marginTop: spacing.lg,
            marginBottom: spacing.xl,
        }}>
          {displayedAvatar ? (<View style={{
                borderRadius: 62,
                borderWidth: 2,
                borderColor: colors.glass.border,
                padding: 2,
            }}>
              <Image source={{ uri: displayedAvatar }} style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.violet[50],
            }}/>
            </View>) : (<KAvatar name={displayName || username} size={120}/>)}
          <KText variant="bodySmall" color={colors.violet.primary} style={{ marginTop: spacing.sm }}>
            Changer la photo
          </KText>
        </TouchableOpacity>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <KInput label="Nom affiche" value={displayName} onChangeText={setDisplayName} placeholder="Nom affiche" containerStyle={{ marginBottom: spacing.md }}/>

          <KInput label="Nom d'utilisateur" value={username} onChangeText={setUsername} placeholder="Nom d'utilisateur" autoCapitalize="none"/>
        </GlassCard>

        <ErrorBanner message={error}/>

        <KButton title="Enregistrer" onPress={handleSave} loading={loading} style={{ marginBottom: spacing.sm }}/>

        <KButton title="Annuler" onPress={onCancel} variant="ghost"/>
      </ScrollView>
    </AuroraScreenWrapper>);
}
