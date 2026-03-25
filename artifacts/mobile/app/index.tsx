import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { AdModal } from "@/components/AdModal";
import Colors from "@/constants/colors";

export default function EntryScreen() {
  const { user, isLoading } = useAuth();
  const [showAd, setShowAd] = useState(false);
  const [adDone, setAdDone] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/(auth)/login");
      } else {
        setShowAd(true);
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (adDone && user) {
      router.replace("/(tabs)");
    }
  }, [adDone, user]);

  return (
    <View style={styles.container}>
      <AdModal
        visible={showAd}
        onClose={() => {
          setShowAd(false);
          setAdDone(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
