import { NativeModules, NativeEventEmitter, Platform, Linking, Alert } from 'react-native';
import { getEnabledSmsPatterns, createExpenseSuggestion } from './database';
import { notificationService } from './notificationService';
import { generateUUID } from '../utils/uuid';

// Get the native notification listener module
const NotificationListener = NativeModules.NotificationListener;

// Type definition for notification events
export interface NotificationEvent {
  packageName: string;
  title: string;
  content: string;
  timestamp: number;
}

// Type definition for the native module
interface NotificationListenerModule {
  isEnabled(): Promise<boolean>;
  openSettings(): Promise<boolean>;
  startListening(): Promise<boolean>;
  stopListening(): Promise<boolean>;
  getPendingExpenses(): Promise<PendingExpense[]>;
  clearPendingExpenses(): Promise<boolean>;
  markExpenseProcessed(id: string): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// Type definition for pending expenses stored by native code
export interface PendingExpense {
  id: string;
  amount: number;
  merchant: string;
  rawText: string;
  timestamp: number;
  processed: boolean;
}

/**
 * Notification Listener Service
 * 
 * Uses Android's NotificationListenerService to read incoming notifications
 * from banking apps and payment services. This is more reliable than SMS
 * reading on modern Android versions.
 * 
 * The user must grant notification access permission in Android settings.
 */
class NotificationListenerService {
  private eventEmitter: NativeEventEmitter | null = null;
  private subscription: any = null;
  private isListening: boolean = false;
  private onNotificationCallback: ((event: NotificationEvent) => void) | null = null;

  /**
   * Check if notification listener is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'android' && NotificationListener != null;
  }

  /**
   * Check if notification access is enabled
   */
  async isEnabled(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const module = NotificationListener as NotificationListenerModule;
      return await module.isEnabled();
    } catch (error) {
      console.error('[NotificationListenerService] Error checking enabled status:', error);
      return false;
    }
  }

  /**
   * Open Android notification access settings
   */
  async openSettings(): Promise<boolean> {
    if (!this.isAvailable()) {
      Alert.alert(
        'Not Available',
        'Notification listening is only available on Android devices.'
      );
      return false;
    }

    try {
      const module = NotificationListener as NotificationListenerModule;
      return await module.openSettings();
    } catch (error) {
      console.error('[NotificationListenerService] Error opening settings:', error);
      return false;
    }
  }

  /**
   * Request notification access permission
   * Shows an alert explaining the permission and then opens settings
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    const isAlreadyEnabled = await this.isEnabled();
    if (isAlreadyEnabled) {
      return true;
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Notification Access Required',
        'BudgetOne needs notification access to automatically detect bank transaction notifications.\n\n' +
        'In the next screen, find "BudgetOne" in the list and enable notification access.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              await this.openSettings();
              // Give user time to enable, then check again
              setTimeout(async () => {
                const enabled = await this.isEnabled();
                resolve(enabled);
              }, 2000);
            },
          },
        ]
      );
    });
  }

  /**
   * Start listening for notifications
   */
  async startListening(
    onNotification: (event: NotificationEvent) => void
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('[NotificationListenerService] Not available on this platform');
      return false;
    }

    // Check if permission is granted
    const isEnabled = await this.isEnabled();
    if (!isEnabled) {
      console.log('[NotificationListenerService] Permission not granted');
      return false;
    }

