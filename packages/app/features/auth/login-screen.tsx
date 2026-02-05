"use client";

import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import {
  AuroraScreenWrapper,
  KText,
  KInput,
  KButton,
  GlassCard,
  ErrorBanner,
  colors,
  spacing,
} from "@repo/ui";

type Props = {
  onNavigateSignup: () => void;
};

export function LoginScreen({ onNavigateSignup }: Props) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    if (err) setError(err);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error: err } = await signInWithGoogle();
    setGoogleLoading(false);
    if (err) setError(err);
  };

  return (
    <AuroraScreenWrapper>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <KText
          variant="questionLarge"
          style={{
            textAlign: "center",
            marginBottom: spacing.xs,
            fontSize: 38,
          }}
        >
          Kiseki
        </KText>
        <KText
          variant="bodySmall"
          color={colors.textSecondary}
          style={{ textAlign: "center", marginBottom: spacing.xl }}
        >
          Qui c'est qui ?
        </KText>

        <GlassCard style={{ marginBottom: spacing.lg }}>
          <KInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            containerStyle={{ marginBottom: spacing.sm }}
          />

          <KInput
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            containerStyle={{ marginBottom: spacing.md }}
          />

          <ErrorBanner message={error} />

          <KButton
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            style={{ marginBottom: spacing.md }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <View
              style={{ flex: 1, height: 1, backgroundColor: colors.glass.border }}
            />
            <KText
              variant="caption"
              color={colors.textMuted}
              style={{ marginHorizontal: spacing.sm }}
            >
              ou
            </KText>
            <View
              style={{ flex: 1, height: 1, backgroundColor: colors.glass.border }}
            />
          </View>

          <KButton
            title="Continuer avec Google"
            onPress={handleGoogleLogin}
            variant="glass"
            loading={googleLoading}
          />
        </GlassCard>

        <TouchableOpacity onPress={onNavigateSignup}>
          <KText
            variant="bodySmall"
            color={colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Pas encore de compte ?{" "}
            <KText variant="bodySmall" color={colors.violet.primary} style={{ fontWeight: "600" }}>
              S'inscrire
            </KText>
          </KText>
        </TouchableOpacity>
      </ScrollView>
    </AuroraScreenWrapper>
  );
}
