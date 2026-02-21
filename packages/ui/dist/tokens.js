export const colors = {
    violet: {
        50: "#F5F3FF",
        100: "#EDE9FE",
        200: "#DDD6FE",
        300: "#C4B5FD",
        400: "#A78BFA",
        500: "#8B5CF6",
        600: "#7C3AED",
        700: "#6D28D9",
        800: "#5B21B6",
        900: "#4C1D95",
        primary: "#8B5CF6",
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
        magenta: "#ff007a", // Neon magenta
        violet: "#7a00ff", // Electric violet
        cyan: "#00e5ff", // Cyan glow
    },
    // Deep Space dark theme
    surface: "#120d26", // Deep violet, almost black
    surfaceElevated: "#1a1436", // Slightly lighter for layering
    glass: {
        background: "rgba(255,255,255,0.08)", // Subtle frosted tint on dark
        border: "rgba(255,255,255,0.15)", // Crisp edge refraction
    },
    shadow: {
        color: "#7a00ff", // Violet glow
        offset: { width: 0, height: 8 },
        opacity: 0.4, // More visible on dark
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
};
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
};
export const radii = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    superEllipse: 28,
    full: 9999,
};
export const typography = {
    questionLarge: {
        fontFamily: "DMSerifDisplay",
        fontSize: 34,
        lineHeight: 42,
        fontWeight: "400",
    },
    h1: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "700",
    },
    h2: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "600",
    },
    h3: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "600",
    },
    body: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "400",
    },
    bodySmall: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "400",
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "400",
    },
    button: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "600",
    },
};
export const tokens = { colors, spacing, radii, typography };
