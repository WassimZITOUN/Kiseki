"use client";

import React from "react";
import { View, Platform, StyleSheet, type ViewStyle } from "react-native";
import { colors, radii, spacing } from "./tokens";
import { getWebGlassStyle } from "./webGlass";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
};

/**
 * GlassCard — Deep Glass Dark Theme
 *
 * Architecture:
 * 1. Shadow layer (soft depth, no colored glow)
 * 2. Blur layer (expo-blur with experimentalBlurMethod, tint="dark")
 * 3. Refraction border (subtle white edge)
 * 4. Content
 *
 * Dark mode optimized — neutral glass depth
 */
export function GlassCard({ children, style, intensity = 40 }: Props) {
  const flatStyle = StyleSheet.flatten(style);
  const resolvedRadius = (flatStyle?.borderRadius as number) ?? radii.lg;
  const webBlur = Math.min(10, Math.max(6, intensity * 0.25));

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          {
            borderRadius: resolvedRadius,
            padding: spacing.md,
            overflow: "hidden",
            ...getWebGlassStyle({
              blur: webBlur,
              tintAlpha: 0.06,
              borderAlpha: 0.3,
              shadow: "none",
            }),
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  const BlurView = require("expo-blur").BlurView;

  return (
    // Layer 0: Shadow caster — violet glow
    <View
      style={[
        {
          borderRadius: resolvedRadius,
          overflow: Platform.OS === "android" ? "hidden" : undefined,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: Platform.OS === "android" ? 0 : 12,
        },
        style,
      ]}
    >
      {/* Layer 1: Blur (clipped) — dark tint for dark theme */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: resolvedRadius, overflow: "hidden" },
        ]}
      >
        <BlurView
          intensity={intensity}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          clipBorderRadius={resolvedRadius}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Layer 2: Refraction border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: resolvedRadius,
            borderWidth: 1,
            borderColor: colors.glass.border,
            backgroundColor: colors.glass.background,
          },
        ]}
      />

      {/* Layer 3: Content with padding */}
      <View style={{ padding: spacing.md }}>
        {children}
      </View>
    </View>
  );
}
