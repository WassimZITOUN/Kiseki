"use client";

import React, { useEffect } from "react";
import { View, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, radii } from "./tokens";

type Props = {
  children: React.ReactNode;
  revealed?: boolean;
  duration?: number;
};

export function BlurredReveal({
  children,
  revealed = false,
  duration = 1500,
}: Props) {
  const blurAmount = useSharedValue(revealed ? 0 : 80);

  useEffect(() => {
    blurAmount.value = withTiming(revealed ? 0 : 80, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [revealed, duration]);

  if (Platform.OS === "web") {
    const animatedStyle = useAnimatedStyle(() => ({
      // @ts-ignore web-only
      filter: `blur(${blurAmount.value}px)`,
    }));

    return (
      <Animated.View
        style={[
          {
            borderRadius: radii.lg,
            overflow: "hidden",
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  const BlurView = require("expo-blur").BlurView;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: blurAmount.value / 80,
  }));

  return (
    <View style={{ borderRadius: radii.lg, overflow: "hidden" }}>
      {children}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          animatedStyle,
        ]}
      >
        <BlurView
          intensity={80}
          tint="default"
          experimentalBlurMethod="dimezisBlurView"
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
