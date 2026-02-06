import { useEffect } from "react";
import { Stack } from "expo-router";

// Deep Space background color to prevent flash during transitions
const SURFACE_COLOR = "#120d26";

export default function AppLayout() {
  useEffect(() => {
    console.log("[AppLayout] MOUNTED");
    return () => console.log("[AppLayout] UNMOUNTED");
  }, []);

  console.log("[AppLayout] RENDER");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SURFACE_COLOR },
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
