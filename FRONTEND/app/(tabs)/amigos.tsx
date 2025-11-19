// app/(tabs)/amigos.tsx
import { useRouter } from "expo-router";
import AmigosScreen from "../screens/AmigosScreen";

export default function AmigosPage() {
  const router = useRouter(); // se mantiene el patrón aunque no lo usemos aún
  return <AmigosScreen />;
}