"use client";

import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { getSupabase } from "../utils/supabase";

export type PushNotificationHookReturn = {
  isRegistered: boolean;
  registerForPushNotifications: () => Promise<void>;
};

export function usePushNotifications(): PushNotificationHookReturn {
  const [isRegistered, setIsRegistered] = useState(false);

  const registerForPushNotifications = useCallback(async (): Promise<void> => {
    // Web n'a pas de push token Expo — no-op silencieux
    if (Platform.OS === "web") return;

    // Dynamic imports — meme pattern que expo-haptics dans group-detail-screen.tsx.
    // Evite les crashes au parse sur web/SSG.
    let Device: any;
    let Notifications: any;
    try {
      Device = require("expo-device");
      Notifications = require("expo-notifications");
    } catch {
      return;
    }

    // Les push tokens ne sont delivres que sur appareil physique.
    // Simulateur/emulateur = pas de token, on sort silencieusement.
    if (!Device.isDevice) return;

    // On ne demande la permission qu'apres une action cle (creation de compte
    // ou rejoindre un groupe). Ce timing contextuel genere ~48% de taux
    // d'acceptation en plus vs un prompt au premier lancement.
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // L'utilisateur a refuse — on respecte son choix, pas de re-demande.
    if (finalStatus !== "granted") return;

    // Android necessite un channel configurer avant de recuperer le token
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Kiseki",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#9572CF",
      });
    }

    // Recupere l'Expo Push Token. Le projectId doit correspondre a eas.json.
    let tokenData: { data: string };
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "548c9d57-0a07-46f4-afeb-e2177f3c3fbf",
      });
    } catch {
      // Echec possible en dev sans certificat push — degradation gracieuse
      return;
    }

    const token = tokenData.data;

    // Persiste le token dans profiles.expo_push_token via RLS
    // (la policy profiles_update_own autorise: using (id = auth.uid()))
    const supabase = getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: token })
      .eq("id", user.id);

    if (!error) {
      setIsRegistered(true);
    }
  }, []);

  return { isRegistered, registerForPushNotifications };
}
