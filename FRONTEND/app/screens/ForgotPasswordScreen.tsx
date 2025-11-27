import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { authApi } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // 👈 NUEVO

type Props = { onDone?: () => void };

export default function ForgotPasswordScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter(); // 👈 NUEVO
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const correo = email.trim().toLowerCase();
    if (!correo) {
      Alert.alert("Recuperar contraseña", "Ingresa tu correo.");
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.requestPasswordReset(correo);

      // Mensaje genérico (evita filtrar validez del correo por UI)
      const msg = res?.ok
        ? "Si el correo existe, enviamos un email con el enlace para restablecer la contraseña."
        : res?.mensaje || "Solicitud enviada.";

      // Si backend devuelve previewURL (Ethereal) la abrimos en web
      if (res?.previewURL && Platform.OS === "web") {
        try {
          window.open(res.previewURL, "_blank");
        } catch {
          // Ignorar errores de popup bloqueado
        }
      }

      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Listo", msg);
      onDone?.();
    } catch (e: any) {
      const err =
        e?.message?.replace(/^HTTP \d+ [\w ]+ - /, "") ||
        "Error al enviar el correo.";
      Platform.OS === "web" ? window.alert(err) : Alert.alert("Error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onDone) {
      onDone();         
    } else {
      router.back();     
    }
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top + 16 }]}>
      <LinearGradient
        colors={[COLORS.teal, COLORS.tealLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerRow}>
          {/* Flecha para volver */}
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={s.headerTextWrap}>
            <Text style={s.headerTitle}>Recuperar contraseña</Text>
            <Text style={s.headerSub}>
              Ingresa tu correo y te enviaremos un enlace.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={s.body}>
        <Text style={s.label}>Correo electrónico</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="ejemplo@correo.com"
          placeholderTextColor={COLORS.sub}
          autoCapitalize="none"
          keyboardType="email-address"
          style={s.input}
        />

        <TouchableOpacity onPress={handleSend} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.teal, COLORS.tealLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.button}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={s.buttonText}>Enviar</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSub: {
    color: COLORS.white,
    opacity: 0.9,
    fontSize: 14,
  },
  body: {
    padding: 20,
    gap: 12,
  },
  label: {
    color: COLORS.text,
    fontWeight: "500",
  },
  input: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
});
