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
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { authApi } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onRegisterSuccess?: (userId: number) => void;
  onNavigateToLogin?: () => void;
};

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }: Props) {
  const insets = useSafeAreaInsets();

  // Datos personales
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Datos de salud / cuenta
  const [fechaNacimiento, setFechaNacimiento] = useState(""); // YYYY-MM-DD
  const [telefono, setTelefono] = useState("");
  const [tieneSensor, setTieneSensor] = useState(false);
  const [tipoDiabetes, setTipoDiabetes] = useState<"tipo1" | "tipo2" | null>(null);

  // UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validaciones
  const [libreEmail, setLibreEmail] = useState("");
  const [librePassword, setLibrePassword] = useState("");
  const [showLibrePassword, setShowLibrePassword] = useState(false);
  const emailValid = email.trim() !== "" && email.includes("@");
  const nombreValid = nombre.trim().length >= 2;
  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";
  const fechaOk =
    fechaNacimiento.trim() === "" ||
    /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento.trim());

  const isValid =
    nombreValid && emailValid && passwordValid && passwordsMatch && fechaOk;

  const handleRegister = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);

      const payload = {
        nombre: nombre.trim(),
        apellido: (apellido || "").trim(),
        email: email.trim().toLowerCase(),
        password,
        fecha_nacimiento: fechaNacimiento.trim() || undefined,
        tipo_diabetes: tipoDiabetes,           // "tipo1" | "tipo2" | null
        telefono: telefono.trim() || undefined,
        rol: "diabetico",                      // ← fijo
        tiene_sensor: tieneSensor,
        libreEmail: libreEmail.trim() || undefined,
        librePassword: librePassword || undefined,
      } as any;

      const response = await authApi.register(payload);

      const msg = `¡Cuenta creada exitosamente!\n\nBienvenido, ${response.usuario.nombre}`;
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Registro exitoso", msg);

      onRegisterSuccess?.(response.usuario.id);
    } catch (e: any) {
      const errorMsg =
        typeof e?.message === "string"
          ? e.message.replace(/^HTTP \d+ [\w ]+ - /, "")
          : "No se pudo crear la cuenta";
      Platform.OS === "web"
        ? window.alert(`Error\n\n${errorMsg}`)
        : Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.screen}>
      {/* Header */}
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
          <Text style={s.tagline}>Comienza tu registro de salud</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.scrollBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.title}>Crear Cuenta</Text>
          <Text style={s.subtitle}>Completa tus datos para comenzar</Text>

          {/* Nombre */}
          <Text style={s.label}>Nombre</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Juan"
            placeholderTextColor={COLORS.sub}
            autoCapitalize="words"
            style={s.input}
          />

          {/* Apellido */}
          <Text style={s.label}>Apellido</Text>
          <TextInput
            value={apellido}
            onChangeText={setApellido}
            placeholder="Pérez"
            placeholderTextColor={COLORS.sub}
            autoCapitalize="words"
            style={s.input}
          />

          {/* Email */}
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

          {/* Fecha de nacimiento */}
          <Text style={s.label}>Fecha de nacimiento (YYYY-MM-DD)</Text>
          <TextInput
            value={fechaNacimiento}
            onChangeText={setFechaNacimiento}
            placeholder="2000-01-31"
            placeholderTextColor={COLORS.sub}
            autoCapitalize="none"
            style={s.input}
          />
          {!fechaOk && (
            <Text style={s.errorText}>Formato de fecha inválido (YYYY-MM-DD)</Text>
          )}

          {/* Teléfono */}
          <Text style={s.label}>Teléfono (opcional)</Text>
          <TextInput
            value={telefono}
            onChangeText={setTelefono}
            placeholder="+56 9 1234 5678"
            placeholderTextColor={COLORS.sub}
            keyboardType="phone-pad"
            style={s.input}
          />

          <View style={s.switchLine}>
              <Text style={s.label}>¿Tiene sensor Libre?</Text>
              <Switch value={tieneSensor} onValueChange={setTieneSensor} />
            </View>

            {/* Credenciales LibreLink (solo si tieneSensor = true) */}
            {tieneSensor && (
              <View style={s.libreGroup}>
                <Text style={s.label}>Correo LibreLink</Text>
                <TextInput
                  value={libreEmail}
                  onChangeText={setLibreEmail}
                  placeholder="correo@librelink.com"
                  placeholderTextColor={COLORS.sub}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={s.input}
                />

                <Text style={s.label}>Contraseña LibreLink</Text>
                <View style={s.passwordContainer}>
                  <TextInput
                    value={librePassword}
                    onChangeText={setLibrePassword}
                    placeholder="Tu contraseña de LibreLink"
                    placeholderTextColor={COLORS.sub}
                    secureTextEntry={!showLibrePassword}
                    autoCapitalize="none"
                    style={s.passwordInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowLibrePassword(!showLibrePassword)}
                    style={s.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showLibrePassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={COLORS.sub}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

          {/* Tipo de diabetes */}
          <Text style={s.label}>Tipo de diabetes</Text>
          <View style={s.rowChips}>
            {[
              { key: "ninguna", val: null, label: "Ninguna" },
              { key: "tipo1", val: "tipo1", label: "Tipo 1" },
              { key: "tipo2", val: "tipo2", label: "Tipo 2" },
            ].map((opt) => {
              const active =
                (opt.val === null && tipoDiabetes === null) ||
                tipoDiabetes === opt.val;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setTipoDiabetes(opt.val as any)}
                  activeOpacity={0.85}
                  style={[s.chip, active && s.chipActive]}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Password */}
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

          {/* Confirm Password */}
          <Text style={s.label}>Confirmar contraseña</Text>
          <View style={s.passwordContainer}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite tu contraseña"
              placeholderTextColor={COLORS.sub}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              style={s.passwordInput}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={s.eyeIcon}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={COLORS.sub}
              />
            </TouchableOpacity>
          </View>

          {confirmPassword !== "" && !passwordsMatch && (
            <Text style={s.errorText}>Las contraseñas no coinciden</Text>
          )}

          {/* Botón Registrarse */}
          <TouchableOpacity
            disabled={!isValid || loading}
            activeOpacity={0.85}
            onPress={handleRegister}
            style={{ marginTop: 16 }}
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
                <Text style={s.buttonText}>Crear cuenta</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Ya tienes cuenta */}
          <View style={s.loginContainer}>
            <Text style={s.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
              <Text style={s.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.footerNote}>
          Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
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
  rowChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gray300 ?? "#E5E7EB",
    backgroundColor: COLORS.gray100,
  },
  chipActive: {
    backgroundColor: COLORS.tealLight,
    borderColor: COLORS.teal,
  },
  chipText: { color: COLORS.text },
  chipTextActive: { color: COLORS.white, fontWeight: "700" },
  switchLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeIcon: { paddingHorizontal: 12 },
  errorText: { color: "#EF4444", fontSize: 13, marginTop: -10, marginBottom: 10 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: { color: COLORS.sub, fontSize: 14 },
  loginLink: { color: COLORS.teal, fontSize: 14, fontWeight: "600" },
  footerNote: {
    textAlign: "center",
    color: COLORS.sub,
    marginTop: 20,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  libreGroup: {
  marginBottom: 14,
},
});
