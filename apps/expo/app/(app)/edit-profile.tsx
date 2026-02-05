import { useRouter } from "expo-router";
import { EditProfileScreen } from "@repo/app/profile/edit-profile-screen";

export default function EditProfile() {
  const router = useRouter();

  return (
    <EditProfileScreen
      onComplete={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}
