"use client";

import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getSupabase } from "../../../utils/supabase";
import { services } from "@my-app/core";
import {
  GlassModal,
  KText,
  KButton,
  ErrorBanner,
  colors,
  spacing,
} from "@repo/ui";

const { createSubmissionsService } = services;

type Props = {
  groupId: string;
  dailyQuestionId: string;
  isAdmin: boolean;
  disabled: boolean;
  onReplaced: () => void;
};

export function AdminModerateButton({
  groupId,
  dailyQuestionId,
  isAdmin,
  disabled,
  onReplaced,
}: Props) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  const isWeb = Platform.OS === "web";
  const BlurView = !isWeb ? require("expo-blur").BlurView : null;

  const handleReplace = async () => {
    setReplacing(true);
    setError(null);
    try {
      const svc = createSubmissionsService(getSupabase());
      await svc.adminReplaceQuestion(groupId, dailyQuestionId);
      setConfirmVisible(false);
      onReplaced();
    } catch (err: any) {
      const msg = err?.message ?? "Erreur";
      if (msg.includes("Limite atteinte")) {
        setError("Limite atteinte : 1 remplacement par jour");
      } else {
        setError(msg);
      }
    } finally {
      setReplacing(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setConfirmVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: 20,
          overflow: "hidden",
          opacity: disabled ? 0.4 : 1,
          marginTop: spacing.sm,
        }}
      >
        {/* Blur background */}
        {!isWeb && (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: "hidden" }]}>
            <BlurView
              intensity={25}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
              backgroundColor: "rgba(255,255,255,0.05)",
              ...(isWeb
                ? {
                    // @ts-ignore web-only
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }
                : {}),
            },
          ]}
        />
        <Feather
          name="refresh-cw"
          size={14}
          color={disabled ? colors.textMuted : colors.textSecondary}
          style={{ marginRight: spacing.xs }}
        />
        <KText
          variant="caption"
          color={disabled ? colors.textMuted : colors.textSecondary}
        >
          Remplacer
        </KText>
      </TouchableOpacity>

      <GlassModal
        visible={confirmVisible}
        onClose={() => {
          if (!replacing) {
            setConfirmVisible(false);
            setError(null);
          }
        }}
      >
        <KText
          variant="h3"
          style={{ textAlign: "center", marginBottom: spacing.md }}
        >
          Remplacer la question ?
        </KText>
        <KText
          variant="bodySmall"
          color={colors.textSecondary}
          style={{ textAlign: "center", marginBottom: spacing.lg }}
        >
          La question actuelle sera remplacee par une nouvelle de la banque. Tu
          ne peux le faire qu'une seule fois par jour.
        </KText>

        <ErrorBanner message={error} />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <KButton
            title="Annuler"
            onPress={() => {
              setConfirmVisible(false);
              setError(null);
            }}
            variant="glass"
            disabled={replacing}
            style={{ minWidth: 110, marginRight: spacing.sm }}
          />
          <KButton
            title="Remplacer"
            onPress={handleReplace}
            loading={replacing}
            disabled={replacing}
            style={{ minWidth: 110 }}
          />
        </View>
      </GlassModal>
    </>
  );
}
