import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../context/ThemeContext';
import { OnboardingStackParamList } from '../../navigation/AppNavigator';
import { useSettings } from '../../context/SettingsContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { Spacing, FontSizes, BorderRadius } from '../../constants/theme';

// Random emojis for profile picture fallback
const PROFILE_EMOJIS = [
  '😀', '😎', '🤩', '🥳', '😊', '🙂', '😄', '🤗',
  '🦊', '🐱', '🐶', '🐼', '🦁', '🐯', '🐨', '🐻',
  '🌟', '⭐', '🌈', '🔥', '💎', '🎯', '🚀', '💫',
  '🎨', '🎭', '🎪', '🎢', '🎡', '🏆', '🎖️', '🏅',
];

const getRandomEmoji = () => {
  const randomIndex = Math.floor(Math.random() * PROFILE_EMOJIS.length);
  return PROFILE_EMOJIS[randomIndex];
};

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const { colors } = useTheme();
  const { setProfile } = useSettings();
  const { setCurrentStep } = useOnboarding();
  const navigation = useNavigation<NavigationProp>();

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState(getRandomEmoji());

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleRandomizeEmoji = () => {
    setSelectedEmoji(getRandomEmoji());
    setPhotoUri(null); // Clear photo if user wants emoji
  };

  const handleContinue = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }

    // Save profile with either photo or emoji
    setProfile({
      name: name.trim(),
      photoUri: photoUri || `emoji:${selectedEmoji}`,
    });

    // Move to next step
    setCurrentStep('sms_setup');
    navigation.navigate('SmsSetup');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Welcome to Chillar! 👋
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            Let's set up your profile to get started
          </Text>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={[styles.photoContainer, { backgroundColor: colors.primary }]}
            onPress={handlePickImage}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <Text style={styles.emojiDisplay}>{selectedEmoji}</Text>
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.surface }]}>
              <Ionicons name="camera" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>

          <View style={styles.photoActions}>
            <TouchableOpacity
              style={[styles.photoActionButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={handlePickImage}
            >
              <Ionicons name="image" size={18} color={colors.primary} />
              <Text style={[styles.photoActionText, { color: colors.text }]}>
                Choose Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoActionButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={handleRandomizeEmoji}
            >
              <Ionicons name="shuffle" size={18} color={colors.primary} />
              <Text style={[styles.photoActionText, { color: colors.text }]}>
                Random Emoji
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            What should we call you?
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: name.trim() ? colors.primary : colors.surfaceVariant },
          ]}
          onPress={handleContinue}
          disabled={!name.trim()}
        >
          <Text
            style={[
              styles.continueButtonText,
              { color: name.trim() ? '#FFFFFF' : colors.textTertiary },
            ]}
          >
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={name.trim() ? '#FFFFFF' : colors.textTertiary}
          />
        </TouchableOpacity>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
        </View>

        <Text style={[styles.stepText, { color: colors.textTertiary }]}>
          Step 1 of 3
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xxl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: 120,
    height: 120,
  },
  emojiDisplay: {
    fontSize: 64,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  photoActionText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  input: {
    fontSize: FontSizes.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: 'auto',
  },
  continueButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    width: 24,
  },
  stepText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
  },
});
