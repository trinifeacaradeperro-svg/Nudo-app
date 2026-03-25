import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

const C = Colors.light;

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#7C6EF5", "#FF9F43",
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !displayName.trim() || !password) {
      setError("Completa todos los campos");
      return;
    }
    if (password !== confirmPass) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (username.length < 3) {
      setError("El usuario debe tener al menos 3 caracteres");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(username.trim().toLowerCase(), displayName.trim(), password, avatarColor);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (e: any) {
      setError(e.message || "Error al registrarse");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>

          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Únete a NUDO. Gratis, privado, sin vigilancia.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Color de perfil</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    avatarColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => {
                    setAvatarColor(c);
                    Haptics.selectionAsync();
                  }}
                />
              ))}
            </View>

            <Text style={styles.label}>Nombre para mostrar</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Tu nombre"
              placeholderTextColor={C.textMuted}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, ""))}
              placeholder="solo_minusculas_sin_espacios"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={C.textMuted}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPass((s) => !s)}
              >
                <Ionicons
                  name={showPass ? "eye-off" : "eye"}
                  size={20}
                  color={C.textMuted}
                />
              </Pressable>
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirmPass}
              onChangeText={setConfirmPass}
              placeholder="Repite tu contraseña"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />

            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.privacyBanner}>
              <MaterialCommunityIcons name="shield-lock" size={16} color={C.green} />
              <Text style={styles.privacyText}>
                Nunca vendemos ni compartimos tus datos con gobiernos, empresas ni terceros.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.85 : 1, backgroundColor: C.tint },
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Crear cuenta gratis</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.linkBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta?{" "}
                <Text style={{ color: C.tint }}>Iniciar sesión</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 28, flexGrow: 1 },
  backBtn: { marginBottom: 20, width: 40 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: { gap: 4 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 6,
    marginTop: 8,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    transform: [{ scale: 1.15 }],
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    padding: 4,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#FF6B6B",
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.green + "15",
    borderColor: Colors.light.green + "40",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  privacyText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.green,
    lineHeight: 18,
  },
  btn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  linkBtn: { alignItems: "center", marginTop: 18 },
  linkText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
  },
});
