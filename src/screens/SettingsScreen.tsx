import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Card, ListItem, SectionHeader } from '../components';
import { CURRENCIES, Currency } from '../constants/currencies';
import { getAllSmsPatterns } from '../services/database';
import { smsService } from '../services/smsService';
import { notificationListenerService } from '../services/notificationListenerService';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

type RootStackParamList = {
  SettingsMain: undefined;
  EditProfile: undefined;
  SelectCurrency: undefined;
  ManageCategories: undefined;
  SmsOnboarding: undefined;
  NotificationSettings: undefined;
  About: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const { currency, profile, notifications, setNotifications } = useSettings();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const [smsPatternCount, setSmsPatternCount] = useState(0);
  const [smsPermissionStatus, setSmsPermissionStatus] = useState<string>('unknown');
  const [notificationAccessEnabled, setNotificationAccessEnabled] = useState(false);
  const [isNotificationListenerAvailable, setIsNotificationListenerAvailable] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSmsPatterns();
      checkSmsPermission();
      checkNotificationListenerStatus();
    }, [])
  );

  const loadSmsPatterns = async () => {
    try {
      const patterns = await getAllSmsPatterns();
      setSmsPatternCount(patterns.length);
    } catch (error) {
      console.error('Failed to load SMS patterns:', error);
    }
  };

  const checkSmsPermission = async () => {
    if (smsService.isAvailable()) {
      const status = await smsService.checkPermission();
      setSmsPermissionStatus(status);
    } else {
      setSmsPermissionStatus('unavailable');
    }
  };

  const checkNotificationListenerStatus = async () => {
    const available = notificationListenerService.isAvailable();
    setIsNotificationListenerAvailable(available);
    
    if (available) {
      const enabled = await notificationListenerService.isEnabled();
      setNotificationAccessEnabled(enabled);
    }
  };

  const handleNotificationAccessPress = async () => {
    if (notificationAccessEnabled) {
      // Already enabled, show info
      Alert.alert(
        'Notification Access Enabled',
        'BudgetOne is reading bank notifications to detect expenses automatically.\n\n' +
        'To disable, go to Android Settings > Notification Access and turn off BudgetOne.',
        [{ text: 'OK' }]
      );
    } else {
      // Request permission
      await notificationListenerService.requestPermission();
      // Check status after user returns from settings
      setTimeout(async () => {
        const enabled = await notificationListenerService.isEnabled();
        setNotificationAccessEnabled(enabled);
      }, 1000);
    }
  };

  const handleToggleSmsNotification = async (value: boolean) => {
    if (value && smsPermissionStatus !== 'granted') {
      const status = await smsService.requestPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'SMS read permission is required to detect expenses automatically.',
          [{ text: 'OK' }]
        );
        return;
      }
      setSmsPermissionStatus(status);
    }
    setNotifications({ ...notifications, smsDetectionEnabled: value });
  };

  const handleToggleDailySummary = (value: boolean) => {
    setNotifications({ ...notifications, dailySummaryEnabled: value });
  };

  const getThemeIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (themeMode) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      default:
        return 'phone-portrait';
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  const handleThemePress = () => {
    Alert.alert('Choose Theme', 'Select your preferred appearance', [
      { text: 'Light', onPress: () => setThemeMode('light') },
      { text: 'Dark', onPress: () => setThemeMode('dark') },
      { text: 'System', onPress: () => setThemeMode('system') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Profile Section */}
      <SectionHeader title="Profile" />
      <Card style={styles.section}>
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={32} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile.name || 'Set up your profile'}
            </Text>
            <Text style={[styles.profileSubtext, { color: colors.textSecondary }]}>
              Tap to edit
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <ListItem
          title="Currency"
          leftIcon="cash"
          leftIconColor={colors.secondary}
          rightText={`${currency.symbol} ${currency.code}`}
          showChevron
          onPress={() => navigation.navigate('SelectCurrency')}
        />

        <ListItem
          title="Appearance"
          leftIcon={getThemeIcon()}
          leftIconColor="#8B5CF6"
          rightText={getThemeLabel()}
          showChevron
          onPress={handleThemePress}
        />
      </Card>

      {/* Notifications Section */}
      <SectionHeader title="Notifications" />
      <Card style={styles.section}>
        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning }]}>
            <Ionicons name="notifications" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.toggleContent}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>
              SMS Expense Detection
            </Text>
            <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
              Get notified when new expenses are detected
            </Text>
          </View>
          <Switch
            value={notifications.smsDetectionEnabled}
            onValueChange={handleToggleSmsNotification}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.info }]}>
            <Ionicons name="calendar" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.toggleContent}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Daily Summary</Text>
            <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
              Receive a daily spending summary at 9 PM
            </Text>
          </View>
          <Switch
            value={notifications.dailySummaryEnabled}
            onValueChange={handleToggleDailySummary}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <ListItem
          title="Notification Settings"
          subtitle="Quick picks, sound, vibration & more"
          leftIcon="options"
          leftIconColor="#8B5CF6"
          showChevron
          onPress={() => navigation.navigate('NotificationSettings')}
        />
      </Card>

      {/* Expense Management Section */}
      <SectionHeader title="Expense Management" />
      <Card style={styles.section}>
        <ListItem
          title="Manage Categories"
          subtitle="Add, edit, or archive expense categories"
          leftIcon="pricetags"
          leftIconColor="#EC4899"
          showChevron
          onPress={() => navigation.navigate('ManageCategories')}
        />
      </Card>

      {/* SMS Onboarding Section - Critical Feature */}
      <SectionHeader title="SMS Tracking" />
      <Card style={[styles.section, styles.smsSection]}>
        <View style={styles.smsHeader}>
          <View style={[styles.smsBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            <Text style={styles.smsBadgeText}>Core Feature</Text>
          </View>
        </View>

        <View style={styles.smsContent}>
          <Ionicons name="chatbubble-ellipses" size={48} color={colors.primary} />
          <Text style={[styles.smsTitle, { color: colors.text }]}>
            Smart SMS Detection
          </Text>
          <Text style={[styles.smsDescription, { color: colors.textSecondary }]}>
            Teach the app to recognize your bank's SMS format and automatically track expenses.
          </Text>

          <View style={styles.smsStatus}>
            <View style={styles.smsStatusItem}>
              <Text style={[styles.smsStatusValue, { color: colors.text }]}>
                {smsPatternCount}
              </Text>
              <Text style={[styles.smsStatusLabel, { color: colors.textSecondary }]}>
                Patterns
              </Text>
            </View>
            <View style={[styles.smsStatusDivider, { backgroundColor: colors.border }]} />
            <View style={styles.smsStatusItem}>
              <Text
                style={[
                  styles.smsStatusValue,
                  {
                    color:
                      smsPermissionStatus === 'granted'
                        ? colors.success
                        : smsPermissionStatus === 'unavailable'
                        ? colors.textSecondary
                        : colors.warning,
                  },
                ]}
              >
                {smsPermissionStatus === 'granted'
                  ? 'Active'
                  : smsPermissionStatus === 'unavailable'
                  ? 'N/A'
                  : 'Inactive'}
              </Text>
              <Text style={[styles.smsStatusLabel, { color: colors.textSecondary }]}>
                Status
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.smsButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SmsOnboarding')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.smsButtonText}>
              {smsPatternCount > 0 ? 'Manage SMS Patterns' : 'Set Up SMS Tracking'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Notification Listener Section - Android Only */}
      {Platform.OS === 'android' && isNotificationListenerAvailable && (
        <>
          <SectionHeader title="Background Detection" />
          <Card style={[styles.section, styles.smsSection]}>
            <View style={styles.smsHeader}>
              <View style={[styles.smsBadge, { backgroundColor: notificationAccessEnabled ? colors.success : colors.warning }]}>
                <Ionicons name={notificationAccessEnabled ? "checkmark-circle" : "alert-circle"} size={16} color="#FFFFFF" />
                <Text style={styles.smsBadgeText}>
                  {notificationAccessEnabled ? 'Active' : 'Setup Required'}
                </Text>
              </View>
            </View>

            <View style={styles.smsContent}>
              <Ionicons name="notifications" size={48} color={colors.secondary} />
              <Text style={[styles.smsTitle, { color: colors.text }]}>
                Notification Listener
              </Text>
              <Text style={[styles.smsDescription, { color: colors.textSecondary }]}>
                {notificationAccessEnabled
                  ? 'BudgetOne is monitoring bank notifications in the background to detect expenses automatically.'
                  : 'Enable notification access to let BudgetOne detect bank transaction notifications in the background.'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.smsButton, 
                  { backgroundColor: notificationAccessEnabled ? colors.success : colors.secondary }
                ]}
                onPress={handleNotificationAccessPress}
              >
                <Ionicons 
                  name={notificationAccessEnabled ? "checkmark" : "key"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.smsButtonText}>
                  {notificationAccessEnabled ? 'Enabled' : 'Enable Notification Access'}
                </Text>
              </TouchableOpacity>

              {!notificationAccessEnabled && (
                <Text style={[styles.smsDescription, { color: colors.textTertiary, fontSize: FontSizes.xs, marginTop: Spacing.sm }]}>
                  Note: You'll need to enable BudgetOne in Android Settings → Notification Access
                </Text>
              )}
            </View>
          </Card>
        </>
      )}

      {/* About Section */}
      <SectionHeader title="About" />
      <Card style={[styles.section, { marginBottom: Spacing.xxl }]}>
        <ListItem
          title="About BudgetOne"
          subtitle="Version 1.0.0"
          leftIcon="information-circle"
          leftIconColor={colors.info}
          showChevron
          onPress={() => navigation.navigate('About')}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  profileSubtext: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '500',
  },
  toggleSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  smsSection: {
    padding: Spacing.md,
    overflow: 'hidden',
  },
  smsHeader: {
    alignItems: 'flex-start',
  },
  smsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  smsBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  smsContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  smsTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  smsDescription: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  smsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  smsStatusItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  smsStatusValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  smsStatusLabel: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  smsStatusDivider: {
    width: 1,
    height: 40,
  },
  smsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  smsButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});
