import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "Kiseki",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="groups/create"
        options={{ headerTitle: "Creer un groupe" }}
      />
      <Stack.Screen
        name="groups/join"
        options={{ headerTitle: "Rejoindre un groupe" }}
      />
      <Stack.Screen
        name="groups/[id]/index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
