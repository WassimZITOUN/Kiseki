"use client";

import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from "react-native";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Screen content wrapper with keyboard handling.
 * AuroraBackground is rendered once at the layout level (persistent).
 */
export function AuroraScreenWrapper({ children, style }: Props) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
