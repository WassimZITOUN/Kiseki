"use client";

import React from "react";
import { View, ScrollView, Platform } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import {
  AuroraScreenWrapper,
  KText,
  KButton,
  KAvatar,
  GlassCard,
  colors,
  spacing,
  radii,
} from "@repo/ui";

type Props = {
  onNavigateEdit: () => void;
};

export function ProfileScreen({ onNavigateEdit }: Props) {
  const isWeb = Platform.OS === "web";
  const contentWidth = isWeb
    ? ({ width: "100%", maxWidth: 620, alignSelf: "center" } as const)
    : null;
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const { user, profile, signOut } = useAuth();

  React.useEffect(() => {
    if (!isWeb || typeof document === "undefined") return;
    const theme = document.documentElement.dataset.theme;
    setDarkModeEnabled(theme === "dark");
  }, [isWeb]);

  const toggleDarkMode = () => {
    if (!isWeb || typeof window === "undefined") return;
    const nextTheme = darkModeEnabled ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("kiseki-web-theme", nextTheme);
    setDarkModeEnabled(nextTheme === "dark");
  };

  return (
    <AuroraScreenWrapper>
      <ScrollView
        contentContainerStyle={[
          {
            flexGrow: 1,
            padding: spacing.lg,
          },
          contentWidth,
        ]}
      >
        <GlassCard
          style={{
            borderRadius: radii.xl,
            alignItems: "center",
            marginTop: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          <KAvatar
            uri={profile?.avatar_url}
            name={profile?.display_name ?? profile?.username}
            size={120}
          />
        </GlassCard>

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

        {isWeb && (
          <GlassCard style={{ marginBottom: spacing.md, borderRadius: radii.xl }}>
            <KText
              variant="h3"
              style={{ marginBottom: spacing.sm }}
            >
              Apparence
            </KText>
            <KButton
              title={darkModeEnabled ? "Desactiver le dark mode" : "Activer le dark mode"}
              onPress={toggleDarkMode}
              variant="glass"
            />
          </GlassCard>
        )}

        <GlassCard
          style={{
            borderRadius: radii.xl,
          }}
        >
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
        </GlassCard>
      </ScrollView>
    </AuroraScreenWrapper>
  );
}
