import { Stack } from "expo-router";

// Deep Space background color to prevent flash during transitions
const SURFACE_COLOR = "#120d26";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SURFACE_COLOR },
        animation: "fade",
      }}
    />
  );
}
