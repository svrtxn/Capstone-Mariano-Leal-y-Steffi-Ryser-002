// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { authApi } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  // ⬇️ ahora mandamos id y name al padre
  onLoginSuccess?: (info: { id: number; name: string }) => void;
  onNavigateToRegister?: () => void;
};

export default function LoginScreen({
  onLoginSuccess,
  onNavigateToRegister,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [statusMsg, setStatusMsg] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null
  );

  const emailValid = email.trim() !== "" && email.includes("@");
  const passwordValid = password.length >= 6;
  const isValid = emailValid && passwordValid;

  const handleLogin = async () => {
    if (!isValid || loading) return;
    try {
      setLoading(true);
      setStatusMsg("");
      setStatusType(null);

      const res = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });

      const msg = res.mensaje || `¡Bienvenido, ${res.usuario.nombre}!`;

      setStatusType("success");
      setStatusMsg(msg);

      onLoginSuccess?.({
        id: res.usuario.id,
        name: res.usuario.nombre,
      });

      // La navegación la hace el padre (index.tsx) para poder pasar ?name=
    } catch (e: any) {
      const human =
        typeof e?.message === "string"
          ? e.message.replace(/^HTTP \d+ [\w ]+ - /, "")
          : "No se pudo iniciar sesión";

      setStatusType("error");
      setStatusMsg(human);
    } finally {
      setLoading(false);
    }
  };

  const statusColorStyle =
    statusType === "error"
      ? s.statusError
      : statusType === "success"
      ? s.statusSuccess
      : null;

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={[COLORS.teal, COLORS.tealLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={s.headerInner}>
          <Image
            source={require("../../assets/images/glucoguard_logo_blanco.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.brand}>GlucoGuard</Text>
          <Text style={s.tagline}>Tu salud, bajo control</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.scrollBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.title}>Iniciar Sesión</Text>
          <Text style={s.subtitle}>Accede a tu cuenta para continuar</Text>

          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ejemplo@correo.com"
            placeholderTextColor={COLORS.sub}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={s.input}
          />

          <Text style={s.label}>Contraseña</Text>
          <View style={s.passwordContainer}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={COLORS.sub}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={s.passwordInput}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={s.eyeIcon}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={COLORS.sub}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/forgot")}
            activeOpacity={0.7}
          >
            <Text style={{ color: COLORS.teal, marginTop: 12 }}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!isValid || loading}
            activeOpacity={0.85}
            onPress={handleLogin}
            style={{ marginTop: 8 }}
          >
            <LinearGradient
              colors={
                isValid && !loading
                  ? [COLORS.teal, COLORS.tealLight]
                  : [COLORS.gray200, COLORS.gray200]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.button, (!isValid || loading) && { opacity: 0.8 }]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={s.buttonText}>Iniciar sesión</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Mensaje inline de estado */}
          {statusType && !!statusMsg && (
            <Text style={[s.statusText, statusColorStyle]}>{statusMsg}</Text>
          )}

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>O</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateToRegister}
            style={s.registerButton}
          >
            <Text style={s.registerButtonText}>Crear cuenta nueva</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footerNote}>
          Al continuar, aceptas nuestros términos de servicio y política de
          privacidad.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: { alignItems: "center" },
  logo: { width: 72, height: 72 },
  brand: { color: COLORS.white, fontSize: 26, fontWeight: "700", marginTop: 12 },
  tagline: { color: COLORS.white, fontSize: 14, marginTop: 4, opacity: 0.9 },
  scrollBody: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  subtitle: { color: COLORS.sub, marginBottom: 20, fontSize: 14 },
  label: { color: COLORS.text, marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 14,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeIcon: { paddingHorizontal: 12 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  statusText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
  },
  statusError: { color: "#b91c1c" },
  statusSuccess: { color: "#15803d" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray200 },
  dividerText: { marginHorizontal: 12, color: COLORS.sub, fontSize: 14 },
  registerButton: {
    borderWidth: 2,
    borderColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  registerButtonText: { color: COLORS.teal, fontWeight: "600", fontSize: 16 },
  footerNote: {
    textAlign: "center",
    color: COLORS.sub,
    marginTop: 20,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
