import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

interface AvatarProps {
  displayName: string;
  color: string;
  size?: number;
  avatarUrl?: string | null;
}

export function Avatar({ displayName, color, size = 44, avatarUrl }: AvatarProps) {
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const fontSize = size * 0.38;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color + "66",
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "33",
          borderColor: color + "66",
        },
      ]}
    >
      <Text style={[styles.text, { fontSize, color }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  image: {
    borderWidth: 1.5,
  },
  text: {
    fontFamily: "Inter_700Bold",
  },
});
