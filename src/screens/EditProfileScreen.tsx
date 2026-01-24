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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Card } from '../components';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

export function EditProfileScreen() {
  const { colors } = useTheme();
  const { profile, setProfile } = useSettings();
  const navigation = useNavigation();

  const [name, setName] = useState(profile.name);
  const [photoUri, setPhotoUri] = useState(profile.photoUri);

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

  const handleRemovePhoto = () => {
    setPhotoUri(null);
  };

  const handleSave = () => {
    setProfile({
      name: name.trim(),
      photoUri,
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={[styles.photoContainer, { backgroundColor: colors.primary }]}
            onPress={handlePickImage}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <Ionicons name="person" size={64} color="#FFFFFF" />
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.surface }]}>
              <Ionicons name="camera" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
          
          {photoUri && (
            <TouchableOpacity onPress={handleRemovePhoto}>
              <Text style={[styles.removePhoto, { color: colors.error }]}>
                Remove Photo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Name Input */}
        <Card style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surfaceVariant },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </Card>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
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
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhoto: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  section: {
    padding: Spacing.md,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.lg,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});
