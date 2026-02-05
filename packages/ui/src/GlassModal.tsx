"use client";

import React from "react";
import { View, TouchableOpacity, Modal, Platform, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "./tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function ModalCard({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={{
          borderRadius: radii.xl,
          marginHorizontal: spacing.lg,
          maxWidth: 400,
          width: "100%",
          alignSelf: "center",
          overflow: "hidden",
          padding: spacing.lg,
          // @ts-ignore web-only
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          boxShadow: "0 12px 32px rgba(162, 155, 254, 0.2)",
        }}
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
              borderRadius: radii.xl,
            },
          ]}
        />
        {children}
      </Animated.View>
    );
  }

  const BlurView = require("expo-blur").BlurView;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={{
        borderRadius: radii.xl,
        marginHorizontal: spacing.lg,
        maxWidth: 400,
        alignSelf: "center",
        width: "100%",
        padding: spacing.lg,
        shadowColor: colors.shadow.color,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      {/* Glass layers */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radii.xl, overflow: "hidden" },
        ]}
      >
        <BlurView
          intensity={80}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
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
      {children}
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
