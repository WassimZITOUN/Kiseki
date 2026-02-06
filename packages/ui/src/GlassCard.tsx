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
 * GlassCard — Zero-Fill Glassmorphism
 *
 * Architecture:
 * 1. Shadow layer (outer, no clip)
 * 2. Blur layer (expo-blur with experimentalBlurMethod)
 * 3. Refraction border (1px white 30% opacity)
 * 4. Content
 *
 * NO white background fill — pure glass refraction only
 */
export function GlassCard({ children, style, intensity = 30 }: Props) {
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
            backgroundColor: colors.glass.background, // 5% opacity max
            borderWidth: 1,
            borderColor: colors.glass.border,
            // @ts-ignore web-only
            backdropFilter: `blur(${intensity * 0.5}px)`,
            WebkitBackdropFilter: `blur(${intensity * 0.5}px)`,
            boxShadow: "0 8px 32px rgba(162, 155, 254, 0.15)",
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
    // Layer 0: Shadow caster (no overflow:hidden — shadow must render outside)
    <View
      style={[
        {
          borderRadius: resolvedRadius,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 15,
          elevation: 8,
        },
        style,
      ]}
    >
      {/* Layer 1: Blur (clipped) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: resolvedRadius, overflow: "hidden" },
        ]}
      >
        <BlurView
          intensity={intensity}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Layer 2: Refraction border only — NO fill */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: resolvedRadius,
            borderWidth: 1,
            borderColor: colors.glass.border,
            backgroundColor: colors.glass.background, // 5% opacity
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
