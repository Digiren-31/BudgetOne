import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingStackParamList } from '../../navigation/AppNavigator';
import { Card } from '../../components';
import { Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { aiPatternService } from '../../services/aiPatternService';
import { createSmsPattern } from '../../services/database';
import { generateUUID } from '../../utils/uuid';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'SmsSetup'>;

export function SmsSetupScreen() {
  const { colors } = useTheme();
  const { setCurrentStep } = useOnboarding();
  const navigation = useNavigation<NavigationProp>();

  const [senderId, setSenderId] = useState('');
  const [smsText, setSmsText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSkip = () => {
    setCurrentStep('permissions');
    navigation.navigate('Permissions');
  };

  const handleContinue = async () => {
    if (!senderId.trim() && !smsText.trim()) {
      // User didn't enter anything, just skip
      setCurrentStep('permissions');
      navigation.navigate('Permissions');
      return;
    }

    if (smsText.trim() && !senderId.trim()) {
      Alert.alert('Sender Required', 'Please enter the sender name/number to identify this type of SMS.');
      return;
    }

    if (senderId.trim() && !smsText.trim()) {
      Alert.alert('SMS Required', 'Please paste an example SMS message to set up the pattern.');
      return;
    }

    setIsProcessing(true);

    try {
      // Try to recognize the pattern using AI service
      const response = await aiPatternService.recognizePattern({
        smsText: smsText.trim(),
        senderId: senderId.trim(),
      });

      if (response.success && response.pattern) {
        // Save the pattern to the database
        await createSmsPattern({
          id: generateUUID(),
          name: senderId.trim(),
          senderId: senderId.trim(),
          description: `Auto-detected pattern for ${senderId.trim()}`,
          pattern: response.pattern,
          isEnabled: true,
        });

        Alert.alert(
          'Pattern Saved! ✅',
          `Great! We'll now automatically detect expenses from ${senderId.trim()}.`,
          [{ text: 'Continue', onPress: () => {
            setCurrentStep('permissions');
            navigation.navigate('Permissions');
          }}]
        );
      } else {
        Alert.alert(
          'Pattern Not Recognized',
          response.error || "We couldn't automatically recognize this SMS format. You can set this up later from Settings > SMS Tracking.",
          [{ text: 'Continue Anyway', onPress: () => {
            setCurrentStep('permissions');
            navigation.navigate('Permissions');
          }}]
        );
      }
    } catch (error) {
      console.error('Failed to process SMS pattern:', error);
      Alert.alert(
        'Processing Failed',
        'Something went wrong. You can set this up later from Settings.',
        [{ text: 'Continue Anyway', onPress: () => {
          setCurrentStep('permissions');
          navigation.navigate('Permissions');
        }}]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoBack = () => {
    setCurrentStep('welcome');
    navigation.navigate('Welcome');
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
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
            <Ionicons name="chatbubble-ellipses" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Set Up SMS Tracking
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Paste an example bank SMS to automatically track expenses.{'\n'}
            This step is optional.
          </Text>
        </View>

        {/* Sender Input */}
        <Card style={styles.inputCard}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Sender Name or Number
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
            placeholder="e.g., HDFC-Bank, 567676, BankName"
            placeholderTextColor={colors.textTertiary}
            value={senderId}
            onChangeText={setSenderId}
            autoCapitalize="none"
          />
          <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
            Copy this from your SMS app - it's the name/number shown as sender
          </Text>
        </Card>

        {/* SMS Text Input */}
        <Card style={styles.inputCard}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Example SMS Message
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                color: colors.text,
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
            placeholder="Paste your bank SMS here...&#10;&#10;Example:&#10;Rs.500 debited from A/c XX1234 on 25-Jan-25. UPI Ref: 123456789"
            placeholderTextColor={colors.textTertiary}
            value={smsText}
            onChangeText={setSmsText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </Card>

        {/* Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: colors.info + '10' }]}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color={colors.info} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your SMS is processed locally and never sent to any server. We only extract the pattern to detect future expenses.
            </Text>
          </View>
        </Card>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: colors.border }]}
            onPress={handleSkip}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              Skip for Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: isProcessing ? colors.surfaceVariant : colors.primary,
              },
            ]}
            onPress={handleContinue}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text style={[styles.continueButtonText, { color: colors.textTertiary }]}>
                Processing...
              </Text>
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  {senderId.trim() || smsText.trim() ? 'Save & Continue' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepDot, styles.stepDotActive, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
        </View>

        <Text style={[styles.stepText, { color: colors.textTertiary }]}>
          Step 2 of 3 • Optional
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
    paddingTop: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: FontSizes.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  inputHint: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  textArea: {
    fontSize: FontSizes.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 120,
  },
  infoCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: 'auto',
  },
  skipButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  continueButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#FFFFFF',
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
