import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ProfileAvatarProps {
  photoUri: string | null;
  size?: number;
  style?: ViewStyle;
}

/**
 * Displays a profile avatar that handles:
 * - Image URIs (displays the image)
 * - Emoji URIs (format: "emoji:😀" - displays the emoji)
 * - Null/empty (displays default person icon)
 */
export function ProfileAvatar({ photoUri, size = 64, style }: ProfileAvatarProps) {
  const { colors } = useTheme();

  const containerSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const isEmoji = photoUri?.startsWith('emoji:');
  const emoji = isEmoji && photoUri ? photoUri.replace('emoji:', '') : null;
  const isImage = photoUri && !isEmoji;

  return (
    <View style={[styles.container, containerSize, { backgroundColor: colors.primary }, style]}>
      {isImage ? (
        <Image source={{ uri: photoUri }} style={[styles.image, containerSize]} />
      ) : emoji ? (
        <Text style={[styles.emoji, { fontSize: size * 0.55 }]}>{emoji}</Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color="#FFFFFF" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  emoji: {
    textAlign: 'center',
  },
});
