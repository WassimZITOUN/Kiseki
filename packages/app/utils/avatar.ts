"use client";

import { Alert, Platform } from "react-native";
import { getSupabase } from "./supabase";

function pickImageWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function pickImage(): Promise<string | null> {
  if (Platform.OS === "web") {
    return pickImageWeb();
  }

  const ImagePicker = require("expo-image-picker");
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission requise",
      "Autorise l'acces a ta galerie pour choisir une photo."
    );
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function uploadAvatar(
  userId: string,
  uri: string
): Promise<string | null> {
  const supabase = getSupabase();
  let ext: string;
  if (uri.startsWith("data:")) {
    // data URL: extract mime type (e.g. data:image/png;base64,...)
    const mime = uri.split(";")[0].split("/")[1] ?? "jpeg";
    ext = mime === "jpeg" ? "jpg" : mime;
  } else {
    ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  }
  const now = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filePath = `${userId}/avatar-${now}-${randomSuffix}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage.from("avatars").upload(filePath, arrayBuffer, {
    contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    cacheControl: "0",
    upsert: false,
  });

  if (error) {
    console.error("Upload error:", { message: error.message, error });
    return null;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
}

function extractAvatarPathFromPublicUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = "/storage/v1/object/public/avatars/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    const fullPath = url.pathname.slice(markerIndex + marker.length);
    return decodeURIComponent(fullPath);
  } catch {
    return null;
  }
}

export async function deleteAvatarByPublicUrl(publicUrl: string): Promise<void> {
  const filePath = extractAvatarPathFromPublicUrl(publicUrl);
  if (!filePath) return;

  const supabase = getSupabase();
  const { error } = await supabase.storage.from("avatars").remove([filePath]);
  if (error) {
    throw new Error(error.message);
  }
}

export async function cleanupUserAvatarDuplicates(
  userId: string,
  keepPublicUrl?: string | null
): Promise<void> {
  const keepPath = keepPublicUrl ? extractAvatarPathFromPublicUrl(keepPublicUrl) : null;
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from("avatars").list(userId, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });

  if (error) {
    throw new Error(error.message);
  }

  const toDelete = (data ?? [])
    .filter((file) => file.name)
    .map((file) => `${userId}/${file.name}`)
    .filter((path) => path !== keepPath);

  if (toDelete.length === 0) return;

  const { error: removeError } = await supabase.storage.from("avatars").remove(toDelete);
  if (removeError) {
    throw new Error(removeError.message);
  }
}
