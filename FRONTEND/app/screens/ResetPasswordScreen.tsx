import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { authApi } from "../services/api";

type Props = { onDone?: () => void };

export default function ResetPasswordScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const emailFromUrl = useMemo(
    () => (typeof params.email === "string" ? params.email : ""),
    [params.email]
  );
  const tokenFromUrl = useMemo(
    () => (typeof params.token === "string" ? params.token : ""),
    [params.token]
  );

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !token.trim()) {
      Alert.alert("Cambiar contraseña", "Faltan datos (correo o token).");
      return;
    }
    if (!password || password !== confirm) {
      Alert.alert("Cambiar contraseña", "Las contraseñas no coinciden.");
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.resetPassword(
        email.trim().toLowerCase(),
        token.trim(),
        password
      );
      const msg = res?.mensaje || "Contraseña restablecida. Ya puedes iniciar sesión.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Listo", msg);
      onDone?.();
    } catch (e: any) {
      const err =
        e?.message?.replace(/^HTTP \d+ [\w ]+ - /, "") ||
        "No se pudo restablecer la contraseña.";
      Platform.OS === "web" ? window.alert(err) : Alert.alert("Error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top + 16 }]}>
      <LinearGradient
        colors={[COLORS.teal, COLORS.tealLight]}
        start={{x:0,y:0}} end={{x:1,y:1}}
        style={s.header}
      >
        <Text style={s.headerTitle}>Cambiar contraseña</Text>
        <Text style={s.headerSub}>Ingresa tu nueva contraseña.</Text>
      </LinearGradient>

      <View style={s.body}>
        {/* Email (prellenado y editable) */}
        <Text style={s.label}>Correo</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="tu@correo.com"
          placeholderTextColor={COLORS.sub}
          style={s.input}
        />

        {/* Token visible solo si no vino en la URL */}
        {!tokenFromUrl ? (
          <>
            <Text style={s.label}>Token</Text>
            <TextInput
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              placeholder="Pega aquí el token"
              placeholderTextColor={COLORS.sub}
              style={s.input}
            />
          </>
        ) : null}

        {/* Nueva contraseña */}
        <Text style={s.label}>Nueva contraseña</Text>
        <View style={s.passwordContainer}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={COLORS.sub}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={s.passwordInput}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={s.eyeIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={COLORS.sub}
            />
          </TouchableOpacity>
        </View>

        {/* Confirmar */}
        <Text style={s.label}>Confirmar contraseña</Text>
        <View style={s.passwordContainer}>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repite la contraseña"
            placeholderTextColor={COLORS.sub}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            style={s.passwordInput}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm(!showConfirm)}
            style={s.eyeIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={COLORS.sub}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleReset} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.teal, COLORS.tealLight]}
            start={{x:0,y:0}} end={{x:1,y:1}}
            style={s.button}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white}/>
            ) : (
              <Text style={s.buttonText}>Cambiar contraseña</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen:{flex:1, backgroundColor:COLORS.bg},
  header:{paddingHorizontal:20, paddingVertical:24, borderBottomLeftRadius:24, borderBottomRightRadius:24},
  headerTitle:{color:COLORS.white, fontSize:22, fontWeight:"700", marginBottom:6},
  headerSub:{color:COLORS.white, opacity:0.9},
  body:{padding:20, gap:12},
  label:{color:COLORS.text, fontWeight:"500"},
  input:{backgroundColor:COLORS.gray100, borderWidth:1, borderColor:COLORS.gray200, borderRadius:12, paddingHorizontal:14, paddingVertical:12, fontSize:16, color:COLORS.text},
  button:{borderRadius:12, paddingVertical:14, alignItems:"center", marginTop:8},
  buttonText:{color:COLORS.white, fontWeight:"600", fontSize:16},
  passwordContainer:{flexDirection:"row", alignItems:"center", backgroundColor:COLORS.gray100, borderWidth:1, borderColor:COLORS.gray200, borderRadius:12},
  passwordInput:{flex:1, paddingHorizontal:14, paddingVertical:12, fontSize:16, color:COLORS.text},
  eyeIcon:{paddingHorizontal:12},
});
