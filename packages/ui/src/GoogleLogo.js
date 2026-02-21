"use client";
import { Image } from "react-native";
export function GoogleLogo({ size = 20, source }) {
    return (<Image source={source} style={{ width: size, height: size }} resizeMode="contain"/>);
}
