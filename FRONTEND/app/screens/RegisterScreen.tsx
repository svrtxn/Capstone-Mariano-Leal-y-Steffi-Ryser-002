// src/screens/RegisterScreen.tsx
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
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { authApi } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import type { RegisterRequest } from "../types/auth";

type Props = {
  onRegisterSuccess?: (userId: number) => void;
  onNavigateToLogin?: () => void;
};

export default function RegisterScreen({
  onRegisterSuccess,
  onNavigateToLogin,
}: Props) {
  const insets = useSafeAreaInsets();

  // Datos personales
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState(""); // YYYY-MM-DD

  // Cuenta "normal"
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // LibreLink / sensor
  const [tieneSensor, setTieneSensor] = useState(false);
  const [tipoDiabetes, setTipoDiabetes] = useState<"tipo1" | "tipo2" | null>(
    null
  );

  // Contraseña LibreLink (se usa también como password de la app cuando tieneSensor = true)
  const [librePassword, setLibrePassword] = useState("");
  const [showLibrePassword, setShowLibrePassword] = useState(false);

  // UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mensaje inline (éxito/error)
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null
  );

  // === VALIDACIONES ===
  const emailValid = email.trim() !== "" && email.includes("@");
  const nombreValid = nombre.trim().length >= 2;

  // contraseña efectiva según modo
  const effectivePassword = tieneSensor ? librePassword : password;

  const passwordValid = effectivePassword.length >= 6;

  // Si NO tiene sensor, pedimos confirmación.
  // Si SÍ tiene sensor, no hay confirmación (solo validamos largo).
  const passwordsMatch =
    tieneSensor || (password === confirmPassword && confirmPassword !== "");

  const fechaOk =
    fechaNacimiento.trim() === "" ||
    /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento.trim());

  const isValid =
    nombreValid && emailValid && passwordValid && passwordsMatch && fechaOk;

  const handleRegister = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);
      setStatusMsg("");
      setStatusType(null);

      const finalPassword = effectivePassword; // usa librePassword si tieneSensor = true

      // Construimos el payload según RegisterRequest
      const payload: RegisterRequest = {
        nombre: nombre.trim(),
        apellido: (apellido || "").trim(),
        email: email.trim().toLowerCase(),
        password: finalPassword,
        fecha_nacimiento: fechaNacimiento.trim() || undefined,
        telefono: telefono.trim() || undefined,
        tiene_sensor: tieneSensor,
        tipo_diabetes: tipoDiabetes ?? null,
        // credenciales LibreLink quedan solo en front por ahora
      };

      const response = await authApi.register(payload);

      setStatusType("success");
      setStatusMsg(
        `Cuenta creada exitosamente. ¡Bienvenido, ${response.usuario.nombre}!`
      );

      onRegisterSuccess?.(response.usuario.id);
    } catch (e: any) {
      const errorMsg =
        typeof e?.message === "string"
          ? e.message.replace(/^HTTP \d+ [\w ]+ - /, "")
          : "No se pudo crear la cuenta";

      setStatusType("error");
      setStatusMsg(errorMsg);
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

          {/* Toggle LibreLink al inicio */}
          <View style={s.switchRowTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>¿Usas sensor Libre (LibreLink)?</Text>
              <Text style={s.helperText}>
                Si lo activas, usaremos este correo y contraseña para conectar
                con LibreLink.
              </Text>
            </View>
            <Switch
              value={tieneSensor}
              onValueChange={setTieneSensor}
              thumbColor={tieneSensor ? COLORS.teal : "#f4f3f4"}
              trackColor={{ false: "#d1d5db", true: "#a7f3d0" }}
            />
          </View>

          {/* Nombre */}
          <Text style={s.label}>Nombre</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Juan"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Apellido */}
          <Text style={s.label}>Apellido (opcional)</Text>
          <TextInput
            value={apellido}
            onChangeText={setApellido}
            placeholder="Ej: Pérez"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Email principal (también LibreLink si tieneSensor = true) */}
          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="ejemplo@correo.com"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Si usa sensor, mostramos SOLO la clave LibreLink (que también será la de la app) */}
          {tieneSensor && (
            <View style={{ marginTop: 4 }}>
              <Text style={s.label}>Contraseña LibreLink</Text>
              <View style={s.passwordRow}>
                <TextInput
                  value={librePassword}
                  onChangeText={setLibrePassword}
                  secureTextEntry={!showLibrePassword}
                  placeholder="Contraseña de tu cuenta LibreLink"
                  placeholderTextColor={COLORS.sub}
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
              <Text style={s.helperText}>
                Usaremos esta misma contraseña para tu cuenta GlucoGuard.
              </Text>
            </View>
          )}

          {/* Fecha nacimiento */}
          <Text style={s.label}>Fecha de nacimiento (YYYY-MM-DD)</Text>
          <TextInput
            value={fechaNacimiento}
            onChangeText={setFechaNacimiento}
            placeholder="2000-01-31"
            keyboardType="numeric"
            maxLength={10}
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Teléfono */}
          <Text style={s.label}>Teléfono (opcional)</Text>
          <TextInput
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Ej: +56912345678"
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Si NO usa sensor: contraseña normal + confirmación */}
          {!tieneSensor && (
            <>
              {/* Contraseña */}
              <Text style={s.label}>Contraseña</Text>
              <View style={s.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={COLORS.sub}
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

              {/* Confirmar contraseña */}
              <Text style={s.label}>Confirmar contraseña</Text>
              <View style={s.passwordRow}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={COLORS.sub}
                  style={s.passwordInput}
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  style={s.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color={COLORS.sub}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Tipo de diabetes */}
          <Text style={s.label}>Tipo de diabetes</Text>
          <View style={s.rowChips}>
            {[
              { key: "ninguna", val: null, label: "Ninguna" },
              { key: "tipo1", val: "tipo1" as const, label: "Tipo 1" },
              { key: "tipo2", val: "tipo2" as const, label: "Tipo 2" },
            ].map((opt) => {
              const active =
                (opt.val === null && tipoDiabetes === null) ||
                tipoDiabetes === opt.val;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    s.chip,
                    active && { backgroundColor: COLORS.tealLight },
                  ]}
                  onPress={() =>
                    setTipoDiabetes(
                      opt.val === null ? null : (opt.val as "tipo1" | "tipo2")
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      s.chipText,
                      active && { color: COLORS.teal, fontWeight: "700" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón Crear cuenta */}
          <TouchableOpacity
            style={[s.btn, (!isValid || loading) && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={s.btnText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          {/* Mensaje inline de estado */}
          {statusType && !!statusMsg && (
            <Text style={[s.statusText, statusColorStyle]}>{statusMsg}</Text>
          )}

          {/* Link a login */}
          <View style={s.loginRow}>
            <Text style={s.loginText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={s.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.footerNote}>
            Al registrarte, aceptas nuestros términos de servicio y política de
            privacidad.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: { alignItems: "center" },
  logo: { width: 56, height: 56 },
  brand: { color: COLORS.white, fontSize: 24, fontWeight: "700", marginTop: 6 },
  tagline: { color: COLORS.white, opacity: 0.9, marginTop: 4 },
  scrollBody: { paddingHorizontal: 20, paddingVertical: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  subtitle: {
    fontSize: 14,
    color: COLORS.sub,
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.sub,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
  switchRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rowChips: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: "#F9FAFB",
  },
  chipText: { fontSize: 13, color: COLORS.sub },
  btn: {
    marginTop: 8,
    backgroundColor: COLORS.teal,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
  statusText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
  },
  statusError: { color: "#b91c1c" },
  statusSuccess: { color: "#15803d" },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 4,
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
});
