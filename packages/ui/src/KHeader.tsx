"use client";

import React from "react";
import { View, TouchableOpacity, Platform, StatusBar, StyleSheet } from "react-native";
import { colors, spacing, radii } from "./tokens";
import { KText } from "./KText";

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

  const isWeb = Platform.OS === "web";

  // Inline glass header — no GlassCard to avoid padding conflicts
  const BlurView = !isWeb ? require("expo-blur").BlurView : null;

  return (
    <View
      style={{
        paddingTop: statusBarHeight + spacing.sm,
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <View
        style={{
          borderRadius: radii.lg,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 15,
          elevation: 8,
        }}
      >
        {/* Blur layer (native only) */}
        {!isWeb && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radii.lg, overflow: "hidden" },
            ]}
          >
            <BlurView
              intensity={30}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}

        {/* Border layer */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.glass.border,
              backgroundColor: colors.glass.background,
              ...(isWeb
                ? {
                    // @ts-ignore web-only
                    backdropFilter: "blur(15px)",
                    WebkitBackdropFilter: "blur(15px)",
                  }
                : {}),
            },
          ]}
        />

        {/* Content row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
          }}
        >
          {/* Left slot — back button with full glass effect */}
          <View style={{ width: 44 }}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.8}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  shadowColor: colors.shadow.color,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {/* Blur layer */}
                {!isWeb && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { borderRadius: 22, overflow: "hidden" },
                    ]}
                  >
                    <BlurView
                      intensity={25}
                      tint="light"
                      experimentalBlurMethod="dimezisBlurView"
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                )}
                {/* Border + bg layer */}
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: colors.glass.border,
                      backgroundColor: colors.glass.background,
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
                {/* Icon */}
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <KText style={{ fontSize: 20 }}>←</KText>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Center — title */}
          <KText variant="h3" style={{ flex: 1, textAlign: "center" }}>
            {title}
          </KText>

          {/* Right slot — action */}
          <View style={{ width: 44, alignItems: "flex-end", justifyContent: "center" }}>
            {rightAction}
          </View>
        </View>
      </View>
    </View>
  );
}
