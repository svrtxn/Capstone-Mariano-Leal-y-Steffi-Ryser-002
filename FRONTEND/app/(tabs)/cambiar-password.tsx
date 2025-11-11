import { useRouter } from "expo-router";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";

export default function Page() {
  const router = useRouter();
  // vuelve al login o a donde prefieras
  return <ResetPasswordScreen onDone={() => router.replace("/")} />;
}
