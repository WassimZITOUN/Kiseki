"use client";

import React from "react";
import { Text, type TextProps, Platform } from "react-native";
import { typography, colors } from "./tokens";

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function KText({
  variant = "body",
  color,
  style,
  ...props
}: Props) {
  const t = typography[variant];
  const isSerif = variant === "questionLarge";

  return (
    <Text
      {...props}
      style={[
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontWeight: t.fontWeight,
          color: color ?? colors.textPrimary,
          ...(isSerif
            ? {
                fontFamily:
                  Platform.OS === "web"
                    ? "var(--font-dm-serif), DMSerifDisplay, serif"
                    : "DMSerifDisplay",
              }
            : {}),
        },
        style,
      ]}
    />
  );
}
