"use client";

import React, { useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from "react-native";
import { AuroraBackground } from "./AuroraBackground";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function AuroraScreenWrapper({ children, style }: Props) {
  useEffect(() => {
    console.log("[AuroraScreenWrapper] MOUNTED");
    return () => console.log("[AuroraScreenWrapper] UNMOUNTED");
  }, []);

  console.log("[AuroraScreenWrapper] RENDER");

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[{ flex: 1 }, style]}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}
