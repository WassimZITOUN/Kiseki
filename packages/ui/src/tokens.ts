export const colors = {
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
    primary: "#9572CF",
  },
  aurora: {
    pink: "#F0B4E0",
    blue: "#A5C7F7",
    violet: "#C9A6F5",
    mint: "#A8E6CF",
    peach: "#FFD3B6",
  },
  // Deep Glass neon orbs — high contrast on dark background
  orb: {
    magenta: "#ff007a",   // Neon magenta
    violet: "#7a00ff",    // Electric violet
    cyan: "#00e5ff",      // Cyan glow
  },
  // Deep Space dark theme
  surface: "#120d26",         // Deep violet, almost black
  surfaceElevated: "#1a1436", // Slightly lighter for layering
  glass: {
    background: "rgba(255,255,255,0.08)", // Subtle frosted tint on dark
    border: "rgba(255,255,255,0.15)",     // Crisp edge refraction
  },
  shadow: {
    color: "#7a00ff",         // Violet glow
    offset: { width: 0, height: 8 },
    opacity: 0.4,             // More visible on dark
    radius: 24,
  },
  // Typography — light on dark
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",
  textMuted: "#6B6B6B",
  // Status colors — vibrant for dark theme
  error: "#FF6B6B",
  success: "#4ADE80",
  overlay: "rgba(0,0,0,0.6)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  superEllipse: 28,
  full: 9999,
} as const;

export const typography = {
  questionLarge: {
    fontFamily: "DMSerifDisplay",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "400" as const,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
} as const;

export const tokens = { colors, spacing, radii, typography } as const;
