import { useRouter } from "expo-router";
import HistoryScreen from "../screens/HistoryScreen";

export default function Page() {
  const router = useRouter(); 
  return <HistoryScreen />;
}