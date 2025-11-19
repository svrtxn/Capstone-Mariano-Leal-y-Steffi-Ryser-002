import { useRouter } from "expo-router";
import RegisterScreen from "../screens/RegisterScreen";

export default function RegisterPage() {
  const router = useRouter();
  
  return (
    <RegisterScreen
      onRegisterSuccess={(userId: number) => {  
        console.log("Registro exitoso:", userId);
        router.replace("/umbrales");
      }}
      onNavigateToLogin={() => router.back()}
    />
  );
} 