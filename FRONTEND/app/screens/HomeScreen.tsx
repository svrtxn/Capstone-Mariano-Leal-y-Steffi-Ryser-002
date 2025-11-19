// src/screens/HomeScreen.tsx
import React, { useState, useMemo, useCallback } from "react";
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
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Line, Text as SvgText, Circle } from "react-native-svg";
import { glucoseApi } from "../services/api";
import {
  getCurrentUserId,
  getCurrentUserName,
  clearSession,
  setCurrentUserName,
} from "../services/session";
import { BASE_URL } from "../../constants/config";

type GlucoseReading = { time: string; level: number };
type GlucosePoint = { ts: number; level: number };

type Thresholds = {
  hipo_min: number;
  normal_min: number;
  normal_max: number;
  hiper_max: number;
};

const Y_MIN = 0;
const Y_MAX = 500;
const HOURS_WINDOW = 12;
const WINDOW_MS = HOURS_WINDOW * 3600 * 1000;
const CONFIG_BASE = "/config";

// parser robusto para MySQL DATETIME ("YYYY-MM-DD HH:mm:ss")
function parseTsSafe(v: any): number {
  if (!v) return NaN;
  if (v instanceof Date) return v.getTime();
  let s = String(v);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s.replace(" ", "T");
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? new Date(s).getTime() : t;
}

