import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Switch, Platform, Alert, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";
import { formatTime, toISOWithToday } from "../app/utils/datetime";
import { glucoseApi } from "../app/services/api";
import { CURRENT_USER_ID } from "../constants/config";

type Props = { onSaved?: () => void };




export default function GlucoseForm({ onSaved }: Props) {
  const [glucose, setGlucose] = useState("");
  const [time, setTime] = useState(new Date());
  const [showTime, setShowTime] = useState(false);
  const [med, setMed] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [glucoseError, setGlucoseError] = useState<string | null>(null); // Nuevo estado para error

  const glucoseNumber = Number(glucose);
  const isValid =
    glucose.trim() !== "" &&
    !Number.isNaN(glucoseNumber) &&
    glucoseNumber >= 40 &&
    glucoseNumber <= 400;

  // Validación en el cambio de texto
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
      const payload = {
        usuario_id: CURRENT_USER_ID,
        valor_glucosa: glucoseNumber,
        unidad: "mg/dL" as const,
        metodo_registro: "manual" as const,
        origen_sensor: null,
        fecha_registro: toISOWithToday(time),
        etiquetado: null,
        notas: med ? (notes ? `${notes} | medicación: sí` : "medicación: sí") : notes || null,
        registrado_por: CURRENT_USER_ID,
      };
      const created = await glucoseApi.create(payload);

      // reset
      setGlucose(""); setTime(new Date()); setMed(false); setNotes("");

      const hora = created?.fecha_registro ? new Date(created.fecha_registro).toLocaleTimeString() : formatTime(time);
      const msg = `• Glucosa: ${created?.valor_glucosa ?? glucoseNumber} mg/dL\n• Hora: ${hora}\n• Medicación: ${med ? "Sí" : "No"}${created?.notas ? `\n• Notas: ${created.notas}` : ""}`;

      Platform.OS === "web" ? window.alert(`Registro guardado\n\n${msg}`) : Alert.alert("Registro guardado", msg);
      onSaved?.();
    } catch (e: any) {
      const m = e?.message ?? "No se pudo guardar";
      Platform.OS === "web" ? window.alert(`Error\n\n${m}`) : Alert.alert("Error", m);
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
      {glucoseError && (
        <Text style={{ color: "red", marginBottom: 8 }}>{glucoseError}</Text>
      )}

      <Text style={s.label}>Hora de la medición</Text>
      <TouchableOpacity onPress={() => setShowTime(true)} activeOpacity={0.7} style={s.input}>
        <Text style={s.timeText}>{formatTime(time)}</Text>
      </TouchableOpacity>

      {showTime && (
        <DateTimePicker value={time} mode="time" is24Hour display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selected) => { setShowTime(false); if (selected) setTime(selected); }} />
      )}

      <View style={s.switchRow}>
        <Text style={s.label}>¿Tomaste insulina/medicación?</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={s.switchText}>{med ? "Sí" : "No"}</Text>
          <Switch value={med} onValueChange={setMed} thumbColor={COLORS.white}
            trackColor={{ false: COLORS.gray200, true: COLORS.teal }} />
        </View>
      </View>

      <Text style={s.label}>Notas adicionales</Text>
      <TextInput value={notes} onChangeText={setNotes} placeholder="Añade cualquier observación"
        placeholderTextColor={COLORS.sub} style={[s.input, s.textarea]} multiline />

      <TouchableOpacity disabled={!isValid || submitting} activeOpacity={0.85} onPress={onSubmit} style={{ marginTop: 6 }}>
        <LinearGradient colors={isValid && !submitting ? [COLORS.teal, COLORS.tealLight] : [COLORS.gray200, COLORS.gray200]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.button, (!isValid || submitting) && { opacity: 0.8 }]}>
          <Text style={s.buttonText}>Guardar registro</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={s.footerNote}>Tus datos están protegidos con GlucoGuard.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.gray200,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  title: { fontSize: 20, fontWeight: "600", color: COLORS.text, marginBottom: 4 },
  subtitle: { color: COLORS.sub, marginBottom: 16 },
  label: { color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.text, marginBottom: 12 },
  textarea: { height: 110, textAlignVertical: "top" },
  timeText: { fontSize: 16, color: COLORS.text },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  switchText: { color: COLORS.sub, marginRight: 8 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  footerNote: { textAlign: "center", color: COLORS.sub, marginTop: 12 },
});
