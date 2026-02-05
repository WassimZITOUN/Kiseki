"use client";

import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { colors } from "./tokens";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const isWeb = Platform.OS === "web";

const ORB_CONFIG = [
  {
    size: 280,
    color: colors.orb.violet,
    top: -60,
    left: -40,
    durationX: 25000,
    durationY: 25000,
    opacityNative: 0.3,
    opacityWeb: 0.6,
  },
  {
    size: 220,
    color: colors.orb.yuzu,
    top: SCREEN_H * 0.55,
    left: SCREEN_W * 0.5,
    durationX: 30000,
    durationY: 30000,
    opacityNative: 0.25,
    opacityWeb: 0.5,
  },
  {
    size: 200,
    color: colors.orb.sakura,
    top: SCREEN_H * 0.15,
    left: SCREEN_W * 0.3,
    durationX: 22000,
    durationY: 22000,
    opacityNative: 0.35,
    opacityWeb: 0.7,
  },
] as const;

function Orb({
  size,
  color,
  top,
  left,
  durationX,
  durationY,
  opacityNative,
  opacityWeb,
}: (typeof ORB_CONFIG)[number]) {
  const progressX = useSharedValue(0);
  const progressY = useSharedValue(0);

  useEffect(() => {
    progressX.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: durationX / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: durationX / 2,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
    progressY.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: durationY / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: durationY / 2,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progressX.value, [0, 1], [-60, 60]) },
      { translateY: interpolate(progressY.value, [0, 1], [-40, 40]) },
    ],
  }));

  const opacity = isWeb ? opacityWeb : opacityNative;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          ...(isWeb
            ? // @ts-ignore web-only
              { filter: "blur(80px)" }
            : {}),
        },
        animatedStyle,
      ]}
    />
  );
}

export function AuroraBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.surface },
        ]}
      />
      {ORB_CONFIG.map((orb, i) => (
        <Orb key={i} {...orb} />
      ))}
      {/* Noise texture overlay — subtle grain for Japandi feel */}
      {isWeb && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: 0.03,
              // @ts-ignore web-only
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "256px 256px",
            },
          ]}
        />
      )}
    </View>
  );
}
