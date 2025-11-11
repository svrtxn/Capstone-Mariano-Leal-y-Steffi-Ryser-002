import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Line } from "react-native-svg";

// ======= Tipos y helpers del gráfico (inline) =======
type GlucoseReading = { time: string; level: number }; // time es decorativo; el gráfico usa el orden

const getGlucoseColor = (level: number) => {
  if (level < 70 || level > 180) return "#ef4444"; // crítico
  if ((level >= 70 && level < 80) || (level > 140 && level <= 180)) return "#f59e0b"; // advertencia
  return "#22c55e"; // normal
};

function GlucoseChartInline({ readings }: { readings: GlucoseReading[] }) {
  const chartWidth = Math.min(Dimensions.get("window").width - 48, 380);
  const chartHeight = 120;

  if (!readings || readings.length === 0) {
    return (
      <View style={s.chartCard}>
        <Text style={s.cardTitleTop}>Últimos controles</Text>
        <View style={s.emptyBox}>
          <Text style={s.emptyTitle}>Sin datos aún</Text>
          <Text style={s.emptyText}>
            Registra tu primera medición para ver el gráfico aquí.
          </Text>
        </View>
      </View>
    );
  }

  const latest = readings[readings.length - 1];

  const yScale = (level: number) => {
    const normalized = (level - 60) / (200 - 60); // rango 60–200 mg/dL
    return chartHeight - normalized * chartHeight;
  };

  return (
    <View style={s.chartCard}>
      <Text style={s.cardTitleTop}>Últimos controles</Text>

      <View style={s.levelRow}>
        <Text style={s.levelLabel}>Nivel actual</Text>
        <Text style={[s.levelValue, { color: getGlucoseColor(latest.level) }]}>
          {latest.level}
        </Text>
      </View>

      <View style={[s.chartContainer, { width: chartWidth }]}>
        <Svg width={chartWidth} height={chartHeight}>
          {readings.map((d, i) => {
            if (i === 0) return null;
            const prev = readings[i - 1];
            const total = readings.length;
            const x1 = ((i - 1) / (total - 1)) * chartWidth;
            const x2 = (i / (total - 1)) * chartWidth;
            const y1 = yScale(prev.level);
            const y2 = yScale(d.level);
            return (
              <Line
                key={`seg-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={getGlucoseColor(d.level)}
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </View>

      <View style={s.legendContainer}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: "#22c55e" }]} />
          <Text style={s.legendText}>Normal</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: "#f59e0b" }]} />
          <Text style={s.legendText}>Advertencia</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={s.legendText}>Crítico</Text>
        </View>
      </View>
    </View>
  );
}

// =============== Pantalla ===============
type Props = {
  onNavigateToIngesta?: () => void;
  onNavigateToHistorial?: () => void;
  onNavigateToEstadisticas?: () => void;
  userName?: string;
};

export default function HomeScreen({
  onNavigateToIngesta,
  onNavigateToHistorial,
  onNavigateToEstadisticas,
  userName = "Usuario",
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Si llegas desde el login con params ?name=..., úsalo:
  const params = useLocalSearchParams<{ name?: string }>();
  const displayName = useMemo(
    () =>
      typeof params.name === "string" && params.name.trim()
        ? params.name
        : userName ?? "Usuario",
    [params.name, userName]
  );

  // Datos del gráfico (ejemplo vacío => “Sin datos aún”)
  const [rows] = useState<GlucoseReading[]>([]);

  const handleLogout = () => {
    // Si luego agregas persistencia, aquí limpiarías AsyncStorage
    router.replace("/"); // ⬅ vuelve al login
  };

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
          <Text style={s.welcome}>¡Bienvenido, {displayName}!</Text>

          {/* Botón de cerrar sesión */}
          <TouchableOpacity
            onPress={handleLogout}
            style={s.logoutBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.white} />
            <Text style={s.logoutTxt}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* Gráfico/estado */}
        <GlucoseChartInline readings={rows} />

        {/* Acciones */}
        <Text style={[s.sectionTitle, { marginTop: 20 }]}>
          ¿Qué deseas hacer?
        </Text>

        {/* Registrar Glucosa */}
        <TouchableOpacity activeOpacity={0.85} onPress={onNavigateToIngesta}>
          <LinearGradient
            colors={[COLORS.teal, COLORS.tealLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.menuCard}
          >
            <View style={s.iconContainer}>
              <Ionicons name="add-circle-outline" size={32} color={COLORS.white} />
            </View>
            <View style={s.menuTextContainer}>
              <Text style={s.menuTitle}>Registrar Glucosa</Text>
              <Text style={s.menuSubtitle}>Ingresa un nuevo control</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Historial */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onNavigateToHistorial}
          style={s.card}
        >
          <View style={s.iconContainerSecondary}>
            <Ionicons name="list-outline" size={28} color={COLORS.teal} />
          </View>
          <View style={s.menuTextContainer}>
            <Text style={s.cardTitle}>Ver Historial</Text>
            <Text style={s.cardSubtitle}>Consulta tus registros</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.sub} />
        </TouchableOpacity>

        {/* Estadísticas */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onNavigateToEstadisticas}
          style={s.card}
        >
          <View style={s.iconContainerSecondary}>
            <Ionicons name="stats-chart-outline" size={28} color={COLORS.teal} />
          </View>
          <View style={s.menuTextContainer}>
            <Text style={s.cardTitle}>Estadísticas</Text>
            <Text style={s.cardSubtitle}>Análisis y gráficas</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.sub} />
        </TouchableOpacity>
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
  logo: { width: 64, height: 64 },
  brand: { color: COLORS.white, fontSize: 24, fontWeight: "700", marginTop: 10 },
  welcome: { color: COLORS.white, fontSize: 16, marginTop: 6, opacity: 0.95 },

  // Botón logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  logoutTxt: { color: COLORS.white, fontWeight: "600", fontSize: 13 },

  scrollBody: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  // Tarjeta del gráfico / estados
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitleTop: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.sub, textAlign: "center" },

  // Gráfico
  levelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  levelLabel: { fontSize: 14, color: COLORS.sub },
  levelValue: { fontSize: 40, fontWeight: "800" },
  chartContainer: { height: 120, alignSelf: "center", marginBottom: 10 },

  // Leyenda
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.sub },

  // Sección acciones
  sectionTitle: { fontSize: 20, fontWeight: "600", color: COLORS.text, marginBottom: 16 },

  // Botón “Registrar”
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // Cards secundarias
  card: {
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerSecondary: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: { flex: 1, marginLeft: 14 },
  menuTitle: { color: COLORS.white, fontSize: 17, fontWeight: "600" },
  menuSubtitle: { color: COLORS.white, fontSize: 13, marginTop: 2, opacity: 0.9 },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: "600" },
  cardSubtitle: { color: COLORS.sub, fontSize: 13, marginTop: 2 },
});
