"use client";

import React from "react";
import { View, TouchableOpacity, Platform, StatusBar } from "react-native";
import { colors, spacing } from "./tokens";
import { KText } from "./KText";
import { GlassCard } from "./GlassCard";

type Props = {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
};

export function KHeader({ title, onBack, rightAction }: Props) {
  const statusBarHeight =
    Platform.OS === "android"
      ? StatusBar.currentHeight ?? 0
      : Platform.OS === "ios"
        ? 50
        : 0;

  return (
    <View
      style={{
        paddingTop: statusBarHeight + spacing.sm,
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <GlassCard
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        }}
      >
        <View style={{ width: 44 }}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderWidth: 1,
                borderColor: colors.glass.border,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.shadow.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <KText style={{ fontSize: 20 }}>←</KText>
            </TouchableOpacity>
          )}
        </View>
        <KText variant="h3" style={{ flex: 1, textAlign: "center" }}>
          {title}
        </KText>
        <View style={{ width: 44, alignItems: "flex-end" }}>
          {rightAction}
        </View>
      </GlassCard>
    </View>
  );
}
