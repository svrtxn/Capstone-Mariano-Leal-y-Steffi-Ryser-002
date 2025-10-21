import { useRouter } from "expo-router";
import RegisterScreen from "../screens/RegisterScreen";

export default function RegisterPage() {
  const router = useRouter();
  
  return (
    <RegisterScreen
      onRegisterSuccess={(userId: number) => {  // ← AÑADE ": number" AQUÍ
        console.log("Registro exitoso:", userId);
        router.replace("/home");
      }}
      onNavigateToLogin={() => router.back()}
    />
  );
}