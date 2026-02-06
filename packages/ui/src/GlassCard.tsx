"use client";

import React from "react";
import { View, Platform, StyleSheet, type ViewStyle } from "react-native";
import { colors, radii, spacing } from "./tokens";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
};

/**
 * GlassCard — Deep Glass Dark Theme
 *
 * Architecture:
 * 1. Shadow layer (violet glow, no clip)
 * 2. Blur layer (expo-blur with experimentalBlurMethod, tint="default" = pure blur, no color overlay)
 * 3. Refraction border (subtle white edge)
 * 4. Content
 *
 * Dark mode optimized — glass catches neon orb colors
 */
export function GlassCard({ children, style, intensity = 40 }: Props) {
  const flatStyle = StyleSheet.flatten(style);
  const resolvedRadius = (flatStyle?.borderRadius as number) ?? radii.lg;

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          {
            borderRadius: resolvedRadius,
            padding: spacing.md,
            overflow: "hidden",
            backgroundColor: colors.glass.background,
            borderWidth: 1,
            borderColor: colors.glass.border,
            // @ts-ignore web-only
            backdropFilter: `blur(${intensity * 0.5}px)`,
            WebkitBackdropFilter: `blur(${intensity * 0.5}px)`,
            boxShadow: "0 8px 32px rgba(122, 0, 255, 0.25)",
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
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 12,
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
          tint="default"
          experimentalBlurMethod="dimezisBlurView"
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
