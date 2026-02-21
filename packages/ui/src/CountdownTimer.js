"use client";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, } from "react-native-reanimated";
import { colors, spacing } from "./tokens";
import { KText } from "./KText";
export function CountdownTimer({ countdown, label = "Resultats dans..." }) {
    const pulse = useSharedValue(1);
    useEffect(() => {
        pulse.value = withRepeat(withSequence(withTiming(1.02, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, false);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }), []);
    return (<View style={{ alignItems: "center" }}>
      <KText variant="bodySmall" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
        {label}
      </KText>
      <Animated.View style={animatedStyle}>
        <KText variant="h1" style={{
            fontSize: 42,
            fontWeight: "bold",
            fontVariant: ["tabular-nums"],
            letterSpacing: 2,
        }}>
          {countdown}
        </KText>
      </Animated.View>
    </View>);
}
