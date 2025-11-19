import { useRouter } from "expo-router";
import SoporteHomeScreen from "../screens/SoporteHomeScreen";

export default function Page() {
  const router = useRouter(); 
  return <SoporteHomeScreen />;
}