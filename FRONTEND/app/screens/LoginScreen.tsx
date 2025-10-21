import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { authApi } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onLoginSuccess?: (userId: number) => void;
  onNavigateToRegister?: () => void;
};

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validaciones
  const emailValid = email.trim() !== "" && email.includes("@");
  const passwordValid = password.length >= 6;
  const isValid = emailValid && passwordValid;

  const handleLogin = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);
      const response = await authApi.login({ email: email.trim(), password });

      // Guardar token y usuario (aquí deberías usar AsyncStorage)
      // await AsyncStorage.setItem("authToken", response.token);
      // await AsyncStorage.setItem("userId", response.usuario.id.toString());

      const msg = `¡Bienvenido, ${response.usuario.nombre}!`;
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Inicio exitoso", msg);

      onLoginSuccess?.(response.usuario.id);
    } catch (e: any) {
      const errorMsg = e?.message ?? "No se pudo iniciar sesión";
      Platform.OS === "web" ? window.alert(`Error\n\n${errorMsg}`) : Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.screen}>
      {/* Header con logo */}
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

          {/* Input Email */}
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

          {/* Input Password */}
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

          {/* Forgot password */}
          <TouchableOpacity activeOpacity={0.7} style={s.forgotContainer}>
            <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón Login */}
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

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>O</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Botón Registrarse */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateToRegister}
            style={s.registerButton}
          >
            <Text style={s.registerButtonText}>Crear cuenta nueva</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footerNote}>
          Al continuar, aceptas nuestros términos de servicio y política de privacidad.
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
  forgotContainer: { alignSelf: "flex-end", marginBottom: 6 },
  forgotText: { color: COLORS.teal, fontSize: 14, fontWeight: "500" },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
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