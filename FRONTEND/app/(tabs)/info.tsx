// app/(tabs)/info.tsx
import { useRouter } from "expo-router";
import InfoScreen from "../screens/InfoScreen";

export default function InfoPage() {
  const router = useRouter(); // se mantiene para seguir tu patrón
  return <InfoScreen />;
}
