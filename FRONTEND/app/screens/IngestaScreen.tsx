// src/screens/IngestaScreen.tsx
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
import GlucoseForm from "../../components/GlucoseForm";
import { COLORS } from "../../constants/colors";

export default function IngestaScreen() {
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
          {/* Flecha para volver (respeta la pila de navegación) */}
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
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scrollBody, { marginTop: 30 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GlucoseForm />
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
  logo: { width: 56, height: 56 },
  brand: { color: COLORS.white, fontSize: 22, fontWeight: "600", marginTop: 8 },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 28 },

  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
    zIndex: 10,
    padding: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "600",
  },
});
