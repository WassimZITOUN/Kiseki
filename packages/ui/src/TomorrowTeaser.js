"use client";
import React from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { GlassCard } from "./GlassCard";
import { KText } from "./KText";
import { colors, spacing, radii } from "./tokens";
/** View-based lock icon — rectangle body + arc top + center dot */
function LockIcon() {
    return (<View style={{ alignItems: "center", marginBottom: spacing.sm }}>
      {/* Arc (half-circle) */}
      <View style={{
            width: 20,
            height: 12,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderWidth: 3,
            borderBottomWidth: 0,
            borderColor: colors.textMuted,
            marginBottom: -1,
        }}/>
      {/* Body */}
      <View style={{
            width: 24,
            height: 18,
            borderRadius: 4,
            backgroundColor: colors.textMuted,
            alignItems: "center",
            justifyContent: "center",
        }}>
        {/* Center dot */}
        <View style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.surface,
        }}/>
      </View>
    </View>);
}
export function TomorrowTeaser({ countdown }) {
    return (<Animated.View entering={FadeIn.delay(400).duration(500)}>
      <GlassCard style={{
            borderRadius: radii.xl,
            alignItems: "center",
        }}>
        <LockIcon />

        <KText variant="bodySmall" color={colors.textMuted} style={{ textAlign: "center", marginBottom: spacing.xs }}>
          Prochaine question dans
        </KText>

        <KText variant="h2" color={colors.violet.primary} style={{
            textAlign: "center",
            fontVariant: ["tabular-nums"],
            letterSpacing: 1,
            marginBottom: spacing.xs,
        }}>
          {countdown}
        </KText>

        <KText variant="caption" color={colors.textMuted} style={{ textAlign: "center" }}>
          Reviens demain !
        </KText>
      </GlassCard>
    </Animated.View>);
}
