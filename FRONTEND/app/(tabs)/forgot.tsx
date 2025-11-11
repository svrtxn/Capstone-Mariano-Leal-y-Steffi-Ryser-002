import { useRouter } from "expo-router";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

export default function Page() {
  const router = useRouter();
  return <ForgotPasswordScreen onDone={() => router.back()} />;
}
