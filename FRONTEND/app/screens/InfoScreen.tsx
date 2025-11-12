// src/screens/InfoScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";

export default function InfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
            <Text style={s.backButtonText}>←</Text>
          </TouchableOpacity>

          <Image
            source={require("../../assets/images/glucoguard_logo_blanco.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.brand}>GlucoGuard</Text>
          <Text style={s.subtitle}>Información general y glosario</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scrollBody, { paddingBottom: 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>⚠️ Aviso importante</Text>
          <Text style={s.text}>
            Esta sección ofrece información general con fines educativos. No es
            consejo médico. Ante dudas sobre tu salud, consulta a un/a profesional.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Glosario básico</Text>
          <Text style={s.term}>• Glucemia:</Text>
          <Text style={s.text}>
            Nivel de glucosa en la sangre. En la app lo verás como mg/dL.
          </Text>
          <Text style={s.term}>• Hipoglucemia:</Text>
          <Text style={s.text}>
            Glucosa baja (p.ej., &lt;70 mg/dL). Síntomas típicos: sudor frío,
            temblor, debilidad. Si te ocurre, sigue tu plan personal.
          </Text>
          <Text style={s.term}>• Hiperglucemia:</Text>
          <Text style={s.text}>
            Glucosa alta (p.ej., &gt;180 mg/dL después de comer). Observa tendencias
            y sigue tu pauta indicada por profesionales.
          </Text>
          <Text style={s.term}>• HbA1c:</Text>
          <Text style={s.text}>
            Indicador promedio de glucosa de los últimos ~3 meses. Lo solicita tu
            equipo de salud; no se mide con esta app.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Hábitos generales (no médicos)</Text>
          <Text style={s.text}>
            • Registra tus mediciones de manera constante para visualizar patrones.
          </Text>
          <Text style={s.text}>
            • Anota contexto: antes/después de comer, ejercicio, notas breves.
          </Text>
          <Text style={s.text}>
            • Mantén tus datos ordenados para compartirlos con tu equipo de salud.
          </Text>
          <Text style={s.text}>
            • Configura recordatorios (externos) si te ayuda a sostener rutinas.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Patrones útiles a observar</Text>
          <Text style={s.text}>
            • Cambios tras comidas similares en días distintos.
          </Text>
          <Text style={s.text}>
            • Efecto de la actividad física en tu glucosa (inmediato y tardío).
          </Text>
          <Text style={s.text}>
            • Madrugadas/amanecer: revisa si hay subidas o bajadas repetidas.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Cuándo buscar orientación profesional</Text>
          <Text style={s.text}>
            • Medidas muy altas o muy bajas persistentes.
          </Text>
          <Text style={s.text}>
            • Síntomas inusuales o que te preocupen.
          </Text>
          <Text style={s.text}>
            • Cambios de tratamiento, alimentación o ejercicio.
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
  headerInner: { alignItems: "center", position: "relative" },
  logo: { width: 56, height: 56 },
  brand: { color: COLORS.white, fontSize: 22, fontWeight: "700", marginTop: 8 },
  subtitle: { color: COLORS.white, opacity: 0.95, marginTop: 4 },
  scrollBody: { paddingHorizontal: 20, marginTop: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontWeight: "700", color: COLORS.text, fontSize: 16, marginBottom: 8 },
  term: { fontWeight: "700", color: COLORS.text, marginTop: 8 },
  text: { color: COLORS.sub, marginTop: 2, lineHeight: 20 },
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
    zIndex: 10,
    padding: 8,
  },
  backButtonText: { color: COLORS.white, fontSize: 24, fontWeight: "700" },
});
