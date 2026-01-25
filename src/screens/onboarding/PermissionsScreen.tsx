import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingStackParamList } from '../../navigation/AppNavigator';
import { Card } from '../../components';
import { Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { smsService } from '../../services/smsService';
import { notificationListenerService } from '../../services/notificationListenerService';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Permissions'>;

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'checking';

export function PermissionsScreen() {
  const { colors } = useTheme();
  const { completeOnboarding, setCurrentStep } = useOnboarding();
  const navigation = useNavigation<NavigationProp>();

  const [smsPermission, setSmsPermission] = useState<PermissionStatus>('unknown');
  const [notificationPermission, setNotificationPermission] = useState<PermissionStatus>('unknown');
  const [showNotificationSteps, setShowNotificationSteps] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkPermissions();
    }, [])
  );

  const checkPermissions = async () => {
    // Check SMS permission
    if (smsService.isAvailable()) {
      const status = await smsService.checkPermission();
      setSmsPermission(status === 'granted' ? 'granted' : 'denied');
    } else {
      setSmsPermission('denied');
    }

    // Check notification access
    if (notificationListenerService.isAvailable()) {
      const enabled = await notificationListenerService.isEnabled();
      setNotificationPermission(enabled ? 'granted' : 'denied');
    } else {
      setNotificationPermission('denied');
    }
  };

  const handleRequestSmsPermission = async () => {
    setSmsPermission('checking');
    try {
      const status = await smsService.requestPermission();
      setSmsPermission(status === 'granted' ? 'granted' : 'denied');
    } catch (error) {
      setSmsPermission('denied');
    }
  };

  const handleRequestNotificationPermission = async () => {
    setShowNotificationSteps(true);
    await notificationListenerService.requestPermission();
    // Re-check after user returns from settings
    setTimeout(checkPermissions, 1000);
  };

  const handleGoBack = () => {
    setCurrentStep('sms_setup');
    navigation.navigate('SmsSetup');
  };

  const handleComplete = async () => {
    await completeOnboarding();
  };

  const getPermissionIcon = (status: PermissionStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'granted':
        return 'checkmark-circle';
      case 'denied':
        return 'close-circle';
      case 'checking':
        return 'hourglass';
      default:
        return 'ellipse-outline';
    }
  };

  const getPermissionColor = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return colors.success;
      case 'denied':
        return colors.textTertiary;
      case 'checking':
        return colors.warning;
      default:
        return colors.textTertiary;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
          <Ionicons name="shield-checkmark" size={48} color={colors.success} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Grant Permissions
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Allow Chillar to automatically detect your expenses from bank notifications and SMS.
        </Text>
      </View>

      {/* SMS Permission Card */}
      <Card style={styles.permissionCard}>
        <View style={styles.permissionHeader}>
          <View style={[styles.permissionIcon, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="chatbubbles" size={24} color={colors.info} />
          </View>
          <View style={styles.permissionInfo}>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>
              SMS Access
            </Text>
            <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
              Read bank transaction messages
            </Text>
          </View>
          <Ionicons
            name={getPermissionIcon(smsPermission)}
            size={28}
            color={getPermissionColor(smsPermission)}
          />
        </View>

        {smsPermission !== 'granted' && (
          <TouchableOpacity
            style={[styles.grantButton, { backgroundColor: colors.primary }]}
            onPress={handleRequestSmsPermission}
            disabled={smsPermission === 'checking'}
          >
            <Text style={styles.grantButtonText}>
              {smsPermission === 'checking' ? 'Requesting...' : 'Grant Permission'}
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Notification Permission Card */}
      <Card style={styles.permissionCard}>
        <View style={styles.permissionHeader}>
          <View style={[styles.permissionIcon, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="notifications" size={24} color={colors.warning} />
          </View>
          <View style={styles.permissionInfo}>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>
              Notification Access
            </Text>
            <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
              Read bank app notifications
            </Text>
          </View>
          <Ionicons
            name={getPermissionIcon(notificationPermission)}
            size={28}
            color={getPermissionColor(notificationPermission)}
          />
        </View>

        {notificationPermission !== 'granted' && (
          <>
            <TouchableOpacity
              style={[styles.grantButton, { backgroundColor: colors.primary }]}
              onPress={handleRequestNotificationPermission}
            >
              <Ionicons name="settings" size={18} color="#FFFFFF" />
              <Text style={styles.grantButtonText}>Open Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.showStepsButton}
              onPress={() => setShowNotificationSteps(!showNotificationSteps)}
            >
              <Text style={[styles.showStepsText, { color: colors.primary }]}>
                {showNotificationSteps ? 'Hide steps' : 'Show me how'}
              </Text>
              <Ionicons
                name={showNotificationSteps ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </>
        )}
      </Card>

      {/* Notification Access Steps */}
      {showNotificationSteps && notificationPermission !== 'granted' && (
        <Card style={[styles.stepsCard, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.stepsTitle, { color: colors.text }]}>
            📋 How to Enable Notification Access
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Click the <Text style={{ fontWeight: 'bold', color: colors.text }}>"Open Settings"</Text> button above
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Find <Text style={{ fontWeight: 'bold', color: colors.text }}>"Chillar"</Text> in the list of apps
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: 'bold', color: colors.text }}>Toggle the switch ON</Text> to allow notification access
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Confirm the prompt that appears
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Come back to this app - we'll detect your permissions automatically!
              </Text>
            </View>
          </View>

          <View style={[styles.noteBox, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: 'bold' }}>Note:</Text> This is a special Android permission. We only read bank notifications to detect expenses - your data stays on your device.
            </Text>
          </View>
        </Card>
      )}

      {/* Privacy Info */}
      <Card style={[styles.privacyCard, { backgroundColor: colors.surface }]}>
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={20} color={colors.success} />
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            All data is processed locally. We never send your messages or notifications to any server.
          </Text>
        </View>
      </Card>

      {/* Complete Button */}
      <TouchableOpacity
        style={[styles.completeButton, { backgroundColor: colors.primary }]}
        onPress={handleComplete}
      >
        <Text style={styles.completeButtonText}>Get Started</Text>
        <Ionicons name="rocket" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <Text style={[styles.skipNote, { color: colors.textTertiary }]}>
        You can grant these permissions later from Settings
      </Text>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.stepDot, styles.stepDotActive, { backgroundColor: colors.primary }]} />
      </View>

      <Text style={[styles.stepIndicatorText, { color: colors.textTertiary }]}>
        Step 3 of 3
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
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
  permissionCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  permissionDesc: {
    fontSize: FontSizes.sm,
  },
  grantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  showStepsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  showStepsText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  stepsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  stepsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    paddingTop: 2,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  privacyCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  skipNote: {
    textAlign: 'center',
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
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
  stepIndicatorText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
  },
});
