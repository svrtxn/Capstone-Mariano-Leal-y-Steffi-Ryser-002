// src/screens/SoporteHomeScreen.tsx
import React, { useState, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Line, Text as SvgText, Circle } from "react-native-svg";
import { glucoseApi, contactosApi } from "../services/api";
import {
  getCurrentUserId,
  getCurrentUserName,
  clearSession,
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

// parser robusto para MySQL DATETIME
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

// ======= MISMO GRÁFICO QUE EN HomeScreen =======
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
            El paciente aún no registra mediciones.
          </Text>
        </View>
      </View>
    );
  }

  const hipo = thresholds?.hipo_min ?? 70;
  const nMin = thresholds?.normal_min ?? 70;
  const nMax = thresholds?.normal_max ?? 140;
  const hiper = thresholds?.hiper_max ?? 180;

  const getGlucoseColor = (level: number) => {
    if (level < hipo || level > hiper) return "#ef4444";
    if ((level >= hipo && level < nMin) || (level > nMax && level <= hiper))
      return "#f59e0b";
    return "#22c55e";
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

export default function SoporteHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [rows, setRows] = useState<GlucoseReading[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [pacienteName, setPacienteName] = useState<string>("Paciente");
  const [pacienteId, setPacienteId] = useState<number | null>(null); // 👈 NUEVO
  const [contactName, setContactName] = useState<string>("");

  const handleLogout = () => {
    clearSession().finally(() => router.replace("/"));
  };


  const handleGoHistorial = () => {
  if (!pacienteId) return; // por si todavía no se carga el paciente

  router.push({
    pathname: "/historial",
    params: {
      pacienteId: String(pacienteId),
      pacienteName,
      modoApoyo: "1", // 👈 importante para desactivar botones
    },
  });
};

  const handleGoInfo = () => {
    router.push("./info");
  };

  const loadData = useCallback(async () => {
    try {
      const contactoId = await getCurrentUserId();
      if (!contactoId) {
        router.replace("/");
        return;
      }

      const nm = await getCurrentUserName();
      if (nm) setContactName(nm);

      // 1) Traer pacientes asociados a este contacto
      const pacientes = await contactosApi.misPacientes();
      if (!pacientes || pacientes.length === 0) {
        router.replace("/");
        return;
      }

      const paciente = pacientes[0]; // por ahora asumimos 1 paciente
      setPacienteName(paciente.nombre_paciente || "Paciente");
      setPacienteId(paciente.usuario_id); // 👈 guardamos el id del paciente
      const idPaciente = paciente.usuario_id;

      // 2) Cargar umbrales del paciente
      try {
        const configRes = await fetch(`${BASE_URL}${CONFIG_BASE}/${idPaciente}`);
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
          setThresholds(null);
        }
      } catch (err) {
        console.warn("Error cargando umbrales paciente:", err);
        setThresholds(null);
      }

      // 3) Cargar lecturas del paciente
      const data = await glucoseApi.listByUser(idPaciente);

      let mapped: GlucoseReading[] = (Array.isArray(data) ? data : [])
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
      console.warn("No se pudo cargar lecturas de paciente:", e);
      setRows([]);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={[COLORS.teal, COLORS.tealLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={s.headerRow}>
          <View style={{ width: 26 }} />

          <View style={s.headerCenter}>
            <Image
              source={require("../../assets/images/glucoguard_logo_blanco.png")}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.welcome}>
              Modo apoyo: {contactName || "Contacto"}
            </Text>
            <Text style={s.subtitle}>Viendo a: {pacienteName}</Text>

            <TouchableOpacity
              onPress={handleLogout}
              style={s.logoutBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
              <Text style={s.logoutTxt}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: 26 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <GlucoseChartInline readings={rows} thresholds={thresholds} />

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>
          Opciones disponibles
        </Text>

        {/* NO hay botón de Registrar Glucosa */}
        <View style={[s.cardDisabled]}>
          <View style={s.iconContainerSecondary}>
            <Ionicons name="add-circle-outline" size={28} color={COLORS.sub} />
          </View>
          <View style={s.menuTextContainer}>
            <Text style={s.cardTitle}>Registrar Glucosa</Text>
            <Text style={s.cardSubtitle}>
              Solo el paciente puede registrar nuevas mediciones.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGoHistorial}
          style={s.card}
        >
          <View style={s.iconContainerSecondary}>
            <Ionicons name="list-outline" size={28} color={COLORS.teal} />
          </View>
          <View style={s.menuTextContainer}>
            <Text style={s.cardTitle}>Ver Historial</Text>
            <Text style={s.cardSubtitle}>
              Consulta los registros de glucosa del paciente.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.sub} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGoInfo}
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
              Glosario y conceptos generales sobre glucosa.
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
  subtitle: { color: COLORS.white, fontSize: 13, marginTop: 2, opacity: 0.9 },
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyText: { fontSize: 13, color: COLORS.sub, textAlign: "center" },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  levelValue: { fontSize: 40, fontWeight: "800" },
  chartContainer: { height: 200, alignSelf: "center", marginBottom: 10 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
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
  cardDisabled: {
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    opacity: 0.7,
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
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: "600" },
  cardSubtitle: { color: COLORS.sub, fontSize: 13, marginTop: 2 },
});
