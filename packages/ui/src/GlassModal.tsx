"use client";

import React from "react";
import { View, TouchableOpacity, Modal, Platform, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";

// iOS Premium Spring — snappy, no jelly
const SNAPPY_SPRING = {
  damping: 40,
  stiffness: 350,
  mass: 1,
  overshootClamping: true,
};

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function ModalCard({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(0.9);

  React.useEffect(() => {
    scale.value = withSpring(1, SNAPPY_SPRING);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (Platform.OS === "web") {
    return (
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(100)}
        style={[
          {
            borderRadius: radii.xl,
            marginHorizontal: spacing.lg,
            maxWidth: 400,
            width: "100%",
            alignSelf: "center",
            overflow: "hidden",
            padding: spacing.lg,
            backgroundColor: colors.glass.background,
            borderWidth: 1,
            borderColor: colors.glass.border,
            // @ts-ignore web-only
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 16px 48px rgba(162, 155, 254, 0.25)",
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  const BlurView = require("expo-blur").BlurView;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(100)}
      style={[
        {
          borderRadius: radii.xl,
          marginHorizontal: spacing.lg,
          maxWidth: 400,
          alignSelf: "center",
          width: "100%",
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.25,
          shadowRadius: 24,
          elevation: 16,
        },
        animatedStyle,
      ]}
    >
      {/* Blur layer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radii.xl, overflow: "hidden" },
        ]}
      >
        <BlurView
          intensity={60}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Refraction border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.glass.border,
            backgroundColor: colors.glass.background,
          },
        ]}
      />

      {/* Content */}
      <View style={{ padding: spacing.lg }}>
        {children}
      </View>
    </Animated.View>
  );
}

export function GlassModal({ visible, onClose, children }: Props) {
  if (Platform.OS === "web") {
    if (!visible) return null;

    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.overlay,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 200,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <ModalCard>{children}</ModalCard>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <ModalCard>{children}</ModalCard>
      </View>
    </Modal>
  );
}
