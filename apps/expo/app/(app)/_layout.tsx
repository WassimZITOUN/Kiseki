import { View } from "react-native";
import { Stack } from "expo-router";
import { AuroraBackground } from "@repo/ui";

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Persistent background — never unmounts during transitions */}
      <AuroraBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="groups/create" />
        <Stack.Screen name="groups/join" />
        <Stack.Screen name="groups/[id]/index" />
      </Stack>
    </View>
  );
}
