import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useSettings, NotificationTone } from '../context/SettingsContext';
import { Card, ListItem, SectionHeader } from '../components';
import { getAllCategories } from '../services/database';
import { notificationService } from '../services/notificationService';
import { Category } from '../models/types';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

// Tone options with descriptions
const TONE_OPTIONS: { value: NotificationTone; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'default', label: 'Default', description: 'Standard notification sound', icon: 'volume-high' },
  { value: 'short', label: 'Short', description: 'Quick, subtle sound', icon: 'volume-medium' },
  { value: 'long', label: 'Long', description: 'Extended notification sound', icon: 'musical-notes' },
  { value: 'silent', label: 'Silent', description: 'No sound, visual only', icon: 'volume-mute' },
];

export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const { notifications, setNotifications } = useSettings();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data.filter(c => !c.isArchived));
      // Update notification service with category cache
      notificationService.updateCategoryCache(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSmsNotification = (value: boolean) => {
    setNotifications({ ...notifications, smsDetectionEnabled: value });
  };

  const handleToggleDailySummary = (value: boolean) => {
    setNotifications({ ...notifications, dailySummaryEnabled: value });
  };

  const handleToggleVibration = (value: boolean) => {
    setNotifications({ ...notifications, vibrationEnabled: value });
    // Re-initialize notification service with new settings
    notificationService.setCustomization({ vibrationEnabled: value });
  };

  const handleToggleShowMerchant = (value: boolean) => {
    setNotifications({ ...notifications, showMerchantInNotification: value });
    notificationService.setCustomization({ showMerchantInNotification: value });
  };

  const handleToggleAutoExpand = (value: boolean) => {
    setNotifications({ ...notifications, autoExpandNotification: value });
    notificationService.setCustomization({ autoExpandNotification: value });
  };

  const handleToneSelect = (tone: NotificationTone) => {
    setNotifications({ ...notifications, notificationTone: tone });
    notificationService.setCustomization({ tone });
  };

  const handleQuickPickCategorySelect = (categoryId: string) => {
    if (editingSlot === null) return;

    const newQuickPicks = [...notifications.quickPickCategories];
    
    // Check if category is already in another slot
    const existingIndex = newQuickPicks.indexOf(categoryId);
    if (existingIndex !== -1 && existingIndex !== editingSlot) {
      // Swap the categories
      newQuickPicks[existingIndex] = newQuickPicks[editingSlot];
    }
    
    newQuickPicks[editingSlot] = categoryId;
    
    setNotifications({ ...notifications, quickPickCategories: newQuickPicks });
    notificationService.setCustomization({ quickPickCategories: newQuickPicks });
    setShowCategoryPicker(false);
    setEditingSlot(null);
  };

  const openCategoryPicker = (slot: number) => {
    setEditingSlot(slot);
    setShowCategoryPicker(true);
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  };

  const getCategoryIcon = (categoryId: string): string => {
    const iconMap: Record<string, string> = {
      food: '🍔',
      travel: '🚗',
      grocery: '🛒',
      shopping: '🛍️',
      bills: '📄',
      entertainment: '🎮',
      health: '💊',
      misc: '📝',
    };
    return iconMap[categoryId] || '📝';
  };

  const renderQuickPickSlot = (slot: number) => {
    const categoryId = notifications.quickPickCategories[slot];
    const category = getCategoryById(categoryId);
    const displayName = category?.name || categoryId?.charAt(0).toUpperCase() + categoryId?.slice(1) || 'Select';
    const icon = getCategoryIcon(categoryId);

    return (
      <TouchableOpacity
        key={slot}
        style={[
          styles.quickPickSlot,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => openCategoryPicker(slot)}
        accessibilityLabel={`Quick pick slot ${slot + 1}: ${displayName}`}
        accessibilityHint="Tap to change category"
      >
        <Text style={styles.quickPickIcon}>{icon}</Text>
        <Text style={[styles.quickPickName, { color: colors.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
    >
      {/* Notification Toggle Section */}
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
              Get notified when expenses are detected
            </Text>
          </View>
          <Switch
            value={notifications.smsDetectionEnabled}
            onValueChange={handleToggleSmsNotification}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.toggleRow}>
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
      </Card>

      {/* Quick Pick Categories Section */}
      <SectionHeader title="Quick Pick Categories" />
      <Card style={styles.section}>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Choose 3 categories to show in expense notifications for quick entry.
        </Text>
        <View style={styles.quickPickContainer}>
          {[0, 1, 2].map(slot => renderQuickPickSlot(slot))}
        </View>
      </Card>

      {/* Notification Sound Section */}
      <SectionHeader title="Notification Sound" />
      <Card style={styles.section}>
        {TONE_OPTIONS.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.toneOption,
              index < TONE_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
            onPress={() => handleToneSelect(option.value)}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
              <Ionicons name={option.icon} size={18} color="#FFFFFF" />
            </View>
            <View style={styles.toneContent}>
              <Text style={[styles.toneLabel, { color: colors.text }]}>{option.label}</Text>
              <Text style={[styles.toneDescription, { color: colors.textSecondary }]}>
                {option.description}
              </Text>
            </View>
            {notifications.notificationTone === option.value && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </Card>

      {/* Additional Settings Section */}
      <SectionHeader title="Additional Settings" />
      <Card style={styles.section}>
        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="phone-portrait" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.toggleContent}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Vibration</Text>
            <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
              Vibrate when notifications arrive
            </Text>
          </View>
          <Switch
            value={notifications.vibrationEnabled}
            onValueChange={handleToggleVibration}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#EC4899' }]}>
            <Ionicons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.toggleContent}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Show Merchant</Text>
            <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
              Display merchant name in notifications
            </Text>
          </View>
          <Switch
            value={notifications.showMerchantInNotification}
            onValueChange={handleToggleShowMerchant}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={[styles.iconContainer, { backgroundColor: '#06B6D4' }]}>
            <Ionicons name="expand" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.toggleContent}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Auto Expand</Text>
            <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
              Show expanded notification with actions
            </Text>
          </View>
          <Switch
            value={notifications.autoExpandNotification}
            onValueChange={handleToggleAutoExpand}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      {/* Test Notification Button */}
      <Card style={[styles.section, { marginBottom: Spacing.xl }]}>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Alert.alert(
              'Test Notification',
              'A test notification will be sent with your current settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Test',
                  onPress: async () => {
                    try {
                      await notificationService.sendExpenseNotification({
                        id: 'test-' + Date.now(),
                        amount: 299.99,
                        dateTime: new Date().toISOString(),
                        merchant: 'Test Merchant',
                        originalSmsText: 'Test SMS',
                        smsSenderId: 'TEST-BANK',
                        patternId: 'test-pattern',
                        createdAt: new Date().toISOString(),
                        status: 'pending',
                      });
                      Alert.alert('Success', 'Test notification sent!');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to send test notification.');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </Card>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <View style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                Select Category
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryPicker(false);
                  setEditingSlot(null);
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.pickerItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleQuickPickCategorySelect(category.id)}
                >
                  <View style={[styles.categoryColor, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={16} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {category.name}
                  </Text>
                  {notifications.quickPickCategories.includes(category.id) && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: 0,
  },
  sectionDescription: {
    fontSize: FontSizes.sm,
    padding: Spacing.md,
    paddingBottom: Spacing.xs,
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
  quickPickContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  quickPickSlot: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quickPickIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  quickPickName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  toneContent: {
    flex: 1,
  },
  toneLabel: {
    fontSize: FontSizes.lg,
    fontWeight: '500',
  },
  toneDescription: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    margin: Spacing.md,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  pickerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  categoryColor: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryName: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
});
