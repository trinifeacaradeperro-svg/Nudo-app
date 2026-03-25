import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import Colors from "@/constants/colors";

const C = Colors.light;
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface MsgItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface OtherUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarUrl?: string | null;
}

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<MsgItem[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(1)).current;

  const fetchMessages = useCallback(async () => {
    if (!user || !id) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}/messages`, {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
          return prev;
        });
      }
    } catch {}
    setLoading(false);
  }, [user, id]);

  const fetchConvDetails = useCallback(async () => {
    if (!user || !id) return;
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const conv = data.find((c: any) => c.id === id);
        if (conv?.otherUser) setOtherUser(conv.otherUser);
      }
    } catch {}
  }, [user, id]);

  useEffect(() => {
    fetchConvDetails();
    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchConvDetails]);

  const animateSendBtn = () => {
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.88, useNativeDriver: true, friction: 6 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
    ]).start();
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user || !id || sending) return;
    const content = inputText.trim();
    setInputText("");
    setSending(true);
    animateSendBtn();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: MsgItem = {
      id: tempId,
      conversationId: id,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const res = await fetch(`${API_BASE}/conversations/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ content }),
      });
      const msg = await res.json();
      if (msg.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? msg : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const flatData = messages.flatMap((msg, i) => {
    const items: any[] = [];
    const d = new Date(msg.createdAt);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
    let dateLabel =
      diffDays === 0
        ? "Hoy"
        : diffDays === 1
        ? "Ayer"
        : d.toLocaleDateString("es-ES");

    const prevMsg = messages[i - 1];
    let showDate = !prevMsg;
    if (prevMsg) {
      const prevD = new Date(prevMsg.createdAt);
      const prevDiff = Math.floor((today.getTime() - prevD.getTime()) / 86400000);
      const prevLabel =
        prevDiff === 0 ? "Hoy" : prevDiff === 1 ? "Ayer" : prevD.toLocaleDateString("es-ES");
      if (prevLabel !== dateLabel) showDate = true;
    }
    if (showDate) items.push({ type: "date", id: `date-${i}`, label: dateLabel });
    items.push({ type: "msg", ...msg });
    return items;
  });

  const hasText = inputText.trim().length > 0;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        {otherUser ? (
          <View style={styles.headerUser}>
            <Avatar
              displayName={otherUser.displayName}
              color={otherUser.avatarColor}
              size={38}
              avatarUrl={otherUser.avatarUrl}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerName}>{otherUser.displayName}</Text>
              <View style={styles.encryptedRow}>
                <MaterialCommunityIcons name="shield-lock" size={11} color={C.green} />
                <Text style={styles.encryptedText}>Cifrado extremo a extremo</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.headerUser} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={C.tint} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={flatData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.msgList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={56} color={C.border} />
                <Text style={styles.emptyChatText}>
                  Aún no hay mensajes. ¡Di hola!
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.type === "date") {
                return (
                  <View style={styles.dateSep}>
                    <View style={styles.dateLine} />
                    <Text style={styles.dateLabel}>{item.label}</Text>
                    <View style={styles.dateLine} />
                  </View>
                );
              }
              const isMe = item.senderId === user?.id;
              const isTemp = item.id?.startsWith("temp-");
              return (
                <View
                  style={[
                    styles.msgRow,
                    isMe ? styles.msgRowMe : styles.msgRowThem,
                  ]}
                >
                  {!isMe && otherUser && (
                    <Avatar
                      displayName={otherUser.displayName}
                      color={otherUser.avatarColor}
                      size={28}
                      avatarUrl={otherUser.avatarUrl}
                    />
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem,
                      isTemp && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isMe ? styles.bubbleTextMe : styles.bubbleTextThem,
                      ]}
                    >
                      {item.content}
                    </Text>
                    <View style={styles.bubbleFooter}>
                      <Text
                        style={[
                          styles.bubbleTime,
                          !isMe && { color: C.textMuted },
                        ]}
                      >
                        {formatMsgTime(item.createdAt)}
                      </Text>
                      {isMe && (
                        <Ionicons
                          name={
                            isTemp
                              ? "time-outline"
                              : item.readAt
                              ? "checkmark-done"
                              : "checkmark"
                          }
                          size={14}
                          color={
                            isTemp
                              ? "rgba(255,255,255,0.4)"
                              : item.readAt
                              ? "#A0F0D0"
                              : "rgba(255,255,255,0.6)"
                          }
                          style={{ marginLeft: 3 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Message input bar */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom:
                insets.bottom + (Platform.OS === "web" ? 34 : 8),
            },
          ]}
        >
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />

            {/* SEND BUTTON - prominent and animated */}
            <Animated.View style={{ transform: [{ scale: sendScale }] }}>
              <Pressable
                style={[
                  styles.sendBtn,
                  hasText ? styles.sendBtnActive : styles.sendBtnInactive,
                ]}
                onPress={sendMessage}
                disabled={!hasText || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather
                    name="send"
                    size={20}
                    color={hasText ? "#fff" : C.textMuted}
                  />
                )}
              </Pressable>
            </Animated.View>
          </View>

          {/* Send hint label */}
          {hasText && (
            <Text style={styles.sendHint}>
              Toca el botón morado para enviar
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  headerUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: C.text,
  },
  encryptedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  encryptedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.green,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  msgList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyChatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
  },
  dateSep: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 10,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: C.border },
  dateLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.textMuted,
    paddingHorizontal: 4,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-end",
    gap: 8,
  },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowThem: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: C.tint,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMe: { color: "#fff" },
  bubbleTextThem: { color: C.text },
  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 2,
  },
  bubbleTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  inputBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: C.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.border,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.text,
    maxHeight: 120,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnActive: {
    backgroundColor: C.tint,
    shadowColor: C.tint,
  },
  sendBtnInactive: {
    backgroundColor: C.border,
    shadowOpacity: 0,
  },
  sendHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 5,
  },
});
