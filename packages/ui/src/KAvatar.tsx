"use client";

import React from "react";
import { View, Image, type ViewStyle } from "react-native";
import { colors, radii } from "./tokens";
import { KText } from "./KText";

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

export function KAvatar({ uri, name, size = 40, style }: Props) {
  const half = size / 2;
  const ringSize = size + 4;

  return (
    <View
      style={[
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: 2,
          borderColor: colors.glass.border,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: half,
            backgroundColor: colors.violet[50],
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: half,
            backgroundColor: colors.violet[100],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KText
            variant="body"
            color={colors.violet.primary}
            style={{ fontSize: size * 0.4, fontWeight: "600" }}
          >
            {getInitials(name)}
          </KText>
        </View>
      )}
    </View>
  );
}
