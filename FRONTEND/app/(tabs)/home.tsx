import { useRouter } from "expo-router";
import HomeScreen from "../screens/HomeScreen";

export default function HomePage() {
  const router = useRouter();
  
  return (
    <HomeScreen
      userName="Usuario"
      onNavigateToIngesta={() => router.push("/ingesta")}
      onNavigateToHistorial={() => {
        console.log("Ir a historial");
      }}
    />
  );
}