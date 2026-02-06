import { Stack } from "expo-router";

export default function AppLayout() {
  return (
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
  );
}