// ======= Componente de gráfico relativo (t0 = primera lectura) =======
function GlucoseChartInline({
  readings,
  thresholds,
}: {
  readings: GlucoseReading[];
  thresholds?: Thresholds | null;
}) {
  const chartWidth = Math.min(Dimensions.get("window").width - 48, 380);
  const chartHeight = 200;
  const padL = 42;
  const padB = 26;
  const innerW = chartWidth - padL;
  const innerH = chartHeight - padB;

  const parseTs = (s: string) => {
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
      const [d, t] = s.split(" ");
      const [Y, M, D] = d.split("-").map(Number);
      const [h, m, sec] = t.split(":").map(Number);
      return new Date(Y, M - 1, D, h, m, sec || 0).getTime();
    }
    return new Date(s).getTime();
  };

  let points: GlucosePoint[] = (readings || [])
    .map((r) => ({ ts: parseTs(r.time), level: Number(r.level) }))
    .filter((p) => Number.isFinite(p.ts) && !Number.isNaN(p.level))
    .sort((a, b) => a.ts - b.ts);

  if (points.length === 0) {
    return (
      <View style={s.chartCard}>
        <Text style={s.cardTitleTop}>Ventana: últimas 12h</Text>
        <View style={s.emptyBox}>
          <Text style={s.emptyTitle}>Sin datos</Text>
          <Text style={s.emptyText}>
            Registra tu primera medición para iniciar el minuto 0.
          </Text>
        </View>
      </View>
    );
  }

  // ===== UMBRALES PERSONALIZADOS =====
  const hipo = thresholds?.hipo_min ?? 70;
  const nMin = thresholds?.normal_min ?? 70;
  const nMax = thresholds?.normal_max ?? 140;
  const hiper = thresholds?.hiper_max ?? 180;

  const getGlucoseColor = (level: number) => {
    if (level < hipo || level > hiper) return "#ef4444"; // rojo fuera de rango
    if ((level >= hipo && level < nMin) || (level > nMax && level <= hiper))
      return "#f59e0b"; // amarillo borde
    return "#22c55e"; // verde dentro del rango normal
  };

  const t0 = points[0].ts;
  const WINDOW_MS_LOCAL = 12 * 3600 * 1000;
  const tEnd = t0 + WINDOW_MS_LOCAL;

  points = points.filter((p) => p.ts >= t0 && p.ts <= tEnd);

  const xScale = (ts: number) => ((ts - t0) / WINDOW_MS_LOCAL) * innerW;
  const yScale = (lvl: number) => {
    const v = Math.max(Y_MIN, Math.min(Y_MAX, lvl));
    const norm = (v - Y_MIN) / (Y_MAX - Y_MIN);
    return (1 - norm) * innerH;
  };

  const ticksY = [0, 100, 200, 300, 400, 500];
  const tickHours = [0, 3, 6, 9, 12];
  const latest = points[points.length - 1].level;

  return (
    <View style={s.chartCard}>
      <View style={s.levelRow}>
        <Text style={s.cardTitleTop}>Ventana: últimas 12h</Text>
        <Text style={[s.levelValue, { color: getGlucoseColor(latest) }]}>
          {latest}
        </Text>
      </View>

      <View
        style={[s.chartContainer, { width: chartWidth, height: chartHeight }]}
      >
        <Svg width={chartWidth} height={chartHeight}>
          {/* Líneas horizontales y labels de eje Y */}
          {ticksY.map((v) => {
            const y = yScale(v);
            return (
              <React.Fragment key={`gy-${v}`}>
                <Line
                  x1={padL}
                  y1={y}
                  x2={padL + innerW}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={padL - 8}
                  y={y + 3}
                  fontSize="10"
                  fill="#6B7280"
                  textAnchor="end"
                >
                  {v}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Líneas verticales de tiempo */}
          {tickHours.map((h) => {
            const x = padL + (h / 12) * innerW;
            return (
              <React.Fragment key={`gx-${h}`}>
                <Line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={innerH}
                  stroke="#F3F4F6"
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={x}
                  y={innerH + 16}
                  fontSize="10"
                  fill="#6B7280"
                  textAnchor="middle"
                >
                  {h}h
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Ejes principales */}
          <Line
            x1={padL}
            y1={0}
            x2={padL}
            y2={innerH}
            stroke="#9CA3AF"
            strokeWidth={1}
          />
          <Line
            x1={padL}
            y1={innerH}
            x2={padL + innerW}
            y2={innerH}
            stroke="#9CA3AF"
            strokeWidth={1}
          />

          {/* Segmentos de línea coloreados según umbrales */}
          {points.map((p, i) => {
            if (i === 0) return null;
            const prev = points[i - 1];
            const x1 = padL + xScale(prev.ts);
            const x2 = padL + xScale(p.ts);
            const y1 = yScale(prev.level);
            const y2 = yScale(p.level);
            return (
              <Line
                key={`seg-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={getGlucoseColor(p.level)}
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}

          {/* Puntos */}
          {points.map((p, i) => {
            const cx = padL + xScale(p.ts);
            const cy = yScale(p.level);
            return (
              <Circle
                key={`pt-${i}`}
                cx={cx}
                cy={cy}
                r={3}
                fill={getGlucoseColor(p.level)}
              />
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

type Props = {
  onNavigateToIngesta?: () => void;
  onNavigateToHistorial?: () => void;
  onNavigateToInfo?: () => void;
  userName?: string;
};

export default function HomeScreen({
  onNavigateToIngesta,
  onNavigateToHistorial,
  onNavigateToInfo,
  userName = "Usuario",
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{ name?: string }>();
  const [nameFromSession, setNameFromSession] = useState<string | null>(null);
  const displayName = useMemo(() => {
    const fromParams =
      typeof params.name === "string" && params.name.trim()
        ? params.name
        : "";
    return fromParams || nameFromSession || userName || "Usuario";
  }, [params.name, nameFromSession, userName]);

  const [rows, setRows] = useState<GlucoseReading[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);

  const handleLogout = () => {
    clearSession().finally(() => router.replace("/"));
  };

  const handleGoFriends = () => {
    router.push("/amigos");
  };

  const handleGoThresholds = () => {
    router.push("/umbrales");
  };

  const loadReadingsAndConfig = useCallback(async () => {
    try {
      const uid = await getCurrentUserId();
      if (!uid) {
        router.replace("/");
        return;
      }

      // Nombre: params → sesión → prop
      if (typeof params.name === "string" && params.name.trim()) {
        const nm = params.name.trim();
        await setCurrentUserName(nm);
        setNameFromSession(nm);
      } else {
        const nm = await getCurrentUserName();
        if (nm) setNameFromSession(nm);
      }

      // =============================
      // 1) Cargar configuración/umbrales
      // =============================
      try {
        const configRes = await fetch(`${BASE_URL}${CONFIG_BASE}/${uid}`);
        if (configRes.ok) {
          const raw = await configRes.json().catch(() => null);
          if (raw) {
            const data = Array.isArray(raw) && raw.length > 0 ? raw[0] : raw;
            const t: Thresholds = {
              hipo_min: Number(data.hipo_min ?? 70),
              normal_min: Number(data.normal_min ?? 70),
              normal_max: Number(data.normal_max ?? 140),
              hiper_max: Number(data.hiper_max ?? 180),
            };
            setThresholds(t);
          }
        } else {
          // si 404 o error, simplemente se queda en null y usamos defaults
          setThresholds(null);
        }
      } catch (err) {
        console.warn("Error cargando umbrales:", err);
        setThresholds(null);
      }

      // =============================
      // 2) Cargar lecturas de glucosa
      // =============================
      const data = await glucoseApi.listByUser();

      const soloMias = (Array.isArray(data) ? data : []).filter((r: any) => {
        const id =
          r.usuario_id ??
          r.user_id ??
          r.usuarioId ??
          r.userId ??
          r.userid ??
          r.UsuarioId;
        return Number(id) === Number(uid);
      });

      let mapped: GlucoseReading[] = soloMias
        .map((r: any) => ({
          time: (r.fecha_registro ||
            r.fechaISO ||
            r.fecha ||
            r.created_at) as string,
          level: Number(r.valor_glucosa ?? r.valor ?? r.level),
        }))
        .filter((x) => !Number.isNaN(x.level))
        .sort((a, b) => parseTsSafe(a.time) - parseTsSafe(b.time));

      setRows(mapped);
    } catch (e) {
      console.warn("No se pudo cargar lecturas:", e);
      setRows([]);
    }
  }, [router, params.name]);

  useFocusEffect(
    useCallback(() => {
      loadReadingsAndConfig();
    }, [loadReadingsAndConfig])
  );

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={[COLORS.teal, COLORS.tealLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        {/* fila única: icono amigos - bloque central - icono configuración */}
        <View style={s.headerRow}>
          <TouchableOpacity
            onPress={handleGoFriends}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="people-outline" size={26} color={COLORS.white} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <Image
              source={require("../../assets/images/glucoguard_logo_blanco.png")}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.welcome}>¡Bienvenido, {displayName}!</Text>

            <TouchableOpacity
              onPress={handleLogout}
              style={s.logoutBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
              <Text style={s.logoutTxt}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleGoThresholds}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={26} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <GlucoseChartInline readings={rows} thresholds={thresholds} />

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>
          ¿Qué deseas hacer?
        </Text>

        <TouchableOpacity activeOpacity={0.85} onPress={onNavigateToIngesta}>
          <LinearGradient
            colors={[COLORS.teal, COLORS.tealLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.menuCard}
          >
            <View style={s.iconContainer}>
              <Ionicons
                name="add-circle-outline"
                size={32}
                color={COLORS.white}
              />
            </View>
            <View style={s.menuTextContainer}>
              <Text style={s.menuTitle}>Registrar Glucosa</Text>
              <Text style={s.menuSubtitle}>Ingresa un nuevo control</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            onNavigateToHistorial
              ? onNavigateToHistorial()
              : router.push("./historial")
          }
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

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            onNavigateToInfo ? onNavigateToInfo() : router.push("./info")
          }
          style={s.card}
        >
          <View style={s.iconContainerSecondary}>
            <Ionicons
              name="information-circle-outline"
              size={28}
              color={COLORS.teal}
            />
          </View>
          <View style={s.menuTextContainer}>
            <Text style={s.cardTitle}>Información</Text>
            <Text style={s.cardSubtitle}>
              Glosario y conceptos generales
            </Text>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    alignItems: "center",
  },
  logo: { width: 52, height: 52 },
  welcome: { color: COLORS.white, fontSize: 16, marginTop: 6, opacity: 0.95 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  logoutTxt: { color: COLORS.white, fontWeight: "600", fontSize: 12 },
  scrollBody: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
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
  levelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  levelValue: { fontSize: 40, fontWeight: "800" },
  chartContainer: { height: 200, alignSelf: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: COLORS.text, marginBottom: 16 },
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
