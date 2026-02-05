// Stub for web – expo-image-picker is native-only
export const MediaTypeOptions = { Images: "Images" };
export async function requestMediaLibraryPermissionsAsync() {
  return { status: "granted" };
}
export async function launchImageLibraryAsync() {
  return { canceled: true, assets: [] };
}
