// src/screens/UmbralesScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../constants/config";
import { getCurrentUserId } from "../services/session";

type UserConfig = {
  config_id?: number;
  usuario_id: number;
  hipo_min: number;
  normal_min: number;
  normal_max: number;
  hiper_max: number;
  frecuencia_medicion: number;
  notificaciones: 0 | 1;
  zona_horaria: string;
  idioma: string;
  fecha_actualizacion?: string;
};

const CONFIG_BASE = "/config";

export default function UmbralesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  const [hipoMin, setHipoMin] = useState("70");
  const [normalMin, setNormalMin] = useState("70");
  const [normalMax, setNormalMax] = useState("140");
  const [hiperMax, setHiperMax] = useState("180");
  const [freq, setFreq] = useState("240");
  const [notifOn, setNotifOn] = useState(true);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ============================
  // CARGA DE CONFIGURACIÓN
  // ============================
  useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      try {
        const uid = await getCurrentUserId();
        if (!uid) {
          router.replace("/");
          return;
        }

        const res = await fetch(`${BASE_URL}${CONFIG_BASE}/${uid}`);

        if (!res.ok) {
          setHasConfig(false);
          return;
        }

        const raw = await res.json().catch(() => null);
        if (!mounted || !raw) return;

        const data: UserConfig =
          Array.isArray(raw) && raw.length > 0 ? raw[0] : (raw as UserConfig);

        setHasConfig(true);

        setHipoMin(String(data.hipo_min));
        setNormalMin(String(data.normal_min));
        setNormalMax(String(data.normal_max));
        setHiperMax(String(data.hiper_max));
        setFreq(String(data.frecuencia_medicion));
        setNotifOn(data.notificaciones === 1);
      } catch (err) {
        setHasConfig(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  // ============================
  // GUARDAR CONFIGURACIÓN
  // ============================
  const handleSave = async () => {
    try {
      const uid = await getCurrentUserId();
      if (!uid) {
        router.replace("/");
        return;
      }

      const hipo = Number(hipoMin);
      const nMin = Number(normalMin);
      const nMax = Number(normalMax);
      const hiper = Number(hiperMax);
      const f = Number(freq);

      // ===== 1) Validación básica: deben ser números =====
      if ([hipo, nMin, nMax, hiper, f].some((v) => Number.isNaN(v))) {
        setSaveMessage("❌ Debes ingresar solo números.");
        return;
      }

      // ===== 2) Prevención de valores absurdos =====
      if (
        hipo < 40 ||
        hipo > 200 ||
        nMin < 40 ||
        nMin > 250 ||
        nMax < 40 ||
        nMax > 350 ||
        hiper < 60 ||
        hiper > 600 ||
        f < 5 ||
        f > 720
      ) {
        setSaveMessage("❌ Valores fuera de rango razonable.");
        return;
      }

      // ===== 3) Validar coherencia entre los rangos =====
      if (!(hipo <= nMin && nMin <= nMax && nMax <= hiper)) {
        setSaveMessage(
          "❌ Debe cumplirse: hipo ≤ normal_min ≤ normal_max ≤ hiper."
        );
        return;
      }

      setSaving(true);
      setSaveMessage(null);

      const body: Partial<UserConfig> = {
        usuario_id: uid,
        hipo_min: hipo,
        normal_min: nMin,
        normal_max: nMax,
        hiper_max: hiper,
        frecuencia_medicion: f,
        notificaciones: notifOn ? 1 : 0,
        zona_horaria: "America/Santiago",
        idioma: "es",
      };

      const method = hasConfig ? "PUT" : "POST";
      const url = `${BASE_URL}${CONFIG_BASE}/${uid}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.json().catch(() => null);
      if (!res.ok || (raw && raw.ok === false)) {
        throw new Error(raw?.mensaje || "Error al guardar");
      }

      // 🔥 RELEER CONFIG DESDE EL BACKEND
      const refresh = await fetch(`${BASE_URL}${CONFIG_BASE}/${uid}`).then((r) =>
        r.json()
      );
      const updated = Array.isArray(refresh) ? refresh[0] : refresh;

      // 🔥 ACTUALIZAR FORMULARIO
      setHipoMin(String(updated.hipo_min));
      setNormalMin(String(updated.normal_min));
      setNormalMax(String(updated.normal_max));
      setHiperMax(String(updated.hiper_max));
      setFreq(String(updated.frecuencia_medicion));
      setNotifOn(updated.notificaciones === 1);

      setHasConfig(true);

      // Mensaje informativo
      setSaveMessage("✔ Cambios guardados correctamente");
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      setSaveMessage("❌ Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // RENDER
  // ============================
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
            onPress={() => router.replace("/home")}
            style={s.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={s.backButtonText}>←</Text>
          </TouchableOpacity>

          <Image
            source={require("../../assets/images/glucoguard_logo_blanco.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.title}>Umbrales de glucosa</Text>
          <Text style={s.subtitle}>Configuración personalizada</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.body}>
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.teal} />
            <Text style={s.loadingText}>Cargando configuración...</Text>
          </View>
        ) : (
          <>
            {/* --- CARD UMBRALES --- */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Umbrales de glucosa</Text>

              <View style={s.inputGroup}>
                <Text style={s.label}>Hipoglucemia (por debajo de)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={hipoMin}
                  onChangeText={setHipoMin}
                />
              </View>

              <View style={s.inputRow}>
                <View style={s.inputCol}>
                  <Text style={s.label}>Inicio rango normal</Text>
                  <TextInput
                    style={s.input}
                    keyboardType="numeric"
                    value={normalMin}
                    onChangeText={setNormalMin}
                  />
                </View>

                <View style={s.inputCol}>
                  <Text style={s.label}>Fin rango normal</Text>
                  <TextInput
                    style={s.input}
                    keyboardType="numeric"
                    value={normalMax}
                    onChangeText={setNormalMax}
                  />
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.label}>Hiperglucemia (por sobre)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={hiperMax}
                  onChangeText={setHiperMax}
                />
              </View>
            </View>

            {/* --- CARD NOTIFICACIONES --- */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Recordatorios y notificaciones</Text>

              <View style={s.inputGroup}>
                <Text style={s.label}>Frecuencia de medición (min)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={freq}
                  onChangeText={setFreq}
                />
              </View>

              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Recibir notificaciones</Text>
                  <Text style={s.switchHelp}>
                    Activa para recibir recordatorios y alertas fuera de rango.
                  </Text>
                </View>

                <Switch
                  value={notifOn}
                  onValueChange={setNotifOn}
                  thumbColor={notifOn ? COLORS.teal : "#f4f3f4"}
                  trackColor={{ false: "#d1d5db", true: "#a7f3d0" }}
                />
              </View>
            </View>

            {/* --- BOTÓN GUARDAR --- */}
            <TouchableOpacity
              style={[s.saveButton, saving && { opacity: 0.7 }]}
              disabled={saving}
              onPress={handleSave}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color={COLORS.white} />
                  <Text style={s.saveText}>Guardar cambios</Text>
                </>
              )}
            </TouchableOpacity>

            {/* --- MENSAJE DE ESTADO --- */}
            {saveMessage && (
              <Text
                style={[
                  s.saveMessage,
                  saveMessage.startsWith("❌") && { color: "#ef4444" },
                ]}
              >
                {saveMessage}
              </Text>
            )}
          </>
        )}
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
    left: 16,
    top: 16,
    padding: 8,
    zIndex: 10,
  },
  backButtonText: { color: COLORS.white, fontSize: 24, fontWeight: "600" },
  logo: { width: 52, height: 52 },
  title: { color: COLORS.white, fontSize: 22, fontWeight: "700", marginTop: 8 },
  subtitle: { color: COLORS.white, opacity: 0.9, marginTop: 4 },
  body: { paddingHorizontal: 20, paddingVertical: 20 },
  loadingBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  loadingText: { marginTop: 8, color: COLORS.sub },
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  inputGroup: { marginBottom: 12 },
  inputRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  inputCol: { flex: 1 },
  label: { fontSize: 13, color: COLORS.sub, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  switchHelp: { fontSize: 12, color: COLORS.sub, marginTop: 2 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  saveMessage: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.teal,
  },
});
