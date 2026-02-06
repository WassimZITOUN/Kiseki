import { View } from "react-native";
import { Stack } from "expo-router";
import { AuroraBackground } from "@repo/ui";

export default function AuthLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
        }}
      />
    </View>
  );
}
