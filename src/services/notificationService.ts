import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ExpenseSuggestion, Category } from '../models/types';
import { formatCurrency, getCurrencyByCode, DEFAULT_CURRENCY } from '../constants/currencies';
import { format } from 'date-fns';

// Notification tone types
export type NotificationTone = 'default' | 'silent' | 'short' | 'long';

// Notification customization settings
export interface NotificationCustomization {
  quickPickCategories: string[]; // Array of category IDs (max 3)
  tone: NotificationTone;
  vibrationEnabled: boolean;
  showMerchantInNotification: boolean;
  autoExpandNotification: boolean;
}

// Default notification customization
const defaultCustomization: NotificationCustomization = {
  quickPickCategories: ['food', 'travel', 'shopping'],
  tone: 'default',
  vibrationEnabled: true,
  showMerchantInNotification: true,
  autoExpandNotification: true,
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification action identifiers
export const NOTIFICATION_ACTIONS = {
  FOOD: 'category_food',
  TRAVEL: 'category_travel',
  GROCERY: 'category_grocery',
  SHOPPING: 'category_shopping',
  OTHER: 'category_other',
  VIEW: 'view_expense',
  // Dynamic category action prefix
  CATEGORY_PREFIX: 'category_',
};

// Notification channel for Android
const EXPENSE_CHANNEL_ID = 'expense_notifications';
const EXPENSE_CHANNEL_SILENT_ID = 'expense_notifications_silent';

/**
 * Notification Service
 * 
 * Handles push notifications for expense detection and daily summaries.
 * Supports quick actions for category selection directly from notifications.
 * Now with customizable quick pick categories and notification tones.
 */
class NotificationService {
  private isInitialized: boolean = false;
  private customization: NotificationCustomization = defaultCustomization;
  private categoryCache: Map<string, Category> = new Map();

  /**
   * Update notification customization settings
   */
  setCustomization(settings: Partial<NotificationCustomization>): void {
    this.customization = { ...this.customization, ...settings };
    // Re-initialize to apply new settings
    this.isInitialized = false;
  }

  /**
   * Update category cache for quick pick display
   */
  updateCategoryCache(categories: Category[]): void {
    this.categoryCache.clear();
    categories.forEach(cat => this.categoryCache.set(cat.id, cat));
  }

  /**
   * Get category emoji/icon for notification
   */
  private getCategoryIcon(categoryId: string): string {
    const iconMap: Record<string, string> = {
      food: '🍔',
      travel: '🚗',
      grocery: '🛒',
      shopping: '🛍️',
      bills: '📄',
      entertainment: '🎮',
      health: '💊',
      misc: '📝',
      other: '📝',
    };
    return iconMap[categoryId] || '📝';
  }

  /**
   * Get category name for notification
   */
  private getCategoryName(categoryId: string): string {
    const category = this.categoryCache.get(categoryId);
    if (category) return category.name;
    
    // Fallback names
    const nameMap: Record<string, string> = {
      food: 'Food',
      travel: 'Travel',
      grocery: 'Grocery',
      shopping: 'Shopping',
      bills: 'Bills',
      entertainment: 'Entertainment',
      health: 'Health',
      misc: 'Other',
    };
    return nameMap[categoryId] || categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Build notification actions from customization
    const quickPickActions = this.customization.quickPickCategories.slice(0, 3).map(categoryId => ({
      identifier: `${NOTIFICATION_ACTIONS.CATEGORY_PREFIX}${categoryId}`,
      buttonTitle: `${this.getCategoryIcon(categoryId)} ${this.getCategoryName(categoryId)}`,
      options: { opensAppToForeground: true } as const,
    }));

    // Add "Other" action if not already included
    if (!this.customization.quickPickCategories.includes('misc') && 
        !this.customization.quickPickCategories.includes('other')) {
      quickPickActions.push({
        identifier: NOTIFICATION_ACTIONS.OTHER,
        buttonTitle: '📝 Other',
        options: { opensAppToForeground: true } as const,
      });
    }

    // Set up notification categories with actions (iOS) and channel (Android)
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('expense_detected', quickPickActions);
    } else if (Platform.OS === 'android') {
      // Create main channel with sound
      await Notifications.setNotificationChannelAsync(EXPENSE_CHANNEL_ID, {
        name: 'Expense Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: this.customization.vibrationEnabled ? [0, 250, 250, 250] : [0],
        lightColor: '#4F46E5',
        sound: this.customization.tone === 'silent' ? undefined : 'default',
      });

      // Create silent channel
      await Notifications.setNotificationChannelAsync(EXPENSE_CHANNEL_SILENT_ID, {
        name: 'Expense Notifications (Silent)',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        lightColor: '#4F46E5',
        sound: undefined,
      });

      // Set up notification category with action buttons for Android
      await Notifications.setNotificationCategoryAsync('expense_detected', quickPickActions);
    }

    this.isInitialized = true;
  }

  /**
   * Send expense detection notification with customizable quick picks
   */
  async sendExpenseNotification(suggestion: ExpenseSuggestion): Promise<string> {
    await this.initialize();

    const currency = DEFAULT_CURRENCY; // TODO: Get from settings
    const formattedAmount = formatCurrency(suggestion.amount, currency);
    const formattedDate = format(new Date(suggestion.dateTime), 'dd MMM, h:mm a');

    // Build notification body based on customization
    let body = formattedAmount;
    if (this.customization.showMerchantInNotification && suggestion.merchant) {
      body += ` at ${suggestion.merchant}`;
    }
    body += ` on ${formattedDate}`;

    // Determine which channel to use based on tone setting
    const channelId = this.customization.tone === 'silent' 
      ? EXPENSE_CHANNEL_SILENT_ID 
      : EXPENSE_CHANNEL_ID;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 New expense detected',
        subtitle: this.customization.showMerchantInNotification && suggestion.merchant 
          ? suggestion.merchant 
          : undefined,
        body,
        data: {
          type: 'expense_suggestion',
          suggestionId: suggestion.id,
          amount: suggestion.amount,
          dateTime: suggestion.dateTime,
          merchant: suggestion.merchant,
          quickPickCategories: this.customization.quickPickCategories,
        },
        categoryIdentifier: 'expense_detected',
        sound: this.customization.tone === 'silent' ? false : true,
      },
      trigger: null, // Send immediately
    });

    return notificationId;
  }

  /**
   * Send daily summary notification
   */
  async sendDailySummaryNotification(
    totalAmount: number,
    transactionCount: number
  ): Promise<string> {
    await this.initialize();

    const currency = DEFAULT_CURRENCY; // TODO: Get from settings
    const formattedAmount = formatCurrency(totalAmount, currency);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Expense Summary',
        body: `You spent ${formattedAmount} across ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''} today.`,
        data: {
          type: 'daily_summary',
          totalAmount,
          transactionCount,
        },
      },
      trigger: null,
    });

    return notificationId;
  }

  /**
   * Schedule daily summary notification at a specific time
   */
  async scheduleDailySummary(hour: number = 21, minute: number = 0): Promise<string> {
    await this.initialize();

    // Cancel any existing daily summary schedules
    await this.cancelScheduledDailySummary();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Expense Summary',
        body: 'Tap to see your spending today.',
        data: { type: 'daily_summary_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return notificationId;
  }

  /**
   * Cancel scheduled daily summary
   */
  async cancelScheduledDailySummary(): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'daily_summary_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  /**
   * Add notification response listener
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Add notification received listener (foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Get the last notification response (for handling app launch from notification)
   */
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get notification permissions status
   */
  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for testing
export { NotificationService };
