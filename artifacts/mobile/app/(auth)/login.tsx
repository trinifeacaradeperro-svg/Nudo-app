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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError("Completa todos los campos");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (e: any) {
      setError(e.message || "Error al iniciar sesión");
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
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="knot" size={44} color={C.tint} />
            </View>
            <Text style={styles.logoText}>NUDO</Text>
            <Text style={styles.logoSub}>Mensajería libre y privada</Text>
          </View>

          <View style={styles.privacyBanner}>
            <MaterialCommunityIcons name="shield-lock" size={16} color={C.green} />
            <Text style={styles.privacyText}>
              Sin vigilancia de gobiernos ni terceros. Tus mensajes son tuyos.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="tu_usuario"
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
                placeholder="••••••••"
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

            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.85 : 1, backgroundColor: C.tint },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Entrar</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.linkBtn}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={styles.linkText}>
                ¿No tienes cuenta?{" "}
                <Text style={{ color: C.tint }}>Regístrate gratis</Text>
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
  logoWrap: { alignItems: "center", marginBottom: 28 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.tint + "22",
    borderWidth: 1.5,
    borderColor: Colors.light.tint + "55",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: Colors.light.text,
    letterSpacing: 6,
  },
  logoSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 4,
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
    marginBottom: 28,
  },
  privacyText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.green,
    lineHeight: 18,
  },
  form: { gap: 6 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 4,
    marginTop: 10,
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
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: 4,
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
    marginBottom: 4,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#FF6B6B",
  },
  btn: {
    marginTop: 20,
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
