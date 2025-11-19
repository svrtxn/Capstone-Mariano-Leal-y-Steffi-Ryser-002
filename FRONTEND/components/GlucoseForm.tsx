import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";
import { toISOWithToday } from "../app/utils/datetime";
import { glucoseApi } from "app/services/api";
import { getCurrentUserId } from "app/services/session";

type Props = { onSaved?: () => void };

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GlucoseForm({ onSaved }: Props) {
  const [glucose, setGlucose] = useState("");
  const [time, setTime] = useState(new Date());
  const [showTime, setShowTime] = useState(false);
  const [med, setMed] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [glucoseError, setGlucoseError] = useState<string | null>(null);

  // 🎉 Nuevo mensaje no modal
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserId().then((id) => console.log("DEBUG gg:user_id =", id));
  }, []);

  const glucoseNumber = Number(glucose);
  const isValid =
    glucose.trim() !== "" &&
    !Number.isNaN(glucoseNumber) &&
    glucoseNumber >= 40 &&
    glucoseNumber <= 400;

  const handleGlucoseChange = (value: string) => {
    setGlucose(value);
    const num = Number(value);

    if (value.trim() === "" || Number.isNaN(num)) {
      setGlucoseError(null);
    } else if (num < 40) {
      setGlucoseError("El valor mínimo permitido es 40 mg/dL");
    } else if (num > 400) {
      setGlucoseError("El valor máximo permitido es 400 mg/dL");
    } else {
      setGlucoseError(null);
    }
  };

  const onSubmit = async () => {
    if (!isValid || submitting) return;

    try {
      setSubmitting(true);
      setSaveMessage(null);

      const payload = {
        valor_glucosa: glucoseNumber,
        unidad: "mg/dL" as const,
        metodo_registro: "manual" as const,
        origen_sensor: null,
        fecha_registro: toISOWithToday(time),
        etiquetado: null,
        notas: med ? (notes ? `${notes} | medicación: sí` : "medicación: sí") : notes || null,
      };

      console.log("DEBUG payload =", payload);

      const created = await glucoseApi.create(payload);

      // reset UI
      setGlucose("");
      setTime(new Date());
      setMed(false);
      setNotes("");

      const hora = created?.fecha_registro
        ? new Date(created.fecha_registro).toLocaleTimeString()
        : formatTime(time);

      const msg = `✔ Glucosa registrada: ${created?.valor_glucosa ?? glucoseNumber} mg/dL a las ${hora}`;

      // 🎉 Ahora mensaje elegante, NO alerta
      setSaveMessage(msg);
      setTimeout(() => setSaveMessage(null), 4000);

      onSaved?.();      
    } catch (e: any) {
      const m = e?.message ?? "Error desconocido";
      setSaveMessage(`❌ ${m}`);
      setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.card}>
      <Text style={s.title}>Registro de Control de Glucosa</Text>
      <Text style={s.subtitle}>Monitorea y gestiona tus niveles fácilmente.</Text>

      <Text style={s.label}>Nivel de glucosa actual (mg/dL)</Text>
      <TextInput
        value={glucose}
        onChangeText={handleGlucoseChange}
        keyboardType="numeric"
        placeholder="Ej: 110"
        placeholderTextColor={COLORS.sub}
        style={s.input}
      />
      {glucoseError && <Text style={s.errorText}>{glucoseError}</Text>}

      <Text style={s.label}>Hora de la medición</Text>
      <TouchableOpacity onPress={() => setShowTime(true)} style={s.input}>
        <Text style={s.timeText}>{formatTime(time)}</Text>
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

      <View style={s.switchRow}>
        <Text style={s.label}>¿Tomaste insulina/medicación?</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={s.switchText}>{med ? "Sí" : "No"}</Text>
          <Switch
            value={med}
            onValueChange={setMed}
            thumbColor={COLORS.white}
            trackColor={{ false: COLORS.gray200, true: COLORS.teal }}
          />
        </View>
      </View>

      <Text style={s.label}>Notas adicionales</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Añade cualquier observación"
        placeholderTextColor={COLORS.sub}
        style={[s.input, s.textarea]}
        multiline
      />

      <TouchableOpacity
        disabled={!isValid || submitting}
        activeOpacity={0.85}
        onPress={onSubmit}
        style={{ marginTop: 6 }}
      >
        <LinearGradient
          colors={
            isValid && !submitting
              ? [COLORS.teal, COLORS.tealLight]
              : [COLORS.gray200, COLORS.gray200]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.button, (!isValid || submitting) && { opacity: 0.7 }]}
        >
          <Text style={s.buttonText}>
            {submitting ? "Guardando..." : "Guardar registro"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* 🎉 Mensaje elegante */}
      {saveMessage && (
        <Text
          style={[
            s.saveMsg,
            saveMessage.startsWith("❌") && { color: "#ef4444" },
          ]}
        >
          {saveMessage}
        </Text>
      )}

      <Text style={s.footerNote}>Tus datos están protegidos con GlucoGuard.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
  errorText: { color: "red", marginBottom: 8 },
  textarea: { height: 110, textAlignVertical: "top" },
  timeText: { fontSize: 16, color: COLORS.text },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  switchText: { color: COLORS.sub, marginRight: 8 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  saveMsg: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.teal,
  },
  footerNote: {
    textAlign: "center",
    color: COLORS.sub,
    marginTop: 12,
  },
});
