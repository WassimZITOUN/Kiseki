"use client";

import React from "react";
import { View, ScrollView } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import {
  AuroraScreenWrapper,
  KText,
  KButton,
  KAvatar,
  GlassCard,
  colors,
  spacing,
} from "@repo/ui";

type Props = {
  onNavigateEdit: () => void;
};

export function ProfileScreen({ onNavigateEdit }: Props) {
  const { user, profile, signOut } = useAuth();

  return (
    <AuroraScreenWrapper>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.lg }}
      >
        <View
          style={{
            alignItems: "center",
            marginTop: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <KAvatar
            uri={profile?.avatar_url}
            name={profile?.display_name ?? profile?.username}
            size={120}
          />
        </View>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <View style={{ marginBottom: spacing.md }}>
            <KText
              variant="caption"
              color={colors.textMuted}
              style={{ marginBottom: spacing.xs }}
            >
              Nom affiche
            </KText>
            <KText variant="h3">{profile?.display_name ?? "-"}</KText>
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <KText
              variant="caption"
              color={colors.textMuted}
              style={{ marginBottom: spacing.xs }}
            >
              Nom d'utilisateur
            </KText>
            <KText variant="body" color={colors.textSecondary}>
              @{profile?.username ?? "-"}
            </KText>
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <KText
              variant="caption"
              color={colors.textMuted}
              style={{ marginBottom: spacing.xs }}
            >
              Email
            </KText>
            <KText variant="body" color={colors.textSecondary}>
              {user?.email ?? "-"}
            </KText>
          </View>

          <View>
            <KText
              variant="caption"
              color={colors.textMuted}
              style={{ marginBottom: spacing.xs }}
            >
              Membre depuis
            </KText>
            <KText variant="body" color={colors.textSecondary}>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </KText>
          </View>
        </GlassCard>

        <KButton
          title="Modifier le profil"
          onPress={onNavigateEdit}
          style={{ marginBottom: spacing.sm }}
        />

        <KButton
          title="Se deconnecter"
          onPress={signOut}
          variant="glass"
        />
      </ScrollView>
    </AuroraScreenWrapper>
  );
}
