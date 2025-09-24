import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Switch,
  Platform,
  ScrollView,
  StyleSheet,
  Alert, // 👈 NUEVO: para mostrar el mensaje de confirmación
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const COLORS = {
  teal: "#1FA3AF",
  tealLight: "#54C6D3",
  text: "#111827",
  sub: "#6B7280",
  bg: "#F8FAFC",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  white: "#FFFFFF",
};

function formatTime(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function IndexScreen() {
  const insets = useSafeAreaInsets(); // respeta notch/Dynamic Island

  const [glucose, setGlucose] = useState("");
  const [time, setTime] = useState(new Date());
  const [showTime, setShowTime] = useState(false);
  const [med, setMed] = useState(false);
  const [notes, setNotes] = useState("");

  const glucoseNumber = Number(glucose);
  const isValid =
    glucose.trim() !== "" && !Number.isNaN(glucoseNumber) && glucoseNumber > 0;

  const onSubmit = () => {
    if (!isValid) return;

    const payload = {
      glucose: glucoseNumber,
      time: formatTime(time),
      med,
      notes,
    };

    console.log("Registro guardado →", payload);

    // 👇 Confirmación visible al usuario
    Alert.alert(
      "Registro guardado",
      `Se ingresaron los datos correctamente:\n\n• Glucosa: ${payload.glucose} mg/dL\n• Hora: ${payload.time}\n• Medicación: ${payload.med ? "Sí" : "No"}${
        payload.notes ? `\n• Notas: ${payload.notes}` : ""
      }`,
      [
        {
          text: "OK",
          onPress: () => {
            // Reset del formulario tras confirmar
            setGlucose("");
            setTime(new Date());
            setMed(false);
            setNotes("");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      {/* HEADER con degradado y safe area */}
      <LinearGradient
        colors={[COLORS.teal, COLORS.tealLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          { paddingTop: insets.top + 16 }, // espacio seguro superior
        ]}
      >
        <View style={styles.headerInner}>
          {/* Ajusta la ruta del logo si lo tienes en otra carpeta */}
          <Image
            source={require("../assets/images/glucoguard_logo_blanco.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>GlucoGuard</Text>
        </View>
      </LinearGradient>

      {/* CARD del formulario */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { marginTop: 30 }, // sube la tarjeta sin tapar el subtítulo
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Registro de Control de Glucosa</Text>
          <Text style={styles.subtitle}>
            Monitorea y gestiona tus niveles fácilmente.
          </Text>

          {/* Nivel de glucosa */}
          <Text style={styles.label}>Nivel de glucosa actual (mg/dL)</Text>
          <TextInput
            value={glucose}
            onChangeText={setGlucose}
            keyboardType="numeric"
            placeholder="Ej: 110"
            placeholderTextColor={COLORS.sub}
            style={styles.input}
          />

          {/* Hora de la medición */}
          <Text style={styles.label}>Hora de la medición</Text>
          <TouchableOpacity
            onPress={() => setShowTime(true)}
            activeOpacity={0.7}
            style={styles.input}
          >
            <Text style={styles.timeText}>{formatTime(time)}</Text>
          </TouchableOpacity>

          {showTime && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selected) => {
                setShowTime(false);
                if (selected) setTime(selected);
              }}
            />
          )}

          {/* ¿Tomaste insulina/medicación? */}
          <View style={styles.switchRow}>
            <Text style={styles.label}>¿Tomaste insulina/medicación?</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.switchText}>{med ? "Sí" : "No"}</Text>
              <Switch
                value={med}
                onValueChange={setMed}
                thumbColor={COLORS.white}
                trackColor={{ false: COLORS.gray200, true: COLORS.teal }}
              />
            </View>
          </View>

          {/* Notas */}
          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Añade cualquier observación"
            placeholderTextColor={COLORS.sub}
            style={[styles.input, styles.textarea]}
            multiline
          />

          {/* Botón guardar (degradado) */}
          <TouchableOpacity
            disabled={!isValid}
            activeOpacity={0.85}
            onPress={onSubmit}
            style={{ marginTop: 6 }}
          >
            <LinearGradient
              colors={
                isValid
                  ? [COLORS.teal, COLORS.tealLight]
                  : [COLORS.gray200, COLORS.gray200]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, !isValid && { opacity: 0.8 }]}
            >
              <Text style={styles.buttonText}>Guardar registro</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Tus datos están protegidos con GlucoGuard.
          </Text>
        </View>
      </ScrollView>

      {/* Status bar clara sobre el degradado */}
      <StatusBar style="light" translucent />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: { alignItems: "center" },
  logo: { width: 56, height: 56 },
  brand: { color: COLORS.white, fontSize: 22, fontWeight: "600", marginTop: 8 },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 28 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    // sombra iOS
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    // sombra Android
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: "600", color: COLORS.text, marginBottom: 4 },
  subtitle: { color: COLORS.sub, marginBottom: 16 },
  label: { color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  textarea: { height: 110, textAlignVertical: "top" },
  timeText: { fontSize: 16, color: COLORS.text },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  switchText: { color: COLORS.sub, marginRight: 8 },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  footerNote: { textAlign: "center", color: COLORS.sub, marginTop: 12 },
});
