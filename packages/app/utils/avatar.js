"use client";
import { Alert, Platform } from "react-native";
import { getSupabase } from "./supabase";
function pickImageWeb() {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file)
                return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        };
        input.oncancel = () => resolve(null);
        input.click();
    });
}
export async function pickImage() {
    if (Platform.OS === "web") {
        return pickImageWeb();
    }
    const ImagePicker = require("expo-image-picker");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
        Alert.alert("Permission requise", "Autorise l'acces a ta galerie pour choisir une photo.");
        return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
    });
    if (result.canceled)
        return null;
    return result.assets[0].uri;
}
export async function uploadAvatar(userId, uri) {
    const supabase = getSupabase();
    let ext;
    if (uri.startsWith("data:")) {
        // data URL: extract mime type (e.g. data:image/png;base64,...)
        const mime = uri.split(";")[0].split("/")[1] ?? "jpeg";
        ext = mime === "jpeg" ? "jpg" : mime;
    }
    else {
        ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
    }
    const filePath = `${userId}/avatar.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const { error } = await supabase.storage.from("avatars").upload(filePath, arrayBuffer, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: true,
    });
    if (error) {
        console.error("Upload error:", error.message);
        return null;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
}
