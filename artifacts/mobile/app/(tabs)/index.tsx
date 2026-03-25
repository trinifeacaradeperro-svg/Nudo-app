import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import Colors from "@/constants/colors";

const C = Colors.light;
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface OtherUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  createdAt: string;
}

interface LastMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface ConvItem {
  id: string;
  otherUser: OtherUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7)
    return d.toLocaleDateString("es-ES", { weekday: "short" });
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 4000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: topPad + 60 }]}>
        <ActivityIndicator color={C.tint} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>NUDO</Text>
          <View style={styles.privacyRow}>
            <MaterialCommunityIcons name="shield-lock" size={11} color={C.green} />
            <Text style={styles.privacyText}>Cifrado extremo a extremo</Text>
          </View>
        </View>
        <Pressable
          style={styles.newChatBtn}
          onPress={() => router.push("/(tabs)/buscar")}
        >
          <Ionicons name="create-outline" size={22} color={C.tint} />
        </Pressable>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color={C.border} />
            <Text style={styles.emptyTitle}>Sin conversaciones aún</Text>
            <Text style={styles.emptyText}>
              Busca a alguien y empieza a chatear
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push("/(tabs)/buscar")}
            >
              <Text style={styles.emptyBtnText}>Buscar contactos</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.convItem,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <View style={styles.convAvatar}>
              <Avatar
                displayName={item.otherUser.displayName}
                color={item.otherUser.avatarColor}
                size={52}
              />
              {item.unreadCount > 0 && (
                <View style={styles.unreadDot}>
                  <Text style={styles.unreadCount}>
                    {item.unreadCount > 99 ? "99+" : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.convInfo}>
              <View style={styles.convRow}>
                <Text style={styles.convName} numberOfLines={1}>
                  {item.otherUser.displayName}
                </Text>
                <Text style={styles.convTime}>
                  {item.lastMessage
                    ? formatTime(item.lastMessage.createdAt)
                    : formatTime(item.updatedAt)}
                </Text>
              </View>
              <View style={styles.convRow}>
                <Text
                  style={[
                    styles.convLast,
                    item.unreadCount > 0 && { color: C.text },
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage
                    ? (item.lastMessage.senderId === user?.id ? "Tú: " : "") +
                      item.lastMessage.content
                    : "Sin mensajes aún"}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: C.border + "50", marginLeft: 80 }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: C.text,
    letterSpacing: 3,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  privacyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.green,
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.tint + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: C.text,
    marginTop: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  convAvatar: { position: "relative", marginRight: 14 },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: C.tint,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: C.background,
  },
  unreadCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  convInfo: { flex: 1 },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  convName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.text,
    flex: 1,
  },
  convTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textMuted,
    marginLeft: 8,
  },
  convLast: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textMuted,
    flex: 1,
    marginTop: 2,
  },
});
