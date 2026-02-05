module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // expo-router babel plugin: inlines EXPO_ROUTER_APP_ROOT for require.context.
      // Added explicitly because expo-router is not hoisted to root node_modules
      // in this monorepo, so babel-preset-expo's hasModule('expo-router') check fails.
      require("babel-preset-expo/build/expo-router-plugin").expoRouterBabelPlugin,
      [
        "module-resolver",
        {
          alias: {
            "@my-app/core": "../../packages/core/src",
            "@my-app/types": "../../packages/types/src",
            "@repo/ui": "../../packages/ui/src",
            "@repo/app": "../../packages/app/features",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
