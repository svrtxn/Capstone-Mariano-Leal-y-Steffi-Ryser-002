// src/screens/AmigosScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { contactosApi } from "../services/api";

type TipoContacto = "familiar" | "amigo" | "profesional" | "medico";

type Invitacion = {
  contacto_id: number;
  nombre_contacto: string;
  email_contacto: string;
  telefono_contacto: string | null;
  tipo_contacto: string;
  prioridad: number;
  habilitado: number;
  estado_invitacion: string;
  contacto_usuario_id: number | null;
  fecha_creacion?: string;
};

type ContactoApoyo = {
  contacto_id: number;
  nombre_contacto: string;
  email_contacto: string;
  telefono_contacto: string | null;
  tipo_contacto: string;
  prioridad: number;
  habilitado: number;
  estado_invitacion: string;
  contacto_usuario_id: number | null;
};

export default function AmigosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Formulario
  const [nombreContacto, setNombreContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [tipoContacto, setTipoContacto] = useState<TipoContacto | null>(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null
  );

  // Listas
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [contactos, setContactos] = useState<ContactoApoyo[]>([]);
  const [loadingListas, setLoadingListas] = useState(false);

  // Modal eliminar contacto
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [contactoAEliminar, setContactoAEliminar] =
    useState<ContactoApoyo | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Modal invitaciones
  const [invModalVisible, setInvModalVisible] = useState(false);
  const [invEliminandoId, setInvEliminandoId] = useState<number | null>(null);

  // Validaciones simples
  const nombreValid = nombreContacto.trim().length >= 2;
  const emailValid = emailContacto.trim() !== "" && emailContacto.includes("@");
  const tipoValid = !!tipoContacto;

  const isValid = nombreValid && emailValid && tipoValid && !loading;

  // ================= Cargar invitaciones + contactos =================
  const cargarListas = async () => {
    try {
      setLoadingListas(true);
      const [inv, cont] = await Promise.all([
        contactosApi.listarInvitacionesEnviadas(),
        contactosApi.listarMisContactos(),
      ]);
      setInvitaciones(inv);
      setContactos(cont);
    } catch (e: any) {
      console.warn("Error cargando listas de contactos:", e?.message);
    } finally {
      setLoadingListas(false);
    }
  };

  useEffect(() => {
    cargarListas();
  }, []);

  // =======================================================================
  // INVITAR CONTACTO
  // =======================================================================
  const handleInvite = async () => {
    if (!isValid || loading) return;

    let previewTab: Window | null = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      previewTab = window.open("", "_blank");
    }

    try {
      setLoading(true);
      setStatusMsg("");
      setStatusType(null);

      const resp = await contactosApi.invitarContacto({
        nombre_contacto: nombreContacto.trim(),
        email_contacto: emailContacto.trim().toLowerCase(),
        telefono_contacto: telefonoContacto.trim() || undefined,
        tipo_contacto: tipoContacto || "familiar",
      });

      setStatusType("success");
      setStatusMsg(
        resp?.msg ||
          `Invitación enviada correctamente a ${nombreContacto.trim()}.`
      );

      if (resp?.previewURL) {
        if (Platform.OS === "web") {
          if (previewTab) previewTab.location.href = resp.previewURL;
        } else {
          Linking.openURL(resp.previewURL).catch(() => {});
        }
      } else if (previewTab) {
        previewTab.close();
      }

      setNombreContacto("");
      setEmailContacto("");
      setTelefonoContacto("");

      await cargarListas();
    } catch (e: any) {
      if (Platform.OS === "web" && previewTab) previewTab.close();

      const msg =
        e?.message?.replace(/^HTTP \d+ [\w ]+ - /, "") ||
        "No se pudo enviar la invitación.";

      setStatusType("error");
      setStatusMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const statusColorStyle =
    statusType === "error"
      ? s.statusError
      : statusType === "success"
      ? s.statusSuccess
      : null;

  const labelEstado = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "aceptada":
        return "Aceptada";
      case "rechazada":
        return "Rechazada";
      default:
        return estado;
    }
  };

  const chipEstadoStyle = (estado: string) => {
    if (estado === "pendiente") return [s.estadoChip, s.estadoPendiente];
    if (estado === "aceptada") return [s.estadoChip, s.estadoAceptada];
    if (estado === "rechazada") return [s.estadoChip, s.estadoRechazada];
    return [s.estadoChip];
  };

  const labelTipo = (tipo: string) => {
    if (tipo === "familiar") return "Familiar";
    if (tipo === "amigo") return "Amigo";
    if (tipo === "medico") return "Médico";
    return tipo;
  };

  // ======================= Eliminar contacto activo =======================
  const abrirModalEliminar = (contacto: ContactoApoyo) => {
    setContactoAEliminar(contacto);
    setDeleteModalVisible(true);
  };

  const cancelarEliminar = () => {
    setDeleteModalVisible(false);
    setContactoAEliminar(null);
  };

  const confirmarEliminar = async () => {
    if (!contactoAEliminar) return;
    try {
      setEliminando(true);
      await contactosApi.eliminarContacto(contactoAEliminar.contacto_id);

      setStatusType("success");
      setStatusMsg(
        `Contacto "${contactoAEliminar.nombre_contacto}" eliminado correctamente.`
      );

      cancelarEliminar();
      await cargarListas();
    } catch (e: any) {
      setStatusType("error");
      setStatusMsg(
        e?.message?.replace(/^HTTP \d+ [\w ]+ - /, "") ||
          "No se pudo eliminar el contacto."
      );
    } finally {
      setEliminando(false);
    }
  };

  // ======================= Eliminar invitación =======================
  const eliminarInvitacion = async (inv: Invitacion) => {
    try {
      setInvEliminandoId(inv.contacto_id);
      await contactosApi.eliminarInvitacion(inv.contacto_id);
      await cargarListas();
    } catch (e: any) {
      setStatusType("error");
      setStatusMsg(
        e?.message?.replace(/^HTTP \d+ [\w ]+ - /, "") ||
          "No se pudo eliminar la invitación."
      );
    } finally {
      setInvEliminandoId(null);
    }
  };

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
          <Text style={s.title}>Comunidad</Text>
          <Text style={s.subtitle}>Amigos y red de apoyo</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>Invitar contacto de apoyo</Text>
          <Text style={s.text}>
            Agrega personas de confianza que podrán ayudarte supervisando tus
            niveles de glucosa.
          </Text>

          {/* Nombre */}
          <Text style={s.label}>Nombre del contacto</Text>
          <TextInput
            value={nombreContacto}
            onChangeText={setNombreContacto}
            placeholder="Ej: Juana Gómez"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Email */}
          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            value={emailContacto}
            onChangeText={setEmailContacto}
            placeholder="correo@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Teléfono */}
          <Text style={s.label}>Teléfono (opcional)</Text>
          <TextInput
            value={telefonoContacto}
            onChangeText={setTelefonoContacto}
            placeholder="+56912345678"
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.sub}
            style={s.input}
          />

          {/* Tipo de contacto */}
          <Text style={s.label}>Relación con el contacto</Text>
          <View style={s.rowChips}>
            {[
              { key: "familiar", label: "Familiar" },
              { key: "amigo", label: "Amigo" },
              { key: "medico", label: "Médico" },
            ].map((opt) => {
              const active = tipoContacto === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setTipoContacto(opt.key as TipoContacto)}
                  style={[
                    s.chip,
                    active && { backgroundColor: COLORS.tealLight },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      s.chipText,
                      active && { color: COLORS.teal, fontWeight: "700" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón enviar */}
          <TouchableOpacity
            onPress={handleInvite}
            disabled={!isValid || loading}
            activeOpacity={0.85}
            style={[s.btn, (!isValid || loading) && { opacity: 0.6 }]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={s.btnText}>Enviar invitación</Text>
            )}
          </TouchableOpacity>

          {/* Mensaje Inline */}
          {statusType && !!statusMsg && (
            <Text style={[s.statusText, statusColorStyle]}>{statusMsg}</Text>
          )}

          {/* ================== CONTACTOS ACTIVOS (COMPACTO) ================== */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Contactos de apoyo activos</Text>
            {loadingListas ? (
              <ActivityIndicator />
            ) : contactos.length === 0 ? (
              <Text style={s.emptyText}>
                Cuando tus contactos acepten la invitación aparecerán aquí.
              </Text>
            ) : (
              <View style={s.contactsGrid}>
                {contactos.map((c) => (
                  <View key={c.contacto_id} style={s.contactCard}>
                    <Text style={s.avatarIcon}>👤</Text>
                    <Text style={s.contactName} numberOfLines={2}>
                      {c.nombre_contacto}
                    </Text>
                    <Text style={s.contactType}>
                      {labelTipo(c.tipo_contacto)}
                    </Text>

                    <TouchableOpacity
                      onPress={() => abrirModalEliminar(c)}
                      style={s.trashBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={s.trashIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Botón para ver invitaciones en modal */}
          <View style={s.section}>
            <TouchableOpacity
              style={s.secondaryBtn}
              activeOpacity={0.85}
              onPress={() => setInvModalVisible(true)}
            >
              <Text style={s.secondaryBtnText}>Ver invitaciones enviadas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ================== MODAL ELIMINAR CONTACTO ================== */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelarEliminar}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Eliminar contacto</Text>
            <Text style={s.modalText}>
              {`¿Seguro que deseas eliminar a ${
                contactoAEliminar?.nombre_contacto ?? "este contacto"
              }?\n\nSe dejará de compartir tu cuenta y tus datos de glucosa con esta persona.`}
            </Text>

            <View style={s.modalActions}>
              <TouchableOpacity
                onPress={cancelarEliminar}
                style={[s.modalBtn, s.modalBtnCancel]}
                activeOpacity={0.8}
                disabled={eliminando}
              >
                <Text style={s.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmarEliminar}
                style={[s.modalBtn, s.modalBtnDelete]}
                activeOpacity={0.8}
                disabled={eliminando}
              >
                {eliminando ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={s.modalBtnDeleteText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================== MODAL INVITACIONES ENVIADAS ================== */}
      <Modal
        visible={invModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInvModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { maxHeight: "75%" }]}>
            <Text style={s.modalTitle}>Invitaciones enviadas</Text>

            {loadingListas ? (
              <ActivityIndicator />
            ) : invitaciones.length === 0 ? (
              <Text style={s.emptyTextModal}>
                Aún no has enviado invitaciones de apoyo.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: "70%" }}>
                {invitaciones.map((inv) => (
                  <View key={inv.contacto_id} style={s.invRow}>
                    <View style={s.invLeft}>
                      <Text style={s.itemName}>{inv.nombre_contacto}</Text>
                      <Text style={s.itemEmail}>{inv.email_contacto}</Text>
                    </View>
                    <View style={chipEstadoStyle(inv.estado_invitacion)}>
                      <Text style={s.estadoChipText}>
                        {labelEstado(inv.estado_invitacion)}
                      </Text>
                    </View>
                    {inv.estado_invitacion !== "aceptada" && (
                      <TouchableOpacity
                        onPress={() => eliminarInvitacion(inv)}
                        style={s.invDeleteBtn}
                        activeOpacity={0.8}
                        disabled={invEliminandoId === inv.contacto_id}
                      >
                        {invEliminandoId === inv.contacto_id ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <Text style={s.invDeleteText}>Borrar</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={s.modalActionsFooter}>
              <TouchableOpacity
                onPress={() => setInvModalVisible(false)}
                style={[s.modalBtn, s.modalBtnCancel]}
                activeOpacity={0.8}
              >
                <Text style={s.modalBtnCancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: { alignItems: "center", position: "relative" },
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
    padding: 8,
    zIndex: 10,
  },
  backButtonText: { color: COLORS.white, fontSize: 24, fontWeight: "600" },
  logo: { width: 52, height: 52 },
  title: { color: COLORS.white, fontSize: 22, fontWeight: "700", marginTop: 8 },
  subtitle: { color: COLORS.white, opacity: 0.9, marginTop: 4 },
  body: { paddingHorizontal: 20, paddingVertical: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  text: { color: COLORS.sub, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  label: { color: COLORS.text, marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  rowChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  chipText: { fontSize: 13, color: COLORS.sub },
  btn: {
    marginTop: 8,
    backgroundColor: COLORS.teal,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
  statusText: { marginTop: 8, fontSize: 13, textAlign: "center" },
  statusError: { color: "#b91c1c" },
  statusSuccess: { color: "#15803d" },

  // Secciones
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.sub,
  },

  // GRID contactos pequeños
  contactsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  contactCard: {
    width: "28%",
    minWidth: 90,
    maxWidth: 110,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  avatarIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  contactType: {
    fontSize: 10,
    color: COLORS.sub,
    marginTop: 2,
    marginBottom: 4,
  },
  trashBtn: {
    padding: 4,
  },
  trashIcon: {
    fontSize: 14,
  },

  // Chip estado
  estadoChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  estadoPendiente: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FBBF24",
  },
  estadoAceptada: {
    backgroundColor: "#DCFCE7",
    borderColor: "#22C55E",
  },
  estadoRechazada: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
  },
  estadoChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
  },

  // Fila invitación en modal
  invRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  invLeft: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  itemEmail: {
    fontSize: 12,
    color: COLORS.sub,
    marginTop: 2,
  },
  invDeleteBtn: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  invDeleteText: {
    fontSize: 11,
    color: "#B91C1C",
    fontWeight: "600",
  },

  secondaryBtn: {
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.teal,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFEFF",
  },
  secondaryBtnText: {
    color: COLORS.teal,
    fontWeight: "600",
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.sub,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalActionsFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modalBtnCancel: {
    backgroundColor: "#E5E7EB",
  },
  modalBtnCancelText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  modalBtnDelete: {
    backgroundColor: "#B91C1C",
  },
  modalBtnDeleteText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "600",
  },

  emptyTextModal: {
    fontSize: 13,
    color: COLORS.sub,
    marginTop: 6,
  },
});
