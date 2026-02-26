import "../global.css";

import { useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@repo/app";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const notificationListenerRef = useRef<any>(null);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === "(auth)";

    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(app)");
    }
  }, [user, loading, segments]);

  // Configure le foreground handler + deep-link listener
  // Tout est dans un useEffect pour eviter les crashes au niveau module
  useEffect(() => {
    if (Platform.OS === "web") return;

    let Notifications: any;
    try {
      Notifications = require("expo-notifications");
    } catch {
      return;
    }

    // Foreground : afficher les notifs meme quand l'app est ouverte
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Deep-link : uniquement si l'utilisateur est connecte
    if (!user) return;

    const handleNotificationResponse = (response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (!data?.group_id) return;

      switch (data.screen) {
        case "vote":
        case "results":
        case "group":
        case "weekly-recap":
          router.push(`/(app)/groups/${data.group_id}`);
          break;
        default:
          router.push("/(app)");
      }
    };

    notificationListenerRef.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    // Cold-start : app tuee puis relancee via tap sur notif
    Notifications.getLastNotificationResponseAsync().then((response: any) => {
      if (response) handleNotificationResponse(response);
    });

    return () => {
      notificationListenerRef.current?.remove();
    };
  }, [user, router]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay: require("../assets/fonts/DMSerifDisplay-Regular.ttf"),
  });

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
