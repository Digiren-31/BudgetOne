import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  AccessibilityInfo,
  ScrollView,
  Keyboard,
  Platform,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState } from '../components';
import {
  getAllSmsPatterns,
  createSmsPattern,
  updateSmsPattern,
  deleteSmsPattern,
} from '../services/database';
import { smsService, SmsMessage } from '../services/smsService';
import { aiPatternService } from '../services/aiPatternService';
import { notificationListenerService } from '../services/notificationListenerService';
import { SmsPattern, PatternDefinition } from '../models/types';
import { generateUUID } from '../utils/uuid';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

type OnboardingStep = 'permission' | 'select_sms' | 'manual_paste' | 'processing' | 'confirm' | 'done';
type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'never_ask_again' | 'unavailable';

export function SmsOnboardingScreen() {
  const { colors } = useTheme();

  const [patterns, setPatterns] = useState<SmsPattern[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('permission');
  const [recentSms, setRecentSms] = useState<SmsMessage[]>([]);
  const [selectedSms, setSelectedSms] = useState<SmsMessage | null>(null);
  const [recognizedPattern, setRecognizedPattern] = useState<PatternDefinition | null>(null);
  const [patternName, setPatternName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patternsLoading, setPatternsLoading] = useState(true);
  
  // Manual SMS paste state
  const [manualSmsText, setManualSmsText] = useState('');
  const [manualSenderId, setManualSenderId] = useState('');
  
  // Dev mode state
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [devModeTapCount, setDevModeTapCount] = useState(0);
  const [showPatternDetailModal, setShowPatternDetailModal] = useState(false);
  const [selectedPatternForDetail, setSelectedPatternForDetail] = useState<SmsPattern | null>(null);
  
  // Notification listener state
  const [notificationAccessEnabled, setNotificationAccessEnabled] = useState(false);
  const [isNotificationListenerAvailable, setIsNotificationListenerAvailable] = useState(false);
  
  // Dev mode test state
  const [showDevTestModal, setShowDevTestModal] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  
  // Ref to track if component is mounted (prevent state updates after unmount)
  const isMountedRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      loadPatterns();
      checkPermission();
      checkNotificationAccess();
      
      return () => {
        isMountedRef.current = false;
      };
    }, [])
  );

  const loadPatterns = async () => {
    setPatternsLoading(true);
    try {
      const data = await getAllSmsPatterns();
      if (isMountedRef.current) {
        setPatterns(data);
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to load SMS patterns. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setPatternsLoading(false);
      }
    }
  };

  const checkPermission = async () => {
    if (smsService.isAvailable()) {
      try {
        const status = await smsService.checkPermission();
        if (isMountedRef.current) {
          setPermissionStatus(status as PermissionStatus);
        }
      } catch (error) {
        console.error('Failed to check permission:', error);
        if (isMountedRef.current) {
          setPermissionStatus('denied');
        }
      }
    } else {
      setPermissionStatus('unavailable');
    }
  };

  const checkNotificationAccess = async () => {
    const available = notificationListenerService.isAvailable();
    setIsNotificationListenerAvailable(available);
    
    if (available) {
      const enabled = await notificationListenerService.isEnabled();
      setNotificationAccessEnabled(enabled);
    }
  };

  const handleNotificationAccessToggle = async () => {
    if (notificationAccessEnabled) {
      Alert.alert(
        'Notification Access',
        'To disable notification access, go to Android Settings → Notification Access and turn off Chillar.',
        [{ text: 'OK' }]
      );
    } else {
      await notificationListenerService.requestPermission();
      // Re-check after user returns from settings
      setTimeout(checkNotificationAccess, 1000);
    }
  };

  const handleDevModeTap = () => {
    const newCount = devModeTapCount + 1;
    setDevModeTapCount(newCount);
    
    if (newCount >= 7) {
      setDevModeEnabled(!devModeEnabled);
      setDevModeTapCount(0);
      Alert.alert(
        devModeEnabled ? 'Dev Mode Disabled' : 'Dev Mode Enabled',
        devModeEnabled ? 'Developer options are now hidden.' : 'Developer options are now visible. You can view regex patterns and debug info.'
      );
    }
  };

  const handleViewPatternDetail = (pattern: SmsPattern) => {
    setSelectedPatternForDetail(pattern);
    setShowPatternDetailModal(true);
  };

  const testPatternAgainstSms = (pattern: PatternDefinition, smsText: string): { amount: string | null; merchant: string | null; matched: boolean } => {
    let amount: string | null = null;
    let merchant: string | null = null;
    let matched = false;

    try {
      const amountMatch = smsText.match(new RegExp(pattern.amountRegex, 'i'));
      if (amountMatch && amountMatch[pattern.amountGroup]) {
        amount = amountMatch[pattern.amountGroup];
        matched = true;
      }

      if (pattern.merchantRegex && pattern.merchantGroup) {
        const merchantMatch = smsText.match(new RegExp(pattern.merchantRegex, 'i'));
        if (merchantMatch && merchantMatch[pattern.merchantGroup]) {
          merchant = merchantMatch[pattern.merchantGroup];
        }
      }
    } catch (e) {
      console.error('Regex test error:', e);
    }

    return { amount, merchant, matched };
  };

  const handleRequestPermission = async () => {
    try {
      const status = await smsService.requestPermission();
      if (!isMountedRef.current) return;
      
      setPermissionStatus(status as PermissionStatus);
      if (status === 'granted') {
        setOnboardingStep('select_sms');
        loadRecentSms();
      } else if (status === 'never_ask_again') {
        Alert.alert(
          'Permission Required',
          'SMS permission is required for auto-detection. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      Alert.alert('Error', 'Failed to request SMS permission. Please try again.');
    }
  };

  const loadRecentSms = async () => {
    setIsLoading(true);
    try {
      const messages = await smsService.getRecentMessages(50);
      if (isMountedRef.current) {
        setRecentSms(messages);
      }
    } catch (error) {
      console.error('Failed to load SMS:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to load SMS messages. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const startOnboarding = () => {
    // Reset state before starting
    setSelectedSms(null);
    setRecognizedPattern(null);
    setPatternName('');
    setManualSmsText('');
    setManualSenderId('');
    setShowOnboardingModal(true);
    
    // Always start with manual paste option since SMS reading may not work in Expo Go
    setOnboardingStep('manual_paste');
  };

  const handleManualPaste = async () => {
    Keyboard.dismiss();
    
    const trimmedText = manualSmsText.trim();
    const trimmedSender = manualSenderId.trim();
    
    if (!trimmedText) {
      Alert.alert('Validation Error', 'Please paste the SMS text.');
      return;
    }
    
    if (!trimmedSender) {
      Alert.alert('Validation Error', 'Please enter the sender ID (e.g., HDFCBK, SBIINB).');
      return;
    }
    
    // Create a virtual SMS message from manual input
    const manualSms: SmsMessage = {
      id: generateUUID(),
      address: trimmedSender.toUpperCase(),
      body: trimmedText,
      date: Date.now(),
      read: true,
    };
    
    setSelectedSms(manualSms);
    setOnboardingStep('processing');
    setPatternName(`${manualSms.address} debit SMS`);

    try {
      console.log('[SmsOnboarding] Calling AI pattern recognition...');
      const result = await aiPatternService.recognizePattern({
        smsText: manualSms.body,
        senderId: manualSms.address,
        timestamp: new Date(manualSms.date).toISOString(),
      });
      
      console.log('[SmsOnboarding] AI result:', JSON.stringify(result, null, 2));

      if (!isMountedRef.current) return;

      if (result.success && result.pattern) {
        // Show info if fallback was used
        if (result.error) {
          console.log('[SmsOnboarding] Note:', result.error);
        }
        setRecognizedPattern(result.pattern);
        setOnboardingStep('confirm');
        AccessibilityInfo.announceForAccessibility('Pattern recognized successfully');
      } else {
        Alert.alert(
          'Pattern Not Recognized',
          result.error || 'We could not recognize a transaction pattern in this SMS. Please make sure you pasted a valid bank debit/transaction SMS.',
          [{ text: 'OK', onPress: () => setOnboardingStep('manual_paste') }]
        );
      }
    } catch (error) {
      console.error('[SmsOnboarding] Pattern recognition failed:', error);
      if (isMountedRef.current) {
        Alert.alert(
          'Error', 
          `Failed to recognize pattern: ${error instanceof Error ? error.message : String(error)}`
        );
        setOnboardingStep('manual_paste');
      }
    }
  };

  const handleSelectSms = async (sms: SmsMessage) => {
    setSelectedSms(sms);
    setOnboardingStep('processing');
    setPatternName(`${sms.address} debit SMS`);

    try {
      const result = await aiPatternService.recognizePattern({
        smsText: sms.body,
        senderId: sms.address,
        timestamp: new Date(sms.date).toISOString(),
      });

      if (!isMountedRef.current) return;

      if (result.success && result.pattern) {
        setRecognizedPattern(result.pattern);
        setOnboardingStep('confirm');
        AccessibilityInfo.announceForAccessibility('Pattern recognized successfully');
      } else {
        Alert.alert(
          'Pattern Not Recognized',
          result.error || 'We could not recognize a transaction pattern in this SMS. Please try selecting a different bank debit SMS.',
          [{ text: 'OK', onPress: () => setOnboardingStep('select_sms') }]
        );
      }
    } catch (error) {
      console.error('Pattern recognition failed:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to recognize pattern. Please try again.');
        setOnboardingStep('select_sms');
      }
    }
  };

  const handleConfirmPattern = async () => {
    if (!selectedSms || !recognizedPattern) {
      Alert.alert('Error', 'Missing SMS or pattern data. Please try again.');
      return;
    }

    const trimmedName = patternName.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter a pattern name.');
      return;
    }

    setIsLoading(true);
    try {
      const pattern: Omit<SmsPattern, 'createdAt' | 'updatedAt'> = {
        id: generateUUID(),
        name: trimmedName,
        senderId: selectedSms.address,
        description: `Auto-detected pattern for ${selectedSms.address}`,
        pattern: recognizedPattern,
        isEnabled: true,
      };

      await createSmsPattern(pattern);
      await smsService.refreshPatterns();
      
      if (!isMountedRef.current) return;
      
      setOnboardingStep('done');
      loadPatterns();
      AccessibilityInfo.announceForAccessibility('Pattern saved successfully');
    } catch (error) {
      console.error('Failed to save pattern:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to save pattern. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const closeOnboarding = () => {
    setShowOnboardingModal(false);
    // Delay state reset to allow modal animation to complete
    setTimeout(() => {
      if (isMountedRef.current) {
        setSelectedSms(null);
        setRecognizedPattern(null);
        setPatternName('');
        setOnboardingStep('permission');
      }
    }, 300);
  };

  const handleTogglePattern = async (pattern: SmsPattern) => {
    try {
      await updateSmsPattern(pattern.id, { isEnabled: !pattern.isEnabled });
      await smsService.refreshPatterns();
      if (isMountedRef.current) {
        loadPatterns();
        AccessibilityInfo.announceForAccessibility(
          `Pattern ${pattern.name} ${pattern.isEnabled ? 'disabled' : 'enabled'}`
        );
      }
    } catch (error) {
      console.error('Failed to toggle pattern:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to update pattern. Please try again.');
      }
    }
  };

  const handleDeletePattern = (pattern: SmsPattern) => {
    Alert.alert(
      'Delete Pattern',
      `Delete "${pattern.name}"? This will stop auto-detection for this SMS sender.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSmsPattern(pattern.id);
              await smsService.refreshPatterns();
              if (isMountedRef.current) {
                loadPatterns();
                AccessibilityInfo.announceForAccessibility(`Pattern ${pattern.name} deleted`);
              }
            } catch (error) {
              console.error('Failed to delete pattern:', error);
              if (isMountedRef.current) {
                Alert.alert('Error', 'Failed to delete pattern. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const renderPatternItem = ({ item }: { item: SmsPattern }) => (
    <Card style={styles.patternCard}>
      <View style={styles.patternHeader}>
        <View 
          style={[styles.patternIcon, { backgroundColor: colors.primary }]}
          accessible={true}
          accessibilityLabel="SMS pattern icon"
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.patternInfo}>
          <Text style={[styles.patternName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.patternSender, { color: colors.textSecondary }]}>
            Sender: {item.senderId}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: item.isEnabled ? colors.success : colors.surfaceVariant },
          ]}
          onPress={() => handleTogglePattern(item)}
          accessible={true}
          accessibilityRole="switch"
          accessibilityState={{ checked: item.isEnabled }}
          accessibilityLabel={`Toggle ${item.name} pattern`}
          accessibilityHint={item.isEnabled ? 'Double tap to disable' : 'Double tap to enable'}
        >
          <Text style={[styles.toggleText, { color: item.isEnabled ? '#FFFFFF' : colors.textSecondary }]}>
            {item.isEnabled ? 'Active' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.patternActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.border, marginRight: Spacing.sm }]}
          onPress={() => handleViewPatternDetail(item)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`View ${item.name} pattern details`}
        >
          <Ionicons name="code-slash" size={16} color={colors.info} />
          <Text style={[styles.actionText, { color: colors.info }]}>View Regex</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.border }]}
          onPress={() => handleDeletePattern(item)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.name} pattern`}
        >
          <Ionicons name="trash" size={16} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderOnboardingContent = () => {
    switch (onboardingStep) {
      case 'permission':
        return (
          <View style={styles.stepContent}>
            <Ionicons name="chatbubble-ellipses" size={64} color={colors.primary} />
            <Text 
              style={[styles.stepTitle, { color: colors.text }]}
              accessible={true}
              accessibilityRole="header"
            >
              SMS Permission Required
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              To automatically detect expenses from your bank SMS, we need permission to read your messages.
              {'\n\n'}
              We only read transaction-related messages and never share your data with anyone.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleRequestPermission}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Grant SMS permission"
            >
              <Text style={styles.primaryButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        );

      case 'manual_paste':
        return (
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Ionicons name="clipboard" size={64} color={colors.primary} />
            <Text 
              style={[styles.stepTitle, { color: colors.text }]}
              accessible={true}
              accessibilityRole="header"
            >
              Paste Your Bank SMS
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Copy a transaction SMS from your bank and paste it below. Our AI will learn the pattern to auto-detect future expenses.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Sender ID (e.g., HDFCBK, SBIINB, ICICIB)
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
              value={manualSenderId}
              onChangeText={setManualSenderId}
              placeholder="Enter sender ID"
              placeholderTextColor={colors.textTertiary}
              accessible={true}
              accessibilityLabel="Sender ID input"
              accessibilityHint="Enter the sender ID of the SMS like HDFCBK"
              autoCapitalize="characters"
              returnKeyType="next"
              maxLength={20}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              SMS Text
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
              value={manualSmsText}
              onChangeText={setManualSmsText}
              placeholder="Paste the full SMS text here..."
              placeholderTextColor={colors.textTertiary}
              accessible={true}
              accessibilityLabel="SMS text input"
              accessibilityHint="Paste the bank SMS text here"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />

            <View style={styles.exampleBox}>
              <Text style={[styles.exampleLabel, { color: colors.textSecondary }]}>
                Example:
              </Text>
              <Text style={[styles.exampleText, { color: colors.textTertiary }]}>
                Rs.1,250.00 debited from a/c **1234 on 24-01-26. Info: UPI/SWIGGY. Avl bal: Rs.15,000.00
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                (!manualSmsText.trim() || !manualSenderId.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleManualPaste}
              disabled={!manualSmsText.trim() || !manualSenderId.trim()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Analyze SMS pattern"
              accessibilityState={{ disabled: !manualSmsText.trim() || !manualSenderId.trim() }}
            >
              <Text style={styles.primaryButtonText}>Analyze Pattern</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'select_sms':
        return (
          <View style={styles.stepContent}>
            <Text 
              style={[styles.stepTitle, { color: colors.text }]}
              accessible={true}
              accessibilityRole="header"
            >
              Select a Bank SMS
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Choose a typical debit/transaction SMS from your bank to teach the app how to detect expenses.
            </Text>
            {isLoading ? (
              <ActivityIndicator 
                size="large" 
                color={colors.primary} 
                style={styles.loader}
                accessibilityLabel="Loading SMS messages"
              />
            ) : (
              <FlatList
                data={recentSms}
                keyExtractor={(item) => item.id}
                style={styles.smsList}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.smsItem, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => handleSelectSms(item)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`SMS from ${item.address}`}
                    accessibilityHint="Double tap to select this SMS for pattern recognition"
                  >
                    <Text style={[styles.smsSender, { color: colors.primary }]}>
                      {item.address}
                    </Text>
                    <Text
                      style={[styles.smsBody, { color: colors.text }]}
                      numberOfLines={3}
                    >
                      {item.body}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No SMS messages found. You can manually paste SMS text in a future update.
                  </Text>
                }
              />
            )}
          </View>
        );

      case 'processing':
        return (
          <View style={styles.stepContent}>
            <ActivityIndicator 
              size="large" 
              color={colors.primary}
              accessibilityLabel="Analyzing SMS pattern"
            />
            <Text 
              style={[styles.stepTitle, { color: colors.text }]}
              accessible={true}
              accessibilityRole="header"
            >
              Analyzing SMS Pattern...
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Our AI is learning how to extract expense information from this SMS format.
            </Text>
          </View>
        );

      case 'confirm':
        return (
          <View style={styles.stepContent}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text 
              style={[styles.stepTitle, { color: colors.text }]}
              accessible={true}
              accessibilityRole="header"
            >
              Pattern Recognized!
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              We found a pattern to detect amounts from this SMS type.
            </Text>

            {selectedSms && (
              <View style={[styles.previewCard, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  Sample SMS:
                </Text>
                <Text 
                  style={[styles.previewText, { color: colors.text }]} 
                  numberOfLines={3}
                  accessible={true}
                  accessibilityLabel={`Sample SMS: ${selectedSms.body}`}
                >
                  {selectedSms.body}
                </Text>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Pattern Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
              value={patternName}
              onChangeText={setPatternName}
              placeholder="e.g., HDFC Debit SMS"
              placeholderTextColor={colors.textTertiary}
              accessible={true}
              accessibilityLabel="Pattern name input"
              accessibilityHint="Enter a name for this SMS pattern"
              autoCapitalize="words"
              returnKeyType="done"
              maxLength={50}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                (isLoading || !patternName.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleConfirmPattern}
              disabled={isLoading || !patternName.trim()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isLoading ? 'Saving pattern' : 'Save pattern'}
              accessibilityState={{ disabled: isLoading || !patternName.trim() }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Save Pattern</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'done':
        return (
          <View style={styles.stepContent}>
            <Ionicons name="rocket" size={64} color={colors.primary} />
            <Text 
              style={[styles.stepTitle, { color: colors.text }]}
              accessible={true}
              accessibilityRole="header"
            >
              You're All Set!
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              The app will now automatically detect expenses when you receive similar SMS messages
              and notify you to confirm them.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={closeOnboarding}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Done, close dialog"
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Info - Tap 7 times to enable dev mode */}
      <TouchableOpacity onPress={handleDevModeTap} activeOpacity={0.8}>
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <Text 
            style={[styles.infoText, { color: colors.textSecondary }]}
            accessible={true}
            accessibilityLabel="SMS detection information"
          >
            Paste a bank SMS to teach Chillar its format. The AI will create a pattern to detect similar messages automatically.
          </Text>
        </Card>
      </TouchableOpacity>

      {/* How It Works */}
      {patterns.length === 0 && (
        <Card style={styles.howItWorksCard}>
          <Text style={[styles.howItWorksTitle, { color: colors.text }]}>
            How It Works
          </Text>
          <View style={styles.howItWorksStep}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Copy a bank transaction SMS from your messages app
            </Text>
          </View>
          <View style={styles.howItWorksStep}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Paste it here and our AI will learn the pattern
            </Text>
          </View>
          <View style={styles.howItWorksStep}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Future similar SMS will be auto-detected as expenses
            </Text>
          </View>
        </Card>
      )}

      {/* Permission Status */}
      {permissionStatus !== 'granted' && permissionStatus !== 'unavailable' && permissionStatus !== 'unknown' && (
        <View 
          style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}
          accessible={true}
          accessibilityRole="alert"
        >
          <Ionicons name="warning" size={24} color={colors.warning} />
          <View style={styles.warningContent}>
            <Text style={[styles.warningTitle, { color: colors.warning }]}>
              SMS Permission Required
            </Text>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Grant SMS permission to enable automatic expense detection.
            </Text>
          </View>
        </View>
      )}

      {permissionStatus === 'unavailable' && (
        <View 
          style={[styles.warningCard, { backgroundColor: colors.textTertiary + '20' }]}
          accessible={true}
          accessibilityRole="alert"
        >
          <Ionicons name="phone-portrait" size={24} color={colors.textSecondary} />
          <View style={styles.warningContent}>
            <Text style={[styles.warningTitle, { color: colors.text }]}>
              Not Available on iOS
            </Text>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              SMS reading is not supported on iOS due to platform restrictions.
              You can still add expenses manually.
            </Text>
          </View>
        </View>
      )}

      {/* Notification Access Card - Android Only */}
      {Platform.OS === 'android' && (
        <Card style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <View style={[styles.notificationIcon, { backgroundColor: notificationAccessEnabled ? colors.success : (isNotificationListenerAvailable ? colors.warning : colors.textTertiary) }]}>
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.notificationInfo}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                Notification Access
              </Text>
              <Text style={[styles.notificationSubtitle, { color: colors.textSecondary }]}>
                {!isNotificationListenerAvailable 
                  ? 'Requires app rebuild with native module'
                  : notificationAccessEnabled 
                    ? 'Active - Reading bank notifications' 
                    : 'Required for background detection'}
              </Text>
            </View>
            {isNotificationListenerAvailable && (
              <Switch
                value={notificationAccessEnabled}
                onValueChange={handleNotificationAccessToggle}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            )}
          </View>
          {!isNotificationListenerAvailable && (
            <View style={[styles.moduleWarning, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={[styles.moduleWarningText, { color: colors.textSecondary }]}>
                Native notification listener module not available. Install the latest APK build to enable this feature.
              </Text>
            </View>
          )}
          {isNotificationListenerAvailable && !notificationAccessEnabled && (
            <TouchableOpacity
              style={[styles.enableButton, { backgroundColor: colors.primary }]}
              onPress={handleNotificationAccessToggle}
            >
              <Text style={styles.enableButtonText}>Enable Notification Access</Text>
            </TouchableOpacity>
          )}
        </Card>
      )}

      {/* Patterns List */}
      {patternsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={colors.primary}
            accessibilityLabel="Loading patterns"
          />
        </View>
      ) : (
        <FlatList
          data={patterns}
          renderItem={renderPatternItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No SMS patterns"
              message="Set up a pattern to start auto-detecting expenses from your bank SMS."
              action={
                permissionStatus !== 'unavailable'
                  ? { label: 'Add Pattern', onPress: startOnboarding }
                  : undefined
              }
            />
          }
        />
      )}

      {/* Add Pattern Button */}
      {permissionStatus !== 'unavailable' && patterns.length > 0 && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={startOnboarding}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Add new SMS pattern"
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New Pattern</Text>
        </TouchableOpacity>
      )}

      {/* Onboarding Modal */}
      <Modal 
        visible={showOnboardingModal} 
        transparent 
        animationType="slide"
        onRequestClose={closeOnboarding}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text 
                style={[styles.modalTitle, { color: colors.text }]}
                accessible={true}
                accessibilityRole="header"
              >
                Set Up SMS Detection
              </Text>
              <TouchableOpacity 
                onPress={closeOnboarding}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {renderOnboardingContent()}
          </View>
        </View>
      </Modal>

      {/* Pattern Detail Modal */}
      <Modal
        visible={showPatternDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPatternDetailModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Pattern Details
              </Text>
              <TouchableOpacity
                onPress={() => setShowPatternDetailModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {selectedPatternForDetail && (
              <ScrollView style={styles.patternDetailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pattern Name</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedPatternForDetail.name}</Text>

                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Sender ID</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedPatternForDetail.senderId}</Text>

                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedPatternForDetail.description || 'N/A'}</Text>

                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                <Text style={[styles.detailValue, { color: selectedPatternForDetail.isEnabled ? colors.success : colors.error }]}>
                  {selectedPatternForDetail.isEnabled ? 'Enabled' : 'Disabled'}
                </Text>

                <Text style={[styles.detailSectionTitle, { color: colors.primary }]}>Regex Patterns</Text>
                
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Sender Regex</Text>
                <View style={[styles.codeBlock, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.codeText, { color: colors.text }]} selectable>
                    {selectedPatternForDetail.pattern.senderRegex}
                  </Text>
                </View>

                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount Regex (Group {selectedPatternForDetail.pattern.amountGroup})</Text>
                <View style={[styles.codeBlock, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.codeText, { color: colors.text }]} selectable>
                    {selectedPatternForDetail.pattern.amountRegex}
                  </Text>
                </View>

                {selectedPatternForDetail.pattern.merchantRegex && (
                  <>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Merchant Regex (Group {selectedPatternForDetail.pattern.merchantGroup})
                    </Text>
                    <View style={[styles.codeBlock, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[styles.codeText, { color: colors.text }]} selectable>
                        {selectedPatternForDetail.pattern.merchantRegex}
                      </Text>
                    </View>
                  </>
                )}

                {selectedPatternForDetail.pattern.dateTimeRegex && (
                  <>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      DateTime Regex (Group {selectedPatternForDetail.pattern.dateTimeGroup})
                    </Text>
                    <View style={[styles.codeBlock, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[styles.codeText, { color: colors.text }]} selectable>
                        {selectedPatternForDetail.pattern.dateTimeRegex}
                      </Text>
                    </View>
                    {selectedPatternForDetail.pattern.dateTimeFormat && (
                      <Text style={[styles.detailHint, { color: colors.textTertiary }]}>
                        Format: {selectedPatternForDetail.pattern.dateTimeFormat}
                      </Text>
                    )}
                  </>
                )}

                <Text style={[styles.detailSectionTitle, { color: colors.primary }]}>Test Pattern</Text>
                <Text style={[styles.detailHint, { color: colors.textSecondary }]}>
                  Paste an SMS below to test if the pattern extracts data correctly:
                </Text>
                <TextInput
                  style={[styles.testInput, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                  placeholder="Paste SMS text here..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={manualSmsText}
                  onChangeText={setManualSmsText}
                />
                {manualSmsText.trim() && (
                  <View style={[styles.testResultBox, { backgroundColor: colors.surfaceVariant }]}>
                    {(() => {
                      const result = testPatternAgainstSms(selectedPatternForDetail.pattern, manualSmsText);
                      return (
                        <>
                          <Text style={[styles.testResultLabel, { color: result.matched ? colors.success : colors.error }]}>
                            {result.matched ? '✓ Pattern Matched' : '✗ No Match'}
                          </Text>
                          {result.matched && (
                            <>
                              <Text style={[styles.testResultItem, { color: colors.text }]}>
                                Amount: <Text style={{ fontWeight: '700' }}>{result.amount || 'N/A'}</Text>
                              </Text>
                              <Text style={[styles.testResultItem, { color: colors.text }]}>
                                Merchant: <Text style={{ fontWeight: '700' }}>{result.merchant || 'N/A'}</Text>
                              </Text>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </View>
                )}

                <Text style={[styles.detailLabel, { color: colors.textSecondary, marginTop: Spacing.lg }]}>Created At</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {new Date(selectedPatternForDetail.createdAt).toLocaleString()}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Dev Mode Toggle (hidden - tap header 7 times) */}
      {devModeEnabled && (
        <View style={[styles.devModeBar, { backgroundColor: colors.warning }]}>
          <Ionicons name="bug" size={16} color="#000" />
          <Text style={styles.devModeText}>Dev Mode Enabled</Text>
          <TouchableOpacity
            style={styles.devModeTestButton}
            onPress={() => setShowDevTestModal(true)}
          >
            <Text style={styles.devModeTestButtonText}>Test Reading</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dev Mode Test Modal */}
      <Modal
        visible={showDevTestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDevTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>🔧 Notification Reading Test</Text>
              <TouchableOpacity onPress={() => setShowDevTestModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.devTestContent}>
              {/* Status Section */}
              <View style={[styles.devTestSection, { backgroundColor: colors.background }]}>
                <Text style={[styles.devTestSectionTitle, { color: colors.text }]}>📊 Status</Text>
                <View style={styles.devTestRow}>
                  <Text style={[styles.devTestLabel, { color: colors.textSecondary }]}>Native Module Available:</Text>
                  <Text style={[styles.devTestValue, { color: isNotificationListenerAvailable ? colors.success : colors.error }]}>
                    {isNotificationListenerAvailable ? '✓ Yes' : '✗ No'}
                  </Text>
                </View>
                <View style={styles.devTestRow}>
                  <Text style={[styles.devTestLabel, { color: colors.textSecondary }]}>Notification Access:</Text>
                  <Text style={[styles.devTestValue, { color: notificationAccessEnabled ? colors.success : colors.error }]}>
                    {notificationAccessEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </Text>
                </View>
              </View>

              {/* Test Actions */}
              <View style={[styles.devTestSection, { backgroundColor: colors.background }]}>
                <Text style={[styles.devTestSectionTitle, { color: colors.text }]}>🧪 Test Actions</Text>
                
                <TouchableOpacity
                  style={[styles.devTestButton, { backgroundColor: colors.primary }]}
                  onPress={async () => {
                    setIsTestingNotification(true);
                    setTestResult(null);
                    try {
                      const available = notificationListenerService.isAvailable();
                      const enabled = available ? await notificationListenerService.isEnabled() : false;
                      const expenses = available ? await notificationListenerService.getPendingExpenses() : [];
                      setPendingExpenses(expenses);
                      setTestResult(
                        `Module Available: ${available}\n` +
                        `Access Enabled: ${enabled}\n` +
                        `Pending Expenses: ${expenses.length}\n\n` +
                        `If Access is Enabled but no expenses detected:\n` +
                        `1. Send yourself a test bank SMS\n` +
                        `2. Or use another phone to send: "Rs.500 debited from HDFC"\n` +
                        `3. Wait for notification, then check again`
                      );
                    } catch (e: any) {
                      setTestResult(`Error: ${e.message}`);
                    }
                    setIsTestingNotification(false);
                  }}
                  disabled={isTestingNotification}
                >
                  {isTestingNotification ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.devTestButtonText}>Check Notification Reading Status</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.devTestButton, { backgroundColor: colors.secondary, marginTop: Spacing.sm }]}
                  onPress={async () => {
                    try {
                      const processed = await notificationListenerService.processPendingExpenses();
                      Alert.alert('Processed', `Processed ${processed} pending expenses`);
                      const expenses = await notificationListenerService.getPendingExpenses();
                      setPendingExpenses(expenses);
                    } catch (e: any) {
                      Alert.alert('Error', e.message);
                    }
                  }}
                >
                  <Text style={styles.devTestButtonText}>Process Pending Expenses</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.devTestButton, { backgroundColor: colors.error, marginTop: Spacing.sm }]}
                  onPress={async () => {
                    try {
                      await notificationListenerService.clearPendingExpenses();
                      setPendingExpenses([]);
                      Alert.alert('Cleared', 'All pending expenses cleared');
                    } catch (e: any) {
                      Alert.alert('Error', e.message);
                    }
                  }}
                >
                  <Text style={styles.devTestButtonText}>Clear Pending Expenses</Text>
                </TouchableOpacity>
              </View>

              {/* Test Result */}
              {testResult && (
                <View style={[styles.devTestSection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.devTestSectionTitle, { color: colors.text }]}>📝 Result</Text>
                  <Text style={[styles.devTestResultText, { color: colors.text }]}>{testResult}</Text>
                </View>
              )}

              {/* Pending Expenses */}
              {pendingExpenses.length > 0 && (
                <View style={[styles.devTestSection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.devTestSectionTitle, { color: colors.text }]}>
                    💰 Pending Expenses ({pendingExpenses.length})
                  </Text>
                  {pendingExpenses.map((expense, index) => (
                    <View key={expense.id || index} style={[styles.devTestExpenseItem, { borderColor: colors.border }]}>
                      <Text style={[styles.devTestExpenseAmount, { color: colors.primary }]}>₹{expense.amount}</Text>
                      <Text style={[styles.devTestExpenseMerchant, { color: colors.text }]}>{expense.merchant}</Text>
                      <Text style={[styles.devTestExpenseText, { color: colors.textSecondary }]} numberOfLines={2}>
                        {expense.rawText}
                      </Text>
                      <Text style={[styles.devTestExpenseTime, { color: colors.textSecondary }]}>
                        {new Date(expense.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Instructions */}
              <View style={[styles.devTestSection, { backgroundColor: colors.background }]}>
                <Text style={[styles.devTestSectionTitle, { color: colors.text }]}>📖 How to Test</Text>
                <Text style={[styles.devTestInstructions, { color: colors.textSecondary }]}>
                  1. Ensure "Notification Access" is enabled above{"\n"}
                  2. Close this app completely{"\n"}
                  3. Send a test bank SMS from another phone:{"\n"}
                     "Rs.500 debited from HDFC Bank"  {"\n"}
                  4. You should see a "💰 New expense detected" notification{"\n"}
                  5. Open this app and check pending expenses{"\n\n"}
                  ⚠️ Note: The app must be installed from the latest build with notification listener enabled.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    margin: Spacing.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  howItWorksCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  howItWorksTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  howItWorksStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  warningCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'flex-start',
  },
  warningContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  warningTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  warningText: {
    fontSize: FontSizes.sm,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  patternCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  patternSender: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  toggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  patternActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actionText: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
  },
  stepContent: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  smsList: {
    width: '100%',
    marginTop: Spacing.md,
    maxHeight: 300,
  },
  smsItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  smsSender: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  smsBody: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    padding: Spacing.lg,
  },
  previewCard: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  previewLabel: {
    fontSize: FontSizes.sm,
    marginBottom: 4,
  },
  previewText: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  input: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.lg,
    borderWidth: 1,
  },
  textArea: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    borderWidth: 1,
    minHeight: 120,
  },
  scrollContent: {
    width: '100%',
    maxHeight: 500,
  },
  scrollContentContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  exampleBox: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderStyle: 'dashed',
  },
  exampleLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  primaryButton: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  // Notification access card styles
  notificationCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  notificationSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  moduleWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  moduleWarningText: {
    flex: 1,
    marginLeft: Spacing.xs,
    fontSize: FontSizes.xs,
    lineHeight: 16,
  },
  enableButton: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  // Pattern detail modal styles
  patternDetailContent: {
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  detailLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  detailSectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  codeBlock: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  detailHint: {
    fontSize: FontSizes.xs,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  testInput: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: FontSizes.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  testResultBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  testResultLabel: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  testResultItem: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  // Dev mode styles
  devModeBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  devModeText: {
    marginLeft: Spacing.xs,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  devModeTestButton: {
    backgroundColor: '#000',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  devModeTestButtonText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  devTestContent: {
    flex: 1,
    padding: Spacing.md,
  },
  devTestSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  devTestSectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  devTestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  devTestLabel: {
    fontSize: FontSizes.sm,
  },
  devTestValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  devTestButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  devTestButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  devTestResultText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  devTestExpenseItem: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  devTestExpenseAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  devTestExpenseMerchant: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginTop: 2,
  },
  devTestExpenseText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  devTestExpenseTime: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  devTestInstructions: {
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
});
