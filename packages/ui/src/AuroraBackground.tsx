"use client";

import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Platform, Image } from "react-native";
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

// Deep Glass neon orbs — high contrast on dark background
// Positioned to pass behind content for visible glass refraction
const ORB_CONFIG = [
  {
    // Magenta orb — top-left, vivid pink glow
    size: 350,
    color: colors.orb.magenta,
    top: SCREEN_H * 0.05,
    left: -50,
    durationX: 25000,
    durationY: 28000,
    opacityNative: 0.5,
    opacityWeb: 0.6,
  },
  {
    // Violet orb — center-right, electric purple
    size: 300,
    color: colors.orb.violet,
    top: SCREEN_H * 0.35,
    left: SCREEN_W * 0.5,
    durationX: 30000,
    durationY: 32000,
    opacityNative: 0.5,
    opacityWeb: 0.6,
  },
  {
    // Cyan orb — bottom-center, teal glow
    size: 280,
    color: colors.orb.cyan,
    top: SCREEN_H * 0.6,
    left: SCREEN_W * 0.2,
    durationX: 22000,
    durationY: 26000,
    opacityNative: 0.4,
    opacityWeb: 0.5,
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
      { translateX: interpolate(progressX.value, [0, 1], [-80, 80]) },
      { translateY: interpolate(progressY.value, [0, 1], [-60, 60]) },
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
              { filter: "blur(100px)" }
            : {}),
        },
        animatedStyle,
      ]}
    />
  );
}

// SVG noise texture as base64 for cross-platform grain
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;

export function AuroraBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep Space dark surface */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.surface },
        ]}
      />

      {/* Floating orbs — positioned to pass behind content */}
      {ORB_CONFIG.map((orb, i) => (
        <Orb key={i} {...orb} />
      ))}

      {/* Noise texture overlay — Japandi paper feel */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: 0.04,
            ...(isWeb
              ? {
                  // @ts-ignore web-only
                  backgroundImage: `url("${NOISE_SVG}")`,
                  backgroundSize: "256px 256px",
                  backgroundRepeat: "repeat",
                }
              : {}),
          },
        ]}
      >
        {/* Native: use Image with tiled noise (or skip if perf issue) */}
        {!isWeb && (
          <Image
            source={{ uri: NOISE_SVG }}
            style={StyleSheet.absoluteFill}
            resizeMode="repeat"
          />
        )}
      </View>
    </View>
  );
}
