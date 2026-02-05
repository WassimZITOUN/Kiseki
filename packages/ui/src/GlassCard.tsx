"use client";

import React from "react";
import { View, Platform, StyleSheet, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "./tokens";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
};

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
            // @ts-ignore web-only
            backdropFilter: `blur(${intensity * 0.5}px)`,
            WebkitBackdropFilter: `blur(${intensity * 0.5}px)`,
            boxShadow: "0 8px 24px rgba(162, 155, 254, 0.15)",
          },
          style,
        ]}
      >
        {/* Glass gradient surface */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.4)",
            "rgba(255,255,255,0.1)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            {
              borderWidth: 1,
              borderColor: colors.glass.border,
              borderRadius: resolvedRadius,
            },
          ]}
        />
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
          padding: spacing.md,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
    >
      {/* Layers 1-2: Clip + Blur + Glass surface (behind content) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: resolvedRadius, overflow: "hidden" },
        ]}
      >
        {/* Layer 1: Real blur */}
        <BlurView
          intensity={intensity}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        {/* Layer 2: Glass gradient surface + inset border */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.4)",
            "rgba(255,255,255,0.1)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            {
              borderWidth: 1,
              borderColor: colors.glass.border,
            },
          ]}
        />
      </View>
      {/* Layer 3: Content */}
      {children}
    </View>
  );
}
