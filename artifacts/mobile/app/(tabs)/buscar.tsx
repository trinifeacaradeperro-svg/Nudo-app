import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import Colors from "@/constants/colors";

const C = Colors.light;
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface UserResult {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
}

export default function BuscarScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (!user || q.trim().length < 1) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/users/search?q=${encodeURIComponent(q.trim())}`,
          { headers: { "x-user-id": user.id } }
        );
        const data = await res.json();
        if (Array.isArray(data)) setResults(data);
      } catch {}
      setLoading(false);
    },
    [user]
  );

  const handleChange = (text: string) => {
    setQuery(text);
    search(text);
  };

  const startChat = async (otherUserId: string) => {
    if (!user) return;
    setStartingChat(otherUserId);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ otherUserId }),
      });
      const conv = await res.json();
      router.push(`/chat/${conv.id}`);
    } catch {}
    setStartingChat(null);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={C.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleChange}
          placeholder="Buscar por nombre de usuario..."
          placeholderTextColor={C.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={C.tint} />}
        {!loading && query.length > 0 && (
          <Pressable onPress={() => { setQuery(""); setResults([]); }}>
            <Feather name="x" size={18} color={C.textMuted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <View style={styles.empty}>
            {query.length > 0 && !loading ? (
              <>
                <Feather name="user-x" size={48} color={C.border} />
                <Text style={styles.emptyText}>Sin resultados para "{query}"</Text>
              </>
            ) : (
              <>
                <Feather name="search" size={48} color={C.border} />
                <Text style={styles.emptyText}>
                  Escribe el nombre de usuario de alguien para empezar a chatear
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.userItem,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => startChat(item.id)}
            disabled={startingChat === item.id}
          >
            <Avatar displayName={item.displayName} color={item.avatarColor} size={50} />
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>{item.displayName}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            {startingChat === item.id ? (
              <ActivityIndicator size="small" color={C.tint} />
            ) : (
              <View style={styles.chatIcon}>
                <Feather name="message-circle" size={20} color={C.tint} />
              </View>
            )}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.text,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: { flex: 1, marginLeft: 14 },
  displayName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.text,
  },
  username: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  chatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.tint + "20",
    alignItems: "center",
    justifyContent: "center",
  },
});
