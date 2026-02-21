"use client";

import { useState } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { getSupabase } from "../../utils/supabase";
import { services, validators } from "@my-app/core";
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

const { createGroupsService } = services;
const { GROUP_NAME_MAX_LENGTH } = validators;

type Props = {
  onGroupCreated?: (groupId: string) => void;
  onBack?: () => void;
};

export function CreateGroupScreen({ onGroupCreated, onBack }: Props) {
  const isWeb = Platform.OS === "web";
  const contentWidth = isWeb
    ? ({ width: "100%", maxWidth: 560, alignSelf: "center" } as const)
    : null;

  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Le nom du groupe est obligatoire");
      return;
    }
    if (trimmedName.length > GROUP_NAME_MAX_LENGTH) {
      setError(
        `Le nom du groupe ne doit pas depasser ${GROUP_NAME_MAX_LENGTH} caracteres`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = createGroupsService(getSupabase());
      const group = await service.createGroup(trimmedName, {
        maxMembers: parseInt(maxMembers, 10) || 20,
      });
      setInviteCode(group.invite_code);
      setCreatedGroupId(group.id);
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de la creation du groupe");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(inviteCode);
      } else {
        const Clipboard = require("expo-clipboard");
        await Clipboard.setStringAsync(inviteCode);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (inviteCode && createdGroupId) {
    return (
      <AuroraScreenWrapper>
        <View
          style={[
            {
              flex: 1,
              justifyContent: "center",
              padding: spacing.lg,
            },
            contentWidth,
          ]}
        >
          <Animated.View entering={FadeIn.duration(400)}>
            <KText
              variant="h1"
              style={{
                textAlign: "center",
                marginBottom: spacing.md,
              }}
            >
              Groupe cree !
            </KText>

            <KText
              variant="bodySmall"
              color={colors.textSecondary}
              style={{
                textAlign: "center",
                marginBottom: spacing.lg,
              }}
            >
              Partage ce code d'invitation avec tes amis :
            </KText>

            <GlassCard
              style={{
                alignItems: "center",
                paddingVertical: spacing.lg,
                marginBottom: spacing.md,
              }}
            >
              <KText
                variant="h1"
                style={{
                  fontSize: 32,
                  letterSpacing: 4,
                  fontFamily:
                    Platform.OS === "web" ? "monospace" : undefined,
                }}
              >
                {inviteCode.toUpperCase()}
              </KText>
            </GlassCard>

            <KButton
              title={copied ? "Copie !" : "Copier le code"}
              onPress={handleCopy}
              variant="glass"
              style={{ marginBottom: spacing.md }}
            />

            <KButton
              title="Voir le groupe"
              onPress={() => onGroupCreated?.(createdGroupId)}
            />
          </Animated.View>
        </View>
      </AuroraScreenWrapper>
    );
  }

  return (
    <AuroraScreenWrapper>
      <View
        style={[
          {
            flex: 1,
            padding: spacing.lg,
            justifyContent: "center",
          },
          contentWidth,
        ]}
      >
        <KText
          variant="h1"
          style={{ marginBottom: spacing.lg }}
        >
          Creer un groupe
        </KText>

        <GlassCard style={{ marginBottom: spacing.lg }}>
          <KInput
            label="Nom du groupe"
            value={name}
            onChangeText={setName}
            placeholder="Ex: La team Nasdas"
            maxLength={GROUP_NAME_MAX_LENGTH}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <KInput
            label="Nombre max de membres (2-12)"
            value={maxMembers}
            onChangeText={setMaxMembers}
            keyboardType="numeric"
          />
        </GlassCard>

        <ErrorBanner message={error} />

        <KButton
          title="Creer le groupe"
          onPress={handleCreate}
          loading={loading}
        />
      </View>
    </AuroraScreenWrapper>
  );
}
