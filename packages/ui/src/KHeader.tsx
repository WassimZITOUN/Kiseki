"use client";

import React from "react";
import { View, TouchableOpacity, Platform, StatusBar, StyleSheet } from "react-native";
import { colors, spacing, radii } from "./tokens";
import { KText } from "./KText";
import { getWebGlassStyle } from "./webGlass";

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
          overflow: Platform.OS === "android" ? "hidden" : undefined,
          backgroundColor: Platform.OS === "android" ? "transparent" : undefined,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 15,
          elevation: Platform.OS === "android" ? 0 : 8,
        }}
      >
        {/* Blur layer (native only) */}
        {!isWeb && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radii.lg, overflow: "hidden", backgroundColor: "transparent" },
            ]}
          >
            <BlurView
              intensity={30}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              clipBorderRadius={radii.lg}
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
                    ...getWebGlassStyle({
                      blur: 8,
                      tintAlpha: 0.07,
                      borderAlpha: 0.3,
                      shadow: "0 12px 34px rgba(0,0,0,0.22)",
                    }),
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
                  overflow: Platform.OS === "android" ? "hidden" : undefined,
          backgroundColor: Platform.OS === "android" ? "transparent" : undefined,
                  ...(isWeb
                    ? {}
                    : {
                        shadowColor: colors.shadow.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: Platform.OS === "android" ? 0 : 4,
                      }),
                }}
              >
                {/* Blur layer */}
                {!isWeb && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { borderRadius: 22, overflow: "hidden", backgroundColor: "transparent" },
                    ]}
                  >
                    <BlurView
                      intensity={25}
                      tint="dark"
                      experimentalBlurMethod="dimezisBlurView"
                      clipBorderRadius={22}
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
                            ...getWebGlassStyle({
                              blur: 7,
                              tintAlpha: 0.08,
                              borderAlpha: 0.34,
                              shadow: "0 8px 22px rgba(0,0,0,0.22)",
                            }),
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
