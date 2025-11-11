import { useRouter } from "expo-router";
import LoginScreen from "./screens/LoginScreen";

export default function IndexPage() {
  const router = useRouter();

  return (
    <LoginScreen
      onLoginSuccess={({ id, name }) => {
        console.log("Login OK:", id, name);
        // Pasamos el nombre al Home por query param (?name=)
        router.replace({
          pathname: "/(tabs)/home",
          params: { name },
        });
      }}
      onNavigateToRegister={() => router.push("/register")}
    />
  );
}
