// src/screens/AmigosScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { contactosApi } from "../services/api";

type TipoContacto = "familiar" | "amigo" | "profesional" | "medico";

export default function AmigosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Formulario
  const [nombreContacto, setNombreContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [tipoContacto, setTipoContacto] = useState<TipoContacto | null>(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

  // Validaciones simples
  const nombreValid = nombreContacto.trim().length >= 2;
  const emailValid = emailContacto.trim() !== "" && emailContacto.includes("@");
  const tipoValid = !!tipoContacto;

  const isValid = nombreValid && emailValid && tipoValid && !loading;

  // =======================================================================
  // ✨ MISMA LÓGICA DE ForgotPasswordScreen PARA PREVIEW ETHEREAL
  // =======================================================================
  const handleInvite = async () => {
    if (!isValid || loading) return;

    // 👇 Apertura en blanco ANTES del await (solo web)
    let previewTab: Window | null = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      previewTab = window.open("", "_blank"); // pestaña segura
    }

    try {
      setLoading(true);
      setStatusMsg("");
      setStatusType(null);

      const resp = await contactosApi.invitarContacto({
        nombre_contacto: nombreContacto.trim(),
        email_contacto: emailContacto.trim().toLowerCase(),
        telefono_contacto: telefonoContacto.trim() || undefined,
        tipo_contacto: tipoContacto || "familiar",
      });

      // ------------------------
      // UI de éxito
      // ------------------------
      setStatusType("success");
      setStatusMsg(
        resp?.msg ||
          `Invitación enviada correctamente a ${nombreContacto.trim()}.`
      );

      // =======================================================================
      // 🌐 Apertura automática del correo estilo ForgotPasswordScreen
      // =======================================================================
      if (resp?.previewURL) {
        if (Platform.OS === "web") {
          if (previewTab) {
            previewTab.location.href = resp.previewURL;
          }
        } else {
          Linking.openURL(resp.previewURL).catch(() => {});
        }
      } else {
        // si no vino previewURL, cerramos la pestaña vacía
        if (previewTab) previewTab.close();
      }

      // limpiar campos
      setNombreContacto("");
      setEmailContacto("");
      setTelefonoContacto("");
    } catch (e: any) {
      if (Platform.OS === "web" && previewTab) previewTab.close();

      const msg =
        e?.message?.replace(/^HTTP \d+ [\w ]+ - /, "") ||
        "No se pudo enviar la invitación.";

      setStatusType("error");
      setStatusMsg(msg);
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
        style={[s.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={s.headerInner}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={s.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>

          <Image
            source={require("../../assets/images/glucoguard_logo_blanco.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.title}>Comunidad</Text>
          <Text style={s.subtitle}>Amigos y red de apoyo</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>Invitar contacto de apoyo</Text>
          <Text style={s.text}>
            Agrega personas de confianza que podrán ayudarte supervisando tus
            niveles de glucosa.
          </Text>

          {/* Nombre */}
          <Text style={s.label}>Nombre del contacto</Text>
          <TextInput
            value={nombreContacto}
            onChangeText={setNombreContacto}
            placeholder="Ej: Juana Gómez"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Email */}
          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            value={emailContacto}
            onChangeText={setEmailContacto}
            placeholder="correo@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Teléfono */}
          <Text style={s.label}>Teléfono (opcional)</Text>
          <TextInput
            value={telefonoContacto}
            onChangeText={setTelefonoContacto}
            placeholder="+56912345678"
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Tipo de contacto */}
          <Text style={s.label}>Relación con el contacto</Text>
          <View style={s.rowChips}>
            {[
              { key: "familiar", label: "Familiar" },
              { key: "amigo", label: "Amigo" },
              { key: "profesional", label: "Profesional" },
              { key: "medico", label: "Médico" },
            ].map((opt) => {
              const active = tipoContacto === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setTipoContacto(opt.key as TipoContacto)}
                  style={[s.chip, active && { backgroundColor: COLORS.tealLight }]}
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

          {/* Botón */}
          <TouchableOpacity
            onPress={handleInvite}
            disabled={!isValid || loading}
            activeOpacity={0.85}
            style={[s.btn, (!isValid || loading) && { opacity: 0.6 }]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={s.btnText}>Enviar invitación</Text>
            )}
          </TouchableOpacity>

          {/* Mensaje Inline */}
          {statusType && !!statusMsg && (
            <Text style={[s.statusText, statusColorStyle]}>{statusMsg}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: { alignItems: "center", position: "relative" },
  backButton: {
    position: "absolute",
    left: 8,
    top: 8,
    padding: 8,
    zIndex: 10,
  },
  logo: { width: 52, height: 52 },
  title: { color: COLORS.white, fontSize: 22, fontWeight: "700", marginTop: 8 },
  subtitle: { color: COLORS.white, opacity: 0.9, marginTop: 4 },
  body: { paddingHorizontal: 20, paddingVertical: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  text: { color: COLORS.sub, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  label: { color: COLORS.text, marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  rowChips: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  },
  chipText: { fontSize: 13, color: COLORS.sub },
  btn: {
    marginTop: 8,
    backgroundColor: COLORS.teal,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
  statusText: { marginTop: 8, fontSize: 13, textAlign: "center" },
  statusError: { color: "#b91c1c" },
  statusSuccess: { color: "#15803d" },
});
