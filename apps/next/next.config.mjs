import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@my-app/core",
    "@my-app/types",
    "@repo/app",
    "@repo/ui",
    "@expo/vector-icons",
    "solito",
    "react-native",
    "react-native-web",
    "nativewind",
    "react-native-css-interop",
    "expo-linear-gradient",
    "expo-file-system",
    "expo-modules-core",
    "expo-font",
    "react-native-reanimated",
  ],
  env: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SHARE_CARD_FUNCTION:
      process.env.EXPO_PUBLIC_SHARE_CARD_FUNCTION,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  },
  webpack: (config, { webpack }) => {
    config.module.rules.push({
      test: /\.(ttf|otf|woff|woff2|eot)$/i,
      type: "asset/resource",
    });

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native$": "react-native-web",
      // Stub out native-only modules that crash the web build
      "expo-secure-store": path.resolve(__dirname, "stubs/expo-secure-store.js"),
      "expo-image-picker": path.resolve(__dirname, "stubs/expo-image-picker.js"),
      "expo-blur": path.resolve(__dirname, "stubs/expo-blur.js"),
      "expo-haptics": path.resolve(__dirname, "stubs/expo-haptics.js"),
      "expo-clipboard": path.resolve(__dirname, "stubs/empty.js"),
      "@react-native-google-signin/google-signin": path.resolve(
        __dirname,
        "stubs/empty.js"
      ),
    };
    config.resolve.extensions = [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ...config.resolve.extensions,
    ];
    config.plugins.push(
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
      })
    );
    return config;
  },
};

export default nextConfig;
