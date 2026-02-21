"use client";
import React from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors, spacing } from "./tokens";
import { KText } from "./KText";
export function QuestionHeader({ question, subtitle }) {
    return (<Animated.View entering={FadeIn.duration(400)} style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xl,
            alignItems: "center",
            justifyContent: "center",
        }}>
      {subtitle && (<KText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs, textTransform: "uppercase", letterSpacing: 1 }}>
          {subtitle}
        </KText>)}
      <KText variant="questionLarge" style={{ textAlign: "center" }}>
        {question}
      </KText>
    </Animated.View>);
}
