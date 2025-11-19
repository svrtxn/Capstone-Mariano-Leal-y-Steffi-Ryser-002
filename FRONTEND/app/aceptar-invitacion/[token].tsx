// app/aceptar-invitacion/[token].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { contactosApi, authApi } from "../services/api";
import { COLORS } from "../../constants/colors";

export default function AceptarInvitacionScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [error, setError] = useState("");

  // FORM
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // 1) VALIDAR TOKEN CUANDO CARGA LA PÁGINA
  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        const resp = await contactosApi.aceptarInvitacion(token);

        // SI LLEGA AQUÍ → TOKEN ES VÁLIDO
        setTokenValido(true);
        setNombre(resp.invitacion?.nombre_contacto || "");
        setEmail(resp.invitacion?.email_contacto || "");

      } catch {
        setError("Invitación no válida o expirada.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  // 2) REGISTRO ESPECIAL
  const handleRegister = async () => {
    if (!nombre || !email || !pass1) {
      setFormError("Completa todos los campos");
      return;
    }
    if (pass1 !== pass2) {
      setFormError("Las contraseñas no coinciden");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      // REGISTRAMOS AL AMIGO NORMALMENTE
      const resp = await authApi.register({
        nombre,
        apellido: "",
        email,
        password: pass1,
        telefono: null,
        tiene_sensor: false,
        tipo_diabetes: null,
      });

      // VINCULAR INVITACIÓN A ESTE USUARIO
      await contactosApi.vincularInvitacion({
        token,
        contacto_usuario_id: resp.usuario.id,
      });

      // REDIRIGIR
      router.replace("/");

    } catch (e: any) {
      setFormError(e.message || "No se pudo registrar");
    } finally {
      setSaving(false);
    }
  };

  // --------------- UI ---------------

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#fff" />
        <Text style={s.text}>Validando invitación...</Text>
      </View>
    );
  }

  if (!tokenValido) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{error}</Text>
      </View>
    );
  }

  // TOKEN ES VÁLIDO → MOSTRAR REGISTRO
  return (
    <View style={s.container}>
      <Text style={s.title}>Crear cuenta de apoyo</Text>

      <TextInput
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        style={s.input}
      />
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={s.input}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={pass1}
        onChangeText={setPass1}
        style={s.input}
      />
      <TextInput
        placeholder="Repetir contraseña"
        secureTextEntry
        value={pass2}
        onChangeText={setPass2}
        style={s.input}
      />

      {formError ? <Text style={s.errorText}>{formError}</Text> : null}

      <TouchableOpacity
        style={s.btn}
        onPress={handleRegister}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnText}>Crear cuenta</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#111",
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    marginTop: 10,
  },
  btn: {
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 8,
  },
  btnText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "#f55",
    marginTop: 8,
    textAlign: "center",
  },
  text: {
    color: "#ccc",
    marginTop: 8,
  },
});
