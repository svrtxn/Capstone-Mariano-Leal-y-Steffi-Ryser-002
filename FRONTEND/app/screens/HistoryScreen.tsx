// src/screens/HistoryScreen.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { glucoseApi } from "../services/api";

type Row = {
  glucosa_id?: number;
  usuario_id: number;
  valor_glucosa: number;
  unidad?: string;
  metodo_registro?: "manual" | "sensor";
  origen_sensor?: string | null;
  fecha_registro: string; // ISO o "YYYY-MM-DD HH:mm:ss"
  etiquetado?: "antes_comida" | "despues_comida" | "ayuno" | "otro" | null;
  notas?: string | null;
};

type TimeWindow = "12h" | "24h" | "7d" | "todo";

function parseTsSafe(v: any): number {
  if (!v) return NaN;
  if (v instanceof Date) return v.getTime();
  let s = String(v);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) s = s.replace(" ", "T");
  const t = Date.parse(s);
  return Number.isNaN(t) ? new Date(s).getTime() : t;
}

function formatDateTime(s: string) {
  const t = parseTsSafe(s);
  if (!Number.isFinite(t)) return s;
  const d = new Date(t);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function levelColor(v: number) {
  if (v < 70 || v > 180) return "#ef4444";
  if ((v >= 70 && v < 80) || (v > 140 && v <= 180)) return "#f59e0b";
  return "#22c55e";
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [windowSel, setWindowSel] = useState<TimeWindow>("todo");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // El back ya filtra por usuario mediante glucoseApi.listByUser()
      const data = await glucoseApi.listByUser();
      const mapped = (Array.isArray(data) ? data : [])
        .map((r: any) => ({
          glucosa_id: r.glucosa_id,
          usuario_id: r.usuario_id,
          valor_glucosa: Number(r.valor_glucosa),
          unidad: r.unidad ?? "mg/dL",
          metodo_registro: r.metodo_registro,
          origen_sensor: r.origen_sensor,
          fecha_registro: r.fecha_registro,
          etiquetado: r.etiquetado,
          notas: r.notas,
        }))
        // por si el back no viene ordenado
        .sort((a: Row, b: Row) => parseTsSafe(b.fecha_registro) - parseTsSafe(a.fecha_registro));

      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    if (windowSel === "todo") return rows;
    const now = Date.now();
    const ms =
      windowSel === "12h" ? 12 * 3600 * 1000 :
      windowSel === "24h" ? 24 * 3600 * 1000 :
      7 * 24 * 3600 * 1000; // 7d
    const from = now - ms;
    return rows.filter(r => parseTsSafe(r.fecha_registro) >= from);
  }, [rows, windowSel]);

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
          <Text style={s.brand}>Historial de Glucosa</Text>
        </View>
      </LinearGradient>

      {/* Filtros rápidos */}
      <View style={s.filters}>
        {(["12h", "24h", "7d", "todo"] as TimeWindow[]).map((k) => {
          const active = windowSel === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setWindowSel(k)}
              style={[s.chip, active && s.chipActive]}
              activeOpacity={0.85}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>
                {k === "todo" ? "Todo" : k}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cabecera de la “tabla” */}
      <View style={s.tableHeader}>
        <Text style={[s.th, { flex: 1.3 }]}>Fecha</Text>
        <Text style={[s.th, { flex: 0.8 }]}>Valor</Text>
        <Text style={[s.th, { flex: 0.9 }]}>Método</Text>
        <Text style={[s.th, { flex: 1 }]}>Etiqueta</Text>
        <Text style={[s.th, { flex: 1.4 }]}>Notas</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) =>
          String(item.glucosa_id ?? `${item.usuario_id}-${item.fecha_registro}-${item.valor_glucosa}`)
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.teal} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={s.tr}>
            <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>
              {formatDateTime(item.fecha_registro)}
            </Text>

            <View style={[s.tdBox, { flex: 0.8 }]}>
              <Ionicons name="water-outline" size={14} color={levelColor(item.valor_glucosa)} />
              <Text style={[s.tdStrong, { color: levelColor(item.valor_glucosa) }]}>
                {item.valor_glucosa}
              </Text>
              <Text style={s.tdUnit}> {item.unidad || "mg/dL"}</Text>
            </View>

            <Text style={[s.td, { flex: 0.9 }]} numberOfLines={1}>
              {item.metodo_registro === "sensor" ? "Sensor" : "Manual"}
            </Text>

            <Text style={[s.td, { flex: 1 }]} numberOfLines={1}>
              {item.etiquetado
                ? item.etiquetado.replace("_", " ")
                : "-"}
            </Text>

            <Text style={[s.td, { flex: 1.4 }]} numberOfLines={1}>
              {item.notas || "-"}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyTitle}>Sin registros</Text>
              <Text style={s.emptyText}>Aún no has agregado mediciones.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: { alignItems: "center", position: "relative" },
  logo: { width: 48, height: 48 },
  brand: { color: COLORS.white, fontSize: 20, fontWeight: "700", marginTop: 8 },

  backButton: { position: "absolute", left: 16, top: 16, zIndex: 10, padding: 8 },
  backButtonText: { color: COLORS.white, fontSize: 24, fontWeight: "600" },

  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#F3F4F6",
  },
  chipActive: { backgroundColor: COLORS.tealLight, borderColor: COLORS.teal },
  chipText: { color: COLORS.text, fontSize: 12 },
  chipTextActive: { color: COLORS.white, fontWeight: "700" },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  th: {
    color: COLORS.sub,
    fontSize: 12,
    fontWeight: "700",
  },

  tr: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  td: { color: COLORS.text, fontSize: 13 },
  tdStrong: { marginLeft: 6, fontSize: 14, fontWeight: "800" },
  tdUnit: { fontSize: 12, color: COLORS.sub },
  tdBox: { flexDirection: "row", alignItems: "center" },

  emptyBox: {
    marginTop: 28,
    marginHorizontal: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.sub, textAlign: "center" },
});
