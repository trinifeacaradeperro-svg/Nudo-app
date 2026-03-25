import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

const ADSENSE_CLIENT = "ca-pub-1291252641301043";

interface AdModalProps {
  visible: boolean;
  onClose: () => void;
}

function AdSenseBanner() {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      const w = window as any;
      if (containerRef.current) {
        const ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.cssText = "display:block;width:100%;min-height:250px;";
        ins.setAttribute("data-ad-client", ADSENSE_CLIENT);
        ins.setAttribute("data-ad-format", "auto");
        ins.setAttribute("data-full-width-responsive", "true");
        containerRef.current.appendChild(ins);
        (w.adsbygoogle = w.adsbygoogle || []).push({});
      }
    } catch (_) {}
  }, []);

  if (Platform.OS !== "web") return null;

  return (
    <View style={adStyles.bannerWrapper}>
      <Text style={adStyles.poweredBy}>Publicidad de Google</Text>
      <div ref={containerRef} style={{ width: "100%", minHeight: 250 }} />
    </View>
  );
}

export function AdModal({ visible, onClose }: AdModalProps) {
  const [countdown, setCountdown] = useState(5);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setCountdown(5);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>PUBLICIDAD</Text>
          </View>

          <AdSenseBanner />

          <View style={styles.privacyRow}>
            <MaterialCommunityIcons name="shield-lock" size={14} color={Colors.light.textMuted} />
            <Text style={styles.privacyText}>Tu privacidad está protegida · NUDO no comparte tus datos</Text>
          </View>

          <Pressable
            style={[
              styles.closeBtn,
              countdown > 0 ? styles.closeBtnDisabled : styles.closeBtnActive,
            ]}
            onPress={countdown === 0 ? onClose : undefined}
          >
            {countdown > 0 ? (
              <Text style={styles.closeBtnText}>Cerrar en {countdown}s</Text>
            ) : (
              <Text style={styles.closeBtnText}>Continuar a NUDO</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const adStyles = StyleSheet.create({
  bannerWrapper: {
    width: "100%",
    minHeight: 260,
    marginBottom: 16,
    alignItems: "center",
  },
  poweredBy: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.light.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 24,
    width: width - 48,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  brandBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 16,
    backgroundColor: "#7C6EF522",
  },
  brandText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    color: "#7C6EF5",
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  privacyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.textMuted,
    flex: 1,
  },
  closeBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  closeBtnDisabled: {
    backgroundColor: Colors.light.border,
  },
  closeBtnActive: {
    backgroundColor: Colors.light.tint,
  },
  closeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
});
