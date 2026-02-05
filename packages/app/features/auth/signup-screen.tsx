"use client";

import React, { useState } from "react";
import { TouchableOpacity, ScrollView } from "react-native";
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
  onNavigateLogin: () => void;
  onSignupSuccess: () => void;
};

export function SignupScreen({ onNavigateLogin, onSignupSuccess }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    const { error: err } = await signUp(
      email.trim(),
      password,
      username.trim().toLowerCase(),
      displayName.trim()
    );
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      onSignupSuccess();
    }
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
          variant="h1"
          style={{ textAlign: "center", marginBottom: spacing.xs }}
        >
          Creer un compte
        </KText>
        <KText
          variant="bodySmall"
          color={colors.textSecondary}
          style={{ textAlign: "center", marginBottom: spacing.xl }}
        >
          Rejoins Kiseki et vote avec tes amis
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
            placeholder="Mot de passe (6 caracteres min.)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            containerStyle={{ marginBottom: spacing.sm }}
          />

          <KInput
            placeholder="Nom d'utilisateur (unique)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            containerStyle={{ marginBottom: spacing.sm }}
          />

          <KInput
            placeholder="Nom affiche"
            value={displayName}
            onChangeText={setDisplayName}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <ErrorBanner message={error} />

          <KButton
            title="S'inscrire"
            onPress={handleSignup}
            loading={loading}
          />
        </GlassCard>

        <TouchableOpacity onPress={onNavigateLogin}>
          <KText
            variant="bodySmall"
            color={colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Deja un compte ?{" "}
            <KText variant="bodySmall" color={colors.violet.primary} style={{ fontWeight: "600" }}>
              Se connecter
            </KText>
          </KText>
        </TouchableOpacity>
      </ScrollView>
    </AuroraScreenWrapper>
  );
}
