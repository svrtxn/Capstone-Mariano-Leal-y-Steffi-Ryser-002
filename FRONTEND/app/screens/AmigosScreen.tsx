
// src/screens/AmigosScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function AmigosScreen() {
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
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
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
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>Próximamente</Text>
          <Text style={s.text}>
            Aquí podrás gestionar tu red de apoyo: familiares, amigos o
            profesionales con quienes quieras compartir tu información de
            glucosa.
          </Text>
          <Text style={s.text}>
            Esta pantalla es un prototipo inicial para la versión futura de
            GlucoGuard.
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: { alignItems: "center", position: "relative" },
  backButton: {
    position: "absolute",
    left: 8,
    top: 8,
    padding: 8,
    zIndex: 10,
  },
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
  cardTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  text: { color: COLORS.sub, fontSize: 14, lineHeight: 20, marginBottom: 4 },
});