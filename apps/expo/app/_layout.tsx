import "../global.css";

import { useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@repo/app";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import type { NotificationPayload } from "@repo/types";

SplashScreen.preventAutoHideAsync();

// Configure le comportement des notifications en premier plan.
// On affiche toujours l'alerte meme si l'app est ouverte —
// la notif "Social Proof" est concue pour creer de la curiosite,
// la voir en foreground renforce la boucle FOMO.
if (Platform.OS !== "web") {
  try {
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {}
}

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

  // Deep-link handler : se declenche quand l'utilisateur tape sur une notif.
  // Gere aussi le cold-start (app tuee) via getLastNotificationResponseAsync.
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!user) return;

    let Notifications: any;
    try {
      Notifications = require("expo-notifications");
    } catch {
      return;
    }

    const handleNotificationResponse = (response: any) => {
      const data = response?.notification?.request?.content?.data as
        | NotificationPayload
        | undefined;
      if (!data?.group_id) return;

      // Route vers l'ecran du groupe — le composant detecte l'etat
      // (vote/results/waiting) en fonction de la DB.
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

    // Cold-start : l'app a ete tuee et une notif l'a relancee.
    // getLastNotificationResponseAsync retourne la notif tapee au demarrage.
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
