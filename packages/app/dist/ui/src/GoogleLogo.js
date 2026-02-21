"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Image } from "react-native";
export function GoogleLogo({ size = 20, source }) {
    return (_jsx(Image, { source: source, style: { width: size, height: size }, resizeMode: "contain" }));
}
