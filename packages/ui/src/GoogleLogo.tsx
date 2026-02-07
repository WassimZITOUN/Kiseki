"use client";

import { Image, type ImageSourcePropType } from "react-native";

type Props = {
  size?: number;
  source: ImageSourcePropType;
};

export function GoogleLogo({ size = 20, source }: Props) {
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
