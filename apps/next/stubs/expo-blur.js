"use strict";
const React = require("react");
const { View } = require("react-native");

function BlurView({ children, intensity = 50, tint = "default", experimentalBlurMethod, style, ...props }) {
  const opacity = Math.min(intensity / 100, 0.95);
  const bg =
    tint === "dark"
      ? `rgba(0,0,0,${opacity * 0.6})`
      : tint === "light"
        ? `rgba(255,255,255,${opacity * 0.7})`
        : `rgba(255,255,255,${opacity * 0.55})`;

  const isFirefox =
    typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
  const backdrop = isFirefox
    ? `blur(${intensity * 0.22}px) saturate(145%) contrast(104%)`
    : `url("#glass-distortion") blur(${intensity * 0.22}px) saturate(145%) contrast(104%)`;

  return React.createElement(
    View,
    {
      ...props,
      style: [
        {
          backgroundColor: bg,
          backdropFilter: backdrop,
          WebkitBackdropFilter: backdrop,
        },
        style,
      ],
    },
    children
  );
}

module.exports = { BlurView };
