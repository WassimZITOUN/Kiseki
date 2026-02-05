import type { Config } from "tailwindcss";
import nativewindPreset from "nativewind/preset";

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../apps/*/app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        violet: {
          50: "#F5F0FF",
          100: "#EDE5FF",
          200: "#D4C4F7",
          300: "#BBA3EF",
          400: "#A88AE5",
          500: "#9572CF",
          600: "#7C5BB8",
          700: "#6344A1",
          800: "#4B2D8A",
          900: "#341B6E",
        },
        aurora: {
          pink: "#F0B4E0",
          blue: "#A5C7F7",
          violet: "#C9A6F5",
          mint: "#A8E6CF",
          peach: "#FFD3B6",
        },
        surface: "#FAFAFE",
        "text-primary": "#1A1036",
        "text-secondary": "#6B6183",
        "text-muted": "#9E97AD",
        kiseki: {
          error: "#E53E3E",
          success: "#38A169",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "super-ellipse": "28px",
      },
      fontFamily: {
        serif: ["DMSerifDisplay", "var(--font-dm-serif)", "serif"],
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