    try {
      this.onNotificationCallback = onNotification;
      
      // Create event emitter if not exists
      if (!this.eventEmitter) {
        this.eventEmitter = new NativeEventEmitter(NotificationListener);
      }

      // Subscribe to notification events
      this.subscription = this.eventEmitter.addListener(
        'onNotificationReceived',
        (event: NotificationEvent) => {
          console.log('[NotificationListenerService] Notification received:', event.title);
          this.handleNotification(event);
        }
      );

      // Tell native module to start
      const module = NotificationListener as NotificationListenerModule;
      await module.startListening();
      
      this.isListening = true;
      console.log('[NotificationListenerService] Started listening for notifications');
      return true;
    } catch (error) {
      console.error('[NotificationListenerService] Error starting listener:', error);
      return false;
    }
  }

  /**
   * Stop listening for notifications
   */
  async stopListening(): Promise<void> {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    if (this.isAvailable()) {
      try {
        const module = NotificationListener as NotificationListenerModule;
        await module.stopListening();
      } catch (error) {
        console.error('[NotificationListenerService] Error stopping listener:', error);
      }
    }

    this.isListening = false;
    this.onNotificationCallback = null;
    console.log('[NotificationListenerService] Stopped listening for notifications');
  }

  /**
   * Handle incoming notification and check against patterns
   */
  private async handleNotification(event: NotificationEvent): Promise<void> {
    // Notify callback
    if (this.onNotificationCallback) {
      this.onNotificationCallback(event);
    }

    try {
      // Get all enabled patterns
      const patterns = await getEnabledSmsPatterns();
      
      if (patterns.length === 0) {
        console.log('[NotificationListenerService] No patterns configured');
        return;
      }

      // Use notification content as SMS body for pattern matching
      const notificationText = `${event.title} ${event.content}`;
      
      // Try to match against each pattern
      for (const smsPattern of patterns) {
        const definition = smsPattern.pattern;
        
        // Try to extract amount using the pattern
        const amountMatch = notificationText.match(new RegExp(definition.amountRegex, 'i'));
        
        if (amountMatch && amountMatch[definition.amountGroup]) {
          const amountStr = amountMatch[definition.amountGroup].replace(/,/g, '');
          const amount = parseFloat(amountStr);
          
          if (!isNaN(amount) && amount > 0) {
            console.log('[NotificationListenerService] Expense detected:', amount);
            
            // Extract merchant if pattern exists
            let merchant: string | null = null;
            if (definition.merchantRegex && definition.merchantGroup) {
              const merchantMatch = notificationText.match(
                new RegExp(definition.merchantRegex, 'i')
              );
              if (merchantMatch && merchantMatch[definition.merchantGroup]) {
                merchant = merchantMatch[definition.merchantGroup].trim();
              }
            }

            // Create expense suggestion matching ExpenseSuggestion type
            const suggestion = {
              id: generateUUID(),
              amount,
              dateTime: new Date(event.timestamp).toISOString(),
              merchant: merchant,
              originalSmsText: notificationText,
              smsSenderId: event.packageName,
              patternId: smsPattern.id,
              createdAt: new Date().toISOString(),
              status: 'pending' as const,
            };
            
            await createExpenseSuggestion(suggestion);

            // Send notification to user
            await notificationService.sendExpenseNotification(suggestion);

            // Only process first matching pattern
            break;
          }
        }
      }
    } catch (error) {
      console.error('[NotificationListenerService] Error processing notification:', error);
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Get pending expenses that were detected while app was in background
   * These are stored by the native NotificationListenerService
   */
  async getPendingExpenses(): Promise<PendingExpense[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const module = NotificationListener as NotificationListenerModule;
      const expenses = await module.getPendingExpenses();
      console.log('[NotificationListenerService] Retrieved pending expenses:', expenses.length);
      return expenses;
    } catch (error) {
      console.error('[NotificationListenerService] Error getting pending expenses:', error);
      return [];
    }
  }

  /**
   * Process all pending expenses that were detected in background
   * Creates expense suggestions for each and clears the pending list
   */
  async processPendingExpenses(): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const pendingExpenses = await this.getPendingExpenses();
      let processed = 0;

      for (const expense of pendingExpenses) {
        if (expense.processed) continue;

        // Create expense suggestion from pending expense
        const suggestion = {
          id: expense.id,
          amount: expense.amount,
          dateTime: new Date(expense.timestamp).toISOString(),
          merchant: expense.merchant !== 'Unknown' ? expense.merchant : null,
          originalSmsText: expense.rawText,
          smsSenderId: 'notification',
          patternId: 'background-detection',
          createdAt: new Date().toISOString(),
          status: 'pending' as const,
        };

        await createExpenseSuggestion(suggestion);
        
        // Mark as processed in native storage
        const module = NotificationListener as NotificationListenerModule;
        await module.markExpenseProcessed(expense.id);
        
        processed++;
      }

      console.log('[NotificationListenerService] Processed', processed, 'pending expenses');
      return processed;
    } catch (error) {
      console.error('[NotificationListenerService] Error processing pending expenses:', error);
      return 0;
    }
  }

  /**
   * Clear all pending expenses from native storage
   */
  async clearPendingExpenses(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const module = NotificationListener as NotificationListenerModule;
      await module.clearPendingExpenses();
      console.log('[NotificationListenerService] Cleared pending expenses');
      return true;
    } catch (error) {
      console.error('[NotificationListenerService] Error clearing pending expenses:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationListenerService = new NotificationListenerService();
