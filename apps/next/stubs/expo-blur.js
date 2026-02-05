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

  return React.createElement(
    View,
    {
      ...props,
      style: [
        {
          backgroundColor: bg,
          backdropFilter: `blur(${intensity * 0.5}px)`,
          WebkitBackdropFilter: `blur(${intensity * 0.5}px)`,
        },
        style,
      ],
    },
    children
  );
}

module.exports = { BlurView };
