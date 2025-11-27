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
  Modal,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useRouter,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { glucoseApi } from "../services/api";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";

type Row = {
  glucosa_id?: number;
  usuario_id: number;
  valor_glucosa: number;
  unidad?: string;
  metodo_registro?: "manual" | "sensor";
  origen_sensor?: string | null;
  fecha_registro: string;
  // etiquetado ya no se muestra, pero lo dejamos por compatibilidad
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
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function levelColor(v: number) {
  if (v < 70 || v > 180) return "#ef4444";
  if ((v >= 70 && v < 80) || (v > 140 && v <= 180)) return "#f59e0b";
  return "#22c55e";
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Params si viene desde SoporteHomeScreen (modo apoyo)
  const params = useLocalSearchParams<{
    pacienteId?: string;
    pacienteName?: string;
    modoApoyo?: string;
  }>();
  const isSupportMode = params.modoApoyo === "1";
  const pacienteNameFromParams =
    typeof params.pacienteName === "string" ? params.pacienteName : undefined;
  const pacienteIdParam =
    typeof params.pacienteId === "string" ? params.pacienteId : undefined;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [windowSel, setWindowSel] = useState<TimeWindow>("todo");

  // Modal de notas
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notesModalContent, setNotesModalContent] = useState<string>("");

  // estados de acciones
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Si hay pacienteId en params (modo apoyo), se filtra por ese paciente
      const data = await glucoseApi.listByUser(pacienteIdParam);

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
        .sort(
          (a: Row, b: Row) =>
            parseTsSafe(b.fecha_registro) - parseTsSafe(a.fecha_registro)
        );

      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }, [pacienteIdParam]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (windowSel === "todo") return rows;
    const now = Date.now();
    const ms =
      windowSel === "12h"
        ? 12 * 3600 * 1000
        : windowSel === "24h"
        ? 24 * 3600 * 1000
        : 7 * 24 * 3600 * 1000; // 7d
    const from = now - ms;
    return rows.filter((r) => parseTsSafe(r.fecha_registro) >= from);
  }, [rows, windowSel]);

  // ====== Acciones ======

  const openNotesModal = (notes: string | null | undefined) => {
    if (!notes) return;
    setNotesModalContent(notes);
    setNotesModalVisible(true);
  };

  // ✅ Exportar PDF real (el amigo de apoyo NO puede exportar)
  const handleExportPdf = async () => {
    if (isSupportMode || !filtered.length || exporting) return;

    try {
      setExporting(true);

      const title = pacienteNameFromParams
        ? `Historial de glucosa de ${pacienteNameFromParams}`
        : "Historial de glucosa";

      const escapeHtml = (str: string) =>
        str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const rowsHtml = filtered
        .map((r) => {
          const fecha = formatDateTime(r.fecha_registro);
          const metodo = r.metodo_registro === "sensor" ? "Sensor" : "Manual";
          const notas = r.notas ? escapeHtml(r.notas) : "";

          const mainRow = `
            <tr>
              <td>${fecha}</td>
              <td>${r.valor_glucosa} ${r.unidad || "mg/dL"}</td>
              <td>${metodo}</td>
              <td>${notas ? "Ver notas abajo" : "-"}</td>
            </tr>
          `;

          const notesRow = notas
            ? `
            <tr class="notes-row">
              <td colspan="4">
                <strong>Notas:</strong><br/>
                ${notas}
              </td>
            </tr>
          `
            : "";

          return mainRow + notesRow;
        })
        .join("");

      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { 
              margin: 20mm; 
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              color: #111827;
            }
            h1 {
              text-align: center;
              font-size: 20px;
              margin-bottom: 4px;
            }
            .subtitle {
              text-align: center;
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 5px 6px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 600;
            }
            tr:nth-child(even) td {
              background-color: #f9fafb;
            }
            .notes-row td {
              background-color: #fefce8;
              font-size: 10px;
              white-space: pre-wrap;
              word-break: break-word;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="subtitle">
            Generado desde GlucoGuard – ${new Date().toLocaleString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Valor</th>
                <th>Método</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      if (Platform.OS === "web") {
        try {
          if (typeof window !== "undefined") {
            const win = window.open("", "_blank");
            if (!win) throw new Error("Popup bloqueado");

            win.document.open();
            win.document.write(html);
            win.document.close();
            win.focus();
            win.print();
          } else {
            await Print.printAsync({ html });
          }
        } catch (err) {
          console.error("Error imprimiendo en web:", err);
          Alert.alert(
            "Error",
            "No se pudo abrir la vista de impresión en el navegador."
          );
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir historial de glucosa",
        });
      }
    } catch (err) {
      console.error("Error generando PDF:", err);
      Alert.alert("Error", "No se pudo generar el PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteHistory = () => {
    if (isSupportMode || !filtered.length || deleting) return;

    Alert.alert(
      "Borrar historial",
      "¿Seguro que deseas borrar todo el historial de glucosa? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              // TODO backend real
              Alert.alert(
                "Borrar historial",
                "Conecta aquí tu endpoint del backend para eliminar los registros."
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const titleText = pacienteNameFromParams
    ? `Historial de ${pacienteNameFromParams}`
    : "Historial de Glucosa";

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
          <Text style={s.brand}>{titleText}</Text>
          {isSupportMode && (
            <Text style={s.supportBadge}>Modo apoyo (solo lectura)</Text>
          )}
        </View>
      </LinearGradient>

      {/* Filtros + acciones */}
      <View style={s.filtersRow}>
        <View style={s.filtersLeft}>
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

        {/* Botones de acción (solo dueño) */}
        <View style={s.actionsRight}>
          <TouchableOpacity
            onPress={handleExportPdf}
            activeOpacity={isSupportMode ? 1 : 0.8}
            disabled={isSupportMode || exporting || !filtered.length}
            style={[
              s.actionBtn,
              (isSupportMode || !filtered.length) && s.actionBtnDisabled,
            ]}
          >
            <Ionicons
              name="document-outline"
              size={16}
              color={
                isSupportMode || !filtered.length ? "#9ca3af" : COLORS.teal
              }
            />
            <Text
              style={[
                s.actionBtnText,
                (isSupportMode || !filtered.length) &&
                  s.actionBtnTextDisabled,
              ]}
            >
              PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteHistory}
            activeOpacity={isSupportMode ? 1 : 0.8}
            disabled={isSupportMode || deleting || !filtered.length}
            style={[
              s.actionBtn,
              (isSupportMode || !filtered.length) && s.actionBtnDisabled,
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={
                isSupportMode || !filtered.length ? "#9ca3af" : "#b91c1c"
              }
            />
            <Text
              style={[
                s.actionBtnText,
                (isSupportMode || !filtered.length) &&
                  s.actionBtnTextDisabled,
              ]}
            >
              Borrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cabecera de la tabla */}
      <View style={s.tableHeader}>
        <Text style={[s.th, { flex: 1.6 }]}>Fecha</Text>
        <Text style={[s.th, { flex: 0.9 }]}>(mg/dL)</Text>
        <Text style={[s.th, { flex: 0.9 }]}>Método</Text>
        <Text style={[s.th, { flex: 0.7, textAlign: "center" }]}>Notas</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) =>
          String(
            item.glucosa_id ??
              `${item.usuario_id}-${item.fecha_registro}-${item.valor_glucosa}`
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={COLORS.teal}
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={s.tr}>
            <Text style={[s.td, { flex: 1.6 }]} numberOfLines={1}>
              {formatDateTime(item.fecha_registro)}
            </Text>

            <View style={[s.tdBox, { flex: 0.9 }]}>
              <Ionicons
                name="water-outline"
                size={14}
                color={levelColor(item.valor_glucosa)}
              />
              <Text
                style={[
                  s.tdStrong,
                  { color: levelColor(item.valor_glucosa) },
                ]}
              >
                {item.valor_glucosa}
              </Text>
              {/* 🔹 YA NO MOSTRAMOS "mg/dL" AQUÍ */}
            </View>

            <Text style={[s.td, { flex: 0.9 }]} numberOfLines={1}>
              {item.metodo_registro === "sensor" ? "Sensor" : "Manual"}
            </Text>

            <View style={[s.notesCell, { flex: 0.7 }]}>
              {item.notas ? (
                <TouchableOpacity
                  style={s.notesBtn}
                  onPress={() => openNotesModal(item.notas)}
                >
                  <Text style={s.notesBtnText}>Ver</Text>
                </TouchableOpacity>
              ) : (
                <Text
                  style={[
                    s.td,
                    { fontSize: 12, color: COLORS.sub, textAlign: "center" },
                  ]}
                >
                  -
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyTitle}>Sin registros</Text>
              <Text style={s.emptyText}>
                Aún no se han agregado mediciones de glucosa.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Modal de notas */}
      <Modal
        visible={notesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Notas</Text>
            <Text style={s.modalBody}>{notesModalContent}</Text>
            <TouchableOpacity
              style={s.modalCloseBtn}
              onPress={() => setNotesModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={s.modalCloseTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  supportBadge: {
    marginTop: 4,
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },

  backButton: { position: "absolute", left: 16, top: 16, zIndex: 10, padding: 8 },
  backButtonText: { color: COLORS.white, fontSize: 24, fontWeight: "600" },

  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  filtersLeft: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 1,
  },
  actionsRight: {
    flexDirection: "row",
    gap: 8,
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

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.teal,
    backgroundColor: "#ECFEFF",
    gap: 4,
  },
  actionBtnDisabled: {
    borderColor: "#d1d5db",
    backgroundColor: "#f3f4f6",
  },
  actionBtnText: {
    fontSize: 12,
    color: COLORS.teal,
    fontWeight: "600",
  },
  actionBtnTextDisabled: {
    color: "#9ca3af",
  },

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
  tdUnit: { fontSize: 12, color: COLORS.sub }, // ya no se usa, pero lo dejamos
  tdBox: { flexDirection: "row", alignItems: "center" },

  notesCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  notesBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.teal,
    backgroundColor: "#ECFEFF",
  },
  notesBtnText: {
    fontSize: 11,
    color: COLORS.teal,
    fontWeight: "600",
  },

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
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyText: { fontSize: 13, color: COLORS.sub, textAlign: "center" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
  },
  modalCloseBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.teal,
  },
  modalCloseTxt: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 13,
  },
});
