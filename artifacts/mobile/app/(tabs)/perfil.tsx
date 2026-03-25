import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { AdModal } from "@/components/AdModal";
import Colors from "@/constants/colors";

const C = Colors.light;

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#7C6EF5", "#FF9F43",
];

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}
function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

interface PrivacyItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}
function PrivacyItem({ icon, title, desc }: PrivacyItemProps) {
  return (
    <View style={styles.privacyItem}>
      <View style={styles.privacyIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.privacyTitle}>{title}</Text>
        <Text style={styles.privacyDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAd, setShowAd] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePickPhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tu galería para cambiar la foto de perfil.",
        [{ text: "Entendido" }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const base64 = asset.base64;
      if (!base64) throw new Error("No se pudo obtener la imagen");
      const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      const dataUri = `data:${mime};base64,${base64}`;
      await updateProfile({ avatarUrl: dataUri });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo subir la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleTakePhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tu cámara.",
        [{ text: "Entendido" }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const base64 = asset.base64;
      if (!base64) throw new Error("No se pudo obtener la imagen");
      const dataUri = `data:image/jpeg;base64,${base64}`;
      await updateProfile({ avatarUrl: dataUri });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo subir la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateProfile({ avatarUrl: null });
  };

  const handleColorChange = async (color: string) => {
    await Haptics.selectionAsync();
    await updateProfile({ avatarColor: color });
    setShowColorPicker(false);
  };

  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  const showPhotoOptions = () => {
    Alert.alert("Cambiar foto de perfil", "¿Cómo quieres elegir tu foto?", [
      { text: "Tomar foto", onPress: handleTakePhoto },
      { text: "Elegir de galería", onPress: handlePickPhoto },
      user?.avatarUrl
        ? { text: "Eliminar foto", style: "destructive", onPress: handleRemovePhoto }
        : undefined,
      { text: "Cancelar", style: "cancel" },
    ].filter(Boolean) as any[]);
  };

  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <AdModal visible={showAd} onClose={() => setShowAd(false)} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        {/* Profile photo section */}
        <View style={styles.profileCard}>
          <Pressable onPress={showPhotoOptions} style={styles.avatarWrap}>
            {uploadingPhoto ? (
              <View style={[styles.avatarOverlay, { width: 90, height: 90, borderRadius: 45 }]}>
                <ActivityIndicator color={C.tint} size="large" />
              </View>
            ) : (
              <>
                <Avatar
                  displayName={user.displayName}
                  color={user.avatarColor}
                  size={90}
                  avatarUrl={user.avatarUrl}
                />
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </>
            )}
          </Pressable>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>

          {/* Color picker toggle */}
          <Pressable
            style={styles.colorToggleBtn}
            onPress={() => setShowColorPicker((s) => !s)}
          >
            <View style={[styles.colorPreview, { backgroundColor: user.avatarColor }]} />
            <Text style={styles.colorToggleText}>Cambiar color</Text>
            <Feather name={showColorPicker ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
          </Pressable>

          {showColorPicker && (
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    user.avatarColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => handleColorChange(c)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.card}>
            <InfoRow
              icon={<Feather name="user" size={18} color={C.tint} />}
              label="Nombre de usuario"
              value={`@${user.username}`}
            />
            <View style={styles.divider} />
            <InfoRow
              icon={<Ionicons name="calendar-outline" size={18} color={C.tint} />}
              label="Miembro desde"
              value={memberSince}
            />
          </View>
        </View>

        {/* Ad button */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.adBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowAd(true);
            }}
          >
            <MaterialCommunityIcons name="bullhorn" size={22} color={C.tint} />
            <View style={{ flex: 1 }}>
              <Text style={styles.adBtnTitle}>Ver anuncio</Text>
              <Text style={styles.adBtnSub}>
                Así es como NUDO se mantiene gratis para todos
              </Text>
            </View>
            <Ionicons name="play-circle" size={28} color={C.tint} />
          </Pressable>
        </View>

        {/* Privacy section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad y Seguridad</Text>
          <View style={styles.card}>
            <PrivacyItem
              icon={<MaterialCommunityIcons name="shield-lock" size={20} color={C.green} />}
              title="Sin vigilancia gubernamental"
              desc="NUDO nunca entrega datos a gobiernos ni agencias de inteligencia."
            />
            <View style={styles.divider} />
            <PrivacyItem
              icon={<MaterialCommunityIcons name="lock-outline" size={20} color={C.green} />}
              title="Cifrado extremo a extremo"
              desc="Solo tú y tu contacto pueden leer los mensajes."
            />
            <View style={styles.divider} />
            <PrivacyItem
              icon={<MaterialCommunityIcons name="eye-off-outline" size={20} color={C.green} />}
              title="Sin rastreo de usuarios"
              desc="No vendemos ni compartimos tu información personal."
            />
            <View style={styles.divider} />
            <PrivacyItem
              icon={<MaterialCommunityIcons name="account-off-outline" size={20} color={C.green} />}
              title="Sin número de teléfono"
              desc="Tu cuenta solo necesita usuario y contraseña."
            />
          </View>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: C.text,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  avatarWrap: { position: "relative" },
  avatarOverlay: {
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.tint + "66",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: C.tint,
    borderRadius: 16,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.background,
  },
  displayName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.text,
    marginTop: 4,
  },
  username: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textMuted,
  },
  colorToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 6,
  },
  colorPreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorToggleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.textMuted,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginTop: 4,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    transform: [{ scale: 1.15 }],
  },
  section: { paddingHorizontal: 16, marginBottom: 18 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: C.border },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.tint + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.text,
  },
  adBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.tint + "18",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.tint + "40",
    padding: 16,
  },
  adBtnTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.text,
    marginBottom: 2,
  },
  adBtnSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 16,
  },
  privacyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 14,
  },
  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.green + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  privacyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.text,
    marginBottom: 2,
  },
  privacyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FF6B6B20",
    borderWidth: 1,
    borderColor: "#FF6B6B40",
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FF6B6B",
  },
});
