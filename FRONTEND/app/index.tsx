import { useRouter } from "expo-router";
import LoginScreen from "./screens/LoginScreen";

export default function IndexPage() {
  const router = useRouter();
  
  return (
    <LoginScreen
      onLoginSuccess={(userId: number) => {  
        console.log("Login exitoso:", userId);
        router.replace("./(tabs)/home");;
      }}
      onNavigateToRegister={() => router.push("./(tabs)/register")}
    />
  );
}